/**
 * Global LiveKit call signaling UI: incoming banner + in-call bar.
 * Media via LiveKit only; Socket.IO for lifecycle events.
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'motion/react';
import { Mic, MicOff, Phone, PhoneOff, X } from 'lucide-react';
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

function formatTimer(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export function CallRealtimeBridge() {
  const navigate = useNavigate();
  const [incoming, setIncoming] = useState<IncomingPayload | null>(null);
  const [active, setActive] = useState<CallSessionDto | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [muted, setMuted] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [mediaStatus, setMediaStatus] = useState<'idle' | 'connecting' | 'live' | 'offline'>('idle');

  const roomRef = useRef<Room | null>(null);
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
    async (callId: string) => {
      setMediaStatus('connecting');
      try {
        const { token, url } = await api.getCallToken(callId);
        await teardownRoom();
        const room = new Room({ adaptiveStream: true, dynacast: true });
        roomRef.current = room;
        room.on(RoomEvent.TrackSubscribed, (track) => {
          if (track.kind === Track.Kind.Audio) {
            const el = track.attach();
            el.autoplay = true;
            document.body.appendChild(el);
          }
        });
        await room.connect(url, token);
        await room.localParticipant.setMicrophoneEnabled(true);
        setMediaStatus('live');
        await api.markCallConnected(callId).catch(() => {});
      } catch (err) {
        setMediaStatus('offline');
        setError(formatCatchError(err));
      }
    },
    [teardownRoom]
  );

  const clearIncoming = useCallback(() => {
    stopRingtone();
    setIncoming(null);
  }, [stopRingtone]);

  useEffect(() => {
    const onOutbound = (ev: Event) => {
      const call = (ev as CustomEvent<CallSessionDto>).detail;
      if (!call?.callId) return;
      setActive(call);
      setElapsed(0);
      setError(null);
    };
    window.addEventListener('convosync:outbound-call', onOutbound);
    return () => window.removeEventListener('convosync:outbound-call', onOutbound);
  }, []);

  useEffect(() => {
    const socket = getSocket();

    const onIncoming = (payload: IncomingPayload) => {
      if (!payload?.callId) return;
      // Outbound starter shouldn't get their own ring UI
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
      if (active?.callId === payload.callId) {
        void teardownRoom();
        setActive(null);
        setElapsed(0);
      }
    };

    socket.on('incoming_call', onIncoming);
    socket.on('call_accepted', onAccepted);
    socket.on('call_declined', onTerminal);
    socket.on('call_ended', onTerminal);
    socket.on('call_missed', onTerminal);
    socket.on('call_failed', onTerminal);
    socket.on('call_connected', (payload: CallSessionDto) => {
      if (payload?.callId && payload.acceptedByUserId === me) setActive(payload);
    });

    return () => {
      socket.off('incoming_call', onIncoming);
      socket.off('call_accepted', onAccepted);
      socket.off('call_declined', onTerminal);
      socket.off('call_ended', onTerminal);
      socket.off('call_missed', onTerminal);
      socket.off('call_failed', onTerminal);
      socket.off('call_connected');
      stopRingtone();
      void teardownRoom();
    };
  }, [active?.callId, clearIncoming, incoming?.callId, me, startRingtone, stopRingtone, teardownRoom]);

  useEffect(() => {
    if (!active || (active.status !== 'accepted' && active.status !== 'connected')) return;
    const t = setInterval(() => setElapsed((e) => e + 1), 1000);
    return () => clearInterval(t);
  }, [active]);

  useEffect(() => {
    if (!active) return;
    if (active.status === 'accepted' || active.status === 'connected') {
      if (mediaStatus === 'idle' || mediaStatus === 'offline') {
        void joinLiveKit(active.callId);
      }
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
      setElapsed(0);
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
    setBusy(true);
    try {
      await api.endCall(active.callId);
      await teardownRoom();
      setActive(null);
      setElapsed(0);
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
    incoming?.contact?.name ||
    incoming?.contact?.phone ||
    'Incoming voice call';

  return (
    <>
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
        {active &&
          (active.status === 'accepted' ||
            active.status === 'connected' ||
            active.status === 'ringing') && (
          <motion.div
            key={`active-${active.callId}`}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 16 }}
            className="fixed bottom-4 left-1/2 z-[80] w-[min(440px,calc(100vw-2rem))] -translate-x-1/2"
          >
            <div className="rounded-2xl border border-slate-200 bg-slate-900 text-white shadow-2xl px-4 py-3 flex items-center gap-3">
              <div className="min-w-0 flex-1">
                <p className="text-sm font-bold truncate">
                  {active.status === 'connected'
                    ? 'In call'
                    : active.status === 'accepted'
                      ? 'Connecting…'
                      : 'Calling…'}
                </p>
                <p className="text-xs text-white/60 font-medium">
                  {formatTimer(elapsed)}
                  {mediaStatus === 'offline' ? ' · media offline (check LiveKit env)' : ''}
                  {mediaStatus === 'connecting' ? ' · joining room…' : ''}
                </p>
                {error && <p className="text-xs text-red-300 mt-0.5 truncate">{error}</p>}
              </div>
              {(active.status === 'accepted' || active.status === 'connected') && (
                <button
                  type="button"
                  onClick={() => void toggleMute()}
                  className="h-10 w-10 rounded-full bg-white/10 hover:bg-white/15 inline-flex items-center justify-center cursor-pointer"
                  aria-label={muted ? 'Unmute' : 'Mute'}
                >
                  {muted ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                </button>
              )}
              {active.status === 'ringing' && (
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => {
                    setBusy(true);
                    void api
                      .acceptCall(active.callId)
                      .then(({ call }) => setActive(call))
                      .catch((err) => setError(formatCatchError(err)))
                      .finally(() => setBusy(false));
                  }}
                  className="h-10 px-4 rounded-full bg-channel-green hover:bg-[#20bd5a] text-sm font-bold inline-flex items-center gap-1.5 disabled:opacity-60 cursor-pointer"
                >
                  <Phone className="h-4 w-4" />
                  Join
                </button>
              )}
              <button
                type="button"
                disabled={busy}
                onClick={() => void handleEnd()}
                className="h-10 px-4 rounded-full bg-red-500 hover:bg-red-600 text-sm font-bold inline-flex items-center gap-1.5 disabled:opacity-60 cursor-pointer"
              >
                <PhoneOff className="h-4 w-4" />
                End
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
