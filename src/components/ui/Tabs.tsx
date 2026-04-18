"use client";

import * as React from "react";
import * as TabsPrimitive from "@radix-ui/react-tabs";
import { cn } from "@/lib/cn";

export const Tabs = TabsPrimitive.Root;

export const TabsList = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.List>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.List> & { variant?: "line" | "pill" }
>(({ className, variant = "line", ...props }, ref) => (
  <TabsPrimitive.List
    ref={ref}
    className={cn(
      variant === "line" ? "flex items-center gap-1 border-b border-muted" : "inline-flex items-center gap-0.5 bg-raised rounded-md p-0.5",
      className
    )}
    {...props}
  />
));
TabsList.displayName = "TabsList";

export const TabsTrigger = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Trigger> & { variant?: "line" | "pill" }
>(({ className, variant = "line", ...props }, ref) => (
  <TabsPrimitive.Trigger
    ref={ref}
    className={cn(
      "inline-flex items-center gap-1.5 whitespace-nowrap text-sm-compact font-medium transition-colors",
      "disabled:opacity-50 disabled:pointer-events-none",
      variant === "line"
        ? [
            "relative h-9 px-3 text-fg-muted hover:text-fg",
            "data-[state=active]:text-fg",
            "data-[state=active]:after:absolute data-[state=active]:after:bottom-[-1px] data-[state=active]:after:left-2 data-[state=active]:after:right-2 data-[state=active]:after:h-0.5 data-[state=active]:after:bg-accent",
          ].join(" ")
        : "h-7 px-2.5 rounded text-fg-muted hover:text-fg data-[state=active]:bg-panel data-[state=active]:text-fg data-[state=active]:shadow-elev-1",
      className
    )}
    {...props}
  />
));
TabsTrigger.displayName = "TabsTrigger";

export const TabsContent = TabsPrimitive.Content;
