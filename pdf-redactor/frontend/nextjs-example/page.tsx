"use client";

import { RedactUploader } from "./RedactUploader";

export default function Home() {
  return (
    <main className="max-w-2xl mx-auto p-8">
      <h1 className="text-3xl font-bold mb-6">PDF Redactor</h1>
      <RedactUploader />
    </main>
  );
}
