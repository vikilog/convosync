import React from 'react';
import type { AiIndexStatus, InventoryStatus, PublishStatus, SyncStatus } from '../types';

const base =
  'inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[11px] font-semibold tracking-wide';

export function InventoryBadge({ status }: { status: InventoryStatus }) {
  const map = {
    in_stock: 'bg-emerald-500/10 text-emerald-700',
    low: 'bg-amber-500/10 text-amber-700',
    out_of_stock: 'bg-red-500/10 text-red-700',
  } as const;
  const label = { in_stock: 'In stock', low: 'Low', out_of_stock: 'Out of stock' } as const;
  return <span className={`${base} ${map[status]}`}>{label[status]}</span>;
}

export function PublishBadge({ status }: { status: PublishStatus }) {
  const map = {
    published: 'bg-primary/10 text-primary',
    draft: 'bg-neutral-500/10 text-neutral-600',
    archived: 'bg-neutral-500/10 text-neutral-500',
  } as const;
  return <span className={`${base} capitalize ${map[status]}`}>{status}</span>;
}

export function SyncBadge({ status }: { status: SyncStatus }) {
  const map = {
    synced: 'bg-sky-500/10 text-sky-700',
    pending: 'bg-amber-500/10 text-amber-700',
    error: 'bg-red-500/10 text-red-700',
    never: 'bg-neutral-500/10 text-neutral-500',
  } as const;
  const label = { synced: 'Synced', pending: 'Pending', error: 'Error', never: 'Not synced' } as const;
  return <span className={`${base} ${map[status]}`}>{label[status]}</span>;
}

export function AiBadge({ status }: { status: AiIndexStatus }) {
  const map = {
    indexed: 'bg-violet-500/10 text-violet-700',
    stale: 'bg-amber-500/10 text-amber-700',
    pending: 'bg-neutral-500/10 text-neutral-500',
    failed: 'bg-red-500/10 text-red-700',
  } as const;
  const label = {
    indexed: 'AI ready',
    stale: 'AI stale',
    pending: 'AI pending',
    failed: 'AI failed',
  } as const;
  return <span className={`${base} ${map[status]}`}>{label[status]}</span>;
}

export function WhatsAppBadge({ on }: { on: boolean }) {
  return (
    <span
      className={`${base} ${on ? 'bg-[#25d366]/15 text-[#128c7e]' : 'bg-neutral-500/10 text-neutral-500'}`}
    >
      {on ? 'WhatsApp' : 'Not on WA'}
    </span>
  );
}

export function CategoryChip({ label }: { label: string }) {
  return (
    <span className="inline-flex rounded-full border border-black/5 bg-surface-muted px-2.5 py-0.5 text-[11px] font-medium text-neutral-700">
      {label}
    </span>
  );
}

export function BrandChip({ label, initial }: { label: string; initial?: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-black/5 bg-surface px-2 py-0.5 text-[11px] font-medium text-neutral-700">
      <span className="flex h-4 w-4 items-center justify-center rounded-full bg-primary/15 text-[9px] font-bold text-primary">
        {initial || label.charAt(0)}
      </span>
      {label}
    </span>
  );
}
