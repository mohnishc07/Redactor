"use client";

import { useState } from "react";

export function RedactUploader() {
  const [file, setFile] = useState<File | null>(null);
  const [template, setTemplate] = useState("financial");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!file) return;

    setLoading(true);
    setError("");
    setResult(null);

    const form = new FormData();
    form.append("file", file);
    form.append(
      "options",
      JSON.stringify({
        template,
        text: "[REDACTED]",
        report_format: "json",
        remove_metadata: true,
      })
    );

    try {
      const res = await fetch("/api/redact", { method: "POST", body: form });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Redaction failed");
      setResult(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  function downloadPdf() {
    if (!result?.pdf_base64 || !result?.filename) return;
    const bytes = Uint8Array.from(atob(result.pdf_base64), (c) => c.charCodeAt(0));
    const blob = new Blob([bytes], { type: "application/pdf" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = result.filename;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <label className="block">
        <span className="font-semibold">PDF file</span>
        <input
          type="file"
          accept=".pdf,.xlsx,.xlsm,.docx,application/pdf,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
          onChange={(e) => setFile(e.target.files?.[0] || null)}
          className="block mt-1"
        />
      </label>

      <label className="block">
        <span className="font-semibold">Template</span>
        <select
          value={template}
          onChange={(e) => setTemplate(e.target.value)}
          className="block mt-1 border rounded p-2"
        >
          <option value="pii">General PII</option>
          <option value="financial">Financial / Bank</option>
          <option value="hipaa">HIPAA</option>
          <option value="gdpr">GDPR</option>
        </select>
      </label>

      <button
        type="submit"
        disabled={loading || !file}
        className="bg-blue-600 text-white px-4 py-2 rounded disabled:opacity-50"
      >
        {loading ? "Redacting..." : "Redact PDF"}
      </button>

      {error && <p className="text-red-600">{error}</p>}

      {result && (
        <div className="mt-6 p-4 border rounded bg-gray-50">
          <p className="font-semibold">
            Detections: {result.report.detections.length}
          </p>
          <pre className="text-sm mt-2 overflow-auto max-h-40">
            {JSON.stringify(result.report.summary, null, 2)}
          </pre>
          <button
            type="button"
            onClick={downloadPdf}
            className="mt-4 bg-green-600 text-white px-4 py-2 rounded"
          >
            Download Redacted PDF
          </button>
        </div>
      )}
    </form>
  );
}
