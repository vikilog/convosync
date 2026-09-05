/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useCallback, useEffect, useState, type ComponentType } from 'react';
import {
  ArrowRight,
  Bot,
  Loader2,
  Mail,
  MessageCircle,
  Smartphone,
  Workflow,
  X,
  Zap,
} from 'lucide-react';
import { api, formatCatchError } from '../../lib/api';
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
import { computeWalletRechargeQuote, type WalletRechargeQuote } from '../../lib/walletRechargeQuote';
import { RechargeConfirmDialog } from './RechargeConfirmDialog';
import { WalletUsageCalculator } from './WalletUsageCalculator';
import { dispatchWalletBalance } from '../../lib/walletEvents';
import { WALLET_PRICING_ROWS, type WalletPricingKey } from '../../lib/walletPricing';
import { Input } from '../ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';

const CARD_CLASS =
  'bg-white border border-swiss-line p-5 shadow-[0_1px_2px_rgba(0,0,0,0.04)]';

const PRICING_ICONS: Record<
  WalletPricingKey,
  ComponentType<{ className?: string }>
> = {
  waMarketing: MessageCircle,
  waUtility: MessageCircle,
  waAuth: MessageCircle,
  instagram: Smartphone,
  email: Mail,
  aiAgent: Bot,
  journeyTrigger: Zap,
  inbox: Workflow,
};

type WalletSummary = {
  balancePaise: number;
  lowBalanceThresholdPaise: number;
  autoRechargeEnabled: boolean;
  autoRechargeAmountPaise?: number;
  hasPaymentMethod?: boolean;
  autoRechargeStatus?: string;
  monthSpentPaise: number;
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

function formatTxDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'numeric',
    year: 'numeric',
  });
}

function txTitle(tx: WalletTransaction): string {
  if (tx.description) return tx.description;
  if (tx.category === 'wallet_topup') return 'Wallet recharge';
  if (tx.category.startsWith('whatsapp')) return 'WA Campaign';
  if (tx.category === 'ai_tokens') return 'AI usage';
  if (tx.category === 'email') return 'Email send';
  return tx.categoryLabel;
}

function ConvoCoinIcon({ size = 24 }: { size?: number }) {
  return (
    <img
      src={CONVOCOIN_ASSET}
      alt=""
      width={size}
      height={size}
      className="shrink-0 object-contain"
      aria-hidden
    />
  );
}

