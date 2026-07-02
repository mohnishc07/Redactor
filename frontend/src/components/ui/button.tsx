import { cn } from "@/lib/utils";
import React from "react";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "tertiary" | "outline" | "ghost";
  size?: "sm" | "md" | "lg";
  children: React.ReactNode;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          "inline-flex items-center justify-center gap-2 font-geist font-medium transition-all duration-300 ease-out",
          "disabled:opacity-50 disabled:cursor-not-allowed",
          variant === "primary" && [
            "bg-primary text-primary-foreground rounded-full",
            "hover:brightness-110 hover:scale-[1.03] hover:shadow-[0_0_30px_rgba(59,130,246,0.25)]",
            "active:scale-[0.98]",
          ],
          variant === "secondary" && [
            "bg-secondary text-secondary-foreground rounded-md",
            "hover:bg-muted active:scale-[0.98]",
          ],
          variant === "tertiary" && [
            "bg-muted text-foreground rounded-md",
            "hover:bg-muted/80 active:scale-[0.98]",
          ],
          variant === "outline" && [
            "bg-transparent text-foreground border border-border rounded-md",
            "hover:bg-muted hover:border-white/20 active:scale-[0.98]",
          ],
          variant === "ghost" && [
            "bg-transparent text-foreground rounded-md",
            "hover:bg-muted hover:text-white active:scale-[0.98]",
          ],
          size === "lg" && "text-sm px-6 h-11",
          size === "md" && "text-sm px-4 h-9",
          size === "sm" && "text-xs px-3 h-7",
          className
        )}
        {...props}
      >
        {children}
      </button>
    );
  }
);
Button.displayName = "Button";
