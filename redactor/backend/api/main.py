"""FastAPI application for PDF Redactor."""

from __future__ import annotations

import base64
import binascii
import os
import tempfile
from contextlib import asynccontextmanager
from datetime import datetime, timezone
from typing import Any

from fastapi import Depends, FastAPI, File, Form, Header, HTTPException, Request, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from limits import parse_many
from limits.storage import MemoryStorage
from limits.strategies import MovingWindowRateLimiter

from pdf_redactor import __version__
from pdf_redactor.engine import RedactionOptions

from .errors import ErrorCode, error_response
from .logging_config import configure_logging
from .models import ApplyRequest, HealthResponse, PreviewSelection, ReadyResponse, RedactRequest, RedactResponse
from .queue import InMemoryQueue, JobQueue, JobStatus, get_queue_class

# Configuration
configure_logging()

MAX_FILE_SIZE_MB = int(os.environ.get("REDACTOR_MAX_FILE_SIZE_MB", "50"))
ENABLE_ML = os.environ.get("REDACTOR_ENABLE_ML", "false").lower() in {"1", "true", "yes"}
API_KEY = os.environ.get("REDACTOR_API_KEY")
QUEUE_BACKEND = os.environ.get("REDACTOR_QUEUE_BACKEND", "memory")
CORS_ORIGINS = os.environ.get("REDACTOR_CORS_ORIGINS", "*").split(",")
RATE_LIMIT = os.environ.get("REDACTOR_RATE_LIMIT", "10/minute")

_queue: JobQueue | None = None


@asynccontextmanager
async def lifespan(app: FastAPI):
    global _queue
    queue_cls = get_queue_class(QUEUE_BACKEND)
    if queue_cls is None:
        raise RuntimeError(f"Unknown queue backend: {QUEUE_BACKEND}")
    _queue = queue_cls()
    if hasattr(_queue, "start"):
        _queue.start()
    yield
    if _queue is not None:
        await _queue.shutdown()


