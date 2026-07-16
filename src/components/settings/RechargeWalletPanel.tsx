/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useCallback, useEffect, useState, type ReactNode } from 'react';
import { ArrowRight, Loader2, X } from 'lucide-react';
import { api, formatCatchError } from '../../lib/api';
import { WALLET_PRICING_ROWS } from '../../lib/walletPricing';
import {
  BRAND_GOLD,
  BRAND_PURPLE,
  CONVOCOIN_ASSET,
  ccToPaise,
  formatCc,
  formatCcInrSubtitle,
  inrToCc,
  paiseToCc,
} from '../../lib/convocoins';
import { openRazorpayCheckout } from '../../lib/razorpay';

type WalletSummary = {
  balancePaise: number;
  balanceInr: number;
  lowBalanceThresholdPaise: number;
  lowBalanceThresholdInr: number;
  isLowBalance: boolean;
  autoRechargeEnabled: boolean;
  monthSpentPaise: number;
  monthSpentInr: number;
  topUpPresetsInr: number[];
};

type WalletTransaction = {
  id: string;
  type: 'credit' | 'debit';
  category: string;
  categoryLabel: string;
  amountPaise: number;
  description: string | null;
  createdAt: string;
};

const PRICING_ROWS = WALLET_PRICING_ROWS.map((row) => ({
  feature: row.feature,
  cost: row.unitLabel,
  cc: row.rateCcDisplay,
}));

// AUTO_RECHARGE_DISABLED — re-enable later
// const AUTO_RECHARGE_CC = 1000;

function SectionCard({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-[0_1px_3px_rgba(0,0,0,0.04)] md:p-6">
      <h3 className="text-base font-semibold text-slate-900">{title}</h3>
      <div className="mt-4">{children}</div>
    </section>
  );
}

function ConvoCoinMark({ size = 28 }: { size?: number }) {
  return (
    <img
      src={CONVOCOIN_ASSET}
      alt=""
      width={size}
      height={size}
      className="shrink-0"
      aria-hidden
    />
  );
}

function formatTxDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'numeric',
    year: 'numeric',
  });
}

function txLabel(tx: WalletTransaction): string {
  if (tx.description) return tx.description;
  if (tx.category === 'wallet_topup') return 'Wallet recharge';
  return tx.categoryLabel;
}

function TransactionList({ transactions }: { transactions: WalletTransaction[] }) {
  if (transactions.length === 0) {
    return <p className="text-sm text-slate-500">No ConvoCoins activity yet.</p>;
  }

  return (
    <ul className="space-y-3">
      {transactions.map((tx) => {
        const cc = paiseToCc(tx.amountPaise);
        const isCredit = tx.type === 'credit';
        return (
          <li
            key={tx.id}
            className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3 last:border-0 last:pb-0"
          >
            <div className="flex min-w-0 items-center gap-2.5">
              <ConvoCoinMark size={22} />
              <p className="truncate text-sm text-slate-800">
                <span
                  className={`font-bold ${isCredit ? 'text-emerald-600' : 'text-red-600'}`}
                >
                  {isCredit ? '+' : '−'}
                  {formatCc(cc)}
                </span>
                <span className="text-slate-400"> — </span>
                <span className="text-slate-600">{txLabel(tx)}</span>
                <span className="text-slate-400"> — </span>
                <span className="text-slate-500">{formatTxDate(tx.createdAt)}</span>
              </p>
            </div>
          </li>
        );
      })}
    </ul>
  );
}

