"use client";

import { useMemo, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "motion/react";
import WavyBackground from "@/components/ui/wavy-background";
import Navbar from "@/components/navbar";
import Footer from "@/components/footer";
import { Card } from "@/components/ui/card";
import { useScrollAnimation, microFadeIn, microSlideIn } from "@/hooks/use-scroll-animations";
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
  IconGift,
  IconArrowRight,
} from "@tabler/icons-react";

function RotatingText() {
  const [textNumber, setTextNumber] = useState(0);
  const texts = useMemo(() => ["Secure.", "Compliant.", "Private.", "Redacted."], []);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setTextNumber((prev) => (prev === texts.length - 1 ? 0 : prev + 1));
    }, 2000);
    return () => clearTimeout(timeoutId);
  }, [textNumber, texts]);

  return (
    <div className="relative w-full overflow-hidden text-center min-h-[3.5rem] md:min-h-[5.5rem]">
      <div className="relative flex justify-center">
        {texts.map((text, index) => (
          <motion.span
            key={index}
            className="absolute font-clash font-semibold text-4xl min-[375px]:text-5xl md:text-7xl text-white whitespace-nowrap left-1/2 transform -translate-x-1/2"
            initial={{ opacity: 0, y: "-100" }}
            transition={{ type: "spring", stiffness: 50 }}
            animate={
              textNumber === index
                ? { y: 0, opacity: 1 }
                : { y: textNumber > index ? -150 : 150, opacity: 0 }
            }
          >
            {text}
          </motion.span>
        ))}
      </div>
    </div>
  );
}

