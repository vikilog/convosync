import React, { useEffect, useState } from 'react';
import { Filter, GitBranch } from 'lucide-react';
import { api } from '../../lib/api';

function formatDay(iso: string): string {
  try {
    return new Date(iso).toLocaleString(undefined, {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return iso;
  }
}

export type LeadJourneyView = {
  funnelName: string;
  enteredAt: string;
  convertedAt: string;
  finalStage: string;
  source: string;
  origin: { username: string; commentText: string; postCaption: string } | null;
  timeline: Array<{
    at: string;
    type: string;
    text: string;
    fromStage?: string;
    toStage?: string;
  }>;
};

export function ContactLeadJourneyPanel({
  contactId,
  journey: journeyProp,
}: {
  contactId?: string;
  /** Pass snapshot directly (e.g. after convert); otherwise fetch by contactId. */
  journey?: LeadJourneyView | null;
}) {
  const [journey, setJourney] = useState<LeadJourneyView | null>(journeyProp ?? null);
  const [loading, setLoading] = useState(!journeyProp && Boolean(contactId));

  useEffect(() => {
    if (journeyProp !== undefined) {
      setJourney(journeyProp);
      setLoading(false);
      return;
    }
    if (!contactId) return;
    let cancelled = false;
    setLoading(true);
    void api
      .getContactLeadJourney(contactId)
      .then((res) => {
        if (!cancelled) setJourney(res.journey);
      })
      .catch(() => {
        if (!cancelled) setJourney(null);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [contactId, journeyProp]);

  if (loading) {
    return (
      <div className="animate-pulse bg-white border border-swiss-line p-3">
        <div className="h-3 w-28 rounded bg-slate-100" />
        <div className="mt-3 h-16 rounded bg-slate-50" />
      </div>
    );
  }

  if (!journey) return null;

  return (
    <article className="rounded-xl border border-swiss-line bg-slate-50/80 p-3">
      <div className="flex items-start justify-between gap-2">
        <h4 className="flex items-center gap-1.5 text-sm font-bold text-swiss-ink">
          <Filter className="h-3.5 w-3.5 text-primary" />
          Lead journey
        </h4>
        <span className="rounded-md bg-white px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-swiss-faint ring-1 ring-swiss-line">
          Read-only
        </span>
      </div>
      <p className="mt-1 text-[11px] text-swiss-faint">
        Funnel path and dates — not editable from here.
      </p>
      <div className="mt-3 space-y-2">
        <p className="text-sm font-bold text-swiss-ink">{journey.funnelName}</p>
        <div className="flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-swiss-muted">
          <span>Entered {formatDay(journey.enteredAt)}</span>
          <span>Contact {formatDay(journey.convertedAt)}</span>
          <span>Final: {journey.finalStage}</span>
        </div>
        {journey.origin?.commentText ? (
          <p className="rounded-lg border border-[#E1306C]/15 bg-[#fce8f0]/40 px-2.5 py-2 text-xs text-swiss-ink">
            <span className="font-bold text-[#C13584]">@{journey.origin.username}</span>
            {': '}
            {journey.origin.commentText}
          </p>
        ) : null}
        <ol className="relative ml-1.5 mt-3 space-y-3 border-l-2 border-swiss-line pl-4">
          {journey.timeline.map((item, i) => (
            <li key={`${item.at}-${i}`} className="relative">
              <span
                className={`absolute -left-[21px] top-1.5 h-2.5 w-2.5 rounded-full border-2 border-white ${
                  item.type === 'converted'
                    ? 'bg-emerald-500'
                    : item.type === 'created'
                      ? 'bg-sky-500'
                      : 'bg-primary'
                }`}
              />
              <p className="text-[10px] font-semibold uppercase tracking-wide text-swiss-faint">
                {formatDay(item.at)}
              </p>
              <p className="mt-0.5 text-xs font-semibold text-swiss-ink">{item.text}</p>
              {item.fromStage && item.toStage ? (
                <p className="mt-0.5 inline-flex items-center gap-1 text-[10px] font-medium text-slate-500">
                  <GitBranch className="h-3 w-3" />
                  {item.fromStage} → {item.toStage}
                </p>
              ) : null}
            </li>
          ))}
        </ol>
      </div>
    </article>
  );
}
