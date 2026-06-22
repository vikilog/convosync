import React, { useEffect, useRef, useState } from 'react';
import { Bot, RefreshCw, Send } from 'lucide-react';
import { api } from '../../lib/api';
import { mapAgentFromApi } from '../../lib/mappers';

type ChatMessage = {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  tokensUsed?: number;
  fromCache?: boolean;
  intent?: string;
  costInr?: number;
};

function formatTokenCount(value: number): string {
  return new Intl.NumberFormat('en-IN').format(value);
}

function formatCostInr(value: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

type Props = {
  agentId: string;
  avatarUrl?: string | null;
};

type BotAvatarProps = {
  avatarUrl?: string | null;
  size?: 'sm' | 'lg';
  alt?: string;
};

const BotAvatar: React.FC<BotAvatarProps> = ({ avatarUrl, size = 'sm', alt = 'Agent' }) => {
  const dim = size === 'lg' ? 'w-20 h-20' : 'w-7 h-7';
  const iconDim = size === 'lg' ? 'w-10 h-10' : 'w-4 h-4';

  if (avatarUrl) {
    return (
      <img
        src={avatarUrl}
        alt={alt}
        className={`${dim} rounded-full object-cover border border-[#E5E7EB] shrink-0 bg-white`}
      />
    );
  }

  if (size === 'lg') {
    return (
      <div
        className={`${dim} rounded-full bg-gradient-to-br from-[#0284c7] via-[#a78bfa] to-[#c4b5fd] shadow-lg shadow-[#0284c7]/20 flex items-center justify-center shrink-0`}
      >
        <Bot className={`${iconDim} text-white`} />
      </div>
    );
  }

  return (
    <div
      className={`${dim} rounded-full bg-[#F3F0FF] text-sky-600 flex items-center justify-center shrink-0 border border-[#E5E7EB]`}
    >
      <Bot className={iconDim} />
    </div>
  );
};

type ChatApiResponse = {
  reply: string;
  conversationId: string;
  fromCache: boolean;
  tokensUsed: number;
  costInr: number;
  intent: string;
  stage: string;
  billingMode?: 'convosync' | 'byok';
};

export const ChatPreviewPanel: React.FC<Props> = ({ agentId, avatarUrl: avatarUrlProp }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fetchedAvatarUrl, setFetchedAvatarUrl] = useState<string | null>(null);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [lastMeta, setLastMeta] = useState<{
    intent: string;
    tokensUsed: number;
    costInr: number;
    fromCache: boolean;
    billingMode?: 'convosync' | 'byok';
  } | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const avatarUrl = avatarUrlProp !== undefined ? avatarUrlProp : fetchedAvatarUrl;

  const sessionTokens = messages.reduce(
    (sum, msg) => sum + (msg.role === 'assistant' ? (msg.tokensUsed ?? 0) : 0),
    0
  );

  useEffect(() => {
    if (avatarUrlProp !== undefined) return;
    let cancelled = false;
    void api.getAgent(agentId).then((raw) => {
      if (cancelled) return;
      const agent = mapAgentFromApi(raw as Record<string, unknown>);
      setFetchedAvatarUrl(agent.avatarUrl ?? null);
    });
    return () => {
      cancelled = true;
    };
  }, [agentId, avatarUrlProp]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, loading, error, lastMeta]);

  const handleRestart = () => {
    setConversationId(null);
    setMessages([]);
    setInput('');
    setError(null);
    setLoading(false);
    setLastMeta(null);
    inputRef.current?.focus();
  };

  const sendMessage = async () => {
    const text = input.trim();
    if (!text || loading) return;

    const userMessage: ChatMessage = {
      role: 'user',
      content: text,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setError(null);
    setLoading(true);

    try {
      const res = (await api.chatAgent(agentId, {
        message: text,
        conversationId: conversationId ?? undefined,
        channel: 'preview',
      })) as { success?: boolean; data?: ChatApiResponse };

      const data = res.data ?? (res as unknown as ChatApiResponse);

      setConversationId(data.conversationId);
      setLastMeta({
        intent: data.intent,
        tokensUsed: data.tokensUsed,
        costInr: data.costInr,
        fromCache: data.fromCache,
        billingMode: data.billingMode,
      });

      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: data.reply,
          timestamp: new Date(),
          tokensUsed: typeof data.tokensUsed === 'number' ? data.tokensUsed : undefined,
          fromCache: data.fromCache,
          intent: data.intent,
          costInr: data.costInr,
        },
      ]);
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      void sendMessage();
    }
  };

  const isEmpty = messages.length === 0 && !loading && !error;

  return (
    <aside className="w-full xl:w-[320px] shrink-0 border border-[#E5E7EB] rounded-xl bg-white flex flex-col h-[420px] sm:h-[520px] xl:sticky xl:top-6">
      <div className="flex items-center justify-between gap-2 px-4 py-3 border-b border-[#E5E7EB] shrink-0">
        <div className="min-w-0">
          <h4 className="text-sm font-bold text-[#111827]">Preview</h4>
          {sessionTokens > 0 ? (
            <p className="mt-0.5 text-[11px] font-medium text-slate-500 tabular-nums">
              Session: {formatTokenCount(sessionTokens)} tokens
            </p>
          ) : null}
        </div>
        <button
          type="button"
          onClick={handleRestart}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-sky-600 hover:text-[#5a52e0] transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Restart
        </button>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3 bg-gradient-to-b from-[#F3F0FF]/30 to-white">
        {isEmpty && (
          <div className="h-full flex flex-col items-center justify-center text-center px-4">
            <BotAvatar avatarUrl={avatarUrl} size="lg" />
            <p className="text-sm font-medium text-[#6B7280] mt-4">Let&apos;s get started</p>
          </div>
        )}

        {messages.map((msg, idx) =>
          msg.role === 'user' ? (
            <div key={idx} className="flex justify-end">
              <div className="max-w-[85%] rounded-2xl rounded-br-md bg-[#1E1B2E] text-white px-3 py-2 text-sm">
                {msg.content}
              </div>
            </div>
          ) : (
            <div key={idx} className="flex items-end gap-2">
              <BotAvatar avatarUrl={avatarUrl} size="sm" />
              <div className="max-w-[85%]">
                <div className="rounded-2xl rounded-bl-md bg-white border border-[#E5E7EB] text-[#111827] px-3 py-2 text-sm">
                  {msg.content}
                </div>
                {msg.tokensUsed != null && msg.tokensUsed > 0 ? (
                  <p className="mt-1 pl-1 text-[10px] font-medium text-slate-400 tabular-nums">
                    {formatTokenCount(msg.tokensUsed)} tokens
                    {msg.fromCache ? ' · cache' : ''}
                  </p>
                ) : null}
              </div>
            </div>
          )
        )}

        {loading && (
          <div className="flex items-end gap-2">
            <BotAvatar avatarUrl={avatarUrl} size="sm" />
            <div className="rounded-2xl rounded-bl-md bg-white border border-[#E5E7EB] px-4 py-3 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-[#6B7280] animate-bounce [animation-delay:0ms]" />
              <span className="w-1.5 h-1.5 rounded-full bg-[#6B7280] animate-bounce [animation-delay:150ms]" />
              <span className="w-1.5 h-1.5 rounded-full bg-[#6B7280] animate-bounce [animation-delay:300ms]" />
            </div>
          </div>
        )}

        {error && (
          <p className="text-xs font-medium text-red-600 text-center px-2">{error}</p>
        )}
      </div>

      {lastMeta ? (
        <div className="px-3 py-1.5 border-t border-[#E5E7EB] bg-[#F8FAFC] shrink-0">
          <p className="text-[10px] text-slate-500 tabular-nums truncate">
            Intent: {lastMeta.intent} | Tokens: {formatTokenCount(lastMeta.tokensUsed)} | Cost:{' '}
            {formatCostInr(lastMeta.costInr)} | Cache: {lastMeta.fromCache ? '✓' : '—'}
            {lastMeta.billingMode === 'byok' ? ' | BYOK' : ''}
          </p>
        </div>
      ) : null}

      <div className="p-3 border-t border-[#E5E7EB] shrink-0">
        <div className="flex items-center gap-2 bg-[#F8FAFC] border border-[#E5E7EB] rounded-xl px-3 py-2">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={loading}
            placeholder="Experience the Conversation"
            className="flex-1 bg-transparent text-sm text-[#111827] placeholder:text-[#6B7280] outline-none disabled:opacity-60"
          />
          <button
            type="button"
            onClick={() => void sendMessage()}
            disabled={loading || !input.trim()}
            className="w-8 h-8 rounded-lg bg-sky-600 text-white flex items-center justify-center hover:bg-sky-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
};
