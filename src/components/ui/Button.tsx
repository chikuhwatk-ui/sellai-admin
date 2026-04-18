"use client";

import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/cn";

const button = cva(
  [
    "inline-flex items-center justify-center gap-1.5 whitespace-nowrap font-medium",
    "rounded-md transition-colors duration-fast ease-out",
    "focus-visible:outline-none",
    "disabled:pointer-events-none disabled:opacity-50",
    "select-none",
  ].join(" "),
  {
    variants: {
      variant: {
        primary:
          "bg-accent text-accent-fg hover:bg-accent-hover active:bg-[var(--color-accent-active)]",
        secondary:
          "bg-raised text-fg border border-default hover:bg-overlay hover:border-strong",
        ghost:
          "text-fg-muted hover:bg-raised hover:text-fg",
        outline:
          "border border-default text-fg hover:bg-raised hover:border-strong",
        danger:
          "bg-danger text-white hover:brightness-110 active:brightness-95",
        "danger-ghost":
          "text-danger hover:bg-[var(--color-danger-bg)]",
        link:
          "text-accent underline-offset-4 hover:underline p-0 h-auto",
      },
      size: {
        xs: "h-6 px-2 text-2xs",
        sm: "h-7 px-2.5 text-xs",
        md: "h-8 px-3 text-sm-compact",
        lg: "h-10 px-4 text-sm",
        icon: "h-8 w-8 p-0",
        "icon-sm": "h-7 w-7 p-0",
      },
    },
    defaultVariants: { variant: "secondary", size: "md" },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof button> {
  asChild?: boolean;
  loading?: boolean;
  leadingIcon?: React.ReactNode;
  trailingIcon?: React.ReactNode;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild, loading, disabled, leadingIcon, trailingIcon, children, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        ref={ref}
        className={cn(button({ variant, size, className }))}
        disabled={disabled || loading}
        {...props}
      >
        {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : leadingIcon}
        {children}
        {!loading && trailingIcon}
      </Comp>
    );
  }
);
Button.displayName = "Button";
