"""spaCy/NER-based detectors for names and addresses.

This module is optional. If spaCy or the required model is not installed,
the registry returns empty detections and logs a warning.
"""

from __future__ import annotations

import logging
from typing import TYPE_CHECKING, Any

if TYPE_CHECKING:
    import pymupdf as fitz

from pdf_redactor.utils import dedupe_rects

from pdf_redactor.detectors.base import Detection

logger = logging.getLogger(__name__)


def _load_spacy_model(model_name: str = "en_core_web_sm"):
    try:
        import spacy

        return spacy.load(model_name)
    except Exception as exc:  # noqa: BLE001
        logger.warning("spaCy model %s could not be loaded: %s", model_name, exc)
        return None


class MLDetectorRegistry:
    """Lightweight wrapper around optional ML models."""

    def __init__(self, model_name: str = "en_core_web_sm"):
        self._nlp = None
        self._model_name = model_name

    @property
    def nlp(self):
        if self._nlp is None:
            self._nlp = _load_spacy_model(self._model_name)
        return self._nlp

    def detect(
        self,
        document: "fitz.Document",
        text_pages: list[str],
        detector_names: list[str],
    ) -> list[Detection]:
        if self.nlp is None:
            return []

        detections = []
        for page_num, text in enumerate(text_pages):
            doc = self.nlp(text)
            for ent in doc.ents:
                if "name" in detector_names and ent.label_ in {"PERSON"}:
                    rects = document.load_page(page_num).search_for(ent.text)
                    detections.append(
                        Detection(
                            page=page_num,
                            text=ent.text,
                            detector="name_ml",
                            confidence="medium",
                            rects=dedupe_rects(rects),
                        )
                    )
                if "address" in detector_names and ent.label_ in {"GPE", "LOC"}:
                    # Expand to surrounding line for a fuller address.
                    rects = document.load_page(page_num).search_for(ent.text)
                    detections.append(
                        Detection(
                            page=page_num,
                            text=ent.text,
                            detector="address_ml",
                            confidence="low",
                            rects=dedupe_rects(rects),
                        )
                    )
        return detections

    def to_dict(self) -> dict[str, Any]:
        return {
            "model_name": self._model_name,
            "loaded": self.nlp is not None,
        }
