'use client';

import { useApi } from '@/hooks/useApi';
import { api } from '@/lib/api';
import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Card } from '@/components/ui/Card';

interface ThresholdStatus {
  currentRevenue: number;
  threshold: number;
  percentageProgress: number | null;
  isThresholdReached: boolean;
  estimatedCrossingDate: string | null;
}

interface VATProjection {
  projectedVAT: number;
  vatRate: number;
  totalRevenue: number;
  period: { startDate: string; endDate: string };
}

interface TaxConfig {
  id: string;
  name: string;
  rate: number;
  threshold: number;
  isActive: boolean;
  effectiveFrom: string | null;
}

function formatCurrency(amount: number, currency: string = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
  }).format(amount);
}

function getMonthRange(): { start: string; end: string } {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  return {
    start: start.toISOString().split('T')[0],
    end: end.toISOString().split('T')[0],
  };
}

export default function TaxPage() {
  const { hasPermission } = useAuth();
  const defaultRange = getMonthRange();

  const [startDate, setStartDate] = useState(defaultRange.start);
  const [endDate, setEndDate] = useState(defaultRange.end);
  const [projectionQuery, setProjectionQuery] = useState(
    `/api/admin/accounting/tax/projection?start=${defaultRange.start}&end=${defaultRange.end}`
  );
  const [configForm, setConfigForm] = useState<TaxConfig | null>(null);
  const [savingConfig, setSavingConfig] = useState(false);

  const { data: threshold, loading: thresholdLoading } = useApi<ThresholdStatus>(
    '/api/admin/accounting/tax/threshold-status'
  );
  const { data: projection, loading: projectionLoading } = useApi<VATProjection>(projectionQuery);
  const { data: taxConfig, loading: configLoading, refetch: refetchConfig } = useApi<TaxConfig>(
    '/api/admin/accounting/tax/config'
  );

  useEffect(() => {
    if (taxConfig && !configForm) {
      setConfigForm({ ...taxConfig });
    }
  }, [taxConfig, configForm]);

  const handleProjectionSearch = () => {
    setProjectionQuery(
      `/api/admin/accounting/tax/projection?start=${startDate}&end=${endDate}`
    );
  };

  const handleSaveConfig = async () => {
    if (!configForm) return;
    setSavingConfig(true);
    try {
      await api.patch('/api/admin/accounting/tax/config', {
        name: configForm.name,
        rate: configForm.rate,
        threshold: configForm.threshold,
        isActive: configForm.isActive,
        effectiveFrom: configForm.effectiveFrom,
      });
      refetchConfig();
    } catch (err: any) {
      alert(err.message || 'Failed to save tax config');
    } finally {
      setSavingConfig(false);
    }
  };

  const thresholdPct = threshold?.percentageProgress != null ? Math.min(threshold.percentageProgress, 100) : 0;

  return (
    <div className="p-6 space-y-6">
      {/* Status Banner */}
      <div className="bg-[#F59E0B]/10 border border-[#F59E0B]/20 rounded-xl px-6 py-4 flex items-center gap-3">
        <svg className="w-5 h-5 text-[#F59E0B] shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
        <div>
          <p className="text-sm font-medium text-[#F59E0B]">Pre-Threshold</p>
          <p className="text-xs text-[#D97706]">
            VAT tracking is in monitoring mode. No active VAT posting.
          </p>
        </div>
      </div>

      <div>
        <h1 className="text-2xl font-bold text-white">Tax Tracking</h1>
        <p className="text-sm text-[#6B7280] mt-1">ZIMRA threshold monitoring and VAT projections</p>
      </div>

      {/* Threshold Progress */}
      <Card>
        <h2 className="text-sm font-semibold text-white mb-4">ZIMRA Threshold Progress</h2>
        {thresholdLoading ? (
          <div className="animate-pulse space-y-3">
            <div className="h-6 bg-[#2A2D37] rounded w-1/3" />
            <div className="h-4 bg-[#2A2D37] rounded-full" />
            <div className="h-4 bg-[#2A2D37] rounded w-1/2" />
          </div>
        ) : threshold ? (
          <div className="space-y-4">
            <div className="flex items-end justify-between">
              <div>
                <span className="text-3xl font-bold text-white">{thresholdPct.toFixed(1)}%</span>
                <span className="text-sm text-[#6B7280] ml-2">of threshold</span>
              </div>
              <div className="text-right">
                <p className="text-sm text-[#6B7280]">
                  {formatCurrency(threshold.currentRevenue)} / {formatCurrency(threshold.threshold)}
                </p>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="relative h-4 bg-[#2A2D37] rounded-full overflow-hidden">
              <div
                className="absolute inset-y-0 left-0 rounded-full transition-all duration-500"
                style={{
                  width: `${thresholdPct}%`,
                  background: thresholdPct >= 90
                    ? 'linear-gradient(90deg, #F59E0B, #EF4444)'
                    : thresholdPct >= 70
                    ? 'linear-gradient(90deg, #10B981, #F59E0B)'
                    : '#10B981',
                }}
              />
            </div>

            <div className="flex items-center justify-between text-xs text-[#6B7280]">
              <span>$0</span>
              <span>{formatCurrency(threshold.threshold)}</span>
            </div>

            {threshold.estimatedCrossingDate && (
              <div className="bg-[#0F1117] rounded-lg px-4 py-3 flex items-center gap-2">
                <svg className="w-4 h-4 text-[#F59E0B]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <span className="text-sm text-[#9CA3AF]">
                  Estimated threshold crossing: <span className="text-white font-medium">
                    {new Date(threshold.estimatedCrossingDate).toLocaleDateString('en-US', {
                      year: 'numeric', month: 'long', day: 'numeric',
                    })}
                  </span>
                </span>
              </div>
            )}
          </div>
        ) : (
          <p className="text-[#6B7280] text-sm">Unable to load threshold data</p>
        )}
      </Card>

      {/* VAT Projection */}
      <Card>
        <h2 className="text-sm font-semibold text-white mb-4">VAT Projection</h2>
        <div className="flex flex-col sm:flex-row items-end gap-3 mb-6">
          <div className="flex-1 w-full">
            <label className="text-xs text-[#6B7280] uppercase tracking-wider mb-1 block">Start Date</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full bg-[#0F1117] border border-[#2A2D37] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#10B981] [color-scheme:dark]"
            />
          </div>
          <div className="flex-1 w-full">
            <label className="text-xs text-[#6B7280] uppercase tracking-wider mb-1 block">End Date</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full bg-[#0F1117] border border-[#2A2D37] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#10B981] [color-scheme:dark]"
            />
          </div>
          <button
            onClick={handleProjectionSearch}
            className="px-4 py-2 bg-[#10B981] text-white text-sm font-medium rounded-lg hover:bg-[#059669] transition-colors whitespace-nowrap"
          >
            Calculate
          </button>
        </div>

        {projectionLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="bg-[#0F1117] rounded-lg p-4 animate-pulse h-20" />
            ))}
          </div>
        ) : projection ? (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-[#0F1117] rounded-lg p-4">
              <span className="text-xs text-[#6B7280] uppercase tracking-wider">Projected VAT</span>
              <p className="text-xl font-bold text-[#10B981] mt-1">
                {formatCurrency(projection.projectedVAT)}
              </p>
            </div>
            <div className="bg-[#0F1117] rounded-lg p-4">
              <span className="text-xs text-[#6B7280] uppercase tracking-wider">VAT Rate</span>
              <p className="text-xl font-bold text-white mt-1">{(projection.vatRate * 100).toFixed(1)}%</p>
            </div>
            <div className="bg-[#0F1117] rounded-lg p-4">
              <span className="text-xs text-[#6B7280] uppercase tracking-wider">Total Revenue (Period)</span>
              <p className="text-xl font-bold text-white mt-1">
                {formatCurrency(projection.totalRevenue)}
              </p>
            </div>
          </div>
        ) : (
          <p className="text-[#6B7280] text-sm">Select a date range and click Calculate</p>
        )}
      </Card>

      {/* Tax Configuration */}
      {hasPermission('FINANCE_MANAGE') && (
        <Card>
          <h2 className="text-sm font-semibold text-white mb-4">Tax Configuration</h2>
          {configLoading ? (
            <div className="animate-pulse space-y-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-10 bg-[#2A2D37] rounded" />
              ))}
            </div>
          ) : configForm ? (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-[#6B7280] uppercase tracking-wider mb-1 block">Tax Name</label>
                  <input
                    type="text"
                    value={configForm.name}
                    onChange={(e) => setConfigForm({ ...configForm, name: e.target.value })}
                    className="w-full bg-[#0F1117] border border-[#2A2D37] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#10B981]"
                  />
                </div>
                <div>
                  <label className="text-xs text-[#6B7280] uppercase tracking-wider mb-1 block">Rate (%)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    max="100"
                    value={configForm.rate * 100}
                    onChange={(e) => setConfigForm({ ...configForm, rate: (parseFloat(e.target.value) || 0) / 100 })}
                    className="w-full bg-[#0F1117] border border-[#2A2D37] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#10B981]"
                  />
                </div>
                <div>
                  <label className="text-xs text-[#6B7280] uppercase tracking-wider mb-1 block">Threshold Amount</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={configForm.threshold}
                    onChange={(e) => setConfigForm({ ...configForm, threshold: parseFloat(e.target.value) || 0 })}
                    className="w-full bg-[#0F1117] border border-[#2A2D37] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#10B981]"
                  />
                </div>
                <div>
                  <label className="text-xs text-[#6B7280] uppercase tracking-wider mb-1 block">Effective From</label>
                  <input
                    type="date"
                    value={configForm.effectiveFrom || ''}
                    onChange={(e) => setConfigForm({ ...configForm, effectiveFrom: e.target.value || null })}
                    className="w-full bg-[#0F1117] border border-[#2A2D37] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#10B981] [color-scheme:dark]"
                  />
                </div>
              </div>

              {/* Active Toggle */}
              <div className="bg-[#0F1117] rounded-lg px-4 py-3">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-sm text-white font-medium">Active</span>
                    <p className="text-xs text-[#6B7280] mt-0.5">
                      Activate when ZIMRA threshold is reached
                    </p>
                  </div>
                  <button
                    disabled
                    className="relative inline-flex h-6 w-11 items-center rounded-full transition-colors cursor-not-allowed opacity-60"
                    style={{ backgroundColor: configForm.isActive ? '#10B981' : '#2A2D37' }}
                  >
                    <span
                      className="inline-block h-4 w-4 rounded-full bg-white transition-transform"
                      style={{ transform: configForm.isActive ? 'translateX(22px)' : 'translateX(4px)' }}
                    />
                  </button>
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  onClick={handleSaveConfig}
                  disabled={savingConfig}
                  className="px-5 py-2 bg-[#10B981] text-white text-sm font-medium rounded-lg hover:bg-[#059669] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {savingConfig ? 'Saving...' : 'Save Configuration'}
                </button>
              </div>
            </div>
          ) : (
            <p className="text-[#6B7280] text-sm">Unable to load tax configuration</p>
          )}
        </Card>
      )}
    </div>
  );
}
