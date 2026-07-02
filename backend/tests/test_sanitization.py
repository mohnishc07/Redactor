"""Tests for API input sanitization helpers."""

from pathlib import Path
import sys

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

import pytest

from api.sanitization import (
    ALLOWED_EXTENSIONS,
    sanitize_custom_masks,
    sanitize_filename,
    sanitize_job_id,
    sanitize_options,
    sanitize_selections,
    validate_content_type,
    validate_file_extension,
)


def test_sanitize_filename_strips_path_traversal():
    assert sanitize_filename("../../../etc/passwd") == "passwd"
    assert sanitize_filename("foo/bar\\baz.pdf") == "baz.pdf"


def test_sanitize_filename_removes_control_chars():
    assert sanitize_filename("file\x00name\x01.pdf") == "filename.pdf"


def test_sanitize_filename_limits_length():
    long_name = "a" * 300 + ".pdf"
    result = sanitize_filename(long_name)
    assert len(result) <= 255
    assert result.endswith(".pdf")


def test_sanitize_filename_empty_returns_unnamed():
    assert sanitize_filename("") == "unnamed"
    assert sanitize_filename(None) == "unnamed"


def test_validate_file_extension():
    assert validate_file_extension("doc.pdf") == ".pdf"
    assert validate_file_extension("sheet.xlsx") == ".xlsx"
    assert validate_file_extension("archive.zip") is None


def test_validate_content_type():
    assert validate_content_type("doc.pdf", "application/pdf") is True
    assert validate_content_type("doc.pdf", "application/octet-stream") is True
    assert validate_content_type("doc.pdf", "image/png") is False
    assert validate_content_type("doc.pdf", None) is True


def test_sanitize_custom_masks_bounds_and_cleans():
    masks = ["  John Doe  ", "\x00secret", "", "a" * 1000]
    result = sanitize_custom_masks(masks)
    assert result[0] == "John Doe"
    assert result[1] == "secret"
    assert len(result) == 2
    assert len(result[1]) <= 500


def test_sanitize_custom_masks_limits_count():
    masks = [f"mask{i}" for i in range(150)]
    result = sanitize_custom_masks(masks)
    assert len(result) == 100


def test_sanitize_options_filters_unknown_detectors():
    raw = {
        "detectors": ["email", "phone", "fake_detector", "name"],
        "ml": "true",
        "aggressive": 1,
        "custom_masks": ["foo", "", "bar"],
        "report_format": "invalid",
        "template": "PII",
    }
    sanitized = sanitize_options(raw)
    assert sanitized["detectors"] == ["email", "phone", "name"]
    assert sanitized["ml"] is True
    assert sanitized["aggressive"] is False  # non-bool/non-true-string
    assert sanitized["custom_masks"] == ["foo", "bar"]
    assert sanitized["report_format"] == "json"
    assert sanitized["template"] is None  # PII is not lowercase valid template


def test_sanitize_options_normalizes_booleans():
    assert sanitize_options({"ml": "yes"})["ml"] is True
    assert sanitize_options({"ocr": "false"})["ocr"] is False
    assert sanitize_options({"remove_metadata": True})["remove_metadata"] is True


def test_sanitize_options_template_lowercase():
    raw = {"template": "GdPr"}
    sanitized = sanitize_options(raw)
    assert sanitized["template"] == "gdpr"


def test_sanitize_options_color_strings():
    raw = {"color": "red", "color_hex": "#FF0000<>", "text": "  overlay  "}
    sanitized = sanitize_options(raw)
    assert sanitized["color"] == "red"
    assert sanitized["color_hex"] == "FF0000"
    assert sanitized["text_color"] == "white"
    assert sanitized["text"] == "overlay"


def test_sanitize_job_id():
    assert sanitize_job_id("job-123_abc") == "job-123_abc"
    assert sanitize_job_id("job<123>") == "job123"
    assert sanitize_job_id("") is None
    assert sanitize_job_id(None) is None
    assert sanitize_job_id("a" * 65) is None


def test_sanitize_selections():
    selections = [
        {
            "page": 2,
            "rects": [[10.5, 20.0, 30.0, 40.0]],
            "detector": "email",
            "text": "secret\x00text",
            "confidence": "medium",
        },
        {
            "page": -1,
            "rects": [[1, 2, 3]],
            "detector": "bad<script>",
            "text": 123,
            "confidence": "unknown",
        },
    ]
    result = sanitize_selections(selections)
    assert len(result) == 2
    assert result[0]["page"] == 2
    assert result[0]["rects"] == [(10.5, 20.0, 30.0, 40.0)]
    assert result[0]["text"] == "secrettext"
    assert result[0]["confidence"] == "medium"

    assert result[1]["page"] == 1
    assert result[1]["rects"] == []
    assert result[1]["detector"] == "badscript"
    assert result[1]["text"] is None
    assert result[1]["confidence"] == "high"
