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
    {required && (
      <>
        <span aria-hidden="true" className="text-danger">*</span>
        <span className="sr-only">required</span>
      </>
    )}
    {hint && <span className="text-fg-subtle font-normal ml-auto">{hint}</span>}
  </LabelPrimitive.Root>
));
Label.displayName = "Label";

/**
 * Field — labelled input wrapper with accessible error plumbing.
 *
 * Wires up `htmlFor` ↔ input `id`, announces errors via `role="alert"`,
 * and automatically injects `aria-describedby` + `aria-invalid` onto
 * the child input. Screen reader users get the error read out as soon
 * as it appears.
 *
 * Usage:
 *
 *   <Field label="Email" htmlFor="email" error={errors.email} required>
 *     <Input id="email" type="email" />
 *   </Field>
 *
 * If the child input already has its own `aria-describedby`, this
 * component extends it rather than overwriting.
 */
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
  const reactId = React.useId();
  const fieldId = htmlFor || reactId;
  const errorId = `${fieldId}-error`;

  // Only clone a valid element — otherwise let the child render as-is.
  const enhancedChild = React.isValidElement(children)
    ? React.cloneElement(children as React.ReactElement<any>, {
        id: (children as React.ReactElement<any>).props.id || fieldId,
        "aria-invalid": error ? true : (children as React.ReactElement<any>).props["aria-invalid"],
        "aria-describedby": error
          ? [(children as React.ReactElement<any>).props["aria-describedby"], errorId]
              .filter(Boolean)
              .join(" ")
          : (children as React.ReactElement<any>).props["aria-describedby"],
      })
    : children;

  return (
    <div className="flex flex-col">
      {label && (
        <Label htmlFor={fieldId} required={required} hint={hint}>
          {label}
        </Label>
      )}
      {enhancedChild}
      {error && (
        <p id={errorId} role="alert" className="mt-1 text-xs text-danger">
          {error}
        </p>
      )}
    </div>
  );
}
