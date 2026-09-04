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
    <div className="flex h-full flex-col font-swiss">
      <p className="mb-3 text-[13.5px] font-bold text-swiss-ink">Team</p>

      {items.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center py-6 text-center">
          <p className="text-sm text-swiss-muted">No team members yet.</p>
        </div>
      ) : (
        <ul className="divide-y divide-swiss-line">
          {items.map((member) => (
            <li key={member.id} className="flex items-center gap-3 py-2.5 first:pt-0 last:pb-0">
              {member.avatar ? (
                <img
                  src={member.avatar}
                  alt=""
                  className="h-7 w-7 shrink-0 rounded-full object-cover"
                />
              ) : (
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-swiss-line text-[11px] font-semibold text-swiss-ink">
                  {member.name.charAt(0).toUpperCase()}
                </div>
              )}
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1">
                  <p className="truncate text-[13px] font-medium text-swiss-ink">{member.name}</p>
                  {member.isOwner ? (
                    <Crown className="h-3 w-3 shrink-0 text-swiss-accent" aria-hidden />
                  ) : null}
                </div>
                <p className="truncate text-[11px] capitalize text-swiss-muted">{member.role}</p>
              </div>
              {typeof member.conversationsCount === 'number' ? (
                <span className="shrink-0 text-[11px] tabular-nums text-swiss-faint">
                  {member.conversationsCount} convos
                </span>
              ) : null}
            </li>
          ))}
        </ul>
      )}

      <button
        type="button"
        onClick={onViewAll}
        className="mt-3 inline-flex cursor-pointer items-center justify-center gap-1 text-[11.5px] font-semibold text-swiss-accent"
      >
        View all
        <ArrowUpRight className="h-3 w-3" />
      </button>
    </div>
  );
};
