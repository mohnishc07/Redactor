import React from "react";

export default function Footer() {
  return (
    <footer className="max-w-[1160px] mx-auto w-full mt-auto px-6 py-5 flex justify-between items-center glass-strong !rounded-2xl mb-6">
      <span className="font-display text-[14px] font-medium text-[var(--text)] tracking-tight">
        Zen Audit
      </span>
      <span className="font-body text-[12px] text-[var(--text-muted)]">© 2026</span>
    </footer>
  );
}
