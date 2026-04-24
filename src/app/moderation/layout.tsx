'use client';

import DashboardLayout from "@/components/layout/DashboardLayout";
import { PageGuard } from "@/components/auth/PageGuard";

/**
 * Moderation layout — passthrough for the trust & safety atrium.
 * Visible to anyone with at least one moderation-adjacent permission.
 */
export default function ModerationLayout({ children }: { children: React.ReactNode }) {
    return (
        <DashboardLayout>
            <PageGuard permission={[
                "VERIFICATION_VIEW",
                "VERIFICATION_REVIEW",
                "DISPUTES_VIEW",
                "DISPUTES_MANAGE",
                "SUPPORT_VIEW",
                "CHAT_VIEW_MESSAGES",
            ]}>
                {children}
            </PageGuard>
        </DashboardLayout>
    );
}
