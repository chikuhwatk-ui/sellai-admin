'use client';

import { useApi } from '@/hooks/useApi';
import { api } from '@/lib/api';
import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';

const TYPE_COLORS: Record<string, string> = {
  ASSET: '#3B82F6',
  LIABILITY: '#F59E0B',
  EQUITY: '#8B5CF6',
  REVENUE: '#10B981',
  EXPENSE: '#EF4444',
};

const TYPE_ORDER = ['ASSET', 'LIABILITY', 'EQUITY', 'REVENUE', 'EXPENSE'];

export default function AccountsPage() {
  const { data: accounts, loading, refetch } = useApi<any[]>('/api/admin/accounting/accounts');
  const { hasPermission } = useAuth();
  const [seeding, setSeeding] = useState(false);

  const handleSeed = async () => {
    setSeeding(true);
    try {
      const result = await api.post<any>('/api/admin/accounting/seed');
      alert(`Seeded: ${result.created} created, ${result.existing} already existed`);
      refetch();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSeeding(false);
    }
  };

  const accountList = Array.isArray(accounts) ? accounts : [];

  // Group by type
  const grouped = TYPE_ORDER.map((type) => ({
    type,
    accounts: accountList.filter((a: any) => a.type === type),
  })).filter((g) => g.accounts.length > 0);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Chart of Accounts</h1>
          <p className="text-sm text-[#6B7280] mt-1">IFRS-compliant account structure</p>
        </div>
        {hasPermission('FINANCE_MANAGE') && accountList.length === 0 && (
          <button
            onClick={handleSeed}
            disabled={seeding}
            className="px-4 py-2 bg-[#10B981] text-white text-sm font-medium rounded-lg hover:bg-[#059669] disabled:opacity-50"
          >
            {seeding ? 'Seeding...' : 'Seed Default Accounts'}
          </button>
        )}
      </div>

      {loading ? (
        <div className="text-center py-12 text-[#6B7280]">Loading...</div>
      ) : accountList.length === 0 ? (
        <div className="bg-[#1A1D27] border border-[#2A2D37] rounded-xl p-12 text-center">
          <p className="text-[#6B7280] mb-4">No accounts found. Seed the chart of accounts to get started.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {grouped.map((group) => (
            <div key={group.type} className="bg-[#1A1D27] border border-[#2A2D37] rounded-xl overflow-hidden">
              <div className="px-6 py-3 border-b border-[#2A2D37] flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: TYPE_COLORS[group.type] }} />
                <h2 className="text-sm font-semibold text-white">{group.type}</h2>
                <span className="text-xs text-[#6B7280]">({group.accounts.length} accounts)</span>
              </div>
              <table className="w-full">
                <thead>
                  <tr className="border-b border-[#2A2D37]/50">
                    <th className="text-left text-xs font-medium text-[#6B7280] uppercase tracking-wider px-6 py-3">Code</th>
                    <th className="text-left text-xs font-medium text-[#6B7280] uppercase tracking-wider px-6 py-3">Name</th>
                    <th className="text-left text-xs font-medium text-[#6B7280] uppercase tracking-wider px-6 py-3">Normal Balance</th>
                    <th className="text-left text-xs font-medium text-[#6B7280] uppercase tracking-wider px-6 py-3">Description</th>
                  </tr>
                </thead>
                <tbody>
                  {group.accounts.map((acct: any) => (
                    <tr key={acct.id} className="border-b border-[#2A2D37]/30 hover:bg-[#1A1D27]/50">
                      <td className="px-6 py-3 font-mono text-sm text-[#10B981] font-medium">{acct.code}</td>
                      <td className="px-6 py-3 text-sm text-white">{acct.name}</td>
                      <td className="px-6 py-3">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                          acct.normalBalance === 'DEBIT' ? 'bg-[#3B82F6]/15 text-[#3B82F6]' : 'bg-[#10B981]/15 text-[#10B981]'
                        }`}>
                          {acct.normalBalance}
                        </span>
                      </td>
                      <td className="px-6 py-3 text-xs text-[#6B7280]">{acct.description || '--'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
