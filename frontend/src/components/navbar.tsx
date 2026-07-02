"use client";

import React from "react";
import Link from "next/link";
import ThemeToggle from "./theme-toggle";

export default function Navbar() {
  return (
    <nav className="fixed top-4 left-1/2 -translate-x-1/2 z-50 flex items-center justify-between px-4 h-14 w-[calc(100%-2rem)] max-w-[1160px] rounded-full border border-[var(--border)] bg-[var(--surface-strong)] text-[var(--text)] backdrop-blur-xl shadow-[var(--shadow-sm)]">
      <Link
        href="/"
        className="font-display text-[18px] font-medium tracking-tight flex items-center gap-2 select-none"
      >
        <span className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-[var(--accent)] text-white font-ui text-[11px] font-bold">
          ZA
        </span>
        Zen Audit
      </Link>

      <div className="flex items-center gap-3">
        <ThemeToggle />
        <Link
          href="/redact"
          className="btn-primary !py-2 !px-4"
        >
          Redact a file
        </Link>
      </div>
    </nav>
  );
}