app = FastAPI(
    title="PDF Redactor API",
    version=__version__,
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def _get_queue() -> JobQueue:
    if _queue is None:
        raise HTTPException(
            status_code=503,
            detail=error_response(ErrorCode.QUEUE_NOT_AVAILABLE, "Queue is not initialized"),
        )
    return _queue


def _verify_api_key(api_key: str | None) -> None:
    if not API_KEY:
        return
    if api_key != API_KEY:
        code = ErrorCode.MISSING_API_KEY if not api_key else ErrorCode.INVALID_API_KEY
        raise HTTPException(
            status_code=401,
            detail=error_response(code, "Invalid or missing API key"),
        )


def api_key_dependency(api_key: str | None = Header(None, alias="X-API-Key")) -> None:
    _verify_api_key(api_key)


# In-memory rate limiter. For multi-node deployments, switch to RedisStorage.
_rate_limit_storage = MemoryStorage()
_rate_limiter = MovingWindowRateLimiter(_rate_limit_storage)


def rate_limit(limit_string: str):
    """Return a FastAPI dependency that enforces the given rate limit string."""

    def _check(request: Request) -> None:
        items = parse_many(limit_string)
        if not items:
            return
        key = request.client.host if request.client else "unknown"
        if not _rate_limiter.hit(items[0], key, "global"):
            raise HTTPException(
                status_code=429,
                detail=error_response(ErrorCode.RATE_LIMITED, "Rate limit exceeded"),
            )

    return _check


def _safe_remove(path: str | None) -> None:
    if path and os.path.exists(path):
        try:
            os.remove(path)
        except OSError:
            pass


def _build_redaction_options(parsed_options: RedactRequest) -> RedactionOptions:
    """Convert API request options to engine options."""
    return RedactionOptions(
        detectors=parsed_options.detectors,
        ml=parsed_options.ml or ENABLE_ML,
        ml_detectors=parsed_options.ml_detectors,
        aggressive=parsed_options.aggressive,
        text=parsed_options.text,
        color=parsed_options.color,
        color_hex=parsed_options.color_hex,
        text_color=parsed_options.text_color,
        text_color_hex=parsed_options.text_color_hex,
        template=parsed_options.template,
        remove_metadata=parsed_options.remove_metadata,
        ocr=parsed_options.ocr,
        custom_masks=parsed_options.custom_masks,
        preview=parsed_options.preview,
    )


async def _wait_for_job(job_id: str, timeout: int = 60) -> Any:
    """Poll the queue for a job until it completes or fails."""
    import asyncio

    queue = _get_queue()
    start = datetime.now(timezone.utc)
    while True:
        job = await queue.get(job_id)
        if job is None:
            return None
        if job.status == JobStatus.COMPLETED:
            return job
        if job.status == JobStatus.FAILED:
            return job
        if (datetime.now(timezone.utc) - start).total_seconds() > timeout:
            await queue.cancel(job_id)
            return None
        await asyncio.sleep(0.2)


@app.get("/health", response_model=HealthResponse)
async def health() -> HealthResponse:
    return HealthResponse(status="ok")


@app.get("/ready", response_model=ReadyResponse)
async def ready() -> ReadyResponse:
    from pdf_redactor.detectors import registry
    from pdf_redactor.ml.ner import _load_spacy_model

    ml_loaded = ENABLE_ML and _load_spacy_model() is not None
    return ReadyResponse(ready=True, ml_loaded=ml_loaded, detectors=registry.names())


@app.get("/detectors")
async def detectors() -> JSONResponse:
    from pdf_redactor.detectors import registry

    return JSONResponse(content={"detectors": registry.names()})


@app.post("/jobs", response_model=None, dependencies=[Depends(api_key_dependency), Depends(rate_limit(RATE_LIMIT))])
async def create_job(
    file: UploadFile = File(...),
    options: str = Form('{"detectors":[],"ml":false}'),
) -> JSONResponse:
    queue = _get_queue()

    # Validate file extension.
    supported_exts = (".pdf", ".xlsx", ".xlsm", ".docx")
    if not file.filename or not file.filename.lower().endswith(supported_exts):
        return JSONResponse(
            status_code=400,
            content=error_response(
                ErrorCode.UNSUPPORTED_FILE_TYPE,
                f"Only PDF, XLSX, XLSM, and DOCX files are accepted. Got: {file.filename}",
                {"supported": supported_exts},
            ),
        )

    raw_bytes = await file.read()
    if len(raw_bytes) > MAX_FILE_SIZE_MB * 1024 * 1024:
        return JSONResponse(
            status_code=413,
            content=error_response(
                ErrorCode.FILE_TOO_LARGE,
                f"File exceeds {MAX_FILE_SIZE_MB} MB limit",
                {"max_size_mb": MAX_FILE_SIZE_MB},
            ),
        )

    # Validate options JSON.
    try:
        parsed_options = RedactRequest.model_validate_json(options)
    except Exception as exc:
        return JSONResponse(
            status_code=400,
            content=error_response(
                ErrorCode.INVALID_OPTIONS_JSON,
                f"Invalid options JSON: {exc}",
            ),
        )

    redaction_options = _build_redaction_options(parsed_options)

    ext = file.filename.split(".")[-1].lower() if "." in file.filename else "pdf"
    with tempfile.NamedTemporaryFile(delete=False, suffix=f"_input.{ext}") as tmp_in:
        tmp_in.write(raw_bytes)
        input_path = tmp_in.name

    output_path = input_path.replace(f"_input.{ext}", f"_redacted.{ext}")

    try:
        job_id = await queue.submit(input_path, output_path, redaction_options, original_filename=file.filename)
    except Exception as exc:
        _safe_remove(input_path)
        _safe_remove(output_path)
        raise HTTPException(
            status_code=500,
            detail=error_response(
                ErrorCode.QUEUE_NOT_AVAILABLE,
                f"Failed to queue job: {exc}",
            ),
        )

    return JSONResponse(
        status_code=202,
        content={
            "job_id": job_id,
            "status": JobStatus.QUEUED.value,
            "check_url": f"/jobs/{job_id}",
        },
    )


@app.get("/jobs/{job_id}", response_model=None, dependencies=[Depends(api_key_dependency), Depends(rate_limit("30/minute"))])
async def get_job(job_id: str) -> JSONResponse:
    queue = _get_queue()
    job = await queue.get(job_id)
    if job is None:
        return JSONResponse(
            status_code=404,
            content=error_response(ErrorCode.JOB_NOT_FOUND, f"Job {job_id} not found"),
        )

    payload = job.to_dict()

    # If completed, return the file inline and schedule cleanup.
    if job.status == JobStatus.COMPLETED and job.result:
        try:
            pdf_bytes = bytes.fromhex(job.result["pdf_base64"])
            payload["pdf_base64"] = base64.b64encode(pdf_bytes).decode("ascii")
            payload["filename"] = job.result["filename"]
            payload["report"] = job.result["report"]
        except (binascii.Error, ValueError) as exc:
            payload["error"] = {"code": ErrorCode.INTERNAL_ERROR.value, "message": str(exc)}

    return JSONResponse(content=payload)


@app.post("/jobs/{job_id}/cancel", response_model=None, dependencies=[Depends(api_key_dependency), Depends(rate_limit("10/minute"))])
async def cancel_job(job_id: str) -> JSONResponse:
    queue = _get_queue()
    job = await queue.get(job_id)
    if job is None:
        return JSONResponse(
            status_code=404,
            content=error_response(ErrorCode.JOB_NOT_FOUND, f"Job {job_id} not found"),
        )
    cancelled = await queue.cancel(job_id)
    if not cancelled:
        return JSONResponse(
            status_code=409,
            content=error_response(
                ErrorCode.JOB_CANNOT_BE_CANCELLED,
                f"Job {job_id} cannot be cancelled in status {job.status.value}",
            ),
        )
    return JSONResponse(content={"job_id": job_id, "status": JobStatus.CANCELLED.value})


@app.post("/preview", response_model=None, dependencies=[Depends(api_key_dependency), Depends(rate_limit(RATE_LIMIT))])
async def preview(
    file: UploadFile = File(...),
    options: str = Form('{"detectors":[],"ml":false}'),
) -> JSONResponse:
    """Detect sensitive content and return the original PDF + detection report."""
    queue = _get_queue()

    supported_exts = (".pdf",)
    if not file.filename or not file.filename.lower().endswith(supported_exts):
        return JSONResponse(
            status_code=400,
            content=error_response(
                ErrorCode.UNSUPPORTED_FILE_TYPE,
                f"Preview is only available for PDF files. Got: {file.filename}",
            ),
        )

    raw_bytes = await file.read()
    if len(raw_bytes) > MAX_FILE_SIZE_MB * 1024 * 1024:
        return JSONResponse(
            status_code=413,
            content=error_response(
                ErrorCode.FILE_TOO_LARGE,
                f"File exceeds {MAX_FILE_SIZE_MB} MB limit",
            ),
        )

    try:
        parsed_options = RedactRequest.model_validate_json(options)
    except Exception as exc:
        return JSONResponse(
            status_code=400,
            content=error_response(ErrorCode.INVALID_OPTIONS_JSON, f"Invalid options JSON: {exc}"),
        )

    parsed_options.preview = True
    redaction_options = _build_redaction_options(parsed_options)

    ext = file.filename.split(".")[-1].lower() if "." in file.filename else "pdf"
    with tempfile.NamedTemporaryFile(delete=False, suffix=f"_input.{ext}") as tmp_in:
        tmp_in.write(raw_bytes)
        input_path = tmp_in.name

    output_path = input_path.replace(f"_input.{ext}", f"_redacted.{ext}")

    try:
        job_id = await queue.submit(
            input_path,
            output_path,
            redaction_options,
            original_filename=file.filename,
            mode="preview",
            original_options=parsed_options.model_dump(),
        )
    except Exception as exc:
        _safe_remove(input_path)
        _safe_remove(output_path)
        raise HTTPException(
            status_code=500,
            detail=error_response(ErrorCode.QUEUE_NOT_AVAILABLE, f"Failed to queue job: {exc}"),
        )

    job = await _wait_for_job(job_id)
    if job is None:
        _safe_remove(output_path)
        return JSONResponse(
            status_code=504,
            content=error_response(ErrorCode.REDACTION_FAILED, "Preview timed out"),
        )
    if job.status == JobStatus.FAILED:
        _safe_remove(output_path)
        return JSONResponse(
            status_code=500,
            content=error_response(
                ErrorCode.REDACTION_FAILED,
                job.error.get("message", "Unknown preview error") if job.error else "Unknown error",
                job.error,
            ),
        )

    try:
        pdf_bytes = bytes.fromhex(job.result["pdf_base64"])
        encoded = base64.b64encode(pdf_bytes).decode("ascii")
        _safe_remove(output_path)
        return JSONResponse(
            content={
                "job_id": job_id,
                "original_pdf_base64": encoded,
                "report": job.result["report"],
            }
        )
    except Exception as exc:
        _safe_remove(output_path)
        return JSONResponse(
            status_code=500,
            content=error_response(ErrorCode.INTERNAL_ERROR, str(exc)),
        )


@app.post("/apply/{job_id}", response_model=None, dependencies=[Depends(api_key_dependency), Depends(rate_limit("30/minute"))])
async def apply(
    job_id: str,
    request: ApplyRequest,
) -> JSONResponse:
    """Apply a curated set of redactions to a previously uploaded preview PDF."""
    queue = _get_queue()
    job = await queue.get(job_id)
    if job is None:
        return JSONResponse(
            status_code=404,
            content=error_response(ErrorCode.JOB_NOT_FOUND, f"Job {job_id} not found"),
        )
    if job.mode != "preview":
        return JSONResponse(
            status_code=400,
            content=error_response(ErrorCode.INVALID_OPTIONS_JSON, f"Job {job_id} is not a preview job"),
        )
    if job.status != JobStatus.COMPLETED:
        return JSONResponse(
            status_code=409,
            content=error_response(ErrorCode.JOB_CANNOT_BE_CANCELLED, "Preview job is not ready yet"),
        )
    if not job.input_path or not os.path.exists(job.input_path):
        return JSONResponse(
            status_code=410,
            content=error_response(ErrorCode.INTERNAL_ERROR, "Preview file has expired"),
        )

    redaction_options = _build_redaction_options(request.options)
    output_path = job.input_path.replace("_input.", "_redacted.")

    try:
        apply_job_id = await queue.submit(
            job.input_path,
            output_path,
            redaction_options,
            original_filename=job.result.get("filename") if job.result else None,
            mode="apply",
            selections=[sel.model_dump() for sel in request.selections],
        )
    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail=error_response(ErrorCode.QUEUE_NOT_AVAILABLE, f"Failed to queue apply job: {exc}"),
        )

    apply_job = await _wait_for_job(apply_job_id)
    if apply_job is None:
        return JSONResponse(
            status_code=504,
            content=error_response(ErrorCode.REDACTION_FAILED, "Apply timed out"),
        )
    if apply_job.status == JobStatus.FAILED:
        return JSONResponse(
            status_code=500,
            content=error_response(
                ErrorCode.REDACTION_FAILED,
                apply_job.error.get("message", "Unknown apply error") if apply_job.error else "Unknown error",
                apply_job.error,
            ),
        )

    try:
        pdf_bytes = bytes.fromhex(apply_job.result["pdf_base64"])
        encoded = base64.b64encode(pdf_bytes).decode("ascii")
        return JSONResponse(
            content={
                "filename": apply_job.result["filename"],
                "pdf_base64": encoded,
                "report": apply_job.result["report"],
            }
        )
    except Exception as exc:
        return JSONResponse(
            status_code=500,
            content=error_response(ErrorCode.INTERNAL_ERROR, str(exc)),
        )


