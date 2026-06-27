"""PDF processor using PyMuPDF."""

from __future__ import annotations

import os
from typing import Any

import pymupdf as fitz

from pdf_redactor.detectors.base import Detection
from pdf_redactor.utils import COLOR_MAP, dedupe_rects, hex_to_rgb

from .base import DocumentProcessor, registry


@registry.register
class PDFProcessor(DocumentProcessor):
    extensions = ("pdf",)

    def __init__(self, engine, options):
        super().__init__(options)
        self.engine = engine

    def process(self, input_path: str, output_path: str):
        from pdf_redactor.engine import RedactionReport

        document = fitz.open(input_path)
        try:
            text_pages = self._extract_text(document)
            detections = self._detect(document, text_pages)
            if self.options.preview:
                return RedactionReport(pages=len(document), detections=detections)
            self._apply(document, detections)
            if self.options.remove_metadata:
                self._remove_metadata(document)
            os.makedirs(os.path.dirname(os.path.abspath(output_path)), exist_ok=True)
            document.ez_save(output_path)
            report = RedactionReport(pages=len(document), detections=detections)
            report.summary = self._summarize(detections)
            return report
        finally:
            document.close()

    def _extract_text(self, document: fitz.Document) -> list[str]:
        pages = []
        for i in range(len(document)):
            page = document.load_page(i)
            if self.options.ocr:
                try:
                    text = page.get_text("text", flags=fitz.TEXT_PRESERVE_IMAGES | fitz.TEXT_OCR)
                except Exception:
                    text = page.get_text("text")
            else:
                text = page.get_text("text")
            pages.append(text)
        return pages

    def _detect(self, document: fitz.Document, text_pages: list[str]) -> list[Detection]:
        from pdf_redactor.engine import build_detectors

        detectors = build_detectors(self.engine.registry, self.options)
        all_detections: list[Detection] = []
        for detector in detectors:
            all_detections.extend(detector.detect(document, text_pages))

        if self.options.ml and self.engine.ml_registry is not None:
            all_detections.extend(
                self.ml_registry.detect(document, text_pages, self.options.ml_detectors)
            )

        if self.options.aggressive:
            return all_detections
        return [d for d in all_detections if d.confidence in {"high", "medium"}]

    def _apply(self, document: fitz.Document, detections: list[Detection]) -> None:
        fill = hex_to_rgb(self.options.color_hex) if self.options.color_hex else COLOR_MAP[self.options.color]
        text_fill = (
            hex_to_rgb(self.options.text_color_hex)
            if self.options.text_color_hex
            else COLOR_MAP[self.options.text_color]
        )

        from collections import defaultdict

        by_page: dict[int, list[Detection]] = defaultdict(list)
        for d in detections:
            by_page[d.page].append(d)

        for page_num in range(len(document)):
            page = document.load_page(page_num)
            rects = dedupe_rects([r for d in by_page.get(page_num, []) for r in d.rects])
            for rect in rects:
                page.add_redact_annot(
                    quad=rect,
                    text=self.options.text,
                    text_color=text_fill,
                    fill=fill,
                    cross_out=True,
                )
            page.apply_redactions(images=fitz.PDF_REDACT_IMAGE_NONE)

    def apply_selections(
        self,
        input_path: str,
        output_path: str,
        selections: list[dict[str, Any]],
    ) -> RedactionReport:
        """Apply a curated list of redactions (used by /apply).

        Each selection is a dict with keys: page (1-indexed), rects, detector,
        text, confidence.
        """
        from pdf_redactor.engine import RedactionReport

        document = fitz.open(input_path)
        try:
            detections: list[Detection] = []
            for sel in selections:
                page = sel["page"] - 1
                rects = [fitz.Rect(r) for r in sel["rects"]]
                detections.append(
                    Detection(
                        page=page,
                        text=sel.get("text", ""),
                        detector=sel.get("detector") or "manual",
                        confidence=sel.get("confidence", "high"),
                        rects=rects,
                    )
                )
            self._apply(document, detections)
            if self.options.remove_metadata:
                self._remove_metadata(document)
            os.makedirs(os.path.dirname(os.path.abspath(output_path)), exist_ok=True)
            document.ez_save(output_path)
            report = RedactionReport(pages=len(document), detections=detections)
            report.summary = self._summarize(detections)
            return report
        finally:
            document.close()

    def _remove_metadata(self, document: fitz.Document) -> None:
        document.set_metadata({
            "producer": "",
            "creator": "",
            "title": "",
            "author": "",
            "subject": "",
            "keywords": "",
        })

    def _summarize(self, detections: list[Detection]) -> dict[str, dict[str, int]]:
        summary: dict[str, dict[str, int]] = {}
        for d in detections:
            summary.setdefault(d.detector, {"high": 0, "medium": 0, "low": 0})
            summary[d.detector][d.confidence] += 1
        return summary
