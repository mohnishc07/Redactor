"use client";

import { useRouter } from "next/navigation";
import { AuroraBackground } from "@/components/ui/aurora-background";
import { LiquidMetalButton } from "@/components/ui/liquid-metal-button";
import Navbar from "@/components/navbar";
import Footer from "@/components/footer";
import {
  IconShieldCheck,
  IconCloudOff,
  IconFingerprint,
  IconClock,
  IconRocket,
  IconChevronDown,
  IconFileText,
  IconFileSpreadsheet,
  IconFileTypeDocx,
} from "@tabler/icons-react";

export default function Home() {
  const router = useRouter();
  const scrollToFeatures = () => {
    const el = document.getElementById("features");
    if (el) el.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <AuroraBackground>
      <div className="relative z-10 w-full text-[var(--text)]">
        <Navbar />

        {/* HERO */}
        <section className="px-4 pt-36 pb-16 md:pt-44 md:pb-24 max-w-[1160px] mx-auto">
          <div className="glass-strong p-8 md:p-14 text-center">
            <div className="inline-flex items-center gap-2 rounded-full bg-[var(--accent-soft)]/30 text-[var(--accent)] font-ui text-[12px] font-semibold px-3 py-1.5 mb-6 border border-[var(--border)]">
              <IconShieldCheck className="w-3.5 h-3.5" />
              Enterprise-grade privacy
            </div>

            <h1 className="font-display text-[40px] md:text-[64px] font-medium leading-[1.05] tracking-tight mb-6">
              Privacy-Grade Redaction.
              <br />
              <span className="text-[var(--text-muted)]">One Click.</span>
            </h1>

            <p className="font-body text-[16px] md:text-[18px] leading-[1.6] text-[var(--text-muted)] max-w-[560px] mx-auto mb-10">
              Meet GDPR, HIPAA, and financial-privacy requirements instantly. Zen Audit removes
              names, addresses, bank details, IDs, metadata, and more — before your documents
              ever reach an AI.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12">
              <LiquidMetalButton
                label="Redact a file now"
                onClick={() => router.push("/redact")}
              />
              <button
                onClick={scrollToFeatures}
                className="btn-secondary !px-7 !py-3.5 !text-[13px]"
              >
                Explore features
              </button>
            </div>

            <button
              onClick={scrollToFeatures}
              className="flex flex-col items-center gap-1 text-[var(--text-low)] mx-auto"
            >
              <IconChevronDown className="w-5 h-5" />
            </button>
          </div>
        </section>

        {/* FEATURES */}
        <section id="features" className="px-4 py-10 md:py-16 max-w-[1160px] mx-auto">
          <div className="glass p-6 mb-8">
            <h2 className="font-display text-[24px] md:text-[32px] font-medium tracking-tight">
              Why Zen Audit
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-10">
            {[
              {
                icon: IconCloudOff,
                tag: "vs Adobe",
                title: "Self-hosted privacy",
                desc: "Your files never leave your infrastructure. No per-document fees, no vendor lock-in.",
              },
              {
                icon: IconFingerprint,
                tag: "vs Generic AI",
                title: "Detect what others miss",
                desc: "IBANs, IFSC codes, UPI IDs, Aadhaar, PAN, customer IDs, barcodes, QR codes, and custom patterns.",
              },
              {
                icon: IconClock,
                tag: "Speed",
                title: "Sub-second per page",
                desc: "Process PDFs, Excel, and Word files in under 2 seconds with automatic audit reports.",
              },
            ].map((card) => (
              <div key={card.title} className="glass p-6 flex flex-col">
                <div className="w-10 h-10 rounded-xl bg-[var(--accent)]/10 text-[var(--accent)] flex items-center justify-center mb-4">
                  <card.icon className="w-5 h-5" />
                </div>
                <span className="font-ui text-[11px] font-semibold uppercase text-[var(--text-low)] tracking-wide mb-2">
                  {card.tag}
                </span>
                <h3 className="font-heading text-[16px] font-semibold text-[var(--text)] mb-2">
                  {card.title}
                </h3>
                <p className="font-body text-[14px] leading-[1.55] text-[var(--text-muted)]">
                  {card.desc}
                </p>
              </div>
            ))}
          </div>

          {/* How it works */}
          <div className="glass p-6 mb-10">
            <h3 className="font-display text-[18px] md:text-[22px] font-medium tracking-tight mb-6">
              How It Works
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                { num: "01", title: "Upload", desc: "Drop any PDF, Excel, or Word file up to 50 MB." },
                { num: "02", title: "Configure", desc: "Pick compliance presets, detectors, or custom strings." },
                { num: "03", title: "Download", desc: "Get a clean, audit-ready document in seconds." },
              ].map((step) => (
                <div key={step.num} className="p-5 rounded-2xl bg-[var(--surface-strong)] border border-[var(--border)]">
                  <span className="font-heading text-[13px] text-[var(--accent)] font-semibold block mb-2">
                    {step.num}
                  </span>
                  <h4 className="font-heading text-[15px] font-semibold text-[var(--text)] mb-1">
                    {step.title}
                  </h4>
                  <p className="font-body text-[14px] leading-[1.55] text-[var(--text-muted)]">
                    {step.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Supported formats */}
          <div className="glass p-6 mb-10">
            <h3 className="font-display text-[18px] md:text-[22px] font-medium tracking-tight mb-6">
              Supported Formats
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {[
                { icon: IconFileText, name: "PDF Documents", desc: "Native text and scanned pages (OCR)." },
                { icon: IconFileSpreadsheet, name: "Excel Spreadsheets", desc: "XLSX and XLSM cell redaction." },
                { icon: IconFileTypeDocx, name: "Word Documents", desc: "DOCX paragraph and run redaction." },
              ].map((fmt) => (
                <div key={fmt.name} className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-[var(--accent-soft)]/20 text-[var(--accent)] flex items-center justify-center shrink-0">
                    <fmt.icon className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-heading text-[14px] font-semibold text-[var(--text)]">
                      {fmt.name}
                    </h4>
                    <p className="font-body text-[13px] leading-[1.55] text-[var(--text-muted)]">
                      {fmt.desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Final CTA */}
          <div className="glass-strong p-8 md:p-12 text-center bg-[var(--accent)]/5 border-[var(--accent-soft)]/30">
            <IconRocket className="w-10 h-10 mx-auto mb-5 text-[var(--accent)]" />
            <h2 className="font-display text-[28px] md:text-[40px] font-medium tracking-tight mb-4">
              Ready to redact?
            </h2>
            <p className="font-body text-[16px] leading-[1.6] mb-8 max-w-md mx-auto text-[var(--text-muted)]">
              Start redacting documents in seconds. No signup required for the demo.
            </p>
            <LiquidMetalButton
              label="Open the redactor"
              onClick={() => router.push("/redact")}
            />
          </div>
        </section>

        <Footer />
      </div>
    </AuroraBackground>
  );
}
