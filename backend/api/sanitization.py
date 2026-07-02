"""Input sanitization helpers for the Redactor API.

These functions normalize and bound user-supplied data before it reaches the
redaction engine. They are intentionally conservative: reject or truncate rather
than guess.
"""

from __future__ import annotations

import re
import unicodedata
from typing import Any

from pdf_redactor.engine import RedactionOptions

MAX_FILENAME_LENGTH = 255
MAX_MASK_COUNT = 100
MAX_MASK_LENGTH = 500
MAX_TEXT_OVERLAY_LENGTH = 100
MAX_DETECTOR_SELECTIONS = 50
MAX_JOB_ID_LENGTH = 64

# Allowed file extensions and their expected content types.
ALLOWED_EXTENSIONS = {
    ".pdf": {"application/pdf", "application/octet-stream"},
    ".xlsx": {
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "application/octet-stream",
    },
    ".xlsm": {
        "application/vnd.ms-excel.sheet.macroenabled.12",
        "application/octet-stream",
    },
    ".docx": {
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "application/octet-stream",
    },
}

VALID_DETECTORS = frozenset(RedactionOptions.TEMPLATE_DETECTORS)
VALID_TEMPLATES = frozenset(RedactionOptions.TEMPLATES.keys())
VALID_CONFIDENCE = frozenset({"high", "medium", "low"})
VALID_REPORT_FORMATS = frozenset({"json", "none"})


def sanitize_selections(selections: list[dict[str, Any]]) -> list[dict[str, Any]]:
    """Clean and bound redaction selections from the apply endpoint."""
    cleaned: list[dict[str, Any]] = []
    for sel in selections:
        if not isinstance(sel, dict):
            continue

        page = sel.get("page", 1)
        try:
            page = max(1, int(page))
        except (ValueError, TypeError):
            page = 1

        rects: list[tuple[float, float, float, float]] = []
        for rect in sel.get("rects", []):
            if not isinstance(rect, (list, tuple)) or len(rect) != 4:
                continue
            try:
                coords = tuple(float(v) for v in rect)
            except (ValueError, TypeError):
                continue
            rects.append(coords)

        detector = sel.get("detector")
        if isinstance(detector, str):
            detector = re.sub(r"[^a-zA-Z0-9_\-]", "", detector)[:64] or None
        else:
            detector = None

        text = sel.get("text")
        if isinstance(text, str):
            text = "".join(
                ch for ch in text if unicodedata.category(ch)[0] != "C"
            )[:500] or None
        else:
            text = None

        confidence = sel.get("confidence", "high")
        confidence = confidence if confidence in VALID_CONFIDENCE else "high"

        cleaned.append(
            {
                "page": page,
                "rects": rects,
                "detector": detector,
                "text": text,
                "confidence": confidence,
            }
        )
    return cleaned

# Safe characters for a displayed filename: alphanumerics, spaces, and a small
# set of punctuation marks. Path separators and control characters are removed.
_FILENAME_RE = re.compile(r"[^\w\s\-\._()\[\]]+")


def _strip_control_chars(value: str) -> str:
    """Remove Unicode control characters while preserving printable text."""
    return "".join(
        ch
        for ch in value
        if unicodedata.category(ch)[0] != "C" or ch in {"\t", "\n", "\r"}
    )


def sanitize_filename(filename: str | None) -> str:
    """Return a safe filename with no path traversal and bounded length."""
    if not filename:
        return "unnamed"

    # Normalize to NFKC to break down compatibility characters.
    normalized = unicodedata.normalize("NFKC", filename)

    # Strip any directory path attempts and collapse whitespace.
    basename = normalized.replace("\\", "/").split("/")[-1].strip()
    basename = re.sub(r"\s+", " ", basename)

    # Remove dangerous/control characters.
    basename = _strip_control_chars(basename)
    basename = _FILENAME_RE.sub("", basename)

    # Collapse multiple dots to avoid hidden file / extension trickery.
    basename = re.sub(r"\.{2,}", ".", basename)

    if not basename or basename in {".", ".."}:
        return "unnamed"

    if len(basename) > MAX_FILENAME_LENGTH:
        name, ext = _split_extension(basename)
        basename = name[: MAX_FILENAME_LENGTH - len(ext)] + ext

    return basename


def _split_extension(filename: str) -> tuple[str, str]:
    """Split a filename into (stem, extension), keeping the last valid extension."""
    lower = filename.lower()
    for ext in sorted(ALLOWED_EXTENSIONS, key=len, reverse=True):
        if lower.endswith(ext):
            return filename[: -len(ext)], filename[-len(ext) :]
    return filename, ""


