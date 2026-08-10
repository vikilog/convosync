import React from 'react';
import { Activity } from 'lucide-react';

function timeAgo(iso: string): string {
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

const DOT: Record<string, string> = {
  auto_dm: 'bg-violet-500',
  auto_ignore: 'bg-slate-400',
  auto_escalate: 'bg-red-500',
  manual_approve_dm: 'bg-primary',
  dm_sent: 'bg-emerald-500',
  dm_failed: 'bg-amber-500',
  lead_created: 'bg-sky-500',
  classified: 'bg-slate-300',
};

export function ActivityFeed({
  events,
  loading,
}: {
  events: Array<{
    id: string;
    eventType: string;
    message: string;
    createdAt: string;
  }> | null;
  loading: boolean;
}) {
  return (
    <div className="flex min-h-[280px] flex-col rounded-xl bg-white ring-1 ring-slate-200/80 p-5">
      <div className="mb-3">
        <h2 className="text-sm font-bold text-neutral-900">Recent activity</h2>
        <p className="text-xs text-neutral-500">Automation and approval events</p>
      </div>

      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-10 animate-pulse rounded-lg bg-slate-100" />
          ))}
        </div>
      ) : !events?.length ? (
        <div className="flex flex-1 flex-col items-center justify-center py-10 text-center">
          <Activity className="mb-2 h-7 w-7 text-gray-300" />
          <p className="text-sm font-semibold text-gray-600">No activity yet</p>
          <p className="mt-1 text-xs text-gray-400">
            Auto-replies, DMs, and leads will show up here as they happen.
          </p>
        </div>
      ) : (
        <ul className="flex max-h-[420px] flex-col gap-0 overflow-y-auto">
          {events.map((ev) => (
            <li
              key={ev.id}
              className="flex gap-3 border-b border-black/5 py-2.5 last:border-b-0"
            >
              <span
                className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${DOT[ev.eventType] || 'bg-slate-300'}`}
              />
              <div className="min-w-0 flex-1">
                <p className="text-xs font-medium leading-relaxed text-gray-800">{ev.message}</p>
                <p className="mt-0.5 text-[10px] text-gray-400">{timeAgo(ev.createdAt)}</p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
