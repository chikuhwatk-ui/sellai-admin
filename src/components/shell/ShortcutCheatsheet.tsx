"use client";

import * as React from "react";
import { useHotkeys } from "react-hotkeys-hook";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { cn } from "@/lib/cn";
import { shortcutsByGroup } from "@/lib/shortcuts";
import { X } from "lucide-react";

export function ShortcutCheatsheet() {
  const [open, setOpen] = React.useState(false);
  useHotkeys("shift+slash", (e) => { e.preventDefault(); setOpen(true); }, {
    enableOnFormTags: false,
    enableOnContentEditable: false,
  });

  const groups = shortcutsByGroup();

  return (
    <DialogPrimitive.Root open={open} onOpenChange={setOpen}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-[var(--color-overlay-scrim)] backdrop-blur-[2px] data-[state=open]:animate-fade-in" />
        <DialogPrimitive.Content
          className={cn(
            "fixed left-1/2 top-1/2 z-50 -translate-x-1/2 -translate-y-1/2 w-full max-w-xl max-h-[85vh]",
            "bg-overlay border border-muted rounded-xl shadow-elev-4 overflow-hidden flex flex-col",
            "data-[state=open]:animate-scale-in"
          )}
        >
          <div className="flex items-center justify-between px-5 py-3.5 border-b border-muted">
            <div>
              <DialogPrimitive.Title className="text-sm font-semibold text-fg">Keyboard shortcuts</DialogPrimitive.Title>
              <DialogPrimitive.Description className="text-xs text-fg-muted mt-0.5">
                Move faster. Press <kbd className="kbd">?</kbd> any time to reopen this.
              </DialogPrimitive.Description>
            </div>
            <DialogPrimitive.Close className="rounded-md p-1 text-fg-subtle hover:bg-raised hover:text-fg transition-colors">
              <X className="h-4 w-4" />
            </DialogPrimitive.Close>
          </div>
          <div className="flex-1 overflow-y-auto p-5 space-y-5">
            {Object.entries(groups).map(([group, items]) => (
              <div key={group}>
                <h4 className="text-2xs uppercase tracking-wider text-fg-subtle mb-2">{group}</h4>
                <ul className="space-y-1">
                  {items.map((s) => (
                    <li key={s.id} className="flex items-center justify-between py-1">
                      <span className="text-sm-compact text-fg">{s.label}</span>
                      <div className="flex items-center gap-1">
                        {s.display.map((k, i) => (
                          <kbd key={i} className="kbd">{k}</kbd>
                        ))}
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
