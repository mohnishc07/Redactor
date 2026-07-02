"use client";

import React from "react";
import { IconLock } from "@tabler/icons-react";

interface PaywallGateProps {
  children: React.ReactNode;
  locked?: boolean;
  onUpgrade?: () => void;
}

export function PaywallGate({ children, locked = false, onUpgrade }: PaywallGateProps) {
  return (
    <div className="relative">
      {locked && (
        <button
          type="button"
          onClick={onUpgrade}
          className="absolute -top-2 -right-2 z-10 flex items-center justify-center w-6 h-6 rounded-full bg-[var(--surface-strong)] border border-[var(--border)] text-[var(--text-low)]"
          title="Upgrade to unlock"
        >
          <IconLock className="w-3 h-3" />
        </button>
      )}
      {children}
    </div>
  );
}
