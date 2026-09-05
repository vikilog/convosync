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
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';

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
      <div className="flex items-center justify-center py-20 text-swiss-faint">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  return (
    <div className="w-full space-y-4">
      <div className="flex items-start gap-3 rounded-xl border border-swiss-accent/15 bg-swiss-accent/[0.06] px-4 py-3 text-sm text-swiss-ink">
        <Receipt className="mt-0.5 h-4 w-4 shrink-0 text-swiss-accent" />
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
        <div className="rounded-2xl border border-dashed border-black/10 bg-white py-16 text-center text-sm text-swiss-faint">
          No invoices or transactions yet.
        </div>
      ) : (
        <div className="overflow-hidden bg-white border border-swiss-line">
          <Table className="min-w-[720px] text-left text-xs">
              <TableHeader>
                <TableRow className="border-b border-swiss-line bg-white text-[11px] font-semibold uppercase tracking-wider text-swiss-faint">
                  <TableHead className="px-4 py-3 whitespace-normal">Date</TableHead>
                  <TableHead className="px-4 py-3 whitespace-normal">Description</TableHead>
                  <TableHead className="px-4 py-3 whitespace-normal">Type</TableHead>
                  <TableHead className="px-4 py-3 whitespace-normal">Amount</TableHead>
                  <TableHead className="px-4 py-3 whitespace-normal">Status</TableHead>
                  <TableHead className="px-4 py-3 whitespace-normal">Payment ID</TableHead>
                  <TableHead className="px-4 py-3 whitespace-normal">Order ID</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody className="divide-y divide-swiss-line">
                {transactions.map((row) => (
                  <TableRow key={`${row.source}-${row.id}`} className="hover:bg-surface-muted/70">
                    <TableCell className="whitespace-nowrap px-4 py-3 text-swiss-muted">
                      {formatBillingDate(row.paidAt ?? row.createdAt)}
                    </TableCell>
                    <TableCell className="max-w-[200px] px-4 py-3 font-medium text-swiss-ink whitespace-normal">
                      {row.description ?? '—'}
                    </TableCell>
                    <TableCell className="px-4 py-3 text-swiss-muted whitespace-normal">{formatTransactionType(row.type)}</TableCell>
                    <TableCell className="whitespace-nowrap px-4 py-3 font-semibold text-swiss-ink">
                      {formatInrPaise(row.amountPaise, row.currency)}
                    </TableCell>
                    <TableCell className="px-4 py-3">
                      <span
                        className={`inline-flex rounded-full border px-2 py-0.5 text-sm font-bold capitalize ${
                          invoiceStatusStyles[row.status] ?? invoiceStatusStyles.created
                        }`}
                      >
                        {row.status}
                      </span>
                    </TableCell>
                    <TableCell className="px-4 py-3 font-mono text-xs text-swiss-muted">
                      {row.razorpayPaymentId ?? '—'}
                    </TableCell>
                    <TableCell className="px-4 py-3 font-mono text-xs text-swiss-muted">
                      {row.razorpayOrderId ?? '—'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
