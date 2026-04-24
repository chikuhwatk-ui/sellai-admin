"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useRef, useEffect, useLayoutEffect } from "react";
import {
  Clock,
  X,
  LayoutDashboard,
  Store,
  Scale,
  Banknote,
  BarChart3,
  KeyRound,
  Settings as SettingsIcon,
  ChevronsLeft,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useRecent } from "@/hooks/useRecent";
import { cn } from "@/lib/cn";

/*
 * Sidebar — 7 top-level destinations.
 *
 * Previous iteration had 23 items across 5 groups and felt like a
 * phone book. The new shape maps onto atrium landings that group
 * sub-pages semantically: Dashboard, Trade, Moderation, Finance,
 * Analytics, Admin — plus Settings pinned to the bottom.
 *
 * Each top-level item is visible only if the user has at least ONE
 * of its `permissions`. Atrium pages do a second layer of filtering
 * on the individual zone-card links, so a support agent landing on
 * /moderation sees only the moderation surfaces they can open.
 */

interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
  /** Any-of — item is visible if the user holds at least one. */
  permissions?: string[];
}

const PRIMARY: NavItem[] = [
  {
    label: "Dashboard",
    href: "/dashboard",
    icon: <LayoutDashboard className="w-5 h-5" strokeWidth={1.5} />,
    permissions: ["DASHBOARD_VIEW"],
  },
  {
    label: "Trade",
    href: "/trade",
    icon: <Store className="w-5 h-5" strokeWidth={1.5} />,
    permissions: [
      "USERS_VIEW",
      "ORDERS_VIEW",
      "DELIVERIES_VIEW",
      "FINANCE_VIEW",
      "COMMUNICATIONS_VIEW",
    ],
  },
  {
    label: "Moderation",
    href: "/moderation",
    icon: <Scale className="w-5 h-5" strokeWidth={1.5} />,
    permissions: [
      "VERIFICATION_VIEW",
      "VERIFICATION_REVIEW",
      "DISPUTES_VIEW",
      "DISPUTES_MANAGE",
      "SUPPORT_VIEW",
      "CHAT_VIEW_MESSAGES",
    ],
  },
  {
    label: "Finance",
    href: "/finance",
    icon: <Banknote className="w-5 h-5" strokeWidth={1.5} />,
    permissions: ["FINANCE_VIEW", "FINANCE_MANAGE"],
  },
  {
    label: "Analytics",
    href: "/analytics",
    icon: <BarChart3 className="w-5 h-5" strokeWidth={1.5} />,
    permissions: ["ANALYTICS_VIEW"],
  },
  {
    label: "Admin",
    href: "/admin",
    icon: <KeyRound className="w-5 h-5" strokeWidth={1.5} />,
    permissions: ["ADMIN_MANAGE", "APPROVAL_REVIEW", "AUDIT_LOGS_VIEW"],
  },
];

const UTILITY: NavItem[] = [
  {
    label: "Settings",
    href: "/settings",
    icon: <SettingsIcon className="w-5 h-5" strokeWidth={1.5} />,
    // No permission guard — every authenticated admin can reach their
    // own preferences + sign out.
  },
];

interface SidebarProps {
  mobileOpen?: boolean;
  onMobileClose?: () => void;
}

// Module-level variable survives component unmount/remount across route changes
let savedScrollPos = 0;

