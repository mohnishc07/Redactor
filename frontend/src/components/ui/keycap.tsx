import { cn } from "@/lib/utils";
import React from "react";

interface KeycapProps extends React.HTMLAttributes<HTMLSpanElement> {
  children: React.ReactNode;
}

export const Keycap = React.forwardRef<HTMLSpanElement, KeycapProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <span
        ref={ref}
        className={cn(
          "inline-flex items-center justify-center",
          "bg-gradient-to-b from-[var(--key-bg-start)] to-[var(--key-bg-end)]",
          "text-[var(--body)] font-ui text-[13px] leading-[1.4] tracking-[0.1px]",
          "px-1.5 h-5 rounded-[var(--radius-xs)] border border-[var(--hairline)]",
          className
        )}
        {...props}
      >
        {children}
      </span>
    );
  }
);
Keycap.displayName = "Keycap";
