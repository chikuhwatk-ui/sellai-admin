"use client";

import * as React from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { AlertTriangle, RefreshCw, XCircle, Star, Truck } from "lucide-react";
import { useApi } from "@/hooks/useApi";
import { useOptimisticAction } from "@/hooks/useOptimisticAction";
import { api } from "@/lib/api";
import { PageContainer, PageHeader } from "@/components/ui/PageHeader";
import { StatBlock } from "@/components/ui/StatBlock";
import { Table } from "@/components/ui/Table";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Sheet, SheetContent, SheetHeader, SheetBody, SheetFooter } from "@/components/ui/Sheet";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/Tabs";
import { Skeleton } from "@/components/ui/Skeleton";
import { cn } from "@/lib/cn";

type DeliveryStats = {
  activeDeliveries: number; completedToday: number; completedWeek: number;
  onlineRunners: number; totalRunners: number; cancelledToday: number;
  avgDeliveryMinutes: number; completionRate: number; stuckCount: number;
  statusBreakdown: Record<string, number>;
};

type Delivery = {
  id: string; chatId: string;
  pickupLat: number; pickupLng: number; pickupAddress: string;
  deliveryLat: number; deliveryLng: number; deliveryAddress: string;
  partnerId: string | null; baseFee: number; finalPrice: number | null;
  currency: string; distance: number | null; status: string;
  deliveryPin: string | null; pinAttempts: number;
  requestedAt: string; acceptedAt: string | null; pickedUpAt: string | null; deliveredAt: string | null;
  partner?: { user?: { id: string; name: string; phoneNumber: string }; vehicleType: string } | null;
  bids?: DeliveryBid[]; tracking?: TrackingPoint[];
  chat?: { id: string; buyerId: string; buyer: { id: string; name: string; phoneNumber: string };
    intent: { id: string; description: string; categoryId: string } };
};

type DeliveryBid = {
  id: string; partnerId: string; bidPrice: number; currency: string;
  message: string | null; eta: number; status: string; createdAt: string;
  partner: { user: { id: string; name: string; phoneNumber: string }; vehicleType?: string };
};

type TrackingPoint = { id: string; latitude: number; longitude: number; timestamp: string };

type Runner = {
  id: string; userId: string; name: string; phone: string;
  vehicleType: string; vehiclePlate: string;
  isOnline: boolean; currentLat: number | null; currentLng: number | null;
  lastLocationUpdate: string | null; rating: number; deliveryCount: number;
  totalEarnings: number; totalBids: number;
};

type StuckDelivery = {
  id: string; status: string; pickupAddress: string; deliveryAddress: string;
  runner: string | null; runnerPhone: string | null; vehicleType: string | null;
  bidCount: number; pinAttempts: number; requestedAt: string;
  pickedUpAt: string | null; reason: string; severity: "WARNING" | "CRITICAL";
};

function timeAgo(iso: string) {
  const d = Date.now() - new Date(iso).getTime();
  const m = Math.floor(d / 60000);
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  return `${Math.floor(h / 24)}d`;
}

function fmtDuration(mins: number) {
  if (mins < 60) return `${mins}m`;
  return `${Math.floor(mins / 60)}h${mins % 60 ? ` ${mins % 60}m` : ""}`;
}

const STATUS_TONE: Record<string, "danger" | "warning" | "info" | "accent" | "pending" | "neutral"> = {
  REQUESTED: "danger",
  BID_PENDING: "warning",
  BID_ACCEPTED: "warning",
  PICKED_UP: "info",
  EN_ROUTE: "accent",
  ARRIVED: "pending",
  COMPLETED: "neutral",
  CANCELLED: "neutral",
};

const STATUS_HEX: Record<string, string> = {
  REQUESTED: "oklch(0.68 0.22 25)",
  BID_PENDING: "oklch(0.75 0.17 50)",
  BID_ACCEPTED: "oklch(0.80 0.16 80)",
  PICKED_UP: "oklch(0.72 0.15 240)",
  EN_ROUTE: "oklch(0.72 0.18 155)",
  ARRIVED: "oklch(0.70 0.20 290)",
  COMPLETED: "oklch(0.55 0.015 255)",
  CANCELLED: "oklch(0.42 0.012 255)",
};

const TABS = [
  "ALL", "REQUESTED", "BID_PENDING", "BID_ACCEPTED",
  "PICKED_UP", "EN_ROUTE", "ARRIVED", "COMPLETED", "CANCELLED",
] as const;

