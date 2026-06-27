import { NextRequest, NextResponse } from "next/server";

const BACKEND_URL = process.env.REDACTOR_API_URL || "http://localhost:8000";
const API_KEY = process.env.REDACTOR_API_KEY;

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ jobId: string }> }
) {
  try {
    const { jobId } = await params;
    const body = await request.json();

    const headers: HeadersInit = {
      "Content-Type": "application/json",
    };
    if (API_KEY) headers["X-API-Key"] = API_KEY;

    const res = await fetch(`${BACKEND_URL}/apply/${jobId}`, {
      method: "POST",
      body: JSON.stringify(body),
      headers,
    });

    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Apply request failed";
    return NextResponse.json({ detail: message }, { status: 500 });
  }
}
