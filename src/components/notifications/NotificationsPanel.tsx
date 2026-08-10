import React, { useCallback, useEffect, useState } from 'react';
import { CheckCheck, Megaphone, AlertTriangle, CheckCircle2, Info, XCircle } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { api } from '../../lib/api';
import { formatNotificationRelativeTime } from '../../lib/notificationTime';
import { getSocket } from '../../lib/socket';

export type InAppNotification = {
  id: string;
  type: string;
  category: string;
  title: string;
  message: string;
  severity: string;
  createdAt: string;
  unread: boolean;
  entityType: string | null;
  entityId: string | null;
  /** When false/undefined, ignore for bell realtime (activity-only rows). */
  forBell?: boolean;
};

const TABS = [
  { id: 'all', label: 'All' },
  { id: 'campaigns', label: 'Campaigns' },
  { id: 'system', label: 'System' },
] as const;

function SeverityIcon({ severity }: { severity: string }) {
  const cls = 'h-4 w-4 shrink-0';
  switch (severity) {
    case 'success':
      return <CheckCircle2 className={`${cls} text-emerald-600`} />;
    case 'failure':
      return <XCircle className={`${cls} text-red-600`} />;
    case 'warning':
      return <AlertTriangle className={`${cls} text-amber-600`} />;
    default:
      return <Info className={`${cls} text-sky-600`} />;
  }
}

function emphasizeEntity(message: string): React.ReactNode {
  // First quoted or leading proper-noun-ish token before " was/finished/failed"
  const m = message.match(/^(.+?)(\s+(?:was|finished|failed|—).*)/i);
  if (!m) return message;
  return (
    <>
      <span className="font-semibold text-neutral-900">{m[1]}</span>
      {m[2]}
    </>
  );
}

type Props = {
  open: boolean;
  onClose: () => void;
  onUnreadChange?: (n: number) => void;
  /** Extra classes for the panel shell (e.g. sidebar-anchored fixed position). */
  panelClassName?: string;
};

export const NotificationsPanel: React.FC<Props> = ({
  open,
  onClose,
  onUnreadChange,
  panelClassName,
}) => {
  const [tab, setTab] = useState<(typeof TABS)[number]['id']>('all');
  const [items, setItems] = useState<InAppNotification[]>([]);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.getInAppNotifications({
        category: tab === 'all' ? undefined : tab,
        limit: 40,
      });
      setItems(res.items ?? []);
      const unreadRes = await api.getInAppNotificationUnreadCount();
      onUnreadChange?.(unreadRes.unread ?? 0);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [tab, onUnreadChange]);

  useEffect(() => {
    if (open) void load();
  }, [open, load]);

  useEffect(() => {
    const s = getSocket();
    const onNote = (payload: InAppNotification) => {
      if (payload.forBell === false) return;
      setItems((prev) => {
        if (prev.some((p) => p.id === payload.id)) return prev;
        if (tab !== 'all' && payload.category !== tab) return prev;
        return [{ ...payload, unread: true }, ...prev].slice(0, 40);
      });
      void api.getInAppNotificationUnreadCount().then((r) => onUnreadChange?.(r.unread ?? 0));
    };
    s.on('workspace_notification', onNote);
    return () => {
      s.off('workspace_notification', onNote);
    };
  }, [tab, onUnreadChange]);

  const markAll = async () => {
    try {
      await api.markAllInAppNotificationsRead();
      setItems((prev) => prev.map((i) => ({ ...i, unread: false })));
      onUnreadChange?.(0);
    } catch {
      // ignore
    }
  };

  const markOne = async (id: string) => {
    try {
      await api.markInAppNotificationRead(id);
      setItems((prev) => prev.map((i) => (i.id === id ? { ...i, unread: false } : i)));
      void api.getInAppNotificationUnreadCount().then((r) => onUnreadChange?.(r.unread ?? 0));
    } catch {
      // ignore
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          <button
            type="button"
            className="fixed inset-0 z-[60] cursor-default bg-transparent"
            aria-label="Close notifications"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, y: 6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 4, scale: 0.98 }}
            transition={{ duration: 0.15 }}
            className={
              panelClassName ??
              'absolute right-0 top-full z-[70] mt-2 flex w-[min(380px,calc(100vw-1.5rem))] flex-col overflow-hidden rounded-xl border border-black/8 bg-white shadow-lg shadow-black/10'
            }
            role="dialog"
            aria-label="Notifications"
          >
            <div className="flex items-center justify-between border-b border-black/5 px-4 py-3">
              <h3 className="text-sm font-semibold text-neutral-900">Notifications</h3>
              <button
                type="button"
                onClick={() => void markAll()}
                className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:text-primary-hover"
              >
                <CheckCheck className="h-3.5 w-3.5" />
                Mark all read
              </button>
            </div>

            <div className="flex gap-1 border-b border-black/5 px-2 py-2">
              {TABS.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setTab(t.id)}
                  className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
                    tab === t.id
                      ? 'bg-[#e8ece8] text-primary'
                      : 'text-neutral-500 hover:bg-black/[0.04] hover:text-neutral-800'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>

            <div className="max-h-[min(420px,60vh)] overflow-y-auto">
              {loading && items.length === 0 ? (
                <p className="px-4 py-8 text-center text-sm text-neutral-400">Loading…</p>
              ) : items.length === 0 ? (
                <div className="flex flex-col items-center gap-2 px-4 py-10 text-center">
                  <Megaphone className="h-8 w-8 text-neutral-300" />
                  <p className="text-sm text-neutral-500">No notifications yet</p>
                </div>
              ) : (
                <ul className="divide-y divide-black/5">
                  {items.map((item) => (
                    <li key={item.id}>
                      <button
                        type="button"
                        onClick={() => {
                          if (item.unread) void markOne(item.id);
                        }}
                        className={`flex w-full gap-3 px-4 py-3 text-left transition-colors hover:bg-black/[0.02] ${
                          item.unread ? 'bg-[#f4f7f5]' : ''
                        }`}
                      >
                        <div className="mt-0.5">
                          <SeverityIcon severity={item.severity} />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-medium text-neutral-500">{item.title}</p>
                          <p className="mt-0.5 text-sm text-neutral-700">
                            {emphasizeEntity(item.message)}
                          </p>
                          <p className="mt-1 text-[11px] text-neutral-400">
                            {formatNotificationRelativeTime(Date.parse(item.createdAt))}
                          </p>
                        </div>
                        {item.unread && (
                          <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-primary" />
                        )}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
