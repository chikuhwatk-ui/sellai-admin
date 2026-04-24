'use client';

import DashboardLayout from "@/components/layout/DashboardLayout";
import { PageGuard } from "@/components/auth/PageGuard";

/**
 * Trade layout — clean passthrough. The atrium at /trade is the nav.
 * Individual sub-pages (users, orders, deliveries, …) keep their
 * existing top-level routes and remain deep-linkable.
 *
 * Any admin with permission to see at least one transactional surface
 * (users, orders, deliveries, finance, or communications) can reach
 * the atrium.
 */
export default function TradeLayout({ children }: { children: React.ReactNode }) {
    return (
        <DashboardLayout>
            <PageGuard permission={[
                "USERS_VIEW",
                "ORDERS_VIEW",
                "DELIVERIES_VIEW",
                "FINANCE_VIEW",
                "COMMUNICATIONS_VIEW",
            ]}>
                {children}
            </PageGuard>
        </DashboardLayout>
    );
}
