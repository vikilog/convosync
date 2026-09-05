/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BarChart3, Loader2, Search } from 'lucide-react';
import { api } from '../../lib/api';
import { mapTemplateFromApi } from '../../lib/mappers';
import { pathForTemplateInsights } from '../../routes';
import type { CampaignTemplate } from '../../types';
import { Input } from '../ui/input';

type Insights = Awaited<ReturnType<typeof api.getTemplateInsights>>;

const RANGE_OPTIONS = [
  { label: '7 days', days: 7 },
  { label: '30 days', days: 30 },
  { label: '90 days', days: 90 },
] as const;

function formatDay(unixSeconds: number): string {
  return new Date(unixSeconds * 1000).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
  });
}

function pct(numerator: number, denominator: number): string {
  if (!denominator) return '—';
  return `${Math.round((numerator / denominator) * 100)}%`;
}

export function TemplateInsightsView({ initialTemplateId }: { initialTemplateId?: string | null }) {
  const navigate = useNavigate();
  const [templates, setTemplates] = useState<CampaignTemplate[]>([]);
  const [loadingTemplates, setLoadingTemplates] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(initialTemplateId ?? null);
  const [days, setDays] = useState<number>(30);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [data, setData] = useState<Insights | null>(null);

  useEffect(() => {
    let cancelled = false;
    api
      .getTemplates()
      .then((rows) => {
        if (cancelled) return;
        const list = (rows as Record<string, unknown>[])
          .map(mapTemplateFromApi)
          .filter((t) => t.status === 'Approved' || t.status === 'Paused');
        setTemplates(list);
        setSelectedId((prev) => prev ?? list[0]?.id ?? null);
      })
      .catch(() => {
        if (!cancelled) setTemplates([]);
      })
      .finally(() => {
        if (!cancelled) setLoadingTemplates(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const filtered = useMemo(
    () => templates.filter((t) => t.name.toLowerCase().includes(search.toLowerCase())),
    [templates, search]
  );

  const selectTemplate = useCallback(
    (id: string) => {
      setSelectedId(id);
      navigate(pathForTemplateInsights(id), { replace: true });
    },
    [navigate]
  );

  useEffect(() => {
    if (!selectedId) {
      setData(null);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError('');
    api
      .getTemplateInsights(selectedId, days)
      .then((res) => {
        if (!cancelled) setData(res);
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Failed to load insights');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [selectedId, days]);

  const selected = templates.find((t) => t.id === selectedId) ?? null;
  const totals = data?.totals;
  const clickedEntries = totals ? Object.entries(totals.clicked) : [];

  return (
    <div className="flex h-full min-h-0 gap-4 font-swiss">
      <div className="w-72 shrink-0 flex flex-col min-h-0 bg-white border border-swiss-line rounded-2xl overflow-hidden">
        <div className="p-3 border-b border-swiss-line">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-swiss-faint" />
            <Input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search templates..."
              className="h-auto w-full bg-white border border-swiss-line rounded-xl py-1.5 pl-9 pr-3 text-meta font-semibold outline-none focus-visible:ring-2 focus-visible:ring-swiss-accent/20"
            />
          </div>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto">
          {loadingTemplates ? (
            <div className="flex justify-center py-10 text-swiss-faint">
              <Loader2 className="w-5 h-5 animate-spin" />
            </div>
          ) : filtered.length === 0 ? (
            <p className="text-xs text-swiss-faint text-center py-10 px-4">
              No approved templates yet — insights are only available once Meta approves a
              template.
            </p>
          ) : (
            filtered.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => t.id && selectTemplate(t.id)}
                className={`w-full text-left px-3 py-2.5 border-b border-swiss-line last:border-b-0 ${
                  t.id === selectedId ? 'bg-swiss-accent-soft' : 'hover:bg-gray-50'
                }`}
              >
                <p
                  className={`text-xs font-bold truncate font-mono ${
                    t.id === selectedId ? 'text-swiss-accent' : 'text-swiss-ink'
                  }`}
                >
                  {t.name}
                </p>
                <p className="text-[11px] text-swiss-faint mt-0.5">{t.category}</p>
              </button>
            ))
          )}
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto bg-white border border-swiss-line rounded-2xl p-5">
        {!selected ? (
          <div className="flex flex-col items-center justify-center gap-2 h-full text-center text-swiss-faint">
            <BarChart3 className="w-8 h-8" />
            <p className="text-sm font-semibold">Select a template to view its performance</p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <h3 className="text-base font-semibold text-gray-950 truncate">Template insights</h3>
                <p className="text-xs text-swiss-muted font-mono truncate">{selected.name}</p>
              </div>
              <div className="flex gap-1.5 shrink-0">
                {RANGE_OPTIONS.map((opt) => (
                  <button
                    key={opt.days}
                    type="button"
                    onClick={() => setDays(opt.days)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold border ${
                      days === opt.days
                        ? 'bg-swiss-accent text-white border-swiss-accent'
                        : 'bg-white text-swiss-muted border-swiss-line hover:border-swiss-accent/30'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {loading ? (
              <div className="flex justify-center py-16 text-swiss-faint">
                <Loader2 className="w-6 h-6 animate-spin" />
              </div>
            ) : error ? (
              <p className="text-sm font-bold text-red-500 bg-red-50 border border-red-100 rounded-xl p-3">
                {error}
              </p>
            ) : (
              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-3">
                  <div className="rounded-xl border border-swiss-line p-3">
                    <p className="text-[11px] font-bold uppercase tracking-wide text-swiss-faint">
                      Sent
                    </p>
                    <p className="text-xl font-bold text-gray-950 mt-1">{totals?.sent ?? 0}</p>
                  </div>
                  <div className="rounded-xl border border-swiss-line p-3">
                    <p className="text-[11px] font-bold uppercase tracking-wide text-swiss-faint">
                      Delivered
                    </p>
                    <p className="text-xl font-bold text-gray-950 mt-1">{totals?.delivered ?? 0}</p>
                    <p className="text-[11px] text-swiss-muted mt-0.5">
                      {pct(totals?.delivered ?? 0, totals?.sent ?? 0)} of sent
                    </p>
                  </div>
                  <div className="rounded-xl border border-swiss-line p-3">
                    <p className="text-[11px] font-bold uppercase tracking-wide text-swiss-faint">
                      Read
                    </p>
                    <p className="text-xl font-bold text-gray-950 mt-1">{totals?.read ?? 0}</p>
                    <p className="text-[11px] text-swiss-muted mt-0.5">
                      {pct(totals?.read ?? 0, totals?.delivered ?? 0)} of delivered
                    </p>
                  </div>
                </div>

                {clickedEntries.length > 0 && (
                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-wide text-swiss-faint mb-1.5">
                      Button clicks
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {clickedEntries.map(([label, count]) => (
                        <span
                          key={label}
                          className="inline-flex items-center gap-1.5 rounded-full bg-white border border-gray-200 px-2.5 py-1 text-[11px] font-bold text-swiss-muted"
                        >
                          {label}
                          <span className="text-swiss-accent">{count}</span>
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                <div>
                  <p className="text-[11px] font-bold uppercase tracking-wide text-swiss-faint mb-1.5">
                    Daily breakdown
                  </p>
                  {data && data.dataPoints.length > 0 ? (
                    <div className="border border-swiss-line rounded-xl overflow-hidden">
                      <table className="w-full text-xs">
                        <thead>
                          <tr className="bg-white border-b border-swiss-line text-left text-swiss-faint font-bold uppercase tracking-wide">
                            <th className="px-3 py-2">Date</th>
                            <th className="px-3 py-2 text-right">Sent</th>
                            <th className="px-3 py-2 text-right">Delivered</th>
                            <th className="px-3 py-2 text-right">Read</th>
                          </tr>
                        </thead>
                        <tbody>
                          {data.dataPoints.map((p) => (
                            <tr key={p.start} className="border-b border-swiss-line last:border-b-0">
                              <td className="px-3 py-2 font-semibold text-swiss-ink">
                                {formatDay(p.start)}
                              </td>
                              <td className="px-3 py-2 text-right">{p.sent}</td>
                              <td className="px-3 py-2 text-right">{p.delivered}</td>
                              <td className="px-3 py-2 text-right">{p.read}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <p className="text-xs text-swiss-faint py-4 text-center">
                      No activity for this template in the selected range.
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
