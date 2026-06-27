"""In-memory job queue backed by ProcessPoolExecutor."""

from __future__ import annotations

import asyncio
import logging
import os
from concurrent.futures import ProcessPoolExecutor
from datetime import datetime
from typing import Any

import pymupdf as fitz

from pdf_redactor.engine import RedactionEngine, RedactionOptions
from pdf_redactor.processors.pdf import PDFProcessor

from .base import Job, JobQueue, JobStatus, register_queue

logger = logging.getLogger(__name__)


def _run_redaction(
    input_path: str,
    output_path: str,
    options_dict: dict[str, Any],
    job_id: str,
    original_filename: str | None = None,
) -> dict[str, Any]:
    """Worker function executed in a separate process."""
    try:
        options = RedactionOptions.from_dict(options_dict)
        engine = RedactionEngine()
        report = engine.process(input_path, output_path, options)
        with open(output_path, "rb") as f:
            pdf_bytes = f.read()
        ext = output_path.split(".")[-1]
        redacted_name = f"redacted_{original_filename}" if original_filename else os.path.basename(output_path)
        return {
            "filename": redacted_name,
            "pdf_base64": pdf_bytes.hex(),  # hex is safer than base64 for JSON
            "report": report.to_dict(),
        }
    except Exception as exc:
        logger.exception("Job %s failed in worker", job_id)
        raise
    finally:
        # Clean up input temp file; output is read by parent before cleanup.
        try:
            if os.path.exists(input_path):
                os.remove(input_path)
        except OSError:
            pass


def _run_preview(
    input_path: str,
    _output_path: str,
    options_dict: dict[str, Any],
    job_id: str,
    original_filename: str | None = None,
) -> dict[str, Any]:
    """Worker that detects only and returns the original PDF bytes + report."""
    try:
        options = RedactionOptions.from_dict(options_dict)
        engine = RedactionEngine()
        # Provide a dummy output path; the preview branch does not write it.
        report = engine.process(input_path, _output_path, options)
        with open(input_path, "rb") as f:
            pdf_bytes = f.read()
        return {
            "pdf_base64": pdf_bytes.hex(),
            "report": report.to_dict(),
        }
    except Exception as exc:
        logger.exception("Preview job %s failed in worker", job_id)
        raise
    # Input file is intentionally NOT deleted; /apply will use it.


def _run_apply(
    input_path: str,
    _output_path: str,
    options_dict: dict[str, Any],
    selections: list[dict[str, Any]],
    job_id: str,
    original_filename: str | None = None,
) -> dict[str, Any]:
    """Worker that applies a curated selection of redactions."""
    output_path = input_path.replace("_input.", "_redacted.")
    try:
        options = RedactionOptions.from_dict(options_dict)
        engine = RedactionEngine()
        processor = PDFProcessor(engine, options)
        report = processor.apply_selections(input_path, output_path, selections)
        with open(output_path, "rb") as f:
            pdf_bytes = f.read()
        ext = output_path.split(".")[-1]
        redacted_name = f"redacted_{original_filename}" if original_filename else os.path.basename(output_path)
        return {
            "filename": redacted_name,
            "pdf_base64": pdf_bytes.hex(),
            "report": report.to_dict(),
        }
    except Exception as exc:
        logger.exception("Apply job %s failed in worker", job_id)
        raise
    finally:
        try:
            if os.path.exists(output_path):
                os.remove(output_path)
            if os.path.exists(input_path):
                os.remove(input_path)
        except OSError:
            pass


@register_queue("memory")
class InMemoryQueue:
    """Process-pool queue with job status tracking."""

    def __init__(self, max_workers: int | None = None):
        self.max_workers = max_workers or int(
            os.environ.get("REDACTOR_MAX_WORKERS", os.cpu_count() or 2)
        )
        self._executor: ProcessPoolExecutor | None = None
        self._jobs: dict[str, Job] = {}
        self._futures: dict[Any, Any] = {}

    def start(self) -> None:
        if self._executor is None:
            self._executor = ProcessPoolExecutor(max_workers=self.max_workers)
            logger.info("Started in-memory job queue with %s workers", self.max_workers)

    async def shutdown(self) -> None:
        # Best-effort cleanup of any preview input files left behind.
        for job in list(self._jobs.values()):
            if job.mode == "preview" and job.input_path and os.path.exists(job.input_path):
                try:
                    os.remove(job.input_path)
                except OSError:
                    pass
        if self._executor is not None:
            self._executor.shutdown(wait=True)
            self._executor = None

    async def submit(
        self,
        input_path: str,
        output_path: str,
        options: RedactionOptions,
        original_filename: str | None = None,
        mode: str = "redact",
        original_options: dict[str, Any] | None = None,
        selections: list[dict[str, Any]] | None = None,
    ) -> str:
        self.start()
        job = Job()
        job.mode = mode
        job.input_path = input_path if mode in {"preview", "apply"} else None
        job.original_options = original_options
        self._jobs[job.id] = job

        ext = input_path.split(".")[-1].lower() if "." in input_path else "pdf"
        if not original_filename:
            original_filename = os.path.basename(input_path).replace(f"_input.{ext}", f".{ext}")

        if mode == "preview":
            worker = _run_preview
            args = (input_path, output_path, options.__dict__, job.id, original_filename)
        elif mode == "apply":
            worker = _run_apply
            args = (
                input_path,
                output_path,
                options.__dict__,
                selections or [],
                job.id,
                original_filename,
            )
        else:
            worker = _run_redaction
            args = (input_path, output_path, options.__dict__, job.id, original_filename)

        loop = asyncio.get_running_loop()
        future = loop.run_in_executor(self._executor, worker, *args)
        self._futures[job.id] = future

        job.status = JobStatus.QUEUED
        # As soon as a worker picks it up, executor runs it; mark running now.
        job.status = JobStatus.RUNNING
        job.started_at = datetime.utcnow()

        future.add_done_callback(lambda fut, jid=job.id: self._on_done(fut, jid))
        return job.id

    def _on_done(self, future, job_id: str) -> None:
        job = self._jobs.get(job_id)
        if job is None:
            return
        job.finished_at = datetime.utcnow()
        try:
            result = future.result()
            job.status = JobStatus.COMPLETED
            job.result = result
            job.progress = 100
            logger.info("Job %s completed", job_id)
        except Exception as exc:
            job.status = JobStatus.FAILED
            job.error = {"type": type(exc).__name__, "message": str(exc)}
            logger.error("Job %s failed: %s", job_id, exc)
        finally:
            self._futures.pop(job_id, None)

    async def get(self, job_id: str) -> Job | None:
        return self._jobs.get(job_id)

    async def cancel(self, job_id: str) -> bool:
        job = self._jobs.get(job_id)
        future = self._futures.get(job_id)
        if job is None:
            return False
        if job.status in {JobStatus.COMPLETED, JobStatus.FAILED, JobStatus.CANCELLED}:
            return False
        if future and not future.done():
            future.cancel()
        job.status = JobStatus.CANCELLED
        job.finished_at = datetime.utcnow()
        logger.info("Job %s cancelled", job_id)
        return True
