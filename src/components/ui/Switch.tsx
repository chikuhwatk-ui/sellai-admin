"use client";

import * as React from "react";
import * as SwitchPrimitive from "@radix-ui/react-switch";
import { cn } from "@/lib/cn";

export const Switch = React.forwardRef<
  React.ElementRef<typeof SwitchPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof SwitchPrimitive.Root>
>(({ className, ...props }, ref) => (
  <SwitchPrimitive.Root
    ref={ref}
    className={cn(
      "peer relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full",
      "transition-colors duration-fast",
      "data-[state=checked]:bg-accent data-[state=unchecked]:bg-raised",
      "disabled:opacity-50 disabled:cursor-not-allowed",
      className
    )}
    {...props}
  >
    <SwitchPrimitive.Thumb
      className={cn(
        "pointer-events-none block h-4 w-4 rounded-full bg-white shadow-sm-token ring-0",
        "transition-transform duration-fast ease-out",
        "data-[state=checked]:translate-x-[18px] data-[state=unchecked]:translate-x-0.5"
      )}
    />
  </SwitchPrimitive.Root>
));
Switch.displayName = "Switch";
