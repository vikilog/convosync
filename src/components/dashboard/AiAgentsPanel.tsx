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
    <div className="flex h-full flex-col rounded-xl bg-white p-5 ring-1 ring-slate-200/80">
      <div className="mb-1 flex items-center justify-between">
        <h2 className="font-display text-lg font-medium text-neutral-900">AI agents</h2>
        <button
          type="button"
          onClick={onViewAll}
          className="inline-flex cursor-pointer items-center gap-1 text-sm font-medium text-primary hover:text-primary-hover active:scale-[0.97]"
        >
          View all
          <ArrowUpRight className="h-3.5 w-3.5" />
        </button>
      </div>
      <p className="mb-3 text-sm text-neutral-500">
        {activeCount} active of {agents.length}
      </p>

      {items.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center py-6 text-center">
          <Bot className="h-6 w-6 text-neutral-300" aria-hidden />
          <p className="mt-2 text-sm text-neutral-500">No AI agents yet.</p>
        </div>
      ) : (
        <ul className="divide-y divide-black/5">
          {items.map((agent) => (
            <li key={agent.id} className="flex items-center gap-3 py-2.5 first:pt-0 last:pb-0">
              {agent.avatarUrl ? (
                <img
                  src={agent.avatarUrl}
                  alt=""
                  className="h-8 w-8 shrink-0 rounded-full object-cover"
                />
              ) : (
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-violet-50 text-xs font-semibold text-violet-600">
                  {agent.name.charAt(0).toUpperCase()}
                </div>
              )}
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-neutral-900">{agent.name}</p>
                <p className="truncate text-xs text-neutral-500">{agent.role}</p>
              </div>
              <span
                className={`flex shrink-0 items-center gap-1 text-[11px] font-medium ${
                  agent.isEnabled ? 'text-primary' : 'text-neutral-400'
                }`}
              >
                <span
                  className={`h-1.5 w-1.5 rounded-full ${agent.isEnabled ? 'bg-primary' : 'bg-neutral-300'}`}
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
