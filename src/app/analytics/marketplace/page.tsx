'use client';

import { useState } from 'react';
import { useApi } from '@/hooks/useApi';
import { PageContainer, PageHeader } from '@/components/ui/PageHeader';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Skeleton } from '@/components/ui/Skeleton';
import { cn } from '@/lib/cn';

// Local segmented control for the period picker. Intentionally local to
// this page — it's currently the only surface that needs a 7/30/90d toggle.
// If a second caller appears, lift it to src/components/ui/.
function SegmentedControl<T extends string | number>({
  options,
  value,
  onChange,
  renderLabel,
}: {
  options: readonly T[];
  value: T;
  onChange: (v: T) => void;
  renderLabel?: (v: T) => string;
}) {
  return (
    <div className="inline-flex items-center gap-0.5 p-0.5 bg-raised rounded-md border border-muted">
      {options.map((opt) => {
        const active = opt === value;
        return (
          <button
            key={String(opt)}
            onClick={() => onChange(opt)}
            className={cn(
              'h-7 px-2.5 rounded text-xs font-medium transition-colors',
              active ? 'bg-panel text-fg shadow-elev-1' : 'text-fg-muted hover:text-fg',
            )}
          >
            {renderLabel ? renderLabel(opt) : String(opt)}
          </button>
        );
      })}
    </div>
  );
}

