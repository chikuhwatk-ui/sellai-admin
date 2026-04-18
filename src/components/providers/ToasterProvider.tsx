"use client";

import { Toaster } from "sonner";
import { useTheme } from "./ThemeProvider";

export function ToasterProvider() {
  const { theme } = useTheme();
  return (
    <Toaster
      position="bottom-right"
      theme={theme}
      richColors={false}
      closeButton
      duration={5000}
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
