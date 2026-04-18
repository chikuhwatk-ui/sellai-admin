"use client";

import * as React from "react";
import { Search, AlertTriangle, X, ChevronDown } from "lucide-react";
import type { ColumnDef } from "@tanstack/react-table";
import { useApi } from "@/hooks/useApi";
import { PageContainer, PageHeader } from "@/components/ui/PageHeader";
import { StatBlock } from "@/components/ui/StatBlock";
import { Table } from "@/components/ui/Table";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { Kbd } from "@/components/ui/Kbd";
import { Sheet, SheetContent, SheetHeader, SheetBody } from "@/components/ui/Sheet";
import { Skeleton } from "@/components/ui/Skeleton";
import { cn } from "@/lib/cn";
import { pushRecent } from "@/hooks/useRecent";

interface Demand {
  id: string;
  description: string;
  categoryId: string;
  subcategory?: string;
  intentType: string;
  urgency: string;
  status: string;
  budgetMin: number | null;
  budgetMax: number | null;
  currency: string;
  locationName?: string;
  currentWave: number;
  maxWaves: number;
  expiresAt: string;
  createdAt: string;
  stoppedAt?: string;
  stopReason?: string;
  imageUrl?: string;
  offerCount: number;
  buyer?: { id: string; name: string; phoneNumber: string };
}

interface DemandDetail extends Demand {
  latitude: number;
  longitude: number;
  tags: string[];
  offers: {
    id: string; price: number; currency: string; message?: string; status: string; createdAt: string;
    seller: { id: string; businessName: string; user?: { name: string } };
  }[];
  waves: { id: string; waveNumber: number; notifiedCount?: number; createdAt: string }[];
}

interface Stats {
  activeCount: number; matchRate: number; avgTimeToFirstOffer: number;
  unfulfilled: number; avgOffersPerDemand: number;
}

interface SupplyGaps {
  urgentNoOffers: { id: string; description: string; categoryId: string; buyerName: string; createdAt: string }[];
  expiringNoOffers: { id: string; description: string; categoryId: string; buyerName: string; expiresAt: string }[];
}

const STATUS_TABS = [
  { key: "ALL", label: "All" },
  { key: "OPEN", label: "Open" },
  { key: "MATCHED", label: "Matched" },
  { key: "EXPIRED", label: "Expired" },
  { key: "STOPPED", label: "Stopped" },
  { key: "CLOSED", label: "Closed" },
] as const;

const URGENCY_TONE: Record<string, "danger" | "warning" | "info"> = {
  TODAY: "danger",
  THIS_WEEK: "warning",
  FLEXIBLE: "info",
};

const STATUS_TONE: Record<string, "accent" | "success" | "warning" | "danger" | "neutral"> = {
  OPEN: "accent",
  MATCHED: "success",
  EXPIRED: "warning",
  STOPPED: "danger",
  CLOSED: "neutral",
};

function timeAgo(iso: string) {
  const d = Date.now() - new Date(iso).getTime();
  const m = Math.floor(d / 60000);
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  return `${Math.floor(h / 24)}d`;
}

function fmtBudget(min: number | null, max: number | null, ccy: string) {
  if (min && max) return `$${min}–${max}`;
  if (min) return `From $${min}`;
  if (max) return `Up to $${max}`;
  return "—";
}

