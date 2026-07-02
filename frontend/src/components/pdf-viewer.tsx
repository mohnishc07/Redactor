"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";
import {
  IconZoomIn,
  IconZoomOut,
  IconMaximize,
  IconHandMove,
  IconPencil,
  IconChevronLeft,
  IconChevronRight,
} from "@tabler/icons-react";
import { Card } from "@/components/ui/card";
import type { ReviewDetection, ManualBox, ViewerMode } from "@/lib/types";

pdfjs.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";

interface PdfViewerProps {
  pdfUrl: string;
  detections: ReviewDetection[];
  manualBoxes: ManualBox[];
  mode: ViewerMode;
  scale: number;
  currentPage: number;
  onModeChange: (mode: ViewerMode) => void;
  onScaleChange: (scale: number) => void;
  onPageChange: (page: number) => void;
  onToggleDetection: (id: string) => void;
  onRemoveDetection: (id: string) => void;
  onAddManualBox: (box: ManualBox) => void;
  onSelectDetection: (id: string) => void;
  selectedId?: string | null;
}

interface PageSize {
  originalWidth: number;
  originalHeight: number;
}

const HIGHLIGHTS = {
  approved: {
    fill: "rgba(89, 212, 153, 0.18)",
    border: "rgba(89, 212, 153, 0.80)",
  },
  rejected: {
    fill: "rgba(106, 107, 108, 0.15)",
    border: "rgba(106, 107, 108, 0.60)",
  },
  manual: {
    fill: "rgba(87, 193, 255, 0.18)",
    border: "rgba(87, 193, 255, 0.80)",
  },
  selected: {
    fill: "rgba(89, 212, 153, 0.32)",
    border: "rgba(89, 212, 153, 1)",
  },
};