export default function Home() {
  const router = useRouter();
  const { ref: featuresRef, isInView: featuresInView } = useScrollAnimation();
  const { ref: formatsRef, isInView: formatsInView } = useScrollAnimation();
  const { ref: ctaRef, isInView: ctaInView } = useScrollAnimation();

  const scrollToFeatures = () => {
    const el = document.getElementById("features");
    if (el) el.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div className="min-h-screen bg-black text-white">
      <Navbar />

      {/* Hero */}
      <WavyBackground className="bg-black text-white min-h-screen">
        <div className="relative z-20 flex min-h-screen items-center justify-center px-6 sm:px-4">
          <div className="flex gap-8 items-center justify-center flex-col">
            <div className="flex gap-4 flex-col">
              {/* Offer chip */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, ease: "easeOut" }}
                className="flex justify-center mb-4"
              >
                <div
                  className="group rounded-full border border-white/20 bg-black/30 backdrop-blur-xl shadow-lg shadow-black/20 text-white transition-all duration-300 ease-out hover:cursor-pointer hover:bg-black/40 hover:scale-[1.03] hover:shadow-[0_0_30px_rgba(255,255,255,0.15)] hover:border-white/30"
                  onClick={scrollToFeatures}
                >
                  <div className="inline-flex items-center justify-center px-2 py-1.5 transition ease-out hover:text-white/80 hover:duration-300 text-sm font-geist">
                    <div className="rounded-full bg-white/10 backdrop-blur-md border border-white/20 px-2.5 py-1 mr-2.5 flex items-center">
                      <IconGift className="mr-1.5 w-3.5 h-3.5 text-white opacity-85" />
                      <span className="text-xs font-semibold opacity-85">New</span>
                    </div>
                    <span className="text-sm font-geist opacity-75 group-hover:opacity-100 transition-opacity duration-300">
                      Privacy-grade redaction
                    </span>
                    <IconArrowRight className="ml-1.5 w-3.5 h-3.5 transition-transform duration-300 ease-in-out group-hover:translate-x-0.5" />
                  </div>
                </div>
              </motion.div>

              <h1 className="text-center font-clash">
                <span className="text-white text-4xl min-[375px]:text-5xl md:text-7xl font-clash font-regular tracking-tight block">
                  Make Documents
                </span>
                <div className="pt-3 md:pt-2">
                  <RotatingText />
                </div>
              </h1>

              <p className="text-lg md:text-xl leading-relaxed tracking-tight text-gray-300 text-center px-8 sm:px-0 max-w-xl mx-auto font-geist">
                Meet GDPR, HIPAA, and financial-privacy requirements instantly. Remove names,
                addresses, bank details, IDs, and metadata before your documents reach an AI.
              </p>
            </div>

            <div className="flex flex-row gap-3">
              <button onClick={scrollToFeatures} className="relative group">
                <div className="absolute inset-0 -m-2 rounded-full bg-gray-100 opacity-0 filter blur-lg pointer-events-none transition-all duration-300 ease-out group-hover:opacity-60 group-hover:blur-xl group-hover:-m-3" />
                <div className="relative z-10 px-5 py-2.5 sm:px-6 sm:py-3 text-sm font-semibold text-black bg-gradient-to-br from-gray-100 to-gray-300 rounded-full hover:from-gray-200 hover:to-gray-400 hover:scale-[1.03] hover:shadow-[0_0_30px_rgba(255,255,255,0.15)] transition-all duration-300 ease-out flex items-center gap-2">
                  <span>See Features</span>
                  <motion.div
                    animate={{ y: [0, 4, 0] }}
                    transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                  >
                    <IconChevronDown className="w-4 h-4" />
                  </motion.div>
                </div>
              </button>
              <button
                onClick={() => router.push("/redact")}
                className="px-5 py-2.5 sm:px-6 sm:py-3 text-sm border border-white/70 bg-black/30 backdrop-blur-xl text-gray-300 rounded-full hover:border-white/50 hover:text-white hover:scale-[1.03] hover:shadow-[0_0_30px_rgba(255,255,255,0.15)] transition-all duration-300 ease-out"
              >
                Try Redactor
              </button>
            </div>
          </div>
        </div>
      </WavyBackground>

      {/* Features */}
      <section id="features" className="bg-black pt-16 md:pt-24 pb-8 md:pb-12">
        <div className="mx-auto max-w-5xl px-6 md:px-12">
          <motion.div
            ref={featuresRef}
            initial={microFadeIn.hidden}
            animate={featuresInView ? microFadeIn.visible : microFadeIn.hidden}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="text-center mb-12"
          >
            <h2 className="text-4xl md:text-6xl font-semibold text-white mb-4 font-clash">
              Built for Privacy
            </h2>
            <p className="text-xl text-gray-300 max-w-2xl mx-auto font-geist">
              Powerful redaction designed for auditors, legal teams, and compliance workflows.
            </p>
          </motion.div>

          <motion.div
            initial={microSlideIn.hidden}
            animate={featuresInView ? microSlideIn.visible : microSlideIn.hidden}
            transition={{ duration: 0.7, ease: "easeOut" }}
            className="grid grid-cols-1 md:grid-cols-3 gap-4"
          >
            {[
              {
                icon: IconCloudOff,
                title: "Self-hosted privacy",
                desc: "Your files never leave your infrastructure. No per-document fees, no vendor lock-in.",
              },
              {
                icon: IconFingerprint,
                title: "Detect what others miss",
                desc: "IBANs, IFSC codes, UPI IDs, Aadhaar, PAN, customer IDs, barcodes, QR codes, and custom patterns.",
              },
              {
                icon: IconClock,
                title: "Sub-second per page",
                desc: "Process PDFs, Excel, and Word files in under 2 seconds with automatic audit reports.",
              },
            ].map((card) => (
              <Card
                key={card.title}
                className="group overflow-hidden bg-card border-white/10 hover:border-white/20 transition-colors"
              >
                <div className="p-6 md:p-8 flex flex-col h-full">
                  <div className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 text-white flex items-center justify-center mb-5">
                    <card.icon className="w-6 h-6" />
                  </div>
                  <h3 className="font-clash text-xl font-semibold text-white mb-2">{card.title}</h3>
                  <p className="text-gray-400 font-geist text-sm leading-relaxed">{card.desc}</p>
                </div>
              </Card>
            ))}
          </motion.div>

          <motion.div
            ref={formatsRef}
            initial={microSlideIn.hidden}
            animate={formatsInView ? microSlideIn.visible : microSlideIn.hidden}
            transition={{ duration: 0.7, ease: "easeOut" }}
            className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4"
          >
            <Card className="bg-card border-white/10 p-6 md:p-8">
              <h3 className="font-clash text-2xl font-semibold text-white mb-6">Supported Formats</h3>
              <div className="space-y-4">
                {[
                  { icon: IconFileText, name: "PDF Documents", desc: "Native text and scanned pages (OCR)." },
                  { icon: IconFileSpreadsheet, name: "Excel Spreadsheets", desc: "XLSX and XLSM cell redaction." },
                  { icon: IconFileTypeDocx, name: "Word Documents", desc: "DOCX paragraph and run redaction." },
                ].map((fmt) => (
                  <div key={fmt.name} className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-lg bg-white/5 border border-white/10 text-white flex items-center justify-center shrink-0">
                      <fmt.icon className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-geist text-sm font-semibold text-white">{fmt.name}</h4>
                      <p className="text-gray-400 text-sm">{fmt.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            <Card className="bg-card border-white/10 p-6 md:p-8 flex flex-col justify-between">
              <div>
                <h3 className="font-clash text-2xl font-semibold text-white mb-4">How It Works</h3>
                <div className="space-y-4">
                  {[
                    { num: "01", title: "Upload", desc: "Drop any PDF, Excel, or Word file up to 50 MB." },
                    { num: "02", title: "Configure", desc: "Pick compliance presets, detectors, or custom strings." },
                    { num: "03", title: "Download", desc: "Get a clean, audit-ready document in seconds." },
                  ].map((step) => (
                    <div key={step.num} className="flex items-start gap-4">
                      <span className="font-clash text-sm text-primary font-semibold">{step.num}</span>
                      <div>
                        <h4 className="font-geist text-sm font-semibold text-white">{step.title}</h4>
                        <p className="text-gray-400 text-sm">{step.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </Card>
          </motion.div>
        </div>
      </section>

      {/* Final CTA */}
      <motion.section
        ref={ctaRef}
        initial={microFadeIn.hidden}
        animate={ctaInView ? microFadeIn.visible : microFadeIn.hidden}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="bg-black py-16 md:py-24"
      >
        <div className="mx-auto max-w-4xl px-6 text-center">
          <IconRocket className="w-12 h-12 mx-auto mb-6 text-primary" />
          <h2 className="text-4xl md:text-5xl font-semibold text-white mb-4 font-clash">
            Ready to redact?
          </h2>
          <p className="text-lg text-gray-300 mb-8 max-w-xl mx-auto font-geist">
            Start redacting documents in seconds. No signup required for the demo.
          </p>
          <button
            onClick={() => router.push("/redact")}
            className="relative group inline-flex"
          >
            <div className="absolute inset-0 -m-2 rounded-full bg-gray-100 opacity-0 filter blur-lg pointer-events-none transition-all duration-300 ease-out group-hover:opacity-60 group-hover:blur-xl group-hover:-m-3" />
            <div className="relative z-10 px-6 py-3 text-sm font-semibold text-black bg-gradient-to-br from-gray-100 to-gray-300 rounded-full hover:from-gray-200 hover:to-gray-400 hover:scale-[1.03] hover:shadow-[0_0_30px_rgba(255,255,255,0.15)] transition-all duration-300 ease-out">
              Open the Redactor
            </div>
          </button>
        </div>
      </motion.section>

      <Footer />
    </div>
  );
}
