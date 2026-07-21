import React, { useMemo, useState } from 'react';
import { Calendar, ChevronRight, Plus, Star } from 'lucide-react';
import type { TeamMember } from '../../types';

interface TeamPerformanceSectionProps {
  members: TeamMember[];
  onInvite?: () => void;
  onViewReport?: () => void;
}

function resolutionRate(csat: number): number {
  return Math.min(100, Math.round((csat / 5) * 100));
}

export const TeamPerformanceSection: React.FC<TeamPerformanceSectionProps> = ({
  members,
  onInvite,
  onViewReport,
}) => {
  const [range, setRange] = useState<'7' | '30' | '90'>('30');
  const [menuOpen, setMenuOpen] = useState(false);

  const topAgents = useMemo(
    () =>
      [...members]
        .sort((a, b) => b.conversationsCount - a.conversationsCount || b.csat - a.csat)
        .slice(0, 3),
    [members]
  );

  const rangeLabel =
    range === '7' ? '7 days' : range === '30' ? '30 days' : '90 days';

  return (
    <section className="rounded-xl border border-black/5 bg-surface p-5">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="font-display text-lg font-medium text-neutral-900">Team performance</h2>
          <p className="text-sm text-neutral-500">Top agents by volume and satisfaction</p>
        </div>

        <div className="relative">
          <button
            type="button"
            onClick={() => setMenuOpen((o) => !o)}
            className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-black/10 bg-white px-3 py-1.5 text-sm text-neutral-700 hover:bg-surface-muted"
          >
            <Calendar className="h-4 w-4 text-neutral-400" />
            Last {rangeLabel}
          </button>
          {menuOpen ? (
            <>
              <button
                type="button"
                aria-label="Close menu"
                className="fixed inset-0 z-10"
                onClick={() => setMenuOpen(false)}
              />
              <div className="absolute right-0 z-20 mt-1 w-36 rounded-lg border border-black/5 bg-white py-1 shadow-lg">
                {(['7', '30', '90'] as const).map((value) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => {
                      setRange(value);
                      setMenuOpen(false);
                    }}
                    className={`block w-full cursor-pointer px-3 py-2 text-left text-sm hover:bg-surface-muted ${
                      range === value ? 'font-medium text-primary' : 'text-neutral-700'
                    }`}
                  >
                    Last {value} days
                  </button>
                ))}
              </div>
            </>
          ) : null}
        </div>
      </div>

      {topAgents.length === 0 ? (
        <div className="rounded-lg border border-dashed border-black/10 py-10 text-center">
          <p className="text-sm font-medium text-neutral-800">No team data yet</p>
          <button
            type="button"
            onClick={onInvite}
            className="mt-3 inline-flex cursor-pointer items-center gap-1.5 text-sm font-medium text-primary"
          >
            <Plus className="h-4 w-4" />
            Invite teammates
          </button>
        </div>
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[560px] text-left text-sm">
              <thead>
                <tr className="border-b border-black/5 text-xs font-medium uppercase tracking-wide text-neutral-400">
                  <th className="pb-3 pr-4 font-medium">Agent</th>
                  <th className="pb-3 pr-4 font-medium">Conversations</th>
                  <th className="pb-3 pr-4 font-medium">CSAT</th>
                  <th className="pb-3 pr-4 font-medium">Response</th>
                  <th className="pb-3 font-medium">Resolution</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black/[0.03]">
                {topAgents.map((agent, index) => (
                  <tr key={agent.id} className="group">
                    <td className="py-3 pr-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-xs font-semibold text-white">
                          {agent.initials}
                        </div>
                        <div>
                          <p className="font-medium text-neutral-900">{agent.name}</p>
                          <p className="text-xs text-neutral-400">Rank #{index + 1}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 pr-4 tabular-nums font-medium text-neutral-900">
                      {agent.conversationsCount.toLocaleString()}
                    </td>
                    <td className="py-3 pr-4">
                      <span className="inline-flex items-center gap-1 font-medium text-neutral-900">
                        {agent.csat.toFixed(1)}
                        <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                      </span>
                    </td>
                    <td className="py-3 pr-4 font-medium text-primary">{agent.avgResponse}</td>
                    <td className="py-3 tabular-nums font-medium text-neutral-900">
                      {resolutionRate(agent.csat)}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {onViewReport ? (
            <div className="mt-4 border-t border-black/5 pt-3 text-right">
              <button
                type="button"
                onClick={onViewReport}
                className="inline-flex cursor-pointer items-center gap-1 text-sm font-medium text-primary hover:text-primary-hover"
              >
                Full report
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          ) : null}
        </>
      )}
    </section>
  );
};
