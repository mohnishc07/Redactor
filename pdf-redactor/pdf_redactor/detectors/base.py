"""Base detector classes and registry."""

from __future__ import annotations

import dataclasses
from typing import TYPE_CHECKING, Any

if TYPE_CHECKING:
    import pymupdf as fitz


@dataclasses.dataclass(frozen=True)
class Detection:
    """A single detection produced by a detector."""

    page: int
    text: str
    detector: str
    confidence: str  # "high", "medium", "low"
    rects: list["fitz.Rect"] = dataclasses.field(default_factory=list)
    meta: dict[str, Any] = dataclasses.field(default_factory=dict)

    def __post_init__(self):
        if self.confidence not in {"high", "medium", "low"}:
            raise ValueError(f"Invalid confidence: {self.confidence}")


class Detector:
    """Base class for all detectors."""

    name: str = ""
    enabled_by_default: bool = False

    def __init__(self, **options):
        self.options = options

    def detect(self, document: "fitz.Document", text_pages: list[str]) -> list[Detection]:
        """Return detections across all pages."""
        raise NotImplementedError


class DetectorRegistry:
    """Central registry for detectors."""

    def __init__(self):
        self._detectors: dict[str, type[Detector]] = {}

    def register(self, detector_cls: type[Detector]) -> type[Detector]:
        self._detectors[detector_cls.name] = detector_cls
        return detector_cls

    def get(self, name: str) -> type[Detector] | None:
        return self._detectors.get(name)

    def names(self) -> list[str]:
        return list(self._detectors.keys())

    def build(
        self, names: list[str] | None = None, **global_options
    ) -> list[Detector]:
        if names is None:
            names = [n for n, cls in self._detectors.items() if cls.enabled_by_default]
        instances = []
        for name in names:
            cls = self._detectors.get(name)
            if cls is None:
                raise ValueError(f"Unknown detector: {name}")
            instances.append(cls(**global_options))
        return instances


# Global registry singleton
registry = DetectorRegistry()
