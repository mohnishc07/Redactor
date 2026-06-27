"""Base job queue definitions."""

from __future__ import annotations

import uuid
from dataclasses import dataclass, field
from datetime import datetime
from enum import Enum
from typing import Any, Protocol


class JobStatus(str, Enum):
    QUEUED = "queued"
    RUNNING = "running"
    COMPLETED = "completed"
    FAILED = "failed"
    CANCELLED = "cancelled"


@dataclass
class Job:
    id: str = field(default_factory=lambda: str(uuid.uuid4()))
    status: JobStatus = JobStatus.QUEUED
    created_at: datetime = field(default_factory=datetime.utcnow)
    started_at: datetime | None = None
    finished_at: datetime | None = None
    result: dict[str, Any] | None = None
    error: dict[str, Any] | None = None
    progress: int = 0  # 0-100
    mode: str = "redact"  # "redact" | "preview"
    input_path: str | None = None
    original_options: dict[str, Any] | None = None

    def to_dict(self) -> dict[str, Any]:
        return {
            "id": self.id,
            "status": self.status.value,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "started_at": self.started_at.isoformat() if self.started_at else None,
            "finished_at": self.finished_at.isoformat() if self.finished_at else None,
            "result": self.result,
            "error": self.error,
            "progress": self.progress,
            "mode": self.mode,
        }


class JobQueue(Protocol):
    async def submit(
        self,
        input_path: str,
        output_path: str,
        options: Any,
        original_filename: str | None = None,
        mode: str = "redact",
        original_options: dict[str, Any] | None = None,
        selections: list[dict[str, Any]] | None = None,
    ) -> str:
        """Submit a job and return its ID."""
        ...

    async def get(self, job_id: str) -> Job | None:
        """Get job status."""
        ...

    async def cancel(self, job_id: str) -> bool:
        """Cancel a queued/running job."""
        ...

    async def shutdown(self) -> None:
        ...


_queue_registry: dict[str, type[JobQueue]] = {}


def register_queue(name: str):
    def decorator(cls: type[JobQueue]) -> type[JobQueue]:
        _queue_registry[name] = cls
        return cls
    return decorator


def get_queue_class(name: str) -> type[JobQueue] | None:
    return _queue_registry.get(name)
