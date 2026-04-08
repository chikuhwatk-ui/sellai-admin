'use client';

import { useState } from 'react';
import { useApi } from '@/hooks/useApi';
import { api } from '@/lib/api';

export default function CommunicationsPage() {
  const [selectedSegment, setSelectedSegment] = useState('all');
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [tab, setTab] = useState<'compose' | 'history' | 'templates'>('compose');
  const [sendStatus, setSendStatus] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [historyPage, setHistoryPage] = useState(1);

  // New template form
  const [newTemplateName, setNewTemplateName] = useState('');
  const [newTemplateBody, setNewTemplateBody] = useState('');
  const [showNewTemplate, setShowNewTemplate] = useState(false);

  const { data: segmentsData } = useApi<any>('/api/admin/communications/segments');
  const { data: historyData, refetch: refetchHistory } = useApi<any>(
    tab === 'history' ? `/api/admin/communications/history?page=${historyPage}&limit=10` : null
  );
  const { data: templatesData, refetch: refetchTemplates } = useApi<any>(
    tab === 'templates' ? '/api/admin/communications/templates' : null
  );

  const SEGMENTS = Array.isArray(segmentsData) && segmentsData.length > 0
    ? segmentsData
    : [
        { id: 'all', label: 'All Users', count: 0 },
        { id: 'buyers', label: 'Buyers Only', count: 0 },
        { id: 'sellers', label: 'Sellers Only', count: 0 },
        { id: 'runners', label: 'Runners Only', count: 0 },
        { id: 'inactive', label: 'Inactive (30d+)', count: 0 },
        { id: 'unverified', label: 'Unverified Users', count: 0 },
      ];

  const templates = Array.isArray(templatesData) ? templatesData : [];
  const history = historyData?.data || [];
  const historyTotal = historyData?.total || 0;
  const historyTotalPages = Math.ceil(historyTotal / 10);

  const handleSend = async () => {
    if (!title.trim() || !body.trim()) {
      setSendStatus('error');
      setTimeout(() => setSendStatus(null), 3000);
      return;
    }

    setSending(true);
    try {
      await api.post('/api/admin/communications/broadcast', {
        title: title.trim(),
        body: body.trim(),
        segment: selectedSegment,
      });
      setSendStatus('Broadcast sent successfully!');
      setTitle('');
      setBody('');
      setTimeout(() => setSendStatus(null), 4000);
    } catch (err: any) {
      setSendStatus(`Failed to send: ${err.message || 'Unknown error'}`);
      setTimeout(() => setSendStatus(null), 5000);
    } finally {
      setSending(false);
    }
  };

  const handleCreateTemplate = async () => {
    if (!newTemplateName.trim() || !newTemplateBody.trim()) return;
    try {
      await api.post('/api/admin/communications/templates', {
        name: newTemplateName.trim(),
        body: newTemplateBody.trim(),
      });
      setNewTemplateName('');
      setNewTemplateBody('');
      setShowNewTemplate(false);
      refetchTemplates();
    } catch (err: any) {
      alert(`Failed to create template: ${err.message}`);
    }
  };

  const handleDeleteTemplate = async (id: string) => {
    if (!confirm('Delete this template?')) return;
    try {
      await api.delete(`/api/admin/communications/templates/${id}`);
      refetchTemplates();
    } catch (err: any) {
      alert(`Failed to delete: ${err.message}`);
    }
  };

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold text-white mb-1">Communications</h1>
      <p className="text-[#6B7280] mb-6">Broadcast notifications and manage messaging</p>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-[#1A1D27] rounded-lg p-1 w-fit">
        {(['compose', 'history', 'templates'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              tab === t ? 'bg-[#10B981] text-white' : 'text-[#6B7280] hover:text-white'
            }`}
          >
            {t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      {tab === 'compose' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Compose Form */}
          <div className="lg:col-span-2 bg-[#1A1D27] border border-[#2A2D37] rounded-xl p-6">
            <h2 className="text-lg font-semibold text-white mb-4">New Broadcast</h2>

            <div className="mb-4">
              <label className="block text-sm text-[#6B7280] mb-2">Target Segment</label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {SEGMENTS.map((seg: any) => (
                  <button
                    key={seg.id}
                    onClick={() => setSelectedSegment(seg.id)}
                    className={`p-3 rounded-lg border text-left transition-all ${
                      selectedSegment === seg.id
                        ? 'border-[#10B981] bg-[#10B981]/10'
                        : 'border-[#2A2D37] hover:border-[#3A3D47]'
                    }`}
                  >
                    <div className={`text-sm font-medium ${selectedSegment === seg.id ? 'text-[#10B981]' : 'text-white'}`}>
                      {seg.label}
                    </div>
                    <div className="text-xs text-[#6B7280]">{Number(seg.count || 0).toLocaleString()} users</div>
                  </button>
                ))}
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-sm text-[#6B7280] mb-2">Notification Title</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter notification title..."
                className="w-full bg-[#0F1117] border border-[#2A2D37] rounded-lg px-4 py-3 text-white placeholder-[#4B5563] focus:outline-none focus:border-[#10B981] transition-colors"
              />
            </div>

            <div className="mb-4">
              <label className="block text-sm text-[#6B7280] mb-2">Message Body</label>
              <textarea
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder="Enter notification message..."
                rows={4}
                className="w-full bg-[#0F1117] border border-[#2A2D37] rounded-lg px-4 py-3 text-white placeholder-[#4B5563] focus:outline-none focus:border-[#10B981] transition-colors resize-none"
              />
              <div className="text-xs text-[#6B7280] mt-1">{body.length}/500 characters</div>
            </div>

            {sendStatus && (
              <div className={`mb-3 text-sm px-4 py-2 rounded-lg ${
                sendStatus === 'error'
                  ? 'bg-[#EF4444]/10 text-[#EF4444]'
                  : sendStatus.startsWith('Failed')
                    ? 'bg-[#EF4444]/10 text-[#EF4444]'
                    : 'bg-[#10B981]/10 text-[#10B981]'
              }`}>
                {sendStatus === 'error' ? 'Please fill in both title and message body' : sendStatus}
              </div>
            )}
            <div className="flex gap-3 items-center">
              <button
                onClick={handleSend}
                disabled={sending}
                className={`px-6 py-3 font-semibold rounded-lg transition-colors ${
                  sending
                    ? 'bg-[#10B981]/40 text-white/60 cursor-wait'
                    : 'bg-[#10B981] hover:bg-[#059669] text-white'
                }`}
              >
                {sending ? 'Sending...' : 'Send Now'}
              </button>
            </div>
          </div>

          {/* Preview */}
          <div className="bg-[#1A1D27] border border-[#2A2D37] rounded-xl p-6">
            <h2 className="text-lg font-semibold text-white mb-4">Preview</h2>
            <div className="bg-[#0F1117] rounded-xl p-4 border border-[#2A2D37]">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-lg bg-[#10B981]/20 flex items-center justify-center text-[#10B981] text-xs font-bold">S</div>
                <div>
                  <div className="text-xs text-[#6B7280]">Sellai</div>
                  <div className="text-xs text-[#4B5563]">now</div>
                </div>
              </div>
              <div className="text-sm font-semibold text-white mb-1">{title || 'Notification Title'}</div>
              <div className="text-sm text-[#9CA3AF]">{body || 'Notification message will appear here...'}</div>
            </div>

            <div className="mt-4 pt-4 border-t border-[#2A2D37]">
              <div className="text-sm text-[#6B7280] mb-2">Delivery Estimate</div>
              <div className="text-2xl font-bold text-white">
                {Number(SEGMENTS.find((s: any) => s.id === selectedSegment)?.count || 0).toLocaleString()}
              </div>
              <div className="text-xs text-[#6B7280]">recipients</div>
            </div>
          </div>
        </div>
      )}

      {tab === 'history' && (
        <div className="bg-[#1A1D27] border border-[#2A2D37] rounded-xl overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#2A2D37]">
                <th className="text-left text-xs font-medium text-[#6B7280] uppercase tracking-wider px-6 py-4">Campaign</th>
                <th className="text-left text-xs font-medium text-[#6B7280] uppercase tracking-wider px-6 py-4">Segment</th>
                <th className="text-left text-xs font-medium text-[#6B7280] uppercase tracking-wider px-6 py-4">Recipients</th>
                <th className="text-left text-xs font-medium text-[#6B7280] uppercase tracking-wider px-6 py-4">Sent By</th>
                <th className="text-left text-xs font-medium text-[#6B7280] uppercase tracking-wider px-6 py-4">Status</th>
                <th className="text-left text-xs font-medium text-[#6B7280] uppercase tracking-wider px-6 py-4">Date</th>
              </tr>
            </thead>
            <tbody>
              {history.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-sm text-[#6B7280]">
                    No campaigns sent yet. Compose your first broadcast above.
                  </td>
                </tr>
              ) : (
                history.map((b: any) => (
                  <tr key={b.id} className="border-b border-[#2A2D37]/50 hover:bg-[#1A1D27]/50">
                    <td className="px-6 py-3">
                      <div className="text-sm font-medium text-white">{b.title}</div>
                      <div className="text-xs text-[#6B7280] truncate max-w-[200px]">{b.body}</div>
                    </td>
                    <td className="px-6 py-3 text-sm text-[#9CA3AF] capitalize">{b.segment}</td>
                    <td className="px-6 py-3 text-sm text-white">{Number(b.recipientCount || 0).toLocaleString()}</td>
                    <td className="px-6 py-3 text-sm text-[#9CA3AF]">{b.sentByName || 'Admin'}</td>
                    <td className="px-6 py-3">
                      <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                        b.status === 'SENT' ? 'bg-[#10B981]/15 text-[#10B981]' :
                        b.status === 'FAILED' ? 'bg-[#EF4444]/15 text-[#EF4444]' :
                        'bg-[#F59E0B]/15 text-[#F59E0B]'
                      }`}>
                        {b.status}
                      </span>
                    </td>
                    <td className="px-6 py-3 text-sm text-[#6B7280]">
                      {b.sentAt ? new Date(b.sentAt).toLocaleString('en', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : '--'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
          {historyTotalPages > 1 && (
            <div className="flex items-center justify-center gap-2 px-6 py-3 border-t border-[#2A2D37]">
              <button
                onClick={() => setHistoryPage(p => Math.max(1, p - 1))}
                disabled={historyPage === 1}
                className="px-3 py-1.5 rounded-lg text-xs font-medium bg-[#2A2D37]/50 text-[#6B7280] hover:bg-[#2A2D37] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                Prev
              </button>
              <span className="text-xs text-[#6B7280]">Page {historyPage} of {historyTotalPages}</span>
              <button
                onClick={() => setHistoryPage(p => Math.min(historyTotalPages, p + 1))}
                disabled={historyPage >= historyTotalPages}
                className="px-3 py-1.5 rounded-lg text-xs font-medium bg-[#2A2D37]/50 text-[#6B7280] hover:bg-[#2A2D37] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                Next
              </button>
            </div>
          )}
        </div>
      )}

      {tab === 'templates' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {templates.map((t: any) => (
            <div key={t.id} className="bg-[#1A1D27] border border-[#2A2D37] rounded-xl p-5 hover:border-[#3A3D47] transition-colors">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-white">{t.name}</h3>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => { setTitle(t.name); setBody(t.body); setTab('compose'); }}
                    className="text-xs text-[#10B981] hover:text-[#059669] font-medium"
                  >
                    Use →
                  </button>
                  <button
                    onClick={() => handleDeleteTemplate(t.id)}
                    className="text-xs text-[#EF4444] hover:text-[#DC2626] font-medium"
                  >
                    Delete
                  </button>
                </div>
              </div>
              <p className="text-sm text-[#9CA3AF]">{t.body}</p>
            </div>
          ))}

          {/* New Template Form / Button */}
          {showNewTemplate ? (
            <div className="bg-[#1A1D27] border border-[#10B981]/30 rounded-xl p-5">
              <h3 className="text-sm font-semibold text-white mb-3">New Template</h3>
              <input
                type="text"
                value={newTemplateName}
                onChange={(e) => setNewTemplateName(e.target.value)}
                placeholder="Template name..."
                className="w-full bg-[#0F1117] border border-[#2A2D37] rounded-lg px-3 py-2 text-white text-sm placeholder-[#4B5563] focus:outline-none focus:border-[#10B981] mb-2"
              />
              <textarea
                value={newTemplateBody}
                onChange={(e) => setNewTemplateBody(e.target.value)}
                placeholder="Template message..."
                rows={3}
                className="w-full bg-[#0F1117] border border-[#2A2D37] rounded-lg px-3 py-2 text-white text-sm placeholder-[#4B5563] focus:outline-none focus:border-[#10B981] resize-none mb-3"
              />
              <div className="flex gap-2">
                <button
                  onClick={handleCreateTemplate}
                  className="px-4 py-2 bg-[#10B981] text-white text-xs font-medium rounded-lg hover:bg-[#059669]"
                >
                  Save
                </button>
                <button
                  onClick={() => { setShowNewTemplate(false); setNewTemplateName(''); setNewTemplateBody(''); }}
                  className="px-4 py-2 bg-[#2A2D37] text-[#6B7280] text-xs font-medium rounded-lg hover:text-white"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setShowNewTemplate(true)}
              className="bg-[#1A1D27] border border-dashed border-[#2A2D37] rounded-xl p-5 flex items-center justify-center hover:border-[#10B981]/50 transition-colors cursor-pointer"
            >
              <div className="text-center">
                <div className="text-2xl text-[#6B7280] mb-1">+</div>
                <div className="text-sm text-[#6B7280]">Create Template</div>
              </div>
            </button>
          )}
        </div>
      )}
    </div>
  );
}
