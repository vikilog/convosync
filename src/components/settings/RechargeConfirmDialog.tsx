/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Loader2, X } from 'lucide-react';
import { BRAND_PURPLE, CONVOCOIN_ASSET, formatCc } from '../../lib/convocoins';
import {
  formatInr,
  type WalletRechargeQuote,
  WALLET_RAZORPAY_FEE_RATE,
  WALLET_RECHARGE_GST_RATE,
} from '../../lib/walletRechargeQuote';

type RechargeConfirmDialogProps = {
  open: boolean;
  quote: WalletRechargeQuote | null;
  busy?: boolean;
  onClose: () => void;
  onConfirm: () => void;
};

export function RechargeConfirmDialog({
  open,
  quote,
  busy = false,
  onClose,
  onConfirm,
}: RechargeConfirmDialogProps) {
  if (!open || !quote) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 sm:items-center">
      <div
        className="w-full max-w-md rounded-xl border border-[#E5E7EB] bg-white shadow-xl"
        role="dialog"
        aria-modal="true"
        aria-labelledby="recharge-confirm-title"
      >
        <div className="flex items-center justify-between border-b border-[#E5E7EB] px-5 py-3">
          <h4 id="recharge-confirm-title" className="text-sm font-bold text-slate-900">
            Confirm recharge
          </h4>
          <button
            type="button"
            onClick={onClose}
            disabled={busy}
            className="cursor-pointer rounded-lg p-1 text-slate-500 hover:bg-slate-100 disabled:opacity-50"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="px-5 py-4">
          <div className="flex items-center gap-3 rounded-lg border border-violet-100 bg-violet-50/60 px-3 py-3">
            <img src={CONVOCOIN_ASSET} alt="" width={40} height={40} className="shrink-0" />
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                You receive
              </p>
              <p className="text-xl font-bold text-slate-900">{formatCc(quote.cc)}</p>
              <p className="text-xs text-slate-500">1 CC = ₹1 usage credit</p>
            </div>
          </div>

          <div className="mt-4 space-y-2 text-sm">
            <div className="flex items-center justify-between gap-3">
              <span className="text-slate-600">Recharge amount</span>
              <span className="font-medium text-slate-900">{formatInr(quote.baseInr)}</span>
            </div>
            <div className="flex items-center justify-between gap-3">
              <span className="text-slate-600">GST ({Math.round(WALLET_RECHARGE_GST_RATE * 100)}%)</span>
              <span className="font-medium text-slate-900">{formatInr(quote.gstInr)}</span>
            </div>
            <div className="flex items-center justify-between gap-3">
              <span className="text-slate-600">
                Razorpay fee (~{Math.round(WALLET_RAZORPAY_FEE_RATE * 100)}%)
              </span>
              <span className="font-medium text-slate-900">{formatInr(quote.razorpayFeeInr)}</span>
            </div>
            <div className="my-2 h-px bg-[#E5E7EB]" />
            <div className="flex items-center justify-between gap-3">
              <span className="font-semibold text-slate-900">Total payable</span>
              <span className="text-lg font-bold text-slate-900">{formatInr(quote.totalInr)}</span>
            </div>
          </div>

          <p className="mt-3 text-[11px] leading-relaxed text-slate-500">
            You will be redirected to Razorpay to complete payment. Gateway fee is an estimate and
            may vary slightly by payment method.
          </p>
        </div>

        <div className="flex gap-2 border-t border-[#E5E7EB] px-5 py-3">
          <button
            type="button"
            disabled={busy}
            onClick={onClose}
            className="flex-1 cursor-pointer rounded-lg border border-[#E5E7EB] px-3 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={onConfirm}
            className="flex flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-lg px-3 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
            style={{ backgroundColor: BRAND_PURPLE }}
          >
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            {busy ? 'Opening…' : `Pay ${formatInr(quote.totalInr)}`}
          </button>
        </div>
      </div>
    </div>
  );
}
