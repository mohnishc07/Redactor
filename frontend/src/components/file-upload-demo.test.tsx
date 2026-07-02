import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, act, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import FileUploadDemo from "./file-upload-demo";

global.URL.createObjectURL = vi.fn(() => "mock-url");
global.URL.revokeObjectURL = vi.fn();
global.fetch = vi.fn();

const mockClick = vi.fn();
const originalCreateElement = document.createElement.bind(document);
document.createElement = (tagName: string) => {
  const element = originalCreateElement(tagName);
  if (tagName === "a") {
    element.click = mockClick;
  }
  return element;
};

const createMockFile = (name: string, type: string, size = 1024 * 1024) => {
  const file = new File(["dummy content"], name, { type });
  Object.defineProperty(file, "size", { value: size });
  return file;
};

const mockFetch = global.fetch as ReturnType<typeof vi.fn>;

const successResponse = {
  ok: true,
  status: 200,
  json: () =>
    Promise.resolve({
      filename: "report_redacted.pdf",
      pdf_base64: "UmVkYWN0ZWQgY29udGVudA==",
      report: {
        pages: 2,
        detections: [
          { page: 1, text: "foo@bar.com", detector: "email", confidence: "high" },
          { page: 2, text: "123-45-6789", detector: "ssn", confidence: "high" },
        ],
        summary: {
          email: { high: 1 },
          ssn: { high: 1 },
        },
      },
    }),
} as Response;

const uploadFile = async (container: HTMLElement, name = "report.pdf") => {
  const fileInput = container.querySelector('input[type="file"]') as HTMLInputElement;
  const file = createMockFile(name, "application/pdf");
  await act(async () => {
    fireEvent.change(fileInput, { target: { files: [file] } });
  });
};

describe("FileUploadDemo", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFetch.mockReset();
  });

  it("renders the four quadrant cards", () => {
    render(<FileUploadDemo />);
    expect(screen.getByText("Upload")).toBeInTheDocument();
    expect(screen.getByText("Scope")).toBeInTheDocument();
    expect(screen.getByText("Detectors")).toBeInTheDocument();
    expect(screen.getByText("Refine & Run")).toBeInTheDocument();
  });

  it("uploads a file and shows it in the upload card", async () => {
    const { container } = render(<FileUploadDemo />);
    await uploadFile(container);
    expect(screen.getByText("report.pdf")).toBeInTheDocument();
  });

  it("selects a compliance preset", async () => {
    const { container } = render(<FileUploadDemo />);
    await uploadFile(container);

    const financialBtn = screen.getByRole("button", { name: "FINANCIAL" });
    await act(async () => {
      fireEvent.click(financialBtn);
    });

    expect(financialBtn).toHaveClass("bg-[var(--primary)]");
  });

  it("toggles individual detectors", async () => {
    const { container } = render(<FileUploadDemo />);
    await uploadFile(container);

    const emailChip = screen.getByRole("button", { name: /Email/i });
    await act(async () => {
      fireEvent.click(emailChip);
    });

    const piiBtn = screen.getByRole("button", { name: "PII" });
    expect(piiBtn).not.toHaveClass("bg-[var(--primary)]");
  });

  it("disables redact when no detectors are selected", async () => {
    const { container } = render(<FileUploadDemo />);
    await uploadFile(container);

    // Deselect all PII detector chips
    const piiDetectors = ["Phone", "Email", "Names", "Addresses", "SSN", "Passport"];
    for (const name of piiDetectors) {
      const chip = screen.getByRole("button", { name });
      await act(async () => {
        fireEvent.click(chip);
      });
    }

    expect(screen.getByRole("button", { name: /Redact Document/i })).toBeDisabled();
  });

  it("submits to the API and shows success", async () => {
    mockFetch.mockResolvedValue(successResponse);

    const { container } = render(<FileUploadDemo />);
    await uploadFile(container);

    const redactBtn = screen.getByRole("button", { name: /Redact Document/i });
    await act(async () => {
      fireEvent.click(redactBtn);
    });

    await waitFor(() => {
      expect(screen.getByText("Done")).toBeInTheDocument();
    }, { timeout: 3000 });

    expect(screen.getByRole("button", { name: /Download/i })).toBeInTheDocument();
  });

  it("handles API errors", async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      status: 400,
      json: () =>
        Promise.resolve({
          error: { code: "UNSUPPORTED_FILE_TYPE", message: "Unsupported file type" },
        }),
    } as Response);

    const { container } = render(<FileUploadDemo />);
    await uploadFile(container);

    const redactBtn = screen.getByRole("button", { name: /Redact Document/i });
    await act(async () => {
      fireEvent.click(redactBtn);
    });

    await waitFor(() => {
      expect(screen.getByText("Unsupported file type")).toBeInTheDocument();
    });
  });

  it("downloads the redacted file", async () => {
    mockFetch.mockResolvedValue(successResponse);

    const { container } = render(<FileUploadDemo />);
    await uploadFile(container, "confidential.pdf");

    const redactBtn = screen.getByRole("button", { name: /Redact Document/i });
    await act(async () => {
      fireEvent.click(redactBtn);
    });

    await waitFor(() => {
      expect(screen.getByText("Done")).toBeInTheDocument();
    }, { timeout: 3000 });

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: /Download/i }));
    });

    expect(global.URL.createObjectURL).toHaveBeenCalled();
    expect(mockClick).toHaveBeenCalled();
  });

  it("accepts all supported file types", async () => {
    const validExtensions = ["test.pdf", "test.xls", "test.xlsx", "test.xlsm", "test.docx"];
    for (const ext of validExtensions) {
      const { container, unmount } = render(<FileUploadDemo />);
      const fileInput = container.querySelector('input[type="file"]') as HTMLInputElement;
      await act(async () => {
        fireEvent.change(fileInput, { target: { files: [createMockFile(ext, "application/octet-stream")] } });
      });
      expect(screen.getByText(ext)).toBeInTheDocument();
      unmount();
    }
  });

  it("rejects invalid file types", async () => {
    const alertMock = vi.spyOn(window, "alert").mockImplementation(() => {});
    const { container } = render(<FileUploadDemo />);
    const fileInput = container.querySelector('input[type="file"]') as HTMLInputElement;

    await act(async () => {
      fireEvent.change(fileInput, { target: { files: [createMockFile("notes.txt", "text/plain")] } });
    });

    expect(screen.queryByText("notes.txt")).not.toBeInTheDocument();
    expect(alertMock).toHaveBeenCalledWith(
      "Invalid file type: notes.txt. Only .pdf, .xls, .xlsx, .xlsm, .docx files are accepted."
    );
    alertMock.mockRestore();
  });

  it("sends custom masks to the backend", async () => {
    mockFetch.mockResolvedValue(successResponse);

    const { container } = render(<FileUploadDemo />);
    await uploadFile(container);

    const textarea = screen.getByPlaceholderText("Type names, sentences, or strings — one per line");
    await act(async () => {
      fireEvent.change(textarea, { target: { value: "John Doe\nProject X" } });
    });

    const redactBtn = screen.getByRole("button", { name: /Redact Document/i });
    await act(async () => {
      fireEvent.click(redactBtn);
    });

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalled();
    });

    const form = mockFetch.mock.calls[0][1].body as FormData;
    const options = JSON.parse(form.get("options") as string);
    expect(options.custom_masks).toEqual(["John Doe", "Project X"]);
  });
});
