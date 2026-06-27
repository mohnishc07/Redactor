"""General PII / credential detectors."""

from __future__ import annotations

import re

import pymupdf as fitz

from pdf_redactor.utils import dedupe_rects

from .base import Detection, Detector, registry


@registry.register
class SSNDetector(Detector):
    name = "ssn"
    enabled_by_default = False

    # US SSN: XXX-XX-XXXX or XXX XX XXXX.
    _pattern = re.compile(r"\b\d{3}[\-\s]\d{2}[\-\s]\d{4}\b")

    def detect(self, document: fitz.Document, text_pages: list[str]) -> list[Detection]:
        keyword_pattern = re.compile(r"SSN|Social\s*Security|Social\s*Security\s*Number", re.IGNORECASE)
        detections = []
        for page_num, text in enumerate(text_pages):
            for match in self._pattern.finditer(text):
                candidate = match.group(0)
                before = text[max(0, match.start() - 80) : match.start()]
                confidence = "high" if keyword_pattern.search(before) else "medium"
                rects = document.load_page(page_num).search_for(candidate)
                detections.append(
                    Detection(
                        page=page_num,
                        text=candidate,
                        detector=self.name,
                        confidence=confidence,
                        rects=dedupe_rects(rects),
                    )
                )
        return detections


@registry.register
class PassportDetector(Detector):
    name = "passport"
    enabled_by_default = False

    # Generic passport-like alphanumeric codes (1-2 letters + 6-9 digits).
    _pattern = re.compile(r"\b[A-Z]{1,2}\d{6,9}\b")

    def detect(self, document: fitz.Document, text_pages: list[str]) -> list[Detection]:
        keyword_pattern = re.compile(r"Passport\s*(No|Number|#)?", re.IGNORECASE)
        detections = []
        for page_num, text in enumerate(text_pages):
            for match in self._pattern.finditer(text):
                candidate = match.group(0).upper()
                before = text[max(0, match.start() - 80) : match.start()]
                confidence = "high" if keyword_pattern.search(before) else "low"
                rects = document.load_page(page_num).search_for(candidate)
                detections.append(
                    Detection(
                        page=page_num,
                        text=candidate,
                        detector=self.name,
                        confidence=confidence,
                        rects=dedupe_rects(rects),
                    )
                )
        return detections


@registry.register
class CreditCardDetector(Detector):
    name = "creditcard"
    enabled_by_default = False

    # Major card networks: Visa, Mastercard, Amex, Discover, Diners, JCB.
    _pattern = re.compile(
        r"\b(?:4[0-9]{12}(?:[0-9]{3})?|5[1-5][0-9]{14}|3[47][0-9]{13}|"
        r"3(?:0[0-5]|[68][0-9])[0-9]{11}|6(?:011|5[0-9]{2})[0-9]{12}|"
        r"(?:2131|1800|35\d{3})\d{11})\b"
    )

    def _luhn_valid(self, number: str) -> bool:
        digits = [int(d) for d in number if d.isdigit()]
        if len(digits) < 13:
            return False
        checksum = 0
        reverse = digits[::-1]
        for i, d in enumerate(reverse):
            if i % 2 == 1:
                d *= 2
                if d > 9:
                    d -= 9
            checksum += d
        return checksum % 10 == 0

    def detect(self, document: fitz.Document, text_pages: list[str]) -> list[Detection]:
        detections = []
        for page_num, text in enumerate(text_pages):
            for match in self._pattern.finditer(text):
                candidate = match.group(0)
                if not self._luhn_valid(candidate):
                    continue
                rects = document.load_page(page_num).search_for(candidate)
                detections.append(
                    Detection(
                        page=page_num,
                        text=candidate,
                        detector=self.name,
                        confidence="high",
                        rects=dedupe_rects(rects),
                    )
                )
        return detections


@registry.register
class SecretDetector(Detector):
    name = "secret"
    enabled_by_default = False

    # API keys, tokens, secrets. Broad but useful patterns.
    _patterns = [
        re.compile(r"\b(sk-[a-zA-Z0-9]{20,})\b"),  # OpenAI-style
        re.compile(r"\b(AIza[0-9A-Za-z_-]{35})\b"),  # Google API keys
        re.compile(r"\b(ghp_[a-zA-Z0-9]{36})\b"),  # GitHub personal access tokens
        re.compile(r"\b([A-Za-z0-9_]{20,40}=[A-Za-z0-9_\-]{20,})\b"),  # env-style KEY=VALUE
    ]

    def detect(self, document: fitz.Document, text_pages: list[str]) -> list[Detection]:
        keyword_pattern = re.compile(r"api[_\s]?key|token|secret|password|credential", re.IGNORECASE)
        detections = []
        for page_num, text in enumerate(text_pages):
            for pattern in self._patterns:
                for match in pattern.finditer(text):
                    candidate = match.group(0)
                    before = text[max(0, match.start() - 60) : match.start()]
                    confidence = "high" if keyword_pattern.search(before) else "medium"
                    rects = document.load_page(page_num).search_for(candidate)
                    detections.append(
                        Detection(
                            page=page_num,
                            text=candidate,
                            detector=self.name,
                            confidence=confidence,
                            rects=dedupe_rects(rects),
                        )
                    )
        return detections
