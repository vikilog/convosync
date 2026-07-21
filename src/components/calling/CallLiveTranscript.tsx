/**
 * Live subtitle panel for AI-handled calls (Socket.IO call_transcript_chunk).
 */
import { useEffect, useRef, useState } from 'react';
import { connectSocket, getSocket } from '../../lib/socket';
import { getWorkspaceId } from '../../lib/api';
import { CallAvatar } from './CallAvatar';

export type TranscriptTurnLatency = {
  sttMs?: number;
  llmMs?: number;
  ttsMs?: number;
  totalMs?: number;
};

export type LiveTranscriptTurn = {
  role: 'customer' | 'agent';
  text: string;
  at: string;
  turnId?: string;
  latency?: TranscriptTurnLatency;
};

type Props = {
  callId: string;
  className?: string;
  agentAvatarUrl?: string | null;
  agentName?: string | null;
  contactAvatarUrl?: string | null;
  contactName?: string | null;
};

function formatTurnTime(at: string): string {
  try {
    return new Date(at).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  } catch {
    return '';
  }
}

function LatencyBadges({ latency, role }: { latency?: TranscriptTurnLatency; role: 'customer' | 'agent' }) {
  if (!latency) return null;
  const items: string[] = [];
  if (role === 'customer' && latency.sttMs != null) items.push(`STT ${latency.sttMs}ms`);
  if (role === 'agent') {
    if (latency.llmMs != null) items.push(`LLM ${latency.llmMs}ms`);
    if (latency.ttsMs != null) items.push(`TTS ${latency.ttsMs}ms`);
    if (latency.totalMs != null) items.push(`Total ${latency.totalMs}ms`);
  }
  if (items.length === 0) return null;
  return (
    <p className="mt-1 flex flex-wrap gap-x-2 gap-y-0.5 text-[10px] font-medium text-slate-400">
      {items.map((item) => (
        <span key={item}>{item}</span>
      ))}
    </p>
  );
}

export function CallLiveTranscript({
  callId,
  className = '',
  agentAvatarUrl,
  agentName,
  contactAvatarUrl,
  contactName,
}: Props) {
  const [turns, setTurns] = useState<LiveTranscriptTurn[]>([]);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const workspaceId = getWorkspaceId();
    if (workspaceId) connectSocket(workspaceId);
    const socket = getSocket();

    const onChunk = (payload: {
      callId?: string;
      role?: string;
      text?: string;
      at?: string;
      turnId?: string;
      latency?: TranscriptTurnLatency;
      patch?: boolean;
    }) => {
      if (payload?.callId !== callId) return;
      const text = (payload.text || '').trim();
      if (!text) return;
      const role: 'customer' | 'agent' =
        payload.role === 'agent' || payload.role === 'assistant' ? 'agent' : 'customer';
      const turn: LiveTranscriptTurn = {
        role,
        text,
        at: payload.at || new Date().toISOString(),
        turnId: payload.turnId,
        latency: payload.latency,
      };

      setTurns((prev) => {
        if (payload.patch && payload.turnId) {
          const idx = prev.findIndex((t) => t.turnId === payload.turnId);
          if (idx >= 0) {
            const next = [...prev];
            next[idx] = {
              ...next[idx],
              latency: { ...next[idx].latency, ...payload.latency },
            };
            return next;
          }
        }
        return [...prev, turn];
      });
    };

    socket.on('call_transcript_chunk', onChunk);
    return () => {
      socket.off('call_transcript_chunk', onChunk);
    };
  }, [callId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [turns.length]);

  if (turns.length === 0) {
    return (
      <div
        className={`rounded-xl border border-slate-200 bg-slate-50 px-3 py-4 text-center text-xs text-slate-500 ${className}`}
      >
        Live transcript will appear here as the customer and AI speak…
      </div>
    );
  }

  return (
    <div
      className={`rounded-xl border border-slate-200 bg-slate-50 max-h-48 overflow-y-auto px-3 py-2 space-y-2 ${className}`}
    >
      {turns.map((t, i) => (
        <div
          key={t.turnId || `${t.at}-${i}`}
          className={`flex gap-2 text-sm ${t.role === 'agent' ? 'flex-row-reverse text-right' : ''}`}
        >
          <CallAvatar
            size="sm"
            kind={t.role === 'agent' ? 'agent' : 'customer'}
            name={t.role === 'agent' ? agentName : contactName}
            avatarUrl={t.role === 'agent' ? agentAvatarUrl : contactAvatarUrl}
            fallbackIcon={t.role === 'agent' ? 'bot' : 'user'}
            className="mt-0.5"
          />
          <div className={`max-w-[85%] ${t.role === 'agent' ? 'items-end' : ''}`}>
            <p className="text-[10px] font-medium text-slate-400 mb-0.5">{formatTurnTime(t.at)}</p>
            <p
              className={`rounded-lg px-2.5 py-1.5 ${
                t.role === 'agent'
                  ? 'bg-emerald-50 text-emerald-950'
                  : 'bg-white text-slate-800 border border-slate-100'
              }`}
            >
              {t.text}
            </p>
            <LatencyBadges latency={t.latency} role={t.role} />
          </div>
        </div>
      ))}
      <div ref={bottomRef} />
    </div>
  );
}