export function RechargeWalletPanel({
  embedded = false,
  onWalletChange,
}: {
  embedded?: boolean;
  onWalletChange?: () => void;
} = {}) {
  const [wallet, setWallet] = useState<WalletSummary | null>(null);
  const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
  const [allTransactions, setAllTransactions] = useState<WalletTransaction[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [checkoutBusy, setCheckoutBusy] = useState(false);
  const [settingsBusy, setSettingsBusy] = useState(false);
  const [customAmount, setCustomAmount] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [selectedPreset, setSelectedPreset] = useState<number | null>(null);
  const [editingAlert, setEditingAlert] = useState(false);
  const [alertDraft, setAlertDraft] = useState('500');
  const [showAllModal, setShowAllModal] = useState(false);
  const [loadingAll, setLoadingAll] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [walletRes, txRes] = await Promise.all([
        api.getBillingWallet(),
        api.getBillingWalletTransactions(8),
      ]);
      const summary = walletRes as WalletSummary;
      setWallet(summary);
      setAlertDraft(String(paiseToCc(summary.lowBalanceThresholdPaise)));
      setTransactions((txRes as { transactions: WalletTransaction[] }).transactions ?? []);
    } catch (err) {
      setError(formatCatchError(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function saveWalletSettings(patch: {
    lowBalanceThresholdPaise?: number;
    autoRechargeEnabled?: boolean;
  }) {
    setSettingsBusy(true);
    setError(null);
    try {
      const updated = (await api.updateBillingWallet(patch)) as WalletSummary;
      setWallet((prev) => ({ ...(prev ?? updated), ...updated }));
      setAlertDraft(String(paiseToCc(updated.lowBalanceThresholdPaise)));
      onWalletChange?.();
    } catch (err) {
      setError(formatCatchError(err));
    } finally {
      setSettingsBusy(false);
    }
  }

  async function startTopUp(cc: number) {
    if (cc < 100) {
      setError('Minimum recharge is 100 CC.');
      return;
    }

    setCheckoutBusy(true);
    setError(null);
    try {
      const amountPaise = ccToPaise(cc);
      const order = (await api.createBillingOrder({
        purpose: 'wallet_topup',
        amountPaise,
        description: `ConvoCoins recharge · ${formatCc(cc)}`,
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
        description: 'ConvoCoins recharge',
        theme: { color: BRAND_PURPLE },
        onSuccess: async (response) => {
          if (!response.razorpay_order_id || !response.razorpay_signature) {
            throw new Error('Incomplete payment response');
          }
          await api.verifyBillingOrder({
            razorpay_order_id: response.razorpay_order_id,
            razorpay_payment_id: response.razorpay_payment_id,
            razorpay_signature: response.razorpay_signature,
          });
          await load();
          onWalletChange?.();
        },
      });
    } catch (err) {
      const message = formatCatchError(err);
      if (message !== 'Payment cancelled') {
        setError(message);
      }
    } finally {
      setCheckoutBusy(false);
    }
  }

  function handleCustomRecharge() {
    const parsed = Number(customAmount);
    if (!Number.isFinite(parsed) || parsed < 100) {
      setError('Enter at least 100 CC.');
      return;
    }
    void startTopUp(Math.round(parsed));
  }

  async function handleSaveAlertThreshold() {
    const parsed = Number(alertDraft);
    if (!Number.isFinite(parsed) || parsed < 10) {
      setError('Alert threshold must be at least 10 CC.');
      return;
    }
    await saveWalletSettings({ lowBalanceThresholdPaise: ccToPaise(Math.round(parsed)) });
    setEditingAlert(false);
  }

  async function openAllTransactions() {
    setShowAllModal(true);
    if (allTransactions) return;
    setLoadingAll(true);
    try {
      const res = (await api.getBillingWalletTransactions(100)) as {
        transactions: WalletTransaction[];
      };
      setAllTransactions(res.transactions ?? []);
    } catch (err) {
      setError(formatCatchError(err));
    } finally {
      setLoadingAll(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16 text-slate-500">
        <Loader2 className="h-5 w-5 animate-spin" />
      </div>
    );
  }

  const balanceCc = paiseToCc(wallet?.balancePaise ?? 0);
  const monthSpentCc = paiseToCc(wallet?.monthSpentPaise ?? 0);
  const alertCc = paiseToCc(wallet?.lowBalanceThresholdPaise ?? 50_000);
  const presets = wallet?.topUpPresetsInr ?? [500, 1000, 2000, 5000, 10000];

  return (
    <div className={embedded ? 'space-y-5' : 'mx-auto max-w-4xl space-y-5'}>
      {error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      {/* Section 1 — Balance */}
      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-[0_1px_3px_rgba(0,0,0,0.04)] md:p-6">
        <div className="flex items-center gap-2.5">
          <ConvoCoinMark size={32} />
          <h3 className="text-lg font-bold text-slate-900">ConvoCoins</h3>
        </div>

        <p
          className="mt-4 text-4xl font-extrabold tracking-tight md:text-5xl"
          style={{ color: BRAND_GOLD }}
        >
          {formatCc(balanceCc)}
        </p>
        <p className="mt-1 text-sm text-slate-500">{formatCcInrSubtitle(balanceCc)}</p>

        <div className="mt-5 flex flex-wrap gap-2">
          <span className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-700">
            This month: <span className="ml-1 font-bold">{formatCc(monthSpentCc)}</span> spent
          </span>
          <span className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-700">
            Alert threshold:{' '}
            {editingAlert ? (
              <span className="ml-1 inline-flex items-center gap-1">
                <input
                  type="number"
                  min={10}
                  step={10}
                  value={alertDraft}
                  onChange={(e) => setAlertDraft(e.target.value)}
                  className="w-16 rounded border border-slate-200 px-1.5 py-0.5 text-xs"
                />
                CC
                <button
                  type="button"
                  disabled={settingsBusy}
                  onClick={() => void handleSaveAlertThreshold()}
                  className="font-semibold hover:underline disabled:opacity-50"
                  style={{ color: BRAND_PURPLE }}
                >
                  Save
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setEditingAlert(false);
                    setAlertDraft(String(alertCc));
                  }}
                  className="text-slate-500 hover:underline"
                >
                  Cancel
                </button>
              </span>
            ) : (
              <span className="ml-1 font-bold">
                {formatCc(alertCc)}{' '}
                <button
                  type="button"
                  onClick={() => setEditingAlert(true)}
                  className="font-semibold hover:underline"
                  style={{ color: BRAND_PURPLE }}
                >
                  (Edit)
                </button>
              </span>
            )}
          </span>
        </div>
      </section>

      {/* Section 2 — Recharge */}
      <SectionCard title="Add ConvoCoins">
        <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-5">
          {presets.map((inr) => {
            const cc = inrToCc(inr);
            const selected = selectedPreset === inr;
            return (
              <button
                key={inr}
                type="button"
                disabled={checkoutBusy}
                onClick={() => {
                  setSelectedPreset(inr);
                  setCustomAmount('');
                  void startTopUp(cc);
                }}
                className={`flex flex-col items-center rounded-xl border px-3 py-3 text-center transition-all disabled:opacity-50 ${
                  selected
                    ? 'border-violet-400 bg-violet-50 shadow-sm'
                    : 'border-slate-200 bg-white hover:border-violet-200 hover:bg-violet-50/40'
                }`}
              >
                <span className="text-sm font-bold text-slate-900">{formatCc(cc)}</span>
                <span className="mt-0.5 text-xs text-slate-500">
                  ₹{inr.toLocaleString('en-IN')}
                </span>
              </button>
            );
          })}
        </div>

        <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-end">
          <div className="flex-1">
            <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Custom amount
            </label>
            <input
              type="number"
              min={100}
              step={100}
              value={customAmount}
              onChange={(e) => {
                setCustomAmount(e.target.value);
                setSelectedPreset(null);
              }}
              placeholder="Enter amount (min 100 CC)"
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm focus:border-violet-400 focus:outline-none focus:ring-2 focus:ring-violet-100"
            />
          </div>
          <button
            type="button"
            disabled={checkoutBusy}
            onClick={handleCustomRecharge}
            className="inline-flex items-center justify-center gap-2 rounded-lg px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:opacity-95 disabled:opacity-50 sm:shrink-0"
            style={{ backgroundColor: BRAND_PURPLE }}
          >
            {checkoutBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            Recharge Now
          </button>
        </div>

        <p className="mt-3 text-xs text-slate-500">1 CC = ₹1 • 18% GST applicable</p>

        {/* AUTO_RECHARGE_DISABLED — re-enable later
        <label className="mt-4 flex cursor-pointer items-center justify-between gap-3 rounded-lg border border-slate-200 bg-slate-50/70 px-3 py-3">
          <span className="text-sm text-slate-700">
            Auto-recharge {formatCc(AUTO_RECHARGE_CC)} when balance drops below{' '}
            {formatCc(alertCc)}
          </span>
          <button
            type="button"
            role="switch"
            aria-checked={wallet?.autoRechargeEnabled ?? false}
            disabled={settingsBusy}
            onClick={() =>
              void saveWalletSettings({ autoRechargeEnabled: !wallet?.autoRechargeEnabled })
            }
            className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors disabled:opacity-50 ${
              wallet?.autoRechargeEnabled ? 'bg-violet-600' : 'bg-slate-300'
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
                wallet?.autoRechargeEnabled ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </label>
        */}
      </SectionCard>

      {/* Section 3 — Pricing */}
      <SectionCard title="How ConvoCoins are used">
        <div className="overflow-x-auto rounded-lg border border-slate-200">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3">Feature</th>
                <th className="px-4 py-3">Cost per use</th>
                <th className="px-4 py-3">CC used</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {PRICING_ROWS.map((row) => (
                <tr key={row.feature}>
                  <td className="px-4 py-3 font-medium text-slate-900">{row.feature}</td>
                  <td className="px-4 py-3 text-slate-600">{row.cost}</td>
                  <td className="px-4 py-3 font-medium" style={{ color: BRAND_GOLD }}>
                    {row.cc}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-3 text-xs text-slate-500">
          CC = ConvoCoins • Prices reflect provider costs + platform fee
        </p>
      </SectionCard>

      {/* Section 4 — Activity */}
      <SectionCard title="Recent activity">
        <TransactionList transactions={transactions} />
        <div className="mt-3 flex justify-end">
          <button
            type="button"
            onClick={() => void openAllTransactions()}
            className="inline-flex items-center gap-1 text-sm font-semibold hover:underline"
            style={{ color: BRAND_PURPLE }}
          >
            View all transactions
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </div>
      </SectionCard>

      {showAllModal ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 sm:items-center">
          <div
            className="flex max-h-[85vh] w-full max-w-lg flex-col rounded-2xl border border-slate-200 bg-white shadow-xl"
            role="dialog"
            aria-modal="true"
            aria-labelledby="convocoin-tx-title"
          >
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
              <h4 id="convocoin-tx-title" className="text-base font-semibold text-slate-900">
                All transactions
              </h4>
              <button
                type="button"
                onClick={() => setShowAllModal(false)}
                className="rounded-lg p-1 text-slate-500 hover:bg-slate-100"
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="overflow-y-auto px-5 py-3">
              {loadingAll ? (
                <div className="flex justify-center py-10 text-slate-500">
                  <Loader2 className="h-5 w-5 animate-spin" />
                </div>
              ) : (
                <TransactionList transactions={allTransactions ?? []} />
              )}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
