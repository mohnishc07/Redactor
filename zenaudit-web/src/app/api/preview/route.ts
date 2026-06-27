import { NextRequest, NextResponse } from "next/server";

const BACKEND_URL = process.env.REDACTOR_API_URL || "http://localhost:8000";
const API_KEY = process.env.REDACTOR_API_KEY;

export async function POST(request: NextRequest) {
  try {
    const form = await request.formData();

    const headers: HeadersInit = {};
    if (API_KEY) headers["X-API-Key"] = API_KEY;

    const res = await fetch(`${BACKEND_URL}/preview`, {
      method: "POST",
      body: form,
      headers,
    });

    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Preview request failed";
    return NextResponse.json({ detail: message }, { status: 500 });
  }
}
