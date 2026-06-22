/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import { Loader2, Mail, Minus, Plus } from 'lucide-react';
import { api, formatCatchError } from '../../lib/api';
import { formatInrPaise } from '../../lib/billingFormat';
import { openRazorpayCheckout } from '../../lib/razorpay';

export type AddonCatalogEntry = {
  type: string;
  label: string;
  unitLabel: string;
  unitPaise: number;
  usdPerUnit: number;
  description: string;
  minQuantity: number;
  maxQuantity: number;
};

type BillingAddonsPanelProps = {
  addonCatalog: AddonCatalogEntry[];
  fx?: {
    usdInrRate: number;
    fetchedAt: string;
    source: string;
  } | null;
  onPurchased: () => void | Promise<void>;
};

function formatUsdPerUnit(usd: number): string {
  if (usd >= 1) return `$${usd}`;
  return `$${usd.toFixed(2)}`;
}

export function BillingAddonsPanel({ addonCatalog, fx, onPurchased }: BillingAddonsPanelProps) {
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [checkoutType, setCheckoutType] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const emailAddon = addonCatalog.find((item) => item.type === 'emails');
  const otherAddons = addonCatalog.filter((item) => item.type !== 'emails');

  async function purchaseAddon(entry: AddonCatalogEntry) {
    const quantity = quantities[entry.type] ?? entry.minQuantity;
    setCheckoutType(entry.type);
    setError(null);
    try {
      const order = (await api.createBillingOrder({
        purpose: 'addon',
        addonType: entry.type,
        quantity,
        description: `${entry.label} × ${quantity}`,
      })) as {
        orderId: string;
        keyId: string;
        amountPaise: number;
      };

      await openRazorpayCheckout({
        key: order.keyId,
        order_id: order.orderId,
        amount: order.amountPaise,
        currency: 'INR',
        name: 'ConvoSync',
        description: `${entry.label} add-on`,
        theme: { color: '#0284c7' },
        onSuccess: async (response) => {
          if (!response.razorpay_order_id || !response.razorpay_signature) {
            throw new Error('Incomplete payment response');
          }
          await api.verifyBillingOrder({
            razorpay_order_id: response.razorpay_order_id,
            razorpay_payment_id: response.razorpay_payment_id,
            razorpay_signature: response.razorpay_signature,
          });
          await onPurchased();
        },
      });
    } catch (err) {
      const message = formatCatchError(err);
      if (message !== 'Payment cancelled') {
        setError(message);
      }
    } finally {
      setCheckoutType(null);
    }
  }

  function renderAddonCard(entry: AddonCatalogEntry, highlight = false) {
    const quantity = quantities[entry.type] ?? entry.minQuantity;
    const totalPaise = entry.unitPaise * quantity;
    const checkoutBusy = checkoutType !== null;

    return (
      <div
        key={entry.type}
        className={`rounded-xl border p-4 transition-colors ${
          highlight ? 'border-sky-200 bg-sky-50/40' : 'border-slate-200 bg-white'
        }`}
      >
        <div className="flex items-start justify-between gap-2">
          <div>
            <div className="flex items-center gap-2">
              <p className="text-sm font-semibold text-slate-900">{entry.label}</p>
              {highlight ? (
                <span className="rounded-full bg-sky-100 px-2 py-0.5 text-[11px] font-semibold text-sky-700">
                  Recommended
                </span>
              ) : null}
            </div>
            <p className="mt-1 text-xs text-slate-500">{entry.description}</p>
            <p className="mt-2 text-sm font-semibold text-slate-900">
              {formatUsdPerUnit(entry.usdPerUnit)} / {entry.unitLabel}{' '}
              <span className="font-normal text-slate-500">
                ({formatInrPaise(entry.unitPaise)} per block)
              </span>
            </p>
          </div>
          {highlight && <Mail className="h-4 w-4 shrink-0 text-sky-600" />}
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 pt-3">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
              Quantity
            </p>
            <div className="mt-1 inline-flex items-center rounded-lg border border-slate-200 bg-white">
              <button
                type="button"
                disabled={checkoutBusy || quantity <= entry.minQuantity}
                onClick={() =>
                  setQuantities((prev) => ({
                    ...prev,
                    [entry.type]: Math.max(entry.minQuantity, quantity - 1),
                  }))
                }
                className="inline-flex h-9 w-9 cursor-pointer items-center justify-center text-slate-500 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                aria-label={`Decrease ${entry.label} quantity`}
              >
                <Minus className="h-3.5 w-3.5" />
              </button>
              <input
                type="number"
                min={entry.minQuantity}
                max={entry.maxQuantity}
                value={quantity}
                onChange={(e) =>
                  setQuantities((prev) => ({
                    ...prev,
                    [entry.type]: Math.min(
                      entry.maxQuantity,
                      Math.max(entry.minQuantity, Number.parseInt(e.target.value, 10) || entry.minQuantity)
                    ),
                  }))
                }
                className="h-9 w-16 border-x border-slate-200 text-center text-sm font-semibold text-slate-800 focus:outline-none"
              />
              <button
                type="button"
                disabled={checkoutBusy || quantity >= entry.maxQuantity}
                onClick={() =>
                  setQuantities((prev) => ({
                    ...prev,
                    [entry.type]: Math.min(entry.maxQuantity, quantity + 1),
                  }))
                }
                className="inline-flex h-9 w-9 cursor-pointer items-center justify-center text-slate-500 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                aria-label={`Increase ${entry.label} quantity`}
              >
                <Plus className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>

          <div className="text-right">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Total</p>
            <p className="mt-1 text-base font-semibold text-slate-900">{formatInrPaise(totalPaise)}</p>
          </div>

          <button
            type="button"
            disabled={checkoutBusy}
            onClick={() => void purchaseAddon(entry)}
            className="inline-flex h-10 cursor-pointer items-center gap-1.5 rounded-lg bg-sky-700 px-4 text-sm font-semibold text-white transition-colors hover:bg-sky-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {checkoutType === entry.type ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Plus className="h-3.5 w-3.5" />
            )}
            Buy add-on
          </button>
        </div>
      </div>
    );
  }

  if (addonCatalog.length === 0) return null;

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-5">
      <div>
        <p className="text-sm font-semibold text-slate-900">Add-ons</p>
        <p className="mt-1 text-xs text-slate-500">
          Increase limits beyond your plan. Platform email is delivered via Resend at $1 per 1,000
          sends.
        </p>
        {fx && (
          <p className="mt-1 text-xs text-slate-500">
            Live FX: 1 USD = ₹{fx.usdInrRate.toFixed(2)} · updated{' '}
            {new Date(fx.fetchedAt).toLocaleTimeString('en-IN', {
              hour: '2-digit',
              minute: '2-digit',
            })}
          </p>
        )}
      </div>

      {error && (
        <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
          {error}
        </div>
      )}

      <div className="mt-4 grid gap-3 lg:grid-cols-2">
        {emailAddon ? renderAddonCard(emailAddon, true) : null}
        {otherAddons.map((entry) => renderAddonCard(entry))}
      </div>
    </section>
  );
}
