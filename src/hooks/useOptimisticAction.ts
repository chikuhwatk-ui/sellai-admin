"use client";

import { useCallback, useRef, useState } from "react";
import { toast } from "sonner";

/*
 * Run a mutation with optimistic UI + inline undo.
 *
 * Usage:
 *   const { run } = useOptimisticAction();
 *   run({
 *     action: () => api.post(`/api/verification/${id}/approve`, {}),
 *     optimistic: () => markApprovedInList(id),
 *     rollback: () => undoFromList(id),
 *     label: "Verification approved",
 *     undoWindowMs: 5000,
 *   });
 *
 * Flow:
 *   1. run `optimistic()` immediately — UI reflects success
 *   2. show toast with Undo button, server call scheduled AFTER the
 *      undo window elapses (so we don't have to roll back the server)
 *   3. If Undo clicked: call `rollback()` and cancel the server call
 *   4. If server call fails: call `rollback()` + show error toast
 */
export interface OptimisticOptions<T> {
  action: () => Promise<T>;
  optimistic?: () => void;
  rollback?: () => void;
  label: string;
  description?: string;
  undoWindowMs?: number;
  onSuccess?: (result: T) => void;
  onError?: (err: Error) => void;
}

export function useOptimisticAction() {
  const pendingRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());
  const [pending, setPending] = useState<string[]>([]);

  const run = useCallback(<T,>(opts: OptimisticOptions<T>) => {
    const id = Math.random().toString(36).slice(2);
    const undoMs = opts.undoWindowMs ?? 5000;

    opts.optimistic?.();
    setPending((p) => [...p, id]);

    let undone = false;
    const timer = setTimeout(async () => {
      pendingRef.current.delete(id);
      setPending((p) => p.filter((x) => x !== id));
      if (undone) return;
      try {
        const result = await opts.action();
        opts.onSuccess?.(result);
      } catch (err) {
        opts.rollback?.();
        const message = err instanceof Error ? err.message : "Action failed";
        toast.error(message);
        opts.onError?.(err as Error);
      }
    }, undoMs);

    pendingRef.current.set(id, timer);

    toast(opts.label, {
      description: opts.description,
      action: {
        label: "Undo",
        onClick: () => {
          undone = true;
          const t = pendingRef.current.get(id);
          if (t) clearTimeout(t);
          pendingRef.current.delete(id);
          setPending((p) => p.filter((x) => x !== id));
          opts.rollback?.();
        },
      },
      duration: undoMs,
    });
  }, []);

  return { run, pending };
}
