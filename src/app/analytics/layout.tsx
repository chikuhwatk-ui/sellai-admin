'use client';

import DashboardLayout from "@/components/layout/DashboardLayout";
import { PageGuard } from "@/components/auth/PageGuard";

/**
 * Analytics layout — wraps the atrium at /analytics AND every
 * sub-page beneath it. ANALYTICS_VIEW is the floor; individual
 * pages (predictive, trust, etc.) may require finer-grained
 * permissions and should declare them via their own guard.
 */
export default function AnalyticsLayout({ children }: { children: React.ReactNode }) {
    return (
        <DashboardLayout>
            <PageGuard permission="ANALYTICS_VIEW">
                {children}
            </PageGuard>
        </DashboardLayout>
    );
}
