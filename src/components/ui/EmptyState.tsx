import * as React from "react";
import { cn } from "@/lib/cn";

/**
 * EmptyState — icon + title + description + optional CTA.
 *
 * Always render at least the title. Icon is strongly recommended (the
 * circular chrome around it anchors the composition); description is
 * optional but most screens benefit from it. Action is a Button — keep
 * to one primary action, not a grid of choices.
 *
 * Spacing uses a flex-column with `gap-*` so the rhythm stays on the
 * 4-unit grid without relying on scattered `mt-*` values.
 */
export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
}: {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col items-center justify-center text-center py-12 px-6 gap-3", className)}>
      {icon && (
        <div className="h-10 w-10 rounded-lg bg-raised border border-muted flex items-center justify-center text-fg-subtle">
          {icon}
        </div>
      )}
      <div className="flex flex-col items-center gap-1">
        <h3 className="text-sm font-semibold text-fg">{title}</h3>
        {description && <p className="text-xs text-fg-muted max-w-sm">{description}</p>}
      </div>
      {action && <div className="mt-1">{action}</div>}
    </div>
  );
}
