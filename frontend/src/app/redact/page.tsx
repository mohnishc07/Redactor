"use client";

import React, { useState } from "react";
import dynamic from "next/dynamic";
import { motion } from "motion/react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import FileUploadDemo from "@/components/file-upload-demo";
import Navbar from "@/components/navbar";
import Footer from "@/components/footer";
import { IconShieldCheck, IconArrowLeft } from "@tabler/icons-react";
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
    <div className="min-h-screen bg-black text-white flex flex-col">
      <Navbar />

      {/* Subtle ambient glow */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-primary/10 rounded-full blur-[120px] opacity-30" />
      </div>

      <main className="relative z-10 flex-1 flex flex-col px-4 md:px-6 pt-28 pb-6">
        {!preview ? (
          <>
            <div className="max-w-[1280px] mx-auto w-full flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-6">
              <div>
                <h1 className="text-2xl md:text-3xl font-semibold text-white font-clash">
                  Secure redaction workspace
                </h1>
                <p className="text-sm text-gray-400 font-geist mt-1">
                  Configure detectors, preview results, and download clean documents.
                </p>
              </div>
              <Badge variant="info" className="flex items-center gap-1.5 shrink-0">
                <IconShieldCheck className="w-3.5 h-3.5" />
                Preview mode
              </Badge>
            </div>

            {previewError && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                className="max-w-[1280px] mx-auto w-full mb-5 rounded-lg border border-red-500/20 bg-red-500/10 p-4 font-geist text-sm text-white"
              >
                {previewError}
              </motion.div>
            )}

            <div className="flex-1 flex items-center justify-center">
              <Card className="w-full max-w-[1280px] p-5 md:p-8 border-white/10 bg-card">
                <FileUploadDemo
                  onPreview={handlePreview}
                  previewLoading={previewLoading}
                />
              </Card>
            </div>
          </>
        ) : (
          <>
            <div className="max-w-[1280px] mx-auto w-full mb-4">
              <button
                onClick={handleReset}
                className="inline-flex items-center gap-1.5 text-sm text-gray-400 hover:text-white transition-colors font-geist"
              >
                <IconArrowLeft className="w-4 h-4" />
                Back to workspace
              </button>
            </div>
            <PreviewWorkspace
              preview={preview}
              fileName={previewFileName}
              options={previewOptions}
              onReset={handleReset}
            />
          </>
        )}
      </main>

      <div className="relative z-10 px-4 md:px-6 py-4 max-w-[1280px] mx-auto w-full">
        <Card className="py-3 px-5 flex flex-col md:flex-row items-center justify-between gap-2 font-geist text-xs text-gray-400 border-white/10 bg-card">
          <p>Your files are processed by your own backend. Nothing is stored on our servers.</p>
          <p className="text-gray-500">© 2026 Zen Audit</p>
        </Card>
      </div>

      {!preview && <Footer />}
    </div>
  );
}
