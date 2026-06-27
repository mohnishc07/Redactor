"""Redis/RQ-backed job queue for production deployments."""

from __future__ import annotations

import os
from datetime import datetime
from typing import Any

from pdf_redactor.engine import RedactionOptions

from .base import Job, JobQueue, JobStatus, register_queue


def _run_redaction_rq(
    input_path: str,
    output_path: str,
    options_dict: dict[str, Any],
    job_id: str,
    original_filename: str | None,
) -> dict[str, Any]:
    """Worker function executed by an RQ worker process."""
    import logging

    from pdf_redactor.engine import RedactionEngine

    logger = logging.getLogger(__name__)
    try:
        options = RedactionOptions.from_dict(options_dict)
        engine = RedactionEngine()
        report = engine.process(input_path, output_path, options)
        with open(output_path, "rb") as f:
            file_bytes = f.read()
        ext = output_path.split(".")[-1]
        redacted_name = (
            f"redacted_{original_filename}"
            if original_filename
            else f"redacted.{ext}"
        )
        return {
            "filename": redacted_name,
            "pdf_base64": file_bytes.hex(),
            "report": report.to_dict(),
        }
    except Exception:
        logger.exception("RQ job %s failed", job_id)
        raise
    finally:
        try:
            if os.path.exists(input_path):
                os.remove(input_path)
        except OSError:
            pass


@register_queue("rq")
class RQQueue(JobQueue):
    """Redis/RQ-backed queue. Requires a separate RQ worker process."""

    def __init__(self):
        import redis
        from rq import Queue

        redis_url = os.environ.get("REDIS_URL", "redis://localhost:6379/0")
        conn = redis.from_url(redis_url)
        self._queue = Queue("redactor", connection=conn)
        self._jobs: dict[str, Job] = {}

    def start(self) -> None:
        pass

    async def shutdown(self) -> None:
        pass

    async def submit(
        self,
        input_path: str,
        output_path: str,
        options: RedactionOptions,
        original_filename: str | None = None,
    ) -> str:
        job = Job()
        self._jobs[job.id] = job

        rq_job = self._queue.enqueue(
            _run_redaction_rq,
            input_path,
            output_path,
            options.__dict__,
            job.id,
            original_filename,
            job_id=job.id,
            job_timeout=int(os.environ.get("REDACTOR_JOB_TIMEOUT_SECONDS", "300")),
            result_ttl=3600,
        )
        job.meta = {"rq_job_id": rq_job.id}
        return job.id

    async def get(self, job_id: str) -> Job | None:
        job = self._jobs.get(job_id)
        if job is None:
            return None
        if job.status in {JobStatus.COMPLETED, JobStatus.FAILED, JobStatus.CANCELLED}:
            return job

        from rq.job import Job as RQJob

        rq_job_id = job.meta.get("rq_job_id") if job.meta else None
        if not rq_job_id:
            return job

        try:
            rq_job = RQJob.fetch(rq_job_id, connection=self._queue.connection)
        except Exception:
            return job

        if rq_job.is_finished:
            job.status = JobStatus.COMPLETED
            job.finished_at = datetime.utcnow()
            job.result = rq_job.result
            job.progress = 100
        elif rq_job.is_failed:
            job.status = JobStatus.FAILED
            job.finished_at = datetime.utcnow()
            exc_info = rq_job.exc_info or "Unknown error"
            job.error = {"type": "RQJobFailed", "message": exc_info.split("\n")[-1]}
        elif rq_job.is_started:
            job.status = JobStatus.RUNNING
            job.started_at = datetime.utcnow()
        return job

    async def cancel(self, job_id: str) -> bool:
        job = self._jobs.get(job_id)
        if job is None:
            return False
        if job.status in {JobStatus.COMPLETED, JobStatus.FAILED, JobStatus.CANCELLED}:
            return False

        from rq.job import Job as RQJob

        rq_job_id = job.meta.get("rq_job_id") if job.meta else None
        if rq_job_id:
            try:
                rq_job = RQJob.fetch(rq_job_id, connection=self._queue.connection)
                rq_job.cancel()
                rq_job.delete()
            except Exception:
                pass
        job.status = JobStatus.CANCELLED
        job.finished_at = datetime.utcnow()
        return True
