import React from 'react';
import { ArrowUpRight, Bot } from 'lucide-react';

export type DashboardAgent = {
  id: string;
  name: string;
  role: string;
  avatarUrl?: string | null;
  isEnabled: boolean;
};

interface AiAgentsPanelProps {
  agents: DashboardAgent[];
  onViewAll: () => void;
}

export const AiAgentsPanel: React.FC<AiAgentsPanelProps> = ({ agents, onViewAll }) => {
  const items = agents.slice(0, 4);
  const activeCount = agents.filter((a) => a.isEnabled).length;

  return (
    <div className="flex h-full flex-col font-swiss">
      <div className="mb-1 flex items-baseline justify-between">
        <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-swiss-muted">
          AI agents
        </p>
        <button
          type="button"
          onClick={onViewAll}
          className="inline-flex cursor-pointer items-center gap-1 text-[11px] font-medium text-swiss-accent"
        >
          View all
          <ArrowUpRight className="h-3 w-3" />
        </button>
      </div>
      <p className="mb-3 text-[11px] text-swiss-faint">
        {activeCount} active of {agents.length}
      </p>

      {items.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center py-6 text-center">
          <Bot className="h-6 w-6 text-swiss-faint" aria-hidden />
          <p className="mt-2 text-sm text-swiss-muted">No AI agents yet.</p>
        </div>
      ) : (
        <ul className="divide-y divide-swiss-line">
          {items.map((agent) => (
            <li key={agent.id} className="flex items-center gap-3 py-2.5 first:pt-0 last:pb-0">
              {agent.avatarUrl ? (
                <img
                  src={agent.avatarUrl}
                  alt=""
                  className="h-7 w-7 shrink-0 rounded-full object-cover"
                />
              ) : (
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-swiss-line text-[11px] font-semibold text-swiss-ink">
                  {agent.name.charAt(0).toUpperCase()}
                </div>
              )}
              <div className="min-w-0 flex-1">
                <p className="truncate text-[13px] font-medium text-swiss-ink">{agent.name}</p>
                <p className="truncate text-[11px] text-swiss-muted">{agent.role}</p>
              </div>
              <span
                className={`flex shrink-0 items-center gap-1 text-[11px] font-medium ${
                  agent.isEnabled ? 'text-swiss-accent' : 'text-swiss-faint'
                }`}
              >
                <span
                  className={`h-1.5 w-1.5 rounded-full ${agent.isEnabled ? 'bg-swiss-accent' : 'bg-swiss-faint'}`}
                  aria-hidden
                />
                {agent.isEnabled ? 'Active' : 'Off'}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};
