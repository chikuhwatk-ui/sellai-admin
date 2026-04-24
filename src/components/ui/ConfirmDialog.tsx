"use client";

import * as React from "react";
import { Dialog, DialogContent, DialogHeader, DialogBody, DialogFooter, DialogTitle, DialogDescription } from "./Dialog";
import { Button } from "./Button";

/*
 * ConfirmDialog — imperative, promise-based confirmation modal.
 *
 * Replaces `window.confirm()` throughout the admin. Native confirm is ugly,
 * not keyboard-friendly, blocks the tab, and instantly breaks the premium
 * feel of the rest of the app.
 *
 * Usage:
 *
 *   import { confirmDialog } from "@/components/ui/ConfirmDialog";
 *
 *   const ok = await confirmDialog({
 *     title: "Remove review?",
 *     body: "This will recalculate the seller rating.",
 *     confirmLabel: "Remove",
 *     destructive: true,
 *   });
 *   if (!ok) return;
 *
 * Mount <ConfirmDialogHost /> once at the root of the app (already wired
 * into src/app/layout.tsx). Never call confirmDialog() from server code —
 * it's client-only.
 */

export interface ConfirmOptions {
    title: React.ReactNode;
    body?: React.ReactNode;
    confirmLabel?: string;
    cancelLabel?: string;
    destructive?: boolean;
}

// Module-level emitter — `confirmDialog(opts)` publishes into it, the
// mounted host subscribes. Kept intentionally simple rather than using
// Context so it can be called from outside React (utils, services).
type Resolver = (opts: ConfirmOptions) => Promise<boolean>;
let emitter: Resolver = async () => {
    // Fallback when the host isn't mounted — fail closed for destructive
    // operations so a missing provider never silently confirms.
    return false;
};

export function confirmDialog(opts: ConfirmOptions): Promise<boolean> {
    return emitter(opts);
}

type Pending = ConfirmOptions & { resolve: (value: boolean) => void };

export function ConfirmDialogHost() {
    const [pending, setPending] = React.useState<Pending | null>(null);

    React.useEffect(() => {
        emitter = (opts) =>
            new Promise<boolean>((resolve) => setPending({ ...opts, resolve }));
        return () => {
            emitter = async () => false;
        };
    }, []);

    const close = (value: boolean) => {
        pending?.resolve(value);
        setPending(null);
    };

    const options = pending;
    const destructive = !!options?.destructive;

    return (
        <Dialog
            open={!!options}
            onOpenChange={(open) => { if (!open) close(false); }}
        >
            {options && (
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle>{options.title}</DialogTitle>
                        {options.body && (
                            <DialogDescription>{options.body}</DialogDescription>
                        )}
                    </DialogHeader>
                    <DialogBody className="py-0 pb-4">
                        {/* Body intentionally left for DialogDescription above;
                            this spacer prevents the footer border from sitting
                            flush against the title in dense confirmations. */}
                    </DialogBody>
                    <DialogFooter>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => close(false)}
                            autoFocus={!destructive}
                        >
                            {options.cancelLabel || "Cancel"}
                        </Button>
                        <Button
                            variant={destructive ? "danger" : "primary"}
                            size="sm"
                            onClick={() => close(true)}
                            autoFocus={destructive}
                        >
                            {options.confirmLabel || (destructive ? "Remove" : "Confirm")}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            )}
        </Dialog>
    );
}
