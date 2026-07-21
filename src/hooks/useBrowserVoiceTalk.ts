import { useCallback, useEffect, useRef, useState } from 'react';

export type VoiceStatus =
  | 'idle'
  | 'requesting'
  | 'listening'
  | 'recording'
  | 'processing'
  | 'speaking'
  | 'error';

type UtteranceHandler = (blob: Blob, meta: { durationMs: number }) => void | Promise<void>;

function pickRecorderMime(): string {
  const candidates = [
    'audio/webm;codecs=opus',
    'audio/webm',
    'audio/ogg;codecs=opus',
    'audio/mp4',
  ];
  for (const c of candidates) {
    if (typeof MediaRecorder !== 'undefined' && MediaRecorder.isTypeSupported(c)) return c;
  }
  return '';
}

/**
 * Real call-style preview: mic + energy VAD + MediaRecorder → onUtterance(blob).
 * STT/TTS go through the agent's selected providers (backend → voice-agent).
 */
export function useBrowserVoiceTalk(_language?: string) {
  const [inCall, setInCall] = useState(false);
  const [status, setStatus] = useState<VoiceStatus>('idle');
  const [error, setError] = useState<string | null>(null);
  const [level, setLevel] = useState(0);

  const streamRef = useRef<MediaStream | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const vadTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const inCallRef = useRef(false);
  const pausedRef = useRef(false);
  const speakingRef = useRef(false);
  const speechStartedAtRef = useRef<number | null>(null);
  const silenceMsRef = useRef(0);
  const onUtteranceRef = useRef<UtteranceHandler | null>(null);
  const audioElRef = useRef<HTMLAudioElement | null>(null);
  const objectUrlRef = useRef<string | null>(null);

  const SPEECH_THRESHOLD = 0.015;
  const SILENCE_END_MS = 850;
  const MIN_UTTERANCE_MS = 400;
  const MAX_UTTERANCE_MS = 18_000;
  const TICK_MS = 50;

  const clearAudioEl = useCallback(() => {
    const el = audioElRef.current;
    if (el) {
      try {
        el.pause();
        el.removeAttribute('src');
        el.load();
      } catch {
        /* ignore */
      }
    }
    audioElRef.current = null;
    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current);
      objectUrlRef.current = null;
    }
  }, []);

  const stopSpeaking = useCallback(() => {
    clearAudioEl();
  }, [clearAudioEl]);

  const stopVad = () => {
    if (vadTimerRef.current) {
      clearInterval(vadTimerRef.current);
      vadTimerRef.current = null;
    }
  };

  const stopRecorder = useCallback((finalize: boolean) => {
    const rec = recorderRef.current;
    recorderRef.current = null;
    if (!rec) return;
    if (rec.state !== 'inactive') {
      try {
        if (finalize) rec.requestData();
        rec.stop();
      } catch {
        /* ignore */
      }
    }
  }, []);

  const teardownMedia = useCallback(() => {
    stopVad();
    stopRecorder(false);
    chunksRef.current = [];
    analyserRef.current = null;
    try {
      void audioCtxRef.current?.close();
    } catch {
      /* ignore */
    }
    audioCtxRef.current = null;
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  }, [stopRecorder]);

  const emitUtterance = useCallback((blob: Blob, durationMs: number) => {
    if (!inCallRef.current || blob.size < 600) {
      pausedRef.current = false;
      speakingRef.current = false;
      if (inCallRef.current) setStatus('listening');
      return;
    }
    pausedRef.current = true;
    setStatus('processing');
    void Promise.resolve(onUtteranceRef.current?.(blob, { durationMs })).catch((err) => {
      console.error('[voice-preview] utterance handler failed', err);
      pausedRef.current = false;
      if (inCallRef.current) setStatus('listening');
    });
  }, []);

  const startRecorder = useCallback(() => {
    const stream = streamRef.current;
    if (!stream || recorderRef.current || pausedRef.current) return;

    const mime = pickRecorderMime();
    let rec: MediaRecorder;
    try {
      rec = mime ? new MediaRecorder(stream, { mimeType: mime }) : new MediaRecorder(stream);
    } catch (err) {
      console.error('[voice-preview] MediaRecorder failed', err);
      setError('Recording not supported in this browser.');
      return;
    }

    chunksRef.current = [];
    rec.ondataavailable = (ev) => {
      if (ev.data.size > 0) chunksRef.current.push(ev.data);
    };
    rec.onstop = () => {
      const parts = chunksRef.current;
      chunksRef.current = [];
      const started = speechStartedAtRef.current;
      speechStartedAtRef.current = null;
      speakingRef.current = false;
      const durationMs = started ? Date.now() - started : 0;
      if (!inCallRef.current || durationMs < MIN_UTTERANCE_MS) {
        if (inCallRef.current && !pausedRef.current) setStatus('listening');
        return;
      }
      const type = rec.mimeType || mime || 'audio/webm';
      emitUtterance(new Blob(parts, { type }), durationMs);
    };

    recorderRef.current = rec;
    speechStartedAtRef.current = Date.now();
    silenceMsRef.current = 0;
    speakingRef.current = true;
    setStatus('recording');
    try {
      rec.start(250);
    } catch (err) {
      console.error('[voice-preview] recorder.start failed', err);
      recorderRef.current = null;
      speakingRef.current = false;
    }
  }, [emitUtterance]);

  const runVadTick = useCallback(() => {
    if (!inCallRef.current) return;
    const analyser = analyserRef.current;
    if (!analyser) return;

    const data = new Uint8Array(analyser.fftSize);
    analyser.getByteTimeDomainData(data);
    let sum = 0;
    for (let i = 0; i < data.length; i++) {
      const v = (data[i] - 128) / 128;
      sum += v * v;
    }
    const rms = Math.sqrt(sum / data.length);
    setLevel(rms);

    if (pausedRef.current) return;

    if (!speakingRef.current) {
      if (rms >= SPEECH_THRESHOLD) startRecorder();
      return;
    }

    const started = speechStartedAtRef.current ?? Date.now();
    const elapsed = Date.now() - started;
    if (rms < SPEECH_THRESHOLD) silenceMsRef.current += TICK_MS;
    else silenceMsRef.current = 0;

    if (silenceMsRef.current >= SILENCE_END_MS || elapsed >= MAX_UTTERANCE_MS) {
      stopRecorder(true);
    }
  }, [startRecorder, stopRecorder]);

  const resumeListening = useCallback(() => {
    if (!inCallRef.current) return;
    pausedRef.current = false;
    speakingRef.current = false;
    silenceMsRef.current = 0;
    setStatus('listening');
  }, []);

  /** Play provider TTS audio; prefers server `ttsMs` when provided. */
  const speakAudio = useCallback(
    async (blob: Blob, opts?: { ttsMs?: number }): Promise<number> => {
      if (!blob.size) {
        resumeListening();
        return opts?.ttsMs ?? 0;
      }
      stopSpeaking();
      pausedRef.current = true;
      stopRecorder(false);
      setStatus('speaking');

      const url = URL.createObjectURL(blob);
      objectUrlRef.current = url;
      const el = new Audio(url);
      audioElRef.current = el;
      const started = performance.now();

      try {
        await new Promise<void>((resolve, reject) => {
          el.onended = () => resolve();
          el.onerror = () => reject(new Error('TTS playback failed'));
          void el.play().catch(reject);
        });
      } catch (err) {
        console.error('[voice-preview] TTS play failed', err);
      } finally {
        clearAudioEl();
      }

      const playMs = Math.round(performance.now() - started);
      resumeListening();
      return opts?.ttsMs && opts.ttsMs > 0 ? opts.ttsMs : playMs;
    },
    [clearAudioEl, resumeListening, stopRecorder, stopSpeaking]
  );

  const hangUp = useCallback(() => {
    inCallRef.current = false;
    pausedRef.current = false;
    speakingRef.current = false;
    stopSpeaking();
    teardownMedia();
    setInCall(false);
    setStatus('idle');
    setError(null);
    setLevel(0);
  }, [stopSpeaking, teardownMedia]);

  const startCall = useCallback(
    async (onUtterance: UtteranceHandler) => {
      onUtteranceRef.current = onUtterance;
      if (inCallRef.current) return;

      if (typeof MediaRecorder === 'undefined') {
        setError('MediaRecorder not supported. Use Chrome or Edge.');
        setStatus('error');
        return;
      }

      setError(null);
      setStatus('requesting');
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
          },
        });
        streamRef.current = stream;

        const Ctx =
          window.AudioContext ||
          (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        const ctx = new Ctx();
        await ctx.resume().catch(() => {});
        audioCtxRef.current = ctx;
        const source = ctx.createMediaStreamSource(stream);
        const analyser = ctx.createAnalyser();
        analyser.fftSize = 2048;
        source.connect(analyser);
        analyserRef.current = analyser;

        inCallRef.current = true;
        pausedRef.current = false;
        speakingRef.current = false;
        setInCall(true);
        setStatus('listening');
        stopVad();
        vadTimerRef.current = setInterval(runVadTick, TICK_MS);
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : 'Microphone permission denied. Allow mic in browser settings.'
        );
        setStatus('error');
        teardownMedia();
      }
    },
    [runVadTick, teardownMedia]
  );

  const setOnUtterance = useCallback((handler: UtteranceHandler) => {
    onUtteranceRef.current = handler;
  }, []);

  useEffect(() => {
    return () => {
      inCallRef.current = false;
      clearAudioEl();
      teardownMedia();
    };
  }, [clearAudioEl, teardownMedia]);

  return {
    inCall,
    status,
    error,
    level,
    interimText: '',
    supported: typeof MediaRecorder !== 'undefined',
    isActive: inCall,
    startCall,
    hangUp,
    speakAudio,
    stopSpeaking,
    resumeListening,
    setOnUtterance,
  };
}
