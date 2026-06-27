"use client";

import React, { useState } from "react";
import { usePaywall } from "@/hooks/use-paywall";
import { motion } from "motion/react";
import { FileUpload } from "@/components/ui/file-upload";
import { ProgressRedactButton } from "@/components/ui/progress-redact-button";
import {
  IconPhone,
  IconMail,
  IconLink,
  IconUser,
  IconMapPin,
  IconId,
  IconFingerprint,
  IconWorld,
  IconBuildingBank,
  IconBinary,
  IconCpu,
  IconSend,
  IconFileText,
  IconCoin,
  IconUserCheck,
  IconCreditCard,
  IconCalendar,
  IconClock,
  IconKey,
  IconBarcode,
  IconQrcode,
  IconCheck,
  IconDownload,
  IconRefresh,
  IconFileSpreadsheet,
  IconFileTypeDocx,
  IconAlertCircle,
  IconBolt,
  IconShield,
  IconEye,
  IconBrain,
  IconFileDescription,
  IconX,
  IconCloudLock,
  IconPackages,
  IconLock,
} from "@tabler/icons-react";

const TEMPLATE_MAPPING: Record<string, string[]> = {
  pii: ["phone", "email", "ssn", "passport", "name", "address"],
  financial: ["account", "ifsc", "micr", "upi", "pan", "aadhaar", "bic", "iban", "creditcard", "balance"],
  hipaa: ["phone", "email", "ssn", "name", "address", "date"],
  gdpr: ["phone", "email", "name", "address", "passport", "ssn"],
};

const areSetsEqual = (a: string[], b: string[]) => {
  if (a.length !== b.length) return false;
  const setA = new Set(a);
  return b.every((x) => setA.has(x));
};

const DETECTOR_CATEGORIES = [
  {
    id: "contact",
    name: "Contact",
    detectors: [
      { id: "phone", name: "Phone", icon: IconPhone },
      { id: "email", name: "Email", icon: IconMail },
      { id: "link", name: "Links", icon: IconLink },
    ],
  },
  {
    id: "identity",
    name: "Identity",
    detectors: [
      { id: "name", name: "Names", icon: IconUser },
      { id: "address", name: "Addresses", icon: IconMapPin },
      { id: "customer_id", name: "Customer ID", icon: IconId },
      { id: "ssn", name: "SSN", icon: IconFingerprint },
      { id: "passport", name: "Passport", icon: IconWorld },
    ],
  },
  {
    id: "financial-in",
    name: "India Financial",
    detectors: [
      { id: "account", name: "Account", icon: IconBuildingBank },
      { id: "ifsc", name: "IFSC", icon: IconBinary },
      { id: "micr", name: "MICR", icon: IconCpu },
      { id: "upi", name: "UPI", icon: IconSend },
      { id: "pan", name: "PAN", icon: IconFileText },
      { id: "aadhaar", name: "Aadhaar", icon: IconFingerprint },
      { id: "balance", name: "Balance", icon: IconCoin },
      { id: "receiver", name: "Receiver", icon: IconUserCheck },
    ],
  },
  {
    id: "financial-global",
    name: "Global Financial",
    detectors: [
      { id: "iban", name: "IBAN", icon: IconWorld },
      { id: "bic", name: "BIC", icon: IconBuildingBank },
      { id: "creditcard", name: "Cards", icon: IconCreditCard },
    ],
  },
  {
    id: "temporal",
    name: "Temporal",
    detectors: [
      { id: "date", name: "Dates", icon: IconCalendar },
      { id: "timestamp", name: "Time", icon: IconClock },
    ],
  },
  {
    id: "security",
    name: "Security",
    detectors: [
      { id: "secret", name: "Secrets", icon: IconKey },
      { id: "barcode", name: "Barcodes", icon: IconBarcode },
      { id: "qrcode", name: "QR Codes", icon: IconQrcode },
    ],
  },
];

const ALL_DETECTOR_IDS = DETECTOR_CATEGORIES.flatMap((c) => c.detectors).map((d) => d.id);

