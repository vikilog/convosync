import React, { useCallback, useEffect, useState } from 'react';
import {
  CheckCheck,
  Megaphone,
  AlertTriangle,
  CheckCircle2,
  Info,
  XCircle,
  X,
  Activity,
} from 'lucide-react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
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
  { id: 'activity', label: 'Activity' },
] as const;

type TabId = (typeof TABS)[number]['id'];

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
      <span className="font-semibold text-swiss-ink">{m[1]}</span>
      {m[2]}
    </>
  );
}

type Props = {
  open: boolean;
  onClose: () => void;
  onUnreadChange?: (n: number) => void;
};

export const NotificationsPanel: React.FC<Props> = ({
  open,
  onClose,
  onUnreadChange,
}) => {
  const reduceMotion = useReducedMotion();
  const [tab, setTab] = useState<TabId>('all');
  const [items, setItems] = useState<InAppNotification[]>([]);
  const [loading, setLoading] = useState(false);
  const isActivity = tab === 'activity';

  const load = useCallback(async () => {
    setLoading(true);
    setItems([]);
    try {
      if (tab === 'activity') {
        const res = await api.getRecentActivity(40);
        setItems(
          (res.items ?? []).map((i) => ({
            ...i,
            unread: false,
            forBell: false,
          }))
        );
      } else {
        const res = await api.getInAppNotifications({
          category: tab === 'all' ? undefined : tab,
          limit: 40,
        });
        setItems(res.items ?? []);
        const unreadRes = await api.getInAppNotificationUnreadCount();
        onUnreadChange?.(unreadRes.unread ?? 0);
      }
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
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  useEffect(() => {
    const s = getSocket();
    const onNote = (payload: InAppNotification) => {
      if (payload.forBell === false) return;
      if (tab === 'activity') return;
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
          <motion.button
            type="button"
            aria-label="Close notifications"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: reduceMotion ? 0 : 0.18 }}
            className="fixed inset-0 z-[60] cursor-pointer border-0 bg-gray-900/35"
            onClick={onClose}
          />
          <motion.aside
            role="dialog"
            aria-modal="true"
            aria-label="Notifications"
            initial={reduceMotion ? false : { x: '100%' }}
            animate={{ x: 0 }}
            exit={reduceMotion ? undefined : { x: '100%' }}
            transition={
              reduceMotion
                ? { duration: 0 }
                : { type: 'spring', damping: 28, stiffness: 320 }
            }
            className="fixed inset-y-0 right-0 z-[70] flex w-full max-w-[min(400px,92vw)] flex-col overflow-hidden bg-white shadow-2xl ring-1 ring-black/5"
          >
            <div className="flex shrink-0 items-center justify-between border-b border-swiss-line px-4 py-3">
              <h3 className="text-sm font-semibold text-swiss-ink">
                {isActivity ? 'Recent activity' : 'Notifications'}
              </h3>
              <div className="flex items-center gap-1">
                {!isActivity && (
                  <button
                    type="button"
                    onClick={() => void markAll()}
                    className="inline-flex items-center gap-1 rounded-md px-2 py-1.5 text-xs font-medium text-primary hover:bg-[#e8ece8] hover:text-primary-hover"
                  >
                    <CheckCheck className="h-3.5 w-3.5" />
                    Mark all read
                  </button>
                )}
                <button
                  type="button"
                  onClick={onClose}
                  className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-swiss-faint hover:bg-black/[0.04] hover:text-swiss-ink"
                  aria-label="Close"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div className="flex shrink-0 gap-1 border-b border-swiss-line px-2 py-2">
              {TABS.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setTab(t.id)}
                  className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
                    tab === t.id
                      ? 'bg-[#e8ece8] text-primary'
                      : 'text-swiss-muted hover:bg-black/[0.04] hover:text-swiss-ink'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto">
              {loading && items.length === 0 ? (
                <p className="px-4 py-8 text-center text-sm text-swiss-faint">Loading…</p>
              ) : items.length === 0 ? (
                <div className="flex flex-col items-center gap-2 px-4 py-10 text-center">
                  {isActivity ? (
                    <Activity className="h-8 w-8 text-swiss-faint" />
                  ) : (
                    <Megaphone className="h-8 w-8 text-swiss-faint" />
                  )}
                  <p className="text-sm text-swiss-muted">
                    {isActivity ? 'No recent activity' : 'No notifications yet'}
                  </p>
                </div>
              ) : (
                <ul className="divide-y divide-swiss-line">
                  {items.map((item) => (
                    <li key={item.id}>
                      {isActivity ? (
                        <div className="flex w-full gap-3 px-4 py-3 text-left">
                          <div className="mt-0.5">
                            <SeverityIcon severity={item.severity} />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-sm text-swiss-ink">
                              <span className="font-medium text-swiss-ink">{item.title}</span>
                              <span className="text-swiss-muted"> — {item.message}</span>
                            </p>
                            <p className="mt-1 text-[11px] text-swiss-faint">
                              {formatNotificationRelativeTime(Date.parse(item.createdAt))}
                            </p>
                          </div>
                        </div>
                      ) : (
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
                            <p className="text-xs font-medium text-swiss-muted">{item.title}</p>
                            <p className="mt-0.5 text-sm text-swiss-ink">
                              {emphasizeEntity(item.message)}
                            </p>
                            <p className="mt-1 text-[11px] text-swiss-faint">
                              {formatNotificationRelativeTime(Date.parse(item.createdAt))}
                            </p>
                          </div>
                          {item.unread && (
                            <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-primary" />
                          )}
                        </button>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
};
