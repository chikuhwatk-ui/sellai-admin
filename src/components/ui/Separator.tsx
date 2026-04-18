import { cn } from "@/lib/cn";

export function Separator({
  orientation = "horizontal",
  className,
}: {
  orientation?: "horizontal" | "vertical";
  className?: string;
}) {
  return (
    <div
      role="separator"
      className={cn(
        "bg-muted shrink-0",
        orientation === "horizontal" ? "h-px w-full" : "w-px h-full",
        className
      )}
    />
  );
}