export default function DeliveriesPage() {
  const [page, setPage] = React.useState(1);
  const [activeTab, setActiveTab] = React.useState<typeof TABS[number]>("ALL");
  const [selectedId, setSelectedId] = React.useState<string | null>(null);
  const [section, setSection] = React.useState<"table" | "runners" | "stuck">("table");

  const { data: stats } = useApi<DeliveryStats>("/api/admin/deliveries/stats");
  const { data, loading } = useApi<{ data: Delivery[]; total: number; counts: Record<string, number> }>(
    `/api/admin/deliveries?page=${page}&limit=20&status=${activeTab === "ALL" ? "" : activeTab}`
  );
  const { data: runners } = useApi<Runner[]>("/api/admin/deliveries/runners");
  const { data: stuckData } = useApi<StuckDelivery[]>("/api/admin/deliveries/stuck");

  const deliveries = data?.data || [];
  const total = data?.total || 0;
  const counts = data?.counts || {};
  const runnerList = runners || [];
  const stuck = stuckData || [];

  return (
    <>
      <PageContainer>
        <PageHeader
          title="Delivery Command"
          description={`${total.toLocaleString()} total · Real-time operations view`}
          actions={
            <Tabs value={section} onValueChange={(v) => setSection(v as typeof section)}>
              <TabsList variant="pill">
                <TabsTrigger value="table" variant="pill">Deliveries</TabsTrigger>
                <TabsTrigger value="runners" variant="pill">
                  Runners <span className="tabular text-2xs text-fg-subtle">{runnerList.length}</span>
                </TabsTrigger>
                <TabsTrigger value="stuck" variant="pill">
                  Stuck <span className={cn("tabular text-2xs", stuck.length > 0 ? "text-danger" : "text-fg-subtle")}>{stuck.length}</span>
                </TabsTrigger>
              </TabsList>
            </Tabs>
          }
        />

        {/* KPI row */}
        <div className="grid grid-cols-2 md:grid-cols-6 gap-2">
          <StatBlock label="Active" value={stats?.activeDeliveries ?? "—"} />
          <StatBlock label="Completed today" value={stats?.completedToday ?? "—"} />
          <StatBlock label="Online runners" value={stats ? `${stats.onlineRunners}/${stats.totalRunners}` : "—"} />
          <StatBlock label="Avg time (7d)" value={stats ? fmtDuration(stats.avgDeliveryMinutes) : "—"} />
          <StatBlock label="Completion rate" value={stats ? `${stats.completionRate}%` : "—"} />
          <StatBlock label="Stuck" value={stats?.stuckCount ?? "—"} />
        </div>

        {/* Live map */}
        <LiveMap deliveries={deliveries} runners={runnerList} onSelect={setSelectedId} />

        {section === "table" && (
          <>
            <div className="flex items-center gap-0.5 p-0.5 bg-raised rounded-md border border-muted overflow-x-auto">
              {TABS.map((tab) => {
                const count = tab === "ALL" ? total : (counts[tab] ?? 0);
                const active = activeTab === tab;
                return (
                  <button
                    key={tab}
                    onClick={() => { setActiveTab(tab); setPage(1); }}
                    className={cn(
                      "inline-flex items-center gap-1.5 h-7 px-2.5 rounded text-xs font-medium transition-colors whitespace-nowrap",
                      active ? "bg-panel text-fg shadow-elev-1" : "text-fg-muted hover:text-fg"
                    )}
                  >
                    {tab === "ALL" ? "All" : tab.replace("_", " ").toLowerCase().replace(/\b\w/g, (l) => l.toUpperCase())}
                    <span className={cn("tabular text-2xs", active ? "text-fg-muted" : "text-fg-subtle")}>{count}</span>
                  </button>
                );
              })}
            </div>

            <DeliveriesTable deliveries={deliveries} loading={loading} onSelect={setSelectedId} selectedId={selectedId} />

            {total > 20 && (
              <div className="flex items-center justify-between">
                <span className="text-2xs text-fg-subtle tabular">Page {page} of {Math.ceil(total / 20)}</span>
                <div className="flex items-center gap-1">
                  <Button size="sm" variant="secondary" disabled={page === 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>Previous</Button>
                  <Button size="sm" variant="secondary" disabled={page >= Math.ceil(total / 20)} onClick={() => setPage((p) => p + 1)}>Next</Button>
                </div>
              </div>
            )}
          </>
        )}

        {section === "runners" && <RunnerLeaderboard runners={runnerList} />}
        {section === "stuck" && <StuckAlerts stuck={stuck} onSelect={setSelectedId} />}
      </PageContainer>

      <Sheet open={!!selectedId} onOpenChange={(o) => { if (!o) setSelectedId(null); }}>
        <SheetContent width="md">
          {selectedId && <DeliveryDetail id={selectedId} onClose={() => setSelectedId(null)} />}
        </SheetContent>
      </Sheet>
    </>
  );
}

function DeliveriesTable({ deliveries, loading, onSelect, selectedId }: {
  deliveries: Delivery[]; loading: boolean; onSelect: (id: string) => void; selectedId: string | null;
}) {
  const columns: ColumnDef<Delivery>[] = [
    {
      id: "id",
      header: "ID",
      cell: ({ row }) => <span className="font-mono text-xs text-accent tabular">{row.original.id.slice(0, 8)}</span>,
    },
    {
      id: "route",
      header: "Pickup → Delivery",
      cell: ({ row }) => (
        <div className="max-w-[260px]">
          <div className="text-sm-compact text-fg truncate">{row.original.pickupAddress}</div>
          <div className="text-2xs text-fg-muted truncate">→ {row.original.deliveryAddress}</div>
        </div>
      ),
    },
    {
      id: "runner",
      header: "Runner",
      cell: ({ row }) => {
        const r = row.original.partner?.user?.name;
        return r ? <span className="text-sm-compact text-fg">{r}</span> : <span className="text-2xs text-fg-subtle italic">Unassigned</span>;
      },
    },
    {
      id: "status",
      header: "Status",
      cell: ({ row }) => <Badge tone={STATUS_TONE[row.original.status] || "neutral"} size="sm" dot>{row.original.status.replace("_", " ")}</Badge>,
    },
    {
      id: "fee",
      header: () => <span className="block text-right">Fee</span>,
      cell: ({ row }) => <span className="block text-right text-sm-compact text-fg tabular">${Number(row.original.baseFee || 0).toFixed(2)}</span>,
    },
    {
      id: "distance",
      header: () => <span className="block text-right">Distance</span>,
      cell: ({ row }) => (
        <span className="block text-right text-2xs text-fg-muted tabular">
          {row.original.distance ? `${Number(row.original.distance).toFixed(1)} km` : "—"}
        </span>
      ),
    },
    {
      id: "pin",
      header: "PIN",
      cell: ({ row }) => {
        const a = row.original.pinAttempts;
        if (a >= 3) return <Badge tone="danger" size="sm">Locked</Badge>;
        if (a > 0) return <span className="text-xs text-warning tabular">{a}/3</span>;
        return <span className="text-2xs text-fg-subtle">—</span>;
      },
    },
    {
      id: "requested",
      header: () => <span className="block text-right">Requested</span>,
      cell: ({ row }) => <span className="block text-right text-2xs text-fg-muted tabular">{timeAgo(row.original.requestedAt)}</span>,
    },
  ];

  return (
    <Table<Delivery>
      columns={columns}
      data={deliveries}
      loading={loading}
      onRowClick={(d) => onSelect(d.id)}
      rowId={(d) => d.id}
      selectedRowId={selectedId || undefined}
      emptyTitle="No deliveries"
      emptyIcon={<Truck className="h-5 w-5" />}
    />
  );
}

function LiveMap({ deliveries, runners, onSelect }: {
  deliveries: Delivery[]; runners: Runner[]; onSelect: (id: string) => void;
}) {
  const active = deliveries.filter((d) =>
    ["REQUESTED", "BID_PENDING", "BID_ACCEPTED", "PICKED_UP", "EN_ROUTE", "ARRIVED"].includes(d.status)
  );
  const points: { lat: number; lng: number }[] = [];
  active.forEach((d) => {
    if (d.pickupLat) points.push({ lat: d.pickupLat, lng: d.pickupLng });
    if (d.deliveryLat) points.push({ lat: d.deliveryLat, lng: d.deliveryLng });
  });
  runners.filter((r) => r.isOnline && r.currentLat).forEach((r) => points.push({ lat: r.currentLat!, lng: r.currentLng! }));

  const lats = points.map((p) => p.lat);
  const lngs = points.map((p) => p.lng);
  const minLat = lats.length ? Math.min(...lats) - 0.01 : -20.5;
  const maxLat = lats.length ? Math.max(...lats) + 0.01 : -17.5;
  const minLng = lngs.length ? Math.min(...lngs) - 0.01 : 29.5;
  const maxLng = lngs.length ? Math.max(...lngs) + 0.01 : 31.5;
  const latRange = maxLat - minLat || 1;
  const lngRange = maxLng - minLng || 1;

  const toXY = (lat: number, lng: number) => ({
    x: 5 + ((lng - minLng) / lngRange) * 90,
    y: 5 + ((maxLat - lat) / latRange) * 90,
  });

  return (
    <Card padding={false} className="relative h-[260px] overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-canvas via-panel to-canvas">
        <svg className="absolute inset-0 w-full h-full opacity-20">
          {Array.from({ length: 12 }, (_, i) => (
            <line key={`h${i}`} x1="0" y1={`${(i + 1) * 8}%`} x2="100%" y2={`${(i + 1) * 8}%`} stroke="var(--color-border-muted)" strokeWidth="1" />
          ))}
          {Array.from({ length: 16 }, (_, i) => (
            <line key={`v${i}`} x1={`${(i + 1) * 6}%`} y1="0" x2={`${(i + 1) * 6}%`} y2="100%" stroke="var(--color-border-muted)" strokeWidth="1" />
          ))}
        </svg>

        <svg className="absolute inset-0 w-full h-full" style={{ zIndex: 1 }}>
          {active.filter((d) => d.pickupLat && d.deliveryLat).map((d) => {
            const from = toXY(d.pickupLat, d.pickupLng);
            const to = toXY(d.deliveryLat, d.deliveryLng);
            return (
              <line key={d.id} x1={`${from.x}%`} y1={`${from.y}%`} x2={`${to.x}%`} y2={`${to.y}%`}
                stroke={STATUS_HEX[d.status] || "oklch(0.55 0.015 255)"} strokeWidth="1.5" strokeDasharray="4 3" opacity="0.55" />
            );
          })}
        </svg>

        {active.map((d) => {
          const at = d.status === "EN_ROUTE" || d.status === "ARRIVED"
            ? toXY(d.deliveryLat, d.deliveryLng) : toXY(d.pickupLat, d.pickupLng);
          return (
            <button key={d.id} className="absolute z-10" onClick={() => onSelect(d.id)}
              style={{ left: `${at.x}%`, top: `${at.y}%`, transform: "translate(-50%, -50%)" }}>
              <div className="w-3 h-3 rounded-full animate-pulse"
                style={{ backgroundColor: STATUS_HEX[d.status], boxShadow: `0 0 10px ${STATUS_HEX[d.status]}80` }} />
            </button>
          );
        })}

        {runners.filter((r) => r.isOnline && r.currentLat).map((r) => {
          const pos = toXY(r.currentLat!, r.currentLng!);
          return (
            <div key={r.id} className="absolute z-10"
              style={{ left: `${pos.x}%`, top: `${pos.y}%`, transform: "translate(-50%, -50%)" }}>
              <div className="w-2.5 h-2.5 rounded-sm rotate-45 bg-info border border-info/50" style={{ boxShadow: "0 0 6px var(--color-info)" }} />
            </div>
          );
        })}

        {points.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center text-sm text-fg-muted">
            No delivery coordinates available
          </div>
        )}
      </div>

      <div className="absolute top-3 left-3 flex items-center gap-1.5">
        <div className="px-2 py-1 bg-canvas/80 backdrop-blur-sm border border-muted rounded-md text-2xs font-medium text-fg">Live map</div>
        <div className="px-2 py-1 bg-canvas/80 backdrop-blur-sm border border-muted rounded-md flex items-center gap-1.5 text-2xs font-medium text-accent">
          <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
          {active.length} active
        </div>
      </div>

      <div className="absolute bottom-3 right-3 flex items-center gap-2 px-2 py-1.5 bg-canvas/80 backdrop-blur-sm border border-muted rounded-md flex-wrap">
        {[
          { color: "oklch(0.72 0.18 155)", label: "En route" },
          { color: "oklch(0.72 0.15 240)", label: "Picked" },
          { color: "oklch(0.80 0.16 80)", label: "Accepted" },
          { color: "oklch(0.68 0.22 25)", label: "Requested" },
          { color: "oklch(0.72 0.15 240)", label: "Runner", square: true },
        ].map((i) => (
          <span key={i.label} className="flex items-center gap-1 text-[10px] text-fg-muted">
            <span className={cn("w-1.5 h-1.5", i.square ? "rounded-sm rotate-45" : "rounded-full")} style={{ backgroundColor: i.color }} />
            {i.label}
          </span>
        ))}
      </div>
    </Card>
  );
}

