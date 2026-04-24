'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { useApi } from '@/hooks/useApi';
import { useAuth } from '@/hooks/useAuth';
import { api } from '@/lib/api';
import { confirmDialog } from '@/components/ui/ConfirmDialog';

export default function CommunicationsPage() {
  const { hasPermission } = useAuth();
  const canBroadcast = hasPermission('COMMUNICATIONS_BROADCAST');
  const canManageTemplates = hasPermission('COMMUNICATIONS_TEMPLATES');
  const [selectedSegment, setSelectedSegment] = useState('all');
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [tab, setTab] = useState<'compose' | 'history' | 'templates' | 'system'>('compose');
  const [sending, setSending] = useState(false);
  const [historyPage, setHistoryPage] = useState(1);

  // New template form
  const [newTemplateName, setNewTemplateName] = useState('');
  const [newTemplateBody, setNewTemplateBody] = useState('');
  const [showNewTemplate, setShowNewTemplate] = useState(false);

  // System messages state
  const [sysMode, setSysMode] = useState<'individual' | 'segment'>('segment');
  const [sysSegment, setSysSegment] = useState('all');
  const [sysRecipientId, setSysRecipientId] = useState('');
  const [sysTitle, setSysTitle] = useState('');
  const [sysBody, setSysBody] = useState('');
  const [sysImageUrl, setSysImageUrl] = useState('');
  const [sysActionUrl, setSysActionUrl] = useState('');
  const [sysSending, setSysSending] = useState(false);
  const [sysHistoryPage, setSysHistoryPage] = useState(1);
  const [userSearch, setUserSearch] = useState('');
  const [userResults, setUserResults] = useState<any[]>([]);
  const [searchingUsers, setSearchingUsers] = useState(false);

  const { data: segmentsData } = useApi<any>('/api/admin/communications/segments');
  const { data: historyData, refetch: refetchHistory } = useApi<any>(
    tab === 'history' ? `/api/admin/communications/history?page=${historyPage}&limit=10` : null
  );
  const { data: templatesData, refetch: refetchTemplates } = useApi<any>(
    tab === 'templates' ? '/api/admin/communications/templates' : null
  );
  const { data: sysHistoryData, refetch: refetchSysHistory } = useApi<any>(
    tab === 'system' ? `/api/admin/communications/system-messages?page=${sysHistoryPage}&limit=10` : null
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
      toast.error('Please fill in both title and message body.');
      return;
    }

    setSending(true);
    try {
      await api.post('/api/admin/communications/broadcast', {
        title: title.trim(),
        body: body.trim(),
        segment: selectedSegment,
      });
      toast.success('Broadcast sent.');
      setTitle('');
      setBody('');
    } catch (err: any) {
      toast.error(`Failed to send: ${err?.message || 'Unknown error'}`);
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
      toast.success('Template saved.');
      setNewTemplateName('');
      setNewTemplateBody('');
      setShowNewTemplate(false);
      refetchTemplates();
    } catch (err: any) {
      toast.error(`Failed to create template: ${err?.message || 'Unknown error'}`);
    }
  };

  const handleDeleteTemplate = async (id: string) => {
    const ok = await confirmDialog({
      title: 'Delete this template?',
      body: 'Agents and admins who had it bookmarked will lose it.',
      confirmLabel: 'Delete',
      destructive: true,
    });
    if (!ok) return;
    try {
      await api.delete(`/api/admin/communications/templates/${id}`);
      toast.success('Template deleted.');
      refetchTemplates();
    } catch (err: any) {
      toast.error(`Failed to delete: ${err?.message || 'Unknown error'}`);
    }
  };

  // ── System Messages ──

  const handleSearchUsers = async () => {
    if (!userSearch.trim()) return;
    setSearchingUsers(true);
    try {
      const res: any = await api.get(`/api/admin/users?search=${encodeURIComponent(userSearch.trim())}&limit=5`);
      setUserResults(res.data || []);
    } catch { setUserResults([]); }
    finally { setSearchingUsers(false); }
  };

  const handleSendSystemMessage = async () => {
    if (!sysTitle.trim() || !sysBody.trim()) {
      toast.error('Please fill in both title and message.');
      return;
    }
    if (sysMode === 'individual' && !sysRecipientId) {
      toast.error('Please select a recipient user.');
      return;
    }

    setSysSending(true);
    try {
      const payload = {
        title: sysTitle.trim(),
        body: sysBody.trim(),
        ...(sysImageUrl.trim() && { imageUrl: sysImageUrl.trim() }),
        ...(sysActionUrl.trim() && { actionUrl: sysActionUrl.trim() }),
      };

      if (sysMode === 'individual') {
        await api.post('/api/admin/communications/system-message', { ...payload, recipientId: sysRecipientId });
        toast.success('System message sent to user.');
      } else {
        await api.post('/api/admin/communications/system-message/segment', { ...payload, segment: sysSegment });
        toast.success('System message sent to segment.');
      }
      setSysTitle(''); setSysBody(''); setSysImageUrl(''); setSysActionUrl('');
      setSysRecipientId(''); setUserSearch(''); setUserResults([]);
      refetchSysHistory();
    } catch (err: any) {
      toast.error(`Failed: ${err?.message || 'Unknown error'}`);
    } finally {
      setSysSending(false);
    }
  };

  const sysHistory = sysHistoryData?.data || [];
  const sysHistoryTotal = sysHistoryData?.total || 0;
  const sysHistoryTotalPages = sysHistoryData?.totalPages || 1;

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold text-white mb-1">Communications</h1>
      <p className="text-[#6B7280] mb-6">Broadcast notifications and manage messaging</p>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-[#1A1D27] rounded-lg p-1 w-fit">
        {([
          { key: 'compose', label: 'Compose' },
          { key: 'system', label: 'System Messages' },
          { key: 'history', label: 'History' },
          { key: 'templates', label: 'Templates' },
        ] as const).map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              tab === t.key ? 'bg-[#10B981] text-white' : 'text-[#6B7280] hover:text-white'
            }`}
          >
            {t.label}
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

            <div className="flex gap-3 items-center">
              <button
                onClick={handleSend}
                disabled={sending || !canBroadcast}
                className={`px-6 py-3 font-semibold rounded-lg transition-colors ${
                  !canBroadcast
                    ? 'bg-[#2A2D37] text-[#6B7280] cursor-not-allowed'
                    : sending
                      ? 'bg-[#10B981]/40 text-white/60 cursor-wait'
                      : 'bg-[#10B981] hover:bg-[#059669] text-white'
                }`}
                title={!canBroadcast ? 'You do not have permission to send broadcasts' : undefined}
              >
                {!canBroadcast ? 'No Permission' : sending ? 'Sending...' : 'Send Now'}
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

      {tab === 'system' && (
        <div className="space-y-6">
          {/* Mode Toggle */}
          <div className="flex gap-2 items-center">
            <button
              onClick={() => setSysMode('segment')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                sysMode === 'segment' ? 'bg-[#6366F1] text-white' : 'bg-[#1A1D27] text-[#6B7280] hover:text-white border border-[#2A2D37]'
              }`}
            >
              Send to Segment
            </button>
            <button
              onClick={() => setSysMode('individual')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                sysMode === 'individual' ? 'bg-[#6366F1] text-white' : 'bg-[#1A1D27] text-[#6B7280] hover:text-white border border-[#2A2D37]'
              }`}
            >
              Send to User
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Compose Form */}
            <div className="lg:col-span-2 bg-[#1A1D27] border border-[#2A2D37] rounded-xl p-6">
              <h2 className="text-lg font-semibold text-white mb-1">New System Message</h2>
              <p className="text-xs text-[#6B7280] mb-4">
                Appears in users&apos; chat list as a message from &quot;Sellai&quot; — like WhatsApp system updates.
              </p>

              {/* Segment Selector (segment mode) */}
              {sysMode === 'segment' && (
                <div className="mb-4">
                  <label className="block text-sm text-[#6B7280] mb-2">Target Segment</label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {SEGMENTS.map((seg: any) => (
                      <button
                        key={seg.id}
                        onClick={() => setSysSegment(seg.id)}
                        className={`p-3 rounded-lg border text-left transition-all ${
                          sysSegment === seg.id
                            ? 'border-[#6366F1] bg-[#6366F1]/10'
                            : 'border-[#2A2D37] hover:border-[#3A3D47]'
                        }`}
                      >
                        <div className={`text-sm font-medium ${sysSegment === seg.id ? 'text-[#6366F1]' : 'text-white'}`}>
                          {seg.label}
                        </div>
                        <div className="text-xs text-[#6B7280]">{Number(seg.count || 0).toLocaleString()} users</div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* User Search (individual mode) */}
              {sysMode === 'individual' && (
                <div className="mb-4">
                  <label className="block text-sm text-[#6B7280] mb-2">Recipient</label>
                  {sysRecipientId ? (
                    <div className="flex items-center gap-2 bg-[#6366F1]/10 border border-[#6366F1]/30 rounded-lg px-4 py-3">
                      <div className="w-8 h-8 rounded-full bg-[#6366F1]/20 flex items-center justify-center text-[#6366F1] text-xs font-bold">
                        {(userResults.find((u: any) => u.id === sysRecipientId)?.name || '?')[0]?.toUpperCase()}
                      </div>
                      <div className="flex-1">
                        <div className="text-sm text-white font-medium">
                          {userResults.find((u: any) => u.id === sysRecipientId)?.name || 'User'}
                        </div>
                        <div className="text-xs text-[#6B7280]">
                          {userResults.find((u: any) => u.id === sysRecipientId)?.phoneNumber || sysRecipientId}
                        </div>
                      </div>
                      <button onClick={() => { setSysRecipientId(''); setUserResults([]); setUserSearch(''); }} className="text-xs text-[#EF4444] hover:text-[#DC2626]">
                        Remove
                      </button>
                    </div>
                  ) : (
                    <>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={userSearch}
                          onChange={(e) => setUserSearch(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && handleSearchUsers()}
                          placeholder="Search by name or phone..."
                          className="flex-1 bg-[#0F1117] border border-[#2A2D37] rounded-lg px-4 py-2.5 text-white text-sm placeholder-[#4B5563] focus:outline-none focus:border-[#6366F1]"
                        />
                        <button
                          onClick={handleSearchUsers}
                          disabled={searchingUsers}
                          className="px-4 py-2.5 bg-[#6366F1] text-white text-sm rounded-lg hover:bg-[#4F46E5] disabled:opacity-50"
                        >
                          {searchingUsers ? '...' : 'Search'}
                        </button>
                      </div>
                      {userResults.length > 0 && (
                        <div className="mt-2 bg-[#0F1117] border border-[#2A2D37] rounded-lg overflow-hidden">
                          {userResults.map((u: any) => (
                            <button
                              key={u.id}
                              onClick={() => setSysRecipientId(u.id)}
                              className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-[#1A1D27] text-left border-b border-[#2A2D37]/50 last:border-0"
                            >
                              <div className="w-7 h-7 rounded-full bg-[#6366F1]/20 flex items-center justify-center text-[#6366F1] text-xs font-bold">
                                {(u.name || '?')[0]?.toUpperCase()}
                              </div>
                              <div>
                                <div className="text-sm text-white">{u.name || 'No name'}</div>
                                <div className="text-xs text-[#6B7280]">{u.phoneNumber} · {u.role}</div>
                              </div>
                            </button>
                          ))}
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}

              <div className="mb-4">
                <label className="block text-sm text-[#6B7280] mb-2">Title</label>
                <input
                  type="text"
                  value={sysTitle}
                  onChange={(e) => setSysTitle(e.target.value)}
                  placeholder="e.g., New Feature Available!"
                  className="w-full bg-[#0F1117] border border-[#2A2D37] rounded-lg px-4 py-3 text-white placeholder-[#4B5563] focus:outline-none focus:border-[#6366F1] transition-colors"
                />
              </div>

              <div className="mb-4">
                <label className="block text-sm text-[#6B7280] mb-2">Message</label>
                <textarea
                  value={sysBody}
                  onChange={(e) => setSysBody(e.target.value)}
                  placeholder="Write your message to users..."
                  rows={4}
                  className="w-full bg-[#0F1117] border border-[#2A2D37] rounded-lg px-4 py-3 text-white placeholder-[#4B5563] focus:outline-none focus:border-[#6366F1] transition-colors resize-none"
                />
                <div className="text-xs text-[#6B7280] mt-1">{sysBody.length}/1000 characters</div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm text-[#6B7280] mb-2">Image URL <span className="text-[#4B5563]">(optional)</span></label>
                  <input
                    type="text"
                    value={sysImageUrl}
                    onChange={(e) => setSysImageUrl(e.target.value)}
                    placeholder="https://..."
                    className="w-full bg-[#0F1117] border border-[#2A2D37] rounded-lg px-4 py-2.5 text-white text-sm placeholder-[#4B5563] focus:outline-none focus:border-[#6366F1]"
                  />
                </div>
                <div>
                  <label className="block text-sm text-[#6B7280] mb-2">Action Deep Link <span className="text-[#4B5563]">(optional)</span></label>
                  <input
                    type="text"
                    value={sysActionUrl}
                    onChange={(e) => setSysActionUrl(e.target.value)}
                    placeholder="sellai://wallet"
                    className="w-full bg-[#0F1117] border border-[#2A2D37] rounded-lg px-4 py-2.5 text-white text-sm placeholder-[#4B5563] focus:outline-none focus:border-[#6366F1]"
                  />
                </div>
              </div>

              <button
                onClick={handleSendSystemMessage}
                disabled={sysSending || !canBroadcast}
                className={`px-6 py-3 font-semibold rounded-lg transition-colors ${
                  !canBroadcast
                    ? 'bg-[#2A2D37] text-[#6B7280] cursor-not-allowed'
                    : sysSending
                      ? 'bg-[#6366F1]/40 text-white/60 cursor-wait'
                      : 'bg-[#6366F1] hover:bg-[#4F46E5] text-white'
                }`}
              >
                {!canBroadcast ? 'No Permission' : sysSending ? 'Sending...' : 'Send System Message'}
              </button>
            </div>

            {/* Preview */}
            <div className="bg-[#1A1D27] border border-[#2A2D37] rounded-xl p-6">
              <h2 className="text-lg font-semibold text-white mb-4">Chat Preview</h2>
              <div className="bg-[#0F1117] rounded-xl overflow-hidden border border-[#2A2D37]">
                {/* Chat header */}
                <div className="flex items-center gap-3 px-4 py-3 border-b border-[#2A2D37]">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#6366F1] to-[#A78BFA] flex items-center justify-center text-white text-sm font-bold">S</div>
                  <div>
                    <div className="text-sm font-semibold text-white">Sellai</div>
                    <div className="text-xs text-[#6B7280]">System</div>
                  </div>
                </div>
                {/* Message bubble */}
                <div className="p-4 space-y-2">
                  {sysImageUrl && (
                    <div className="w-full h-32 bg-[#2A2D37] rounded-lg flex items-center justify-center text-xs text-[#6B7280]">Image</div>
                  )}
                  <div className="bg-[#6366F1]/10 border border-[#6366F1]/20 rounded-lg p-3">
                    <div className="text-sm font-semibold text-white mb-1">{sysTitle || 'Message Title'}</div>
                    <div className="text-sm text-[#9CA3AF]">{sysBody || 'Your message will appear here...'}</div>
                  </div>
                  <div className="text-xs text-[#4B5563] text-right">Just now</div>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-[#2A2D37]">
                <div className="text-sm text-[#6B7280] mb-2">Delivery</div>
                {sysMode === 'individual' ? (
                  <div className="text-sm text-white">{sysRecipientId ? '1 user' : 'No user selected'}</div>
                ) : (
                  <>
                    <div className="text-2xl font-bold text-white">
                      {Number(SEGMENTS.find((s: any) => s.id === sysSegment)?.count || 0).toLocaleString()}
                    </div>
                    <div className="text-xs text-[#6B7280]">recipients</div>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* System Message History */}
          <div className="bg-[#1A1D27] border border-[#2A2D37] rounded-xl overflow-hidden">
            <div className="px-6 py-4 border-b border-[#2A2D37]">
              <h3 className="text-sm font-semibold text-white">Broadcast History</h3>
            </div>
            <table className="w-full">
              <thead>
                <tr className="border-b border-[#2A2D37]">
                  <th className="text-left text-xs font-medium text-[#6B7280] uppercase tracking-wider px-6 py-3">Message</th>
                  <th className="text-left text-xs font-medium text-[#6B7280] uppercase tracking-wider px-6 py-3">Segment</th>
                  <th className="text-left text-xs font-medium text-[#6B7280] uppercase tracking-wider px-6 py-3">Recipients</th>
                  <th className="text-left text-xs font-medium text-[#6B7280] uppercase tracking-wider px-6 py-3">Sent By</th>
                  <th className="text-left text-xs font-medium text-[#6B7280] uppercase tracking-wider px-6 py-3">Date</th>
                </tr>
              </thead>
              <tbody>
                {sysHistory.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-sm text-[#6B7280]">
                      No system messages sent yet. Compose your first message above.
                    </td>
                  </tr>
                ) : (
                  sysHistory.map((b: any) => (
                    <tr key={b.id} className="border-b border-[#2A2D37]/50 hover:bg-[#1A1D27]/50">
                      <td className="px-6 py-3">
                        <div className="text-sm font-medium text-white">{b.title}</div>
                        <div className="text-xs text-[#6B7280] truncate max-w-[250px]">{b.body}</div>
                      </td>
                      <td className="px-6 py-3 text-sm text-[#9CA3AF] capitalize">{b.segment}</td>
                      <td className="px-6 py-3 text-sm text-white">{Number(b.recipientCount || 0).toLocaleString()}</td>
                      <td className="px-6 py-3 text-sm text-[#9CA3AF]">{b.sentByName || 'Admin'}</td>
                      <td className="px-6 py-3 text-sm text-[#6B7280]">
                        {b.createdAt ? new Date(b.createdAt).toLocaleString('en', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : '--'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
            {sysHistoryTotalPages > 1 && (
              <div className="flex items-center justify-center gap-2 px-6 py-3 border-t border-[#2A2D37]">
                <button
                  onClick={() => setSysHistoryPage(p => Math.max(1, p - 1))}
                  disabled={sysHistoryPage === 1}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium bg-[#2A2D37]/50 text-[#6B7280] hover:bg-[#2A2D37] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  Prev
                </button>
                <span className="text-xs text-[#6B7280]">Page {sysHistoryPage} of {sysHistoryTotalPages}</span>
                <button
                  onClick={() => setSysHistoryPage(p => Math.min(sysHistoryTotalPages, p + 1))}
                  disabled={sysHistoryPage >= sysHistoryTotalPages}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium bg-[#2A2D37]/50 text-[#6B7280] hover:bg-[#2A2D37] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  Next
                </button>
              </div>
            )}
          </div>
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
