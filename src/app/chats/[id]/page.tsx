'use client';

import { useEffect, useState, use } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api';

interface DecryptedMessage {
  id: string;
  senderId: string;
  type?: string;
  content: string;
  createdAt: string;
  isRead?: boolean;
}

interface ChatPartyBuyer { id: string; name?: string | null }
interface ChatPartySeller { id: string; businessName?: string | null }

interface DecryptedThread {
  chat: {
    id: string;
    buyer: ChatPartyBuyer | null;
    seller: ChatPartySeller | null;
  };
  messages: DecryptedMessage[];
  auditNote: string;
}

export default function ChatThreadPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const searchParams = useSearchParams();
  const router = useRouter();
  const initialReason = searchParams?.get('reason') || '';

  const [reason, setReason] = useState(initialReason);
  const [data, setData] = useState<DecryptedThread | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadThread = async (accessReason: string) => {
    if (accessReason.trim().length < 3) {
      setError('Reason must be at least 3 characters.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const result = await api.get<DecryptedThread>(
        `/api/admin/chats/${encodeURIComponent(id)}/messages?reason=${encodeURIComponent(accessReason.trim())}`,
      );
      setData(result);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load chat.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (initialReason && initialReason.trim().length >= 3) {
      loadThread(initialReason);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const buyerName = data?.chat?.buyer?.name || 'Unknown buyer';
  const sellerName = data?.chat?.seller?.businessName || 'Unknown seller';

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Link href="/chats" className="text-xs text-fg-muted hover:text-fg">← Back to Chat Inspector</Link>
          <h1 className="text-2xl font-bold text-fg mt-1">Chat thread</h1>
          <p className="text-xs text-fg-muted mt-1 font-mono">{id}</p>
        </div>
        <Link
          href="/chats/audit-log"
          className="text-xs text-info hover:underline"
        >
          View access log →
        </Link>
      </div>

      {/* Reason form (visible if no data yet, or to re-fetch) */}
      {!data && (
        <div className="bg-panel border border-muted rounded-xl p-6 space-y-4">
          <p className="text-sm text-fg">Provide a reason to decrypt this chat. Your access will be logged.</p>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="e.g. Dispute #DS-2031 — fraud investigation"
            rows={3}
            className="w-full bg-canvas border border-muted rounded-lg px-4 py-2.5 text-sm text-fg focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent resize-none"
          />
          {error && (
            <div className="bg-danger-bg border border-danger/30 text-danger rounded-lg px-4 py-2.5 text-sm">
              {error}
            </div>
          )}
          <div className="flex gap-3">
            <button
              onClick={() => loadThread(reason)}
              disabled={loading}
              className="bg-accent hover:bg-accent-hover disabled:opacity-50 text-accent-fg font-medium px-5 py-2.5 rounded-lg text-sm transition-colors"
            >
              {loading ? 'Decrypting…' : 'Decrypt thread'}
            </button>
            <button
              onClick={() => router.push('/chats')}
              className="text-fg-muted hover:text-fg text-sm"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {data && (
        <>
          {/* Header card with parties + audit note */}
          <div className="bg-panel border border-muted rounded-xl p-5 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <div className="text-xs text-fg-muted uppercase tracking-wider">Buyer</div>
              <div className="text-sm text-fg font-medium mt-1">{buyerName}</div>
              {data.chat.buyer?.id && (
                <Link href={`/users/${data.chat.buyer.id}`} className="text-[10px] text-info hover:underline mt-1 inline-block">
                  Open user →
                </Link>
              )}
            </div>
            <div>
              <div className="text-xs text-fg-muted uppercase tracking-wider">Seller</div>
              <div className="text-sm text-fg font-medium mt-1">{sellerName}</div>
              {data.chat.seller?.id && (
                <Link href={`/users/${data.chat.seller.id}`} className="text-[10px] text-info hover:underline mt-1 inline-block">
                  Open seller →
                </Link>
              )}
            </div>
            <div className="md:text-right">
              <div className="text-xs text-fg-muted uppercase tracking-wider">Messages</div>
              <div className="text-sm text-fg font-medium mt-1">{data.messages.length}</div>
            </div>
          </div>

          <div className="bg-info-bg border border-info/30 rounded-xl p-4 text-sm text-fg-muted">
            {data.auditNote}
          </div>

          {/* Thread */}
          <div className="bg-panel border border-muted rounded-xl p-6">
            {data.messages.length === 0 ? (
              <p className="text-sm text-fg-muted text-center py-12">No messages in this chat.</p>
            ) : (
              <div className="space-y-3">
                {data.messages.map((m) => {
                  const fromBuyer = m.senderId === data.chat.buyer?.id;
                  return (
                    <div key={m.id} className={`flex ${fromBuyer ? 'justify-start' : 'justify-end'}`}>
                      <div className={`max-w-[70%] rounded-2xl px-4 py-2.5 ${
                        fromBuyer
                          ? 'bg-canvas border border-muted text-fg rounded-bl-sm'
                          : 'bg-accent-bg border border-accent/30 text-fg rounded-br-sm'
                      }`}>
                        <div className="text-[10px] font-bold uppercase tracking-widest opacity-60 mb-1">
                          {fromBuyer ? buyerName : sellerName}
                          {m.type && m.type !== 'TEXT' && (
                            <span className="ml-2 px-1.5 py-0.5 rounded bg-info-bg text-info">{m.type}</span>
                          )}
                        </div>
                        <div className="text-sm whitespace-pre-wrap break-words">{m.content || '(empty)'}</div>
                        <div className="text-[10px] opacity-50 mt-1">
                          {new Date(m.createdAt).toLocaleString('en', {
                            day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
                          })}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
