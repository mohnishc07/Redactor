"use client";

import React from "react";
import { IconSun, IconMoon } from "@tabler/icons-react";
import { useTheme } from "./theme-provider";

export default function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={theme === "light" ? "Switch to dark mode" : "Switch to light mode"}
      className="flex items-center gap-1.5 font-ui text-[11px] font-semibold uppercase tracking-wide px-2.5 py-1.5 rounded-full border border-[var(--border)] bg-[var(--surface-strong)] text-[var(--text)] backdrop-blur-md"
    >
      {theme === "light" ? <IconMoon className="w-3.5 h-3.5" /> : <IconSun className="w-3.5 h-3.5" />}
      {theme === "light" ? "Dark" : "Light"}
    </button>
  );
}
