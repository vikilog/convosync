/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import { Loader2, Mail, Plus } from 'lucide-react';
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
  onPurchased: () => void | Promise<void>;
};

function formatUsdPerUnit(usd: number): string {
  if (usd >= 1) return `$${usd}`;
  return `$${usd.toFixed(2)}`;
}

export function BillingAddonsPanel({ addonCatalog, onPurchased }: BillingAddonsPanelProps) {
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

    return (
      <div
        key={entry.type}
        className={`rounded-xl border p-4 ${
          highlight ? 'border-[#0284c7]/40 bg-[#f8f7fc]' : 'border-slate-200 bg-slate-50'
        }`}
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-sm font-bold text-gray-900">{entry.label}</p>
            <p className="mt-1 text-xs text-gray-500">{entry.description}</p>
            <p className="mt-2 text-sm font-semibold text-sky-600">
              {formatUsdPerUnit(entry.usdPerUnit)} / {entry.unitLabel}
              <span className="ml-1 font-normal text-gray-400">
                ({formatInrPaise(entry.unitPaise)} per block)
              </span>
            </p>
          </div>
          {highlight && <Mail className="h-5 w-5 shrink-0 text-sky-600" />}
        </div>

        <div className="mt-4 flex flex-wrap items-end gap-3">
          <label className="text-xs text-gray-500">
            Quantity
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
              className="mt-1 block w-24 rounded-lg border border-slate-200 px-2 py-1.5 text-sm text-gray-900"
            />
          </label>
          <div className="text-xs text-gray-600">
            Total: <span className="font-bold text-gray-900">{formatInrPaise(totalPaise)}</span>
          </div>
          <button
            type="button"
            disabled={checkoutType !== null}
            onClick={() => void purchaseAddon(entry)}
            className="ml-auto inline-flex items-center gap-1.5 rounded-xl bg-sky-600 px-3 py-2 text-sm font-bold text-white hover:bg-sky-700 disabled:opacity-60"
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
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div>
        <p className="text-sm font-bold text-gray-900">Add-ons</p>
        <p className="mt-1 text-xs text-gray-500">
          Increase limits beyond your plan. Platform email is delivered via Resend at $1 per 1,000
          sends.
        </p>
      </div>

      {error && (
        <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
          {error}
        </div>
      )}

      <div className="mt-4 space-y-3">
        {emailAddon ? renderAddonCard(emailAddon, true) : null}
        {otherAddons.map((entry) => renderAddonCard(entry))}
      </div>
    </section>
  );
}
