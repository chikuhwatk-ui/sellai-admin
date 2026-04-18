'use client';

import DashboardLayout from "@/components/layout/DashboardLayout";
import { PageGuard } from "@/components/auth/PageGuard";
import Link from "next/link";
import { usePathname } from "next/navigation";

const FINANCE_TABS = [
  { label: 'Overview', href: '/finance' },
  { label: 'Accounts', href: '/finance/accounts' },
  { label: 'Journal', href: '/finance/journal' },
  { label: 'Reports', href: '/finance/reports' },
  { label: 'Forecast', href: '/finance/forecast' },
  { label: 'Expenses', href: '/finance/expenses' },
  { label: 'Revenue', href: '/finance/revenue' },
  { label: 'Periods', href: '/finance/periods' },
  { label: 'Tax', href: '/finance/tax' },
];

export default function FinanceLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <DashboardLayout>
      <PageGuard permission={["FINANCE_VIEW", "FINANCE_MANAGE"]}>
        <div className="border-b border-[#2A2D37] bg-[#0F1117]/50 px-6 pt-4">
          <div className="flex items-center gap-1 overflow-x-auto">
            {FINANCE_TABS.map((tab) => {
              const isActive = tab.href === '/finance'
                ? pathname === '/finance'
                : pathname?.startsWith(tab.href);
              return (
                <Link
                  key={tab.href}
                  href={tab.href}
                  className={`px-4 py-2.5 text-sm font-medium whitespace-nowrap rounded-t-lg transition-colors ${
                    isActive
                      ? 'text-[#10B981] border-b-2 border-[#10B981] bg-[#10B981]/5'
                      : 'text-[#6B7280] hover:text-white hover:bg-[#1A1D27]'
                  }`}
                >
                  {tab.label}
                </Link>
              );
            })}
          </div>
        </div>
        {children}
      </PageGuard>
    </DashboardLayout>
  );
}
