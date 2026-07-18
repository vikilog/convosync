/**
 * Call recordings + Faster-Whisper transcripts — right panel of inbox.
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  Loader2,
  Phone,
  Trash2,
  FileText,
  RefreshCw,
  Upload,
  X,
  Sparkles,
} from 'lucide-react';
import { api, formatCatchError, type CallSessionDto } from '../../lib/api';

type Row = {
  callId: string;
  label: string;
  durationLabel: string | null;
  status: string;
  playUrl: string | null;
  transcriptStatus: string | null;
  transcriptText: string | null;
  transcriptLanguage: string | null;
  transcriptError: string | null;
};

/** Whisper codes used for India support calls */
const STT_LANGUAGES: { value: string; label: string }[] = [
  { value: 'auto', label: 'Auto' },
  { value: 'hi', label: 'Hindi' },
  { value: 'en', label: 'English' },
  { value: 'bn', label: 'Bengali' },
  { value: 'ta', label: 'Tamil' },
  { value: 'te', label: 'Telugu' },
  { value: 'mr', label: 'Marathi' },
  { value: 'gu', label: 'Gujarati' },
  { value: 'kn', label: 'Kannada' },
  { value: 'ml', label: 'Malayalam' },
  { value: 'pa', label: 'Punjabi' },
  { value: 'ur', label: 'Urdu' },
];

