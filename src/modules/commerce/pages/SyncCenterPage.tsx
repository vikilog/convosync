import React, { useState } from 'react';
import { motion } from 'motion/react';
import { CheckCircle2, CircleAlert, Clock3, Info, RefreshCw } from 'lucide-react';
import { SYNC_EVENTS, formatRelative } from '../mock/data';
import { SyncBadge } from '../components/badges';
import { PageHeader, cx } from '../components/ui';

const ICONS = {
  success: CheckCircle2,
  error: CircleAlert,
  pending: Clock3,
  info: Info,
} as const;

export function SyncCenterPage() {
  const [syncing, setSyncing] = useState(false);

  return (
    <div className={`${cx.page} max-w-4xl`}>
      <PageHeader
        title="Sync Center"
        subtitle="Meta Catalog ↔ ConvoSync timeline"
        actions={
          <button
            type="button"
            disabled={syncing}
            onClick={() => {
              setSyncing(true);
              window.setTimeout(() => setSyncing(false), 1400);
            }}
            className={`${cx.btnPrimary} disabled:opacity-60`}
          >
            <RefreshCw className={`h-3.5 w-3.5 ${syncing ? 'animate-spin' : ''}`} />
            {syncing ? 'Syncing…' : 'Sync now'}
          </button>
        }
      />

      <div className="grid gap-3 sm:grid-cols-4">
        {[
          { label: 'Connection', value: 'Connected' },
          { label: 'Last sync', value: '2h ago' },
          { label: 'Products synced', value: '24' },
          { label: 'Pending / errors', value: '1 / 1' },
        ].map((c) => (
          <div key={c.label} className={cx.cardPad}>
            <p className="text-[11px] font-semibold uppercase tracking-wide text-neutral-400">
              {c.label}
            </p>
            <p className="mt-2 text-lg font-semibold text-dark-navy">{c.value}</p>
          </div>
        ))}
      </div>

      <div className={cx.cardPad}>
        <div className="mb-5 flex items-center justify-between">
          <h3 className={cx.sectionTitle}>Meta Catalog</h3>
          <SyncBadge status="synced" />
        </div>

        <ol className="relative space-y-0 border-l border-black/10 pl-6">
          {SYNC_EVENTS.map((ev, i) => {
            const Icon = ICONS[ev.status];
            return (
              <motion.li
                key={ev.id}
                initial={{ opacity: 0, x: -6 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                className="relative pb-8 last:pb-0"
              >
                <span className="absolute -left-[31px] flex h-7 w-7 items-center justify-center rounded-full border border-black/5 bg-surface">
                  <Icon
                    className={`h-3.5 w-3.5 ${
                      ev.status === 'success'
                        ? 'text-emerald-600'
                        : ev.status === 'error'
                          ? 'text-red-600'
                          : ev.status === 'pending'
                            ? 'text-amber-600'
                            : 'text-sky-600'
                    }`}
                  />
                </span>
                <p className="text-sm font-semibold text-dark-navy">{ev.title}</p>
                <p className="mt-0.5 text-xs text-neutral-500">{ev.detail}</p>
                <p className="mt-1 text-[11px] text-neutral-400">
                  {formatRelative(ev.at)}
                  {typeof ev.count === 'number' ? ` · ${ev.count} items` : ''}
                </p>
              </motion.li>
            );
          })}
        </ol>
      </div>
    </div>
  );
}
