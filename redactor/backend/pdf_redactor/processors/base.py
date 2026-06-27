"""Base document processor."""

from __future__ import annotations

from typing import TYPE_CHECKING, Any

if TYPE_CHECKING:
    from pdf_redactor.engine import RedactionOptions, RedactionReport


class DocumentProcessor:
    """Process a single document format."""

    extensions: tuple[str, ...] = ()

    def __init__(self, engine_options: "RedactionOptions"):
        self.options = engine_options

    def process(self, input_path: str, output_path: str) -> "RedactionReport":
        raise NotImplementedError


class ProcessorRegistry:
    """Registry mapping file extensions to processors."""

    def __init__(self):
        self._processors: dict[str, type[DocumentProcessor]] = {}

    def register(self, processor_cls: type[DocumentProcessor]) -> type[DocumentProcessor]:
        for ext in processor_cls.extensions:
            self._processors[ext.lower()] = processor_cls
        return processor_cls

    def get(self, path: str) -> type[DocumentProcessor] | None:
        ext = path.split(".")[-1].lower() if "." in path else ""
        return self._processors.get(ext)

    def supported_extensions(self) -> list[str]:
        return sorted(self._processors.keys())


registry = ProcessorRegistry()
