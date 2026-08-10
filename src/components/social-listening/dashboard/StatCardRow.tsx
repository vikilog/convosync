import React from 'react';
import { Link } from 'react-router-dom';
import {
  Bot,
  ClipboardList,
  MessageCircle,
  Send,
  Users,
} from 'lucide-react';
import { StatCard } from '../../dashboard/StatCard';
import { pathForTab } from '../../../routes';

export type DashboardRange = 'today' | '7d' | '30d' | 'all';

export type DashboardStats = {
  totalComments: number;
  pendingReview: number;
  autoHandled: number;
  leadsCreated: number;
  autoDmsSentToday: number;
  maxAutoDmsPerDay: number;
  autoResponseEnabled: boolean;
};

export function StatCardRow({
  stats,
  loading,
}: {
  stats: DashboardStats | null;
  loading: boolean;
}) {
  if (loading || !stats) {
    return (
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-5">
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={i}
            className="h-[88px] animate-pulse rounded-xl bg-white ring-1 ring-slate-200/80"
          />
        ))}
      </div>
    );
  }

  const dmPct =
    stats.maxAutoDmsPerDay > 0
      ? Math.min(100, Math.round((stats.autoDmsSentToday / stats.maxAutoDmsPerDay) * 100))
      : 0;

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-5">
      <StatCard
        variant="messages"
        icon={MessageCircle}
        label="Comments"
        value={stats.totalComments.toLocaleString()}
      />
      <StatCard
        variant="response"
        icon={ClipboardList}
        label="Pending review"
        value={stats.pendingReview.toLocaleString()}
        footer={
          <Link
            to="/social-listening/review"
            className="text-[11px] font-bold text-amber-700 hover:underline"
          >
            Open review queue →
          </Link>
        }
      />
      <StatCard
        variant="journeys"
        icon={Bot}
        label="Auto-handled"
        value={stats.autoHandled.toLocaleString()}
        footer={
          <span className="text-[11px] text-neutral-400">
            {stats.autoResponseEnabled ? 'In selected range' : 'Automation off'}
          </span>
        }
      />
      <StatCard
        variant="contacts"
        icon={Users}
        label="Leads created"
        value={stats.leadsCreated.toLocaleString()}
        footer={
          <Link
            to={pathForTab('leads')}
            className="text-[11px] font-bold text-sky-700 hover:underline"
          >
            Open leads →
          </Link>
        }
      />
      <StatCard
        variant="messages"
        icon={Send}
        label="Auto-DMs today"
        value={`${stats.autoDmsSentToday}/${stats.maxAutoDmsPerDay}`}
        footer={
          <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
            <div
              className="h-full rounded-full bg-primary transition-all"
              style={{ width: `${dmPct}%` }}
            />
          </div>
        }
      />
    </div>
  );
}
