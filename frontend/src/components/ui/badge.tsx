import { cn } from "@/lib/utils";
import React from "react";

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: "pro" | "info" | "default" | "success";
  children: React.ReactNode;
}

export const Badge = React.forwardRef<HTMLSpanElement, BadgeProps>(
  ({ className, variant = "default", children, ...props }, ref) => {
    return (
      <span
        ref={ref}
        className={cn(
          "inline-flex items-center font-geist text-xs leading-none tracking-wide rounded-md px-2 py-1",
          variant === "default" && "bg-muted text-muted-foreground",
          variant === "pro" && "bg-primary/10 text-primary border border-primary/20",
          variant === "info" && "bg-primary/10 text-primary border border-primary/20",
          variant === "success" && "bg-green-500/10 text-green-500 border border-green-500/20",
          className
        )}
        {...props}
      >
        {children}
      </span>
    );
  }
);
Badge.displayName = "Badge";
