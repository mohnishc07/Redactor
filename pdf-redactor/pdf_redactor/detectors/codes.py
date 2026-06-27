"""Barcode and QR-code detectors."""

from __future__ import annotations

import pymupdf as fitz
from PIL import Image

try:
    from pyzbar.pyzbar import decode
    PYZBAR_AVAILABLE = True
except Exception:  # noqa: BLE001
    decode = None
    PYZBAR_AVAILABLE = False

from pdf_redactor.utils import dedupe_rects

from .base import Detection, Detector, registry


class CodeDetectorBase(Detector):
    """Shared logic for barcode/QR detection via pyzbar."""

    code_type: str | None = None  # "barcode" or "qrcode"
    enabled_by_default = False

    def detect(self, document: fitz.Document, text_pages: list[str]) -> list[Detection]:
        detections = []
        if decode is None:
            return detections

        zoom = 3
        matrix = fitz.Matrix(zoom, zoom)
        for page_num in range(len(document)):
            page = document.load_page(page_num)
            pix = page.get_pixmap(matrix=matrix, colorspace=fitz.csRGB)
            pil_img = Image.frombytes("RGB", [pix.width, pix.height], pix.samples)

            for bar in decode(pil_img):
                if self.code_type == "barcode" and bar.type.startswith("QRCODE"):
                    continue
                if self.code_type == "qrcode" and not bar.type.startswith("QRCODE"):
                    continue

                rect = bar.rect
                bbox = fitz.Rect(
                    rect.left / zoom,
                    rect.top / zoom,
                    (rect.left + rect.width) / zoom,
                    (rect.top + rect.height) / zoom,
                )
                detections.append(
                    Detection(
                        page=page_num,
                        text=bar.data.decode("utf-8", errors="replace"),
                        detector=self.name,
                        confidence="high",
                        rects=dedupe_rects([bbox]),
                    )
                )
        return detections


@registry.register
class QRCodeDetector(CodeDetectorBase):
    name = "qrcode"
    code_type = "qrcode"


@registry.register
class BarcodeDetector(CodeDetectorBase):
    name = "barcode"
    code_type = "barcode"
