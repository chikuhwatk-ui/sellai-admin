import * as React from "react";
import { cn } from "@/lib/cn";

/**
 * PageHeader — the single editorial moment per screen.
 *
 * The h1 uses the Fraunces display serif via `.font-display`, which is
 * deliberately the only place the serif appears. Body text, section
 * headings, and all UI chrome stay on Geist. One memorable typographic
 * move per page; the rest is refined minimalism.
 */
export function PageHeader({
  title,
  description,
  actions,
  children,
  className,
}: {
  title: React.ReactNode;
  description?: React.ReactNode;
  actions?: React.ReactNode;
  children?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex items-start justify-between gap-4 pb-4", className)}>
      <div className="min-w-0 flex-1">
        <h1 className="font-display text-[26px] leading-[1.15] font-medium text-fg">
          {title}
        </h1>
        {description && <p className="text-xs text-fg-muted mt-1.5">{description}</p>}
        {children}
      </div>
      {actions && <div className="flex items-center gap-2 shrink-0">{actions}</div>}
    </div>
  );
}

/**
 * PageContainer — caps the content measure at 1440px on wide screens so
 * line length stays in a readable 65–85ch band. On narrower screens the
 * container is a simple padded block.
 */
export function PageContainer({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("p-4 sm:p-6 space-y-4 max-w-[1440px] mx-auto w-full", className)}>
      {children}
    </div>
  );
}
