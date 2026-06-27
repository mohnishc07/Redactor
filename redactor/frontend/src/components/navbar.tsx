"use client";

import React from "react";
import Link from "next/link";

export default function Navbar() {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 md:px-10 h-[68px] bg-[#080C10]/40 backdrop-blur-2xl border-b border-white/[0.06]">
      <Link href="/" className="font-display text-[17px] font-medium text-white tracking-[-0.02em] flex items-center gap-2.5 select-none">
        <div className="w-7 h-7 rounded-lg bg-accent flex items-center justify-center">
          <svg viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5">
            <circle cx="6" cy="6" r="3" stroke="white" strokeWidth="1.5"/>
            <line x1="6" y1="1" x2="6" y2="3" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
            <line x1="6" y1="9" x2="6" y2="11" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
            <line x1="1" y1="6" x2="3" y2="6" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
            <line x1="9" y1="6" x2="11" y2="6" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
        </div>
        Zen Audit
      </Link>

      <Link
        href="/redact"
        className="text-[13px] font-medium text-black bg-white rounded-full px-5 py-2 tracking-[-0.01em] transition-all duration-200 hover:bg-white/90 hover:scale-[1.02] active:scale-[0.98] shadow-[0_2px_12px_rgba(255,255,255,0.12)]"
      >
        Redact a file
      </Link>
    </nav>
  );
}