def validate_file_extension(filename: str) -> str | None:
    """Return the lower-case extension if allowed, otherwise None."""
    lower = filename.lower()
    for ext in ALLOWED_EXTENSIONS:
        if lower.endswith(ext):
            return ext
    return None


def validate_content_type(filename: str, content_type: str | None) -> bool:
    """Return True if the supplied Content-Type is plausible for the extension."""
    ext = validate_file_extension(filename)
    if ext is None:
        return False
    if content_type is None:
        return True
    return content_type.lower() in ALLOWED_EXTENSIONS[ext]


def sanitize_custom_masks(masks: list[str]) -> list[str]:
    """Clean and bound a list of user-supplied custom mask strings."""
    cleaned: list[str] = []
    for mask in masks:
        if not isinstance(mask, str):
            continue
        mask = _strip_control_chars(mask.strip())
        mask = re.sub(r"\s+", " ", mask)
        if mask:
            cleaned.append(mask[:MAX_MASK_LENGTH])
        if len(cleaned) >= MAX_MASK_COUNT:
            break
    return cleaned


def sanitize_text_overlay(text: str | None) -> str | None:
    """Clean optional overlay text with strict length limits."""
    if text is None:
        return None
    if not isinstance(text, str):
        return None
    text = _strip_control_chars(text.strip())
    text = re.sub(r"\s+", " ", text)
    if not text:
        return None
    return text[:MAX_TEXT_OVERLAY_LENGTH]


def sanitize_detectors(detectors: list[str]) -> list[str]:
    """Filter detector IDs to the set known by the engine."""
    if not isinstance(detectors, list):
        return []
    seen = set()
    result: list[str] = []
    for det in detectors:
        if isinstance(det, str) and det in VALID_DETECTORS and det not in seen:
            seen.add(det)
            result.append(det)
        if len(result) >= MAX_DETECTOR_SELECTIONS:
            break
    return result


def sanitize_ml_detectors(detectors: list[str]) -> list[str]:
    """Filter ML detector IDs to the supported subset."""
    if not isinstance(detectors, list):
        return []
    allowed = {"name", "address"}
    seen = set()
    result: list[str] = []
    for det in detectors:
        if isinstance(det, str) and det in allowed and det not in seen:
            seen.add(det)
            result.append(det)
    return result


def sanitize_options(options: dict[str, Any]) -> dict[str, Any]:
    """Normalize and bound a raw options dictionary from the client.

    The output is safe to pass into RedactRequest.model_validate().
    """
    if not isinstance(options, dict):
        options = {}

    sanitized: dict[str, Any] = {}

    # Booleans with explicit defaults.
    for key, default in (
        ("ml", False),
        ("aggressive", False),
        ("remove_metadata", False),
        ("ocr", False),
        ("preview", False),
    ):
        value = options.get(key)
        if isinstance(value, bool):
            sanitized[key] = value
        elif isinstance(value, str):
            sanitized[key] = value.lower() in {"true", "1", "yes"}
        else:
            sanitized[key] = default

    # Detectors.
    sanitized["detectors"] = sanitize_detectors(options.get("detectors", []))

    # ML detectors.
    sanitized["ml_detectors"] = sanitize_ml_detectors(
        options.get("ml_detectors", ["name", "address"])
    )

    # Text overlay.
    sanitized["text"] = sanitize_text_overlay(options.get("text"))

    # Color names / hex codes: restrict to simple strings, fall back to defaults.
    color_defaults = {
        "color": "black",
        "color_hex": None,
        "text_color": "white",
        "text_color_hex": None,
    }
    for key, default in color_defaults.items():
        value = options.get(key)
        if isinstance(value, str):
            value = _strip_control_chars(value.strip())
            value = re.sub(r"[^a-zA-Z0-9#\-]", "", value)
            sanitized[key] = value[:32] or default
        else:
            sanitized[key] = default

    # Report format.
    report_format = options.get("report_format", "json")
    sanitized["report_format"] = (
        report_format if isinstance(report_format, str) and report_format in VALID_REPORT_FORMATS else "json"
    )

    # Template.
    template = options.get("template")
    if isinstance(template, str):
        template = _strip_control_chars(template.strip().lower())
        template = template if template in VALID_TEMPLATES else None
    else:
        template = None
    sanitized["template"] = template

    # Custom masks.
    masks = options.get("custom_masks", [])
    sanitized["custom_masks"] = sanitize_custom_masks(masks if isinstance(masks, list) else [])

    return sanitized


def sanitize_job_id(job_id: str | None) -> str | None:
    """Return a cleaned job ID or None if it looks invalid."""
    if not isinstance(job_id, str) or not job_id:
        return None
    job_id = re.sub(r"[^a-zA-Z0-9_\-]", "", job_id)
    if not job_id or len(job_id) > MAX_JOB_ID_LENGTH:
        return None
    return job_id
