import { useCallback, useEffect, useState } from 'react';
import { CheckCircle2, CreditCard, ExternalLink, RefreshCw } from 'lucide-react';
import { api } from '../../lib/api';

export type WhatsAppPaymentStatus = {
  phoneNumberId: string;
  wabaId: string;
  paymentMode: 'self_pay' | 'platform' | null;
  hasOwnMetaPaymentMethod: boolean;
  billingCheckStatus: 'confirmed' | 'missing' | 'unknown';
  paymentConfigCheckedAt: string | null;
  paymentSetupAcknowledgedAt: string | null;
  metaBusinessId: string | null;
  metaPaymentSetupUrl: string;
  primaryFundingId?: string | null;
  note?: string;
  error?: string;
};

type Props = {
  phoneNumberId?: string;
  businessId?: string;
  /** Compact card for account manager; full step after connect. */
  variant?: 'post_connect' | 'settings';
  onDone?: () => void;
  onStatusChange?: (status: WhatsAppPaymentStatus) => void;
};

export function WhatsAppPaymentModePanel({
  phoneNumberId,
  businessId,
  variant = 'settings',
  onDone,
  onStatusChange,
}: Props) {
  const [status, setStatus] = useState<WhatsAppPaymentStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const applyStatus = useCallback(
    (next: WhatsAppPaymentStatus) => {
      setStatus(next);
      onStatusChange?.(next);
    },
    [onStatusChange]
  );

  const load = useCallback(
    async (opts?: { refresh?: boolean }) => {
      setError('');
      try {
        const next = opts?.refresh
          ? await api.refreshWhatsAppPaymentMode({ phoneNumberId, businessId })
          : await api.getWhatsAppPaymentMode(phoneNumberId);
        applyStatus(next);
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Failed to load payment status';
        setError(message);
      } finally {
        setLoading(false);
        setBusy(false);
      }
    },
    [applyStatus, businessId, phoneNumberId]
  );

  useEffect(() => {
    void load();
  }, [load]);

  // Re-check Meta when user returns from Business Manager — skip when check is unknown (#10 / TP)
  useEffect(() => {
    const shouldRefresh =
      status?.paymentMode === 'self_pay' &&
      !status.hasOwnMetaPaymentMethod &&
      status.billingCheckStatus !== 'unknown';
    const onFocus = () => {
      if (shouldRefresh) void load({ refresh: true });
    };
    const onVisibility = () => {
      if (document.visibilityState === 'visible') onFocus();
    };
    window.addEventListener('focus', onFocus);
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      window.removeEventListener('focus', onFocus);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [
    load,
    status?.billingCheckStatus,
    status?.hasOwnMetaPaymentMethod,
    status?.paymentMode,
  ]);

  const selectSelfPay = async () => {
    setBusy(true);
    setError('');
    try {
      const next = await api.setWhatsAppPaymentMode({
        paymentMode: 'self_pay',
        phoneNumberId,
        businessId,
      });
      applyStatus(next);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to set payment mode';
      setError(message);
    } finally {
      setBusy(false);
    }
  };

  const refresh = () => {
    setBusy(true);
    void load({ refresh: true });
  };

  const acknowledge = async () => {
    setBusy(true);
    setError('');
    try {
      const next = await api.acknowledgeWhatsAppPaymentMode({ phoneNumberId });
      applyStatus(next);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to save acknowledgment';
      setError(message);
    } finally {
      setBusy(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white border border-swiss-line p-6">
        <p className="text-sm font-bold text-swiss-muted">Checking payment setup…</p>
      </div>
    );
  }

  const modeChosen = status?.paymentMode === 'self_pay';
  const hasPm = !!status?.hasOwnMetaPaymentMethod;
  const checkUnknown = status?.billingCheckStatus === 'unknown';
  const acknowledged = !!status?.paymentSetupAcknowledgedAt;
  const readyToContinue = hasPm || acknowledged || modeChosen;

  return (
    <div className="bg-white border border-swiss-line p-6 sm:p-8 space-y-5">
      {variant === 'post_connect' ? (
        <div>
          <span className="inline-block px-3 py-1 rounded-full text-sm font-black uppercase tracking-wider bg-primary/10 text-primary border border-primary/20 mb-4">
            Step 3 — Payment mode
          </span>
          <h4 className="text-xl font-semibold text-gray-950">How will Meta bill WhatsApp usage?</h4>
          <p className="mt-2 text-sm text-swiss-muted font-medium max-w-xl">
            Tech Provider clients pay Meta directly for conversation charges. You can finish this
            later from WhatsApp settings.
          </p>
        </div>
      ) : (
        <div>
          <h4 className="text-base font-bold text-slate-900">Payment mode</h4>
          <p className="mt-1 text-sm text-slate-500">
            Meta conversation billing for this WhatsApp Business Account.
          </p>
        </div>
      )}

      <div className="grid gap-3 sm:grid-cols-2">
        <button
          type="button"
          disabled={busy || modeChosen}
          onClick={() => void selectSelfPay()}
          className={`text-left rounded-xl border p-4 transition-colors ${
            modeChosen
              ? 'border-primary/40 bg-primary/5 ring-1 ring-primary/20'
              : 'border-black/10 bg-white hover:border-primary/30 hover:bg-primary/5 cursor-pointer'
          } disabled:cursor-default`}
        >
          <div className="flex items-start gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#e8f8ee] text-[#25D366]">
              <CreditCard className="h-4 w-4" aria-hidden />
            </div>
            <div>
              <p className="text-sm font-black text-slate-900">Self Pay</p>
              <p className="mt-1 text-xs text-slate-500 font-medium leading-relaxed">
                You add a payment method in Meta Business Manager. Meta bills your business
                directly.
              </p>
              {modeChosen ? (
                <p className="mt-2 text-xs font-bold text-primary">Selected</p>
              ) : null}
            </div>
          </div>
        </button>

        <div
          aria-disabled
          className="rounded-xl border border-swiss-line bg-slate-50 p-4 opacity-60 cursor-not-allowed"
        >
          <div className="flex items-start gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-200 text-slate-500">
              <CreditCard className="h-4 w-4" aria-hidden />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <p className="text-sm font-black text-slate-500">Platform</p>
                <span className="rounded-full bg-slate-200 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-slate-600">
                  Coming soon
                </span>
              </div>
              <p className="mt-1 text-xs text-slate-400 font-medium leading-relaxed">
                ConvoSync covers Meta billing via credit line. Not available yet.
              </p>
            </div>
          </div>
        </div>
      </div>

      {modeChosen ? (
        <div className="rounded-xl bg-surface-muted p-4 space-y-3">
          {hasPm ? (
            <div className="flex items-start gap-3">
              <CheckCircle2 className="h-5 w-5 text-primary shrink-0 mt-0.5" aria-hidden />
              <div>
                <p className="text-sm font-bold text-slate-900">Payment method connected</p>
                <p className="mt-0.5 text-xs text-slate-500">
                  Meta reports a billing payment method on this WhatsApp Business Account.
                </p>
              </div>
            </div>
          ) : acknowledged ? (
            <div className="flex items-start gap-3">
              <CheckCircle2 className="h-5 w-5 text-primary shrink-0 mt-0.5" aria-hidden />
              <div>
                <p className="text-sm font-bold text-slate-900">Payment method noted</p>
              </div>
            </div>
          ) : checkUnknown ? (
            <div className="space-y-3">
              <p className="text-sm font-bold text-slate-900">Add a payment method in Meta</p>
              <p className="text-xs text-slate-600 font-medium leading-relaxed">
                {status?.note ||
                  'Automatic billing check needs Solution Partner access. Open Meta to add a payment method, then continue.'}
              </p>
              <div className="flex flex-wrap gap-2">
                <a
                  href={status?.metaPaymentSetupUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-black text-white hover:bg-primary-hover transition-colors"
                >
                  Open Meta payment methods
                  <ExternalLink className="h-3.5 w-3.5" aria-hidden />
                </a>
                <button
                  type="button"
                  disabled={busy}
                  onClick={refresh}
                  className="inline-flex items-center gap-2 bg-white border border-swiss-line px-4 py-2 text-sm font-bold text-slate-800 hover:bg-surface-muted disabled:opacity-50"
                >
                  <RefreshCw className={`h-3.5 w-3.5 ${busy ? 'animate-spin' : ''}`} aria-hidden />
                  Refresh status
                </button>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => void acknowledge()}
                  className="inline-flex items-center gap-2 rounded-xl border border-primary/30 bg-primary/5 px-4 py-2 text-sm font-bold text-primary hover:bg-primary/10 disabled:opacity-50"
                >
                  I&apos;ve added a payment method
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-sm font-bold text-slate-900">Add a payment method in Meta</p>
              <p className="text-xs text-slate-500 font-medium leading-relaxed">
                Open Business Manager, add a card under Billing & payments, then return here and
                refresh.
              </p>
              <div className="flex flex-wrap gap-2">
                <a
                  href={status?.metaPaymentSetupUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-black text-white hover:bg-primary-hover transition-colors"
                >
                  Open Meta payment methods
                  <ExternalLink className="h-3.5 w-3.5" aria-hidden />
                </a>
                <button
                  type="button"
                  disabled={busy}
                  onClick={refresh}
                  className="inline-flex items-center gap-2 bg-white border border-swiss-line px-4 py-2 text-sm font-bold text-slate-800 hover:bg-surface-muted disabled:opacity-50"
                >
                  <RefreshCw className={`h-3.5 w-3.5 ${busy ? 'animate-spin' : ''}`} aria-hidden />
                  Refresh status
                </button>
              </div>
            </div>
          )}
          {hasPm || acknowledged ? (
            <button
              type="button"
              disabled={busy}
              onClick={refresh}
              className="inline-flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-primary"
            >
              <RefreshCw className={`h-3 w-3 ${busy ? 'animate-spin' : ''}`} aria-hidden />
              Refresh status
            </button>
          ) : null}
        </div>
      ) : null}

      {error ? <p className="text-sm font-bold text-red-500">{error}</p> : null}
      {status?.error && !hasPm && !checkUnknown ? (
        <p className="text-xs text-slate-600 font-medium">{status.error}</p>
      ) : null}

      {variant === 'post_connect' && onDone ? (
        <div className="flex flex-wrap gap-2 pt-1">
          <button
            type="button"
            onClick={onDone}
            className="inline-flex items-center justify-center rounded-xl bg-channel-green hover:bg-[#20bd5a] px-5 py-2.5 text-sm font-black text-white "
          >
            {readyToContinue ? 'Continue to WhatsApp' : 'Skip for now'}
          </button>
        </div>
      ) : null}
    </div>
  );
}
