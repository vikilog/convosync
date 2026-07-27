import React from 'react';
import { motion } from 'motion/react';
import type { LucideIcon } from 'lucide-react';
import { cx } from './ui';

type Props = {
  label: string;
  value: string | number;
  hint?: string;
  icon: LucideIcon;
  accent?: string;
};

export function MetricCard({
  label,
  value,
  hint,
  icon: Icon,
  accent = 'bg-primary/10 text-primary',
}: Props) {
  return (
    <motion.div
      whileHover={{ y: -2 }}
      transition={{ type: 'spring', stiffness: 400, damping: 28 }}
      className={`${cx.card} p-5`}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-medium text-neutral-500">{label}</p>
          <p className="mt-2 text-2xl font-semibold tracking-tight text-dark-navy">
            {value}
          </p>
          {hint ? <p className="mt-1 text-[11px] text-neutral-400">{hint}</p> : null}
        </div>
        <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${accent}`}>
          <Icon className="h-5 w-5" aria-hidden />
        </div>
      </div>
    </motion.div>
  );
}
