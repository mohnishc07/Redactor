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

const cardBase =
  "rounded-[28px] border border-white/[0.08] bg-[#080C10]/50 backdrop-blur-2xl p-5 shadow-xl";

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
    <div className={`${cardBase} flex flex-col h-full max-h-full`}>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-[15px] font-medium text-white">Review</h3>
          <p className="text-[12px] text-white/40 mt-0.5">
            {approved} approved · {rejected} rejected · {manualBoxes.length} manual
          </p>
        </div>
        <div className="p-2 rounded-xl bg-accent/15 text-accent">
          <IconHandClick className="w-4 h-4" />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto pr-1 -mr-1 space-y-4 custom-scrollbar">
        {sortedPages.length === 0 && (
          <div className="text-center py-10 text-white/30 text-[13px]">
            No redactions found.
          </div>
        )}
        {sortedPages.map((page) => (
          <div key={page}>
            <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-white/30 mb-2">
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
                    className={`w-full text-left rounded-2xl border p-3 transition-all duration-200 ${
                      isSelected
                        ? "bg-white/[0.08] border-accent/40"
                        : "bg-white/[0.03] border-white/[0.06] hover:bg-white/[0.06]"
                    }`}
                  >
                    <div className="flex items-start gap-2.5">
                      <div
                        className={`mt-0.5 w-2 h-2 rounded-full shrink-0 ${
                          manual
                            ? "bg-[#5B8AFF]"
                            : item.status === "approved"
                            ? "bg-amber-400"
                            : "bg-slate-500"
                        }`}
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-[12px] text-white/90 truncate">
                          {manual ? "Manual redaction" : item.text || item.detector}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-white/[0.06] text-white/50 capitalize">
                            {manual ? "manual" : item.detector}
                          </span>
                          {!manual && (
                            <span
                              className={`text-[10px] px-1.5 py-0.5 rounded-md capitalize ${
                                item.confidence === "high"
                                  ? "bg-emerald-500/10 text-emerald-400"
                                  : item.confidence === "medium"
                                  ? "bg-amber-500/10 text-amber-400"
                                  : "bg-white/[0.06] text-white/50"
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
                          color="amber"
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
  color: "amber" | "slate" | "red";
  title: string;
}) {
  const colorStyles = {
    amber: active
      ? "bg-amber-500 text-black border-amber-500"
      : "text-amber-400 border-white/[0.08] hover:bg-amber-500/10",
    slate: active
      ? "bg-slate-500 text-white border-slate-500"
      : "text-slate-300 border-white/[0.08] hover:bg-slate-500/10",
    red: "text-red-400 border-white/[0.08] hover:bg-red-500/10",
  };

  return (
    <div
      role="button"
      title={title}
      onClick={onClick}
      className={`flex items-center justify-center w-7 h-7 rounded-lg border text-[11px] transition-colors cursor-pointer ${colorStyles[color]}`}
    >
      {children}
    </div>
  );
}
