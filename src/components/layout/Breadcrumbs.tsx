"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/cn";

const SEGMENT_LABEL: Record<string, string> = {
  dashboard: "Dashboard",
  users: "Users",
  verification: "Verification",
  orders: "Demand Center",
  deliveries: "Deliveries",
  finance: "Finance",
  analytics: "Analytics",
  marketplace: "Marketplace",
  geographic: "Geographic",
  categories: "Categories",
  trust: "Trust",
  operations: "Operations",
  predictive: "Predictive",
  "users-economics": "User Economics",
  communications: "Communications",
  disputes: "Disputes",
  support: "Support",
  chats: "Chats",
  "audit-log": "Audit Log",
  "admin-management": "Admin Management",
  settings: "Settings",
  reviews: "Review Moderation",
  "seller-success": "Seller Success",
  approvals: "Approvals",
  expenses: "Expenses",
  journal: "Journal",
  periods: "Periods",
  reports: "Reports",
  revenue: "Revenue",
  tax: "Tax",
  accounts: "Accounts",
};

function labelFor(segment: string) {
  if (SEGMENT_LABEL[segment]) return SEGMENT_LABEL[segment];
  // Detail-ID segments like [id] become "Detail"
  if (/^[0-9a-f-]{8,}/i.test(segment)) return "Detail";
  return segment.charAt(0).toUpperCase() + segment.slice(1);
}

export function Breadcrumbs({ className }: { className?: string }) {
  const pathname = usePathname();
  const segments = pathname.split("/").filter(Boolean);
  if (segments.length <= 1) return null;

  const crumbs = segments.map((seg, i) => ({
    label: labelFor(seg),
    href: "/" + segments.slice(0, i + 1).join("/"),
    isLast: i === segments.length - 1,
  }));

  return (
    <nav className={cn("flex items-center gap-1 text-xs", className)} aria-label="Breadcrumb">
      {crumbs.map((c, i) => (
        <div key={c.href} className="flex items-center gap-1">
          {i > 0 && <ChevronRight className="h-3 w-3 text-fg-subtle" />}
          {c.isLast ? (
            <span className="text-fg font-medium">{c.label}</span>
          ) : (
            <Link href={c.href} className="text-fg-muted hover:text-fg transition-colors">
              {c.label}
            </Link>
          )}
        </div>
      ))}
    </nav>
  );
}
