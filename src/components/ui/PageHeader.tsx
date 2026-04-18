import * as React from "react";
import { cn } from "@/lib/cn";

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
        <h1 className="text-xl font-semibold text-fg tracking-tight">{title}</h1>
        {description && <p className="text-xs text-fg-muted mt-1">{description}</p>}
        {children}
      </div>
      {actions && <div className="flex items-center gap-2 shrink-0">{actions}</div>}
    </div>
  );
}

export function PageContainer({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn("p-4 sm:p-6 space-y-4", className)}>{children}</div>;
}
