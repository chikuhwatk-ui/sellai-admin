"use client";

interface StaleConnectionBannerProps {
  stale: boolean;
  onRetry: () => void;
}

export function StaleConnectionBanner({ stale, onRetry }: StaleConnectionBannerProps) {
  if (!stale) return null;
  return (
    <div className="bg-warning/10 border-b border-warning/20 px-4 py-2 flex items-center justify-between text-xs">
      <div className="flex items-center gap-2 text-warning">
        <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
          <line x1="12" y1="9" x2="12" y2="13" />
          <line x1="12" y1="17" x2="12.01" y2="17" />
        </svg>
        <span className="font-medium">Connection issue — data shown may be stale.</span>
      </div>
      <button
        onClick={onRetry}
        className="px-2 py-1 rounded text-warning hover:bg-warning/10 font-medium transition-colors"
      >
        Retry
      </button>
    </div>
  );
}
