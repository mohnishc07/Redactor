"use client";

import React, { useState, useCallback, useId } from "react";
import { motion } from "motion/react";
import {
  IconArrowLeft,
  IconDownload,
  IconRefresh,
  IconCheck,
  IconLoader2,
} from "@tabler/icons-react";
import PdfViewer from "@/components/pdf-viewer";
import ReviewPanel from "@/components/review-panel";
import type {
  PreviewData,
  RedactionResult,
  ReviewDetection,
  ManualBox,
  ViewerMode,
} from "@/lib/types";

interface PreviewWorkspaceProps {
  preview: PreviewData;
  fileName: string;
  options: Record<string, unknown>;
  onReset: () => void;
}

export default function PreviewWorkspace({
  preview,
  fileName,
  options,
  onReset,
}: PreviewWorkspaceProps) {
  const idPrefix = useId();
  const [detections, setDetections] = useState<ReviewDetection[]>(
    preview.report.detections.map((d, i) => ({
      ...d,
      id: `${idPrefix}-det-${i}`,
      status: "approved" as const,
    }))
  );
  const [manualBoxes, setManualBoxes] = useState<ManualBox[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [mode, setMode] = useState<ViewerMode>("pan");
  const [scale, setScale] = useState(1.25);
  const [currentPage, setCurrentPage] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<RedactionResult | null>(null);
  const [error, setError] = useState("");

  const pdfUrl = `data:application/pdf;base64,${preview.original_pdf_base64}`;

  const handleToggleDetection = useCallback((id: string) => {
    setDetections((prev) =>
      prev.map((d) =>
        d.id === id ? { ...d, status: d.status === "approved" ? "rejected" : "approved" } : d
      )
    );
  }, []);

  const handleRemoveDetection = useCallback((id: string) => {
    setDetections((prev) => prev.filter((d) => d.id !== id));
    setSelectedId((prev) => (prev === id ? null : prev));
  }, []);

  const handleAddManualBox = useCallback((box: ManualBox) => {
    setManualBoxes((prev) => [...prev, box]);
    setSelectedId(box.id);
  }, []);

  const handleRemoveManualBox = useCallback((id: string) => {
    setManualBoxes((prev) => prev.filter((b) => b.id !== id));
    setSelectedId((prev) => (prev === id ? null : prev));
  }, []);

  const handleSelect = useCallback((id: string) => {
    setSelectedId(id);
    const item = detections.find((d) => d.id === id) || manualBoxes.find((b) => b.id === id);
    if (item) setCurrentPage(item.page);
  }, [detections, manualBoxes]);

  const handleSubmit = async () => {
    setError("");
    setSubmitting(true);
    try {
      const selections = [
        ...detections.filter((d) => d.status === "approved"),
        ...manualBoxes,
      ].map((item) => ({
        page: item.page,
        rects: item.rects,
        detector: item.detector,
        text: item.text,
        confidence: item.confidence,
      }));

      const res = await fetch(`/api/apply/${preview.job_id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ selections, options }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.detail || data.error?.message || "Apply failed");
      }
      setResult(data);
    } catch {
      setError("Submit failed");
    } finally {
      setSubmitting(false);
    }
  };

  const downloadResult = () => {
    if (!result) return;
    try {
      const bytes = Uint8Array.from(atob(result.pdf_base64), (c) => c.charCodeAt(0));
      const blob = new Blob([bytes], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = result.filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch {
      setError("Failed to download file");
    }
  };

  if (result) {
    return (
      <div className="w-full max-w-[1280px] mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-[28px] border border-emerald-500/20 bg-emerald-500/[0.08] backdrop-blur-2xl p-6 text-center"
        >
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-emerald-500/20 text-emerald-400 mb-4">
            <IconCheck className="w-6 h-6" />
          </div>
          <h3 className="text-[18px] font-medium text-white mb-1">Redaction complete</h3>
          <p className="text-[13px] text-white/50 mb-6">
            {result.report.detections.length} items redacted across {result.report.pages} page
            {result.report.pages === 1 ? "" : "s"}
          </p>
          <div className="flex items-center justify-center gap-3">
            <button
              onClick={downloadResult}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white text-black text-[13px] font-semibold hover:bg-white/90 transition-colors"
            >
              <IconDownload className="w-4 h-4" />
              Download PDF
            </button>
            <button
              onClick={onReset}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl border border-white/[0.12] bg-white/[0.06] text-white text-[13px] font-medium hover:bg-white/[0.10] transition-colors"
            >
              <IconRefresh className="w-4 h-4" />
              Start over
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="w-full h-[calc(100vh-160px)] min-h-[600px] flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <button
            onClick={onReset}
            className="p-2 rounded-xl text-white/50 hover:text-white hover:bg-white/[0.08] transition-colors"
          >
            <IconArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h2 className="text-[16px] font-medium text-white">Preview & Review</h2>
            <p className="text-[12px] text-white/40 truncate max-w-[300px]">{fileName}</p>
          </div>
        </div>
        <button
          onClick={handleSubmit}
          disabled={submitting}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-accent text-white text-[13px] font-semibold hover:bg-accent/90 disabled:opacity-50 transition-colors"
        >
          {submitting ? (
            <>
              <IconLoader2 className="w-4 h-4 animate-spin" />
              Redacting...
            </>
          ) : (
            <>
              <IconCheck className="w-4 h-4" />
              Submit
            </>
          )}
        </button>
      </div>

      {error && (
        <div className="mb-4 rounded-2xl border border-red-500/20 bg-red-500/[0.08] p-4 text-[13px] text-white/70">
          {error}
        </div>
      )}

      {/* Workspace */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-4 min-h-0">
        <ReviewPanel
          detections={detections}
          manualBoxes={manualBoxes}
          selectedId={selectedId}
          onToggleDetection={handleToggleDetection}
          onRemoveDetection={handleRemoveDetection}
          onRemoveManualBox={handleRemoveManualBox}
          onSelect={handleSelect}
        />
        <PdfViewer
          pdfUrl={pdfUrl}
          detections={detections}
          manualBoxes={manualBoxes}
          mode={mode}
          scale={scale}
          currentPage={currentPage}
          onModeChange={setMode}
          onScaleChange={setScale}
          onPageChange={setCurrentPage}
          onToggleDetection={handleToggleDetection}
          onRemoveDetection={handleRemoveDetection}
          onAddManualBox={handleAddManualBox}
          onSelectDetection={handleSelect}
          selectedId={selectedId}
        />
      </div>
    </div>
  );
}
