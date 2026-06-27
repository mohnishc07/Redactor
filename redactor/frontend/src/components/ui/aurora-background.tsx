"use client";
import { cn } from "@/lib/utils";
import React, { ReactNode } from "react";

interface AuroraBackgroundProps extends React.HTMLProps<HTMLDivElement> {
  children: ReactNode;
  showRadialGradient?: boolean;
}

export const AuroraBackground = ({
  className,
  children,
  showRadialGradient = true,
  ...props
}: AuroraBackgroundProps) => {
  return (
    <main className="relative min-h-screen w-full overflow-x-hidden">
      {/* Aurora shader layer */}
      <div
        className="fixed inset-0 z-0 overflow-hidden"
        {...props}
      >
        <div
          className={cn(
            "pointer-events-none absolute -inset-[20px] animate-aurora will-change-transform",
            "opacity-70 blur-[14px] saturate-150",
            "[background:repeating-linear-gradient(100deg,#3b82f6_10%,#a5b4fc_15%,#93c5fd_20%,#ddd6fe_25%,#60a5fa_30%)]",
            "[background-size:200%_100%]",
            showRadialGradient &&
              "[mask-image:radial-gradient(ellipse_at_50%_0%,black_30%,transparent_80%)]",
          )}
        />
      </div>

      {/* Content */}
      <div className={cn("relative z-10 w-full min-h-screen", className)}>
        {children}
      </div>
    </main>
  );
};