export default function MarketplaceHealthPage() {
  const [period, setPeriod] = useState<7 | 30 | 90>(30);
  const { data, loading, error, refetch } = useApi<any>(`/api/admin/analytics/marketplace?period=${period}`);

  const demands: Array<{ date: string; count: number }> = data?.timeSeries?.demands || [];
  const offers: Array<{ date: string; count: number }> = data?.timeSeries?.offers || [];
  const funnel: Array<{ step: string; value: number }> = data?.funnel || [];
  const categories: Array<{ categoryId: string; categoryName: string; demandCount: number; fillRate: number }> =
    data?.categoryFillRates || [];
  const histogramBins: Array<{ bucket: string; count: number }> = data?.timeToFirstOffer || [];

  const maxHistVal = Math.max(...(histogramBins.length ? histogramBins.map((b) => b.count) : [1]));

  // SVG line-chart geometry — kept local so the chart is self-contained.
  const allValues = [...demands.map((d) => d.count), ...offers.map((d) => d.count)];
  const maxY = allValues.length ? Math.max(...allValues) : 1;
  const minY = allValues.length ? Math.min(...allValues) : 0;
  const chartW = 800;
  const chartH = 300;
  const pad = { top: 20, right: 20, bottom: 40, left: 50 };
  const innerW = chartW - pad.left - pad.right;
  const innerH = chartH - pad.top - pad.bottom;

  function toPoints(series: Array<{ date: string; count: number }>) {
    if (series.length < 2) return '';
    return series
      .map((d, i) => {
        const x = pad.left + (i / (series.length - 1)) * innerW;
        const y = pad.top + innerH - ((d.count - minY) / (maxY - minY || 1)) * innerH;
        return `${x},${y}`;
      })
      .join(' ');
  }

  const maxFunnel = funnel.length ? funnel[0]?.value || 1 : 1;

  // Category fill-rate semantic thresholds — read from CSS tokens so the
  // chart stays on-brand across themes. (Previously hardcoded hex.)
  const fillColor = (pct: number) =>
    pct < 30 ? 'var(--color-danger)' : pct < 60 ? 'var(--color-warning)' : 'var(--color-success)';

  return (
    <PageContainer>
      <PageHeader
        title="Marketplace Health"
        description="Supply-demand dynamics and conversion performance."
        actions={
          <SegmentedControl
            options={[7, 30, 90] as const}
            value={period}
            onChange={(v) => setPeriod(v)}
            renderLabel={(v) => `${v}d`}
          />
        }
      />

      {error ? (
        <Card>
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="text-sm font-medium text-fg">Couldn&apos;t load marketplace data.</div>
              <div className="text-2xs text-fg-muted mt-0.5">{error}</div>
            </div>
            <button
              onClick={refetch}
              className="text-xs font-medium text-accent hover:underline"
            >
              Retry
            </button>
          </div>
        </Card>
      ) : null}

      {/* Supply–Demand Balance */}
      <Card padding={false}>
        <CardHeader>
          <CardTitle>Supply–Demand Balance</CardTitle>
          <div className="flex items-center gap-3 text-2xs text-fg-muted">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: 'var(--color-success)' }} /> Demands
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: 'var(--color-info)' }} /> Offers
            </span>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <Skeleton className="h-64 w-full" />
          ) : demands.length < 2 && offers.length < 2 ? (
            <div className="text-sm text-fg-muted py-8 text-center">No data for this period.</div>
          ) : (
            <svg
              viewBox={`0 0 ${chartW} ${chartH}`}
              className="w-full"
              preserveAspectRatio="xMidYMid meet"
              role="img"
              aria-label={`Supply and demand over the last ${period} days`}
            >
              <title>{`Supply vs demand — ${period}-day window`}</title>
              {/* Horizontal gridlines + Y-axis labels */}
              {[0, 0.25, 0.5, 0.75, 1].map((f) => {
                const y = pad.top + innerH * (1 - f);
                const val = Math.round(minY + (maxY - minY) * f);
                return (
                  <g key={f}>
                    <line
                      x1={pad.left}
                      y1={y}
                      x2={chartW - pad.right}
                      y2={y}
                      stroke="var(--color-border-muted)"
                      strokeWidth="1"
                    />
                    <text
                      x={pad.left - 8}
                      y={y + 4}
                      textAnchor="end"
                      fill="var(--color-fg-subtle)"
                      fontSize="11"
                      className="tabular"
                    >
                      {val}
                    </text>
                  </g>
                );
              })}
              {/* X-axis labels — show ~6 evenly spaced */}
              {demands
                .filter((_, i) => i % Math.max(1, Math.floor(demands.length / 6)) === 0)
                .map((d, idx) => {
                  const i = demands.indexOf(d);
                  const x = pad.left + (i / Math.max(demands.length - 1, 1)) * innerW;
                  return (
                    <text
                      key={idx}
                      x={x}
                      y={chartH - 5}
                      textAnchor="middle"
                      fill="var(--color-fg-subtle)"
                      fontSize="10"
                      className="tabular"
                    >
                      {d.date?.slice(5)}
                    </text>
                  );
                })}
              <polyline
                points={toPoints(demands)}
                fill="none"
                stroke="var(--color-success)"
                strokeWidth="2"
                strokeLinejoin="round"
              />
              <polyline
                points={toPoints(offers)}
                fill="none"
                stroke="var(--color-info)"
                strokeWidth="2"
                strokeLinejoin="round"
              />
            </svg>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Conversion Funnel */}
        <Card padding={false}>
          <CardHeader>
            <CardTitle>Conversion Funnel</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-3">
                {[0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-8" />)}
              </div>
            ) : funnel.length === 0 ? (
              <div className="text-sm text-fg-muted py-8 text-center">No funnel data.</div>
            ) : (
              <div className="space-y-3">
                {funnel.map((stage, i) => {
                  const widthPct = (stage.value / maxFunnel) * 100;
                  const prevValue = i > 0 ? funnel[i - 1]?.value || 0 : 0;
                  const dropOff = i > 0 && prevValue > 0 ? Math.round(((prevValue - stage.value) / prevValue) * 100) : 0;
                  const convRate = i > 0 && prevValue > 0 ? Math.round((stage.value / prevValue) * 100) : 100;
                  return (
                    <div key={stage.step}>
                      {i > 0 && (
                        <div className="text-2xs text-danger text-center mb-1 tabular">
                          −{dropOff}% drop-off
                        </div>
                      )}
                      <div className="flex items-center gap-3">
                        <div className="w-36 text-xs text-fg truncate">{stage.step}</div>
                        <div className="flex-1 h-7 bg-canvas rounded overflow-hidden border border-muted">
                          <div
                            className="h-full rounded flex items-center justify-end pr-2"
                            style={{
                              width: `${widthPct}%`,
                              backgroundImage:
                                'linear-gradient(to right, var(--color-accent), var(--color-accent-strong, var(--color-accent)))',
                            }}
                          >
                            <span className="text-2xs font-medium tabular text-fg">{stage.value}</span>
                          </div>
                        </div>
                        <div className="w-12 text-right text-xs text-fg-muted tabular">{convRate}%</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Time to First Offer histogram */}
        <Card padding={false}>
          <CardHeader>
            <CardTitle>Time to First Offer</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-56 w-full" />
            ) : histogramBins.length === 0 ? (
              <div className="text-sm text-fg-muted py-8 text-center">No histogram data.</div>
            ) : (
              <svg
                viewBox="0 0 400 250"
                className="w-full"
                preserveAspectRatio="xMidYMid meet"
                role="img"
                aria-label="Histogram of time to first offer, by bucket"
              >
                <title>Time to first offer — distribution across buckets</title>
                {histogramBins.map((bin) => {
                  const i = histogramBins.indexOf(bin);
                  const barW = 50;
                  const gap = 20;
                  const x = 40 + i * (barW + gap);
                  const barH = (bin.count / maxHistVal) * 180;
                  const y = 200 - barH;
                  return (
                    <g key={bin.bucket}>
                      <rect x={x} y={y} width={barW} height={barH} rx="4" fill="var(--color-accent)" opacity="0.85" />
                      <text x={x + barW / 2} y={y - 6} textAnchor="middle" fill="var(--color-fg)" fontSize="11" className="tabular">
                        {bin.count}
                      </text>
                      <text x={x + barW / 2} y={222} textAnchor="middle" fill="var(--color-fg-subtle)" fontSize="10">
                        {bin.bucket}
                      </text>
                    </g>
                  );
                })}
              </svg>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Category Fill Rate */}
      <Card padding={false}>
        <CardHeader>
          <CardTitle>Category Fill Rate</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-muted">
                <th className="text-left py-2 text-2xs uppercase tracking-wider text-fg-subtle font-medium">Category</th>
                <th className="text-left py-2 text-2xs uppercase tracking-wider text-fg-subtle font-medium">Demands</th>
                <th className="text-left py-2 text-2xs uppercase tracking-wider text-fg-subtle font-medium">Fill Rate</th>
                <th className="text-left py-2 text-2xs uppercase tracking-wider text-fg-subtle font-medium w-64">Distribution</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={4} className="py-4"><Skeleton className="h-16" /></td>
                </tr>
              ) : categories.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-8 text-center text-sm text-fg-muted">No category data.</td>
                </tr>
              ) : (
                categories.map((cat) => {
                  const pct = Math.round(cat.fillRate || 0);
                  const color = fillColor(pct);
                  return (
                    <tr key={cat.categoryId} className="border-b border-muted/60">
                      <td className="py-2 text-sm text-fg">{cat.categoryName}</td>
                      <td className="py-2 text-sm text-fg tabular">{cat.demandCount}</td>
                      <td className="py-2 font-medium tabular" style={{ color }}>{pct}%</td>
                      <td className="py-2">
                        <div className="w-full h-4 bg-canvas rounded overflow-hidden border border-muted">
                          <div className="h-full rounded" style={{ width: `${pct}%`, backgroundColor: color }} />
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </PageContainer>
  );
}
