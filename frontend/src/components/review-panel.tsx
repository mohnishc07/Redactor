"use client";

import React from "react";
import {
  IconCheck,
  IconX,
  IconTrash,
  IconHandClick,
} from "@tabler/icons-react";
import type { ReviewDetection, ManualBox } from "@/lib/types";

type ReviewItem = ReviewDetection | ManualBox;

function isManual(item: ReviewItem): item is ManualBox {
  return item.detector === "manual";
}

interface ReviewPanelProps {
  detections: ReviewDetection[];
  manualBoxes: ManualBox[];
  selectedId?: string | null;
  onToggleDetection: (id: string) => void;
  onRemoveDetection: (id: string) => void;
  onRemoveManualBox: (id: string) => void;
  onSelect: (id: string) => void;
}

export default function ReviewPanel({
  detections,
  manualBoxes,
  selectedId,
  onToggleDetection,
  onRemoveDetection,
  onRemoveManualBox,
  onSelect,
}: ReviewPanelProps) {
  const approved = detections.filter((d) => d.status === "approved").length;
  const rejected = detections.filter((d) => d.status === "rejected").length;

  const grouped = new Map<number, ReviewItem[]>();
  [...detections, ...manualBoxes].forEach((item) => {
    const list = grouped.get(item.page) || [];
    list.push(item);
    grouped.set(item.page, list);
  });

  const sortedPages = Array.from(grouped.keys()).sort((a, b) => a - b);

  return (
    <div className="glass flex flex-col h-full max-h-full !p-0">
      <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border)]">
        <div className="flex items-center gap-2">
          <IconHandClick className="w-4 h-4 text-[var(--accent)]" />
          <span className="font-heading text-[14px] font-semibold tracking-tight">Review</span>
        </div>
        <span className="font-ui text-[10px] font-semibold uppercase text-[var(--text-low)] tracking-wide">
          {approved} approved · {rejected} rejected · {manualBoxes.length} manual
        </span>
      </div>

      <div className="flex-1 overflow-y-auto pr-1 -mr-1 space-y-4 p-4">
        {sortedPages.length === 0 && (
          <div className="text-center py-10 text-[var(--text-muted)] font-body text-[13px]">
            No redactions found.
          </div>
        )}
        {sortedPages.map((page) => (
          <div key={page}>
            <p className="font-ui text-[10px] font-semibold uppercase tracking-wide text-[var(--text-low)] mb-2">
              Page {page}
            </p>
            <div className="space-y-2">
              {grouped.get(page)?.map((item) => {
                const manual = isManual(item);
                const isSelected = selectedId === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => onSelect(item.id)}
                    className={`w-full text-left rounded-xl border p-3 ${
                      isSelected
                        ? "bg-[var(--accent-soft)]/10 border-[var(--accent)]/30"
                        : "bg-[var(--surface-strong)] border-[var(--border)]"
                    }`}
                  >
                    <div className="flex items-start gap-2.5">
                      <div
                        className={`mt-0.5 w-2 h-2 rounded-full shrink-0 ${
                          manual
                            ? "bg-[var(--tint-sky)]"
                            : item.status === "approved"
                            ? "bg-[var(--tint-sage)]"
                            : "bg-[var(--text-low)]"
                        }`}
                      />
                      <div className="flex-1 min-w-0">
                        <p className="font-heading text-[12px] font-semibold text-[var(--text)] truncate">
                          {manual ? "Manual redaction" : item.text || item.detector}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="font-ui text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded bg-[var(--surface)] text-[var(--text-muted)] border border-[var(--border)]">
                            {manual ? "manual" : item.detector}
                          </span>
                          {!manual && (
                            <span
                              className={`font-ui text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded border ${
                                item.confidence === "high"
                                  ? "bg-[var(--tint-sage)]/20 text-[var(--tint-sage)] border-[var(--tint-sage)]/30"
                                  : item.confidence === "medium"
                                  ? "bg-[var(--tint-peach)]/20 text-[var(--tint-peach)] border-[var(--tint-peach)]/30"
                                  : "bg-[var(--surface)] text-[var(--text-muted)] border-[var(--border)]"
                              }`}
                            >
                              {item.confidence}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {!manual && (
                      <div className="flex items-center gap-1 mt-2.5">
                        <ActionButton
                          active={item.status === "approved"}
                          onClick={(e) => {
                            e.stopPropagation();
                            if (item.status !== "approved") onToggleDetection(item.id);
                          }}
                          color="sage"
                          title="Approve"
                        >
                          <IconCheck className="w-3 h-3" />
                        </ActionButton>
                        <ActionButton
                          active={item.status === "rejected"}
                          onClick={(e) => {
                            e.stopPropagation();
                            if (!manual && item.status !== "rejected") onToggleDetection(item.id);
                          }}
                          color="slate"
                          title="Reject"
                        >
                          <IconX className="w-3 h-3" />
                        </ActionButton>
                        <ActionButton
                          onClick={(e) => {
                            e.stopPropagation();
                            onRemoveDetection(item.id);
                          }}
                          color="red"
                          title="Remove"
                        >
                          <IconTrash className="w-3 h-3" />
                        </ActionButton>
                      </div>
                    )}

                    {manual && (
                      <div className="flex items-center gap-1 mt-2.5">
                        <ActionButton
                          onClick={(e) => {
                            e.stopPropagation();
                            onRemoveManualBox(item.id);
                          }}
                          color="red"
                          title="Remove"
                        >
                          <IconTrash className="w-3 h-3" />
                        </ActionButton>
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ActionButton({
  children,
  onClick,
  active,
  color,
  title,
}: {
  children: React.ReactNode;
  onClick: (e: React.MouseEvent) => void;
  active?: boolean;
  color: "sage" | "slate" | "red";
  title: string;
}) {
  const colorStyles = {
    sage: active
      ? "bg-[var(--tint-sage)] text-white border-transparent"
      : "text-[var(--tint-sage)] bg-[var(--surface-strong)] border-[var(--border)]",
    slate: active
      ? "bg-[var(--text-low)] text-white border-transparent"
      : "text-[var(--text-muted)] bg-[var(--surface-strong)] border-[var(--border)]",
    red: "text-[var(--primary)] bg-[var(--surface-strong)] border-[var(--border)]",
  };

  return (
    <div
      role="button"
      title={title}
      onClick={onClick}
      className={`flex items-center justify-center w-7 h-7 rounded-lg text-[11px] cursor-pointer ${colorStyles[color]}`}
    >
      {children}
    </div>
  );
}
