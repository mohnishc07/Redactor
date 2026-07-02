import { cn } from "@/lib/utils";
import React from "react";

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  elevated?: boolean;
  radius?: "md" | "lg" | "xl" | "none";
  children: React.ReactNode;
}

export const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, elevated = false, radius = "xl", children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "border border-border bg-card text-card-foreground transition-all duration-300",
          elevated && "shadow-lg shadow-black/20",
          radius === "none" && "rounded-none",
          radius === "md" && "rounded-md",
          radius === "lg" && "rounded-lg",
          radius === "xl" && "rounded-xl",
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);
Card.displayName = "Card";
