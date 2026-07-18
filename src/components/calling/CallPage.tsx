/**
 * Dedicated LiveKit call page — agent (JWT) or customer (guest ?t=).
 * Call "starts" (timer + connected UI) only after the customer joins.
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { Room, RoomEvent, Track, ConnectionQuality } from 'livekit-client';
import {
  Check,
  Circle,
  Copy,
  Loader2,
  Mic,
  MicOff,
  Phone,
  PhoneOff,
  Send,
} from 'lucide-react';
import {
  api,
  formatCatchError,
  getWorkspaceId,
  type CallSessionDto,
} from '../../lib/api';
import { PRODUCT_LOGO, PRODUCT_NAME } from '../../lib/brand';
import { dispatchOpenInboxConversation } from '../../lib/inboxEvents';
import { connectSocket, getSocket } from '../../lib/socket';
import { pathForTab } from '../../routes';

type Role = 'agent' | 'customer';
type Phase =
  | 'loading'
  | 'waiting'
  | 'ready'
  | 'connecting'
  | 'connected'
  | 'ended'
  | 'error';

function formatTimer(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

function isTerminalStatus(status: string) {
  return ['ended', 'missed', 'declined', 'failed'].includes(status);
}

export function CallPage() {
  const { callId = '' } = useParams();
  const [search] = useSearchParams();
  const guestToken = search.get('t');
  const navigate = useNavigate();

  const role: Role = guestToken ? 'customer' : 'agent';
  const [call, setCall] = useState<CallSessionDto | null>(null);
  const [workspaceName, setWorkspaceName] = useState(PRODUCT_NAME);
  const [contactName, setContactName] = useState<string | null>(null);
  const [guestUrl, setGuestUrl] = useState<string | null>(null);
  const [phase, setPhase] = useState<Phase>('loading');
  const [error, setError] = useState<string | null>(null);
  const [muted, setMuted] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [copied, setCopied] = useState(false);
  const [busy, setBusy] = useState(false);
  const [recordingOn, setRecordingOn] = useState(false);
  const [reconnecting, setReconnecting] = useState(false);
  const [netQuality, setNetQuality] = useState<'excellent' | 'good' | 'poor' | 'unknown'>('unknown');
  const [mics, setMics] = useState<MediaDeviceInfo[]>([]);
  const [speakers, setSpeakers] = useState<MediaDeviceInfo[]>([]);
  const [micId, setMicId] = useState<string>('');
  const [speakerId, setSpeakerId] = useState<string>('');
  const [recordingPlaybackUrl, setRecordingPlaybackUrl] = useState<string | null>(null);
  const [resendOk, setResendOk] = useState(false);

  const roomRef = useRef<Room | null>(null);
  const attachedAudioRef = useRef<HTMLMediaElement[]>([]);
  const phaseRef = useRef(phase);
  phaseRef.current = phase;
  const reconnectCountRef = useRef(0);
  const joinAtRef = useRef<string | null>(null);

  const markLiveWithCustomer = useCallback((next?: CallSessionDto) => {
    if (next) {
      setCall(next);
      if (next.recordingStatus === 'recording') setRecordingOn(true);
    }
    if (phaseRef.current !== 'connected' && phaseRef.current !== 'ended' && phaseRef.current !== 'error') {
      setElapsed(0);
      joinAtRef.current = new Date().toISOString();
    }
    setPhase((p) => {
      if (p === 'ended' || p === 'error') return p;
      return 'connected';
    });
  }, []);

  const teardownRoom = useCallback(async () => {
    for (const el of attachedAudioRef.current) {
      el.remove();
    }
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
  }, []);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      if (!callId) {
        setPhase('error');
        setError('Missing call id');
        return;
      }
      try {
        if (role === 'customer' && guestToken) {
          const session = await api.getGuestCallSession(guestToken);
          if (cancelled) return;
          if (session.call.callId !== callId) {
            setPhase('error');
            setError('This link does not match the call');
            return;
          }
          setCall(session.call);
          setWorkspaceName(session.workspaceName || PRODUCT_NAME);
          setContactName(session.contactName);
          if (session.ended) {
            setPhase('ended');
          } else {
            setPhase('ready');
          }
        } else {
          if (!localStorage.getItem('convosync_token')) {
            navigate('/login', { replace: true, state: { from: `/call/${callId}` } });
            return;
          }
          const { call: c } = await api.getCall(callId);
          if (cancelled) return;
          setCall(c);
          if (isTerminalStatus(c.status)) {
            setPhase('ended');
            return;
          }
          let link: string | null = null;
          try {
            link =
              localStorage.getItem(`call-guest:${callId}`) ||
              sessionStorage.getItem(`call-guest:${callId}`);
          } catch {
            /* ignore */
          }
          if (!link) {
            const refreshed = await api.refreshCallGuestLink(callId);
            if (cancelled) return;
            link = refreshed.guestUrl;
            try {
              localStorage.setItem(`call-guest:${callId}`, link);
            } catch {
              /* ignore */
            }
          }
          setGuestUrl(link);
          if (c.status === 'connected' || c.guestJoinedAt) {
            setPhase('connected');
          } else {
            setPhase('waiting');
          }
          void joinAsAgent(callId);
        }
      } catch (err) {
        if (!cancelled) {
          setPhase('error');
          setError(formatCatchError(err));
        }
      }
    }
    void load();
    return () => {
      cancelled = true;
      void teardownRoom();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- mount once per callId/token
  }, [callId, guestToken, role]);

  // Agent: socket lifecycle so waiting → connected when customer joins
  useEffect(() => {
    if (role !== 'agent' || !callId) return;
    const workspaceId = getWorkspaceId();
    if (workspaceId) connectSocket(workspaceId);
    const socket = getSocket();

    const onSameCall = (payload: CallSessionDto & { callId?: string }) =>
      payload?.callId === callId;

    const onParticipantJoined = (payload: CallSessionDto & { role?: string }) => {
      if (!onSameCall(payload)) return;
      if (payload.role === 'customer' || payload.guestJoinedAt) {
        markLiveWithCustomer(payload);
      }
    };

    const onConnected = (payload: CallSessionDto & { recordingStarted?: boolean }) => {
      if (!onSameCall(payload)) return;
      if (payload.recordingStarted || payload.recordingStatus === 'recording') {
        setRecordingOn(true);
      }
      markLiveWithCustomer(payload);
    };

    const onTerminal = (payload: CallSessionDto) => {
      if (!onSameCall(payload)) return;
      void teardownRoom();
      setCall(payload);
      setPhase('ended');
    };

    socket.on('call_participant_joined', onParticipantJoined);
    socket.on('call_connected', onConnected);
    socket.on('call_ended', onTerminal);
    socket.on('call_missed', onTerminal);
    socket.on('call_declined', onTerminal);
    socket.on('call_failed', onTerminal);

    return () => {
      socket.off('call_participant_joined', onParticipantJoined);
      socket.off('call_connected', onConnected);
      socket.off('call_ended', onTerminal);
      socket.off('call_missed', onTerminal);
      socket.off('call_declined', onTerminal);
      socket.off('call_failed', onTerminal);
    };
  }, [role, callId, markLiveWithCustomer, teardownRoom]);

  // Timer only after customer has joined (connected)
  useEffect(() => {
    if (phase !== 'connected') return;
    const t = setInterval(() => setElapsed((e) => e + 1), 1000);
    return () => clearInterval(t);
  }, [phase]);

  const joinLiveKit = async (token: string, url: string, mode: 'agent' | 'customer') => {
    if (mode === 'customer') setPhase('connecting');
    else if (phaseRef.current !== 'connected') setPhase('connecting');

    await teardownRoom();
    const room = new Room({ adaptiveStream: true, dynacast: true });
    roomRef.current = room;

    room.on(RoomEvent.TrackSubscribed, (track) => {
      if (track.kind === Track.Kind.Audio) {
        const el = track.attach();
        el.autoplay = true;
        document.body.appendChild(el);
        attachedAudioRef.current.push(el);
        if (speakerId && 'setSinkId' in el) {
          void (el as HTMLMediaElement & { setSinkId: (id: string) => Promise<void> })
            .setSinkId(speakerId)
            .catch(() => {});
        }
      }
    });

    if (mode === 'agent') {
      room.on(RoomEvent.ParticipantConnected, () => {
        markLiveWithCustomer();
      });
    }

    room.on(RoomEvent.Reconnecting, () => {
      setReconnecting(true);
      reconnectCountRef.current += 1;
    });
    room.on(RoomEvent.Reconnected, () => setReconnecting(false));
    room.on(RoomEvent.ConnectionQualityChanged, (quality, participant) => {
      if (participant !== room.localParticipant) return;
      if (quality === ConnectionQuality.Excellent) setNetQuality('excellent');
      else if (quality === ConnectionQuality.Good) setNetQuality('good');
      else if (quality === ConnectionQuality.Poor) setNetQuality('poor');
      else setNetQuality('unknown');
    });

    room.on(RoomEvent.Disconnected, () => {
      setReconnecting(false);
      setPhase((p) => (p === 'ended' ? p : 'ended'));
    });

    await room.connect(url, token);
    await room.localParticipant.setMicrophoneEnabled(true);
    if (micId) {
      await room.switchActiveDevice('audioinput', micId).catch(() => {});
    }

    try {
      const devices = await Room.getLocalDevices('audioinput');
      setMics(devices);
      const outs = await Room.getLocalDevices('audiooutput').catch(() => [] as MediaDeviceInfo[]);
      setSpeakers(outs);
    } catch {
      /* ignore */
    }

    if (mode === 'customer') {
      joinAtRef.current = new Date().toISOString();
      setPhase('connected');
      setElapsed(0);
      return;
    }

    const hasRemote = room.remoteParticipants.size > 0;
    if (hasRemote) {
      markLiveWithCustomer();
    } else if (phaseRef.current !== 'connected') {
      setPhase('waiting');
    }
  };

  const joinAsAgent = async (id: string) => {
    try {
      const { token, url } = await api.getCallToken(id);
      await joinLiveKit(token, url, 'agent');
      // Do not markCallConnected — connected only when customer joins
    } catch (err) {
      setError(formatCatchError(err));
      if (phaseRef.current !== 'connected') setPhase('waiting');
    }
  };

  const handleCustomerJoin = async () => {
    if (!guestToken || busy) return;
    setBusy(true);
    setError(null);
    setPhase('connecting'); // hide Join immediately — prevents End ghost-tap
    try {
      const { token, url } = await api.getGuestCallToken(guestToken);
      await joinLiveKit(token, url, 'customer');
    } catch (err) {
      setError(formatCatchError(err));
      setPhase('ready');
    } finally {
      setBusy(false);
    }
  };

  const collectAndSaveAnalytics = async () => {
    if (role !== 'agent' || !callId) return;
    const conn =
      typeof navigator !== 'undefined'
        ? (
            navigator as Navigator & {
              connection?: { effectiveType?: string; type?: string };
            }
          ).connection
        : undefined;
    const micLabel = mics.find((d) => d.deviceId === micId)?.label || mics[0]?.label || null;
    const analytics = {
      joinTime: joinAtRef.current,
      leaveTime: new Date().toISOString(),
      durationSeconds: elapsed,
      reconnectCount: reconnectCountRef.current,
      connectionQuality: netQuality,
      microphoneDevice: micLabel,
      browser: typeof navigator !== 'undefined' ? navigator.userAgent : null,
      platform: typeof navigator !== 'undefined' ? navigator.platform : null,
      connectionType: conn?.effectiveType || conn?.type || null,
      // Placeholders for future RTP stats pipeline
      packetLoss: null,
      jitter: null,
      roundTripTime: null,
      bitrate: null,
      mos: null,
    };
    await api.saveCallAnalytics(callId, analytics).catch(() => {});
  };

  const handleEnd = async () => {
    setBusy(true);
    try {
      await collectAndSaveAnalytics();
      if (role === 'customer' && guestToken) {
        await api.endGuestCall(guestToken);
      } else if (callId) {
        await api.endCall(callId);
      }
      await teardownRoom();
      setRecordingOn(false);
      if (role === 'agent' && callId) {
        for (let i = 0; i < 10; i++) {
          try {
            const rec = await api.getCallRecording(callId);
            if (rec.status === 'ready' && rec.url) {
              setRecordingPlaybackUrl(rec.url);
              break;
            }
            if (rec.status === 'failed' || rec.status === 'skipped') break;
          } catch {
            break;
          }
          await new Promise((r) => setTimeout(r, 2000));
        }
      }
      setPhase('ended');
    } catch (err) {
      setError(formatCatchError(err));
    } finally {
      setBusy(false);
    }
  };

  const handleResend = async () => {
    if (!callId) return;
    setBusy(true);
    try {
      const { guestUrl: url, sent } = await api.resendCallGuestLink(callId);
      setGuestUrl(url);
      try {
        localStorage.setItem(`call-guest:${callId}`, url);
      } catch {
        /* ignore */
      }
      setResendOk(sent);
      setTimeout(() => setResendOk(false), 3000);
      if (!sent) setError('Could not send on channel — copy the link instead');
    } catch (err) {
      setError(formatCatchError(err));
    } finally {
      setBusy(false);
    }
  };

  const handleCopy = async () => {
    if (!guestUrl) return;
    try {
      await navigator.clipboard.writeText(guestUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setError('Could not copy link');
    }
  };

  const toggleMute = async () => {
    const room = roomRef.current;
    if (!room) return;
    const next = !muted;
    await room.localParticipant.setMicrophoneEnabled(!next);
    setMuted(next);
  };

  const onMicChange = async (id: string) => {
    setMicId(id);
    const room = roomRef.current;
    if (room && id) await room.switchActiveDevice('audioinput', id).catch(() => {});
  };

  const onSpeakerChange = async (id: string) => {
    setSpeakerId(id);
    for (const el of attachedAudioRef.current) {
      if (id && 'setSinkId' in el) {
        void (el as HTMLMediaElement & { setSinkId: (x: string) => Promise<void> })
          .setSinkId(id)
          .catch(() => {});
      }
    }
  };

  useEffect(() => {
    if (phase !== 'ended') return;
    // Give agent time to play recording before inbox redirect
    const delay = role === 'agent' && recordingPlaybackUrl ? 12000 : 3500;
    const t = setTimeout(() => {
      if (role !== 'agent') return;
      const conversationId = call?.conversationId;
      navigate(pathForTab('inbox'), { replace: true });
      if (conversationId) {
        window.setTimeout(() => dispatchOpenInboxConversation(conversationId), 100);
      }
    }, delay);
    return () => clearTimeout(t);
  }, [phase, role, call?.conversationId, navigate, recordingPlaybackUrl]);

  const statusLabel =
    phase === 'waiting' && role === 'agent'
      ? 'Waiting for customer…'
      : phase === 'ready' && role === 'customer'
        ? 'Tap Join Call to allow microphone access'
        : phase === 'connecting'
          ? 'Connecting…'
          : phase === 'connected'
            ? 'Connected'
            : null;

  // —— Customer: mobile-first full-screen call UI ——
  if (role === 'customer') {
    return (
      <div
        className="min-h-[100dvh] flex flex-col bg-slate-950 text-white"
        style={{
          paddingTop: 'max(12px, env(safe-area-inset-top))',
          paddingBottom: 'max(16px, env(safe-area-inset-bottom))',
        }}
      >
        <header className="flex items-center justify-center gap-2 px-4 pt-2 pb-1 shrink-0">
          <img src={PRODUCT_LOGO} alt="" className="h-8 w-8 object-contain" />
          <span className="font-display text-base font-bold tracking-tight truncate max-w-[70vw]">
            {workspaceName}
          </span>
        </header>

        <main className="flex-1 flex flex-col items-center justify-center px-6 text-center">
          {phase === 'loading' && (
            <>
              <Loader2 className="h-10 w-10 animate-spin text-emerald-400 mb-4" />
              <p className="text-sm text-slate-300">Preparing call…</p>
            </>
          )}

          {phase === 'error' && (
            <>
              <p className="text-base font-bold text-red-400 mb-2">{error || 'Something went wrong'}</p>
              <p className="text-sm text-slate-400">Ask the business to send a new call link.</p>
            </>
          )}

          {phase === 'ended' && (
            <>
              <div className="h-20 w-20 rounded-full bg-slate-800 flex items-center justify-center mb-5">
                <PhoneOff className="h-9 w-9 text-slate-400" />
              </div>
              <p className="text-2xl font-bold mb-2">Call ended</p>
              <p className="text-sm text-slate-400">Thank you for calling. You can close this tab.</p>
            </>
          )}

          {(phase === 'ready' || phase === 'connecting' || phase === 'connected') && (
            <>
              {reconnecting && (
                <div className="mb-4 w-full max-w-sm rounded-2xl bg-amber-500/20 border border-amber-400/40 px-4 py-2.5 text-sm font-semibold text-amber-200">
                  Reconnecting…
                </div>
              )}
              <div className="h-24 w-24 rounded-full bg-emerald-500/15 border border-emerald-400/30 flex items-center justify-center mb-6">
                {phase === 'connecting' ? (
                  <Loader2 className="h-10 w-10 animate-spin text-emerald-400" />
                ) : (
                  <Phone className="h-10 w-10 text-emerald-400" />
                )}
              </div>
              <h1 className="text-2xl font-bold tracking-tight mb-2">
                Call with {workspaceName}
              </h1>
              {statusLabel && <p className="text-sm text-slate-400 mb-1">{statusLabel}</p>}
              {phase === 'connected' && (
                <p className="mt-3 font-mono text-4xl font-bold tabular-nums tracking-tight">
                  {formatTimer(elapsed)}
                </p>
              )}
              {recordingOn && phase === 'connected' && (
                <p className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-red-400">
                  <Circle className="h-2.5 w-2.5 fill-current" />
                  Recording
                </p>
              )}
              {error && (
                <p className="mt-4 w-full max-w-sm text-sm font-medium text-red-300 bg-red-500/10 border border-red-500/30 rounded-2xl px-4 py-3">
                  {error}
                </p>
              )}
            </>
          )}
        </main>

        {/* Bottom actions — one primary CTA at a time (avoids Join+End double-tap) */}
        <footer className="px-5 pt-2 shrink-0 space-y-3 max-w-md mx-auto w-full">
          {phase === 'ready' && (
            <button
              type="button"
              disabled={busy}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                void handleCustomerJoin();
              }}
              className="w-full min-h-14 rounded-full bg-emerald-500 active:bg-emerald-600 text-white text-base font-bold disabled:opacity-60 touch-manipulation inline-flex items-center justify-center gap-2"
            >
              {busy ? <Loader2 className="h-5 w-5 animate-spin" /> : <Phone className="h-5 w-5" />}
              Join Call
            </button>
          )}

          {phase === 'connecting' && (
            <p className="text-center text-sm text-slate-400 py-3">Connecting to the call…</p>
          )}

          {phase === 'connected' && (
            <div className="flex items-center justify-center gap-5 pb-1">
              <button
                type="button"
                onClick={() => void toggleMute()}
                className={`h-14 w-14 rounded-full inline-flex items-center justify-center touch-manipulation ${
                  muted ? 'bg-white text-slate-900' : 'bg-slate-800 text-white'
                }`}
                aria-label={muted ? 'Unmute' : 'Mute'}
              >
                {muted ? <MicOff className="h-6 w-6" /> : <Mic className="h-6 w-6" />}
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  void handleEnd();
                }}
                className="h-16 w-16 rounded-full bg-red-500 active:bg-red-600 text-white inline-flex items-center justify-center touch-manipulation disabled:opacity-60"
                aria-label="End call"
              >
                {busy ? <Loader2 className="h-6 w-6 animate-spin" /> : <PhoneOff className="h-7 w-7" />}
              </button>
            </div>
          )}
        </footer>
      </div>
    );
  }

  // —— Agent call page ——
  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-4 py-10"
      style={{
        background:
          'radial-gradient(120% 80% at 50% 0%, #d1fae5 0%, transparent 55%), linear-gradient(180deg, #f0fdf4 0%, #f8faf9 100%)',
      }}
    >
      <div className="w-full max-w-md">
        <div className="flex items-center gap-2.5 mb-8 justify-center">
          <img src={PRODUCT_LOGO} alt="" className="h-9 w-9 object-contain" />
          <span className="font-display text-lg font-bold text-slate-900">{workspaceName}</span>
        </div>

        <div className="rounded-3xl border border-slate-200/80 bg-white shadow-xl shadow-emerald-900/5 p-6 sm:p-8">
          {phase === 'loading' && (
            <div className="flex flex-col items-center gap-3 py-10 text-slate-500">
              <Loader2 className="h-8 w-8 animate-spin text-channel-green" />
              <p className="text-sm font-medium">Preparing call…</p>
            </div>
          )}

          {phase === 'error' && (
            <div className="text-center space-y-3 py-6">
              <p className="text-sm font-bold text-red-600">{error || 'Something went wrong'}</p>
              <Link to={pathForTab('inbox')} className="text-sm font-semibold text-emerald-700 underline">
                Back to inbox
              </Link>
            </div>
          )}

          {phase === 'ended' && (
            <div className="text-center space-y-3 py-6">
              <p className="text-lg font-bold text-slate-900">Call ended</p>
              <p className="text-sm text-slate-500">Returning to your conversation…</p>
              {recordingPlaybackUrl && (
                <div className="mt-4 text-left space-y-2">
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wide">
                    Recording
                  </p>
                  <audio controls src={recordingPlaybackUrl} className="w-full" />
                </div>
              )}
            </div>
          )}

          {(phase === 'waiting' || phase === 'connecting' || phase === 'connected') && (
            <>
              {reconnecting && (
                <div className="mb-4 rounded-xl bg-amber-50 border border-amber-200 px-3 py-2 text-xs font-semibold text-amber-800 text-center">
                  Reconnecting…
                </div>
              )}

              <div className="text-center mb-6">
                <div className="mx-auto h-16 w-16 rounded-full bg-emerald-50 text-channel-green flex items-center justify-center mb-4">
                  {phase === 'waiting' ? (
                    <Loader2 className="h-7 w-7 animate-spin" />
                  ) : (
                    <Phone className="h-7 w-7" />
                  )}
                </div>
                <h1 className="text-xl font-bold text-slate-900 tracking-tight">
                  {contactName || 'Customer call'}
                </h1>
                {statusLabel && (
                  <p className="mt-2 text-sm text-slate-500 font-medium">{statusLabel}</p>
                )}
                {phase === 'connected' && (
                  <p className="mt-3 font-mono text-2xl font-bold text-slate-800 tabular-nums">
                    {formatTimer(elapsed)}
                  </p>
                )}
                <div className="mt-3 flex items-center justify-center gap-3 text-xs font-semibold text-slate-500">
                  {recordingOn && (
                    <span className="inline-flex items-center gap-1 text-red-600">
                      <Circle className="h-2.5 w-2.5 fill-current" />
                      Recording
                    </span>
                  )}
                  {phase === 'connected' && netQuality !== 'unknown' && (
                    <span
                      className={
                        netQuality === 'poor'
                          ? 'text-amber-600'
                          : netQuality === 'excellent'
                            ? 'text-emerald-600'
                            : ''
                      }
                    >
                      Network: {netQuality}
                    </span>
                  )}
                </div>
              </div>

              {error && (
                <p className="mb-4 text-xs font-medium text-red-600 bg-red-50 border border-red-100 rounded-xl px-3 py-2">
                  {error}
                </p>
              )}

              {guestUrl && phase === 'waiting' && (
                <div className="mb-4 space-y-2">
                  <p className="text-meta font-bold text-slate-500 uppercase tracking-wide">
                    Customer link
                  </p>
                  <div className="flex gap-2">
                    <input
                      readOnly
                      value={guestUrl}
                      className="flex-1 min-w-0 text-xs rounded-xl border border-slate-200 px-3 py-2.5 bg-slate-50 text-slate-700"
                    />
                    <button
                      type="button"
                      onClick={() => void handleCopy()}
                      className="inline-flex items-center gap-1.5 px-3 rounded-xl border border-slate-200 text-sm font-bold text-slate-700 hover:bg-slate-50 cursor-pointer shrink-0"
                    >
                      {copied ? <Check className="h-4 w-4 text-channel-green" /> : <Copy className="h-4 w-4" />}
                      {copied ? 'Copied' : 'Copy'}
                    </button>
                  </div>
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => void handleResend()}
                    className="w-full min-h-10 rounded-xl border border-slate-200 text-sm font-bold text-slate-700 hover:bg-slate-50 cursor-pointer inline-flex items-center justify-center gap-2 disabled:opacity-60"
                  >
                    {resendOk ? <Check className="h-4 w-4 text-channel-green" /> : <Send className="h-4 w-4" />}
                    {resendOk ? 'Sent on channel' : 'Resend link'}
                  </button>
                </div>
              )}

              {(phase === 'connected' || phase === 'waiting') && (mics.length > 0 || speakers.length > 0) && (
                <div className="mb-4 space-y-2">
                  {mics.length > 0 && (
                    <label className="block text-xs font-semibold text-slate-500">
                      Microphone
                      <select
                        value={micId}
                        onChange={(e) => void onMicChange(e.target.value)}
                        className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-800 bg-white"
                      >
                        {mics.map((d) => (
                          <option key={d.deviceId} value={d.deviceId}>
                            {d.label || 'Microphone'}
                          </option>
                        ))}
                      </select>
                    </label>
                  )}
                  {speakers.length > 0 && (
                    <label className="block text-xs font-semibold text-slate-500">
                      Speaker
                      <select
                        value={speakerId}
                        onChange={(e) => void onSpeakerChange(e.target.value)}
                        className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-800 bg-white"
                      >
                        {speakers.map((d) => (
                          <option key={d.deviceId} value={d.deviceId}>
                            {d.label || 'Speaker'}
                          </option>
                        ))}
                      </select>
                    </label>
                  )}
                </div>
              )}

              <div className="flex flex-col gap-2">
                {(phase === 'connected' || phase === 'waiting' || phase === 'connecting') && (
                  <button
                    type="button"
                    onClick={() => void toggleMute()}
                    className="w-full min-h-11 rounded-full border border-slate-200 text-sm font-bold text-slate-800 hover:bg-slate-50 cursor-pointer inline-flex items-center justify-center gap-2"
                  >
                    {muted ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                    {muted ? 'Unmute' : 'Mute'}
                  </button>
                )}

                <button
                  type="button"
                  disabled={busy}
                  onClick={() => void handleEnd()}
                  className="w-full min-h-12 rounded-full bg-red-500 hover:bg-red-600 text-white text-sm font-bold disabled:opacity-60 cursor-pointer inline-flex items-center justify-center gap-2"
                >
                  {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <PhoneOff className="h-4 w-4" />}
                  {phase === 'waiting' ? 'Cancel call' : 'End call'}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
