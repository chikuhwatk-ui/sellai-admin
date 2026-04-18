import { cn } from "@/lib/cn";

/*
 * Skeleton shapes that match final-layout contours.
 * Usage: <Skeleton className="h-4 w-24" />
 * Or compose a card preview with multiple skeletons in the final layout.
 */
export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "relative overflow-hidden bg-raised rounded-md",
        "before:absolute before:inset-0 before:-translate-x-full",
        "before:bg-gradient-to-r before:from-transparent before:via-white/[0.04] before:to-transparent",
        "before:animate-shimmer",
        className
      )}
    />
  );
}