function formatWhen(iso: string | null | undefined) {
  if (!iso) return 'Call';
  try {
    return new Date(iso).toLocaleString(undefined, {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return 'Call';
  }
}

function formatDuration(seconds: number | null | undefined) {
  if (seconds == null || seconds < 0) return null;
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

/** ponytail: extractive preview until LLM call-summary ships */
function transcriptOverview(text: string | null | undefined, maxChars = 320): string | null {
  if (!text?.trim()) return null;
  const cleaned = text.replace(/\s+/g, ' ').trim();
  if (cleaned.length <= maxChars) return cleaned;
  const slice = cleaned.slice(0, maxChars);
  const breakAt = Math.max(
    slice.lastIndexOf('।'),
    slice.lastIndexOf('.'),
    slice.lastIndexOf('!'),
    slice.lastIndexOf('?'),
    slice.lastIndexOf(' ')
  );
  const cut = breakAt > maxChars * 0.4 ? slice.slice(0, breakAt + 1) : slice;
  return `${cut.trim()}…`;
}

function CallDetailDialog({
  row,
  sttLanguage,
  transcribing,
  onClose,
  onTranscribe,
}: {
  row: Row;
  sttLanguage: string;
  transcribing: boolean;
  onClose: () => void;
  onTranscribe: () => void;
}) {
  const overview = transcriptOverview(row.transcriptText);
  const langLabel =
    STT_LANGUAGES.find((l) => l.value === row.transcriptLanguage)?.label ||
    row.transcriptLanguage;

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-end justify-center bg-black/40 p-0 sm:items-center sm:p-4"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="call-detail-title"
        className="flex max-h-[92vh] w-full max-w-2xl flex-col overflow-hidden rounded-t-2xl border border-slate-200 bg-white shadow-2xl sm:rounded-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex shrink-0 items-start justify-between gap-3 border-b border-slate-200 px-5 py-4">
          <div className="min-w-0">
            <h2 id="call-detail-title" className="text-base font-bold text-gray-900">
              Call recording
            </h2>
            <p className="mt-0.5 text-xs font-semibold text-gray-500">
              {row.label}
              {row.durationLabel ? ` · ${row.durationLabel}` : ''}
              {langLabel ? ` · ${langLabel}` : ''}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-gray-400 hover:bg-slate-50 hover:text-gray-700 cursor-pointer"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-5 py-4">
          {row.playUrl ? (
            <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-3">
              <p className="mb-2 text-[11px] font-bold uppercase tracking-wide text-gray-400">
                Recording
              </p>
              <audio controls preload="metadata" src={row.playUrl} className="w-full" />
            </div>
          ) : row.status === 'processing' || row.status === 'recording' ? (
            <p className="text-sm text-slate-500">Recording still processing…</p>
          ) : row.status === 'failed' ? (
            <p className="text-sm text-red-600">Recording failed.</p>
          ) : null}

          <section className="rounded-xl border border-sky-100 bg-sky-50/60 px-4 py-3">
            <div className="mb-2 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide text-sky-700">
              <Sparkles className="h-3.5 w-3.5" />
              Summary
            </div>
            {row.transcriptStatus === 'failed' ? (
              <p className="text-sm text-red-600">{row.transcriptError || 'Transcription failed'}</p>
            ) : overview ? (
              <p className="text-sm leading-relaxed text-slate-800">{overview}</p>
            ) : row.transcriptStatus === 'pending' ||
              row.transcriptStatus === 'processing' ||
              transcribing ? (
              <p className="flex items-center gap-2 text-sm text-slate-500">
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                Generating transcript…
              </p>
            ) : (
              <p className="text-sm text-slate-500">
                No transcript yet. Run transcription to generate a summary.
              </p>
            )}
          </section>

          <section>
            <div className="mb-2 flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide text-gray-400">
                <FileText className="h-3.5 w-3.5" />
                Full transcript
                {row.transcriptStatus && row.transcriptStatus !== 'ready'
                  ? ` · ${row.transcriptStatus}`
                  : ''}
              </div>
              {row.status === 'ready' && (
                <button
                  type="button"
                  title={`Transcribe (${STT_LANGUAGES.find((l) => l.value === sttLanguage)?.label || sttLanguage})`}
                  disabled={
                    transcribing ||
                    row.transcriptStatus === 'processing' ||
                    row.transcriptStatus === 'pending'
                  }
                  onClick={onTranscribe}
                  className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] font-bold text-emerald-700 hover:bg-emerald-50 disabled:opacity-50 cursor-pointer"
                >
                  {transcribing ||
                  row.transcriptStatus === 'processing' ||
                  row.transcriptStatus === 'pending' ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    <RefreshCw className="h-3 w-3" />
                  )}
                  {row.transcriptText ? 'Re-run' : 'Transcribe'}
                </button>
              )}
            </div>
            <div className="max-h-[40vh] overflow-y-auto rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm leading-relaxed text-slate-800 whitespace-pre-wrap">
              {row.transcriptStatus === 'failed' ? (
                <span className="text-red-600">{row.transcriptError || 'Failed'}</span>
              ) : row.transcriptText ? (
                row.transcriptText
              ) : (
                <span className="text-slate-400">Transcript will appear here after STT finishes.</span>
              )}
            </div>
          </section>
        </div>
      </div>
    </div>,
    document.body
  );
}

/** ponytail: module cache — tab remount / chat revisit shouldn't hammer STT + blob APIs */
const CACHE_TTL_MS = 60_000;
const rowsCache = new Map<string, { rows: Row[]; at: number }>();
const inflight = new Map<string, Promise<Row[]>>();

function revokeBlobUrl(url: string | null | undefined) {
  if (url?.startsWith('blob:')) URL.revokeObjectURL(url);
}

function writeRowsCache(conversationId: string, rows: Row[]) {
  const prev = rowsCache.get(conversationId)?.rows;
  if (prev) {
    const keep = new Set(rows.map((r) => r.playUrl).filter(Boolean));
    for (const r of prev) {
      if (r.playUrl && !keep.has(r.playUrl)) revokeBlobUrl(r.playUrl);
    }
  }
  rowsCache.set(conversationId, { rows, at: Date.now() });
}

