import React, { useEffect, useState } from 'react';
import { AlertTriangle } from 'lucide-react';
import { api } from '../../../lib/api';

type Path = 'cache' | 'direct' | 'rag' | 'full_llm' | 'escalate';

const LABELS: Record<Path, string> = {
  cache: 'Cached',
  direct: 'Direct match',
  rag: 'RAG answer',
  full_llm: 'Open-ended',
  escalate: 'Escalated',
};

const ORDER: Path[] = ['cache', 'direct', 'rag', 'full_llm', 'escalate'];

type Props = {
  agentId: string;
};

export const KnowledgeStatsPanel: React.FC<Props> = ({ agentId }) => {
  const [stats, setStats] = useState<{
    total: number;
    counts: Record<Path, number>;
    percentages: Record<Path, number>;
  } | null>(null);

  useEffect(() => {
    let cancelled = false;
    void api
      .getAgentRetrievalStats(agentId)
      .then((res) => {
        if (!cancelled && res?.data) setStats(res.data);
      })
      .catch(() => {
        if (!cancelled) setStats(null);
      });
    return () => {
      cancelled = true;
    };
  }, [agentId]);

  if (!stats || stats.total === 0) return null;

  const escalatePct = stats.percentages.escalate ?? 0;

  return (
    <div className="mb-6 bg-white border border-swiss-line rounded-xl p-4">
      <div className="flex items-center justify-between flex-wrap gap-2 mb-3">
        <p className="text-sm font-bold text-[#111827]">
          How this agent answered the last {stats.total} question{stats.total !== 1 ? 's' : ''}
        </p>
        {escalatePct >= 25 && (
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-2 py-1 rounded-full bg-amber-100 text-amber-700">
            <AlertTriangle className="w-3.5 h-3.5" />
            {escalatePct}% escalated — knowledge gaps likely
          </span>
        )}
      </div>
      <div className="flex gap-1.5 h-2 rounded-full overflow-hidden mb-3">
        {ORDER.map((path) => (
          <div
            key={path}
            className={
              path === 'escalate'
                ? 'bg-amber-400'
                : path === 'full_llm'
                  ? 'bg-gray-300'
                  : 'bg-primary/70'
            }
            style={{ width: `${Math.max(stats.percentages[path] ?? 0, stats.counts[path] > 0 ? 1 : 0)}%` }}
            title={`${LABELS[path]}: ${stats.percentages[path] ?? 0}%`}
          />
        ))}
      </div>
      <div className="flex flex-wrap gap-x-5 gap-y-1">
        {ORDER.map((path) => (
          <div key={path} className="text-xs text-[#6B7280]">
            <span className="font-semibold text-[#111827]">{stats.percentages[path] ?? 0}%</span>{' '}
            {LABELS[path]}
          </div>
        ))}
      </div>
    </div>
  );
};
