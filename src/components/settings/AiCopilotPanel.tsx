/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  AlertCircle,
  Bot,
  CheckCircle2,
  Loader2,
  MessageSquare,
  Send,
  Sparkles,
} from 'lucide-react';
import { api, getUserId, parseApiError } from '../../lib/api';
import { pathForSettingsSection } from '../../routes';

type ChatMessage = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  intent?: string;
  confidence?: number;
  matchedSections?: string[];
};

type KnowledgeConfig = {
  venueId: string | null;
  hasConnectionString: boolean;
  updatedAt: string | null;
};

type KnowledgeRecord = {
  status: 'pending' | 'syncing' | 'success' | 'failed';
  syncedAt: string | null;
  data: Record<string, unknown>;
};

const QUICK_PROMPTS = [
  'What are your service prices?',
  'Are you open on Sunday?',
  'I want to book a haircut tomorrow',
  'Who is your stylist?',
  'Do you have any offers?',
];

const CHANNELS = [
  { id: 'whatsapp', label: 'WhatsApp' },
  { id: 'instagram', label: 'Instagram' },
  { id: 'messenger', label: 'Messenger' },
  { id: 'web', label: 'Web' },
] as const;

function newId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function formatIntent(intent: string): string {
  return intent.replace(/_/g, ' ');
}