function RunnerLeaderboard({ runners }: { runners: Runner[] }) {
  const [showAll, setShowAll] = React.useState(false);
  const rows = showAll ? runners : runners.slice(0, 10);

  const columns: ColumnDef<Runner>[] = [
    {
      id: "rank",
      header: "#",
      cell: ({ row }) => <span className="text-xs text-fg-subtle tabular">{row.index + 1}</span>,
    },
    {
      id: "runner",
      header: "Runner",
      cell: ({ row }) => (
        <div>
          <div className="text-sm-compact text-fg">{row.original.name}</div>
          <div className="text-2xs text-fg-muted tabular">{row.original.phone}</div>
        </div>
      ),
    },
    {
      id: "vehicle",
      header: "Vehicle",
      cell: ({ row }) => <span className="text-xs text-fg-muted">{row.original.vehicleType} · {row.original.vehiclePlate}</span>,
    },
    {
      id: "status",
      header: "Status",
      cell: ({ row }) => <Badge tone={row.original.isOnline ? "success" : "neutral"} size="sm" dot>{row.original.isOnline ? "Online" : "Offline"}</Badge>,
    },
    {
      id: "rating",
      header: () => <span className="block text-right">Rating</span>,
      accessorFn: (r) => r.rating,
      cell: ({ row }) => (
        <span className="flex items-center gap-1 justify-end text-xs">
          <Star className="h-3 w-3 fill-warning text-warning" />
          <span className="text-fg tabular">{row.original.rating.toFixed(1)}</span>
        </span>
      ),
    },
    {
      id: "deliveries",
      header: () => <span className="block text-right">Deliveries</span>,
      cell: ({ row }) => <span className="block text-right text-sm-compact text-fg tabular">{row.original.deliveryCount}</span>,
    },
    {
      id: "earnings",
      header: () => <span className="block text-right">Earnings</span>,
      cell: ({ row }) => <span className="block text-right text-sm-compact text-fg font-medium tabular">${Number(row.original.totalEarnings).toFixed(2)}</span>,
    },
    {
      id: "bids",
      header: () => <span className="block text-right">Bids</span>,
      cell: ({ row }) => <span className="block text-right text-2xs text-fg-muted tabular">{row.original.totalBids}</span>,
    },
  ];

  return (
    <div className="space-y-2">
      <Table<Runner> columns={columns} data={rows} rowId={(r) => r.id} emptyTitle="No runners" />
      {runners.length > 10 && (
        <div className="flex justify-center">
          <Button variant="ghost" size="sm" onClick={() => setShowAll((v) => !v)}>
            {showAll ? "Show less" : `Show all ${runners.length}`}
          </Button>
        </div>
      )}
    </div>
  );
}