export default function DemandCenterPage() {
  const [page, setPage] = React.useState(1);
  const [activeTab, setActiveTab] = React.useState<typeof STATUS_TABS[number]["key"]>("ALL");
  const [search, setSearch] = React.useState("");
  const [selectedId, setSelectedId] = React.useState<string | null>(null);
  const [showGaps, setShowGaps] = React.useState(true);

  const [debouncedSearch, setDebouncedSearch] = React.useState("");
  React.useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(t);
  }, [search]);

  const searchRef = React.useRef<HTMLInputElement>(null);
  React.useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (e.key === "/" && !["INPUT", "TEXTAREA"].includes((e.target as HTMLElement).tagName)) {
        e.preventDefault();
        searchRef.current?.focus();
      }
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, []);

  const statusParam = activeTab === "ALL" ? "" : activeTab;
  const searchParam = debouncedSearch ? `&search=${encodeURIComponent(debouncedSearch)}` : "";

  const { data: stats } = useApi<Stats>("/api/admin/demands/stats");
  const { data: gapsData } = useApi<SupplyGaps>("/api/admin/demands/supply-gaps");
  const { data, loading } = useApi<{ data: Demand[]; total: number; counts: Record<string, number> }>(
    `/api/admin/demands?page=${page}&limit=20&status=${statusParam}${searchParam}`
  );
  const { data: detail, loading: detailLoading } = useApi<DemandDetail>(
    selectedId ? `/api/admin/demands/${selectedId}` : null
  );

  const demands = data?.data || [];
  const total = data?.total || 0;
  const counts = data?.counts || {};
  const gapCount = (gapsData?.urgentNoOffers?.length || 0) + (gapsData?.expiringNoOffers?.length || 0);

  const columns: ColumnDef<Demand>[] = [
    {
      id: "description",
      header: "Demand",
      cell: ({ row }) => {
        const d = row.original;
        return (
          <div className="max-w-[280px]">
            <div className="text-sm-compact text-fg truncate">{d.description}</div>
            <div className="text-2xs text-fg-subtle">{d.intentType === "SERVICE" ? "Service" : "Goods"}</div>
          </div>
        );
      },
    },
    {
      id: "buyer",
      header: "Buyer",
      cell: ({ row }) => <span className="text-sm-compact text-fg">{row.original.buyer?.name || "—"}</span>,
    },
    {
      id: "category",
      header: "Category",
      cell: ({ row }) => (
        <div>
          <div className="text-xs text-fg-muted">{row.original.categoryId}</div>
          {row.original.subcategory && <div className="text-2xs text-fg-subtle">{row.original.subcategory}</div>}
        </div>
      ),
    },
    {
      id: "budget",
      header: () => <span className="block text-right">Budget</span>,
      cell: ({ row }) => (
        <span className="block text-right text-sm-compact text-fg tabular whitespace-nowrap">
          {fmtBudget(row.original.budgetMin, row.original.budgetMax, row.original.currency)}
        </span>
      ),
    },
    {
      id: "urgency",
      header: "Urgency",
      cell: ({ row }) => (
        <Badge tone={URGENCY_TONE[row.original.urgency] || "neutral"} size="sm">
          {row.original.urgency.replace("_", " ")}
        </Badge>
      ),
    },
    {
      id: "offers",
      header: () => <span className="block text-right">Offers</span>,
      cell: ({ row }) => (
        <span className={cn("block text-right text-sm-compact tabular", row.original.offerCount === 0 ? "text-fg-subtle" : "text-fg")}>
          {row.original.offerCount}
        </span>
      ),
    },
    {
      id: "wave",
      header: "Wave",
      cell: ({ row }) => (
        <span className="text-2xs text-fg-muted tabular">{row.original.currentWave}/{row.original.maxWaves}</span>
      ),
    },
    {
      id: "status",
      header: "Status",
      cell: ({ row }) => (
        <div>
          <Badge tone={STATUS_TONE[row.original.status] || "neutral"} size="sm">{row.original.status}</Badge>
          {row.original.stopReason && (
            <div className="text-[10px] text-fg-subtle mt-0.5">{row.original.stopReason.replace(/_/g, " ")}</div>
          )}
        </div>
      ),
    },
    {
      id: "posted",
      header: "Posted",
      cell: ({ row }) => <span className="text-2xs text-fg-muted tabular">{timeAgo(row.original.createdAt)}</span>,
    },
  ];

  const openDetail = (d: Demand) => {
    pushRecent({ id: d.id, kind: "order", label: d.description, href: `/orders#${d.id}` });
    setSelectedId(d.id);
  };

  return (
    <>
      <PageContainer>
        <PageHeader
          title="Demand Center"
          description="Monitor marketplace demands, matching performance, and supply gaps"
        />

        {/* KPI row */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
          <StatBlock label="Active demands" value={stats?.activeCount ?? "—"} />
          <StatBlock label="Match rate (7d)" value={stats?.matchRate != null ? `${stats.matchRate}%` : "—"} />
          <StatBlock label="Avg time to offer" value={stats?.avgTimeToFirstOffer != null ? `${stats.avgTimeToFirstOffer}h` : "—"} />
          <StatBlock label="Unfulfilled (24h+)" value={stats?.unfulfilled ?? "—"} />
          <StatBlock label="Offers/demand" value={stats?.avgOffersPerDemand ?? "—"} />
        </div>

        {/* Supply gap alerts */}
        {gapCount > 0 && (
          <div>
            <button
              onClick={() => setShowGaps((v) => !v)}
              className="flex items-center gap-2 text-sm-compact font-medium text-warning mb-2"
            >
              <AlertTriangle className="h-3.5 w-3.5" />
              Supply gap alerts <span className="tabular">({gapCount})</span>
              <ChevronDown className={cn("h-3 w-3 transition-transform", showGaps && "rotate-180")} />
            </button>
            {showGaps && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {gapsData?.urgentNoOffers && gapsData.urgentNoOffers.length > 0 && (
                  <GapCard title="Urgent — no offers (4h+)" tone="danger" items={gapsData.urgentNoOffers.map((d) => ({
                    id: d.id, label: d.description, sub: `${d.buyerName} · ${d.categoryId}`, time: timeAgo(d.createdAt),
                  }))} onSelect={setSelectedId} />
                )}
                {gapsData?.expiringNoOffers && gapsData.expiringNoOffers.length > 0 && (
                  <GapCard title="Expiring soon — no offers" tone="warning" items={gapsData.expiringNoOffers.map((d) => ({
                    id: d.id, label: d.description, sub: `${d.buyerName} · ${d.categoryId}`,
                    time: `Expires ${new Date(d.expiresAt).toLocaleDateString(undefined, { day: "numeric", month: "short" })}`,
                  }))} onSelect={setSelectedId} />
                )}
              </div>
            )}
          </div>
        )}

        {/* Search + Status tabs */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
          <div className="relative flex-1 max-w-md">
            <Input
              ref={searchRef}
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              placeholder="Search demand or buyer…"
              leadingIcon={<Search className="h-3.5 w-3.5" />}
              trailingIcon={!search ? <Kbd>/</Kbd> : undefined}
            />
          </div>
          <div className="flex items-center gap-0.5 p-0.5 bg-raised rounded-md border border-muted overflow-x-auto">
            {STATUS_TABS.map((tab) => {
              const count = tab.key === "ALL" ? total : (counts[tab.key] ?? 0);
              const active = activeTab === tab.key;
              return (
                <button
                  key={tab.key}
                  onClick={() => { setActiveTab(tab.key); setPage(1); }}
                  className={cn(
                    "inline-flex items-center gap-1.5 h-7 px-2.5 rounded text-xs font-medium transition-colors whitespace-nowrap",
                    active
                      ? "bg-panel text-fg shadow-elev-1"
                      : "text-fg-muted hover:text-fg"
                  )}
                >
                  {tab.label}
                  <span className={cn("tabular text-2xs", active ? "text-fg-muted" : "text-fg-subtle")}>{count}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Table */}
        <Table<Demand>
          columns={columns}
          data={demands}
          loading={loading}
          onRowClick={openDetail}
          rowId={(d) => d.id}
          selectedRowId={selectedId || undefined}
          emptyTitle={search ? `No demands matching "${search}"` : "No demands"}
          emptyDescription="Adjust filters to see more results"
        />

        {/* Pagination */}
        {total > 20 && (
          <div className="flex items-center justify-between">
            <span className="text-2xs text-fg-subtle tabular">Page {page} of {Math.ceil(total / 20)}</span>
            <div className="flex items-center gap-1">
              <Button size="sm" variant="secondary" disabled={page === 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>Previous</Button>
              <Button size="sm" variant="secondary" disabled={page >= Math.ceil(total / 20)} onClick={() => setPage((p) => p + 1)}>Next</Button>
            </div>
          </div>
        )}
      </PageContainer>

      {/* Detail sheet */}
      <Sheet open={!!selectedId} onOpenChange={(o) => { if (!o) setSelectedId(null); }}>
        <SheetContent width="lg">
          {detailLoading ? (
            <div className="p-5 space-y-3">
              <Skeleton className="h-6 w-48" />
              <Skeleton className="h-4 w-full" />
              <div className="grid grid-cols-2 gap-3 mt-4">
                {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-12" />)}
              </div>
            </div>
          ) : detail ? (
            <>
              <SheetHeader
                title={detail.description}
                subtitle={
                  <div className="flex items-center gap-2 text-2xs">
                    <Badge tone={STATUS_TONE[detail.status] || "neutral"} size="sm">{detail.status}</Badge>
                    <span>{detail.intentType === "SERVICE" ? "Service" : "Goods"}</span>
                    <span>·</span>
                    <span>{detail.categoryId}{detail.subcategory ? ` / ${detail.subcategory}` : ""}</span>
                  </div>
                }
              />
              <SheetBody>
                <div className="grid grid-cols-2 gap-4 mb-5">
                  <Meta label="Buyer" value={<div><div className="text-sm text-fg">{detail.buyer?.name || "—"}</div><div className="text-2xs text-fg-muted">{detail.buyer?.phoneNumber}</div></div>} />
                  <Meta label="Location" value={detail.locationName || `${detail.latitude?.toFixed(3)}, ${detail.longitude?.toFixed(3)}`} />
                  <Meta label="Budget" value={fmtBudget(detail.budgetMin, detail.budgetMax, detail.currency)} />
                  <Meta label="Urgency" value={<Badge tone={URGENCY_TONE[detail.urgency] || "neutral"} size="sm">{detail.urgency.replace("_", " ")}</Badge>} />
                  <Meta
                    label="Wave"
                    value={
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-1.5 bg-raised rounded-full overflow-hidden">
                          <div className="h-full bg-accent" style={{ width: `${(detail.currentWave / detail.maxWaves) * 100}%` }} />
                        </div>
                        <span className="text-2xs text-fg-muted tabular">{detail.currentWave}/{detail.maxWaves}</span>
                      </div>
                    }
                  />
                  <Meta label="Expires" value={<span className="text-sm text-fg">{new Date(detail.expiresAt).toLocaleString()}</span>} />
                </div>

                {detail.stopReason && (
                  <Card variant="ghost" className="mb-4">
                    <div className="text-2xs uppercase tracking-wider text-fg-subtle mb-1">Stop reason</div>
                    <div className="text-sm text-fg">{detail.stopReason.replace(/_/g, " ")}</div>
                    {detail.stoppedAt && <div className="text-2xs text-fg-muted mt-1">Stopped {new Date(detail.stoppedAt).toLocaleString()}</div>}
                  </Card>
                )}

                {detail.tags && detail.tags.length > 0 && (
                  <div className="mb-4">
                    <div className="text-2xs uppercase tracking-wider text-fg-subtle mb-2">Tags</div>
                    <div className="flex flex-wrap gap-1">
                      {detail.tags.map((t) => <Badge key={t} tone="accent" size="sm">{t}</Badge>)}
                    </div>
                  </div>
                )}

                {detail.imageUrl && (
                  <div className="mb-4">
                    <div className="text-2xs uppercase tracking-wider text-fg-subtle mb-2">Attached image</div>
                    <img src={detail.imageUrl} alt="" className="max-h-48 rounded-md border border-muted" />
                  </div>
                )}

                <div className="mb-4">
                  <h3 className="text-sm font-semibold text-fg mb-2">
                    Offers <span className="text-fg-muted tabular">({detail.offers?.length || 0})</span>
                  </h3>
                  {detail.offers && detail.offers.length > 0 ? (
                    <div className="space-y-1.5">
                      {detail.offers.map((o) => (
                        <div key={o.id} className="flex items-start justify-between gap-3 p-2.5 rounded-md bg-raised border border-muted">
                          <div className="min-w-0 flex-1">
                            <div className="text-sm-compact font-medium text-fg">{o.seller?.businessName || o.seller?.user?.name || "Unknown"}</div>
                            {o.message && <div className="text-xs text-fg-muted mt-0.5 line-clamp-2">{o.message}</div>}
                            <div className="text-2xs text-fg-subtle mt-1">{timeAgo(o.createdAt)}</div>
                          </div>
                          <div className="text-right shrink-0">
                            <div className="text-sm font-semibold text-fg tabular">${o.price.toFixed(2)}</div>
                            <Badge tone={o.status === "ACCEPTED" ? "success" : o.status === "REJECTED" ? "danger" : "neutral"} size="sm">{o.status}</Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-xs text-fg-subtle text-center py-4">No offers yet</div>
                  )}
                </div>

                {/* Timeline */}
                <div>
                  <h3 className="text-sm font-semibold text-fg mb-2">Timeline</h3>
                  <div className="space-y-2.5">
                    <TimelineRow tone="accent" title="Demand posted" time={detail.createdAt} />
                    {detail.offers && detail.offers.length > 0 && (
                      <TimelineRow tone="info" title="First offer received" time={detail.offers[detail.offers.length - 1].createdAt} />
                    )}
                    {detail.status === "MATCHED" && (
                      <TimelineRow tone="accent" title="Matched with seller" time={detail.stoppedAt} />
                    )}
                    {(detail.status === "EXPIRED" || detail.status === "STOPPED") && (
                      <TimelineRow
                        tone={detail.status === "EXPIRED" ? "warning" : "danger"}
                        title={detail.status === "EXPIRED" ? "Demand expired" : "Demand stopped"}
                        time={detail.stoppedAt}
                      />
                    )}
                  </div>
                </div>
              </SheetBody>
            </>
          ) : (
            <div className="flex items-center justify-center h-full text-fg-muted">Not found</div>
          )}
        </SheetContent>
      </Sheet>
    </>
  );
}

function Meta({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <div className="text-2xs uppercase tracking-wider text-fg-subtle mb-0.5">{label}</div>
      <div className="text-sm text-fg">{value}</div>
    </div>
  );
}

function GapCard({ title, tone, items, onSelect }: {
  title: string; tone: "danger" | "warning";
  items: { id: string; label: string; sub: string; time: string }[];
  onSelect: (id: string) => void;
}) {
  const toneClass = tone === "danger" ? "border-danger/30" : "border-warning/30";
  const timeClass = tone === "danger" ? "text-danger" : "text-warning";
  return (
    <Card variant="ghost" className={cn("!p-3", toneClass)}>
      <h4 className={cn("text-xs font-medium mb-2", timeClass)}>{title}</h4>
      <div className="space-y-1">
        {items.map((i) => (
          <button
            key={i.id}
            onClick={() => onSelect(i.id)}
            className="flex items-start justify-between gap-2 w-full p-2 rounded text-left hover:bg-raised transition-colors"
          >
            <div className="min-w-0 flex-1">
              <div className="text-sm-compact text-fg truncate">{i.label}</div>
              <div className="text-2xs text-fg-muted truncate">{i.sub}</div>
            </div>
            <span className={cn("text-2xs shrink-0 tabular", timeClass)}>{i.time}</span>
          </button>
        ))}
      </div>
    </Card>
  );
}

function TimelineRow({ tone, title, time }: { tone: "accent" | "info" | "warning" | "danger"; title: string; time?: string }) {
  return (
    <div className="flex items-start gap-2.5">
      <div className={cn("w-2 h-2 rounded-full mt-1.5 shrink-0", {
        accent: "bg-accent", info: "bg-info", warning: "bg-warning", danger: "bg-danger",
      }[tone])} />
      <div className="min-w-0 flex-1">
        <div className="text-sm-compact text-fg">{title}</div>
        {time && <div className="text-2xs text-fg-muted">{new Date(time).toLocaleString()}</div>}
      </div>
    </div>
  );
}
