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

  return (
    <div className="flex h-full flex-col font-swiss">
      <p className="mb-3 text-[13.5px] font-bold text-swiss-ink">AI agents</p>

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
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-swiss-accent-soft text-swiss-accent">
                  <Bot className="h-3.5 w-3.5" aria-hidden />
                </div>
              )}
              <div className="min-w-0 flex-1">
                <p className="truncate text-[13px] font-medium text-swiss-ink">{agent.name}</p>
                <p className="truncate text-[11px] text-swiss-muted">{agent.role}</p>
              </div>
              <span
                className={`shrink-0 text-[11px] font-semibold ${
                  agent.isEnabled ? 'text-swiss-accent' : 'text-swiss-faint'
                }`}
              >
                {agent.isEnabled ? 'Active' : 'Off'}
              </span>
            </li>
          ))}
        </ul>
      )}

      <button
        type="button"
        onClick={onViewAll}
        className="mt-3 inline-flex cursor-pointer items-center justify-center gap-1 text-[11.5px] font-semibold text-swiss-accent"
      >
        View all agents
        <ArrowUpRight className="h-3 w-3" />
      </button>
    </div>
  );
};
