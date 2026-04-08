'use client';

import { useState } from 'react';
import { useApi } from '@/hooks/useApi';
import { useAuth } from '@/hooks/useAuth';
import { api } from '@/lib/api';

const EXPENSE_ACCOUNTS = [
  { code: '5000', name: 'Payment Gateway Fees' },
  { code: '5100', name: 'Hosting & Infrastructure' },
  { code: '5200', name: 'Salaries & Wages' },
  { code: '5300', name: 'Rent & Utilities' },
  { code: '5400', name: 'Marketing & Advertising' },
  { code: '5500', name: 'Professional Services' },
  { code: '5600', name: 'Depreciation & Amortization' },
  { code: '5900', name: 'General & Administrative' },
];

export default function ExpensesPage() {
  const { hasPermission } = useAuth();
  const [page, setPage] = useState(1);
  const { data, loading, refetch } = useApi<any>(`/api/admin/accounting/expenses?page=${page}`);
  const expenses = data?.data || [];
  const totalPages = data?.totalPages || 1;

  const [form, setForm] = useState({ date: new Date().toISOString().split('T')[0], accountCode: '5100', amount: '', description: '', vendor: '', reference: '' });
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.amount || !form.description) return;
    setSubmitting(true);
    try {
      await api.post('/api/admin/accounting/expenses', {
        date: form.date,
        accountCode: form.accountCode,
        amount: parseFloat(form.amount),
        description: form.description,
        vendor: form.vendor || undefined,
        reference: form.reference || undefined,
      });
      setForm({ ...form, amount: '', description: '', vendor: '', reference: '' });
      refetch();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Expense Tracking</h1>
        <p className="text-sm text-[#6B7280] mt-1">Record operational expenses with automatic journal entries</p>
      </div>

      {/* Expense Form */}
      {hasPermission('FINANCE_MANAGE') && (
        <form onSubmit={handleSubmit} className="bg-[#1A1D27] border border-[#10B981]/30 rounded-xl p-6">
          <h2 className="text-sm font-semibold text-white mb-4">Record New Expense</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs text-[#6B7280] mb-1">Date</label>
              <input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })}
                className="w-full px-3 py-2 bg-[#0F1117] border border-[#2A2D37] rounded-lg text-sm text-white focus:outline-none focus:border-[#10B981]" />
            </div>
            <div>
              <label className="block text-xs text-[#6B7280] mb-1">Category</label>
              <select value={form.accountCode} onChange={(e) => setForm({ ...form, accountCode: e.target.value })}
                className="w-full px-3 py-2 bg-[#0F1117] border border-[#2A2D37] rounded-lg text-sm text-white focus:outline-none focus:border-[#10B981]">
                {EXPENSE_ACCOUNTS.map((a) => <option key={a.code} value={a.code}>{a.code} - {a.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs text-[#6B7280] mb-1">Amount (USD)</label>
              <input type="number" step="0.01" min="0.01" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })}
                placeholder="0.00"
                className="w-full px-3 py-2 bg-[#0F1117] border border-[#2A2D37] rounded-lg text-sm text-white placeholder-[#4B5563] focus:outline-none focus:border-[#10B981]" />
            </div>
            <div className="md:col-span-2">
              <label className="block text-xs text-[#6B7280] mb-1">Description</label>
              <input type="text" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="What was this expense for?"
                className="w-full px-3 py-2 bg-[#0F1117] border border-[#2A2D37] rounded-lg text-sm text-white placeholder-[#4B5563] focus:outline-none focus:border-[#10B981]" />
            </div>
            <div>
              <label className="block text-xs text-[#6B7280] mb-1">Vendor (optional)</label>
              <input type="text" value={form.vendor} onChange={(e) => setForm({ ...form, vendor: e.target.value })}
                placeholder="e.g. Railway, Google"
                className="w-full px-3 py-2 bg-[#0F1117] border border-[#2A2D37] rounded-lg text-sm text-white placeholder-[#4B5563] focus:outline-none focus:border-[#10B981]" />
            </div>
            <div>
              <label className="block text-xs text-[#6B7280] mb-1">Reference (optional)</label>
              <input type="text" value={form.reference} onChange={(e) => setForm({ ...form, reference: e.target.value })}
                placeholder="Invoice # or receipt ID"
                className="w-full px-3 py-2 bg-[#0F1117] border border-[#2A2D37] rounded-lg text-sm text-white placeholder-[#4B5563] focus:outline-none focus:border-[#10B981]" />
            </div>
            <div className="flex items-end">
              <button type="submit" disabled={submitting || !form.amount || !form.description}
                className="px-6 py-2 bg-[#10B981] text-white text-sm font-medium rounded-lg hover:bg-[#059669] disabled:opacity-50">
                {submitting ? 'Recording...' : 'Record Expense'}
              </button>
            </div>
          </div>
        </form>
      )}

      {/* Expenses Table */}
      {loading ? (
        <div className="text-center py-12 text-[#6B7280]">Loading...</div>
      ) : (
        <div className="bg-[#1A1D27] border border-[#2A2D37] rounded-xl overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#2A2D37]">
                <th className="text-left text-xs font-medium text-[#6B7280] uppercase px-6 py-4">Date</th>
                <th className="text-left text-xs font-medium text-[#6B7280] uppercase px-4 py-4">Category</th>
                <th className="text-left text-xs font-medium text-[#6B7280] uppercase px-4 py-4">Description</th>
                <th className="text-left text-xs font-medium text-[#6B7280] uppercase px-4 py-4">Vendor</th>
                <th className="text-right text-xs font-medium text-[#6B7280] uppercase px-6 py-4">Amount</th>
              </tr>
            </thead>
            <tbody>
              {expenses.length === 0 ? (
                <tr><td colSpan={5} className="px-6 py-12 text-center text-sm text-[#6B7280]">No expenses recorded</td></tr>
              ) : (
                expenses.map((exp: any) => (
                  <tr key={exp.id} className="border-b border-[#2A2D37]/50 hover:bg-[#1A1D27]/50">
                    <td className="px-6 py-3 text-xs text-[#6B7280]">
                      {new Date(exp.date).toLocaleDateString('en', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-mono text-xs text-[#10B981]">{exp.accountCode}</span>
                      <span className="text-xs text-[#6B7280] ml-1">
                        {EXPENSE_ACCOUNTS.find((a) => a.code === exp.accountCode)?.name || ''}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-white">{exp.description}</td>
                    <td className="px-4 py-3 text-sm text-[#6B7280]">{exp.vendor || '--'}</td>
                    <td className="px-6 py-3 text-sm text-right font-medium text-[#EF4444]">${Number(exp.amount).toFixed(2)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}
            className="px-3 py-1.5 rounded-lg text-xs font-medium bg-[#2A2D37]/50 text-[#6B7280] hover:bg-[#2A2D37] disabled:opacity-40">Prev</button>
          <span className="text-xs text-[#6B7280]">Page {page} of {totalPages}</span>
          <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page >= totalPages}
            className="px-3 py-1.5 rounded-lg text-xs font-medium bg-[#2A2D37]/50 text-[#6B7280] hover:bg-[#2A2D37] disabled:opacity-40">Next</button>
        </div>
      )}
    </div>
  );
}
