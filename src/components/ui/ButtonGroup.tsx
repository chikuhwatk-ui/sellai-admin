import * as React from "react";
import { cn } from "@/lib/cn";

/*
 * ButtonGroup — visual container for a set of related actions.
 *
 * Use to anchor a bulk-action toolbar or any cluster of buttons that
 * belong together. Gap stays on the 4-unit grid; padding + border keep
 * the group visually distinct from ad-hoc flex rows.
 *
 * For pure side-by-side buttons with no container chrome, a plain flex
 * with `gap-1.5` is fine — reserve this for toolbars.
 */
export function ButtonGroup({
    className,
    children,
    compact = false,
    ...props
}: React.HTMLAttributes<HTMLDivElement> & { compact?: boolean }) {
    return (
        <div
            className={cn(
                "inline-flex items-center",
                compact ? "gap-0.5 p-0.5" : "gap-1 p-1",
                "bg-raised border border-muted rounded-md shadow-elev-1",
                className,
            )}
            {...props}
        >
            {children}
        </div>
    );
}
