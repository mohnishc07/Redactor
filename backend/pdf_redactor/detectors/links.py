"""Hyperlink detector."""

from __future__ import annotations

import pymupdf as fitz

from pdf_redactor.utils import dedupe_rects

from .base import Detection, Detector, registry


@registry.register
class LinkDetector(Detector):
    name = "link"
    enabled_by_default = False

    def detect(self, document: fitz.Document, text_pages: list[str]) -> list[Detection]:
        detections = []
        for page_num in range(len(document)):
            page = document.load_page(page_num)
            for link in page.get_links():
                rect = link.get("from")
                if rect is None:
                    continue
                desc = link.get("uri") or link.get("file") or f"page {link.get('page', 0) + 1}"
                detections.append(
                    Detection(
                        page=page_num,
                        text=str(desc),
                        detector=self.name,
                        confidence="high",
                        rects=dedupe_rects([rect]),
                    )
                )
        return detections
