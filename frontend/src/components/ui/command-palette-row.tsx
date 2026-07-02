import { cn } from "@/lib/utils";
import React from "react";

interface CommandPaletteRowProps extends React.HTMLAttributes<HTMLDivElement> {
  active?: boolean;
  icon?: React.ReactNode;
  label: React.ReactNode;
  shortcut?: React.ReactNode;
  children?: React.ReactNode;
}

export const CommandPaletteRow = React.forwardRef<HTMLDivElement, CommandPaletteRowProps>(
  ({ className, active = false, icon, label, shortcut, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "flex items-center gap-3 px-2.5 py-1.5 rounded-[var(--radius-sm)] cursor-pointer",
          active
            ? "bg-[var(--surface-card)] text-[var(--on-dark)]"
            : "bg-transparent text-[var(--on-dark)] hover:bg-[var(--surface-card)]/50",
          className
        )}
        {...props}
      >
        {icon && <span className="shrink-0 text-[var(--body)]">{icon}</span>}
        <div className="flex-1 min-w-0">
          <div className="font-body text-[16px] leading-[1.6]">{label}</div>
          {children && <div className="text-[var(--mute)] font-body text-[13px] leading-[1.4]">{children}</div>}
        </div>
        {shortcut && <span className="shrink-0">{shortcut}</span>}
      </div>
    );
  }
);
CommandPaletteRow.displayName = "CommandPaletteRow";
