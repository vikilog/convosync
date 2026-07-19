/**
 * Live subtitle panel for AI-handled calls (Socket.IO call_transcript_chunk).
 */
import { useEffect, useRef, useState } from 'react';
import { Bot, User } from 'lucide-react';
import { connectSocket, getSocket } from '../../lib/socket';
import { getWorkspaceId } from '../../lib/api';

export type LiveTranscriptTurn = {
  role: 'customer' | 'agent';
  text: string;
  at: string;
};

type Props = {
  callId: string;
  className?: string;
};

export function CallLiveTranscript({ callId, className = '' }: Props) {
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
    }) => {
      if (payload?.callId !== callId) return;
      const text = (payload.text || '').trim();
      if (!text) return;
      const role: 'customer' | 'agent' =
        payload.role === 'agent' || payload.role === 'assistant' ? 'agent' : 'customer';
      setTurns((prev) => [
        ...prev,
        { role, text, at: payload.at || new Date().toISOString() },
      ]);
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
          key={`${t.at}-${i}`}
          className={`flex gap-2 text-sm ${t.role === 'agent' ? 'flex-row-reverse text-right' : ''}`}
        >
          <span
            className={`mt-0.5 shrink-0 h-6 w-6 rounded-full flex items-center justify-center ${
              t.role === 'agent' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-600'
            }`}
          >
            {t.role === 'agent' ? <Bot className="h-3.5 w-3.5" /> : <User className="h-3.5 w-3.5" />}
          </span>
          <p
            className={`rounded-lg px-2.5 py-1.5 max-w-[85%] ${
              t.role === 'agent'
                ? 'bg-emerald-50 text-emerald-950'
                : 'bg-white text-slate-800 border border-slate-100'
            }`}
          >
            {t.text}
          </p>
        </div>
      ))}
      <div ref={bottomRef} />
    </div>
  );
}
