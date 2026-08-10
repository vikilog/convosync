import React, { useCallback, useEffect, useState } from 'react';
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  Info,
  XCircle,
} from 'lucide-react';
import { api } from '../../lib/api';
import { formatNotificationRelativeTime } from '../../lib/notificationTime';
import { useKeepAliveActivation } from '../KeepAlive';

type ActivityItem = {
  id: string;
  type: string;
  category: string;
  title: string;
  message: string;
  severity: string;
  createdAt: string;
};

function SeverityIcon({ severity }: { severity: string }) {
  const cls = 'h-4 w-4 shrink-0';
  if (severity === 'success') return <CheckCircle2 className={`${cls} text-emerald-600`} />;
  if (severity === 'failure') return <XCircle className={`${cls} text-red-600`} />;
  if (severity === 'warning') return <AlertTriangle className={`${cls} text-amber-600`} />;
  return <Info className={`${cls} text-sky-600`} />;
}

export const RecentActivityPanel: React.FC = () => {
  const [items, setItems] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const res = await api.getRecentActivity(12);
      setItems(res.items ?? []);
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  useKeepAliveActivation(() => {
    void load();
  });

  return (
    <div className="rounded-xl bg-white p-5 ring-1 ring-slate-200/80">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="font-display text-lg font-medium text-neutral-900">Recent activity</h2>
        <Activity className="h-4 w-4 text-neutral-400" />
      </div>

      {loading ? (
        <div className="space-y-3 animate-pulse">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex gap-3">
              <div className="h-4 w-4 rounded skel" />
              <div className="flex-1 space-y-2">
                <div className="h-3 w-2/3 rounded skel" />
                <div className="h-2.5 w-1/3 rounded skel" />
              </div>
            </div>
          ))}
        </div>
      ) : items.length === 0 ? (
        <p className="py-6 text-center text-sm text-neutral-500">No recent activity</p>
      ) : (
        <ul className="divide-y divide-black/5">
          {items.map((item) => (
            <li key={item.id} className="flex gap-3 py-3 first:pt-0 last:pb-0">
              <div className="mt-0.5">
                <SeverityIcon severity={item.severity} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm text-neutral-800">
                  <span className="font-medium text-neutral-900">{item.title}</span>
                  <span className="text-neutral-500"> — {item.message}</span>
                </p>
                <p className="mt-0.5 text-[11px] text-neutral-400">
                  {formatNotificationRelativeTime(Date.parse(item.createdAt))}
                </p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};
