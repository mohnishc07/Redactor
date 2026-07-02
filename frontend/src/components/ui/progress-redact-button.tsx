"use client";

import React, { useRef, useState } from "react";
import { IconBolt, IconCheck } from "@tabler/icons-react";

interface ProgressRedactButtonProps {
  onClick: () => Promise<void>;
  disabled?: boolean;
}

type ButtonState = "idle" | "loading" | "success";

const MINIMUM_ANIMATION_MS = 2000;

export function ProgressRedactButton({ onClick, disabled = false }: ProgressRedactButtonProps) {
  const [state, setState] = useState<ButtonState>("idle");
  const startTimeRef = useRef<number>(0);

  const handleClick = async () => {
    if (state !== "idle" || disabled) return;

    setState("loading");
    startTimeRef.current = performance.now();

    try {
      await onClick();
    } catch {
      setState("idle");
      return;
    }

    const elapsed = performance.now() - startTimeRef.current;
    const remaining = Math.max(0, MINIMUM_ANIMATION_MS - elapsed);

    if (remaining > 0) {
      await new Promise((resolve) => setTimeout(resolve, remaining));
    }

    setState("success");
  };

  const progressWidth = state === "loading" ? "100%" : "0%";
  const label =
    state === "idle" ? (
      <span className="flex items-center gap-2">
        <IconBolt className="w-4 h-4" />
        Redact Document
      </span>
    ) : state === "loading" ? (
      <span>Redacting...</span>
    ) : (
      <span className="flex items-center gap-2 text-white">
        <IconCheck className="w-4 h-4" />
        Done
      </span>
    );

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={disabled || state !== "idle"}
      className="group relative w-full overflow-hidden bg-primary text-white py-4 px-6 font-geist text-sm font-medium tracking-wide border border-transparent rounded-full disabled:opacity-50 disabled:cursor-not-allowed hover:brightness-110 hover:shadow-[0_0_30px_rgba(59,130,246,0.25)] transition-all duration-300 ease-out"
    >
      {state === "loading" && (
        <div
          className="absolute inset-y-0 left-0 bg-white/10"
          style={{ width: progressWidth, transition: `width ${MINIMUM_ANIMATION_MS}ms linear` }}
        />
      )}
      {state === "success" && <div className="absolute inset-0 bg-green-600" />}
      <span className="relative z-10 flex items-center justify-center gap-2">{label}</span>
    </button>
  );
}