async function fetchCallRows(conversationId: string, reuse: Row[]): Promise<Row[]> {
  const reuseById = new Map(reuse.map((r) => [r.callId, r]));
  const { calls } = await api.listCalls({
    conversationId,
    limit: '20',
  });

  const withRec = calls.filter(
    (c) =>
      c.recordingStatus === 'ready' ||
      c.recordingStatus === 'processing' ||
      c.recordingStatus === 'recording' ||
      c.recordingStatus === 'failed' ||
      c.transcriptStatus === 'ready' ||
      c.transcriptStatus === 'processing' ||
      c.transcriptStatus === 'pending' ||
      c.transcriptStatus === 'failed'
  );

  return Promise.all(
    withRec.map(async (c: CallSessionDto) => {
      const prev = reuseById.get(c.callId);
      const base: Row = {
        callId: c.callId,
        label: formatWhen(c.endedAt || c.connectedAt || c.createdAt),
        durationLabel: formatDuration(c.recordingDurationSeconds ?? c.durationSeconds),
        status: c.recordingStatus || 'unknown',
        playUrl: prev?.playUrl ?? null,
        transcriptStatus: c.transcriptStatus ?? null,
        transcriptText: prev?.transcriptText ?? null,
        transcriptLanguage: c.transcriptLanguage ?? prev?.transcriptLanguage ?? null,
        transcriptError: null,
      };

      if (c.recordingStatus === 'ready' && !base.playUrl) {
        try {
          const rec = await api.getCallRecording(c.callId);
          if (rec.url && rec.url.includes('/recording/file')) {
            const blob = await api.fetchCallRecordingBlob(c.callId);
            base.playUrl = URL.createObjectURL(blob);
          } else {
            base.playUrl = rec.url;
          }
          base.status = rec.status || base.status;
        } catch {
          try {
            const blob = await api.fetchCallRecordingBlob(c.callId);
            base.playUrl = URL.createObjectURL(blob);
          } catch {
            base.playUrl = c.recordingUrl ?? null;
          }
        }
      } else if (c.recordingStatus === 'ready' && prev?.status) {
        base.status = prev.status;
      }

      const needTranscript =
        c.transcriptStatus === 'ready' ||
        c.transcriptStatus === 'failed' ||
        c.transcriptStatus === 'processing' ||
        c.transcriptStatus === 'pending';
      if (needTranscript && !(prev?.transcriptText && c.transcriptStatus === 'ready')) {
        try {
          const t = await api.getCallTranscript(c.callId);
          base.transcriptStatus = t.status;
          base.transcriptText = t.text;
          base.transcriptLanguage = t.language;
          base.transcriptError = t.error;
        } catch {
          /* keep list fields */
        }
      } else if (c.transcriptStatus === 'ready' && prev?.transcriptText) {
        base.transcriptText = prev.transcriptText;
        base.transcriptError = prev.transcriptError;
      }

      return base;
    })
  );
}

