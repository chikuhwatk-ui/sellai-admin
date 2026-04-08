"use client";

import Sidebar from "./Sidebar";
import Header from "./Header";
import { ErrorBoundary } from "./ErrorBoundary";
import { usePathname } from "next/navigation";
import { useSessionTimeout } from "@/hooks/useSessionTimeout";

const routeTitles: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/users": "Users",
  "/verification": "Verification",
  "/orders": "Orders",
  "/deliveries": "Deliveries",
  "/finance": "Finance",
  "/communications": "Communications",
  "/analytics/marketplace": "Marketplace Analytics",
  "/analytics/users-economics": "User Economics",
  "/analytics/geographic": "Geographic Analytics",
  "/analytics/trust": "Trust & Quality",
  "/analytics/categories": "Category Analytics",
  "/analytics/operations": "Operations Analytics",
  "/analytics/predictive": "Predictive Analytics",
  "/disputes": "Disputes",
  "/seller-success": "Seller Success",
  "/support": "Support Tickets",
  "/settings": "Settings",
  "/settings/audit-log": "Audit Log",
};

function DashboardLayoutInner({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const title = routeTitles[pathname] || "Sellai Admin";
  useSessionTimeout();

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <div className="flex flex-col flex-1 min-w-0">
        <Header title={title} />
        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    </div>
  );
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ErrorBoundary>
      <DashboardLayoutInner>{children}</DashboardLayoutInner>
    </ErrorBoundary>
  );
}
