'use client';

import DashboardLayout from "@/components/layout/DashboardLayout";
import { PageGuard } from "@/components/auth/PageGuard";

/**
 * Finance layout — intentionally minimal.
 *
 * The previous 12-tab horizontal strip was removed in favour of the
 * "Finance Atrium" entry view at /finance. Sub-pages (accounts,
 * journal, invoices, etc.) are reached from that atrium and from
 * breadcrumbs in the header, not from a persistent secondary nav.
 *
 * If you find yourself tempted to add a tab strip here, please revisit
 * the atrium at /finance first. 12 equally-weighted tabs flatten work
 * that is semantically very different (live ops vs. bookkeeping vs.
 * documents vs. planning) and the atrium solves that problem by giving
 * each group a distinct composition.
 */
export default function FinanceLayout({ children }: { children: React.ReactNode }) {
  return (
    <DashboardLayout>
      <PageGuard permission={["FINANCE_VIEW", "FINANCE_MANAGE"]}>
        {children}
      </PageGuard>
    </DashboardLayout>
  );
}