export function ConversationCallRecordings({ conversationId }: { conversationId: string }) {
  const cached = rowsCache.get(conversationId);
  const [rows, setRows] = useState<Row[]>(() => cached?.rows ?? []);
  const [loading, setLoading] = useState(() => !cached);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [transcribingId, setTranscribingId] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [sttLanguage, setSttLanguage] = useState('hi');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const rowsRef = useRef(rows);
  rowsRef.current = rows;

  const applyRows = useCallback((conversationId: string, next: Row[]) => {
    writeRowsCache(conversationId, next);
    setRows(next);
  }, []);

  const load = useCallback(
    async (opts?: { force?: boolean }) => {
      const hit = rowsCache.get(conversationId);
      if (hit) {
        setRows(hit.rows);
        setLoading(false);
      } else {
        setLoading(true);
      }

      const stale = !hit || Date.now() - hit.at > CACHE_TTL_MS;
      if (!opts?.force && !stale) return;

      setError(null);
      let pending = inflight.get(conversationId);
      if (!pending) {
        pending = fetchCallRows(conversationId, hit?.rows ?? rowsRef.current).finally(() => {
          inflight.delete(conversationId);
        });
        inflight.set(conversationId, pending);
      }

      try {
        const next = await pending;
        applyRows(conversationId, next);
      } catch (err) {
        if (!hit) setError(formatCatchError(err));
      } finally {
        setLoading(false);
      }
    },
    [applyRows, conversationId]
  );

  useEffect(() => {
    const hit = rowsCache.get(conversationId);
    setRows(hit?.rows ?? []);
    setLoading(!hit);
    setSelectedId(null);
    setError(null);
  }, [conversationId]);

  useEffect(() => {
    void load();
  }, [load]);

  const sttLangOpt = sttLanguage === 'auto' ? undefined : sttLanguage;
  const selected = rows.find((r) => r.callId === selectedId) ?? null;

  const handleDelete = async (callId: string) => {
    if (!window.confirm('Delete this call recording? This cannot be undone.')) return;
    setDeletingId(callId);
    setError(null);
    try {
      await api.deleteCallRecording(callId);
      const removed = rows.find((r) => r.callId === callId);
      revokeBlobUrl(removed?.playUrl);
      const next = rows.filter((r) => r.callId !== callId);
      applyRows(conversationId, next);
      if (selectedId === callId) setSelectedId(null);
    } catch (err) {
      setError(formatCatchError(err));
    } finally {
      setDeletingId(null);
    }
  };

  const handleTranscribe = async (callId: string) => {
    setTranscribingId(callId);
    setError(null);
    try {
      await api.queueCallTranscribe(callId, { language: sttLangOpt });
      const markPending = (list: Row[]) =>
        list.map((r) =>
          r.callId === callId ? { ...r, transcriptStatus: 'pending', transcriptError: null } : r
        );
      applyRows(conversationId, markPending(rowsRef.current));
      for (let i = 0; i < 30; i++) {
        await new Promise((r) => setTimeout(r, 3000));
        const t = await api.getCallTranscript(callId);
        if (t.status === 'ready' || t.status === 'failed' || t.status === 'skipped') {
          const next = rowsRef.current.map((r) =>
            r.callId === callId
              ? {
                  ...r,
                  transcriptStatus: t.status,
                  transcriptText: t.text,
                  transcriptLanguage: t.language,
                  transcriptError: t.error,
                }
              : r
          );
          applyRows(conversationId, next);
          break;
        }
      }
    } catch (err) {
      setError(formatCatchError(err));
    } finally {
      setTranscribingId(null);
    }
  };

  const handleUpload = async (file: File | null | undefined) => {
    if (!file) return;
    setUploading(true);
    setError(null);
    try {
      await api.uploadCallRecording(conversationId, file, { language: sttLangOpt });
      await load({ force: true });
    } catch (err) {
      setError(formatCatchError(err));
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
      <div className="flex items-center justify-between gap-2 px-1">
        <h4 className="text-xs font-bold text-gray-500 flex items-center gap-1.5">
          <Phone className="h-3.5 w-3.5 text-emerald-600" />
          Call recordings
        </h4>
        <div className="flex items-center gap-1.5">
          <select
            value={sttLanguage}
            onChange={(e) => setSttLanguage(e.target.value)}
            title="STT language"
            aria-label="Transcript language"
            className="h-7 max-w-[7.5rem] rounded-lg border border-slate-200 bg-white px-1.5 text-[10px] font-semibold text-slate-600"
          >
            {STT_LANGUAGES.map((l) => (
              <option key={l.value} value={l.value}>
                {l.label}
              </option>
            ))}
          </select>
          <input
            ref={fileInputRef}
            type="file"
            accept="audio/*,.mp3,.wav,.ogg,.m4a,.webm,.aac,.flac"
            className="hidden"
            onChange={(e) => void handleUpload(e.target.files?.[0])}
          />
          <button
            type="button"
            title="Upload sample audio for STT test"
            aria-label="Upload recording"
            disabled={uploading}
            onClick={() => fileInputRef.current?.click()}
            className="inline-flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 hover:bg-emerald-50 hover:text-emerald-700 disabled:opacity-50 cursor-pointer"
          >
            {uploading ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Upload className="h-3.5 w-3.5" />
            )}
          </button>
        </div>
      </div>

      {loading && (
        <div className="mt-3 flex items-center justify-center gap-2 py-4 text-xs text-slate-400">
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
          Loading…
        </div>
      )}

      {!loading && error && (
        <p className="mt-2 px-1 text-xs font-medium text-red-600">{error}</p>
      )}

      {!loading && !error && rows.length === 0 && (
        <p className="mt-2 px-1 text-xs text-slate-400">No recordings yet for this chat.</p>
      )}

      {!loading && rows.length > 0 && (
        <ul className="mt-2 space-y-2">
          {rows.map((row) => {
            const preview = transcriptOverview(row.transcriptText, 100);
            return (
              <li key={row.callId}>
                <div
                  role="button"
                  tabIndex={0}
                  onClick={() => setSelectedId(row.callId)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      setSelectedId(row.callId);
                    }
                  }}
                  className="w-full rounded-xl border border-slate-100 bg-slate-50/80 px-2.5 py-2.5 text-left transition-colors hover:border-emerald-200 hover:bg-emerald-50/40 cursor-pointer"
                >
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-[11px] font-bold text-slate-700 truncate">{row.label}</p>
                    <div className="flex items-center gap-1 shrink-0">
                      <span className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                        {row.status === 'ready'
                          ? row.durationLabel || 'Ready'
                          : row.status === 'processing'
                            ? 'Processing'
                            : row.status === 'recording'
                              ? 'Recording'
                              : row.status}
                      </span>
                      {row.status === 'ready' && (
                        <button
                          type="button"
                          title={`Transcribe (${STT_LANGUAGES.find((l) => l.value === sttLanguage)?.label || sttLanguage})`}
                          aria-label="Transcribe"
                          disabled={
                            transcribingId === row.callId ||
                            row.transcriptStatus === 'processing' ||
                            row.transcriptStatus === 'pending'
                          }
                          onClick={(e) => {
                            e.stopPropagation();
                            void handleTranscribe(row.callId);
                          }}
                          className="inline-flex h-6 w-6 items-center justify-center rounded-md text-slate-400 hover:bg-emerald-50 hover:text-emerald-700 disabled:opacity-50 cursor-pointer"
                        >
                          {transcribingId === row.callId ||
                          row.transcriptStatus === 'processing' ||
                          row.transcriptStatus === 'pending' ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          ) : (
                            <RefreshCw className="h-3 w-3" />
                          )}
                        </button>
                      )}
                      {row.status !== 'recording' && row.status !== 'processing' && (
                        <button
                          type="button"
                          title="Delete recording"
                          aria-label="Delete recording"
                          disabled={deletingId === row.callId}
                          onClick={(e) => {
                            e.stopPropagation();
                            void handleDelete(row.callId);
                          }}
                          className="inline-flex h-6 w-6 items-center justify-center rounded-md text-slate-400 hover:bg-red-50 hover:text-red-600 disabled:opacity-50 cursor-pointer"
                        >
                          {deletingId === row.callId ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          ) : (
                            <Trash2 className="h-3 w-3" />
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                  {preview ? (
                    <p className="mt-1.5 line-clamp-2 text-[11px] leading-snug text-slate-500">
                      {preview}
                    </p>
                  ) : row.transcriptStatus === 'pending' ||
                    row.transcriptStatus === 'processing' ? (
                    <p className="mt-1.5 text-[11px] text-slate-400">Transcribing…</p>
                  ) : row.playUrl ? (
                    <p className="mt-1.5 text-[11px] text-slate-400">
                      Tap to open recording & transcript
                    </p>
                  ) : null}
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {selected && (
        <CallDetailDialog
          row={selected}
          sttLanguage={sttLanguage}
          transcribing={transcribingId === selected.callId}
          onClose={() => setSelectedId(null)}
          onTranscribe={() => void handleTranscribe(selected.callId)}
        />
      )}
    </article>
  );
}
