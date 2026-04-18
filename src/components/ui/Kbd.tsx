import * as React from "react";
import { cn } from "@/lib/cn";

/*
 * Keyboard hint. Usage: <Kbd>⌘</Kbd><Kbd>K</Kbd>
 * Normalizes platform symbols — ⌘ on Mac, Ctrl on others.
 */
export function Kbd({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <kbd
      className={cn(
        "inline-flex items-center justify-center h-[18px] min-w-[18px] px-1",
        "rounded border border-muted bg-raised text-fg-muted",
        "text-[10.5px] font-medium font-sans tabular",
        className
      )}
    >
      {children}
    </kbd>
  );
}

export function isMac() {
  if (typeof navigator === "undefined") return false;
  return /Mac|iPod|iPhone|iPad/.test(navigator.platform);
}

export function modKey() {
  return isMac() ? "⌘" : "Ctrl";
}
