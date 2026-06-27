"""Job queue abstraction for async redaction tasks."""

from .base import Job, JobQueue, JobStatus, get_queue_class, register_queue
from .memory import InMemoryQueue

try:
    from .rq_queue import RQQueue
except Exception:  # noqa: BLE001
    RQQueue = None  # type: ignore

__all__ = ["Job", "JobQueue", "JobStatus", "InMemoryQueue", "get_queue_class", "register_queue"]
if RQQueue is not None:
    __all__.append("RQQueue")
