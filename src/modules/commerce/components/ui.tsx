import React from 'react';

/** Shared ConvoSync light surfaces — same as Dashboard (surface on surface-muted). */
export const cx = {
  page: 'mx-auto max-w-7xl space-y-5 p-4 sm:p-6',
  card: 'rounded-xl border border-black/5 bg-surface',
  cardPad: 'rounded-xl border border-black/5 bg-surface p-5',
  title: 'text-2xl font-semibold tracking-tight text-dark-navy',
  subtitle: 'mt-1 text-sm text-neutral-500',
  sectionTitle: 'text-sm font-semibold text-dark-navy',
  input:
    'w-full rounded-xl border border-black/5 bg-surface-muted py-2.5 pl-9 pr-3 text-sm text-dark-navy outline-none placeholder:text-neutral-400 focus:ring-2 focus:ring-primary/15',
  btnPrimary:
    'inline-flex items-center gap-1.5 rounded-xl bg-primary px-3.5 py-2.5 text-xs font-semibold text-white transition-colors hover:bg-primary-hover',
  btnGhost:
    'inline-flex items-center gap-1.5 rounded-xl border border-black/8 bg-surface px-3.5 py-2.5 text-xs font-semibold text-neutral-700 transition-colors hover:bg-surface-muted',
  select:
    'rounded-xl border border-black/5 bg-surface-muted px-3 py-2.5 text-xs font-medium text-neutral-700',
};

export function PageHeader({
  title,
  subtitle,
  actions,
}: {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
}) {
  return (
    <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        <h2 className={cx.title}>{title}</h2>
        {subtitle ? <p className={cx.subtitle}>{subtitle}</p> : null}
      </div>
      {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
    </header>
  );
}
