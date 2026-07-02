"use client";

import React, { useState, useEffect, memo, useCallback } from "react";
import { cn } from "@/lib/utils";
import { createPortal } from "react-dom";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { X } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

const AnimatedNavLink = memo(({ href, children }: { href: string; children: React.ReactNode }) => {
  const router = useRouter();

  const handleClick = useCallback((e: React.MouseEvent<HTMLAnchorElement>) => {
    if (href.startsWith("#")) {
      e.preventDefault();
      if (typeof window !== "undefined") {
        if (window.location.pathname === "/") {
          const element = document.getElementById(href.replace("#", ""));
          if (element) element.scrollIntoView({ behavior: "smooth" });
        } else {
          router.push(`/${href}`);
        }
      }
    }
  }, [href, router]);

  return (
    <a
      href={href}
      onClick={handleClick}
      className="group relative inline-block overflow-hidden h-5 flex items-center cursor-pointer text-sm"
    >
      <div className="flex flex-col transition-transform duration-300 ease-out transform group-hover:-translate-y-1/2">
        <span className="text-gray-300">{children}</span>
        <span className="text-white">{children}</span>
      </div>
    </a>
  );
});
AnimatedNavLink.displayName = "AnimatedNavLink";

function FloatingPortal({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);
  const [el, setEl] = useState<HTMLDivElement | null>(null);

  useEffect(() => {
    setMounted(true);
    const portalEl = document.createElement("div");
    portalEl.setAttribute("id", "floating-navbar-portal");
    document.body.appendChild(portalEl);
    setEl(portalEl);
    return () => {
      if (document.body.contains(portalEl)) {
        document.body.removeChild(portalEl);
      }
    };
  }, []);

  if (!mounted || !el) return null;
  return createPortal(children, el);
}

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (typeof document !== "undefined") {
      document.body.style.overflow = isOpen ? "hidden" : "";
    }
    return () => {
      if (typeof document !== "undefined") document.body.style.overflow = "";
    };
  }, [isOpen]);

  const logoElement = (
    <Link href="/" className="flex items-center justify-center h-full hover:opacity-80 transition-opacity duration-200">
      <span
        className="text-xl text-white pl-2 -mr-6 flex items-center leading-none"
        style={{ fontFamily: "Panchang, ui-serif, Georgia, serif", fontWeight: 670 }}
      >
        Zen Audit
      </span>
    </Link>
  );

  const navLinksData = [
    { label: "Home", href: "/" },
    { label: "Features", href: "/#features" },
    { label: "Redact", href: "/redact" },
  ];

  const ctaButton = (
    <button
      onClick={() => router.push("/redact")}
      className="relative group w-full lg:w-auto cursor-pointer"
    >
      <div className="absolute inset-0 -m-2 rounded-full hidden lg:block bg-gray-100 opacity-0 filter blur-lg pointer-events-none transition-all duration-300 ease-out group-hover:opacity-60 group-hover:blur-xl group-hover:-m-3" />
      <div className="relative z-10 px-3 py-2 text-[13px] font-semibold text-black bg-gradient-to-br from-gray-100 to-gray-300 rounded-full hover:from-gray-200 hover:to-gray-400 hover:scale-[1.03] hover:shadow-[0_0_30px_rgba(255,255,255,0.15)] transition-all duration-300 ease-out w-full lg:w-auto whitespace-nowrap">
        Try Redactor Now
      </div>
    </button>
  );

  const navbarContent = (
    <header
      className={cn(
        "flex flex-col items-center px-5 py-3 rounded-full bg-black/30 backdrop-blur-xl border border-white/20 shadow-lg shadow-black/20 transition-all duration-300 ease-in-out",
        "w-[calc(100vw-2rem)] lg:w-auto"
      )}
    >
      <div className="flex items-center justify-between w-full gap-x-3 md:gap-x-5 lg:gap-x-7">
        <div className="flex items-center flex-shrink-0">{logoElement}</div>

        <div className="hidden lg:flex items-center">
          <div className="w-px h-4 bg-gray-600 mx-5" />
          <nav className="flex items-center space-x-5 xl:space-x-7 text-sm whitespace-nowrap">
            {navLinksData.map((link) => (
              <AnimatedNavLink key={link.href} href={link.href}>
                {link.label}
              </AnimatedNavLink>
            ))}
          </nav>
        </div>

        <div className="hidden lg:flex items-center gap-2 xl:gap-3 flex-shrink-0">
          <div className="w-px h-4 bg-gray-600 mr-3" />
          {ctaButton}
        </div>

        <button
          className="lg:hidden flex items-center justify-center w-8 h-8 text-gray-300 focus:outline-none flex-shrink-0 transition-colors duration-300 hover:text-white"
          onClick={() => setIsOpen((p) => !p)}
          aria-label={isOpen ? "Close Menu" : "Open Menu"}
        >
          <div className="relative w-6 h-6">
            <svg
              className={`absolute inset-0 w-6 h-6 transition-all duration-300 ease-in-out ${isOpen ? "rotate-90 opacity-0" : "rotate-0 opacity-100"}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
            <svg
              className={`absolute inset-0 w-6 h-6 transition-all duration-300 ease-in-out ${isOpen ? "rotate-0 opacity-100" : "-rotate-90 opacity-0"}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
        </button>
      </div>
    </header>
  );

  return (
    <FloatingPortal>
      {navbarContent}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            key="mobile-menu-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4, ease: "easeInOut" }}
            className="fixed inset-0 w-full h-full z-50 lg:hidden pointer-events-none"
            style={{
              background: "rgba(20, 20, 20, 0.45)",
              backdropFilter: "blur(40px)",
              WebkitBackdropFilter: "blur(40px)",
            }}
          >
            <div className="absolute inset-0 bg-gradient-to-b from-[rgba(20,20,20,0.6)] to-[rgba(20,20,20,0.4)] pointer-events-none" />
            <button
              onClick={() => setIsOpen(false)}
              className="absolute top-6 right-6 text-white hover:text-gray-300 transition-colors p-2 z-10 pointer-events-auto"
              aria-label="Close Menu"
            >
              <X size={28} />
            </button>

            <motion.nav
              initial="hidden"
              animate="visible"
              exit="hidden"
              variants={{
                hidden: { opacity: 0 },
                visible: { opacity: 1, transition: { staggerChildren: 0.08, delayChildren: 0.15 } },
              }}
              className="relative flex flex-col items-start justify-between h-full text-white text-2xl font-semibold z-10 px-12 pt-32 pb-12 pointer-events-auto"
            >
              <div className="flex flex-col gap-8">
                {navLinksData.map((link) => (
                  <motion.a
                    key={link.href}
                    href={link.href}
                    variants={{
                      hidden: { opacity: 0, y: -20 },
                      visible: { opacity: 1, y: 0, transition: { duration: 0.25 } },
                      exit: { opacity: 0, y: -20, transition: { duration: 0.25 } },
                    }}
                    onClick={(e) => {
                      setIsOpen(false);
                      if (link.href.startsWith("#")) {
                        e.preventDefault();
                        if (typeof window !== "undefined") {
                          if (window.location.pathname === "/") {
                            const element = document.getElementById(link.href.replace("#", ""));
                            if (element) element.scrollIntoView({ behavior: "smooth" });
                          } else {
                            router.push(`/${link.href}`);
                          }
                        }
                      }
                    }}
                    className="hover:text-gray-300 transition-colors cursor-pointer"
                  >
                    {link.label}
                  </motion.a>
                ))}
              </div>
              <motion.div
                variants={{
                  hidden: { opacity: 0, y: -20 },
                  visible: { opacity: 1, y: 0, transition: { duration: 0.25 } },
                  exit: { opacity: 0, y: -20, transition: { duration: 0.25 } },
                }}
                className="w-full flex flex-col gap-3"
              >
                <button
                  onClick={() => {
                    setIsOpen(false);
                    router.push("/redact");
                  }}
                  className="relative group cursor-pointer w-full"
                >
                  <div className="relative z-10 px-6 py-3 text-base font-semibold text-black bg-gradient-to-br from-gray-100 to-gray-300 rounded-full hover:from-gray-200 hover:to-gray-400 hover:scale-[1.03] hover:shadow-[0_0_30px_rgba(255,255,255,0.15)] transition-all duration-300 ease-out text-center w-full">
                    Try Redactor Now
                  </div>
                </button>
              </motion.div>
            </motion.nav>
          </motion.div>
        )}
      </AnimatePresence>
    </FloatingPortal>
  );
}
