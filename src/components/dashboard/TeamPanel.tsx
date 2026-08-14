import React from 'react';
import { ArrowUpRight, Crown } from 'lucide-react';

export type DashboardTeamMember = {
  id: string;
  name: string;
  role: string;
  avatar?: string | null;
  isOwner: boolean;
  conversationsCount?: number;
};

interface TeamPanelProps {
  members: DashboardTeamMember[];
  onViewAll: () => void;
}

export const TeamPanel: React.FC<TeamPanelProps> = ({ members, onViewAll }) => {
  const items = members.slice(0, 5);

  return (
    <div className="flex h-full flex-col rounded-xl bg-white p-5 ring-1 ring-slate-200/80">
      <div className="mb-1 flex items-center justify-between">
        <h2 className="font-display text-lg font-medium text-neutral-900">Team</h2>
        <button
          type="button"
          onClick={onViewAll}
          className="inline-flex cursor-pointer items-center gap-1 text-sm font-medium text-primary hover:text-primary-hover active:scale-[0.97]"
        >
          Manage
          <ArrowUpRight className="h-3.5 w-3.5" />
        </button>
      </div>
      <p className="mb-3 text-sm text-neutral-500">
        {members.length} member{members.length === 1 ? '' : 's'} in this workspace
      </p>

      {items.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center py-6 text-center">
          <p className="text-sm text-neutral-500">No team members yet.</p>
        </div>
      ) : (
        <ul className="divide-y divide-black/5">
          {items.map((member) => (
            <li key={member.id} className="flex items-center gap-3 py-2.5 first:pt-0 last:pb-0">
              {member.avatar ? (
                <img
                  src={member.avatar}
                  alt=""
                  className="h-8 w-8 shrink-0 rounded-full object-cover ring-1 ring-slate-200"
                />
              ) : (
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                  {member.name.charAt(0).toUpperCase()}
                </div>
              )}
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1">
                  <p className="truncate text-sm font-medium text-neutral-900">{member.name}</p>
                  {member.isOwner ? (
                    <Crown className="h-3 w-3 shrink-0 text-amber-500" aria-hidden />
                  ) : null}
                </div>
                <p className="truncate text-xs capitalize text-neutral-500">{member.role}</p>
              </div>
              {typeof member.conversationsCount === 'number' ? (
                <span className="shrink-0 text-xs tabular-nums text-neutral-400">
                  {member.conversationsCount} convos
                </span>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};
