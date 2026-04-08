import React from "react";

type StatusType =
  | "VERIFIED"
  | "PENDING"
  | "REJECTED"
  | "GUEST"
  | "COMPLETED"
  | "CANCELLED"
  | "IN_PROGRESS"
  | "CONFIRMED"
  | "DELIVERED"
  | "REQUESTED"
  | "BID_PENDING"
  | "BID_ACCEPTED"
  | "PICKED_UP"
  | "EN_ROUTE"
  | "ARRIVED"
  | "APPROVED"
  | "IN_REVIEW";

const statusStyles: Record<string, string> = {
  VERIFIED: "bg-primary/15 text-primary border-primary/25",
  APPROVED: "bg-primary/15 text-primary border-primary/25",
  COMPLETED: "bg-primary/15 text-primary border-primary/25",
  PENDING: "bg-warning/15 text-warning border-warning/25",
  BID_PENDING: "bg-warning/15 text-warning border-warning/25",
  REQUESTED: "bg-warning/15 text-warning border-warning/25",
  IN_REVIEW: "bg-info/15 text-info border-info/25",
  IN_PROGRESS: "bg-info/15 text-info border-info/25",
  EN_ROUTE: "bg-info/15 text-info border-info/25",
  CONFIRMED: "bg-info/15 text-info border-info/25",
  BID_ACCEPTED: "bg-info/15 text-info border-info/25",
  PICKED_UP: "bg-info/15 text-info border-info/25",
  DELIVERED: "bg-pending/15 text-pending border-pending/25",
  ARRIVED: "bg-pending/15 text-pending border-pending/25",
  REJECTED: "bg-danger/15 text-danger border-danger/25",
  CANCELLED: "bg-danger/15 text-danger border-danger/25",
  GUEST: "bg-border text-text-muted border-border",
};

interface StatusPillProps {
  status: StatusType | string;
  className?: string;
}

export function StatusPill({ status, className = "" }: StatusPillProps) {
  const style = statusStyles[status] || "bg-border text-text-muted border-border";
  const label = status.replace(/_/g, " ");

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${style} ${className}`}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-current opacity-80" />
      {label}
    </span>
  );
}

export default StatusPill;