@app.post("/redact", response_model=None, dependencies=[Depends(api_key_dependency), Depends(rate_limit(RATE_LIMIT))])
async def redact_sync(
    file: UploadFile = File(...),
    options: str = Form('{"detectors":[],"ml":false}'),
) -> JSONResponse:
    """Synchronous redaction for simple use cases. Returns the file directly."""
    queue = _get_queue()

    supported_exts = (".pdf", ".xlsx", ".xlsm", ".docx")
    if not file.filename or not file.filename.lower().endswith(supported_exts):
        return JSONResponse(
            status_code=400,
            content=error_response(
                ErrorCode.UNSUPPORTED_FILE_TYPE,
                f"Only PDF, XLSX, XLSM, and DOCX files are accepted. Got: {file.filename}",
            ),
        )

    raw_bytes = await file.read()
    if len(raw_bytes) > MAX_FILE_SIZE_MB * 1024 * 1024:
        return JSONResponse(
            status_code=413,
            content=error_response(
                ErrorCode.FILE_TOO_LARGE,
                f"File exceeds {MAX_FILE_SIZE_MB} MB limit",
            ),
        )

    try:
        parsed_options = RedactRequest.model_validate_json(options)
    except Exception as exc:
        return JSONResponse(
            status_code=400,
            content=error_response(ErrorCode.INVALID_OPTIONS_JSON, f"Invalid options JSON: {exc}"),
        )

    redaction_options = _build_redaction_options(parsed_options)

    ext = file.filename.split(".")[-1].lower() if "." in file.filename else "pdf"
    with tempfile.NamedTemporaryFile(delete=False, suffix=f"_input.{ext}") as tmp_in:
        tmp_in.write(raw_bytes)
        input_path = tmp_in.name

    output_path = input_path.replace(f"_input.{ext}", f"_redacted.{ext}")

    try:
        job_id = await queue.submit(input_path, output_path, redaction_options, original_filename=file.filename)
    except Exception as exc:
        _safe_remove(input_path)
        _safe_remove(output_path)
        raise HTTPException(
            status_code=500,
            detail=error_response(ErrorCode.QUEUE_NOT_AVAILABLE, f"Failed to queue job: {exc}"),
        )

    job = await _wait_for_job(job_id)
    if job is None:
        _safe_remove(output_path)
        return JSONResponse(
            status_code=504,
            content=error_response(ErrorCode.REDACTION_FAILED, "Redaction timed out"),
        )
    if job.status == JobStatus.FAILED:
        _safe_remove(output_path)
        return JSONResponse(
            status_code=500,
            content=error_response(
                ErrorCode.REDACTION_FAILED,
                job.error.get("message", "Unknown redaction error") if job.error else "Unknown error",
                job.error,
            ),
        )

    try:
        pdf_bytes = bytes.fromhex(job.result["pdf_base64"])
        encoded = base64.b64encode(pdf_bytes).decode("ascii")
        _safe_remove(output_path)
        return JSONResponse(
            content={
                "filename": job.result["filename"],
                "pdf_base64": encoded,
                "report": job.result["report"],
            }
        )
    except Exception as exc:
        _safe_remove(output_path)
        return JSONResponse(
            status_code=500,
            content=error_response(ErrorCode.INTERNAL_ERROR, str(exc)),
        )
