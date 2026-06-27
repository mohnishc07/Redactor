"""Structured error codes and responses."""

from __future__ import annotations

from enum import Enum
from typing import Any


class ErrorCode(str, Enum):
    """Stable error codes the frontend can rely on."""

    # Client errors (4xx)
    BAD_REQUEST = "BAD_REQUEST"
    UNSUPPORTED_FILE_TYPE = "UNSUPPORTED_FILE_TYPE"
    FILE_TOO_LARGE = "FILE_TOO_LARGE"
    INVALID_OPTIONS_JSON = "INVALID_OPTIONS_JSON"
    UNKNOWN_TEMPLATE = "UNKNOWN_TEMPLATE"
    MISSING_API_KEY = "MISSING_API_KEY"
    INVALID_API_KEY = "INVALID_API_KEY"
    JOB_NOT_FOUND = "JOB_NOT_FOUND"
    JOB_CANNOT_BE_CANCELLED = "JOB_CANNOT_BE_CANCELLED"
    RATE_LIMITED = "RATE_LIMITED"

    # Server errors (5xx)
    REDACTION_FAILED = "REDACTION_FAILED"
    QUEUE_NOT_AVAILABLE = "QUEUE_NOT_AVAILABLE"
    INTERNAL_ERROR = "INTERNAL_ERROR"


def error_response(code: ErrorCode, message: str, details: dict[str, Any] | None = None) -> dict[str, Any]:
    payload = {"error": {"code": code.value, "message": message}}
    if details:
        payload["error"]["details"] = details
    return payload