export default function Sidebar({ mobileOpen = false, onMobileClose }: SidebarProps) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const navRef = useRef<HTMLElement>(null);
  const { hasPermission } = useAuth();
  const { items: recentItems, clear: clearRecent } = useRecent();

  // Close mobile sidebar on navigation
  useEffect(() => {
    if (mobileOpen && onMobileClose) {
      onMobileClose();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  // Restore scroll position after navigation re-render or remount
  useLayoutEffect(() => {
    const nav = navRef.current;
    if (!nav) return;
    nav.scrollTop = savedScrollPos;
  });

  const handleNavScroll = () => {
    if (navRef.current) {
      savedScrollPos = navRef.current.scrollTop;
    }
  };

  // A top-level item is "active" if the URL is that section or any of
  // its sub-pages. Dashboard is an exact match so deep-linking to a
  // user detail page doesn't light up Dashboard.
  const isActive = (href: string) => {
    if (href === "/dashboard") return pathname === "/dashboard";
    return pathname === href || pathname?.startsWith(`${href}/`);
  };

  const visible = (item: NavItem) =>
    !item.permissions || item.permissions.some((p) => hasPermission(p));

  const primaryItems = PRIMARY.filter(visible);
  const utilityItems = UTILITY.filter(visible);

  const renderItem = (item: NavItem) => {
    const active = isActive(item.href);
    return (
      <li key={item.href}>
        <Link
          href={item.href}
          className={cn(
            "flex items-center gap-2.5 h-[34px] px-2 rounded-md",
            "text-sm-compact font-medium transition-colors duration-fast group",
            active
              ? "bg-accent-bg text-accent"
              : "text-fg-muted hover:text-fg hover:bg-raised",
            collapsed && "justify-center",
          )}
          title={collapsed ? item.label : undefined}
          aria-current={active ? "page" : undefined}
        >
          <span
            className={cn(
              "shrink-0",
              active ? "text-accent" : "text-fg-subtle group-hover:text-fg-muted",
            )}
          >
            {item.icon}
          </span>
          {!collapsed && <span className="truncate">{item.label}</span>}
        </Link>
      </li>
    );
  };

  const sidebarContent = (
    <aside
      className={cn(
        "flex flex-col h-screen bg-canvas border-r border-muted",
        "transition-[width] duration-base ease-out",
        collapsed ? "w-[60px]" : "w-[232px]",
      )}
    >
      {/* Brand */}
      <div className="flex items-center h-12 px-3 border-b border-muted shrink-0">
        <div className="flex items-center gap-2.5 overflow-hidden">
          <div className="w-7 h-7 rounded-md bg-accent flex items-center justify-center shrink-0 shadow-elev-1">
            <svg
              className="w-4 h-4 text-accent-fg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              aria-hidden="true"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 8l6-4 6 4M6 8v8l6 4 6-4V8M6 8l6 4m0 0l6-4m-6 4v8" />
            </svg>
          </div>
          {!collapsed && (
            <span className="text-sm font-semibold text-fg tracking-tight whitespace-nowrap">
              Sellai
            </span>
          )}
        </div>
        {/* Mobile close */}
        {mobileOpen && onMobileClose && (
          <button
            onClick={onMobileClose}
            className="ml-auto lg:hidden p-1 rounded text-fg-muted hover:text-fg hover:bg-raised"
            aria-label="Close sidebar"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Primary nav */}
      <nav
        ref={navRef}
        onScroll={handleNavScroll}
        className="flex-1 overflow-y-auto py-3 px-2"
        aria-label="Primary navigation"
      >
        <ul className="space-y-0.5">
          {primaryItems.map(renderItem)}
        </ul>

        {/* Recent items — last visited users / orders / disputes */}
        {!collapsed && recentItems.length > 0 && (
          <div className="mt-6">
            <div className="flex items-center justify-between px-2 mb-1">
              <p className="text-[10px] font-medium tracking-[0.12em] text-fg-subtle uppercase">
                Recent
              </p>
              <button
                onClick={clearRecent}
                className="text-fg-subtle hover:text-fg p-0.5 rounded"
                aria-label="Clear recent items"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
            <ul className="space-y-0.5">
              {recentItems.slice(0, 5).map((r) => (
                <li key={r.href}>
                  <Link
                    href={r.href}
                    className="flex items-center gap-2.5 h-[28px] px-2 rounded-md text-xs text-fg-muted hover:text-fg hover:bg-raised transition-colors"
                  >
                    <Clock className="w-3 h-3 text-fg-subtle shrink-0" />
                    <span className="truncate">{r.label}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        )}
      </nav>

      {/* Utility row — Settings lives here, separated from primary nav */}
      {utilityItems.length > 0 && (
        <div className="shrink-0 border-t border-muted py-2 px-2">
          <ul className="space-y-0.5">
            {utilityItems.map(renderItem)}
          </ul>
        </div>
      )}

      {/* Collapse toggle — hidden on mobile */}
      <div className="border-t border-muted p-2 shrink-0 hidden lg:block">
        <button
          onClick={() => setCollapsed((c) => !c)}
          className="flex items-center justify-center w-full h-8 rounded-md text-fg-muted hover:text-fg hover:bg-raised transition-colors"
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          <ChevronsLeft
            className={cn(
              "w-4 h-4 transition-transform duration-base",
              collapsed && "rotate-180",
            )}
          />
        </button>
      </div>
    </aside>
  );

  return (
    <>
      {/* Desktop — always visible */}
      <div className="hidden lg:block shrink-0">{sidebarContent}</div>

      {/* Mobile — overlay drawer */}
      {mobileOpen && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/50 lg:hidden"
            onClick={onMobileClose}
          />
          <div className="fixed inset-y-0 left-0 z-50 lg:hidden">{sidebarContent}</div>
        </>
      )}
    </>
  );
}
