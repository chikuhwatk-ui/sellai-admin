'use client';

import DashboardLayout from "@/components/layout/DashboardLayout";
import { PageGuard } from "@/components/auth/PageGuard";

/**
 * Admin area layout — the control surface about the control surface.
 * Access + approvals + the audit trail. Any admin with ADMIN_MANAGE or
 * APPROVAL_REVIEW or AUDIT_LOGS_VIEW reaches the atrium.
 */
export default function AdminAreaLayout({ children }: { children: React.ReactNode }) {
    return (
        <DashboardLayout>
            <PageGuard permission={["ADMIN_MANAGE", "APPROVAL_REVIEW", "AUDIT_LOGS_VIEW"]}>
                {children}
            </PageGuard>
        </DashboardLayout>
    );
}
