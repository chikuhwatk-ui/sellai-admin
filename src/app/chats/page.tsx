'use client';

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function ChatsLandingPage() {
  const [chatId, setChatId] = useState('');
  const [reason, setReason] = useState('');
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const trimmed = chatId.trim();
    const trimmedReason = reason.trim();
    if (!trimmed) { setError('Chat ID is required.'); return; }
    if (trimmedReason.length < 3) { setError('Access reason must be at least 3 characters — it is logged for compliance.'); return; }
    router.push(`/chats/${encodeURIComponent(trimmed)}?reason=${encodeURIComponent(trimmedReason)}`);
  };

  return (
    <div className="p-8 max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-fg">Chat Inspector</h1>
        <p className="text-sm text-fg-muted mt-1">
          Decrypt and view a buyer–seller chat thread for compliance, dispute resolution, or fraud review.
        </p>
      </div>

      {/* Audit notice */}
      <div className="bg-info-bg border border-info/30 rounded-xl p-4 flex items-start gap-3">
        <svg className="w-5 h-5 text-info shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <div className="text-sm">
          <p className="text-fg font-medium mb-1">Every access is logged</p>
          <p className="text-fg-muted">
            Decrypting messages writes an entry to the admin audit log with your account, timestamp, IP address, and the reason you provide.
            Other admins with audit-log access can review who has read which chat.
            <Link href="/chats/audit-log" className="text-info hover:underline ml-1">View audit log →</Link>
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="bg-panel border border-muted rounded-xl p-6 space-y-5">
        <div>
          <label htmlFor="chatId" className="block text-xs font-medium text-fg-muted uppercase tracking-wider mb-2">
            Chat ID
          </label>
          <input
            id="chatId"
            type="text"
            value={chatId}
            onChange={(e) => { setChatId(e.target.value); setError(null); }}
            placeholder="e.g. cmt7r6b9k0001..."
            className="w-full bg-canvas border border-muted rounded-lg px-4 py-2.5 text-sm text-fg font-mono focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
            autoFocus
          />
          <p className="text-xs text-fg-muted mt-1">
            Find chat IDs on the dispute, user, or order page that references this conversation.
          </p>
        </div>

        <div>
          <label htmlFor="reason" className="block text-xs font-medium text-fg-muted uppercase tracking-wider mb-2">
            Reason for access <span className="text-danger">*</span>
          </label>
          <textarea
            id="reason"
            value={reason}
            onChange={(e) => { setReason(e.target.value); setError(null); }}
            placeholder="e.g. Dispute #DS-2031 — buyer claims seller refused refund"
            rows={3}
            className="w-full bg-canvas border border-muted rounded-lg px-4 py-2.5 text-sm text-fg focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent resize-none"
          />
          <p className="text-xs text-fg-muted mt-1">
            Minimum 3 characters. Will be visible to other admins reviewing the audit log.
          </p>
        </div>

        {error && (
          <div className="bg-danger-bg border border-danger/30 text-danger rounded-lg px-4 py-2.5 text-sm">
            {error}
          </div>
        )}

        <button
          type="submit"
          className="bg-accent hover:bg-accent-hover text-accent-fg font-medium px-5 py-2.5 rounded-lg text-sm transition-colors"
        >
          Decrypt &amp; view thread
        </button>
      </form>
    </div>
  );
}
