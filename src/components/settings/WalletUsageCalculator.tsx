/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useMemo, useState } from 'react';
import { Calculator, RotateCcw } from 'lucide-react';
import { BRAND_GOLD, formatCc, formatCcInrSubtitle } from '../../lib/convocoins';
import {
  computeWalletUsageBreakdown,
  computeWalletUsageTotalCc,
  EMPTY_WALLET_USAGE,
  WALLET_USAGE_FIELDS,
  type WalletUsageCounts,
  type WalletUsageField,
} from '../../lib/walletUsageRates';

const CARD_CLASS =
  'rounded-xl border border-[#E5E7EB] bg-white p-5 shadow-[0_1px_2px_rgba(0,0,0,0.04)] h-full flex flex-col';

type WalletUsageCalculatorProps = {
  balanceCc?: number;
  onSuggestRecharge?: (cc: number) => void;
  className?: string;
};

function clampQty(value: number, max: number): number {
  if (!Number.isFinite(value) || value < 0) return 0;
  return Math.min(max, Math.round(value));
}

export function WalletUsageCalculator({
  balanceCc,
  onSuggestRecharge,
  className = '',
}: WalletUsageCalculatorProps) {
  const [counts, setCounts] = useState<WalletUsageCounts>({ ...EMPTY_WALLET_USAGE });

  const totalCc = useMemo(() => computeWalletUsageTotalCc(counts), [counts]);
  const breakdown = useMemo(() => computeWalletUsageBreakdown(counts), [counts]);
  const hasUsage = breakdown.length > 0;

  const shortfallCc =
    balanceCc != null && totalCc > balanceCc
      ? Math.round((totalCc - balanceCc) * 100) / 100
      : 0;

  const suggestedRechargeCc = hasUsage ? Math.max(100, Math.ceil(totalCc)) : 0;

  function setField(key: WalletUsageField, value: number) {
    const max = WALLET_USAGE_FIELDS.find((f) => f.key === key)?.sliderMax ?? 10000;
    setCounts((prev) => ({ ...prev, [key]: clampQty(value, max) }));
  }

  function reset() {
    setCounts({ ...EMPTY_WALLET_USAGE });
  }

  return (
    <section className={`${CARD_CLASS} ${className}`.trim()}>
      <div className="flex items-start justify-between gap-3 shrink-0">
        <div>
          <h3 className="text-sm font-bold text-slate-900 inline-flex items-center gap-1.5">
            <Calculator className="h-4 w-4 text-emerald-600" aria-hidden />
            Usage calculator
          </h3>
          <p className="mt-0.5 text-xs text-slate-500">
            Drag sliders or type volumes — see estimated CC
          </p>
        </div>
        <button
          type="button"
          onClick={reset}
          className="inline-flex shrink-0 items-center gap-1 rounded-full border border-gray-200 px-2.5 py-1 text-[11px] font-semibold text-slate-600 hover:bg-gray-50 cursor-pointer"
        >
          <RotateCcw className="h-3 w-3" aria-hidden />
          Reset
        </button>
      </div>

      <div className="mt-4 flex-1 space-y-4 overflow-y-auto max-h-[min(420px,50vh)] pr-0.5">
        {WALLET_USAGE_FIELDS.map((field) => {
          const value = counts[field.key];
          return (
            <div key={field.key} className="space-y-1.5">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-slate-800">{field.label}</p>
                  <p className="text-[10px] text-slate-500">{field.hint}</p>
                </div>
                <input
                  type="number"
                  min={0}
                  max={field.sliderMax}
                  step={field.step}
                  inputMode="numeric"
                  aria-label={`${field.label} quantity`}
                  value={value === 0 ? '' : value}
                  onChange={(e) => {
                    const raw = e.target.value;
                    if (raw === '') {
                      setField(field.key, 0);
                      return;
                    }
                    setField(field.key, Number(raw));
                  }}
                  placeholder="0"
                  className="w-[5.5rem] shrink-0 rounded-lg border border-[#E5E7EB] bg-white px-2 py-1.5 text-right text-sm font-semibold tabular-nums text-slate-900 placeholder:font-normal placeholder:text-slate-400 focus:border-channel-green focus:outline-none focus:ring-2 focus:ring-emerald-100"
                />
              </div>
              <input
                type="range"
                min={0}
                max={field.sliderMax}
                step={field.step}
                value={value}
                onChange={(e) => setField(field.key, Number(e.target.value))}
                aria-label={`${field.label} slider`}
                className="wallet-usage-slider w-full"
              />
              <div className="flex justify-between text-[10px] text-slate-400 tabular-nums">
                <span>0</span>
                <span>{field.sliderMax.toLocaleString('en-IN')}</span>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-4 shrink-0 rounded-lg border border-emerald-100 bg-emerald-50/60 p-3.5">
        {hasUsage ? (
          <ul className="space-y-1 text-[11px] text-slate-700 max-h-28 overflow-y-auto">
            {breakdown.map((row) => (
              <li key={row.key} className="flex items-center justify-between gap-2">
                <span className="truncate">
                  {row.label}{' '}
                  <span className="text-slate-500">× {row.quantity.toLocaleString('en-IN')}</span>
                </span>
                <span className="font-semibold tabular-nums shrink-0" style={{ color: BRAND_GOLD }}>
                  {row.cc.toLocaleString('en-IN', { maximumFractionDigits: 2 })} CC
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-xs text-slate-500">Adjust sliders to estimate monthly usage.</p>
        )}

        <div className="mt-3 border-t border-emerald-100/80 pt-3">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">
            Estimated total
          </p>
          <p className="text-2xl font-extrabold leading-tight" style={{ color: BRAND_GOLD }}>
            {formatCc(totalCc)}
          </p>
          <p className="text-xs text-slate-500">{formatCcInrSubtitle(totalCc)}</p>

          {shortfallCc > 0 ? (
            <p className="mt-2 text-[11px] text-amber-800 bg-amber-50 border border-amber-100 rounded-lg px-2 py-1.5">
              Need ~<strong>{formatCc(shortfallCc, { compact: true })}</strong> more than balance.
            </p>
          ) : null}
        </div>
      </div>

      {hasUsage && onSuggestRecharge ? (
        <button
          type="button"
          onClick={() => onSuggestRecharge(suggestedRechargeCc)}
          className="mt-3 w-full shrink-0 btn-primary text-sm"
        >
          Recharge {formatCc(suggestedRechargeCc, { compact: true })}
        </button>
      ) : null}

      <p className="mt-2 shrink-0 text-[10px] text-slate-500 leading-snug">
        Rates match the pricing table. Inbox is free; AI uses GPT cost +35%.
      </p>
    </section>
  );
}
