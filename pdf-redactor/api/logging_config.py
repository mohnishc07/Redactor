"""Structured logging configuration."""

from __future__ import annotations

import logging
import os
import sys

LOG_LEVEL = os.environ.get("REDACTOR_LOG_LEVEL", "INFO").upper()


def configure_logging() -> None:
    """Set up JSON-like structured logging for the API."""
    fmt = (
        "%(asctime)s | %(levelname)s | %(name)s | "
        "%(message)s"
    )
    logging.basicConfig(
        level=getattr(logging, LOG_LEVEL, logging.INFO),
        format=fmt,
        stream=sys.stdout,
    )

    # Reduce noise from third-party libraries.
    logging.getLogger("uvicorn.access").setLevel(logging.WARNING)
    logging.getLogger("pymupdf").setLevel(logging.WARNING)
