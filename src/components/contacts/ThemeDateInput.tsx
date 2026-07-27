/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react';

type Props = {
  value: string; // YYYY-MM-DD or ''
  onChange: (value: string) => void;
  'aria-label'?: string;
  placeholder?: string;
  /** Optional max/min as YYYY-MM-DD */
  min?: string;
  max?: string;
};

const WEEKDAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

function pad(n: number) {
  return String(n).padStart(2, '0');
}

function toYmd(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function parseYmd(ymd: string): Date | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(ymd)) return null;
  const [y, m, day] = ymd.split('-').map(Number);
  const d = new Date(y, m - 1, day);
  if (d.getFullYear() !== y || d.getMonth() !== m - 1 || d.getDate() !== day) return null;
  return d;
}

function formatDisplay(ymd: string): string {
  const d = parseYmd(ymd);
  if (!d) return '';
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`;
}

function monthLabel(year: number, month: number): string {
  return new Date(year, month, 1).toLocaleString('en-IN', { month: 'short', year: 'numeric' });
}

function buildGrid(year: number, month: number): (Date | null)[] {
  const first = new Date(year, month, 1);
  const startPad = first.getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: (Date | null)[] = [];
  for (let i = 0; i < startPad; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(year, month, d));
  while (cells.length % 7 !== 0) cells.push(null);
  return cells;
}

export function ThemeDateInput({
  value,
  onChange,
  'aria-label': ariaLabel,
  placeholder = 'dd/mm/yyyy',
  min,
  max,
}: Props) {
  const rootRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const selected = parseYmd(value);
  const initial = selected ?? new Date();
  const [viewYear, setViewYear] = useState(initial.getFullYear());
  const [viewMonth, setViewMonth] = useState(initial.getMonth());

  useEffect(() => {
    if (!open) return;
    const base = selected ?? new Date();
    setViewYear(base.getFullYear());
    setViewMonth(base.getMonth());
  }, [open, value]);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onDoc);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDoc);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const cells = useMemo(() => buildGrid(viewYear, viewMonth), [viewYear, viewMonth]);
  const todayYmd = toYmd(new Date());
  const minDate = min ? parseYmd(min) : null;
  const maxDate = max ? parseYmd(max) : null;

  const shiftMonth = (delta: number) => {
    const d = new Date(viewYear, viewMonth + delta, 1);
    setViewYear(d.getFullYear());
    setViewMonth(d.getMonth());
  };

  const pick = (d: Date) => {
    const ymd = toYmd(d);
    if (minDate && d < minDate) return;
    if (maxDate && d > maxDate) return;
    onChange(ymd);
    setOpen(false);
  };

  const isDisabled = (d: Date) => {
    if (minDate) {
      const t = new Date(d.getFullYear(), d.getMonth(), d.getDate());
      if (t < new Date(minDate.getFullYear(), minDate.getMonth(), minDate.getDate())) return true;
    }
    if (maxDate) {
      const t = new Date(d.getFullYear(), d.getMonth(), d.getDate());
      if (t > new Date(maxDate.getFullYear(), maxDate.getMonth(), maxDate.getDate())) return true;
    }
    return false;
  };

  return (
    <div ref={rootRef} className="relative shrink-0">
      <button
        type="button"
        aria-label={ariaLabel}
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        className={`inline-flex w-[148px] items-center gap-2 rounded-lg border bg-surface px-2.5 py-2 text-left text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-primary/20 ${
          open
            ? 'border-primary/40 ring-2 ring-primary/15'
            : 'border-black/5 hover:border-primary/25'
        }`}
      >
        <Calendar className={`h-4 w-4 shrink-0 ${open || value ? 'text-primary' : 'text-slate-400'}`} />
        <span className={`truncate ${value ? 'text-slate-800' : 'text-slate-400'}`}>
          {value ? formatDisplay(value) : placeholder}
        </span>
      </button>

      {open && (
        <div
          role="dialog"
          aria-label={ariaLabel ?? 'Choose date'}
          className="absolute left-0 top-full z-50 mt-1.5 w-[280px] rounded-xl border border-primary/15 bg-white p-3 shadow-xl shadow-primary/10"
        >
          <div className="mb-2 flex items-center justify-between gap-2">
            <button
              type="button"
              onClick={() => shiftMonth(-1)}
              className="rounded-lg p-1.5 text-slate-500 hover:bg-primary/10 hover:text-primary"
              aria-label="Previous month"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <p className="text-sm font-bold text-primary">{monthLabel(viewYear, viewMonth)}</p>
            <button
              type="button"
              onClick={() => shiftMonth(1)}
              className="rounded-lg p-1.5 text-slate-500 hover:bg-primary/10 hover:text-primary"
              aria-label="Next month"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          <div className="mb-1 grid grid-cols-7 gap-0.5">
            {WEEKDAYS.map((w) => (
              <div
                key={w}
                className="py-1 text-center text-[10px] font-bold uppercase tracking-wide text-primary/50"
              >
                {w}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-0.5">
            {cells.map((d, i) => {
              if (!d) return <div key={`e-${i}`} className="h-8" />;
              const ymd = toYmd(d);
              const selectedDay = ymd === value;
              const isToday = ymd === todayYmd;
              const disabled = isDisabled(d);
              return (
                <button
                  key={ymd}
                  type="button"
                  disabled={disabled}
                  onClick={() => pick(d)}
                  className={`h-8 rounded-lg text-xs font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-30 ${
                    selectedDay
                      ? 'bg-primary text-white shadow-sm'
                      : isToday
                        ? 'bg-primary/10 text-primary ring-1 ring-inset ring-primary/30'
                        : 'text-slate-700 hover:bg-primary/10 hover:text-primary'
                  }`}
                >
                  {d.getDate()}
                </button>
              );
            })}
          </div>

          <div className="mt-2 flex items-center justify-between border-t border-primary/10 pt-2">
            <button
              type="button"
              onClick={() => {
                onChange('');
                setOpen(false);
              }}
              className="text-xs font-semibold text-slate-500 hover:text-slate-700"
            >
              Clear
            </button>
            <button
              type="button"
              onClick={() => pick(new Date())}
              className="text-xs font-semibold text-primary hover:underline"
            >
              Today
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
