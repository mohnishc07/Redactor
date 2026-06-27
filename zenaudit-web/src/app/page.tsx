"use client";

import { motion } from "motion/react";
import Link from "next/link";
import { AuroraBackground } from "@/components/ui/aurora-background";
import Navbar from "@/components/navbar";
import {
  IconShieldCheck,
  IconBolt,
  IconRocket,
  IconFingerprint,
  IconClock,
  IconCloudOff,
  IconChevronDown,
} from "@tabler/icons-react";

const fadeUp = {
  hidden: { opacity: 0, y: 28 },
  visible: (delay: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.8, delay, ease: [0.22, 1, 0.36, 1] as const },
  }),
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.12, delayChildren: 0.4 },
  },
};

const staggerItem = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.7, ease: "easeOut" as const } },
};

export default function Home() {
  const scrollToFeatures = () => {
    const el = document.getElementById("features");
    if (el) el.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <AuroraBackground className="min-h-screen h-auto">
      <div className="relative z-10 w-full text-white">
        <Navbar />

        {/* HERO */}
        <section className="min-h-screen flex flex-col items-center justify-center px-6 md:px-10 pt-32 md:pt-40 pb-20">
          <div className="max-w-4xl mx-auto text-center">
            <motion.div
              custom={0.1}
              initial="hidden"
              animate="visible"
              variants={fadeUp}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-white/[0.08] bg-white/[0.04] backdrop-blur-md mb-10"
            >
              <IconShieldCheck className="w-4 h-4 text-accent" />
              <span className="text-[12px] font-medium tracking-[0.12em] uppercase text-white/80">
                Enterprise-grade document redaction
              </span>
            </motion.div>

            <motion.h1
              custom={0.25}
              initial="hidden"
              animate="visible"
              variants={fadeUp}
              className="font-display text-[clamp(44px,7vw,92px)] font-light tracking-[-0.04em] leading-[1.02] text-white mb-8"
            >
              Privacy-grade redaction.
              <br />
              <span className="text-white/40">One click.</span>
            </motion.h1>

            <motion.p
              custom={0.4}
              initial="hidden"
              animate="visible"
              variants={fadeUp}
              className="text-[17px] md:text-[20px] font-normal text-white/50 leading-[1.65] max-w-2xl mx-auto mb-12"
            >
              Meet GDPR, HIPAA, and financial-privacy requirements instantly. Zen Audit removes names,
              addresses, bank details, IDs, metadata, and more — before your documents ever reach an AI.
            </motion.p>

            <motion.div
              custom={0.55}
              initial="hidden"
              animate="visible"
              variants={fadeUp}
              className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-24"
            >
              <Link
                href="/redact"
                className="group text-[16px] font-medium text-black bg-white rounded-full px-9 py-4 tracking-[-0.01em] transition-all duration-200 hover:bg-white/90 hover:scale-[1.03] active:scale-[0.98] shadow-[0_8px_40px_rgba(255,255,255,0.18)] flex items-center gap-2"
              >
                <IconBolt className="w-4 h-4 transition-transform group-hover:scale-110" />
                Redact a file now
              </Link>
              <button
                onClick={scrollToFeatures}
                className="text-[16px] font-medium text-white/80 bg-white/[0.05] border border-white/10 rounded-full px-9 py-4 tracking-[-0.01em] transition-all duration-200 hover:bg-white/[0.10] hover:text-white"
              >
                Explore features
              </button>
            </motion.div>

            <motion.button
              custom={0.75}
              initial="hidden"
              animate="visible"
              variants={fadeUp}
              onClick={scrollToFeatures}
              className="flex flex-col items-center gap-2 text-white/30 hover:text-white/60 transition-colors mx-auto"
            >
              <IconChevronDown className="w-5 h-5 animate-bounce" />
            </motion.button>
          </div>
        </section>

        {/* FEATURES */}
        <section id="features" className="px-6 md:px-10 py-24 md:py-32">
          <div className="max-w-6xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.7 }}
              className="text-center mb-16"
            >
              <p className="text-[12px] font-medium tracking-[0.12em] uppercase text-accent mb-4">
                Why Zen Audit
              </p>
              <h2 className="font-display text-[32px] md:text-[48px] font-light tracking-[-0.03em] text-white mb-5">
                Built for compliance. Engineered for speed.
              </h2>
              <p className="text-[16px] md:text-[18px] text-white/45 max-w-2xl mx-auto">
                Self-hosted, AI-aware redaction that outperforms cloud-only alternatives.
              </p>
            </motion.div>

            <motion.div
              variants={staggerContainer}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-100px" }}
              className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-20"
            >
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
                <motion.div
                  key={card.title}
                  variants={staggerItem}
                  className="rounded-[32px] border border-white/[0.08] bg-white/[0.04] backdrop-blur-xl p-8 text-left hover:bg-white/[0.06] transition-colors"
                >
                  <div className="flex items-center gap-3 mb-6">
                    <div className="p-3 rounded-2xl bg-accent/15 text-accent">
                      <card.icon className="w-6 h-6" />
                    </div>
                    <span className="text-[12px] font-medium text-white/40 uppercase tracking-wider">
                      {card.tag}
                    </span>
                  </div>
                  <h3 className="text-[22px] font-medium text-white mb-3 tracking-[-0.01em]">
                    {card.title}
                  </h3>
                  <p className="text-[15px] text-white/50 leading-relaxed">{card.desc}</p>
                </motion.div>
              ))}
            </motion.div>

            {/* How it works */}
            <motion.div
              variants={staggerContainer}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-100px" }}
              className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-20"
            >
              {[
                { num: "01", title: "Upload", desc: "Drop any PDF, Excel, or Word file up to 50 MB." },
                { num: "02", title: "Configure", desc: "Pick compliance presets, detectors, or custom strings." },
                { num: "03", title: "Download", desc: "Get a clean, audit-ready document in seconds." },
              ].map((step) => (
                <motion.div
                  key={step.num}
                  variants={staggerItem}
                  className="rounded-[28px] border border-white/[0.06] bg-white/[0.03] backdrop-blur-xl p-8"
                >
                  <span className="font-display text-[13px] text-white/30 tracking-[0.08em] mb-4 block">
                    {step.num}
                  </span>
                  <h3 className="text-[20px] font-medium text-white mb-2">{step.title}</h3>
                  <p className="text-[14px] text-white/45 leading-relaxed">{step.desc}</p>
                </motion.div>
              ))}
            </motion.div>

            {/* Final CTA */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.7 }}
              className="rounded-[40px] border border-white/[0.08] bg-white/[0.05] backdrop-blur-2xl p-12 md:p-16 text-center"
            >
              <IconRocket className="w-10 h-10 text-accent mx-auto mb-6" />
              <h2 className="font-display text-[32px] md:text-[44px] font-light tracking-[-0.03em] text-white mb-5">
                Ready to redact?
              </h2>
              <p className="text-[16px] text-white/45 max-w-xl mx-auto mb-8">
                Start redacting documents in seconds. No signup required for the demo.
              </p>
              <Link
                href="/redact"
                className="inline-flex items-center gap-2 text-[16px] font-medium text-black bg-white rounded-full px-9 py-4 tracking-[-0.01em] transition-all duration-200 hover:bg-white/90 hover:scale-[1.03] active:scale-[0.98] shadow-[0_8px_40px_rgba(255,255,255,0.18)]"
              >
                <IconBolt className="w-4 h-4" />
                Open the redactor
              </Link>
            </motion.div>
          </div>
        </section>
      </div>
    </AuroraBackground>
  );
}