export default function PdfViewer({
  pdfUrl,
  detections,
  manualBoxes,
  mode,
  scale,
  currentPage,
  onModeChange,
  onScaleChange,
  onPageChange,
  onToggleDetection,
  onRemoveDetection,
  onAddManualBox,
  onSelectDetection,
  selectedId,
}: PdfViewerProps) {
  const [numPages, setNumPages] = useState(0);
  const [pageSizes, setPageSizes] = useState<Record<number, PageSize>>({});
  const [drawing, setDrawing] = useState<{
    page: number;
    startX: number;
    startY: number;
    endX: number;
    endY: number;
  } | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const pageRefs = useRef<Record<number, HTMLDivElement | null>>({});

  const onDocumentLoad = useCallback(({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
  }, []);

  const onPageLoad = useCallback(
    (
      page: {
        originalWidth?: number;
        originalHeight?: number;
        width?: number;
        height?: number;
      },
      pageIndex: number
    ) => {
      setPageSizes((prev) => ({
        ...prev,
        [pageIndex]: {
          originalWidth: page.originalWidth || page.width || 1,
          originalHeight: page.originalHeight || page.height || 1,
        },
      }));
    },
    []
  );

  useEffect(() => {
    const el = pageRefs.current[currentPage];
    if (el && containerRef.current) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [currentPage]);

  const itemsForPage = (pageIndex: number) => {
    return [
      ...detections
        .filter((d) => d.page === pageIndex)
        .map((d) => ({ ...d, kind: "auto" as const })),
      ...manualBoxes
        .filter((m) => m.page === pageIndex)
        .map((m) => ({ ...m, kind: "manual" as const })),
    ];
  };

  const handleMouseDown = (e: React.MouseEvent, pageIndex: number) => {
    if (mode !== "draw") return;
    e.preventDefault();
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    setDrawing({ page: pageIndex, startX: x, startY: y, endX: x, endY: y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!drawing) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    setDrawing((prev) => (prev ? { ...prev, endX: x, endY: y } : null));
  };

  const handleMouseUp = () => {
    if (!drawing) return;
    const { page, startX, startY, endX, endY } = drawing;
    const x0 = Math.min(startX, endX) / scale;
    const y0 = Math.min(startY, startY) / scale;
    const x1 = Math.max(startX, endX) / scale;
    const y1 = Math.max(startY, endY) / scale;
    if (x1 - x0 > 2 && y1 - y0 > 2) {
      const box: ManualBox = {
        id: `manual-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        page,
        rects: [[x0, y0, x1, y1]],
        detector: "manual",
        text: "",
        confidence: "high",
      };
      onAddManualBox(box);
    }
    setDrawing(null);
  };

  const renderedWidth = (pageIndex: number) => {
    const size = pageSizes[pageIndex];
    return size ? size.originalWidth * scale : 0;
  };

  const toolbarButton = "p-2 rounded-[var(--radius-md)] text-[var(--ash)] bg-[var(--surface-elevated)] border border-[var(--hairline)] hover:text-[var(--on-dark)] disabled:opacity-30";
  const modeButton = (active: boolean) =>
    `flex items-center gap-1.5 px-3 py-2 rounded-[var(--radius-md)] font-ui text-[11px] font-medium tracking-[0.2px] ${
      active
        ? "bg-[var(--primary)] text-[var(--on-primary)]"
        : "text-[var(--mute)] bg-[var(--surface-elevated)] border border-[var(--hairline)]"
    }`;

  return (
    <Card className="flex flex-col h-full overflow-hidden !p-0">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-[var(--hairline)] bg-[var(--surface-elevated)]">
        <div className="flex items-center gap-1">
          <button
            onClick={() => onScaleChange(Math.max(0.5, scale - 0.25))}
            className={toolbarButton}
            title="Zoom out"
          >
            <IconZoomOut className="w-4 h-4" />
          </button>
          <span className="font-ui text-[12px] font-medium text-[var(--mute)] min-w-[48px] text-center">
            {Math.round(scale * 100)}%
          </span>
          <button
            onClick={() => onScaleChange(scale + 0.25)}
            className={toolbarButton}
            title="Zoom in"
          >
            <IconZoomIn className="w-4 h-4" />
          </button>
          <button
            onClick={() => onScaleChange(1.25)}
            className={toolbarButton}
            title="Fit"
          >
            <IconMaximize className="w-4 h-4" />
          </button>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={() => onModeChange("pan")}
            className={modeButton(mode === "pan")}
          >
            <IconHandMove className="w-3.5 h-3.5" />
            Pan
          </button>
          <button
            onClick={() => onModeChange("draw")}
            className={modeButton(mode === "draw")}
          >
            <IconPencil className="w-3.5 h-3.5" />
            Draw
          </button>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={() => onPageChange(Math.max(1, currentPage - 1))}
            disabled={currentPage <= 1}
            className={toolbarButton}
          >
            <IconChevronLeft className="w-4 h-4" />
          </button>
          <span className="font-ui text-[12px] font-medium text-[var(--mute)] min-w-[64px] text-center">
            {currentPage} / {numPages || "—"}
          </span>
          <button
            onClick={() => onPageChange(Math.min(numPages, currentPage + 1))}
            disabled={currentPage >= numPages}
            className={toolbarButton}
          >
            <IconChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Viewport */}
      <div
        ref={containerRef}
        className={`flex-1 overflow-auto bg-[var(--canvas)] p-6 ${
          mode === "draw" ? "cursor-crosshair select-none" : "cursor-grab active:cursor-grabbing"
        }`}
      >
        <Document file={pdfUrl} onLoadSuccess={onDocumentLoad} loading={<PdfLoading />}>
          {numPages > 0 &&
            Array.from({ length: numPages }, (_, i) => i + 1).map((pageNumber) => {
              const pageIndex = pageNumber;
              return (
                <div
                  key={pageNumber}
                  ref={(el) => {
                    pageRefs.current[pageIndex] = el;
                  }}
                  className="relative mx-auto mb-8 rounded-[var(--radius-md)] border border-[var(--hairline)] overflow-hidden"
                  style={{ width: renderedWidth(pageIndex) || "fit-content" }}
                >
                  <Page
                    pageNumber={pageNumber}
                    scale={scale}
                    onLoadSuccess={(page) => onPageLoad(page, pageIndex)}
                    renderTextLayer
                    renderAnnotationLayer={false}
                    loading={<PageLoading />}
                  />
                  {/* Overlay */}
                  <div
                    data-page={pageIndex}
                    className={`absolute inset-0 ${mode === "draw" ? "pointer-events-auto" : "pointer-events-none"}`}
                    style={{
                      width: renderedWidth(pageIndex),
                      height: pageSizes[pageIndex] ? pageSizes[pageIndex].originalHeight * scale : "100%",
                    }}
                    onMouseDown={(e) => handleMouseDown(e, pageIndex)}
                    onMouseMove={handleMouseMove}
                    onMouseUp={handleMouseUp}
                    onMouseLeave={handleMouseUp}
                  >
                    {itemsForPage(pageIndex).map((item) => {
                      const isManual = item.kind === "manual";
                      const isSelected = selectedId === item.id;
                      let style = HIGHLIGHTS.approved;
                      if (isManual) style = HIGHLIGHTS.manual;
                      else if (item.status === "rejected") style = HIGHLIGHTS.rejected;
                      else if (isSelected) style = HIGHLIGHTS.selected;
                      const dashed = !isManual && item.status === "rejected";
                      return (
                        <React.Fragment key={item.id}>
                          {item.rects.map((rect, rIdx) => {
                            const [x0, y0, x1, y1] = rect;
                            const left = x0 * scale;
                            const top = y0 * scale;
                            const width = (x1 - x0) * scale;
                            const height = (y1 - y0) * scale;
                            return (
                              <div
                                key={`${item.id}-${rIdx}`}
                                className={`absolute rounded-[var(--radius-xs)] ${
                                  mode === "draw" ? "pointer-events-none" : "pointer-events-auto"
                                } ${dashed ? "border-dashed" : "border-solid"} ${
                                  isSelected ? "ring-2 ring-[var(--accent-green)]" : ""
                                }`}
                                style={{
                                  left,
                                  top,
                                  width,
                                  height,
                                  backgroundColor: style.fill,
                                  border: `1px ${dashed ? "dashed" : "solid"} ${style.border}`,
                                  cursor: mode === "draw" ? "crosshair" : "pointer",
                                }}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (mode !== "draw") {
                                    onSelectDetection(item.id);
                                    if (!isManual) {
                                      onToggleDetection(item.id);
                                    }
                                  }
                                }}
                                title={isManual ? "Manual redaction" : `${item.detector}: ${item.text}`}
                              />
                            );
                          })}
                        </React.Fragment>
                      );
                    })}
                    {drawing && drawing.page === pageIndex && (
                      <div
                        className="absolute pointer-events-none border border-[var(--accent-blue)] bg-[var(--accent-blue)]/20 rounded-[var(--radius-xs)]"
                        style={{
                          left: Math.min(drawing.startX, drawing.endX),
                          top: Math.min(drawing.startY, drawing.endY),
                          width: Math.abs(drawing.endX - drawing.startX),
                          height: Math.abs(drawing.endY - drawing.startY),
                        }}
                      />
                    )}
                  </div>
                </div>
              );
            })}
        </Document>
      </div>
    </Card>
  );
}

function PdfLoading() {
  return (
    <div className="flex-1 flex items-center justify-center p-12 text-[var(--mute)]">
      <div className="flex flex-col items-center gap-3">
        <span className="w-8 h-8 border-2 border-[var(--hairline)] border-t-[var(--accent-blue)] rounded-full animate-spin" />
        <span className="font-body text-[13px]">Loading PDF...</span>
      </div>
    </div>
  );
}

function PageLoading() {
  return (
    <div className="flex items-center justify-center p-12 text-[var(--mute)]">
      <span className="font-body text-[13px]">Rendering page...</span>
    </div>
  );
}
