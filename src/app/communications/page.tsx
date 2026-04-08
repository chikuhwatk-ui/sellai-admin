'use client';

import { useState } from 'react';

const SEGMENTS = [
  { id: 'all', label: 'All Users', count: 5247 },
  { id: 'buyers', label: 'Buyers Only', count: 3120 },
  { id: 'sellers', label: 'Sellers Only', count: 1450 },
  { id: 'runners', label: 'Runners Only', count: 677 },
  { id: 'inactive', label: 'Inactive (30d+)', count: 842 },
  { id: 'unverified', label: 'Unverified Users', count: 1203 },
];

const TEMPLATES = [
  { id: 1, name: 'Welcome Back', body: "We miss you! There are new demands in your area. Open Sellai to check them out." },
  { id: 2, name: 'New Feature', body: "Exciting update! You can now track deliveries in real-time with PIN verification." },
  { id: 3, name: 'Credit Promo', body: "Limited offer: Get 20% bonus credits on all bundle purchases this weekend!" },
  { id: 4, name: 'Verification Reminder', body: "Complete your verification to start sending offers. It only takes 2 minutes!" },
];

const HISTORY = [
  { id: 1, title: 'Weekend Credit Promo', segment: 'Sellers Only', sent: 1450, delivered: 1380, opened: 620, date: '2026-04-05' },
  { id: 2, title: 'New Delivery Feature', segment: 'All Users', sent: 5100, delivered: 4890, opened: 2100, date: '2026-04-03' },
  { id: 3, title: 'Re-engagement', segment: 'Inactive (30d+)', sent: 842, delivered: 790, opened: 185, date: '2026-04-01' },
  { id: 4, title: 'Verification Push', segment: 'Unverified Users', sent: 1203, delivered: 1150, opened: 430, date: '2026-03-28' },
];

export default function CommunicationsPage() {
  const [selectedSegment, setSelectedSegment] = useState('all');
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [tab, setTab] = useState<'compose' | 'history' | 'templates'>('compose');

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
                {SEGMENTS.map((seg) => (
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
                    <div className="text-xs text-[#6B7280]">{seg.count.toLocaleString()} users</div>
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

            <div className="flex gap-3">
              <button className="px-6 py-3 bg-[#10B981] text-white font-semibold rounded-lg hover:bg-[#059669] transition-colors">
                Send Now
              </button>
              <button className="px-6 py-3 bg-[#1A1D27] border border-[#2A2D37] text-white rounded-lg hover:bg-[#2A2D37] transition-colors">
                Schedule
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
                {SEGMENTS.find(s => s.id === selectedSegment)?.count.toLocaleString()}
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
                <th className="text-left text-xs font-medium text-[#6B7280] uppercase tracking-wider px-6 py-4">Sent</th>
                <th className="text-left text-xs font-medium text-[#6B7280] uppercase tracking-wider px-6 py-4">Delivered</th>
                <th className="text-left text-xs font-medium text-[#6B7280] uppercase tracking-wider px-6 py-4">Opened</th>
                <th className="text-left text-xs font-medium text-[#6B7280] uppercase tracking-wider px-6 py-4">Open Rate</th>
                <th className="text-left text-xs font-medium text-[#6B7280] uppercase tracking-wider px-6 py-4">Date</th>
              </tr>
            </thead>
            <tbody>
              {HISTORY.map((h) => (
                <tr key={h.id} className="border-b border-[#2A2D37]/50 hover:bg-[#2A2D37]/30 transition-colors">
                  <td className="px-6 py-4 text-sm font-medium text-white">{h.title}</td>
                  <td className="px-6 py-4 text-sm text-[#9CA3AF]">{h.segment}</td>
                  <td className="px-6 py-4 text-sm text-[#9CA3AF]">{h.sent.toLocaleString()}</td>
                  <td className="px-6 py-4 text-sm text-[#9CA3AF]">{h.delivered.toLocaleString()}</td>
                  <td className="px-6 py-4 text-sm text-[#9CA3AF]">{h.opened.toLocaleString()}</td>
                  <td className="px-6 py-4">
                    <span className={`text-sm font-medium ${
                      (h.opened / h.delivered) > 0.3 ? 'text-[#10B981]' : (h.opened / h.delivered) > 0.2 ? 'text-[#F59E0B]' : 'text-[#EF4444]'
                    }`}>
                      {((h.opened / h.delivered) * 100).toFixed(1)}%
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-[#6B7280]">{h.date}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === 'templates' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {TEMPLATES.map((t) => (
            <div key={t.id} className="bg-[#1A1D27] border border-[#2A2D37] rounded-xl p-5 hover:border-[#3A3D47] transition-colors">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-white">{t.name}</h3>
                <button
                  onClick={() => { setTitle(t.name); setBody(t.body); setTab('compose'); }}
                  className="text-xs text-[#10B981] hover:text-[#059669] font-medium"
                >
                  Use Template →
                </button>
              </div>
              <p className="text-sm text-[#9CA3AF]">{t.body}</p>
            </div>
          ))}
          <div className="bg-[#1A1D27] border border-dashed border-[#2A2D37] rounded-xl p-5 flex items-center justify-center hover:border-[#10B981]/50 transition-colors cursor-pointer">
            <div className="text-center">
              <div className="text-2xl text-[#6B7280] mb-1">+</div>
              <div className="text-sm text-[#6B7280]">Create Template</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
