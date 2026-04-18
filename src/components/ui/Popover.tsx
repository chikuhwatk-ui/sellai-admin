"use client";

import * as React from "react";
import * as PopoverPrimitive from "@radix-ui/react-popover";
import { cn } from "@/lib/cn";

export const Popover = PopoverPrimitive.Root;
export const PopoverTrigger = PopoverPrimitive.Trigger;
export const PopoverAnchor = PopoverPrimitive.Anchor;

export const PopoverContent = React.forwardRef<
  React.ElementRef<typeof PopoverPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof PopoverPrimitive.Content>
>(({ className, align = "start", sideOffset = 6, ...props }, ref) => (
  <PopoverPrimitive.Portal>
    <PopoverPrimitive.Content
      ref={ref}
      align={align}
      sideOffset={sideOffset}
      className={cn(
        "z-50 bg-overlay border border-muted rounded-lg shadow-elev-3 p-2",
        "data-[state=open]:animate-scale-in data-[state=closed]:animate-scale-out",
        "focus:outline-none",
        className
      )}
      {...props}
    />
  </PopoverPrimitive.Portal>
));
PopoverContent.displayName = "PopoverContent";
