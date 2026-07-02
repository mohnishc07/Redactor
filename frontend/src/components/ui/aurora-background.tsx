"use client";
import { cn } from "@/lib/utils";
import React, { ReactNode } from "react";

interface AuroraBackgroundProps extends React.HTMLProps<HTMLDivElement> {
  children: ReactNode;
}

export const AuroraBackground = ({
  className,
  children,
  ...props
}: AuroraBackgroundProps) => {
  return (
    <main
      className={cn(
        "relative min-h-screen w-full overflow-x-hidden bg-bg text-text",
        className
      )}
      {...props}
    >
      {children}
    </main>
  );
};
