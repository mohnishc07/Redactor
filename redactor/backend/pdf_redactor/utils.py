"""Shared helpers for PDF redaction."""

from __future__ import annotations

import re
from typing import Iterable

import pymupdf as fitz


WHITE = fitz.pdfcolor["white"]
BLACK = fitz.pdfcolor["black"]
RED = fitz.pdfcolor["red"]
GREEN = fitz.pdfcolor["green"]
BLUE = fitz.pdfcolor["blue"]

COLOR_MAP = {
    "white": WHITE,
    "black": BLACK,
    "red": RED,
    "green": GREEN,
    "blue": BLUE,
}


def hex_to_rgb(value: str) -> tuple[float, float, float]:
    value = value.lstrip("#")
    if len(value) == 3:
        value = "".join(char + char for char in value)
    if len(value) != 6:
        raise ValueError("Invalid hex color.")
    return tuple(int(value[i : i + 2], 16) / 255.0 for i in (0, 2, 4))


def dedupe_rects(rects: Iterable[fitz.Rect]) -> list[fitz.Rect]:
    unique_rects = []
    seen = set()
    for rect in rects:
        key = tuple(round(value, 3) for value in (rect.x0, rect.y0, rect.x1, rect.y1))
        if key not in seen:
            seen.add(key)
            unique_rects.append(rect)
    return unique_rects


def validate_date(day: int, month: int, year: int | None = None) -> bool:
    """Return True only for realistic calendar dates."""
    if month < 1 or month > 12:
        return False
    if day < 1 or day > 31:
        return False
    if month in {4, 6, 9, 11} and day > 30:
        return False
    if month == 2:
        leap = year is not None and year % 4 == 0 and (year % 100 != 0 or year % 400 == 0)
        max_day = 29 if leap else 28
        if day > max_day:
            return False
    return True


def iban_checksum(iban: str) -> bool:
    """Validate IBAN mod-97 checksum."""
    cleaned = iban.replace(" ", "").upper()
    if len(cleaned) < 15 or len(cleaned) > 34:
        return False
    # Move first four chars to end and convert letters to numbers
    rearranged = cleaned[4:] + cleaned[:4]
    numeric = "".join(str(int(ch, 36)) for ch in rearranged)
    try:
        return int(numeric) % 97 == 1
    except ValueError:
        return False


def compile_patterns(patterns: Iterable[str]) -> list[re.Pattern]:
    return [re.compile(p, re.IGNORECASE) for p in patterns]