function StuckAlerts({ stuck, onSelect }: { stuck: StuckDelivery[]; onSelect: (id: string) => void }) {
  if (stuck.length === 0) {
    return (
      <Card variant="ghost" className="text-center !py-8">
        <div className="text-sm text-fg-muted">No stuck deliveries right now</div>
      </Card>
    );
  }
  return (
    <Card padding={false}>
      <div className="px-4 py-3 border-b border-muted flex items-center gap-2">
        <AlertTriangle className="h-4 w-4 text-danger" />
        <h3 className="text-sm font-semibold text-fg">
          Stuck deliveries <span className="tabular text-fg-muted">({stuck.length})</span>
        </h3>
      </div>
      <div className="divide-y divide-[color:var(--color-border-muted)]">
        {stuck.map((d) => (
          <button
            key={d.id}
            onClick={() => onSelect(d.id)}
            className="w-full text-left px-4 py-3 hover:bg-raised transition-colors"
          >
            <div className="flex items-center justify-between gap-3 mb-1">
              <div className="flex items-center gap-1.5">
                <Badge tone={d.severity === "CRITICAL" ? "danger" : "warning"} size="sm">{d.severity}</Badge>
                <Badge tone={STATUS_TONE[d.status] || "neutral"} size="sm" dot>{d.status.replace("_", " ")}</Badge>
                <span className="font-mono text-xs text-fg-subtle">{d.id.slice(0, 8)}</span>
              </div>
              <span className="text-2xs text-fg-subtle tabular">{timeAgo(d.requestedAt)}</span>
            </div>
            <div className="text-sm-compact text-fg mb-0.5">{d.reason}</div>
            <div className="text-2xs text-fg-muted truncate">{d.pickupAddress} → {d.deliveryAddress}</div>
            <div className="flex items-center gap-3 mt-1 text-2xs text-fg-muted tabular">
              {d.runner && <span>Runner: {d.runner}</span>}
              <span>{d.bidCount} bids</span>
              {d.pinAttempts > 0 && <span className="text-danger">PIN: {d.pinAttempts}/3</span>}
            </div>
          </button>
        ))}
      </div>
    </Card>
  );
}

