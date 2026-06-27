import { NextRequest, NextResponse } from "next/server";

const BACKEND_URL = process.env.REDACTOR_API_URL || "http://localhost:8000/redact";
const API_KEY = process.env.REDACTOR_API_KEY;

export async function POST(request: NextRequest) {
  try {
    const form = await request.formData();

    const headers: HeadersInit = {};
    if (API_KEY) headers["X-API-Key"] = API_KEY;

    const res = await fetch(BACKEND_URL, {
      method: "POST",
      body: form,
      headers,
    });

    const data = await res.json();
    if (!res.ok) {
      return NextResponse.json(data, { status: res.status });
    }
    return NextResponse.json(data);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Redaction request failed";
    return NextResponse.json(
      { detail: message },
      { status: 500 }
    );
  }
}
