"""Core redaction engine."""

from __future__ import annotations

from dataclasses import dataclass, field
from typing import Any

from .detectors import DetectorRegistry, registry
from .detectors.base import Detection
from .processors import registry as processor_registry


@dataclass
class RedactionOptions:
    """Runtime options for the redaction engine."""

    detectors: list[str] = field(default_factory=list)
    ml: bool = False
    ml_detectors: list[str] = field(default_factory=lambda: ["name", "address"])
    aggressive: bool = False
    text: str | None = None
    color: str = "black"
    color_hex: str | None = None
    text_color: str = "white"
    text_color_hex: str | None = None
    preview: bool = False
    geographic_code: str | None = None
    custom_masks: list[str] = field(default_factory=list)
    template: str | None = None
    remove_metadata: bool = False
    ocr: bool = False

    # Compliance presets.
    TEMPLATES = {
        "pii": ["phone", "email", "ssn", "passport", "name", "address"],
        "hipaa": ["phone", "email", "ssn", "name", "address", "date"],
        "gdpr": ["phone", "email", "name", "address", "passport", "ssn"],
        "financial": ["account", "ifsc", "micr", "upi", "pan", "aadhaar", "bic", "iban", "creditcard", "balance"],
    }

    def resolve_detectors(self) -> list[str]:
        detectors = list(self.detectors)
        if self.template and self.template in self.TEMPLATES:
            for d in self.TEMPLATES[self.template]:
                if d not in detectors:
                    detectors.append(d)
        return detectors

    @classmethod
    def from_dict(cls, data: dict[str, Any]) -> "RedactionOptions":
        return cls(
            detectors=data.get("detectors", []),
            ml=data.get("ml", False),
            ml_detectors=data.get("ml_detectors", ["name", "address"]),
            aggressive=data.get("aggressive", False),
            text=data.get("text"),
            color=data.get("color", "black"),
            color_hex=data.get("color_hex"),
            text_color=data.get("text_color", "white"),
            text_color_hex=data.get("text_color_hex"),
            preview=data.get("preview", False),
            geographic_code=data.get("geographic_code"),
            custom_masks=data.get("custom_masks", []),
            template=data.get("template"),
            remove_metadata=data.get("remove_metadata", False),
            ocr=data.get("ocr", False),
        )


@dataclass
class RedactionReport:
    """Report emitted after redaction."""

    pages: int = 0
    detections: list[Detection] = field(default_factory=list)
    summary: dict[str, dict[str, int]] = field(default_factory=dict)

    def to_dict(self) -> dict[str, Any]:
        return {
            "pages": self.pages,
            "detections": [
                {
                    "page": d.page + 1 if isinstance(d.page, int) else d.page,
                    "text": d.text,
                    "detector": d.detector,
                    "confidence": d.confidence,
                    "rects": [tuple(r) for r in d.rects],
                }
                for d in self.detections
            ],
            "summary": self.summary,
        }


def build_detectors(detector_registry: DetectorRegistry, options: RedactionOptions):
    """Instantiate the requested detectors."""
    detector_names = options.resolve_detectors()
    detector_options: dict[str, Any] = {"geographic_code": options.geographic_code}
    if options.custom_masks:
        detector_options["custom_masks"] = options.custom_masks
        if "mask" not in detector_names:
            detector_names.append("mask")
    return detector_registry.build(detector_names or None, **detector_options)


class RedactionEngine:
    """End-to-end redaction engine."""

    def __init__(
        self,
        detector_registry: DetectorRegistry | None = None,
        ml_registry: Any | None = None,
    ):
        self.registry = detector_registry or registry
        self.ml_registry = ml_registry

    def process(
        self,
        input_path: str,
        output_path: str,
        options: RedactionOptions,
    ) -> RedactionReport:
        processor_cls = processor_registry.get(input_path)
        if processor_cls is None:
            supported = ", ".join(processor_registry.supported_extensions())
            raise ValueError(
                f"Unsupported file type: '{input_path}'. Supported: {supported}"
            )
        processor = processor_cls(self, options)
        return processor.process(input_path, output_path)
