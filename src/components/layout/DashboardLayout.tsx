"use client";

import { useState } from "react";
import Sidebar from "./Sidebar";
import Header from "./Header";
import { ErrorBoundary } from "./ErrorBoundary";
import { usePathname } from "next/navigation";
import { useSessionTimeout } from "@/hooks/useSessionTimeout";
import { useAuth } from "@/hooks/useAuth";
import { StaleConnectionBanner } from "./StaleConnectionBanner";
import { CommandPalette } from "@/components/shell/CommandPalette";
import { ShortcutCheatsheet } from "@/components/shell/ShortcutCheatsheet";
import { NavigationShortcuts } from "@/components/shell/NavigationShortcuts";
import { TooltipProvider } from "@/components/ui/Tooltip";
import { PageTransition } from "./PageTransition";

const routeTitles: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/users": "Users",
  "/verification": "Verification",
  "/orders": "Demand Center",
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
  const [mobileOpen, setMobileOpen] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);
  useSessionTimeout();
  const { stale, revalidate } = useAuth();

  return (
    <div className="flex h-screen overflow-hidden">
      <a href="#main-content" className="skip-link">Skip to main content</a>
      <Sidebar mobileOpen={mobileOpen} onMobileClose={() => setMobileOpen(false)} />
      <div className="flex flex-col flex-1 min-w-0">
        <Header title={title} onMenuToggle={() => setMobileOpen(true)} onOpenPalette={() => setPaletteOpen(true)} />
        <StaleConnectionBanner stale={stale} onRetry={revalidate} />
        <main id="main-content" className="flex-1 overflow-y-auto" tabIndex={-1}>
          <PageTransition>{children}</PageTransition>
        </main>
      </div>
      <CommandPalette open={paletteOpen} onOpenChange={setPaletteOpen} />
      <ShortcutCheatsheet />
      <NavigationShortcuts />
    </div>
  );
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <TooltipProvider delayDuration={250}>
      <ErrorBoundary>
        <DashboardLayoutInner>{children}</DashboardLayoutInner>
      </ErrorBoundary>
    </TooltipProvider>
  );
}
