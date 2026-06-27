"use client";

import React, { useState } from "react";
import dynamic from "next/dynamic";
import { motion } from "motion/react";
import Link from "next/link";
import { AuroraBackground } from "@/components/ui/aurora-background";
import FileUploadDemo from "@/components/file-upload-demo";
import { IconArrowLeft, IconShieldCheck } from "@tabler/icons-react";
import type { PreviewData } from "@/lib/types";

const PreviewWorkspace = dynamic(() => import("@/components/preview-workspace"), {
  ssr: false,
});

export default function RedactPage() {
  const [preview, setPreview] = useState<PreviewData | null>(null);
  const [previewFileName, setPreviewFileName] = useState("");
  const [previewOptions, setPreviewOptions] = useState<Record<string, unknown>>({});
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewError, setPreviewError] = useState("");

  const handlePreview = async (file: File, options: Record<string, unknown>) => {
    setPreviewLoading(true);
    setPreviewError("");
    try {
      const form = new FormData();
      form.append("file", file);
      form.append("options", JSON.stringify(options));

      const res = await fetch("/api/preview", { method: "POST", body: form });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.detail || data.error?.message || "Preview failed");
      }
      setPreview(data);
      setPreviewFileName(file.name);
      setPreviewOptions(options);
    } catch (err) {
      setPreviewError(err instanceof Error ? err.message : "Preview failed");
    } finally {
      setPreviewLoading(false);
    }
  };

  const handleReset = () => {
    setPreview(null);
    setPreviewFileName("");
    setPreviewOptions({});
    setPreviewError("");
  };

  return (
    <AuroraBackground className="min-h-screen h-auto">
      <div className="relative z-10 w-full min-h-screen flex flex-col text-white">
        {/* App navbar */}
        <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 md:px-10 h-[68px] bg-[#080C10]/40 backdrop-blur-2xl border-b border-white/[0.06]">
          <Link
            href="/"
            className="font-display text-[17px] font-medium text-white tracking-[-0.02em] flex items-center gap-2.5 select-none"
          >
            <div className="w-7 h-7 rounded-lg bg-accent flex items-center justify-center">
              <svg viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5">
                <circle cx="6" cy="6" r="3" stroke="white" strokeWidth="1.5"/>
                <line x1="6" y1="1" x2="6" y2="3" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
                <line x1="6" y1="9" x2="6" y2="11" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
                <line x1="1" y1="6" x2="3" y2="6" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
                <line x1="9" y1="6" x2="11" y2="6" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
            </div>
            Zen Audit
          </Link>

          <Link
            href="/"
            className="flex items-center gap-1.5 text-[13px] font-medium text-white/60 hover:text-white transition-colors"
          >
            <IconArrowLeft className="w-4 h-4" />
            Back home
          </Link>
        </nav>

        <main className="flex-1 flex flex-col px-6 md:px-10 pt-[92px] pb-8">
          {!preview ? (
            <>
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="text-center mb-6"
              >
                <div className="inline-flex items-center gap-2 text-[12px] font-medium tracking-[0.12em] uppercase text-accent mb-3">
                  <IconShieldCheck className="w-4 h-4" />
                  Secure redaction workspace
                </div>
                <h1 className="font-display text-[28px] md:text-[36px] font-light tracking-[-0.03em] text-white">
                  Configure. Upload. Done.
                </h1>
              </motion.div>

              {previewError && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="max-w-[1280px] mx-auto w-full mb-5 rounded-2xl border border-red-500/20 bg-red-500/[0.08] p-4 text-[13px] text-white/70"
                >
                  {previewError}
                </motion.div>
              )}

              <div className="flex-1 flex items-center justify-center">
                <FileUploadDemo
                  onPreview={handlePreview}
                  previewLoading={previewLoading}
                />
              </div>
            </>
          ) : (
            <PreviewWorkspace
              preview={preview}
              fileName={previewFileName}
              options={previewOptions}
              onReset={handleReset}
            />
          )}
        </main>

        <footer className="px-6 md:px-10 py-5 border-t border-white/[0.06] bg-[#080C10]/40 backdrop-blur-xl">
          <div className="max-w-[1280px] mx-auto flex flex-col md:flex-row items-center justify-between gap-3 text-[12px] text-white/35">
            <p>Your files are processed by your own backend. Nothing is stored on our servers.</p>
            <p>© 2026 Zen Audit</p>
          </div>
        </footer>
      </div>
    </AuroraBackground>
  );
}
