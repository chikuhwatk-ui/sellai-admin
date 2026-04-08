import React from "react";

type BadgeVariant =
  | "default"
  | "primary"
  | "success"
  | "danger"
  | "warning"
  | "info"
  | "pending"
  | "purple"
  | "buyer"
  | "seller"
  | "runner";

const variantClasses: Record<BadgeVariant, string> = {
  default: "bg-border text-text-muted",
  primary: "bg-primary/15 text-primary border-primary/20",
  success: "bg-emerald-500/15 text-emerald-400 border-emerald-500/20",
  danger: "bg-danger/15 text-danger border-danger/20",
  warning: "bg-warning/15 text-warning border-warning/20",
  info: "bg-info/15 text-info border-info/20",
  pending: "bg-pending/15 text-pending border-pending/20",
  purple: "bg-pending/15 text-pending border-pending/20",
  buyer: "bg-info/15 text-info border-info/20",
  seller: "bg-primary/15 text-primary border-primary/20",
  runner: "bg-warning/15 text-warning border-warning/20",
};

interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  className?: string;
}

export function Badge({
  children,
  variant = "default",
  className = "",
}: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border border-transparent ${variantClasses[variant]} ${className}`}
    >
      {children}
    </span>
  );
}

export function RoleBadge({ role }: { role: string }) {
  const variant: BadgeVariant =
    role === "BUYER"
      ? "buyer"
      : role === "SELLER"
        ? "seller"
        : role === "DELIVERY_PARTNER"
          ? "runner"
          : "default";
  const label =
    role === "DELIVERY_PARTNER"
      ? "Runner"
      : role.charAt(0) + role.slice(1).toLowerCase();
  return <Badge variant={variant}>{label}</Badge>;
}

export default Badge;