interface RedactionResult {
  filename: string;
  pdf_base64: string;
  report: {
    pages: number;
    detections: Array<{
      page: number;
      text: string;
      detector: string;
      confidence: string;
      rects?: number[][];
    }>;
    summary: Record<string, Record<string, number>>;
  };
}

interface FileUploadDemoProps {
  onPreview?: (file: File, options: Record<string, unknown>) => Promise<void>;
  previewLoading?: boolean;
}

const cardBase =
  "rounded-[28px] border border-white/[0.08] bg-[#080C10]/50 backdrop-blur-2xl p-6 shadow-xl flex flex-col";

export default function FileUploadDemo({ onPreview, previewLoading = false }: FileUploadDemoProps) {
  const [files, setFiles] = useState<File[]>([]);
  const [bulkMode, setBulkMode] = useState(false);
  const [bulkResults, setBulkResults] = useState<
    Array<{ filename: string; pdf_base64: string; fileName: string }> | null
  >(null);
  const [bulkLoading, setBulkLoading] = useState(false);
  const paywall = usePaywall();

  const [template, setTemplate] = useState<string | null>("pii");
  const [activeDetectors, setActiveDetectors] = useState<string[]>(TEMPLATE_MAPPING.pii);
  const [customMasks, setCustomMasks] = useState("");
  const [removeMetadata, setRemoveMetadata] = useState(true);
  const [enableOCR, setEnableOCR] = useState(false);
  const [enableML, setEnableML] = useState(false);
  const [aggressive, setAggressive] = useState(false);
  const [generateReport, setGenerateReport] = useState(true);

  const [result, setResult] = useState<RedactionResult | null>(null);
  const [errorMessage, setErrorMessage] = useState("");

  const handleFileUpload = (newFiles: File[]) => {
    if (newFiles.length > 0) {
      setFiles(newFiles);
      setResult(null);
      setBulkResults(null);
      setErrorMessage("");
    }
  };

  const handleRemoveFile = () => {
    setFiles([]);
    setResult(null);
    setBulkResults(null);
    setErrorMessage("");
  };

  const handleRemoveBulkFile = (index: number) => {
    setFiles((prev) => {
      const next = prev.filter((_, i) => i !== index);
      return next;
    });
    setResult(null);
    setBulkResults(null);
  };

  const handleToggleBulkMode = (enabled: boolean) => {
    setBulkMode(enabled);
    setFiles([]);
    setResult(null);
    setBulkResults(null);
    setErrorMessage("");
  };

  const handleTemplateSelect = (tempId: string) => {
    setTemplate(tempId);
    setActiveDetectors(TEMPLATE_MAPPING[tempId] || []);
  };

  const handleDetectorToggle = (detId: string) => {
    const next = activeDetectors.includes(detId)
      ? activeDetectors.filter((id) => id !== detId)
      : [...activeDetectors, detId];
    setActiveDetectors(next);
    let matched: string | null = null;
    for (const [key, list] of Object.entries(TEMPLATE_MAPPING)) {
      if (areSetsEqual(next, list)) {
        matched = key;
        break;
      }
    }
    setTemplate(matched);
  };

  const buildOptions = () => {
    const masks = customMasks
      .split("\n")
      .map((s) => s.trim())
      .filter(Boolean);
    const options: Record<string, unknown> = {
      detectors: activeDetectors,
      ml: enableML,
      ml_detectors: ["name", "address"],
      aggressive,
      report_format: generateReport ? "json" : "none",
      remove_metadata: removeMetadata,
      ocr: enableOCR,
      custom_masks: masks,
    };
    if (template) options.template = template;
    return options;
  };

  const handleRedact = async () => {
    if (files.length === 0 || activeDetectors.length === 0) {
      throw new Error("No file or detectors selected");
    }
    if (!paywall.canUpload(1)) {
      const message = `Paywall active: max ${paywall.maxUploadsPerMinute} PDF${
        paywall.maxUploadsPerMinute === 1 ? "" : "s"
      } per minute. Please wait.`;
      setErrorMessage(message);
      throw new Error(message);
    }
    setErrorMessage("");
    setResult(null);

    const form = new FormData();
    form.append("file", files[0]);
    form.append("options", JSON.stringify(buildOptions()));

    const res = await fetch("/api/redact", { method: "POST", body: form });
    const data = await res.json();

    if (!res.ok) {
      const message =
        data.error?.message || data.detail?.message || data.detail || data.message || "Redaction failed";
      setErrorMessage(message);
      throw new Error(message);
    }

    paywall.recordUpload(1);
    setResult(data);
  };

  const handleBulkRedact = async () => {
    if (files.length === 0 || activeDetectors.length === 0) {
      throw new Error("No files or detectors selected");
    }
    if (!paywall.canUpload(files.length)) {
      const message = `Paywall active: you selected ${files.length} file${
        files.length === 1 ? "" : "s"
      }, but only ${paywall.remainingUploads} upload${
        paywall.remainingUploads === 1 ? "" : "s"
      } remaining this minute.`;
      setErrorMessage(message);
      throw new Error(message);
    }
    setErrorMessage("");
    setBulkResults(null);
    setBulkLoading(true);

    const results: Array<{ filename: string; pdf_base64: string; fileName: string }> = [];
    const options = buildOptions();

    try {
      for (const file of files) {
        const form = new FormData();
        form.append("file", file);
        form.append("options", JSON.stringify(options));
        const res = await fetch("/api/redact", { method: "POST", body: form });
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.detail || data.error?.message || `Failed to redact ${file.name}`);
        }
        results.push({ filename: data.filename, pdf_base64: data.pdf_base64, fileName: file.name });
      }
      paywall.recordUpload(files.length);
      setBulkResults(results);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Bulk redaction failed";
      setErrorMessage(message);
      throw err;
    } finally {
      setBulkLoading(false);
    }
  };

  const downloadBulkFile = (item: { filename: string; pdf_base64: string }) => {
    try {
      const bytes = Uint8Array.from(atob(item.pdf_base64), (c) => c.charCodeAt(0));
      const blob = new Blob([bytes], { type: mimeTypeFor(item.filename) });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = item.filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch {
      setErrorMessage("Failed to download file");
    }
  };

  const mimeTypeFor = (filename: string) => {
    const lower = filename.toLowerCase();
    if (lower.endsWith(".pdf")) return "application/pdf";
    if (lower.endsWith(".xlsx") || lower.endsWith(".xlsm")) return "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
    if (lower.endsWith(".xls")) return "application/vnd.ms-excel";
    if (lower.endsWith(".docx")) return "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
    return "application/octet-stream";
  };

  const downloadRedactedFile = () => {
    if (!result) return;
    try {
      const bytes = Uint8Array.from(atob(result.pdf_base64), (c) => c.charCodeAt(0));
      const blob = new Blob([bytes], { type: mimeTypeFor(result.filename) });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = result.filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      setErrorMessage("Failed to download file: " + message);
    }
  };

  const handleReset = () => {
    setFiles([]);
    setBulkMode(false);
    setTemplate("pii");
    setActiveDetectors(TEMPLATE_MAPPING.pii);
    setCustomMasks("");
    setRemoveMetadata(true);
    setEnableOCR(false);
    setEnableML(false);
    setAggressive(false);
    setGenerateReport(true);
    setResult(null);
    setBulkResults(null);
    setErrorMessage("");
  };

  const fileIcon = (name: string) => {
    const lower = name.toLowerCase();
    if (lower.endsWith(".xls") || lower.endsWith(".xlsx") || lower.endsWith(".xlsm")) return <IconFileSpreadsheet className="w-5 h-5" />;
    if (lower.endsWith(".docx")) return <IconFileTypeDocx className="w-5 h-5" />;
    return <IconFileText className="w-5 h-5" />;
  };

  return (
    <div className="w-full max-w-[1280px] mx-auto">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 h-full">
        {/* TOP-LEFT: UPLOAD */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className={`${cardBase} relative`}
        >
          <div className="flex items-center gap-3 mb-5">
            <div className="p-2.5 rounded-xl bg-accent/15 text-accent">
              <IconCloudLock className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-[16px] font-medium text-white">Upload</h3>
              <p className="text-[12px] text-white/40">Secure, client-side validation</p>
            </div>
          </div>

          <div className="flex-1 flex flex-col justify-center">
            <div className="flex items-center justify-between mb-4">
              <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-white/40">
                Mode
              </span>
              <button
                onClick={() => handleToggleBulkMode(!bulkMode)}
                className={`flex items-center gap-1.5 text-[11px] font-medium px-2.5 py-1.5 rounded-lg border transition-all ${
                  bulkMode
                    ? "bg-accent/15 text-accent border-accent/30"
                    : "bg-white/[0.04] text-white/60 border-white/[0.08] hover:bg-white/[0.08]"
                }`}
              >
                <IconPackages className="w-3.5 h-3.5" />
                {bulkMode ? "Bulk (max 5)" : "Single file"}
              </button>
            </div>

            {files.length === 0 ? (
              <>
                <FileUpload
                  onChange={handleFileUpload}
                  multiple={bulkMode}
                  maxFiles={5}
                  accept={bulkMode ? ".pdf" : ".pdf,.xls,.xlsx,.xlsm,.docx"}
                  allowedExtensions={bulkMode ? [".pdf"] : undefined}
                  label={bulkMode ? "Drop up to 5 PDFs, or click to browse" : undefined}
                  sublabel={bulkMode ? "PDF only — up to 5 files, 50 MB each" : undefined}
                />
                {!bulkMode && (
                  <div className="flex flex-wrap items-center justify-center gap-2 mt-5">
                    {["PDF", "Excel", "Word"].map((fmt) => (
                      <span
                        key={fmt}
                        className="text-[10px] font-medium uppercase tracking-wider text-white/30 px-2 py-1 rounded-md border border-white/[0.08] bg-white/[0.03]"
                      >
                        {fmt}
                      </span>
                    ))}
                  </div>
                )}
              </>
            ) : (
              <div className="flex-1 flex flex-col justify-center">
                {bulkMode ? (
                  <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1 custom-scrollbar">
                    {files.map((file, idx) => (
                      <div
                        key={`${file.name}-${idx}`}
                        className="flex items-center gap-3 p-3 rounded-2xl border border-white/[0.08] bg-white/[0.04]"
                      >
                        <div className="p-2 rounded-xl bg-accent/15 text-accent">
                          <IconFileText className="w-4 h-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[13px] font-medium text-white truncate">{file.name}</p>
                          <p className="text-[11px] text-white/40">{(file.size / (1024 * 1024)).toFixed(2)} MB</p>
                        </div>
                        <button
                          onClick={() => handleRemoveBulkFile(idx)}
                          className="p-1.5 rounded-lg text-white/40 hover:text-white hover:bg-white/[0.08] transition-colors"
                        >
                          <IconX className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex items-center gap-4 p-4 rounded-2xl border border-white/[0.08] bg-white/[0.04]">
                    <div className="p-3 rounded-xl bg-accent/15 text-accent">{fileIcon(files[0].name)}</div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[14px] font-medium text-white truncate">{files[0].name}</p>
                      <p className="text-[12px] text-white/40">
                        {(files[0].size / (1024 * 1024)).toFixed(2)} MB
                      </p>
                    </div>
                    <button
                      onClick={handleRemoveFile}
                      className="p-2 rounded-xl text-white/40 hover:text-white hover:bg-white/[0.08] transition-colors"
                    >
                      <IconX className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </motion.div>

        {/* TOP-RIGHT: SCOPE */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className={`${cardBase} relative`}
        >
          <div className="flex items-center gap-3 mb-5">
            <div className="p-2.5 rounded-xl bg-accent/15 text-accent">
              <IconShield className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-[16px] font-medium text-white">Scope</h3>
              <p className="text-[12px] text-white/40">Presets + custom redactions</p>
            </div>
          </div>

          <div className="space-y-5 flex-1">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-white/40 mb-3">
                Compliance Presets
              </p>
              <div className="grid grid-cols-4 gap-2">
                {Object.keys(TEMPLATE_MAPPING).map((key) => {
                  const selected = template === key;
                  return (
                    <button
                      key={key}
                      onClick={() => handleTemplateSelect(key)}
                      className={`text-[11px] font-semibold rounded-xl px-2 py-2.5 transition-all duration-200 border ${
                        selected
                          ? "bg-accent text-white border-accent"
                          : "bg-white/[0.04] text-white/70 border-white/[0.08] hover:bg-white/[0.08]"
                      }`}
                    >
                      {key.toUpperCase()}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="flex-1 flex flex-col">
              <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-white/40 mb-3">
                Custom Redactions
              </p>
              <textarea
                value={customMasks}
                onChange={(e) => setCustomMasks(e.target.value)}
                placeholder="Type names, sentences, or strings — one per line"
                className="flex-1 min-h-[100px] w-full rounded-2xl border border-white/[0.08] bg-white/[0.04] p-4 text-[13px] text-white placeholder:text-white/25 focus:outline-none focus:border-accent/40 resize-none"
              />
            </div>
          </div>
        </motion.div>

        {/* BOTTOM-LEFT: DETECTORS */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className={`${cardBase} relative`}
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-accent/15 text-accent">
                <IconFingerprint className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-[16px] font-medium text-white">Detectors</h3>
                <p className="text-[12px] text-white/40">{activeDetectors.length} active</p>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => { setActiveDetectors(ALL_DETECTOR_IDS); setTemplate(null); }}
                className="text-[10px] font-medium text-white/50 hover:text-white transition-colors"
              >
                All
              </button>
              <button
                onClick={() => { setActiveDetectors([]); setTemplate(null); }}
                className="text-[10px] font-medium text-white/50 hover:text-white transition-colors"
              >
                Clear
              </button>
            </div>
          </div>

          <div className="space-y-4 overflow-y-auto pr-1 custom-scrollbar">
            {DETECTOR_CATEGORIES.map((cat) => (
              <div key={cat.id}>
                <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-white/30 mb-2">
                  {cat.name}
                </p>
                <div className="flex flex-wrap gap-2">
                  {cat.detectors.map((det) => {
                    const active = activeDetectors.includes(det.id);
                    const Icon = det.icon;
                    return (
                      <button
                        key={det.id}
                        onClick={() => handleDetectorToggle(det.id)}
                        className={`group flex items-center gap-1.5 text-[11px] font-medium rounded-full px-2.5 py-1.5 border transition-all duration-200 ${
                          active
                            ? "bg-accent/15 text-accent border-accent/40"
                            : "bg-white/[0.04] text-white/55 border-white/[0.08] hover:bg-white/[0.08]"
                        }`}
                      >
                        <Icon className="w-3 h-3" />
                        {det.name}
                        {active && <IconCheck className="w-2.5 h-2.5" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* BOTTOM-RIGHT: REFINE & RUN */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className={`${cardBase} relative`}
        >
          <div className="flex items-center gap-3 mb-5">
            <div className="p-2.5 rounded-xl bg-accent/15 text-accent">
              <IconBolt className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-[16px] font-medium text-white">Refine & Run</h3>
              <p className="text-[12px] text-white/40">Advanced options + redact</p>
            </div>
          </div>

          <div className="space-y-2 flex-1">
            {[
              { id: "removeMetadata", label: "Remove metadata", icon: IconFileDescription, state: removeMetadata, setter: setRemoveMetadata },
              { id: "enableOCR", label: "OCR for scans", icon: IconEye, state: enableOCR, setter: setEnableOCR },
              { id: "enableML", label: "ML detection", icon: IconBrain, state: enableML, setter: setEnableML },
              { id: "aggressive", label: "Aggressive mode", icon: IconShield, state: aggressive, setter: setAggressive },
              { id: "generateReport", label: "Audit report", icon: IconFileText, state: generateReport, setter: setGenerateReport },
            ].map((opt) => {
              const Icon = opt.icon;
              return (
                <label
                  key={opt.id}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl border cursor-pointer transition-all duration-200 ${
                    opt.state ? "bg-white/[0.06] border-white/[0.14]" : "bg-transparent border-white/[0.06] hover:bg-white/[0.03]"
                  }`}
                >
                  <Icon className={`w-4 h-4 ${opt.state ? "text-accent" : "text-white/30"}`} />
                  <span className={`text-[12px] font-medium ${opt.state ? "text-white" : "text-white/60"}`}>
                    {opt.label}
                  </span>
                  <input
                    type="checkbox"
                    checked={opt.state}
                    onChange={(e) => opt.setter(e.target.checked)}
                    className="ml-auto w-4 h-4 rounded border-white/20 bg-white/[0.06] text-accent focus:ring-0 focus:ring-offset-0"
                  />
                </label>
              );
            })}

            <label
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl border cursor-pointer transition-all duration-200 ${
                paywall.enabled
                  ? "bg-white/[0.06] border-white/[0.14]"
                  : "bg-transparent border-white/[0.06] hover:bg-white/[0.03]"
              }`}
            >
              <IconLock className={`w-4 h-4 ${paywall.enabled ? "text-accent" : "text-white/30"}`} />
              <span className={`text-[12px] font-medium ${paywall.enabled ? "text-white" : "text-white/60"}`}>
                Enable paywall
              </span>
              <input
                type="checkbox"
                checked={paywall.enabled}
                onChange={(e) => paywall.setEnabled(e.target.checked)}
                className="ml-auto w-4 h-4 rounded border-white/20 bg-white/[0.06] text-accent focus:ring-0 focus:ring-offset-0"
              />
            </label>
            {paywall.enabled && (
              <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl border border-white/[0.08] bg-white/[0.03]">
                <span className="text-[12px] text-white/60">Max uploads / min</span>
                <input
                  type="number"
                  min={0}
                  max={20}
                  value={paywall.maxUploadsPerMinute}
                  onChange={(e) => paywall.setMaxUploadsPerMinute(parseInt(e.target.value, 10) || 0)}
                  className="ml-auto w-16 bg-white/[0.06] border border-white/[0.12] rounded-lg px-2 py-1 text-[12px] text-white text-center focus:outline-none focus:border-accent/40"
                />
              </div>
            )}
            {paywall.enabled && (
              <p className="text-[11px] text-white/40 px-1">
                {paywall.remainingUploads} upload{paywall.remainingUploads === 1 ? "" : "s"} remaining this minute
              </p>
            )}
          </div>

          <div className="mt-5 space-y-3">
            {errorMessage && (
              <div className="rounded-2xl border border-red-500/20 bg-red-500/[0.08] p-4 flex items-start gap-3">
                <IconAlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                <p className="text-[12px] text-white/70 leading-relaxed">{errorMessage}</p>
              </div>
            )}

            {result && !bulkMode && (
              <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/[0.08] p-4">
                <div className="flex items-center gap-2 mb-2">
                  <IconCheck className="w-4 h-4 text-emerald-400" />
                  <p className="text-[13px] font-medium text-white">
                    {result.report?.detections?.length ?? 0} items redacted
                  </p>
                </div>
                <p className="text-[11px] text-white/50 mb-3">
                  across {result.report?.pages ?? "—"} page{result.report?.pages === 1 ? "" : "s"}
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={downloadRedactedFile}
                    className="flex-1 flex items-center justify-center gap-2 text-[12px] font-medium text-black bg-white rounded-xl py-2.5 hover:bg-white/90 transition-colors"
                  >
                    <IconDownload className="w-3.5 h-3.5" />
                    Download
                  </button>
                  <button
                    onClick={handleReset}
                    className="flex-1 flex items-center justify-center gap-2 text-[12px] font-medium text-white/70 bg-white/[0.06] border border-white/[0.08] rounded-xl py-2.5 hover:bg-white/[0.10] transition-colors"
                  >
                    <IconRefresh className="w-3.5 h-3.5" />
                    Reset
                  </button>
                </div>
              </div>
            )}

            {bulkResults && bulkMode && (
              <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/[0.08] p-4 max-h-[260px] overflow-y-auto custom-scrollbar">
                <div className="flex items-center gap-2 mb-3">
                  <IconCheck className="w-4 h-4 text-emerald-400" />
                  <p className="text-[13px] font-medium text-white">
                    {bulkResults.length} file{bulkResults.length === 1 ? "" : "s"} redacted
                  </p>
                </div>
                <div className="space-y-2 mb-3">
                  {bulkResults.map((item, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-2.5 rounded-xl bg-white/[0.04] border border-white/[0.08]"
                    >
                      <span className="text-[12px] text-white/80 truncate max-w-[140px]">{item.fileName}</span>
                      <button
                        onClick={() => downloadBulkFile(item)}
                        className="flex items-center gap-1 text-[11px] font-medium text-black bg-white rounded-lg px-2 py-1 hover:bg-white/90 transition-colors"
                      >
                        <IconDownload className="w-3 h-3" />
                        Download
                      </button>
                    </div>
                  ))}
                </div>
                <button
                  onClick={handleReset}
                  className="w-full flex items-center justify-center gap-2 text-[12px] font-medium text-white/70 bg-white/[0.06] border border-white/[0.08] rounded-xl py-2.5 hover:bg-white/[0.10] transition-colors"
                >
                  <IconRefresh className="w-3.5 h-3.5" />
                  Reset
                </button>
              </div>
            )}

            <div className="flex flex-col gap-2">
              {!bulkMode && files.length > 0 && files[0].name.toLowerCase().endsWith(".pdf") && onPreview && (
                <button
                  type="button"
                  onClick={async () => {
                    if (files.length === 0 || activeDetectors.length === 0) return;
                    if (!paywall.canUpload(1)) {
                      setErrorMessage(
                        `Paywall active: max ${paywall.maxUploadsPerMinute} PDF${
                          paywall.maxUploadsPerMinute === 1 ? "" : "s"
                        } per minute.`
                      );
                      return;
                    }
                    paywall.recordUpload(1);
                    await onPreview(files[0], buildOptions());
                  }}
                  disabled={files.length === 0 || activeDetectors.length === 0 || previewLoading}
                  className="w-full flex items-center justify-center gap-2 rounded-2xl border border-white/[0.12] bg-white/[0.06] py-3.5 px-6 text-[14px] font-semibold text-white transition-all duration-200 hover:bg-white/[0.10] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {previewLoading ? (
                    <>
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Analyzing...
                    </>
                  ) : (
                    <>
                      <IconEye className="w-4 h-4" />
                      Preview & Review
                    </>
                  )}
                </button>
              )}
              {bulkMode ? (
                <button
                  type="button"
                  onClick={handleBulkRedact}
                  disabled={files.length === 0 || activeDetectors.length === 0 || bulkLoading}
                  className="w-full flex items-center justify-center gap-2 rounded-2xl bg-white text-black py-4 px-6 text-[14px] font-semibold transition-all duration-200 hover:bg-white/90 disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_8px_32px_rgba(255,255,255,0.12)]"
                >
                  {bulkLoading ? (
                    <>
                      <span className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                      Redacting {files.length} files...
                    </>
                  ) : (
                    <>
                      <IconPackages className="w-4 h-4" />
                      Bulk Redact {files.length > 0 ? `(${files.length})` : ""}
                    </>
                  )}
                </button>
              ) : (
                <ProgressRedactButton
                  onClick={handleRedact}
                  disabled={files.length === 0 || activeDetectors.length === 0}
                />
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
