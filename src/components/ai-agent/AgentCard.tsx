import React from 'react';
import { Bot, GitBranch, MessageSquare, Pencil, Trash2 } from 'lucide-react';
import type { AgentBot } from '../../types';
import { CATEGORY_LABELS } from './types';

type AgentActionsProps = {
  onEdit: () => void;
  onDelete: () => void;
  deleting?: boolean;
};

type SharedProps = {
  agent: AgentBot;
  onEdit: () => void;
  onDelete: () => void;
  deleting?: boolean;
};

const categoryStyles: Record<AgentBot['category'], { badge: string; avatar: string }> = {
  ai_agent: {
    badge: 'bg-sky-50 text-sky-700 ring-emerald-100',
    avatar: 'bg-gradient-to-br from-sky-50 to-violet-50 text-sky-600',
  },
  responsive: {
    badge: 'bg-violet-50 text-violet-700 ring-violet-100',
    avatar: 'bg-gradient-to-br from-violet-50 to-fuchsia-50 text-violet-600',
  },
  rule_based: {
    badge: 'bg-slate-100 text-slate-600 ring-slate-200',
    avatar: 'bg-slate-100 text-slate-600',
  },
};

function AgentAvatar({ agent, size = 'md' }: { agent: AgentBot; size?: 'md' | 'lg' }) {
  const dim = size === 'lg' ? 'w-12 h-12' : 'w-10 h-10';
  const iconDim = size === 'lg' ? 'w-6 h-6' : 'w-5 h-5';
  const styles = categoryStyles[agent.category];

  if (agent.avatarUrl) {
    return (
      <img
        src={agent.avatarUrl}
        alt=""
        className={`${dim} rounded-xl object-cover border border-slate-200 shrink-0`}
      />
    );
  }

  return (
    <div
      className={`${dim} rounded-xl shrink-0 flex items-center justify-center border border-slate-100 ${styles.avatar}`}
    >
      <Bot className={iconDim} />
    </div>
  );
}

function CategoryBadge({ category }: { category: AgentBot['category'] }) {
  const styles = categoryStyles[category];
  return (
    <span
      className={`inline-flex items-center text-[11px] font-semibold px-2 py-0.5 rounded-md ring-1 ring-inset ${styles.badge}`}
    >
      {CATEGORY_LABELS[category]}
    </span>
  );
}

function StatusBadge({ enabled }: { enabled: boolean }) {
  if (!enabled) {
    return (
      <span className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-400">
        <span className="w-1.5 h-1.5 rounded-full bg-slate-300" />
        Offline
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600">
      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
      Live
    </span>
  );
}

function AgentActionButtons({ onEdit, onDelete, deleting }: AgentActionsProps) {
  return (
    <div className="flex items-center gap-1 shrink-0">
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onEdit();
        }}
        className="inline-flex items-center justify-center w-8 h-8 rounded-lg text-slate-500 hover:text-sky-600 hover:bg-sky-50 transition-colors cursor-pointer"
        aria-label="Edit agent"
        title="Edit"
      >
        <Pencil className="w-4 h-4" />
      </button>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onDelete();
        }}
        disabled={deleting}
        className="inline-flex items-center justify-center w-8 h-8 rounded-lg text-slate-500 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer disabled:opacity-50"
        aria-label="Delete agent"
        title="Delete"
      >
        <Trash2 className="w-4 h-4" />
      </button>
    </div>
  );
}

function AgentMeta({ agent }: { agent: AgentBot }) {
  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-2 text-[11px] text-slate-500">
      <span className="inline-flex items-center gap-1">
        <MessageSquare className="w-3 h-3" />
        {agent.conversationsCount} chats
      </span>
      {agent.category === 'rule_based' && (
        <span className="inline-flex items-center gap-1">
          <GitBranch className="w-3 h-3" />
          {agent.flowsCount} flows
        </span>
      )}
    </div>
  );
}

export const AgentListRow: React.FC<SharedProps> = ({ agent, onEdit, onDelete, deleting }) => {
  return (
    <div className="group flex items-center gap-3 px-4 py-3 border-b border-slate-100 last:border-b-0 hover:bg-slate-50/80 transition-colors">
      <button
        type="button"
        onClick={onEdit}
        className="flex items-center gap-3 min-w-0 flex-1 text-left cursor-pointer"
      >
        <AgentAvatar agent={agent} />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-sm font-semibold text-slate-900 truncate">{agent.name}</p>
            <CategoryBadge category={agent.category} />
            <StatusBadge enabled={agent.isEnabled} />
          </div>
          <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">{agent.description}</p>
          <AgentMeta agent={agent} />
        </div>
      </button>
      <AgentActionButtons onEdit={onEdit} onDelete={onDelete} deleting={deleting} />
    </div>
  );
};

export const AgentGridCard: React.FC<SharedProps> = ({ agent, onEdit, onDelete, deleting }) => {
  return (
    <div className="group relative flex flex-col rounded-xl border border-slate-200 bg-white p-4 hover:border-sky-200 hover:shadow-sm transition-all duration-200">
      <div className="flex items-start justify-between gap-2">
        <button type="button" onClick={onEdit} className="flex items-start gap-3 min-w-0 flex-1 text-left cursor-pointer">
          <AgentAvatar agent={agent} size="lg" />
          <div className="min-w-0 flex-1 pt-0.5">
            <p className="text-sm font-semibold text-slate-900 truncate">{agent.name}</p>
            <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
              <CategoryBadge category={agent.category} />
              <StatusBadge enabled={agent.isEnabled} />
            </div>
          </div>
        </button>
        <AgentActionButtons onEdit={onEdit} onDelete={onDelete} deleting={deleting} />
      </div>

      <button type="button" onClick={onEdit} className="mt-3 text-left cursor-pointer flex-1">
        <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">{agent.description}</p>
        <AgentMeta agent={agent} />
      </button>
    </div>
  );
};

/** @deprecated Use AgentListRow or AgentGridCard */
export const AgentCard: React.FC<{ agent: AgentBot; onClick: () => void }> = ({
  agent,
  onClick,
}) => <AgentListRow agent={agent} onEdit={onClick} onDelete={() => {}} />;
