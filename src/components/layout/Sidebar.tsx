"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useRef, useEffect, useLayoutEffect } from "react";
import {
  Clock,
  X,
  LayoutDashboard,
  Users,
  ShieldCheck,
  ClipboardList,
  Truck,
  AlertTriangle,
  Star,
  Sparkles,
  MessagesSquare,
  LifeBuoy,
  Banknote,
  Megaphone,
  BarChart3,
  DollarSign,
  Globe,
  ShieldHalf,
  FolderTree,
  Gauge,
  TrendingUp,
  CheckCircle2,
  UserCog,
  Settings,
  FileText,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useRecent } from "@/hooks/useRecent";

interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
  permission?: string;
}

interface NavGroup {
  title: string;
  items: NavItem[];
}

const navGroups: NavGroup[] = [
  {
    title: "OVERVIEW",
    items: [
      {
        label: "Dashboard",
        href: "/dashboard",
        icon: <LayoutDashboard className="w-5 h-5" strokeWidth={1.5} />,
      },
    ],
  },
  {
    title: "OPERATIONS",
    items: [
      {
        label: "Users",
        href: "/users",
        icon: <Users className="w-5 h-5" strokeWidth={1.5} />,
      },
      {
        label: "Verification",
        href: "/verification",
        icon: <ShieldCheck className="w-5 h-5" strokeWidth={1.5} />,
      },
      {
        label: "Demands",
        href: "/orders",
        icon: <ClipboardList className="w-5 h-5" strokeWidth={1.5} />,
      },
      {
        label: "Deliveries",
        href: "/deliveries",
        icon: <Truck className="w-5 h-5" strokeWidth={1.5} />,
      },
      {
        label: "Disputes",
        href: "/disputes",
        permission: "DISPUTES_VIEW",
        icon: <AlertTriangle className="w-5 h-5" strokeWidth={1.5} />,
      },
      {
        label: "Review Moderation",
        href: "/reviews",
        permission: "DISPUTES_VIEW",
        icon: <Star className="w-5 h-5" strokeWidth={1.5} />,
      },
      {
        label: "Seller Success",
        href: "/seller-success",
        permission: "SELLER_SUCCESS_VIEW",
        icon: <Sparkles className="w-5 h-5" strokeWidth={1.5} />,
      },
      {
        label: "Chat Inspector",
        href: "/chats",
        permission: "CHAT_VIEW_MESSAGES",
        icon: <MessagesSquare className="w-5 h-5" strokeWidth={1.5} />,
      },
      {
        label: "Support",
        href: "/support",
        permission: "SUPPORT_VIEW",
        icon: <LifeBuoy className="w-5 h-5" strokeWidth={1.5} />,
      },
      {
        label: "Finance",
        href: "/finance",
        permission: "FINANCE_VIEW",
        icon: <Banknote className="w-5 h-5" strokeWidth={1.5} />,
      },
      {
        label: "Communications",
        href: "/communications",
        icon: <Megaphone className="w-5 h-5" strokeWidth={1.5} />,
      },
    ],
  },
  {
    title: "ANALYTICS",
    items: [
      {
        label: "Marketplace",
        href: "/analytics/marketplace",
        icon: <BarChart3 className="w-5 h-5" strokeWidth={1.5} />,
      },
      {
        label: "User Economics",
        href: "/analytics/users-economics",
        icon: <DollarSign className="w-5 h-5" strokeWidth={1.5} />,
      },
      {
        label: "Geographic",
        href: "/analytics/geographic",
        icon: <Globe className="w-5 h-5" strokeWidth={1.5} />,
      },
      {
        label: "Trust & Quality",
        href: "/analytics/trust",
        icon: <ShieldHalf className="w-5 h-5" strokeWidth={1.5} />,
      },
      {
        label: "Categories",
        href: "/analytics/categories",
        icon: <FolderTree className="w-5 h-5" strokeWidth={1.5} />,
      },
      {
        label: "Operations",
        href: "/analytics/operations",
        icon: <Gauge className="w-5 h-5" strokeWidth={1.5} />,
      },
      {
        label: "Predictive",
        href: "/analytics/predictive",
        icon: <TrendingUp className="w-5 h-5" strokeWidth={1.5} />,
      },
    ],
  },
  {
    title: "ADMIN",
    items: [
      {
        label: "Approvals",
        href: "/approvals",
        permission: "APPROVAL_REVIEW",
        icon: <CheckCircle2 className="w-5 h-5" strokeWidth={1.5} />,
      },
      {
        label: "Admin Management",
        href: "/admin-management",
        permission: "ADMIN_MANAGE",
        icon: <UserCog className="w-5 h-5" strokeWidth={1.5} />,
      },
    ],
  },
  {
    title: "SYSTEM",
    items: [
      {
        label: "Settings",
        href: "/settings",
        icon: <Settings className="w-5 h-5" strokeWidth={1.5} />,
      },
      {
        label: "Audit Log",
        href: "/settings/audit-log",
        permission: "AUDIT_LOGS_VIEW",
        icon: <FileText className="w-5 h-5" strokeWidth={1.5} />,
      },
    ],
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

  const isActive = (href: string) => {
    if (href === "/dashboard") return pathname === "/dashboard";
    return pathname.startsWith(href);
  };

  const sidebarContent = (
    <aside
      className={`flex flex-col h-screen bg-canvas border-r border-muted transition-[width] duration-base ease-out ${
        collapsed ? "w-[60px]" : "w-[232px]"
      }`}
    >
      {/* Brand */}
      <div className="flex items-center h-12 px-3 border-b border-muted shrink-0">
        <div className="flex items-center gap-2.5 overflow-hidden">
          <div className="w-7 h-7 rounded-md bg-accent flex items-center justify-center shrink-0 shadow-elev-1">
            <svg className="w-4 h-4 text-accent-fg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 8l6-4 6 4M6 8v8l6 4 6-4V8M6 8l6 4m0 0l6-4m-6 4v8" />
            </svg>
          </div>
          {!collapsed && (
            <span className="text-sm font-semibold text-fg tracking-tight whitespace-nowrap">
              Sellai
            </span>
          )}
        </div>
        {/* Mobile close button */}
        {mobileOpen && onMobileClose && (
          <button
            onClick={onMobileClose}
            className="ml-auto lg:hidden p-1 rounded text-fg-muted hover:text-fg hover:bg-surface-hover"
            aria-label="Close sidebar"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {/* Navigation */}
      <nav ref={navRef} onScroll={handleNavScroll} className="flex-1 overflow-y-auto py-3 px-2">
        {navGroups.map((group) => {
          const visibleItems = group.items.filter(
            (item) => !item.permission || hasPermission(item.permission)
          );
          if (visibleItems.length === 0) return null;
          return (
          <div key={group.title} className="mb-4">
            {!collapsed && (
              <p className="px-2 mb-1 text-[10px] font-medium tracking-wider text-fg-subtle uppercase">
                {group.title}
              </p>
            )}
            <ul className="space-y-0.5">
              {visibleItems.map((item) => {
                const active = isActive(item.href);
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className={`flex items-center gap-2.5 h-[30px] px-2 rounded-md text-sm-compact font-medium transition-colors duration-fast group ${
                        active
                          ? "bg-accent-bg text-accent"
                          : "text-fg-muted hover:text-fg hover:bg-raised"
                      } ${collapsed ? "justify-center" : ""}`}
                      title={collapsed ? item.label : undefined}
                    >
                      <span
                        className={`shrink-0 [&_svg]:w-[18px] [&_svg]:h-[18px] ${
                          active ? "text-accent" : "text-fg-subtle group-hover:text-fg-muted"
                        }`}
                      >
                        {item.icon}
                      </span>
                      {!collapsed && (
                        <span className="truncate">{item.label}</span>
                      )}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
          );
        })}

        {/* Recent items — last visited users/orders/disputes */}
        {!collapsed && recentItems.length > 0 && (
          <div className="mb-4">
            <div className="flex items-center justify-between px-2 mb-1">
              <p className="text-[10px] font-medium tracking-wider text-fg-subtle uppercase">Recent</p>
              <button
                onClick={clearRecent}
                className="text-fg-subtle hover:text-fg p-0.5 rounded"
                aria-label="Clear recent"
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

      {/* Collapse toggle — hidden on mobile */}
      <div className="border-t border-border p-3 shrink-0 hidden lg:block">
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="flex items-center justify-center w-full py-2 rounded-lg text-fg-muted hover:text-fg hover:bg-surface-hover transition-colors"
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          <svg
            className={`w-5 h-5 transition-transform duration-300 ${
              collapsed ? "rotate-180" : ""
            }`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.5}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M18.75 19.5l-7.5-7.5 7.5-7.5m-6 15L5.25 12l7.5-7.5"
            />
          </svg>
        </button>
      </div>
    </aside>
  );

  return (
    <>
      {/* Desktop sidebar — always visible */}
      <div className="hidden lg:block shrink-0">
        {sidebarContent}
      </div>

      {/* Mobile sidebar — overlay drawer */}
      {mobileOpen && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/50 lg:hidden"
            onClick={onMobileClose}
          />
          <div className="fixed inset-y-0 left-0 z-50 lg:hidden">
            {sidebarContent}
          </div>
        </>
      )}
    </>
  );
}
