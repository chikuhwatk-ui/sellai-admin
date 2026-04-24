// Status-indicator colors for the LiveMap + legend.
//
// These are intentionally fixed semantic tones (red = freshly requested,
// green = en route, amber = bid accepted, etc.) so they keep the same
// meaning across light / dark mode and across localisations. The map is
// a status visualisation, not decorative chrome — a dark-mode "en route"
// that switched hue would confuse an operator glancing at the board.
//
// If you need to tune them (accessibility, brand alignment), change the
// values here once — every consumer pulls from this module.

export const STATUS_HEX: Record<string, string> = {
    REQUESTED: "oklch(0.68 0.22 25)",    // coral-red — urgent
    BID_PENDING: "oklch(0.75 0.17 50)",  // amber
    BID_ACCEPTED: "oklch(0.80 0.16 80)", // yellow-green
    PICKED_UP: "oklch(0.72 0.15 240)",   // blue
    EN_ROUTE: "oklch(0.72 0.18 155)",    // green
    ARRIVED: "oklch(0.70 0.20 290)",     // purple
    COMPLETED: "oklch(0.55 0.015 255)",  // neutral grey — done
    CANCELLED: "oklch(0.42 0.012 255)",  // darker grey — cancelled
};

/** Colour used for the runner dot on the map. Intentionally the same as
 *  PICKED_UP so the legend reads as one concept. */
export const RUNNER_DOT_HEX = STATUS_HEX.PICKED_UP;

/** Fallback used when a server-side status string is new or unexpected. */
export const UNKNOWN_STATUS_HEX = "oklch(0.55 0.015 255)";

/** Legend rows in render order. */
export const LIVEMAP_LEGEND: Array<{ color: string; label: string; square?: boolean }> = [
    { color: STATUS_HEX.EN_ROUTE, label: "En route" },
    { color: STATUS_HEX.PICKED_UP, label: "Picked" },
    { color: STATUS_HEX.BID_ACCEPTED, label: "Accepted" },
    { color: STATUS_HEX.REQUESTED, label: "Requested" },
    { color: RUNNER_DOT_HEX, label: "Runner", square: true },
];
