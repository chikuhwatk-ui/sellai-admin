"use client";

import * as React from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { cn } from "@/lib/cn";

/*
 * Side sheet — Linear/Height-style detail view that slides in from the right.
 * Use this instead of full-page navigation for row-detail contexts so the
 * list stays in place and Esc pops back.
 */

export const Sheet = DialogPrimitive.Root;
export const SheetTrigger = DialogPrimitive.Trigger;
export const SheetClose = DialogPrimitive.Close;

export const SheetContent = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content> & {
    side?: "right" | "left";
    width?: "sm" | "md" | "lg" | "xl";
  }
>(({ className, children, side = "right", width = "md", ...props }, ref) => {
  const widthClass = { sm: "max-w-md", md: "max-w-xl", lg: "max-w-2xl", xl: "max-w-4xl" }[width];
  const sideClass =
    side === "right"
      ? "right-0 data-[state=open]:animate-slide-in-right data-[state=closed]:animate-slide-out-right"
      : "left-0";

  return (
    <DialogPrimitive.Portal>
      <DialogPrimitive.Overlay
        className="fixed inset-0 z-40 bg-[var(--color-overlay-scrim)] backdrop-blur-[2px] data-[state=open]:animate-fade-in data-[state=closed]:animate-fade-out"
      />
      <DialogPrimitive.Content
        ref={ref}
        className={cn(
          "fixed top-0 bottom-0 z-50 w-full bg-panel border-l border-muted shadow-elev-4",
          "flex flex-col focus:outline-none",
          widthClass,
          sideClass,
          className
        )}
        {...props}
      >
        {children}
      </DialogPrimitive.Content>
    </DialogPrimitive.Portal>
  );
});
SheetContent.displayName = "SheetContent";

export function SheetHeader({
  title,
  subtitle,
  actions,
  className,
}: {
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex items-start gap-3 px-5 py-3.5 border-b border-muted", className)}>
      <div className="min-w-0 flex-1">
        <DialogPrimitive.Title className="text-sm font-semibold text-fg truncate">{title}</DialogPrimitive.Title>
        {subtitle && <div className="text-xs text-fg-muted mt-0.5 truncate">{subtitle}</div>}
      </div>
      <div className="flex items-center gap-1">
        {actions}
        <DialogPrimitive.Close className="rounded-md p-1 text-fg-subtle hover:bg-raised hover:text-fg transition-colors">
          <X className="h-4 w-4" />
          <span className="sr-only">Close</span>
        </DialogPrimitive.Close>
      </div>
    </div>
  );
}

export function SheetBody({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("flex-1 overflow-y-auto px-5 py-4", className)} {...props} />;
}

export function SheetFooter({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("px-5 py-3 border-t border-muted flex items-center justify-end gap-2", className)} {...props} />
  );
}
