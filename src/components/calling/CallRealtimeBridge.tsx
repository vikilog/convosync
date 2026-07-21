/**
 * Global call UI: incoming banner + floating pill + side sheet (non-blocking).
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'motion/react';
import { Phone, PhoneOff, X } from 'lucide-react';
import { Room, RoomEvent, Track } from 'livekit-client';
import {
  api,
  formatCatchError,
  getUserId,
  type CallSessionDto,
} from '../../lib/api';
import { getSocket } from '../../lib/socket';
import { pathForTab } from '../../routes';
import { dispatchOpenInboxConversation } from '../../lib/inboxEvents';
import { useCallDuration } from '../../lib/callDuration';
import { CallFloatingPill } from './CallFloatingPill';
import { CallSideSheet, type CallAgentMode } from './CallSideSheet';
import {
  AGENT_CALL_PREVIEW_EVENT,
  isAgentCallPreviewId,
  type AgentCallPreviewDetail,
} from '../../lib/callPreviewEvents';

const PREVIEW_CALL_ID = '__preview_call_widget__';

function mockPreviewCall(agent?: AgentCallPreviewDetail): CallSessionDto {
  const now = new Date().toISOString();
  const agentId = agent?.id ?? 'preview-ai';
  const agentName = agent?.name ?? 'Demo AI Agent';
  return {
    callId: agent ? `__preview_agent_${agent.id}__` : PREVIEW_CALL_ID,
    workspaceId: 'preview',
    conversationId: null,
    contactId: 'preview-contact',
    direction: 'outbound',
    status: 'connected',
    roomName: 'preview-room',
    assignedTo: null,
    acceptedByUserId: null,
    ringingAt: null,
    ringingUntil: null,
    acceptedAt: now,
    connectedAt: now,
    endedAt: null,
    durationSeconds: null,
    endReason: null,
    currentHandler: 'ai',
    takenOverAt: null,
    takenOverByUserId: null,
    createdAt: now,
    handler: { type: 'ai', name: agentName, avatarUrl: agent?.avatarUrl ?? null },
    aiAgent: { id: agentId, name: agentName, avatarUrl: agent?.avatarUrl ?? null },
    humanAgent: null,
    contact: {
      id: 'preview-contact',
      name: agent ? 'You (preview)' : 'Rahul Sharma',
      phone: '+919876543210',
      avatarUrl: null,
    },
  };
}

function isPreviewCall(call: CallSessionDto | null) {
  return call?.callId === PREVIEW_CALL_ID || isAgentCallPreviewId(call?.callId);
}

type IncomingPayload = CallSessionDto & {
  contact?: { id: string; name: string; phone: string } | null;
  soft?: boolean;
  declinedByUserId?: string;
};

function playRingtone(ctx: AudioContext) {
  const beep = (freq: number, start: number, dur: number) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.exponentialRampToValueAtTime(0.08, start + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + dur);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(start);
    osc.stop(start + dur + 0.02);
  };
  const now = ctx.currentTime;
  beep(880, now, 0.18);
  beep(988, now + 0.22, 0.18);
}

function isLiveCall(call: CallSessionDto | null): call is CallSessionDto {
  if (!call) return false;
  return ['ringing', 'accepted', 'connected'].includes(call.status);
}

export function CallRealtimeBridge() {
  const navigate = useNavigate();
  const [incoming, setIncoming] = useState<IncomingPayload | null>(null);
  const [active, setActive] = useState<CallSessionDto | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [agentMode, setAgentMode] = useState<CallAgentMode>('idle');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [muted, setMuted] = useState(false);
  const [mediaStatus, setMediaStatus] = useState<'idle' | 'connecting' | 'live' | 'offline'>('idle');
  const [previewWelcome, setPreviewWelcome] = useState<string | null>(null);
  const [previewLanguage, setPreviewLanguage] = useState<string>('english');

  const elapsed = useCallDuration(active?.connectedAt, {
    active: !!active?.connectedAt && isLiveCall(active),
  });

  const roomRef = useRef<Room | null>(null);
  const attachedAudioRef = useRef<HTMLMediaElement[]>([]);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const ringTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const me = getUserId();

  const stopRingtone = useCallback(() => {
    if (ringTimerRef.current) {
      clearInterval(ringTimerRef.current);
      ringTimerRef.current = null;
    }
  }, []);

  const startRingtone = useCallback(() => {
    stopRingtone();
    try {
      const Ctx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!Ctx) return;
      const ctx = audioCtxRef.current ?? new Ctx();
      audioCtxRef.current = ctx;
      void ctx.resume();
      playRingtone(ctx);
      ringTimerRef.current = setInterval(() => playRingtone(ctx), 2200);
    } catch {
      /* ignore */
    }
  }, [stopRingtone]);

  const teardownRoom = useCallback(async () => {
    for (const el of attachedAudioRef.current) el.remove();
    attachedAudioRef.current = [];
    const room = roomRef.current;
    roomRef.current = null;
    if (room) {
      try {
        await room.disconnect();
      } catch {
        /* ignore */
      }
    }
    setMediaStatus('idle');
    setMuted(false);
  }, []);

  const joinLiveKit = useCallback(
    async (opts: {
      callId: string;
      mode: 'agent' | 'listen';
      token?: string;
      url?: string;
    }) => {
      setMediaStatus('connecting');
      try {
        let token = opts.token;
        let url = opts.url;
        if (!token || !url) {
          if (opts.mode === 'listen') {
            const res = await api.listenInCall(opts.callId);
            token = res.token;
            url = res.url;
          } else {
            const res = await api.getCallToken(opts.callId);
            token = res.token;
            url = res.url;
          }
        }
        await teardownRoom();
        const room = new Room({ adaptiveStream: true, dynacast: true });
        roomRef.current = room;
        room.on(RoomEvent.TrackSubscribed, (track) => {
          if (track.kind === Track.Kind.Audio) {
            const el = track.attach();
            el.autoplay = true;
            document.body.appendChild(el);
            attachedAudioRef.current.push(el);
          }
        });
        await room.connect(url, token);
        if (opts.mode === 'listen') {
          await room.localParticipant.setMicrophoneEnabled(false);
          setMuted(true);
          setAgentMode('listening');
        } else {
          await room.localParticipant.setMicrophoneEnabled(true);
          setAgentMode('speaking');
          await api.markCallConnected(opts.callId).catch(() => {});
        }
        setMediaStatus('live');
      } catch (err) {
        setMediaStatus('offline');
        setError(formatCatchError(err));
      }
    },
    [teardownRoom]
  );

  const clearActive = useCallback(async () => {
    await teardownRoom();
    setPreviewWelcome(null);
    setPreviewLanguage('english');
    setActive(null);
    setSheetOpen(false);
    setAgentMode('idle');
    setError(null);
  }, [teardownRoom]);

  const clearIncoming = useCallback(() => {
    stopRingtone();
    setIncoming(null);
  }, [stopRingtone]);

  const mergeActive = useCallback((payload: CallSessionDto) => {
    if (!payload?.callId) return;
    setActive((prev) => (prev?.callId === payload.callId ? { ...prev, ...payload } : prev));
  }, []);

  useEffect(() => {
    const onOutbound = (ev: Event) => {
      const call = (ev as CustomEvent<CallSessionDto>).detail;
      if (!call?.callId) return;
      setActive(call);
      setAgentMode('idle');
      setSheetOpen(true);
      setError(null);
    };
    window.addEventListener('convosync:outbound-call', onOutbound);
    return () => window.removeEventListener('convosync:outbound-call', onOutbound);
  }, []);

  useEffect(() => {
    const onAgentPreview = (ev: Event) => {
      const agent = (ev as CustomEvent<AgentCallPreviewDetail>).detail;
      if (!agent?.id) return;
      setPreviewWelcome(agent.welcomeMessage ?? null);
      setPreviewLanguage(agent.fallbackLanguage ?? 'english');
      setActive(mockPreviewCall(agent));
      setAgentMode('idle');
      setSheetOpen(true);
      setError(null);
    };
    window.addEventListener(AGENT_CALL_PREVIEW_EVENT, onAgentPreview);
    return () => window.removeEventListener(AGENT_CALL_PREVIEW_EVENT, onAgentPreview);
  }, []);

  useEffect(() => {
    const socket = getSocket();

    const onIncoming = (payload: IncomingPayload) => {
      if (!payload?.callId) return;
      if (payload.initiatedByUserId && me && payload.initiatedByUserId === me) return;
      if (payload.assignedTo && me && payload.assignedTo !== me) return;
      if (payload.status !== 'ringing') return;
      setIncoming(payload);
      startRingtone();
    };

    const onAccepted = (payload: CallSessionDto & { initiatedByUserId?: string | null }) => {
      if (!payload?.callId) return;
      if (incoming?.callId === payload.callId) clearIncoming();
      if (payload.acceptedByUserId === me || payload.initiatedByUserId === me) {
        setActive(payload);
      }
    };

    const onTerminal = (payload: CallSessionDto & { soft?: boolean; declinedByUserId?: string }) => {
      if (!payload?.callId) return;
      if (payload.soft && payload.declinedByUserId === me) {
        clearIncoming();
        return;
      }
      if (!payload.soft && incoming?.callId === payload.callId) clearIncoming();
      if (active?.callId === payload.callId) void clearActive();
    };

    socket.on('incoming_call', onIncoming);
    socket.on('call_accepted', onAccepted);
    socket.on('call_declined', onTerminal);
    socket.on('call_ended', onTerminal);
    socket.on('call_missed', onTerminal);
    socket.on('call_failed', onTerminal);
    socket.on('call_handler_changed', (payload: CallSessionDto) => {
      mergeActive(payload);
      if (payload.currentHandler === 'human') setAgentMode('speaking');
    });
    socket.on('call_connected', (payload: CallSessionDto) => {
      if (!payload?.callId) return;
      setActive((prev) => {
        if (prev?.callId === payload.callId) return { ...prev, ...payload };
        if (payload.initiatedByUserId === me) return payload;
        return prev;
      });
    });
    socket.on('call_initiated', (payload: CallSessionDto) => {
      if (payload?.initiatedByUserId === me && payload.callId) {
        setActive(payload);
        setAgentMode('idle');
        setSheetOpen(true);
      }
    });

    return () => {
      socket.off('incoming_call', onIncoming);
      socket.off('call_accepted', onAccepted);
      socket.off('call_declined', onTerminal);
      socket.off('call_ended', onTerminal);
      socket.off('call_missed', onTerminal);
      socket.off('call_failed', onTerminal);
      socket.off('call_handler_changed');
      socket.off('call_connected');
      socket.off('call_initiated');
      stopRingtone();
      void teardownRoom();
    };
  }, [
    active?.callId,
    clearActive,
    clearIncoming,
    incoming?.callId,
    me,
    mergeActive,
    startRingtone,
    stopRingtone,
    teardownRoom,
  ]);

  // Human on call: auto-join LiveKit. AI calls: join only after listen / take-over.
  useEffect(() => {
    if (!active || active.currentHandler === 'ai' || isPreviewCall(active)) return;
    if (active.status !== 'accepted' && active.status !== 'connected') return;
    if (mediaStatus === 'idle' || mediaStatus === 'offline') {
      void joinLiveKit({ callId: active.callId, mode: 'agent' });
    }
  }, [active, joinLiveKit, mediaStatus]);

  const handleAccept = async () => {
    if (!incoming) return;
    setBusy(true);
    setError(null);
    try {
      const { call } = await api.acceptCall(incoming.callId);
      clearIncoming();
      setActive(call);
      setSheetOpen(true);
      if (call.conversationId) {
        navigate(pathForTab('inbox'));
        dispatchOpenInboxConversation(call.conversationId);
      }
    } catch (err) {
      setError(formatCatchError(err));
    } finally {
      setBusy(false);
    }
  };

  const handleDecline = async () => {
    if (!incoming) return;
    setBusy(true);
    try {
      await api.declineCall(incoming.callId);
      clearIncoming();
    } catch (err) {
      setError(formatCatchError(err));
    } finally {
      setBusy(false);
    }
  };

  const handleEnd = async () => {
    if (!active) return;
    if (isPreviewCall(active)) {
      await clearActive();
      return;
    }
    setBusy(true);
    try {
      await api.endCall(active.callId);
      await clearActive();
    } catch (err) {
      setError(formatCatchError(err));
    } finally {
      setBusy(false);
    }
  };

  const handleListenIn = async () => {
    if (!active) return;
    if (isPreviewCall(active)) {
      setAgentMode('listening');
      setError(null);
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await joinLiveKit({ callId: active.callId, mode: 'listen' });
    } catch (err) {
      setError(formatCatchError(err));
    } finally {
      setBusy(false);
    }
  };

  const handleTakeOver = async () => {
    if (!active) return;
    if (isPreviewCall(active)) {
      setActive({
        ...active,
        currentHandler: 'human',
        handler: { type: 'human', name: 'You (preview)', avatarUrl: null },
        humanAgent: { id: 'preview-human', name: 'You (preview)', avatarUrl: null },
      });
      setAgentMode('speaking');
      setError(null);
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await navigator.mediaDevices.getUserMedia({ audio: true }).then((s) => {
        s.getTracks().forEach((t) => t.stop());
      });
      const result = await api.takeOverCall(active.callId);
      setActive(result.call);
      await joinLiveKit({
        callId: active.callId,
        mode: 'agent',
        token: result.token,
        url: result.url,
      });
    } catch (err) {
      setError(formatCatchError(err));
    } finally {
      setBusy(false);
    }
  };

  const toggleMute = async () => {
    const room = roomRef.current;
    if (!room) return;
    const next = !muted;
    await room.localParticipant.setMicrophoneEnabled(!next);
    setMuted(next);
  };

  const contactLabel =
    incoming?.contact?.name || incoming?.contact?.phone || 'Incoming voice call';

  return (
    <>
      {/* ponytail: Preview call widget button removed — voice UI parked for later release */}

      <AnimatePresence>
        {incoming && !active && (
          <motion.div
            key={incoming.callId}
            initial={{ opacity: 0, y: -16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            className="fixed top-4 left-1/2 z-[80] w-[min(420px,calc(100vw-2rem))] -translate-x-1/2"
            role="alertdialog"
            aria-label="Incoming call"
          >
            <div className="rounded-2xl border border-emerald-200 bg-white shadow-xl shadow-emerald-900/10 p-4">
              <div className="flex items-start gap-3">
                <div className="h-11 w-11 rounded-full bg-emerald-50 text-channel-green flex items-center justify-center shrink-0">
                  <Phone className="h-5 w-5 animate-pulse" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-bold text-gray-950 truncate">{contactLabel}</p>
                  <p className="text-xs text-gray-500 font-medium mt-0.5">Incoming call · WhatsApp voice</p>
                  {error && <p className="text-xs text-red-600 mt-1">{error}</p>}
                </div>
                <button
                  type="button"
                  onClick={() => clearIncoming()}
                  className="p-1.5 rounded-lg text-gray-400 hover:bg-slate-50 cursor-pointer"
                  aria-label="Dismiss"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <div className="mt-4 flex gap-2">
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => void handleDecline()}
                  className="flex-1 min-h-11 inline-flex items-center justify-center gap-2 rounded-full bg-red-50 text-red-700 text-sm font-bold hover:bg-red-100 disabled:opacity-60 cursor-pointer"
                >
                  <PhoneOff className="h-4 w-4" />
                  Decline
                </button>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => void handleAccept()}
                  className="flex-1 min-h-11 inline-flex items-center justify-center gap-2 rounded-full bg-channel-green text-white text-sm font-bold hover:bg-[#20bd5a] disabled:opacity-60 cursor-pointer"
                >
                  <Phone className="h-4 w-4" />
                  Answer
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isLiveCall(active) && (
          <CallFloatingPill
            key={active.callId}
            call={active}
            elapsed={elapsed}
            onClick={() => setSheetOpen((o) => !o)}
          />
        )}
      </AnimatePresence>

      {isLiveCall(active) && (
        <CallSideSheet
          open={sheetOpen}
          onClose={() => setSheetOpen(false)}
          call={active}
          elapsed={elapsed}
          agentMode={agentMode}
          busy={busy}
          error={error}
          muted={muted}
          previewWelcomeMessage={previewWelcome}
          previewLanguage={previewLanguage}
          onListenIn={() => void handleListenIn()}
          onTakeOver={() => void handleTakeOver()}
          onEnd={() => void handleEnd()}
          onToggleMute={() => void toggleMute()}
        />
      )}
    </>
  );
}
