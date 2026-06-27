"""Pydantic models for the FastAPI backend."""

from __future__ import annotations

from typing import Any

from pydantic import BaseModel, Field, field_validator


class RedactRequest(BaseModel):
    detectors: list[str] = Field(default_factory=list)
    ml: bool = False
    ml_detectors: list[str] = Field(default_factory=lambda: ["name", "address"])
    aggressive: bool = False
    text: str | None = None
    color: str = "black"
    color_hex: str | None = None
    text_color: str = "white"
    text_color_hex: str | None = None
    report_format: str = "json"
    template: str | None = None
    remove_metadata: bool = False
    ocr: bool = False
    custom_masks: list[str] = Field(default_factory=list)
    preview: bool = False

    @field_validator("report_format")
    @classmethod
    def validate_report_format(cls, v: str) -> str:
        if v not in {"json", "none"}:
            raise ValueError("report_format must be 'json' or 'none'")
        return v

    @field_validator("template")
    @classmethod
    def validate_template(cls, v: str | None) -> str | None:
        from pdf_redactor.engine import RedactionOptions

        if v is not None and v not in RedactionOptions.TEMPLATES:
            raise ValueError(f"template must be one of {list(RedactionOptions.TEMPLATES.keys())}")
        return v


class PreviewSelection(BaseModel):
    """A single redaction selection sent from the preview UI."""

    page: int
    rects: list[tuple[float, float, float, float]]
    detector: str | None = None
    text: str | None = None
    confidence: str = "high"

    @field_validator("confidence")
    @classmethod
    def validate_confidence(cls, v: str) -> str:
        if v not in {"high", "medium", "low"}:
            raise ValueError("confidence must be 'high', 'medium', or 'low'")
        return v


class ApplyRequest(BaseModel):
    """Request body for applying a curated set of redactions."""

    selections: list[PreviewSelection]
    options: RedactRequest


class RedactResponse(BaseModel):
    filename: str
    report: dict[str, Any]


class HealthResponse(BaseModel):
    status: str


class ReadyResponse(BaseModel):
    ready: bool
    ml_loaded: bool
    detectors: list[str]
