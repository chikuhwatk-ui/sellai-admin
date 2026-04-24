"use client";

import { PageContainer, PageHeader } from "@/components/ui/PageHeader";
import { ZoneCard } from "@/components/ui/ZoneCard";
import { useAuth } from "@/hooks/useAuth";

/**
 * Admin atrium — control surface about the control surface.
 */
export default function AdminAtrium() {
    const { hasPermission } = useAuth();

    return (
        <PageContainer>
            <PageHeader
                title="Admin"
                description="Access, approvals, and the audit trail."
            />

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <ZoneCard
                    index="01"
                    eyebrow="Access"
                    title="Who can do what"
                    description="Invite admins, change roles, deactivate accounts, and force-logout a compromised session."
                    links={[
                        {
                            href: "/admin-management",
                            label: "Admin management",
                            meta: "Roles, invites, deactivations",
                            hidden: !hasPermission("ADMIN_MANAGE"),
                        },
                        {
                            href: "/approvals",
                            label: "Approval queue",
                            meta: "Sensitive actions awaiting second sign-off",
                            hidden: !hasPermission("APPROVAL_REVIEW"),
                        },
                    ]}
                />

                <ZoneCard
                    index="02"
                    eyebrow="Observability"
                    title="The audit trail"
                    description="Every admin action, every login, every role change. Searchable, filterable, exportable."
                    links={[
                        {
                            href: "/settings/audit-log",
                            label: "Audit log",
                            meta: "Last 30 days by default",
                            hidden: !hasPermission("AUDIT_LOGS_VIEW"),
                        },
                    ]}
                />
            </div>
        </PageContainer>
    );
}
