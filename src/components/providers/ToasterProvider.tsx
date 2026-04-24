"use client";

import { Toaster } from "sonner";
import { useTheme } from "./ThemeProvider";

/**
 * Toaster mount point.
 *
 * Sonner already renders its region with `role="status"` + `aria-live`
 * so new toasts are announced to screen readers without stealing
 * focus. `hotkey` lets keyboard users jump into the toast region
 * explicitly without fishing for it with Tab.
 */
export function ToasterProvider() {
  const { theme } = useTheme();
  return (
    <Toaster
      position="bottom-right"
      theme={theme}
      richColors={false}
      closeButton
      duration={5000}
      hotkey={["altKey", "KeyT"]}
      toastOptions={{
        classNames: {
          toast:
            "bg-overlay border border-muted text-fg rounded-lg shadow-elev-3 !font-sans !text-sm",
          description: "text-fg-muted",
          actionButton: "!bg-accent !text-accent-fg",
          cancelButton: "!bg-raised !text-fg",
        },
      }}
    />
  );
}