export function WalletPanel() {
  const [wallet, setWallet] = useState<WalletSummary | null>(null);
  const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
  const [allTransactions, setAllTransactions] = useState<WalletTransaction[] | null>(null);
  const [billingCurrency, setBillingCurrency] = useState<'INR' | 'USD'>('INR');
  const [usdInrRate, setUsdInrRate] = useState(83);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [checkoutBusy, setCheckoutBusy] = useState(false);
  const [settingsBusy, setSettingsBusy] = useState(false);

  const [selectedPreset, setSelectedPreset] = useState<number | null>(null);
  const [customAmount, setCustomAmount] = useState('');
  const [editingAlert, setEditingAlert] = useState(false);
  const [alertDraft, setAlertDraft] = useState('500');
  const [showAllModal, setShowAllModal] = useState(false);
  const [loadingAll, setLoadingAll] = useState(false);
  const [rechargeQuote, setRechargeQuote] = useState<WalletRechargeQuote | null>(null);
  const [showRechargeConfirm, setShowRechargeConfirm] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [walletRes, txRes, billingRes] = await Promise.all([
        api.getBillingWallet(),
        api.getBillingWalletTransactions(5),
        api.getBillingWorkspace().catch(() => null),
      ]);
      const walletData = walletRes as WalletSummary;
      setWallet(walletData);
      setAlertDraft(String(paiseToCc(walletData.lowBalanceThresholdPaise)));
      setTransactions((txRes as { transactions: WalletTransaction[] }).transactions ?? []);
      const billing = billingRes as {
        currency?: 'INR' | 'USD';
        fx?: { usdInrRate?: number };
      } | null;
      if (billing?.currency === 'USD' || billing?.currency === 'INR') {
        setBillingCurrency(billing.currency);
      }
      if (billing?.fx?.usdInrRate && billing.fx.usdInrRate > 0) {
        setUsdInrRate(billing.fx.usdInrRate);
      }
    } catch (err) {
      setError(formatCatchError(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (wallet?.balancePaise != null) {
      dispatchWalletBalance(wallet.balancePaise);
    }
  }, [wallet?.balancePaise]);

  /* AUTO_RECHARGE_DISABLED — re-enable later
  async function startAutoRechargeSetup() {
    setSettingsBusy(true);
    setError(null);
    try {
      const setup = (await api.createAutoRechargeSetup()) as {
        orderId: string;
        keyId: string;
        amountPaise: number;
        customerId: string;
        savePaymentMethod: boolean;
      };

      await openRazorpayCheckout({
        key: setup.keyId,
        order_id: setup.orderId,
        amount: setup.amountPaise,
        currency: 'INR',
        customer_id: setup.customerId,
        save: '1',
        name: 'ConvoSync',
        description: 'Save payment method for auto-recharge',
        theme: { color: BRAND_PURPLE },
        onSuccess: async (response) => {
          if (!response.razorpay_order_id || !response.razorpay_signature) {
            throw new Error('Incomplete payment response');
          }
          const verified = (await api.verifyBillingOrder({
            razorpay_order_id: response.razorpay_order_id,
            razorpay_payment_id: response.razorpay_payment_id,
            razorpay_signature: response.razorpay_signature,
          })) as { wallet?: WalletSummary };
          if (verified.wallet) {
            setWallet((prev) => ({ ...(prev ?? verified.wallet!), ...verified.wallet }));
            setAlertDraft(String(paiseToCc(verified.wallet.lowBalanceThresholdPaise)));
          } else {
            await load();
          }
        },
      });
    } catch (err) {
      const message = formatCatchError(err);
      if (message !== 'Payment cancelled') setError(message);
    } finally {
      setSettingsBusy(false);
    }
  }

  async function toggleAutoRecharge() {
    if (wallet?.autoRechargeEnabled) {
      await saveWalletSettings({ autoRechargeEnabled: false });
      return;
    }
    if (!wallet?.hasPaymentMethod) {
      await startAutoRechargeSetup();
      return;
    }
    await saveWalletSettings({ autoRechargeEnabled: true });
  }
  */

  async function saveWalletSettings(patch: {
    lowBalanceThresholdPaise?: number;
    // autoRechargeEnabled?: boolean;
    // autoRechargeAmountPaise?: number;
  }) {
    setSettingsBusy(true);
    setError(null);
    try {
      const updated = (await api.updateBillingWallet(patch)) as WalletSummary;
      setWallet((prev) => ({ ...(prev ?? updated), ...updated }));
      setAlertDraft(String(paiseToCc(updated.lowBalanceThresholdPaise)));
    } catch (err) {
      setError(formatCatchError(err));
    } finally {
      setSettingsBusy(false);
    }
  }

  function openRechargeConfirm(cc: number) {
    if (cc < 100) {
      setError('Minimum recharge is 100 CC.');
      return;
    }
    setError(null);
    setRechargeQuote(
      computeWalletRechargeQuote(cc, { currency: billingCurrency, usdInrRate })
    );
    setShowRechargeConfirm(true);
  }

  async function startTopUp(quote: WalletRechargeQuote) {
    setCheckoutBusy(true);
    setError(null);
    try {
      const order = (await api.createBillingOrder({
        purpose: 'wallet_topup',
        amountPaise: quote.totalPaise,
        creditAmountPaise: quote.basePaise,
        description: `ConvoCoins recharge · ${formatCc(quote.cc)}`,
      })) as { orderId: string; keyId: string; amountPaise: number; currency?: string };

      setShowRechargeConfirm(false);
      setRechargeQuote(null);

      await openRazorpayCheckout({
        key: order.keyId,
        order_id: order.orderId,
        amount: order.amountPaise,
        currency: order.currency ?? quote.currency,
        name: 'ConvoSync',
        description: `ConvoCoins recharge · ${formatCc(quote.cc)}`,
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
          setAllTransactions(null);
          await load();
        },
      });
    } catch (err) {
      const message = formatCatchError(err);
      if (message !== 'Payment cancelled') setError(message);
    } finally {
      setCheckoutBusy(false);
    }
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
      <div className="flex min-h-[280px] items-center justify-center text-slate-400">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  const balanceCc = paiseToCc(wallet?.balancePaise ?? 0);
  const monthSpentCc = paiseToCc(wallet?.monthSpentPaise ?? 0);
  const alertCc = paiseToCc(wallet?.lowBalanceThresholdPaise ?? 50_000);
  const presets = wallet?.topUpPresetsInr ?? [500, 1000, 2000, 5000, 10000];

  return (
    <div className="w-full space-y-4">
      {error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-5">
        {/* LEFT — 60% */}
        <div className="flex flex-col gap-4 xl:col-span-3">
          <section className={CARD_CLASS}>
            <div className="flex items-center gap-4">
              <ConvoCoinIcon size={48} />
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  ConvoCoins Balance
                </p>
                <p className="text-3xl font-extrabold leading-tight" style={{ color: BRAND_GOLD }}>
                  {formatCc(balanceCc)}
                </p>
                <p className="text-sm text-slate-500">{formatCcInrSubtitle(balanceCc)}</p>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-px overflow-hidden rounded-lg border border-[#E5E7EB] bg-[#E5E7EB]">
              <div className="bg-white px-3 py-2.5">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                  This month spent
                </p>
                <p className="mt-0.5 text-sm font-bold text-slate-900">{formatCc(monthSpentCc)}</p>
              </div>
              <div className="bg-white px-3 py-2.5">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                  Low balance alert
                </p>
                {editingAlert ? (
                  <div className="mt-0.5 flex flex-wrap items-center gap-1.5">
                    <Input
                      type="number"
                      min={10}
                      step={10}
                      value={alertDraft}
                      onChange={(e) => setAlertDraft(e.target.value)}
                      className="h-auto w-16 rounded border border-[#E5E7EB] px-1.5 py-0.5 text-xs"
                      aria-label="Alert threshold in CC"
                    />
                    <span className="text-xs text-slate-600">CC</span>
                    <button
                      type="button"
                      disabled={settingsBusy}
                      onClick={() => {
                        const parsed = Number(alertDraft);
                        if (!Number.isFinite(parsed) || parsed < 10) {
                          setError('Alert threshold must be at least 10 CC.');
                          return;
                        }
                        void saveWalletSettings({
                          lowBalanceThresholdPaise: ccToPaise(Math.round(parsed)),
                        }).then(() => setEditingAlert(false));
                      }}
                      className="cursor-pointer text-xs font-semibold text-swiss-accent hover:underline disabled:opacity-50"
                    >
                      Save
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setEditingAlert(false);
                        setAlertDraft(String(alertCc));
                      }}
                      className="cursor-pointer text-xs text-slate-500 hover:underline"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <p className="mt-0.5 text-sm font-bold text-slate-900">
                    {formatCc(alertCc)}{' '}
                    <button
                      type="button"
                      onClick={() => setEditingAlert(true)}
                      className="cursor-pointer text-xs font-semibold text-swiss-accent hover:underline"
                    >
                      (Edit)
                    </button>
                  </p>
                )}
              </div>
            </div>
          </section>

          {/* Card 2 — Recharge */}
          <section id="wallet-recharge" className={CARD_CLASS}>
            <h3 className="text-sm font-bold text-slate-900">Add ConvoCoins</h3>

            <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
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
                      openRechargeConfirm(cc);
                    }}
                    className={`cursor-pointer rounded-lg border px-2 py-2 text-center transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
                      selected
                        ? 'border-transparent bg-swiss-accent text-white hover:bg-swiss-accent-hover'
                        : 'border-swiss-line bg-white text-slate-800 hover:border-swiss-accent/30'
                    }`}
                  >
                    <span className="block text-xs font-bold sm:text-sm">{formatCc(cc)}</span>
                    <span
                      className={`mt-0.5 block text-[10px] ${selected ? 'text-white/80' : 'text-slate-500'}`}
                    >
                      ₹{inr.toLocaleString('en-IN')}
                    </span>
                  </button>
                );
              })}
            </div>

            <div className="mt-3 flex flex-col gap-2 sm:flex-row">
              <Input
                type="number"
                min={100}
                step={100}
                value={customAmount}
                onChange={(e) => {
                  setCustomAmount(e.target.value);
                  setSelectedPreset(null);
                }}
                placeholder="Enter amount (min 100 CC)"
                className="h-auto min-w-0 flex-1 rounded-lg border border-[#E5E7EB] px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-violet-400 focus:outline-none focus:ring-2 focus:ring-violet-100"
              />
              <button
                type="button"
                disabled={checkoutBusy}
                onClick={() => {
                  const parsed = Number(customAmount);
                  if (!Number.isFinite(parsed) || parsed < 100) {
                    setError('Enter at least 100 CC.');
                    return;
                  }
                  openRechargeConfirm(Math.round(parsed));
                }}
                className="inline-flex cursor-pointer items-center justify-center gap-1.5 rounded-lg bg-swiss-accent px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-swiss-accent-hover disabled:cursor-not-allowed disabled:opacity-50 sm:shrink-0"
              >
                {checkoutBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                Recharge Now
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>

            <p className="mt-2 text-[11px] text-slate-500">
              <span>1 CC = ₹1</span>
              <span className="mx-2 text-slate-300">|</span>
              <span>18% GST applicable</span>
            </p>

            {/* AUTO_RECHARGE_DISABLED — re-enable later
            <label className="mt-3 flex cursor-pointer items-center justify-between gap-3 rounded-lg border border-[#E5E7EB] bg-white px-3 py-2.5">
              <span className="text-xs leading-snug text-slate-700 sm:text-sm">
                Auto-recharge {formatCc(paiseToCc(wallet?.autoRechargeAmountPaise ?? 100_000))}{' '}
                when balance drops below {formatCc(alertCc)}
                {wallet?.hasPaymentMethod ? (
                  <span className="mt-0.5 block text-[10px] text-emerald-700">Payment method saved</span>
                ) : (
                  <span className="mt-0.5 block text-[10px] text-amber-700">
                    Enable to save card/UPI for auto top-up
                  </span>
                )}
              </span>
              <button
                type="button"
                role="switch"
                aria-checked={wallet?.autoRechargeEnabled ?? false}
                aria-label="Toggle auto-recharge"
                disabled={settingsBusy}
                onClick={() => void toggleAutoRecharge()}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
                  wallet?.autoRechargeEnabled ? 'bg-violet-600' : 'bg-slate-300'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 rounded-full bg-white shadow transition-transform ${
                    wallet?.autoRechargeEnabled ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </label>
            */}
          </section>

          {/* Card 3 — Pricing */}
          <section className={CARD_CLASS}>
            <h3 className="text-sm font-bold text-slate-900">ConvoCoins Usage Rates</h3>
            <p className="mt-0.5 text-xs text-slate-500">
              Metered usage is deducted from your wallet
            </p>

            <div className="mt-3 overflow-hidden rounded-lg border border-[#E5E7EB]">
              <Table className="text-left text-xs sm:text-sm">
                <TableHeader>
                  <TableRow className="bg-white text-[10px] font-semibold uppercase tracking-wide text-slate-500 sm:text-xs">
                    <TableHead className="px-3 py-2 whitespace-normal">Feature</TableHead>
                    <TableHead className="px-3 py-2 whitespace-normal">Per use</TableHead>
                    <TableHead className="px-3 py-2 text-right whitespace-normal">CC cost</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {WALLET_PRICING_ROWS.map((row, index) => {
                    const Icon = PRICING_ICONS[row.key];
                    return (
                      <TableRow
                        key={row.key}
                        className={index % 2 === 0 ? 'bg-white' : 'bg-white/80'}
                      >
                        <TableCell className="px-3 py-2 font-medium text-slate-900 whitespace-normal">
                          <span className="inline-flex items-center gap-1.5">
                            <Icon className="h-3.5 w-3.5 text-slate-400" aria-hidden />
                            {row.feature}
                          </span>
                        </TableCell>
                        <TableCell className="px-3 py-2 text-slate-600 whitespace-normal">{row.unitLabel}</TableCell>
                        <TableCell
                          className="px-3 py-2 text-right font-semibold"
                          style={{ color: BRAND_GOLD }}
                        >
                          {row.rateCcDisplay}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
            <p className="mt-2 text-[11px] text-slate-500">
              CC = ConvoCoins • Rates include provider cost + platform markup
            </p>
          </section>
        </div>

        {/* RIGHT — 40% */}
        <div className="flex flex-col gap-4 xl:col-span-2 xl:sticky xl:top-4 xl:self-start">
          <WalletUsageCalculator
            balanceCc={balanceCc}
            onSuggestRecharge={(cc) => {
              setCustomAmount(String(cc));
              setSelectedPreset(null);
              setError(null);
              document.getElementById('wallet-recharge')?.scrollIntoView({
                behavior: 'smooth',
                block: 'start',
              });
            }}
          />
        </div>
      </div>

      {/* Recent activity — full width */}
      <section className={CARD_CLASS}>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="text-sm font-bold text-slate-900">Recent activity</h3>
          <button
            type="button"
            onClick={() => void openAllTransactions()}
            className="inline-flex cursor-pointer items-center gap-1 text-xs font-semibold text-swiss-accent hover:underline"
          >
            View all transactions
            <ArrowRight className="h-3 w-3" />
          </button>
        </div>

        {transactions.length === 0 ? (
          <p className="mt-3 text-sm text-slate-500">No activity yet.</p>
        ) : (
          <ul className="mt-3 divide-y divide-[#E5E7EB] rounded-lg border border-[#E5E7EB] overflow-hidden">
            {transactions.map((tx) => {
              const cc = paiseToCc(tx.amountPaise);
              const isCredit = tx.type === 'credit';
              return (
                <li
                  key={tx.id}
                  className="flex items-center justify-between gap-4 bg-white px-4 py-3 sm:px-5"
                >
                  <div className="flex min-w-0 flex-1 items-center gap-3">
                    {isCredit ? (
                      <ConvoCoinIcon size={20} />
                    ) : (
                      <span
                        className="h-2.5 w-2.5 shrink-0 rounded-full bg-[#EF4444]"
                        aria-hidden
                      />
                    )}
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-slate-800">
                        {txTitle(tx)}
                      </p>
                      <p className="text-xs text-slate-500">{formatTxDate(tx.createdAt)}</p>
                    </div>
                  </div>
                  <p
                    className={`shrink-0 text-sm font-bold tabular-nums ${
                      isCredit ? 'text-swiss-accent' : 'text-[#EF4444]'
                    }`}
                  >
                    {isCredit ? '+' : '−'}
                    {formatCc(cc)}
                  </p>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {showRechargeConfirm ? (
        <RechargeConfirmDialog
          open={showRechargeConfirm}
          quote={rechargeQuote}
          busy={checkoutBusy}
          onClose={() => {
            if (checkoutBusy) return;
            setShowRechargeConfirm(false);
            setRechargeQuote(null);
          }}
          onConfirm={() => {
            if (rechargeQuote) void startTopUp(rechargeQuote);
          }}
        />
      ) : null}

      {showAllModal ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 sm:items-center">
          <div
            className="flex max-h-[85vh] w-full max-w-lg flex-col bg-white border border-swiss-line shadow-xl"
            role="dialog"
            aria-modal="true"
            aria-labelledby="wallet-all-tx-title"
          >
            <div className="flex items-center justify-between border-b border-[#E5E7EB] px-5 py-3">
              <h4 id="wallet-all-tx-title" className="text-sm font-bold text-slate-900">
                All transactions
              </h4>
              <button
                type="button"
                onClick={() => setShowAllModal(false)}
                className="cursor-pointer rounded-lg p-1 text-slate-500 hover:bg-slate-100"
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="overflow-y-auto px-5 py-2">
              {loadingAll ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-5 w-5 animate-spin text-slate-400" />
                </div>
              ) : (
                <ul className="space-y-0">
                  {(allTransactions ?? []).map((tx) => {
                    const cc = paiseToCc(tx.amountPaise);
                    const isCredit = tx.type === 'credit';
                    return (
                      <li
                        key={tx.id}
                        className="flex items-center justify-between gap-2 border-b border-[#E5E7EB] py-2.5 last:border-0"
                      >
                        <div className="flex min-w-0 items-center gap-2">
                          {isCredit ? (
                            <ConvoCoinIcon size={18} />
                          ) : (
                            <span className="h-2 w-2 shrink-0 rounded-full bg-[#EF4444]" />
                          )}
                          <div className="min-w-0">
                            <p className="truncate text-sm font-medium text-slate-800">
                              {txTitle(tx)}
                            </p>
                            <p className="text-xs text-slate-500">{formatTxDate(tx.createdAt)}</p>
                          </div>
                        </div>
                        <p
                          className={`shrink-0 text-sm font-bold ${
                            isCredit ? 'text-swiss-accent' : 'text-[#EF4444]'
                          }`}
                        >
                          {isCredit ? '+' : '−'}
                          {formatCc(cc)}
                        </p>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
