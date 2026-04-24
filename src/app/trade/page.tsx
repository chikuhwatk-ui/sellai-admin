"use client";

import { PageContainer, PageHeader } from "@/components/ui/PageHeader";
import { ZoneCard } from "@/components/ui/ZoneCard";
import { useAuth } from "@/hooks/useAuth";

/**
 * Trade atrium — the transactional half of the marketplace.
 * People who create demand, fulfil it, and the money that moves.
 */
export default function TradeAtrium() {
    const { hasPermission } = useAuth();

    return (
        <PageContainer>
            <PageHeader
                title="Trade"
                description="The people, the moves, and the money."
            />

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <ZoneCard
                    index="01"
                    eyebrow="People"
                    live
                    title="Who's on the platform"
                    description="Directory of buyers, sellers, and runners — search, inspect, verify, and moderate access."
                    className="lg:col-span-2"
                    links={[
                        {
                            href: "/users",
                            label: "Users",
                            meta: "Directory, suspensions, credit adjustments",
                            hidden: !hasPermission("USERS_VIEW"),
                        },
                    ]}
                />

                <div className="flex flex-col gap-4">
                    <ZoneCard
                        index="02"
                        eyebrow="Moves"
                        title="Demands & deliveries"
                        description="Every buyer demand and the delivery it becomes, from request to handover."
                        links={[
                            {
                                href: "/orders",
                                label: "Demands",
                                hidden: !hasPermission("ORDERS_VIEW"),
                            },
                            {
                                href: "/deliveries",
                                label: "Deliveries",
                                hidden: !hasPermission("DELIVERIES_VIEW"),
                            },
                        ]}
                    />

                    <ZoneCard
                        index="03"
                        eyebrow="Go to market"
                        title="Reach & retention"
                        description="Outbound comms, seller coaching, and the channels that keep the flywheel turning."
                        links={[
                            {
                                href: "/communications",
                                label: "Communications",
                                meta: "Broadcasts, system messages, templates",
                                hidden: !hasPermission("COMMUNICATIONS_VIEW"),
                            },
                            {
                                href: "/seller-success",
                                label: "Seller success",
                                meta: "Coaching queue + playbooks",
                                hidden: !hasPermission("SELLER_SUCCESS_VIEW"),
                            },
                        ]}
                    />
                </div>
            </div>
        </PageContainer>
    );
}
