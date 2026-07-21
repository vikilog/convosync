import { useCallback, useEffect, useRef, useState } from 'react';
import { Loader2, Phone, PhoneOff, Send } from 'lucide-react';
import { api } from '../../lib/api';
import { useBrowserVoiceTalk } from '../../hooks/useBrowserVoiceTalk';
import { CallAvatar } from './CallAvatar';
import type { LiveTranscriptTurn, TranscriptTurnLatency } from './CallLiveTranscript';

type ChatApiResponse = {
  reply: string;
  conversationId: string;
  fromCache: boolean;
  tokensUsed: number;
  costInr: number;
  intent: string;
};

type Props = {
  agentId: string;
  agentName?: string | null;
  agentAvatarUrl?: string | null;
  contactName?: string;
  welcomeMessage?: string | null;
  language?: string;
  className?: string;
  onCutCall?: () => void;
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

function sttLanguage(language?: string): string | undefined {
  switch ((language || '').toLowerCase()) {
    case 'hindi':
    case 'hinglish':
      return 'hi';
    case 'english':
      return 'en';
    default:
      return undefined; // auto
  }
}

export function CallAgentPreviewChat({
  agentId,
  agentName,
  agentAvatarUrl,
  contactName = 'You (preview)',
  welcomeMessage,
  language = 'english',
  className = '',
  onCutCall,
}: Props) {
  const [turns, setTurns] = useState<LiveTranscriptTurn[]>(() => {
    const welcome = welcomeMessage?.trim();
    if (!welcome) return [];
    return [{ role: 'agent', text: welcome, at: new Date().toISOString() }];
  });
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const welcomeSpokenRef = useRef(false);
  const conversationIdRef = useRef<string | null>(null);
  const busyRef = useRef(false);
  const inCallRef = useRef(false);
  const voice = useBrowserVoiceTalk(language);

  conversationIdRef.current = conversationId;
  inCallRef.current = voice.inCall;

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [turns.length, loading, voice.status]);

  const sendText = useCallback(
    async (text: string, opts?: { sttMs?: number; fromVoice?: boolean }) => {
      const trimmed = text.trim();
      if (!trimmed || busyRef.current) return;

      busyRef.current = true;
      setLoading(true);
      setError(null);

      const userAt = new Date().toISOString();
      setTurns((prev) => [
        ...prev,
        {
          role: 'customer',
          text: trimmed,
          at: userAt,
          latency: opts?.sttMs != null ? { sttMs: opts.sttMs } : undefined,
        },
      ]);
      setInput('');

      const llmStarted = performance.now();
      try {
        const res = (await api.chatAgent(agentId, {
          message: trimmed,
          conversationId: conversationIdRef.current ?? undefined,
          channel: 'preview',
        })) as { success?: boolean; data?: ChatApiResponse };

        const data = res.data ?? (res as unknown as ChatApiResponse);
        if (!data?.reply?.trim()) throw new Error('Empty agent reply');

        conversationIdRef.current = data.conversationId;
        setConversationId(data.conversationId);
        const llmMs = Math.round(performance.now() - llmStarted);
        const agentAt = new Date().toISOString();

        setTurns((prev) => [
          ...prev,
          { role: 'agent', text: data.reply, at: agentAt, latency: { llmMs } },
        ]);

        if (opts?.fromVoice || inCallRef.current) {
          const tts = await api.synthesizeAgentVoicePreview(agentId, data.reply);
          const ttsMs = await voice.speakAudio(tts.blob, { ttsMs: tts.ttsMs });
          setTurns((prev) => {
            const next = [...prev];
            const idx = next.findIndex((t) => t.at === agentAt && t.role === 'agent');
            if (idx >= 0) {
              next[idx] = {
                ...next[idx],
                latency: { llmMs, ttsMs, totalMs: llmMs + ttsMs },
              };
            }
            return next;
          });
        } else if (inCallRef.current) {
          voice.resumeListening();
        }
      } catch (err) {
        console.error('[voice-preview] chat failed', err);
        setError(err instanceof Error ? err.message : 'Agent reply failed');
        if (inCallRef.current) voice.resumeListening();
      } finally {
        busyRef.current = false;
        setLoading(false);
      }
    },
    [agentId, voice]
  );

  const handleUtterance = useCallback(
    async (blob: Blob, meta: { durationMs: number }) => {
      try {
        setError(null);
        const stt = await api.transcribeAgentVoicePreview(agentId, blob, {
          language: sttLanguage(language),
        });
        await sendText(stt.text, {
          sttMs: stt.sttMs || meta.durationMs,
          fromVoice: true,
        });
      } catch (err) {
        console.error('[voice-preview] STT failed', err);
        setError(
          err instanceof Error
            ? err.message
            : 'Could not understand speech. Speak clearly and try again.'
        );
        voice.resumeListening();
      }
    },
    [agentId, language, sendText, voice]
  );

  useEffect(() => {
    voice.setOnUtterance(handleUtterance);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [handleUtterance]);

  useEffect(() => {
    if (!voice.inCall || welcomeSpokenRef.current) return;
    const welcome = welcomeMessage?.trim();
    welcomeSpokenRef.current = true;
    if (!welcome) return;
    const t = window.setTimeout(() => {
      void (async () => {
        try {
          const tts = await api.synthesizeAgentVoicePreview(agentId, welcome);
          await voice.speakAudio(tts.blob, { ttsMs: tts.ttsMs });
        } catch (err) {
          console.error('[voice-preview] welcome TTS failed', err);
          voice.resumeListening();
        }
      })();
    }, 350);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [voice.inCall, welcomeMessage]);

  const startCall = async () => {
    welcomeSpokenRef.current = false;
    await voice.startCall(handleUtterance);
  };

  const voiceLabel = !voice.inCall
    ? null
    : voice.status === 'requesting'
      ? 'Mic permission…'
      : voice.status === 'listening'
        ? 'Listening — bolo (thoda rukne pe send hoga)'
        : voice.status === 'recording'
          ? 'Recording…'
          : voice.status === 'processing'
            ? 'Transcribing + agent reply…'
            : voice.status === 'speaking'
              ? 'Agent bol raha hai…'
              : 'Call connected';

  const levelPct = Math.min(100, Math.round(voice.level * 400));

  return (
    <div className={`flex min-h-0 flex-1 flex-col ${className}`}>
      <div className="flex-1 min-h-0 overflow-y-auto rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 space-y-2">
        {turns.length === 0 && !loading && !voice.inCall && (
          <div className="flex h-full min-h-[120px] flex-col items-center justify-center px-4 text-center">
            <p className="text-sm font-semibold text-slate-700">Voice preview call</p>
            <p className="mt-1 text-xs text-slate-500">
              Start call → bolo → ruk jao. STT/TTS agent profile ke selected providers use karega.
            </p>
          </div>
        )}

        {turns.map((t, i) => (
          <div
            key={t.turnId || `${t.at}-${i}`}
            className={`flex gap-2 text-sm ${t.role === 'agent' ? 'flex-row-reverse text-right' : ''}`}
          >
            <CallAvatar
              size="sm"
              kind={t.role === 'agent' ? 'agent' : 'customer'}
              name={t.role === 'agent' ? agentName : contactName}
              avatarUrl={t.role === 'agent' ? agentAvatarUrl : null}
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

        {loading && (
          <div className="flex items-end gap-2 flex-row-reverse text-right">
            <CallAvatar size="sm" kind="agent" name={agentName} avatarUrl={agentAvatarUrl} fallbackIcon="bot" />
            <div className="rounded-lg border border-slate-100 bg-white px-3 py-2">
              <Loader2 className="h-4 w-4 animate-spin text-slate-400" />
            </div>
          </div>
        )}

        {(error || voice.error) && (
          <p className="text-xs font-medium text-red-600 text-center">{error || voice.error}</p>
        )}
        <div ref={bottomRef} />
      </div>

      {voice.inCall && (
        <div className="mt-2 space-y-1">
          {voiceLabel && (
            <p className="text-center text-xs font-semibold text-emerald-700">{voiceLabel}</p>
          )}
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
            <div
              className={`h-full transition-all duration-75 ${
                voice.status === 'recording' ? 'bg-red-500' : 'bg-emerald-500'
              }`}
              style={{ width: `${Math.max(voice.status === 'listening' ? 4 : 0, levelPct)}%` }}
            />
          </div>
        </div>
      )}

      <div className="mt-3 shrink-0 flex items-center gap-2">
        {!voice.inCall ? (
          <button
            type="button"
            onClick={() => void startCall()}
            disabled={voice.status === 'requesting'}
            className="inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-channel-green text-sm font-bold text-white hover:opacity-95 disabled:opacity-50 cursor-pointer"
          >
            <Phone className="h-4 w-4" />
            Start call
          </button>
        ) : (
          <button
            type="button"
            onClick={() => {
              voice.hangUp();
              onCutCall?.();
            }}
            className="inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-red-500 text-sm font-bold text-white hover:bg-red-600 cursor-pointer"
          >
            <PhoneOff className="h-4 w-4" />
            Cut call
          </button>
        )}

        <div className="flex min-w-0 flex-[1.4] items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                void sendText(input);
              }
            }}
            disabled={loading}
            placeholder="Type fallback…"
            className="flex-1 bg-transparent text-sm text-slate-900 placeholder:text-slate-400 outline-none disabled:opacity-60"
          />
          <button
            type="button"
            onClick={() => void sendText(input)}
            disabled={loading || !input.trim()}
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 disabled:opacity-50 cursor-pointer"
            aria-label="Send message"
          >
            <Send className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