function DeliveryDetail({ id, onClose }: { id: string; onClose: () => void }) {
  const { data: delivery, loading, refetch } = useApi<Delivery>(`/api/admin/deliveries/${id}`);
  const { run } = useOptimisticAction();

  const doAction = React.useCallback((action: "force-cancel" | "reset-pin") => {
    run({
      action: () => api.post(`/api/admin/deliveries/${id}/${action}`),
      label: action === "force-cancel" ? "Delivery cancelled" : "PIN attempts reset",
      onSuccess: () => refetch(),
    });
  }, [id, run, refetch]);

  if (loading) {
    return (
      <>
        <SheetHeader title={<Skeleton className="h-5 w-40" />} />
        <SheetBody>
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-12" />)}
          </div>
        </SheetBody>
      </>
    );
  }
  if (!delivery) {
    return (
      <>
        <SheetHeader title="Not found" />
        <SheetBody><div className="text-center text-fg-muted py-6">Delivery not found</div></SheetBody>
      </>
    );
  }

  return (
    <>
      <SheetHeader
        title={
          <div className="flex items-center gap-2 min-w-0">
            <Badge tone={STATUS_TONE[delivery.status] || "neutral"} size="sm" dot>{delivery.status.replace("_", " ")}</Badge>
            <span className="font-mono text-xs text-fg-subtle">{delivery.id.slice(0, 12)}</span>
          </div>
        }
        subtitle={delivery.pinAttempts >= 3 ? <Badge tone="danger" size="sm">PIN LOCKED</Badge> : undefined}
      />
      <SheetBody>
        {/* Addresses */}
        <div className="space-y-1.5 mb-5">
          <div className="flex items-start gap-2">
            <span className="w-5 h-5 rounded-full bg-success-bg text-success flex items-center justify-center text-[10px] font-bold mt-0.5">P</span>
            <div className="min-w-0 flex-1">
              <div className="text-sm text-fg">{delivery.pickupAddress}</div>
              <div className="text-2xs text-fg-subtle tabular">{delivery.pickupLat.toFixed(4)}, {delivery.pickupLng.toFixed(4)}</div>
            </div>
          </div>
          <div className="ml-2.5 border-l border-dashed border-muted h-3" />
          <div className="flex items-start gap-2">
            <span className="w-5 h-5 rounded-full bg-danger-bg text-danger flex items-center justify-center text-[10px] font-bold mt-0.5">D</span>
            <div className="min-w-0 flex-1">
              <div className="text-sm text-fg">{delivery.deliveryAddress}</div>
              <div className="text-2xs text-fg-subtle tabular">{delivery.deliveryLat.toFixed(4)}, {delivery.deliveryLng.toFixed(4)}</div>
            </div>
          </div>
        </div>

        {delivery.chat && (
          <Card variant="ghost" className="mb-3 !p-3">
            <div className="text-2xs uppercase tracking-wider text-fg-subtle mb-1">Customer</div>
            <div className="text-sm text-fg font-medium">{delivery.chat.buyer.name}</div>
            <div className="text-2xs text-fg-muted tabular">{delivery.chat.buyer.phoneNumber}</div>
            <div className="text-2xs text-fg-muted mt-1">
              {delivery.chat.intent.categoryId} — {delivery.chat.intent.description?.slice(0, 80)}
            </div>
          </Card>
        )}

        {delivery.partner && (
          <Card variant="ghost" className="mb-3 !p-3">
            <div className="text-2xs uppercase tracking-wider text-fg-subtle mb-1">Assigned runner</div>
            <div className="text-sm text-fg font-medium">{delivery.partner.user?.name}</div>
            <div className="text-2xs text-fg-muted tabular">{delivery.partner.user?.phoneNumber} · {delivery.partner.vehicleType}</div>
          </Card>
        )}

        <div className="grid grid-cols-3 gap-2 mb-4">
          <StatBlock label="Base fee" value={`$${Number(delivery.baseFee || 0).toFixed(2)}`} />
          <StatBlock label="Final price" value={delivery.finalPrice ? `$${Number(delivery.finalPrice).toFixed(2)}` : "—"} />
          <StatBlock label="Distance" value={delivery.distance ? `${Number(delivery.distance).toFixed(1)}km` : "—"} />
        </div>

        <Card variant="ghost" className="mb-4 !p-3 flex items-center justify-between">
          <div>
            <div className="text-2xs text-fg-subtle">Delivery PIN</div>
            <div className="text-sm font-mono text-fg">{delivery.deliveryPin || "Not set"}</div>
          </div>
          <div className="text-right">
            <div className="text-2xs text-fg-subtle">Attempts</div>
            <div className={cn("text-sm font-semibold tabular", delivery.pinAttempts >= 3 ? "text-danger" : "text-fg")}>
              {delivery.pinAttempts}/3
            </div>
          </div>
        </Card>

        {delivery.bids && delivery.bids.length > 0 && (
          <div className="mb-4">
            <h3 className="text-sm font-semibold text-fg mb-2">
              Bids <span className="tabular text-fg-muted">({delivery.bids.length})</span>
            </h3>
            <div className="space-y-1.5">
              {delivery.bids.map((b) => (
                <div key={b.id} className={cn(
                  "p-2.5 rounded-md border",
                  b.status === "ACCEPTED" ? "border-success bg-success-bg" : "border-muted bg-raised"
                )}>
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm-compact font-medium text-fg">{b.partner.user.name}</div>
                      <div className="text-2xs text-fg-muted tabular">{b.partner.user.phoneNumber}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm-compact font-semibold text-fg tabular">${Number(b.bidPrice).toFixed(2)}</div>
                      <div className="text-2xs text-fg-muted">ETA {b.eta}m</div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between mt-1.5">
                    <Badge tone={b.status === "ACCEPTED" ? "success" : "neutral"} size="sm">{b.status}</Badge>
                    {b.message && <span className="text-2xs text-fg-muted italic truncate max-w-[60%]">&quot;{b.message}&quot;</span>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div>
          <h3 className="text-sm font-semibold text-fg mb-2">Timeline</h3>
          <div className="space-y-0">
            {[
              { label: "Requested", time: delivery.requestedAt },
              { label: "Accepted", time: delivery.acceptedAt },
              { label: "Picked up", time: delivery.pickedUpAt },
              { label: "Delivered", time: delivery.deliveredAt },
            ].map((s, i) => (
              <div key={i} className="flex items-start gap-2.5">
                <div className="flex flex-col items-center">
                  <div className={cn("w-2 h-2 rounded-full", s.time ? "bg-accent" : "bg-muted")} />
                  {i < 3 && <div className={cn("w-px h-5", s.time ? "bg-accent/40" : "bg-muted")} />}
                </div>
                <div className="pb-1.5 min-w-0 flex-1">
                  <div className={cn("text-sm-compact font-medium", s.time ? "text-fg" : "text-fg-subtle")}>{s.label}</div>
                  {s.time && <div className="text-2xs text-fg-muted">{new Date(s.time).toLocaleString()}</div>}
                </div>
              </div>
            ))}
          </div>
        </div>
      </SheetBody>
      {!["COMPLETED", "CANCELLED"].includes(delivery.status) && (
        <SheetFooter>
          {delivery.pinAttempts >= 1 && (
            <Button variant="secondary" size="sm" leadingIcon={<RefreshCw className="h-3.5 w-3.5" />} onClick={() => doAction("reset-pin")}>
              Reset PIN
            </Button>
          )}
          <Button variant="danger-ghost" size="sm" leadingIcon={<XCircle className="h-3.5 w-3.5" />} onClick={() => doAction("force-cancel")}>
            Force cancel
          </Button>
        </SheetFooter>
      )}
    </>
  );
}
