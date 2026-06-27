"use client";

import React, { useState, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
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
      // The parent owns error UI; we just return to idle on failure.
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

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={disabled || state !== "idle"}
      className="group relative w-full overflow-hidden rounded-2xl bg-white text-black py-4 px-6 font-semibold text-[14px] tracking-[-0.01em] transition-all duration-200 hover:bg-white/90 disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_8px_32px_rgba(255,255,255,0.12)]"
    >
      {/* Progress bar */}
      <AnimatePresence>
        {state === "loading" && (
          <motion.div
            initial={{ width: "0%" }}
            animate={{ width: "100%" }}
            transition={{ duration: MINIMUM_ANIMATION_MS / 1000, ease: "linear" }}
            className="absolute inset-y-0 left-0 bg-accent/30"
          />
        )}
      </AnimatePresence>

      {/* Success fill */}
      <AnimatePresence>
        {state === "success" && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-emerald-500"
          />
        )}
      </AnimatePresence>

      {/* Content */}
      <span className="relative z-10 flex items-center justify-center gap-2">
        <AnimatePresence mode="wait">
          {state === "idle" && (
            <motion.span
              key="idle"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="flex items-center gap-2"
            >
              <IconBolt className="w-4 h-4 transition-transform group-hover:scale-110" />
              Redact Document
            </motion.span>
          )}
          {state === "loading" && (
            <motion.span
              key="loading"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
            >
              Redacting...
            </motion.span>
          )}
          {state === "success" && (
            <motion.span
              key="success"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="flex items-center gap-2 text-white"
            >
              <IconCheck className="w-4 h-4" />
              Done
            </motion.span>
          )}
        </AnimatePresence>
      </span>
    </button>
  );
}
