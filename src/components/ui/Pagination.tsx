"use client";

import * as React from "react";
import { Button } from "./Button";
import { cn } from "@/lib/cn";

/*
 * Pagination — thin wrapper over Prev / page numbers / Next. Use on any
 * list page that returns { data, total } from the backend. Keep the
 * same shape across every list so the muscle memory carries.
 *
 * Usage:
 *
 *   <Pagination page={page} total={total} pageSize={20} onChange={setPage} />
 *
 * The component handles its own "hide when no pagination needed" — if
 * the total fits on one page the whole row is omitted, so callers don't
 * need conditional wrappers.
 */
export interface PaginationProps {
    page: number;
    total: number;
    pageSize?: number;
    /** Number of numeric page buttons shown in the middle. Default 5. */
    siblings?: number;
    onChange: (page: number) => void;
    className?: string;
    /** Override the "Showing X–Y of Z" label. */
    renderLabel?: (info: { from: number; to: number; total: number; page: number; totalPages: number }) => React.ReactNode;
}

export function Pagination({
    page,
    total,
    pageSize = 20,
    siblings = 5,
    onChange,
    className,
    renderLabel,
}: PaginationProps) {
    const totalPages = Math.max(1, Math.ceil(total / pageSize));
    if (totalPages <= 1) return null;

    const from = (page - 1) * pageSize + 1;
    const to = Math.min(page * pageSize, total);

    // Numeric window — try to keep `page` centered; clamp at both ends.
    const numbers: number[] = [];
    const half = Math.floor(siblings / 2);
    const end = Math.min(totalPages, Math.max(1, page - half) + siblings - 1);
    const start = Math.max(1, end - siblings + 1);
    for (let n = start; n <= end; n++) numbers.push(n);

    return (
        <div className={cn("flex items-center justify-between", className)}>
            <span className="text-2xs text-fg-subtle tabular">
                {renderLabel
                    ? renderLabel({ from, to, total, page, totalPages })
                    : <>Showing {from}–{to} of {total}</>
                }
            </span>
            <div className="flex items-center gap-1">
                <Button
                    size="sm"
                    variant="secondary"
                    disabled={page <= 1}
                    onClick={() => onChange(Math.max(1, page - 1))}
                >
                    Previous
                </Button>
                {numbers.map((n) => (
                    <Button
                        key={n}
                        size="sm"
                        variant={n === page ? "primary" : "secondary"}
                        onClick={() => onChange(n)}
                    >
                        {n}
                    </Button>
                ))}
                <Button
                    size="sm"
                    variant="secondary"
                    disabled={page >= totalPages}
                    onClick={() => onChange(Math.min(totalPages, page + 1))}
                >
                    Next
                </Button>
            </div>
        </div>
    );
}
