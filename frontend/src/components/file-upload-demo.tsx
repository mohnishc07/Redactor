"use client";

import React, { useState } from "react";
import { FileUpload } from "@/components/ui/file-upload";
import { ProgressRedactButton } from "@/components/ui/progress-redact-button";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
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

export default function FileUploadDemo({ onPreview, previewLoading = false }: FileUploadDemoProps) {
  const [files, setFiles] = useState<File[]>([]);
  const [bulkMode, setBulkMode] = useState(false);
  const [bulkResults, setBulkResults] = useState<
    Array<{ filename: string; pdf_base64: string; fileName: string }> | null
  >(null);
  const [bulkLoading, setBulkLoading] = useState(false);

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
    setFiles((prev) => prev.filter((_, i) => i !== index));
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

    setResult(data);
  };

  const handleBulkRedact = async () => {
    if (files.length === 0 || activeDetectors.length === 0) {
      throw new Error("No files or detectors selected");
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

  const chipButton = (selected: boolean) =>
    selected
      ? "bg-[var(--primary)] text-[var(--on-primary)] border-transparent"
      : "bg-[var(--surface-elevated)] text-[var(--body)] border-[var(--hairline)] hover:border-[var(--hairline-strong)]";

  return (
    <div className="w-full max-w-[1280px] mx-auto space-y-5">
      {/* UPLOAD */}
      <Card className="p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <IconCloudLock className="w-4 h-4 text-[var(--accent-blue)]" />
            <span className="font-heading text-[14px] font-medium tracking-[0.2px] text-[var(--ink)]">Upload</span>
          </div>
          <button
            onClick={() => handleToggleBulkMode(!bulkMode)}
            className={`flex items-center gap-1.5 font-ui text-[11px] font-medium tracking-[0.2px] px-3 py-1.5 rounded-full border ${
              bulkMode
                ? "bg-[var(--primary)] text-[var(--on-primary)] border-transparent"
                : "bg-[var(--surface-elevated)] text-[var(--body)] border-[var(--hairline)]"
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
                    className="font-ui text-[10px] font-medium text-[var(--mute)] px-2.5 py-1 rounded-full border border-[var(--hairline)] bg-[var(--surface-elevated)]"
                  >
                    {fmt}
                  </span>
                ))}
              </div>
            )}
          </>
        ) : (
          <div className="flex flex-col justify-center">
            {bulkMode ? (
              <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1 custom-scrollbar">
                {files.map((file, idx) => (
                  <div
                    key={`${file.name}-${idx}`}
                    className="flex items-center gap-3 p-3 rounded-[var(--radius-md)] bg-[var(--surface-elevated)] border border-[var(--hairline)]"
                  >
                    <div className="w-9 h-9 rounded-[var(--radius-md)] bg-[var(--surface-card)] text-[var(--on-dark)] flex items-center justify-center border border-[var(--hairline)]">
                      <IconFileText className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-heading text-[13px] font-medium text-[var(--ink)] truncate">{file.name}</p>
                      <p className="font-body text-[11px] text-[var(--mute)]">{(file.size / (1024 * 1024)).toFixed(2)} MB</p>
                    </div>
                    <button
                      onClick={() => handleRemoveBulkFile(idx)}
                      className="p-1.5 rounded-[var(--radius-sm)] text-[var(--ash)] bg-[var(--surface)] border border-[var(--hairline)] hover:text-[var(--on-dark)]"
                    >
                      <IconX className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex items-center gap-4 p-4 rounded-[var(--radius-md)] bg-[var(--surface-elevated)] border border-[var(--hairline)]">
                <div className="w-11 h-11 rounded-[var(--radius-md)] bg-[var(--surface-card)] text-[var(--on-dark)] flex items-center justify-center border border-[var(--hairline)]">{fileIcon(files[0].name)}</div>
                <div className="flex-1 min-w-0">
                  <p className="font-heading text-[14px] font-medium text-[var(--ink)] truncate">{files[0].name}</p>
                  <p className="font-body text-[12px] text-[var(--mute)]">
                    {(files[0].size / (1024 * 1024)).toFixed(2)} MB
                  </p>
                </div>
                <button
                  onClick={handleRemoveFile}
                  className="p-2 rounded-[var(--radius-sm)] text-[var(--ash)] bg-[var(--surface)] border border-[var(--hairline)] hover:text-[var(--on-dark)]"
                >
                  <IconX className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        )}
      </Card>

      {/* OPTIONS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* SCOPE */}
        <Card className="p-5 flex flex-col">
          <div className="flex items-center gap-2 mb-5">
            <IconShield className="w-4 h-4 text-[var(--accent-blue)]" />
            <span className="font-heading text-[14px] font-medium tracking-[0.2px] text-[var(--ink)]">Scope</span>
          </div>
          <div className="space-y-5 flex-1">
            <div>
              <p className="font-ui text-[10px] font-medium uppercase text-[var(--mute)] tracking-[0.4px] mb-3">
                Compliance Presets
              </p>
              <div className="grid grid-cols-2 gap-2">
                {Object.keys(TEMPLATE_MAPPING).map((key) => {
                  const selected = template === key;
                  return (
                    <button
                      key={key}
                      onClick={() => handleTemplateSelect(key)}
                      className={`font-ui text-[11px] font-medium uppercase tracking-[0.2px] px-2 py-2.5 rounded-[var(--radius-md)] border transition-colors ${chipButton(selected)}`}
                    >
                      {key.toUpperCase()}
                    </button>
                  );
                })}
              </div>
            </div>
            <div className="flex-1 flex flex-col">
              <p className="font-ui text-[10px] font-medium uppercase text-[var(--mute)] tracking-[0.4px] mb-3">
                Custom Redactions
              </p>
              <textarea
                value={customMasks}
                onChange={(e) => setCustomMasks(e.target.value)}
                placeholder="Type names, sentences, or strings — one per line"
                className="flex-1 min-h-[100px] w-full rounded-[var(--radius-md)] border border-[var(--hairline)] bg-[var(--surface-elevated)] p-4 font-body text-[14px] text-[var(--on-dark)] placeholder:text-[var(--ash)] focus:outline-none focus:border-[var(--hairline-strong)] resize-none"
              />
            </div>
          </div>
        </Card>

        {/* DETECTORS */}
        <Card className="p-5 flex flex-col">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2">
              <IconFingerprint className="w-4 h-4 text-[var(--accent-blue)]" />
              <span className="font-heading text-[14px] font-medium tracking-[0.2px] text-[var(--ink)]">Detectors</span>
            </div>
            <span className="font-ui text-[10px] font-medium uppercase text-[var(--mute)] tracking-[0.4px]">
              {activeDetectors.length} active
            </span>
          </div>
          <div className="space-y-4 overflow-y-auto pr-1 custom-scrollbar flex-1">
            {DETECTOR_CATEGORIES.map((cat) => (
              <div key={cat.id}>
                <div className="mb-2">
                  <p className="font-ui text-[10px] font-medium uppercase text-[var(--mute)] tracking-[0.4px]">
                    {cat.name}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {cat.detectors.map((det) => {
                    const active = activeDetectors.includes(det.id);
                    const Icon = det.icon;
                    return (
                      <button
                        key={det.id}
                        onClick={() => handleDetectorToggle(det.id)}
                        className={`flex items-center gap-1.5 font-ui text-[11px] font-medium tracking-[0.2px] px-2.5 py-1.5 rounded-full border transition-colors ${
                          active
                            ? "bg-[var(--primary)] text-[var(--on-primary)] border-transparent"
                            : "bg-[var(--surface-elevated)] text-[var(--mute)] border-[var(--hairline)] hover:border-[var(--hairline-strong)]"
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
        </Card>

        {/* REFINE & RUN */}
        <Card className="p-5 flex flex-col">
          <div className="flex items-center gap-2 mb-5">
            <IconBolt className="w-4 h-4 text-[var(--accent-blue)]" />
            <span className="font-heading text-[14px] font-medium tracking-[0.2px] text-[var(--ink)]">Refine & Run</span>
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
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-[var(--radius-md)] border cursor-pointer transition-colors ${
                    opt.state ? "bg-[var(--surface-elevated)] border-[var(--hairline)]" : "bg-transparent border-[var(--hairline-soft)] hover:border-[var(--hairline)]"
                  }`}
                >
                  <Icon className={`w-4 h-4 ${opt.state ? "text-[var(--accent-blue)]" : "text-[var(--ash)]"}`} />
                  <span className={`font-body text-[13px] ${opt.state ? "text-[var(--on-dark)]" : "text-[var(--mute)]"}`}>
                    {opt.label}
                  </span>
                  <input
                    type="checkbox"
                    checked={opt.state}
                    onChange={(e) => opt.setter(e.target.checked)}
                    className="ml-auto w-4 h-4 rounded-[var(--radius-xs)] border-[var(--hairline)] bg-[var(--surface-elevated)] text-[var(--primary)] focus:ring-0 focus:ring-offset-0"
                  />
                </label>
              );
            })}
          </div>

          <div className="pt-4 space-y-3">
            {errorMessage && (
              <div className="rounded-[var(--radius-lg)] border border-[var(--accent-red)]/20 bg-[var(--accent-red-soft)] p-4 flex items-start gap-3 text-[var(--on-dark)]">
                <IconAlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-[var(--accent-red)]" />
                <p className="font-body text-[12px] leading-relaxed">{errorMessage}</p>
              </div>
            )}

            {result && !bulkMode && (
              <div className="rounded-[var(--radius-lg)] border border-[var(--accent-green)]/20 bg-[var(--accent-green-soft)] p-4">
                <div className="flex items-center gap-2 mb-2">
                  <IconCheck className="w-4 h-4 text-[var(--accent-green)]" />
                  <p className="font-heading text-[13px] font-medium text-[var(--ink)]">
                    {result.report?.detections?.length ?? 0} items redacted
                  </p>
                </div>
                <p className="font-body text-[11px] text-[var(--mute)] mb-3">
                  across {result.report?.pages ?? "—"} page{result.report?.pages === 1 ? "" : "s"}
                </p>
                <div className="flex gap-2">
                  <Button onClick={downloadRedactedFile} className="flex-1 !rounded-[var(--radius-md)]">
                    <IconDownload className="w-3.5 h-3.5" />
                    Download
                  </Button>
                  <Button variant="tertiary" onClick={handleReset} className="flex-1 !rounded-[var(--radius-md)]">
                    <IconRefresh className="w-3.5 h-3.5" />
                    Reset
                  </Button>
                </div>
              </div>
            )}

            {bulkResults && bulkMode && (
              <div className="rounded-[var(--radius-lg)] border border-[var(--accent-green)]/20 bg-[var(--accent-green-soft)] p-4 max-h-[260px] overflow-y-auto custom-scrollbar">
                <div className="flex items-center gap-2 mb-3">
                  <IconCheck className="w-4 h-4 text-[var(--accent-green)]" />
                  <p className="font-heading text-[13px] font-medium text-[var(--ink)]">
                    {bulkResults.length} file{bulkResults.length === 1 ? "" : "s"} redacted
                  </p>
                </div>
                <div className="space-y-2 mb-3">
                  {bulkResults.map((item, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-2.5 rounded-[var(--radius-md)] bg-[var(--surface-elevated)] border border-[var(--hairline)]"
                    >
                      <span className="font-body text-[12px] text-[var(--on-dark)] truncate max-w-[140px]">{item.fileName}</span>
                      <button
                        onClick={() => downloadBulkFile(item)}
                        className="flex items-center gap-1 font-ui text-[11px] font-medium tracking-[0.2px] bg-[var(--primary)] text-[var(--on-primary)] px-2.5 py-1.5 rounded-[var(--radius-md)]"
                      >
                        <IconDownload className="w-3 h-3" />
                        Download
                      </button>
                    </div>
                  ))}
                </div>
                <Button variant="tertiary" onClick={handleReset} className="w-full !rounded-[var(--radius-md)]">
                  <IconRefresh className="w-3.5 h-3.5" />
                  Reset
                </Button>
              </div>
            )}

            <div className="flex flex-col gap-2">
              {!bulkMode && files.length > 0 && files[0].name.toLowerCase().endsWith(".pdf") && onPreview && (
                <Button
                  type="button"
                  variant="tertiary"
                  onClick={async () => {
                    if (files.length === 0 || activeDetectors.length === 0) return;
                    await onPreview(files[0], buildOptions());
                  }}
                  disabled={files.length === 0 || activeDetectors.length === 0 || previewLoading}
                  className="w-full !rounded-[var(--radius-md)]"
                >
                  {previewLoading ? (
                    <>
                      <span className="w-4 h-4 border-2 border-[var(--ash)]/30 border-t-[var(--on-dark)] rounded-full animate-spin" />
                      Analyzing...
                    </>
                  ) : (
                    <>
                      <IconEye className="w-4 h-4" />
                      Preview & Review
                    </>
                  )}
                </Button>
              )}
              {bulkMode ? (
                <Button
                  type="button"
                  onClick={handleBulkRedact}
                  disabled={files.length === 0 || activeDetectors.length === 0 || bulkLoading}
                  className="w-full !py-4 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {bulkLoading ? (
                    <>
                      <span className="w-4 h-4 border-2 border-[var(--on-primary)]/30 border-t-[var(--on-primary)] rounded-full animate-spin" />
                      Redacting {files.length} files...
                    </>
                  ) : (
                    <>
                      <IconPackages className="w-4 h-4" />
                      Bulk Redact {files.length > 0 ? `(${files.length})` : ""}
                    </>
                  )}
                </Button>
              ) : (
                <ProgressRedactButton
                  onClick={handleRedact}
                  disabled={files.length === 0 || activeDetectors.length === 0}
                />
              )}
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
