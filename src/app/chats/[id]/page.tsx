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
          <Link href="/chats" className="text-xs text-[#6B7280] hover:text-white">← Back to Chat Inspector</Link>
          <h1 className="text-2xl font-bold text-white mt-1">Chat thread</h1>
          <p className="text-xs text-[#6B7280] mt-1 font-mono">{id}</p>
        </div>
        <Link
          href="/chats/audit-log"
          className="text-xs text-[#3B82F6] hover:underline"
        >
          View access log →
        </Link>
      </div>

      {/* Reason form (visible if no data yet, or to re-fetch) */}
      {!data && (
        <div className="bg-[#1A1D27] border border-[#2A2D37] rounded-xl p-6 space-y-4">
          <p className="text-sm text-white">Provide a reason to decrypt this chat. Your access will be logged.</p>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="e.g. Dispute #DS-2031 — fraud investigation"
            rows={3}
            className="w-full bg-[#0F1117] border border-[#2A2D37] rounded-lg px-4 py-2.5 text-sm text-white focus:border-[#10B981] focus:outline-none focus:ring-1 focus:ring-[#10B981] resize-none"
          />
          {error && (
            <div className="bg-[#EF4444]/10 border border-[#EF4444]/30 text-[#EF4444] rounded-lg px-4 py-2.5 text-sm">
              {error}
            </div>
          )}
          <div className="flex gap-3">
            <button
              onClick={() => loadThread(reason)}
              disabled={loading}
              className="bg-[#10B981] hover:bg-[#059669] disabled:opacity-50 text-white font-medium px-5 py-2.5 rounded-lg text-sm transition-colors"
            >
              {loading ? 'Decrypting…' : 'Decrypt thread'}
            </button>
            <button
              onClick={() => router.push('/chats')}
              className="text-[#6B7280] hover:text-white text-sm"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {data && (
        <>
          {/* Header card with parties + audit note */}
          <div className="bg-[#1A1D27] border border-[#2A2D37] rounded-xl p-5 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <div className="text-xs text-[#6B7280] uppercase tracking-wider">Buyer</div>
              <div className="text-sm text-white font-medium mt-1">{buyerName}</div>
              {data.chat.buyer?.id && (
                <Link href={`/users/${data.chat.buyer.id}`} className="text-[10px] text-[#3B82F6] hover:underline mt-1 inline-block">
                  Open user →
                </Link>
              )}
            </div>
            <div>
              <div className="text-xs text-[#6B7280] uppercase tracking-wider">Seller</div>
              <div className="text-sm text-white font-medium mt-1">{sellerName}</div>
              {data.chat.seller?.id && (
                <Link href={`/users/${data.chat.seller.id}`} className="text-[10px] text-[#3B82F6] hover:underline mt-1 inline-block">
                  Open seller →
                </Link>
              )}
            </div>
            <div className="md:text-right">
              <div className="text-xs text-[#6B7280] uppercase tracking-wider">Messages</div>
              <div className="text-sm text-white font-medium mt-1">{data.messages.length}</div>
            </div>
          </div>

          <div className="bg-[#3B82F6]/10 border border-[#3B82F6]/30 rounded-xl p-4 text-sm text-[#9CA3AF]">
            {data.auditNote}
          </div>

          {/* Thread */}
          <div className="bg-[#1A1D27] border border-[#2A2D37] rounded-xl p-6">
            {data.messages.length === 0 ? (
              <p className="text-sm text-[#6B7280] text-center py-12">No messages in this chat.</p>
            ) : (
              <div className="space-y-3">
                {data.messages.map((m) => {
                  const fromBuyer = m.senderId === data.chat.buyer?.id;
                  return (
                    <div key={m.id} className={`flex ${fromBuyer ? 'justify-start' : 'justify-end'}`}>
                      <div className={`max-w-[70%] rounded-2xl px-4 py-2.5 ${
                        fromBuyer
                          ? 'bg-[#0F1117] border border-[#2A2D37] text-white rounded-bl-sm'
                          : 'bg-[#10B981]/15 border border-[#10B981]/30 text-white rounded-br-sm'
                      }`}>
                        <div className="text-[10px] font-bold uppercase tracking-widest opacity-60 mb-1">
                          {fromBuyer ? buyerName : sellerName}
                          {m.type && m.type !== 'TEXT' && (
                            <span className="ml-2 px-1.5 py-0.5 rounded bg-[#3B82F6]/20 text-[#3B82F6]">{m.type}</span>
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
