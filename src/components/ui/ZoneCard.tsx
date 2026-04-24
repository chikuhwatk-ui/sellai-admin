"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/cn";

/**
 * ZoneCard — the atrium primitive.
 *
 * Each card is a magazine-style entry into a group of related
 * sub-pages. The shape was born on /finance and is now the pattern
 * for every top-level section in the admin (Trade, Moderation,
 * Finance, Analytics, Admin).
 *
 * The composition, in layers:
 *   1. Editorial index number (01, 02, 03…) in the corner — gives
 *      the atrium magazine-like pacing.
 *   2. Eyebrow label in uppercase Geist Mono, wide-tracked; optional
 *      pulsing dot when `live=true` for real-time zones.
 *   3. Title in Fraunces display serif — the one editorial moment
 *      per card.
 *   4. One sentence of descriptive copy.
 *   5. Optional headline stat (e.g. "$12,430 recognized").
 *   6. Link rows flush to the card edges, each with an
 *      arrow-up-right icon that translates on hover. Each link may
 *      be filtered out via `hidden` (see ZoneLink below) — use this
 *      for permission-based link visibility.
 */
export interface ZoneLink {
    href: string;
    label: string;
    /** Optional meta line rendered under the label. */
    meta?: string;
    /** When true, the link is not rendered. Useful for RBAC filtering. */
    hidden?: boolean;
}

export function ZoneCard({
    index,
    eyebrow,
    live,
    title,
    description,
    stat,
    statLabel,
    links,
    className,
}: {
    index: string;
    eyebrow: string;
    live?: boolean;
    title: string;
    description: string;
    stat?: string;
    statLabel?: string;
    links: ZoneLink[];
    className?: string;
}) {
    const visibleLinks = links.filter((l) => !l.hidden);

    // When RBAC filters every link away, hide the zone entirely rather
    // than leaving an empty card. This keeps atriums dense for roles
    // with narrow permission sets.
    if (visibleLinks.length === 0) return null;

    return (
        <div
            className={cn(
                "relative rounded-xl bg-panel border border-muted overflow-hidden",
                "transition-colors duration-fast ease-out hover:border-strong",
                className,
            )}
        >
            {/* Editorial index — magazine-style pacing in the corner. */}
            <span
                className="absolute top-3 right-4 font-mono text-2xs text-fg-subtle tabular"
                aria-hidden="true"
            >
                {index}
            </span>

            <div className="p-5 pb-0 flex flex-col gap-3">
                {/* Eyebrow + optional live indicator */}
                <div className="flex items-center gap-1.5">
                    {live && (
                        <span className="relative inline-flex h-1.5 w-1.5">
                            <span className="absolute inline-flex h-full w-full rounded-full bg-success opacity-60 animate-ping" />
                            <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-success" />
                        </span>
                    )}
                    <span className="font-mono text-[10.5px] uppercase tracking-[0.22em] text-fg-muted">
                        {eyebrow}
                    </span>
                </div>

                {/* Title — the Fraunces moment */}
                <h2 className="font-display text-[28px] leading-[1.1] font-medium text-fg tracking-tight">
                    {title}
                </h2>

                <p className="text-xs text-fg-muted leading-relaxed max-w-lg">
                    {description}
                </p>

                {/* Headline stat */}
                {stat && (
                    <div className="pt-1">
                        <div className="text-2xs uppercase tracking-wider text-fg-subtle">{statLabel}</div>
                        <div className="text-2xl font-semibold text-fg tabular mt-0.5">{stat}</div>
                    </div>
                )}
            </div>

            {/* Link rows — flush to the card edges for an architectural feel. */}
            <ul className="mt-4 divide-y divide-[color:var(--color-border-muted)] border-t border-muted">
                {visibleLinks.map((l) => (
                    <li key={l.href}>
                        <Link
                            href={l.href}
                            className={cn(
                                "group flex items-center justify-between gap-3 px-5 py-3",
                                "text-sm text-fg hover:bg-raised transition-colors duration-fast",
                            )}
                        >
                            <span className="min-w-0 flex-1 flex flex-col">
                                <span className="font-medium truncate">{l.label}</span>
                                {l.meta && (
                                    <span className="text-2xs text-fg-muted mt-0.5 truncate">
                                        {l.meta}
                                    </span>
                                )}
                            </span>
                            <ArrowUpRight
                                className="h-3.5 w-3.5 text-fg-subtle group-hover:text-fg transition-transform duration-fast group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                                aria-hidden="true"
                            />
                        </Link>
                    </li>
                ))}
            </ul>
        </div>
    );
}
