"use client";

import * as React from "react";
import * as LabelPrimitive from "@radix-ui/react-label";
import { cn } from "@/lib/cn";

export const Label = React.forwardRef<
  React.ElementRef<typeof LabelPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof LabelPrimitive.Root> & {
    required?: boolean;
    hint?: string;
  }
>(({ className, required, hint, children, ...props }, ref) => (
  <LabelPrimitive.Root
    ref={ref}
    className={cn(
      "flex items-center gap-1 text-xs font-medium text-fg-muted",
      "leading-none mb-1.5",
      className
    )}
    {...props}
  >
    <span>{children}</span>
    {required && <span className="text-danger">*</span>}
    {hint && <span className="text-fg-subtle font-normal ml-auto">{hint}</span>}
  </LabelPrimitive.Root>
));
Label.displayName = "Label";

export function Field({
  label,
  hint,
  error,
  required,
  children,
  htmlFor,
}: {
  label?: string;
  hint?: string;
  error?: string;
  required?: boolean;
  children: React.ReactNode;
  htmlFor?: string;
}) {
  return (
    <div className="flex flex-col">
      {label && (
        <Label htmlFor={htmlFor} required={required} hint={hint}>
          {label}
        </Label>
      )}
      {children}
      {error && <p className="mt-1 text-xs text-danger">{error}</p>}
    </div>
  );
}
