"use client";

import React from "react";
import {
  IconCheck,
  IconX,
  IconTrash,
  IconHandClick,
} from "@tabler/icons-react";
import { Keycap } from "@/components/ui/keycap";
import { Card } from "@/components/ui/card";
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
    <Card className="flex flex-col h-full max-h-full !p-0 overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--hairline)]">
        <div className="flex items-center gap-2">
          <IconHandClick className="w-4 h-4 text-[var(--accent-blue)]" />
          <span className="font-heading text-[14px] font-medium tracking-[0.2px] text-[var(--ink)]">Review</span>
        </div>
        <span className="font-ui text-[10px] font-medium uppercase text-[var(--mute)] tracking-[0.4px]">
          {approved} approved · {rejected} rejected · {manualBoxes.length} manual
        </span>
      </div>

      <div className="flex-1 overflow-y-auto pr-1 -mr-1 space-y-4 p-4">
        {sortedPages.length === 0 && (
          <div className="text-center py-10 text-[var(--mute)] font-body text-[13px]">
            No redactions found.
          </div>
        )}
        {sortedPages.map((page) => (
          <div key={page}>
            <p className="font-ui text-[10px] font-medium uppercase tracking-[0.4px] text-[var(--mute)] mb-2">
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
                    className={`w-full text-left rounded-[var(--radius-md)] border p-3 transition-colors ${
                      isSelected
                        ? "bg-[var(--surface-card)] border-[var(--hairline-strong)]"
                        : "bg-[var(--surface-elevated)] border-[var(--hairline)] hover:border-[var(--hairline-strong)]"
                    }`}
                  >
                    <div className="flex items-start gap-2.5">
                      <div
                        className={`mt-0.5 w-2 h-2 rounded-full shrink-0 ${
                          manual
                            ? "bg-[var(--accent-blue)]"
                            : item.status === "approved"
                            ? "bg-[var(--accent-green)]"
                            : "bg-[var(--ash)]"
                        }`}
                      />
                      <div className="flex-1 min-w-0">
                        <p className="font-heading text-[12px] font-medium text-[var(--ink)] truncate">
                          {manual ? "Manual redaction" : item.text || item.detector}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="font-ui text-[10px] font-medium uppercase px-1.5 py-0.5 rounded-[var(--radius-xs)] bg-[var(--surface)] text-[var(--mute)] border border-[var(--hairline)]">
                            {manual ? "manual" : item.detector}
                          </span>
                          {!manual && (
                            <span
                              className={`font-ui text-[10px] font-medium uppercase px-1.5 py-0.5 rounded-[var(--radius-xs)] border ${
                                item.confidence === "high"
                                  ? "bg-[var(--accent-green-soft)] text-[var(--accent-green)] border-[var(--accent-green)]/20"
                                  : item.confidence === "medium"
                                  ? "bg-[var(--accent-yellow-soft)] text-[var(--accent-yellow)] border-[var(--accent-yellow)]/20"
                                  : "bg-[var(--surface)] text-[var(--mute)] border-[var(--hairline)]"
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
                          color="green"
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
    </Card>
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
  color: "green" | "slate" | "red";
  title: string;
}) {
  const colorStyles = {
    green: active
      ? "bg-[var(--accent-green)] text-[var(--on-dark)] border-transparent"
      : "text-[var(--accent-green)] bg-[var(--surface)] border-[var(--hairline)]",
    slate: active
      ? "bg-[var(--ash)] text-[var(--on-dark)] border-transparent"
      : "text-[var(--mute)] bg-[var(--surface)] border-[var(--hairline)]",
    red: "text-[var(--accent-red)] bg-[var(--surface)] border-[var(--hairline)]",
  };

  return (
    <div
      role="button"
      title={title}
      onClick={onClick}
      className={`flex items-center justify-center w-7 h-7 rounded-[var(--radius-sm)] text-[11px] cursor-pointer ${colorStyles[color]}`}
    >
      {children}
    </div>
  );
}
