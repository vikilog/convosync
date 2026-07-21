import React from 'react';
import { LucideIcon, TrendingUp } from 'lucide-react';

export type StatCardVariant = 'contacts' | 'messages' | 'response' | 'journeys';

interface StatCardProps {
  variant: StatCardVariant;
  icon: LucideIcon;
  value: React.ReactNode;
  label: string;
  badge?: React.ReactNode;
  footer?: React.ReactNode;
  trend?: string;
}

const ACCENT: Record<StatCardVariant, string> = {
  contacts: 'bg-sky-500',
  messages: 'bg-primary',
  response: 'bg-amber-500',
  journeys: 'bg-violet-500',
};

const ICON: Record<StatCardVariant, string> = {
  contacts: 'bg-sky-50 text-sky-600',
  messages: 'bg-[#e8f0ec] text-primary',
  response: 'bg-amber-50 text-amber-600',
  journeys: 'bg-violet-50 text-violet-600',
};

export const StatCard: React.FC<StatCardProps> = ({
  variant,
  icon: Icon,
  value,
  label,
  badge,
  footer,
  trend,
}) => (
  <div className="relative overflow-hidden rounded-xl border border-black/5 bg-surface transition-shadow duration-200 hover:shadow-sm">
    <div className={`absolute inset-x-0 top-0 h-0.5 ${ACCENT[variant]}`} />

    <div className="flex items-start gap-4 p-4">
      <div
        className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-lg ${ICON[variant]}`}
      >
        <Icon className="h-5 w-5" />
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <p className="text-xs font-medium text-neutral-500">{label}</p>
          {badge ?? (trend ? (
            <span className="inline-flex items-center gap-0.5 text-[11px] font-semibold text-primary">
              <TrendingUp className="h-3 w-3" />
              {trend}
            </span>
          ) : null)}
        </div>
        <p className="mt-1 text-2xl font-semibold tracking-tight text-neutral-900">{value}</p>
        {footer ? <div className="mt-2">{footer}</div> : null}
      </div>
    </div>
  </div>
);
