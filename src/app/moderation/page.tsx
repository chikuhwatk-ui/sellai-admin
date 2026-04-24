"use client";

import { PageContainer, PageHeader } from "@/components/ui/PageHeader";
import { ZoneCard } from "@/components/ui/ZoneCard";
import { useAuth } from "@/hooks/useAuth";

/**
 * Moderation atrium — trust & safety surface area. Verification at
 * the door, disputes + reviews as running judgement, and the support
 * queues that catch everything falling off the edges.
 */
export default function ModerationAtrium() {
    const { hasPermission } = useAuth();

    return (
        <PageContainer>
            <PageHeader
                title="Moderation"
                description="The door, the judgement, and the inbox."
            />

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <ZoneCard
                    index="01"
                    eyebrow="At the door"
                    live
                    title="Verification"
                    description="Identity check for new sellers and runners. Approve, reject with a reason, or ask for a better photo."
                    className="lg:col-span-2"
                    links={[
                        {
                            href: "/verification",
                            label: "Verification queue",
                            meta: "Pending · in review · processed",
                            hidden: !hasPermission("VERIFICATION_VIEW"),
                        },
                    ]}
                />

                <div className="flex flex-col gap-4">
                    <ZoneCard
                        index="02"
                        eyebrow="Running judgement"
                        title="Disputes & reviews"
                        description="Buyer/seller disputes, flagged reviews, and the trust-score adjustments that come with them."
                        links={[
                            {
                                href: "/disputes",
                                label: "Disputes",
                                meta: "Open, escalated, resolved",
                                hidden: !hasPermission("DISPUTES_VIEW"),
                            },
                            {
                                href: "/reviews",
                                label: "Review moderation",
                                meta: "Automatically flagged patterns",
                                hidden: !hasPermission("DISPUTES_VIEW"),
                            },
                        ]}
                    />

                    <ZoneCard
                        index="03"
                        eyebrow="Inbox"
                        title="Support & chat"
                        description="Support tickets from the apps, and the chat inspector for when a conversation goes sideways."
                        links={[
                            {
                                href: "/support",
                                label: "Support tickets",
                                hidden: !hasPermission("SUPPORT_VIEW"),
                            },
                            {
                                href: "/chats",
                                label: "Chat inspector",
                                meta: "Read-only view into any conversation",
                                hidden: !hasPermission("CHAT_VIEW_MESSAGES"),
                            },
                        ]}
                    />
                </div>
            </div>
        </PageContainer>
    );
}
