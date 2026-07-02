"use client";

import { motion } from "motion/react";
import React from "react";
import { AuroraBackground } from "@/components/ui/aurora-background";

export default function AuroraBackgroundDemo() {
  return (
    <AuroraBackground>
      <motion.div
        initial={{ opacity: 0.0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{
          delay: 0.3,
          duration: 0.8,
          ease: "easeInOut",
        }}
        className="relative flex flex-col gap-4 items-center justify-center px-4"
      >
        <div className="text-3xl md:text-7xl font-bold text-[var(--text)] text-center">
          Privacy-Grade Redaction.
        </div>
        <div className="font-extralight text-base md:text-4xl text-[var(--text-muted)] py-4">
          One click. Any document.
        </div>
      </motion.div>
    </AuroraBackground>
  );
}
