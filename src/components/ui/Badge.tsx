import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/cn";

const badge = cva(
  "inline-flex items-center gap-1 font-medium whitespace-nowrap",
  {
    variants: {
      tone: {
        neutral: "bg-raised text-fg-muted",
        accent: "bg-accent-bg text-accent",
        success: "bg-success-bg text-success",
        danger: "bg-danger-bg text-danger",
        warning: "bg-warning-bg text-warning",
        info: "bg-info-bg text-info",
        pending: "bg-pending-bg text-pending",
      },
      size: {
        sm: "h-[18px] px-1.5 text-2xs rounded",
        md: "h-5 px-2 text-2xs rounded",
        lg: "h-6 px-2.5 text-xs rounded-md",
      },
      shape: {
        square: "",
        pill: "!rounded-full",
      },
    },
    defaultVariants: { tone: "neutral", size: "md", shape: "square" },
  }
);

// Legacy variant → tone map for migration compatibility.
type LegacyVariant =
  | "default" | "primary" | "success" | "danger" | "warning"
  | "info" | "pending" | "purple" | "buyer" | "seller" | "runner";

const LEGACY_TONE: Record<LegacyVariant, VariantProps<typeof badge>["tone"]> = {
  default: "neutral",
  primary: "accent",
  success: "success",
  danger: "danger",
  warning: "warning",
  info: "info",
  pending: "pending",
  purple: "pending",
  buyer: "info",
  seller: "accent",
  runner: "warning",
};

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    Omit<VariantProps<typeof badge>, "tone"> {
  tone?: VariantProps<typeof badge>["tone"];
  variant?: LegacyVariant;
  dot?: boolean;
}

export function Badge({ className, tone, variant, size, shape, dot, children, ...props }: BadgeProps) {
  const resolvedTone = tone ?? (variant ? LEGACY_TONE[variant] : "neutral");
  return (
    <span className={cn(badge({ tone: resolvedTone, size, shape }), className)} {...props}>
      {dot && <span className="h-1.5 w-1.5 rounded-full bg-current opacity-80" />}
      {children}
    </span>
  );
}

const ROLE_TONE: Record<string, VariantProps<typeof badge>["tone"]> = {
  BUYER: "info",
  SELLER: "accent",
  DELIVERY_PARTNER: "warning",
  ADMIN: "pending",
  SUPER_ADMIN: "pending",
  ADMIN_MANAGER: "pending",
  SUPPORT_AGENT: "pending",
  ADMIN_VIEWER: "neutral",
};

const ROLE_LABEL: Record<string, string> = {
  DELIVERY_PARTNER: "Runner",
  SUPER_ADMIN: "Super Admin",
  ADMIN_MANAGER: "Manager",
  SUPPORT_AGENT: "Support",
  ADMIN_VIEWER: "Viewer",
};

export function RoleBadge({ role }: { role: string }) {
  const tone = ROLE_TONE[role] || "neutral";
  const label = ROLE_LABEL[role] || role.charAt(0) + role.slice(1).toLowerCase();
  return <Badge tone={tone} size="sm">{label}</Badge>;
}

export default Badge;
