"use client";

import * as React from "react";
import * as SelectPrimitive from "@radix-ui/react-select";
import { Check, ChevronDown } from "lucide-react";
import { cn } from "@/lib/cn";

export const Select = SelectPrimitive.Root;
export const SelectValue = SelectPrimitive.Value;
export const SelectGroup = SelectPrimitive.Group;

export const SelectTrigger = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Trigger> & {
    size?: "sm" | "md" | "lg";
  }
>(({ className, children, size = "md", ...props }, ref) => {
  const sizeClass = { sm: "h-7 px-2 text-xs", md: "h-8 px-2.5 text-sm-compact", lg: "h-10 px-3 text-sm" }[size];
  return (
    <SelectPrimitive.Trigger
      ref={ref}
      className={cn(
        "inline-flex items-center justify-between gap-2 w-full rounded-md bg-panel border border-default text-fg",
        "hover:border-strong transition-colors duration-fast",
        "focus-visible:outline-none focus-visible:border-accent",
        "data-[placeholder]:text-fg-subtle",
        "disabled:cursor-not-allowed disabled:opacity-50",
        sizeClass,
        className
      )}
      {...props}
    >
      {children}
      <SelectPrimitive.Icon asChild>
        <ChevronDown className="h-3.5 w-3.5 opacity-60" />
      </SelectPrimitive.Icon>
    </SelectPrimitive.Trigger>
  );
});
SelectTrigger.displayName = "SelectTrigger";

export const SelectContent = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Content>
>(({ className, children, position = "popper", ...props }, ref) => (
  <SelectPrimitive.Portal>
    <SelectPrimitive.Content
      ref={ref}
      position={position}
      className={cn(
        "relative z-50 max-h-96 min-w-[var(--radix-select-trigger-width)] overflow-hidden",
        "bg-overlay border border-muted rounded-md shadow-elev-3",
        "data-[state=open]:animate-scale-in",
        className
      )}
      {...props}
    >
      <SelectPrimitive.Viewport className="p-1">{children}</SelectPrimitive.Viewport>
    </SelectPrimitive.Content>
  </SelectPrimitive.Portal>
));
SelectContent.displayName = "SelectContent";

export const SelectItem = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Item>
>(({ className, children, ...props }, ref) => (
  <SelectPrimitive.Item
    ref={ref}
    className={cn(
      "relative flex items-center justify-between gap-2 rounded px-2 py-1.5",
      "text-sm-compact text-fg cursor-pointer select-none",
      "data-[highlighted]:bg-raised data-[highlighted]:outline-none",
      "data-[disabled]:opacity-50 data-[disabled]:pointer-events-none",
      className
    )}
    {...props}
  >
    <SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText>
    <SelectPrimitive.ItemIndicator>
      <Check className="h-3.5 w-3.5 text-accent" />
    </SelectPrimitive.ItemIndicator>
  </SelectPrimitive.Item>
));
SelectItem.displayName = "SelectItem";

export const SelectSeparator = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Separator>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Separator>
>(({ className, ...props }, ref) => (
  <SelectPrimitive.Separator ref={ref} className={cn("my-1 h-px bg-muted", className)} {...props} />
));
SelectSeparator.displayName = "SelectSeparator";
