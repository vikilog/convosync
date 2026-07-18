/**
 * AI Summary tab — latest ContactInsight + manual prepare for past calls/chats.
 */

import { useCallback, useEffect, useState } from 'react';
import { AlertTriangle, Loader2, RefreshCw, Sparkles } from 'lucide-react';
import { api, formatCatchError, type ContactInsightDto } from '../../lib/api';

function ScorePill({
  label,
  value,
  accent,
}: {
  label: string;
  value: number | null;
  accent: string;
}) {
  return (
    <div className="rounded-xl border border-slate-100 bg-slate-50/80 px-2.5 py-2 text-center">
      <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">{label}</p>
      <p className={`mt-0.5 text-lg font-black tabular-nums ${accent}`}>
        {value == null ? '—' : value}
      </p>
    </div>
  );
}

export function ContactInsightPanel({ contactId }: { contactId: string }) {
  const [insight, setInsight] = useState<ContactInsightDto | null>(null);
  const [excludeFromInsights, setExcludeFromInsights] = useState(false);
  const [loading, setLoading] = useState(true);
  const [computing, setComputing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [statusNote, setStatusNote] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.getContactInsightLatest(contactId);
      setInsight(res.insight);
      setExcludeFromInsights(Boolean(res.excludeFromInsights));
    } catch (err) {
      setError(formatCatchError(err));
    } finally {
      setLoading(false);
    }
  }, [contactId]);

  useEffect(() => {
    void load();
  }, [load]);

  const handlePrepare = async () => {
    if (excludeFromInsights) return;
    setComputing(true);
    setError(null);
    setStatusNote('Queued… analyzing chat + call history');
    try {
      const res = await api.queueContactInsight(contactId);
      if (!res.queued && res.reason?.startsWith('coalesced')) {
        setStatusNote('Already running…');
      }
      const before = insight?.computedAt ? new Date(insight.computedAt).getTime() : 0;
      for (let i = 0; i < 40; i++) {
        await new Promise((r) => setTimeout(r, 2500));
        const latestRes = await api.getContactInsightLatest(contactId);
        setExcludeFromInsights(Boolean(latestRes.excludeFromInsights));
        if (latestRes.insight && new Date(latestRes.insight.computedAt).getTime() > before) {
          setInsight(latestRes.insight);
          setStatusNote(null);
          break;
        }
        if (i === 39) {
          setStatusNote('Still processing — refresh in a minute');
          await load();
        }
      }
    } catch (err) {
      setError(formatCatchError(err));
      setStatusNote(null);
    } finally {
      setComputing(false);
    }
  };

  const genuine = insight?.isGenuineCustomerInteraction !== false;
  const showScores = Boolean(insight && genuine);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <h4 className="text-xs font-bold text-gray-500 flex items-center gap-1.5">
          <Sparkles className="h-3.5 w-3.5 text-sky-600" />
          Customer insight
        </h4>
        <button
          type="button"
          disabled={computing || excludeFromInsights}
          onClick={() => void handlePrepare()}
          className="inline-flex items-center gap-1.5 rounded-lg border border-sky-200 bg-sky-50 px-2.5 py-1.5 text-[11px] font-bold text-sky-800 hover:bg-sky-100 disabled:opacity-50 cursor-pointer"
          title={
            excludeFromInsights
              ? 'This contact is excluded from insights'
              : 'Analyze existing chats and call transcripts now'
          }
        >
          {computing ? (
            <Loader2 className="h-3 w-3 animate-spin" />
          ) : (
            <RefreshCw className="h-3 w-3" />
          )}
          {insight ? 'Re-run' : 'Prepare insight'}
        </button>
      </div>

      {excludeFromInsights && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2.5 text-xs font-medium text-amber-900">
          This contact is excluded from AI insights (team/test number). Turn off “Exclude from AI
          insights” in Edit contact to enable.
        </div>
      )}

      {loading && (
        <div className="flex items-center justify-center gap-2 py-8 text-xs text-slate-400">
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
          Loading…
        </div>
      )}

      {!loading && error && (
        <p className="text-xs font-medium text-red-600">{error}</p>
      )}

      {!loading && statusNote && (
        <p className="flex items-center gap-1.5 text-xs font-medium text-sky-700">
          <Loader2 className="h-3 w-3 animate-spin" />
          {statusNote}
        </p>
      )}

      {!loading && !insight && !error && !excludeFromInsights && (
        <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm text-center">
          <span className="mx-auto flex h-10 w-10 items-center justify-center rounded-xl bg-sky-50 text-sky-600">
            <Sparkles className="h-5 w-5" />
          </span>
          <h4 className="mt-3 text-sm font-bold text-gray-900">No insight yet</h4>
          <p className="mt-1.5 text-xs leading-relaxed text-slate-500">
            Past calls and chats are ready to analyze. Tap Prepare insight to run now
            (doesn’t wait for the nightly job).
          </p>
        </article>
      )}

      {!loading && insight && (
        <article className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm space-y-3">
          <p className="text-[10px] font-semibold text-slate-400">
            {new Date(insight.computedAt).toLocaleString()} · {insight.modelVersion}
            {insight.basedOnCallSessionIds.length
              ? ` · ${insight.basedOnCallSessionIds.length} call(s)`
              : ''}
          </p>

          {!genuine && (
            <div className="flex gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2.5 text-xs font-medium leading-snug text-amber-950">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
              <span>
                This doesn&apos;t appear to be a genuine customer interaction — scores not
                computed.
              </span>
            </div>
          )}

          {showScores && (
            <div className="grid grid-cols-2 gap-2">
              <ScorePill label="Health" value={insight.healthScore} accent="text-emerald-700" />
              <ScorePill
                label="Churn risk"
                value={insight.churnRiskScore}
                accent="text-amber-700"
              />
              <ScorePill
                label="Purchase intent"
                value={insight.purchaseIntentScore}
                accent="text-sky-700"
              />
              <ScorePill
                label="Sentiment"
                value={insight.sentimentScore}
                accent="text-violet-700"
              />
            </div>
          )}

          <div>
            <p className="text-[11px] font-bold uppercase tracking-wide text-gray-400">Summary</p>
            <p className="mt-1 text-sm leading-relaxed text-slate-800">{insight.summary}</p>
          </div>

          {genuine && insight.recommendedAction && (
            <div className="rounded-xl border border-emerald-100 bg-emerald-50/60 px-3 py-2">
              <p className="text-[11px] font-bold uppercase tracking-wide text-emerald-700">
                Recommended action
              </p>
              <p className="mt-0.5 text-sm text-emerald-950">{insight.recommendedAction}</p>
            </div>
          )}

          {genuine && insight.painPoints.length > 0 && (
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wide text-gray-400">
                Pain points
              </p>
              <ul className="mt-1 list-disc space-y-0.5 pl-4 text-xs text-slate-700">
                {insight.painPoints.map((p) => (
                  <li key={p}>{p}</li>
                ))}
              </ul>
            </div>
          )}

          {genuine && insight.interests.length > 0 && (
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wide text-gray-400">
                Interests
              </p>
              <ul className="mt-1 list-disc space-y-0.5 pl-4 text-xs text-slate-700">
                {insight.interests.map((p) => (
                  <li key={p}>{p}</li>
                ))}
              </ul>
            </div>
          )}
        </article>
      )}
    </div>
  );
}
