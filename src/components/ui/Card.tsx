import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/cn";

const card = cva("rounded-xl transition-colors duration-fast ease-out", {
  variants: {
    variant: {
      default: "bg-panel border border-muted",
      bordered: "bg-panel border border-strong",
      raised: "bg-raised border border-muted shadow-elev-1",
      gradient: "bg-gradient-to-br from-panel via-panel to-canvas border border-muted",
      ghost: "bg-transparent border border-muted",
    },
  },
  defaultVariants: { variant: "default" },
});

export interface CardProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof card> {
  hover?: boolean;
  hoverable?: boolean;
  padding?: boolean;
}

export const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant, hover, hoverable, onClick, padding = true, ...props }, ref) => {
    const isClickable = !!onClick || hover || hoverable;
    return (
      <div
        ref={ref}
        onClick={onClick}
        className={cn(
          card({ variant }),
          isClickable && "cursor-pointer hover:border-strong hover:bg-raised",
          padding && "p-5",
          className
        )}
        {...props}
      />
    );
  }
);
Card.displayName = "Card";

export function CardHeader({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("px-5 py-3.5 border-b border-muted flex items-start justify-between gap-3", className)} {...props} />;
}

export function CardTitle({ className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
  return <h3 className={cn("text-sm font-semibold text-fg", className)} {...props} />;
}

export function CardDescription({ className, ...props }: React.HTMLAttributes<HTMLParagraphElement>) {
  return <p className={cn("mt-0.5 text-xs text-fg-muted", className)} {...props} />;
}

export function CardContent({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("px-5 py-4", className)} {...props} />;
}

export default Card;
