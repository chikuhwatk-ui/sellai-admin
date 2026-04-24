"use client";

import * as React from "react";
import Link from "next/link";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  BarChart, Bar, Cell,
} from "recharts";
import { Activity, Users, ShoppingCart, ShieldCheck, Truck, Wallet, AlertTriangle, ChevronRight } from "lucide-react";
import { useApi } from "@/hooks/useApi";
import { PageContainer, PageHeader } from "@/components/ui/PageHeader";
import { StatBlock } from "@/components/ui/StatBlock";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Skeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { Button } from "@/components/ui/Button";

const chartTheme = {
  grid: "oklch(0.30 0.018 255 / 0.5)",
  text: "oklch(0.55 0.015 255)",
  tooltipBg: "var(--color-overlay)",
  tooltipBorder: "var(--color-border-muted)",
};

export default function DashboardPage() {
  const { data: kpis, loading: kpiLoading } = useApi<any>("/api/admin/dashboard/kpis");
  const { data: timeSeries, loading: tsLoading } = useApi<any>("/api/admin/dashboard/time-series?period=30");
  const { data: funnel, loading: funnelLoading } = useApi<any>("/api/admin/dashboard/funnel?period=30");
  const { data: verifications } = useApi<any>("/api/verification/queue?status=PENDING");
  const { data: alertsData } = useApi<any>("/api/admin/dashboard/alerts");
  const { data: flaggedData } = useApi<any>("/api/admin/dashboard/flagged-content");

  const systemAlerts: any[] = Array.isArray(alertsData) ? alertsData : [];
  const flaggedContent: any[] = Array.isArray(flaggedData) ? flaggedData : [];

  const demands = Array.isArray(timeSeries?.demands) ? timeSeries.demands : [];
  const offers = Array.isArray(timeSeries?.offers) ? timeSeries.offers : [];
  const combinedSeries = React.useMemo(() => {
    const map = new Map<string, { date: string; demands?: number; offers?: number }>();
    for (const d of demands) map.set(d.date, { date: d.date, demands: d.value });
    for (const o of offers) {
      const existing = map.get(o.date);
      if (existing) existing.offers = o.value;
      else map.set(o.date, { date: o.date, offers: o.value });
    }
    return [...map.values()].sort((a, b) => a.date.localeCompare(b.date));
  }, [demands, offers]);

  const funnelData = Array.isArray(funnel) ? funnel : [];
  const verificationList = Array.isArray(verifications) ? verifications : verifications?.queue || [];

  return (
    <PageContainer>
      <PageHeader
        title="Command Center"
        description="Real-time marketplace operations overview"
        actions={
          <div className="flex items-center gap-2 px-2.5 py-1 rounded-full bg-success-bg">
            <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
            <span className="text-2xs font-medium text-success">Live</span>
          </div>
        }
      />

      {/* Dense KPI row — 6 across on desktop */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2">
        {kpiLoading ? (
          Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-[72px]" />)
        ) : (
          <>
            <StatBlock
              label="Active users"
              value={fmtNum(kpis?.activeUsers?.value ?? 0)}
              delta={kpis?.activeUsers?.change}
            />
            <StatBlock
              label="Open demands"
              value={fmtNum(kpis?.openDemands?.value ?? 0)}
              delta={kpis?.openDemands?.change}
            />
            <StatBlock
              label="Pending verification"
              value={fmtNum(kpis?.pendingVerifications?.value ?? 0)}
              hint={kpis?.pendingVerifications?.oldestWait ? `Oldest: ${kpis.pendingVerifications.oldestWait}` : undefined}
            />
            <StatBlock
              label="Active deliveries"
              value={fmtNum(kpis?.activeDeliveries?.value ?? 0)}
              delta={kpis?.activeDeliveries?.change}
            />
            <StatBlock
              label="Revenue today"
              value={`$${fmtNum(kpis?.revenueToday?.value ?? 0)}`}
              delta={kpis?.revenueToday?.change}
            />
            <StatBlock
              label="Disputes"
              value={fmtNum(kpis?.disputes?.value ?? 0)}
              delta={kpis?.disputes?.change}
            />
          </>
        )}
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card padding={false}>
          <CardHeader className="px-5 py-4">
            <div>
              <CardTitle>Demand vs offer (30d)</CardTitle>
              <CardDescription>Listings posted and matched daily</CardDescription>
            </div>
            <LegendDot tones={[{ label: "Demands", tone: "accent" }, { label: "Offers", tone: "info" }]} />
          </CardHeader>
          <div className="px-3 pb-4 h-[240px]">
            {tsLoading ? (
              <Skeleton className="h-full w-full" />
            ) : combinedSeries.length === 0 ? (
              <EmptyState title="No data" description="No activity in the selected range" />
            ) : (
              <ResponsiveContainer>
                <LineChart data={combinedSeries} margin={{ top: 8, right: 16, bottom: 0, left: 0 }}>
                  <CartesianGrid stroke={chartTheme.grid} strokeDasharray="2 4" vertical={false} />
                  <XAxis
                    dataKey="date"
                    stroke={chartTheme.text}
                    tick={{ fontSize: 10 }}
                    tickFormatter={(d) => new Date(d).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                    tickMargin={8}
                  />
                  <YAxis stroke={chartTheme.text} tick={{ fontSize: 10 }} tickMargin={4} />
                  <Tooltip
                    contentStyle={{
                      background: chartTheme.tooltipBg,
                      border: `1px solid ${chartTheme.tooltipBorder}`,
                      borderRadius: 8, fontSize: 12,
                    }}
                    labelStyle={{ color: "var(--color-fg)", fontWeight: 500 }}
                    itemStyle={{ color: "var(--color-fg-muted)" }}
                  />
                  <Line type="monotone" dataKey="demands" stroke="var(--color-accent)" strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
                  <Line type="monotone" dataKey="offers" stroke="var(--color-info)" strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </Card>

        <Card padding={false}>
          <CardHeader className="px-5 py-4">
            <div>
              <CardTitle>Conversion funnel</CardTitle>
              <CardDescription>Demand → offer → accepted → delivered</CardDescription>
            </div>
          </CardHeader>
          <div className="px-5 pb-4 h-[240px]">
            {funnelLoading ? (
              <Skeleton className="h-full w-full" />
            ) : funnelData.length === 0 ? (
              <EmptyState title="No data" />
            ) : (
              <ResponsiveContainer>
                <BarChart data={funnelData} layout="vertical" margin={{ top: 4, right: 16, bottom: 0, left: 80 }}>
                  <XAxis type="number" stroke={chartTheme.text} tick={{ fontSize: 10 }} />
                  <YAxis type="category" dataKey="stage" stroke={chartTheme.text} tick={{ fontSize: 11 }} width={80} />
                  <Tooltip
                    contentStyle={{
                      background: chartTheme.tooltipBg,
                      border: `1px solid ${chartTheme.tooltipBorder}`,
                      borderRadius: 8, fontSize: 12,
                    }}
                  />
                  <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                    {funnelData.map((_, i) => (
                      <Cell key={i} fill={`oklch(0.72 0.18 155 / ${1 - i * 0.15})`} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </Card>
      </div>

      {/* Action queues — staggered vertically on ≥lg to break the form-grid
       * rhythm and read as a control room rather than a table. Mobile +
       * tablet stay on a flat stack so scan order is obvious on narrow
       * viewports. Stagger offsets: 0 / 24px / 48px. */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:items-start">
        <div className="lg:mt-0">
          <QueueCard
            title="Verification queue"
            subtitle={`${verificationList.length} pending`}
            tone="warning"
            href="/verification"
            icon={<ShieldCheck className="h-4 w-4" />}
          >
            {verificationList.slice(0, 5).map((v: any) => (
              <QueueRow
                key={v.id}
                title={v.fullName}
                subtitle={`ID ${v.idNumber}`}
                time={v.submittedAt}
                badge={v.isPriority ? <Badge tone="danger" size="sm">Priority</Badge> : null}
              />
            ))}
            {verificationList.length === 0 && (
              <div className="text-center py-6 text-xs text-fg-subtle">Queue empty</div>
            )}
          </QueueCard>
        </div>

        <div className="lg:mt-6">
          <QueueCard
            title="Flagged content"
            subtitle={`${flaggedContent.length} items`}
            tone="danger"
            href="/disputes"
            icon={<AlertTriangle className="h-4 w-4" />}
          >
            {flaggedContent.slice(0, 5).map((f: any, i: number) => (
              <QueueRow key={i} title={f.reason || "Flagged"} subtitle={f.description} time={f.createdAt} />
            ))}
            {flaggedContent.length === 0 && (
              <div className="text-center py-6 text-xs text-fg-subtle">Nothing flagged</div>
            )}
          </QueueCard>
        </div>

        <div className="lg:mt-12">
          <QueueCard
            title="System alerts"
            subtitle={`${systemAlerts.length} active`}
            tone="info"
            href="/settings/audit-log"
            icon={<Activity className="h-4 w-4" />}
          >
            {systemAlerts.slice(0, 5).map((a: any, i: number) => (
              <QueueRow key={i} title={a.title} subtitle={a.description} time={a.createdAt} />
            ))}
            {systemAlerts.length === 0 && (
              <div className="text-center py-6 text-xs text-fg-subtle">All clear</div>
            )}
          </QueueCard>
        </div>
      </div>

      {/* Quick nav */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
        <NavLink href="/users" icon={<Users className="h-4 w-4" />} label="Users" />
        <NavLink href="/orders" icon={<ShoppingCart className="h-4 w-4" />} label="Orders" />
        <NavLink href="/deliveries" icon={<Truck className="h-4 w-4" />} label="Deliveries" />
        <NavLink href="/finance" icon={<Wallet className="h-4 w-4" />} label="Finance" />
      </div>
    </PageContainer>
  );
}

function fmtNum(n: number | string): string {
  if (typeof n === "string") return n;
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + "M";
  if (n >= 1_000) return (n / 1_000).toFixed(1) + "k";
  return n.toLocaleString();
}

function LegendDot({ tones }: { tones: { label: string; tone: "accent" | "info" | "danger" | "warning" }[] }) {
  return (
    <div className="flex items-center gap-3">
      {tones.map((t) => (
        <span key={t.label} className="inline-flex items-center gap-1.5 text-2xs text-fg-muted">
          <span className={`h-1.5 w-3 rounded-full bg-${t.tone}`} />
          {t.label}
        </span>
      ))}
    </div>
  );
}

function QueueCard({
  title, subtitle, tone, href, icon, children,
}: {
  title: string; subtitle: string; tone: "warning" | "danger" | "info"; href: string;
  icon: React.ReactNode; children: React.ReactNode;
}) {
  return (
    <Card padding={false}>
      <CardHeader className="px-4 py-3">
        <div className="flex items-center gap-2 min-w-0">
          <span className={`text-${tone}`}>{icon}</span>
          <div className="min-w-0">
            <CardTitle className="text-xs">{title}</CardTitle>
            <CardDescription className="text-2xs">{subtitle}</CardDescription>
          </div>
        </div>
        <Link href={href} className="inline-flex items-center gap-0.5 text-2xs text-fg-muted hover:text-fg transition-colors">
          View <ChevronRight className="h-3 w-3" />
        </Link>
      </CardHeader>
      <div className="divide-y divide-[color:var(--color-border-muted)]">{children}</div>
    </Card>
  );
}

function QueueRow({ title, subtitle, time, badge }: { title: string; subtitle?: string; time?: string; badge?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3 px-4 py-2.5">
      <div className="min-w-0 flex-1">
        <div className="text-sm-compact text-fg truncate">{title}</div>
        {subtitle && <div className="text-2xs text-fg-muted truncate">{subtitle}</div>}
      </div>
      <div className="flex items-center gap-2 shrink-0">
        {badge}
        {time && <span className="text-2xs text-fg-subtle tabular">{timeSince(time)}</span>}
      </div>
    </div>
  );
}

function NavLink({ href, icon, label }: { href: string; icon: React.ReactNode; label: string }) {
  return (
    <Link
      href={href}
      className="flex items-center gap-2 px-3 py-2 rounded-lg border border-muted bg-panel hover:bg-raised hover:border-strong transition-colors"
    >
      <span className="text-fg-subtle">{icon}</span>
      <span className="text-sm-compact text-fg font-medium">{label}</span>
      <ChevronRight className="h-3 w-3 text-fg-subtle ml-auto" />
    </Link>
  );
}

function timeSince(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h`;
  return `${Math.floor(hours / 24)}d`;
}