export function AiCopilotPanel() {
  const [loading, setLoading] = useState(true);
  const [venueId, setVenueId] = useState('');
  const [knowledgeStatus, setKnowledgeStatus] = useState<KnowledgeRecord | null>(null);
  const [channel, setChannel] = useState<(typeof CHANNELS)[number]['id']>('whatsapp');
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showDebug, setShowDebug] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const loadSetup = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const cfg = (await api.getAiKnowledgeConfig()) as KnowledgeConfig;
      if (cfg.venueId) {
        setVenueId(cfg.venueId);
        try {
          const record = (await api.getAiKnowledge(cfg.venueId)) as KnowledgeRecord;
          setKnowledgeStatus(record);
        } catch {
          setKnowledgeStatus(null);
        }
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load settings');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadSetup();
  }, [loadSetup]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, sending]);

  const sendMessage = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || sending) return;

    if (!venueId.trim()) {
      setError('Set up Venue ID in AI Knowledge first.');
      return;
    }

    if (knowledgeStatus?.status !== 'success') {
      setError('Sync salon knowledge first (Settings → AI Knowledge).');
      return;
    }

    setError(null);
    setSending(true);
    setInput('');

    const history = messages.map((m) => ({
      role: m.role,
      content: m.content,
    }));

    const userMsg: ChatMessage = { id: newId(), role: 'user', content: trimmed };
    setMessages((prev) => [...prev, userMsg]);

    try {
      const customerId = getUserId() ?? 'copilot_test_user';
      const contextQuery =
        history.length > 0
          ? `${history
              .slice(-6)
              .map((m) => m.content)
              .join(' ')} ${trimmed}`.trim()
          : trimmed;

      const [chatResult, contextResult] = await Promise.all([
        api.sendAiChatMessage({
          venueId: venueId.trim(),
          message: trimmed,
          customerId,
          channel,
          history,
        }) as Promise<{ response: string; intent: string; confidence: number }>,
        showDebug
          ? (api.getAiKnowledgeContext({
              query: contextQuery,
              venueId: venueId.trim(),
            }) as Promise<{ matchedSections: string[] }>)
          : Promise.resolve(null),
      ]);

      const assistantMsg: ChatMessage = {
        id: newId(),
        role: 'assistant',
        content: chatResult.response,
        intent: chatResult.intent,
        confidence: chatResult.confidence,
        matchedSections: contextResult?.matchedSections,
      };
      setMessages((prev) => [...prev, assistantMsg]);
    } catch (e) {
      setError(e instanceof Error ? e.message : parseApiError(String(e)));
    } finally {
      setSending(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    void sendMessage(input);
  };

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-sm text-gray-500">
        <Loader2 className="w-4 h-4 animate-spin" />
        Loading AI Copilot…
      </div>
    );
  }

  const knowledgeReady = knowledgeStatus?.status === 'success';

  return (
    <div className="max-w-4xl space-y-4">
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="p-2.5 rounded-xl bg-sky-50 text-primary">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-gray-900">Test salon AI replies</h3>
              <p className="text-xs text-gray-500 mt-1">
                Uses synced knowledge + OpenAI. Same flow as WhatsApp inbox will use.
              </p>
            </div>
          </div>
          <Link
            to={pathForSettingsSection('ai-knowledge')}
            className="text-meta font-bold text-primary hover:underline"
          >
            Manage knowledge →
          </Link>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-3 text-xs">
          <span className="text-gray-500">
            Venue:{' '}
            <span className="font-mono font-semibold text-gray-800">
              {venueId || 'Not configured'}
            </span>
          </span>
          <span
            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg border text-sm font-bold ${
              knowledgeReady
                ? 'bg-[#e6f7ec] text-accent-green border-[#5dfd8a]/40'
                : 'bg-amber-50 text-amber-700 border-amber-200'
            }`}
          >
            {knowledgeReady ? (
              <CheckCircle2 className="w-3 h-3" />
            ) : (
              <AlertCircle className="w-3 h-3" />
            )}
            {knowledgeReady ? 'Knowledge synced' : 'Sync knowledge first'}
          </span>
          <label className="flex items-center gap-2 text-gray-600">
            Channel
            <select
              value={channel}
              onChange={(e) => setChannel(e.target.value as typeof channel)}
              className="rounded-lg border border-slate-200 bg-slate-50 px-2 py-1 text-meta font-semibold"
            >
              {CHANNELS.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.label}
                </option>
              ))}
            </select>
          </label>
          <label className="flex items-center gap-1.5 text-gray-500 cursor-pointer">
            <input
              type="checkbox"
              checked={showDebug}
              onChange={(e) => setShowDebug(e.target.checked)}
              className="rounded border-gray-300"
            />
            Show context sections
          </label>
        </div>
      </div>

      {error && (
        <div className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2.5 text-xs text-danger-red">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden flex flex-col min-h-[420px] max-h-[560px]">
        <div
          ref={scrollRef}
          className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50"
        >
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12 text-center text-gray-400">
              <MessageSquare className="w-10 h-10 mb-3 opacity-40" />
              <p className="text-sm font-semibold text-gray-500">Start a test conversation</p>
              <p className="text-xs mt-1 max-w-xs">
                Try a quick prompt below or type your own message as a customer would.
              </p>
            </div>
          )}

          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                  msg.role === 'user'
                    ? 'bg-primary text-white rounded-br-md'
                    : 'bg-white border border-slate-200 text-gray-800 rounded-bl-md shadow-sm'
                }`}
              >
                {msg.role === 'assistant' && (
                  <div className="flex items-center gap-1.5 mb-1.5 text-sm font-bold text-primary uppercase tracking-wide">
                    <Bot className="w-3.5 h-3.5" />
                    AI Copilot
                  </div>
                )}
                <p className="whitespace-pre-wrap">{msg.content}</p>
                {msg.role === 'assistant' && msg.intent && (
                  <div className="mt-2 pt-2 border-t border-slate-200 flex flex-wrap gap-2 text-xs">
                    <span className="font-bold text-gray-500">
                      Intent:{' '}
                      <span className="text-primary">{formatIntent(msg.intent)}</span>
                    </span>
                    {msg.confidence != null && (
                      <span className="font-bold text-gray-500">
                        Confidence:{' '}
                        <span className="text-gray-800">{Math.round(msg.confidence * 100)}%</span>
                      </span>
                    )}
                    {showDebug && msg.matchedSections && msg.matchedSections.length > 0 && (
                      <span className="font-bold text-gray-500">
                        Context:{' '}
                        <span className="text-gray-800">{msg.matchedSections.join(', ')}</span>
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}

          {sending && (
            <div className="flex justify-start">
              <div className="bg-white border border-slate-200 rounded-2xl rounded-bl-md px-4 py-3 shadow-sm">
                <Loader2 className="w-4 h-4 animate-spin text-primary" />
              </div>
            </div>
          )}
        </div>

        <div className="border-t border-slate-200 p-3 bg-white space-y-2">
          <div className="flex flex-wrap gap-1.5">
            {QUICK_PROMPTS.map((prompt) => (
              <button
                key={prompt}
                type="button"
                disabled={sending || !knowledgeReady}
                onClick={() => void sendMessage(prompt)}
                className="text-sm font-semibold px-2.5 py-1 rounded-full border border-slate-200 bg-slate-50 hover:border-primary/40 hover:text-primary disabled:opacity-50 transition-colors"
              >
                {prompt}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={
                knowledgeReady
                  ? 'Type a customer message…'
                  : 'Sync AI Knowledge first to test chat'
              }
              disabled={sending || !knowledgeReady}
              className="flex-1 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none disabled:opacity-60"
            />
            <button
              type="submit"
              disabled={sending || !input.trim() || !knowledgeReady}
              className="inline-flex items-center justify-center rounded-xl bg-primary hover:bg-primary-hover disabled:opacity-50 text-white px-4 py-2.5 transition-colors"
              aria-label="Send message"
            >
              {sending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
