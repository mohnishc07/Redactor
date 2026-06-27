export interface DetectionRect {
  page: number;
  text: string;
  detector: string;
  confidence: "high" | "medium" | "low";
  rects: number[][];
}

export interface PreviewReport {
  pages: number;
  detections: DetectionRect[];
  summary: Record<string, Record<string, number>>;
}

export interface PreviewData {
  job_id: string;
  original_pdf_base64: string;
  report: PreviewReport;
}

export interface RedactionResult {
  filename: string;
  pdf_base64: string;
  report: PreviewReport;
}

export interface ReviewDetection extends DetectionRect {
  id: string;
  status: "approved" | "rejected";
}

export interface ManualBox {
  id: string;
  page: number;
  rects: number[][];
  detector: "manual";
  text: string;
  confidence: "high";
}

export type ViewerMode = "pan" | "draw";
