/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useCallback, useEffect, useState } from 'react';
import { Loader2, Receipt } from 'lucide-react';
import { api, formatCatchError } from '../../lib/api';
import {
  formatBillingDate,
  formatInrPaise,
  formatTransactionType,
  invoiceStatusStyles,
} from '../../lib/billingFormat';

type BillingTransaction = {
  id: string;
  source: 'invoice' | 'addon';
  type: string;
  amountPaise: number;
  currency: string;
  status: string;
  description: string | null;
  razorpayOrderId: string | null;
  razorpayPaymentId: string | null;
  razorpayInvoiceId: string | null;
  paidAt: string | null;
  createdAt: string;
};

export function InvoiceLogsPanel() {
  const [transactions, setTransactions] = useState<BillingTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = (await api.getBillingInvoices(50)) as { transactions: BillingTransaction[] };
      setTransactions(res.transactions ?? []);
    } catch (err) {
      setError(formatCatchError(err));
      setTransactions([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-neutral-400">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-5xl space-y-4">
      <div className="flex items-start gap-3 rounded-xl border border-primary/15 bg-primary/[0.06] px-4 py-3 text-sm text-neutral-700">
        <Receipt className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
        <p>
          Every charge, renewal, and add-on purchase with Razorpay payment and order IDs.
        </p>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {transactions.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-black/10 bg-surface py-16 text-center text-sm text-neutral-400">
          No invoices or transactions yet.
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-black/5 bg-surface">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-left text-xs">
              <thead>
                <tr className="border-b border-black/5 bg-surface-muted text-[11px] font-semibold uppercase tracking-wider text-neutral-400">
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3">Description</th>
                  <th className="px-4 py-3">Type</th>
                  <th className="px-4 py-3">Amount</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Payment ID</th>
                  <th className="px-4 py-3">Order ID</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black/5">
                {transactions.map((row) => (
                  <tr key={`${row.source}-${row.id}`} className="hover:bg-surface-muted/70">
                    <td className="whitespace-nowrap px-4 py-3 text-neutral-600">
                      {formatBillingDate(row.paidAt ?? row.createdAt)}
                    </td>
                    <td className="max-w-[200px] px-4 py-3 font-medium text-neutral-900">
                      {row.description ?? '—'}
                    </td>
                    <td className="px-4 py-3 text-neutral-600">{formatTransactionType(row.type)}</td>
                    <td className="whitespace-nowrap px-4 py-3 font-semibold text-neutral-900">
                      {formatInrPaise(row.amountPaise, row.currency)}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex rounded-full border px-2 py-0.5 text-sm font-bold capitalize ${
                          invoiceStatusStyles[row.status] ?? invoiceStatusStyles.created
                        }`}
                      >
                        {row.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-neutral-500">
                      {row.razorpayPaymentId ?? '—'}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-neutral-500">
                      {row.razorpayOrderId ?? '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
