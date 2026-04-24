"use client";

import { PageContainer, PageHeader } from "@/components/ui/PageHeader";
import { ZoneCard } from "@/components/ui/ZoneCard";

/**
 * Analytics atrium — the reasoning surface. Seven analytics pages
 * grouped into four zones so a glance is enough to find the right
 * one.
 */
export default function AnalyticsAtrium() {
    return (
        <PageContainer>
            <PageHeader
                title="Analytics"
                description="Seven lenses on the marketplace."
            />

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <ZoneCard
                    index="01"
                    eyebrow="Marketplace"
                    live
                    title="The flywheel"
                    description="Supply vs demand, category fill rates, and where geography bends the equilibrium."
                    className="lg:col-span-2"
                    links={[
                        {
                            href: "/analytics/marketplace",
                            label: "Marketplace health",
                            meta: "Supply, demand, conversion, funnel",
                        },
                        {
                            href: "/analytics/categories",
                            label: "Categories",
                            meta: "Which ones are winning, which are starving",
                        },
                        {
                            href: "/analytics/geographic",
                            label: "Geographic",
                            meta: "Activity heatmap across cities",
                        },
                    ]}
                />

                <div className="flex flex-col gap-4">
                    <ZoneCard
                        index="02"
                        eyebrow="People"
                        title="User economics"
                        description="Unit economics per user segment — ARPU, retention cohorts, lifetime value."
                        links={[
                            { href: "/analytics/users-economics", label: "User economics" },
                        ]}
                    />

                    <ZoneCard
                        index="03"
                        eyebrow="Quality"
                        title="Trust & efficiency"
                        description="How the marketplace is performing on the axes that aren't volume — trust, speed, reliability."
                        links={[
                            {
                                href: "/analytics/trust",
                                label: "Trust & quality",
                                meta: "Review and rating signals",
                            },
                            {
                                href: "/analytics/operations",
                                label: "Operational efficiency",
                                meta: "Pickup, transit, completion times",
                            },
                        ]}
                    />
                </div>
            </div>

            <ZoneCard
                index="04"
                eyebrow="Forward looking"
                title="Predictive"
                description="Where next week's demand is likely to land, based on the last 30 days. Use with caution — models drift."
                links={[
                    {
                        href: "/analytics/predictive",
                        label: "Predictive dashboard",
                        meta: "Forecasts + recompute controls",
                    },
                ]}
            />
        </PageContainer>
    );
}
