import * as React from "react";
import { ArrowUpRight, ArrowDownRight } from "lucide-react";
import { cn } from "@/lib/cn";

/*
 * Dense stat block for dashboard rows. Replaces KPICard with smaller
 * footprint — 6 per row on desktop instead of 4. Optional sparkline
 * via children.
 */
export interface StatBlockProps {
  label: string;
  value: string | number;
  delta?: number;
  deltaFormat?: "percent" | "abs";
  hint?: string;
  onClick?: () => void;
  children?: React.ReactNode; // sparkline
  className?: string;
}

export function StatBlock({ label, value, delta, deltaFormat = "percent", hint, onClick, children, className }: StatBlockProps) {
  const positive = delta !== undefined && delta >= 0;
  const Arrow = positive ? ArrowUpRight : ArrowDownRight;
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={!onClick}
      className={cn(
        "flex flex-col items-start gap-1 min-w-0 w-full text-left",
        "rounded-lg border border-muted bg-panel p-3",
        "transition-colors",
        onClick && "cursor-pointer hover:border-strong hover:bg-raised",
        !onClick && "cursor-default",
        className
      )}
    >
      <div className="flex items-center justify-between w-full">
        <span className="text-2xs uppercase tracking-wider text-fg-subtle truncate">{label}</span>
        {delta !== undefined && (
          <span className={cn("inline-flex items-center gap-0.5 text-2xs font-medium tabular", positive ? "text-success" : "text-danger")}>
            <Arrow className="h-3 w-3" />
            {Math.abs(delta).toFixed(deltaFormat === "percent" ? 1 : 0)}{deltaFormat === "percent" ? "%" : ""}
          </span>
        )}
      </div>
      <div className="text-xl font-semibold text-fg tabular leading-none">
        {value}
      </div>
      {hint && <div className="text-2xs text-fg-subtle">{hint}</div>}
      {children && <div className="w-full mt-1">{children}</div>}
    </button>
  );
}
