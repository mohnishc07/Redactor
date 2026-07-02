"use client";

import React, { useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { AuroraBackground } from "@/components/ui/aurora-background";
import FileUploadDemo from "@/components/file-upload-demo";
import ThemeToggle from "@/components/theme-toggle";
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
    <AuroraBackground>
      <div className="relative z-10 w-full min-h-screen flex flex-col text-[var(--text)]">
        {/* App navbar */}
        <nav className="fixed top-4 left-1/2 -translate-x-1/2 z-50 flex items-center justify-between px-4 h-14 w-[calc(100%-2rem)] max-w-[1280px] rounded-full border border-[var(--border)] bg-[var(--surface-strong)] text-[var(--text)] backdrop-blur-xl shadow-[var(--shadow-sm)]">
          <Link
            href="/"
            className="font-display text-[18px] font-medium tracking-tight flex items-center gap-2 select-none"
          >
            <span className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-[var(--accent)] text-white font-ui text-[11px] font-bold">
              ZA
            </span>
            Zen Audit
          </Link>

          <div className="flex items-center gap-3">
            <ThemeToggle />
            <Link
              href="/"
              className="hidden sm:inline-flex items-center gap-1.5 font-ui text-[12px] font-semibold uppercase tracking-wide text-[var(--text-muted)]"
            >
              <IconArrowLeft className="w-4 h-4" />
              Back home
            </Link>
          </div>
        </nav>

        <main className="flex-1 flex flex-col px-4 pt-28 pb-6">
          {!preview ? (
            <>
              <header className="max-w-[1280px] mx-auto w-full flex items-center justify-between gap-2 mb-6 glass !py-3 !px-5">
                <p className="font-heading text-[14px] md:text-[16px] font-semibold tracking-tight">
                  Secure redaction workspace
                </p>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-[var(--accent-soft)]/20 text-[var(--accent)] font-ui text-[11px] font-semibold px-3 py-1 border border-[var(--border)]">
                  <IconShieldCheck className="w-3.5 h-3.5" />
                  Preview mode
                </span>
              </header>

              {previewError && (
                <div className="max-w-[1280px] mx-auto w-full mb-5 glass !bg-[var(--accent)]/10 !border-[var(--accent)]/20 p-4 font-body text-[13px] text-[var(--text)]">
                  {previewError}
                </div>
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

        <footer className="px-4 py-4 max-w-[1280px] mx-auto w-full">
          <div className="glass !py-3 !px-5 flex flex-col md:flex-row items-center justify-between gap-2 font-body text-[12px] text-[var(--text-muted)]">
            <p>Your files are processed by your own backend. Nothing is stored on our servers.</p>
            <p>© 2026 Zen Audit</p>
          </div>
        </footer>
      </div>
    </AuroraBackground>
  );
}
