"use client";

import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/cn";

const input = cva(
  [
    "w-full bg-panel border rounded-md text-fg placeholder:text-fg-subtle",
    "transition-colors duration-fast",
    "focus-visible:outline-none focus-visible:border-accent focus-visible:ring-0",
    "disabled:opacity-50 disabled:cursor-not-allowed",
  ].join(" "),
  {
    variants: {
      invalid: {
        true: "border-danger focus-visible:border-danger",
        false: "border-default hover:border-strong",
      },
      size: {
        sm: "h-7 px-2 text-xs",
        md: "h-8 px-2.5 text-sm-compact",
        lg: "h-10 px-3 text-sm",
      },
    },
    defaultVariants: { invalid: false, size: "md" },
  }
);

export interface InputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "size">,
    VariantProps<typeof input> {
  leadingIcon?: React.ReactNode;
  trailingIcon?: React.ReactNode;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, invalid, size, leadingIcon, trailingIcon, ...props }, ref) => {
    if (leadingIcon || trailingIcon) {
      return (
        <div className="relative flex items-center">
          {leadingIcon && (
            <span className="absolute left-2 flex items-center text-fg-subtle pointer-events-none">
              {leadingIcon}
            </span>
          )}
          <input
            ref={ref}
            className={cn(input({ invalid, size }), leadingIcon && "pl-8", trailingIcon && "pr-8", className)}
            {...props}
          />
          {trailingIcon && (
            <span className="absolute right-2 flex items-center text-fg-subtle">
              {trailingIcon}
            </span>
          )}
        </div>
      );
    }
    return <input ref={ref} className={cn(input({ invalid, size }), className)} {...props} />;
  }
);
Input.displayName = "Input";

export const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.TextareaHTMLAttributes<HTMLTextAreaElement> & { invalid?: boolean }
>(({ className, invalid, ...props }, ref) => (
  <textarea
    ref={ref}
    className={cn(
      "w-full bg-panel border rounded-md text-fg placeholder:text-fg-subtle p-2.5 text-sm-compact",
      "transition-colors duration-fast",
      "focus-visible:outline-none focus-visible:border-accent",
      "disabled:opacity-50 disabled:cursor-not-allowed",
      "min-h-[80px] resize-y",
      invalid ? "border-danger focus-visible:border-danger" : "border-default hover:border-strong",
      className
    )}
    {...props}
  />
));
Textarea.displayName = "Textarea";
