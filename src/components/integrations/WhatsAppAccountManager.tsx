/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  CheckCircle2,
  Copy,
  Globe,
  MessageCircle,
  Plus,
  RefreshCw,
  ShieldAlert,
  Signal,
  Unplug,
} from 'lucide-react';
import WhatsAppEmbeddedSignup from '../WhatsAppEmbeddedSignup';

export type WhatsAppPhoneAccount = {
  id: string;
  phoneNumberId: string;
  label: string;
  phone: string;
  dailyLimit: string;
  qosRating: string;
  status: string;
  verified: boolean;
};

type ManagerTab = 'numbers' | 'webhooks';

type WhatsAppAccountManagerProps = {
  accounts: WhatsAppPhoneAccount[];
  activeTab: ManagerTab;
  onTabChange: (tab: ManagerTab) => void;
  showAddNumber: boolean;
  onConnectAnother: () => void;
  connectAnotherDisabled?: boolean;
  connectAnotherLabel?: string;
  onCancelAdd: () => void;
  onDisconnect: (phoneNumberId: string) => void;
  connectError: string;
  autoLaunchSignup: boolean;
  onAutoStartConsumed: () => void;
  onConnectSuccess: (data?: {
    webhookSubscribe?: { error?: string; wabaSubscribed?: boolean; details?: string };
  }) => void;
  onConnectError: (error: string) => void;
  webhookUrl: string;
  webhookVerifyToken: string;
  webhookSubscribed: boolean | null;
  webhookOverrideUri: string;
  webhookSubscribeMessage: string;
  webhookSubscribing: boolean;
  onSubscribeWebhooks: () => void;
  copyHint: string;
  onCopyWebhookUrl: () => void;
};

function ManagerTabs({
  activeTab,
  onTabChange,
}: {
  activeTab: ManagerTab;
  onTabChange: (tab: ManagerTab) => void;
}) {
  const tabs: { id: ManagerTab; label: string }[] = [
    { id: 'numbers', label: 'Phone numbers' },
    { id: 'webhooks', label: 'Webhooks' },
  ];

  return (
    <div
      className="inline-flex p-1 rounded-xl bg-slate-100/80 border border-slate-200/80"
      role="tablist"
      aria-label="WhatsApp manager sections"
    >
      {tabs.map((tab) => {
        const selected = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={selected}
            onClick={() => onTabChange(tab.id)}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors duration-200 cursor-pointer focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary ${
              selected
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}

function AccountMetric({
  label,
  value,
  tone = 'default',
}: {
  label: string;
  value: string;
  tone?: 'default' | 'success';
}) {
  return (
    <div className="rounded-xl border border-slate-100 bg-slate-50/80 px-3 py-2.5 min-w-[7.5rem]">
      <p className="text-[11px] font-medium uppercase tracking-wide text-slate-500">{label}</p>
      <p
        className={`mt-0.5 text-sm font-semibold truncate ${
          tone === 'success' ? 'text-emerald-700' : 'text-slate-800'
        }`}
      >
        {value}
      </p>
    </div>
  );
}

function AccountCard({
  account,
  onDisconnect,
}: {
  account: WhatsAppPhoneAccount;
  onDisconnect: (phoneNumberId: string) => void;
}) {
  return (
    <article className="group rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 transition-colors duration-200 hover:border-slate-300 hover:shadow-sm">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex gap-4 min-w-0">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#e8f8ee] text-channel-green ring-1 ring-[#25D366]/15">
            <MessageCircle className="h-6 w-6" aria-hidden />
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-base font-semibold text-slate-900 truncate">{account.label}</h3>
              {account.verified && (
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700 ring-1 ring-emerald-200/80">
                  <CheckCircle2 className="h-3.5 w-3.5" aria-hidden />
                  Meta verified
                </span>
              )}
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-emerald-700">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" aria-hidden />
                {account.status}
              </span>
            </div>
            <p className="mt-1 font-mono text-sm text-slate-600">{account.phone}</p>
            <div className="mt-4 flex flex-wrap gap-2">
              <AccountMetric label="Daily limit" value={account.dailyLimit} />
              <AccountMetric label="QoS rating" value={account.qosRating} tone="success" />
              <AccountMetric label="Phone ID" value={account.phoneNumberId} />
            </div>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2 lg:pt-1">
          <button
            type="button"
            onClick={() => onDisconnect(account.phoneNumberId)}
            className="inline-flex items-center gap-2 rounded-xl border border-red-200 bg-white px-3.5 py-2 text-sm font-semibold text-red-600 transition-colors duration-200 hover:bg-red-50 cursor-pointer focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-500"
          >
            <Unplug className="h-4 w-4" aria-hidden />
            Disconnect
          </button>
        </div>
      </div>
    </article>
  );
}

export function WhatsAppAccountManager({
  accounts,
  activeTab,
  onTabChange,
  showAddNumber,
  onConnectAnother,
  connectAnotherDisabled = false,
  connectAnotherLabel = 'Connect number',
  onCancelAdd,
  onDisconnect,
  connectError,
  autoLaunchSignup,
  onAutoStartConsumed,
  onConnectSuccess,
  onConnectError,
  webhookUrl,
  webhookVerifyToken,
  webhookSubscribed,
  webhookOverrideUri,
  webhookSubscribeMessage,
  webhookSubscribing,
  onSubscribeWebhooks,
  copyHint,
  onCopyWebhookUrl,
}: WhatsAppAccountManagerProps) {
  const connectedCount = accounts.length;
  const verifiedCount = accounts.filter((a) => a.verified).length;

  return (
    <div className="space-y-6 max-w-5xl">
      <header className="rounded-2xl border border-slate-200 bg-gradient-to-br from-white via-white to-[#f4fbf6] p-5 sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-channel-green text-white shadow-sm">
              <MessageCircle className="h-6 w-6" aria-hidden />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900 sm:text-2xl">
                WhatsApp Business
              </h2>
              <p className="mt-1 max-w-xl text-sm leading-relaxed text-slate-600">
                Manage connected numbers, Meta verification status, and webhook delivery for inbound
                messages.
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2 sm:justify-end">
            <div className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-center min-w-[5.5rem]">
              <p className="text-[11px] font-medium uppercase tracking-wide text-slate-500">
                Connected
              </p>
              <p className="text-lg font-bold text-slate-900">{connectedCount}</p>
            </div>
            <div className="rounded-xl border border-emerald-200 bg-emerald-50/80 px-3 py-2 text-center min-w-[5.5rem]">
              <p className="text-[11px] font-medium uppercase tracking-wide text-emerald-700">
                Verified
              </p>
              <p className="text-lg font-bold text-emerald-800">{verifiedCount}</p>
            </div>
          </div>
        </div>
        <div className="mt-5">
          <ManagerTabs activeTab={activeTab} onTabChange={onTabChange} />
        </div>
      </header>

      {activeTab === 'numbers' && (
        <section className="space-y-4" aria-label="WhatsApp phone numbers">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-semibold text-slate-900">Active phone accounts</h3>
              <p className="text-sm text-slate-500">
                Numbers linked to this workspace via Meta Business API.
              </p>
            </div>
            {!showAddNumber && (
              <button
                type="button"
                disabled={connectAnotherDisabled}
                onClick={onConnectAnother}
                className="inline-flex items-center gap-2 rounded-xl bg-brand-gradient px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-opacity duration-200 hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-60 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-purple"
              >
                <Plus className="h-4 w-4" aria-hidden />
                {connectAnotherLabel}
              </button>
            )}
          </div>

          <div className="space-y-3">
            {accounts.map((account) => (
              <AccountCard key={account.id} account={account} onDisconnect={onDisconnect} />
            ))}
          </div>

          {showAddNumber && (
            <div className="rounded-2xl border border-primary/20 bg-white p-5 sm:p-6 shadow-sm">
              <div className="flex items-start justify-between gap-4 mb-4">
                <div>
                  <h4 className="text-base font-semibold text-slate-900">Connect another number</h4>
                  <p className="mt-1 text-sm text-slate-600">
                    Sign in with Meta to add another WhatsApp Business phone to this workspace.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={onCancelAdd}
                  className="text-sm font-semibold text-slate-500 hover:text-primary transition-colors cursor-pointer"
                >
                  Cancel
                </button>
              </div>
              <WhatsAppEmbeddedSignup
                autoStart={autoLaunchSignup}
                onAutoStartConsumed={onAutoStartConsumed}
                onSuccess={onConnectSuccess}
                onError={onConnectError}
              />
              {connectError && (
                <p className="mt-3 text-sm font-medium text-red-600" role="alert">
                  {connectError}
                </p>
              )}
            </div>
          )}
        </section>
      )}

      {activeTab === 'webhooks' && (
        <section
          className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 space-y-5"
          aria-label="Webhook configuration"
        >
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-sky-50 text-primary">
                <Globe className="h-5 w-5" aria-hidden />
              </div>
              <div>
                <h3 className="text-base font-semibold text-slate-900">Webhook delivery</h3>
                <p className="mt-1 text-sm text-slate-600 max-w-xl">
                  ConvoSync registers this callback with Meta when you connect. Retry if you change
                  your public API URL.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onSubscribeWebhooks}
              disabled={webhookSubscribing}
              className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-white transition-colors duration-200 hover:bg-primary-hover disabled:opacity-60 cursor-pointer focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
            >
              <RefreshCw className={`h-4 w-4 ${webhookSubscribing ? 'animate-spin' : ''}`} aria-hidden />
              {webhookSubscribing ? 'Subscribing…' : 'Subscribe via API'}
            </button>
          </div>

          <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <div
                className={`mt-1 h-2.5 w-2.5 rounded-full shrink-0 ${
                  webhookSubscribed ? 'bg-emerald-500' : webhookSubscribed === false ? 'bg-amber-500' : 'bg-slate-300'
                }`}
                aria-hidden
              />
              <div>
                <p className="text-sm font-semibold text-slate-900">API subscription status</p>
                <p className="text-sm text-slate-600 mt-0.5">
                  {webhookSubscribed === null
                    ? 'Checking subscription with Meta…'
                    : webhookSubscribed
                      ? 'Subscribed — inbound events should reach ConvoSync'
                      : 'Not subscribed — click Subscribe via API'}
                </p>
                {webhookOverrideUri && (
                  <p className="text-xs text-slate-500 font-mono mt-1 truncate max-w-md">
                    Override URI: {webhookOverrideUri}
                  </p>
                )}
              </div>
            </div>
            <div className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500">
              <Signal className="h-3.5 w-3.5" aria-hidden />
              Meta Cloud API
            </div>
          </div>

          {webhookSubscribeMessage && (
            <p className="text-sm text-slate-700 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3">
              {webhookSubscribeMessage}
            </p>
          )}

          <div className="grid gap-4 sm:grid-cols-1">
            <div>
              <label
                htmlFor="webhook-url"
                className="block text-sm font-medium text-slate-700 mb-1.5"
              >
                Webhook URL
              </label>
              <div className="flex gap-2">
                <input
                  id="webhook-url"
                  type="text"
                  readOnly
                  value={webhookUrl || 'Loading…'}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 px-3 text-sm text-slate-600 font-mono outline-none focus:ring-2 focus:ring-primary/20"
                />
                <button
                  type="button"
                  onClick={onCopyWebhookUrl}
                  disabled={!webhookUrl}
                  className="inline-flex items-center gap-1.5 shrink-0 rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm font-semibold text-slate-700 transition-colors duration-200 hover:bg-slate-50 disabled:opacity-50 cursor-pointer"
                >
                  <Copy className="h-4 w-4" aria-hidden />
                  {copyHint || 'Copy'}
                </button>
              </div>
            </div>

            <div>
              <label
                htmlFor="webhook-token"
                className="block text-sm font-medium text-slate-700 mb-1.5"
              >
                Verify token
              </label>
              <input
                id="webhook-token"
                type="text"
                readOnly
                value={webhookVerifyToken || 'Loading…'}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 px-3 text-sm text-slate-600 font-mono outline-none focus:ring-2 focus:ring-primary/20"
              />
              <p className="mt-1.5 text-xs text-slate-500">
                Must match <span className="font-mono">META_WEBHOOK_VERIFY_TOKEN</span> on your
                server. Manual Meta Console setup is optional if API subscribe succeeds.
              </p>
            </div>
          </div>

          <div className="flex gap-3 rounded-xl border border-amber-200/80 bg-amber-50/80 p-4">
            <ShieldAlert className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" aria-hidden />
            <div>
              <p className="text-sm font-semibold text-amber-900">Webhook verification</p>
              <p className="mt-1 text-sm text-amber-800/90 leading-relaxed">
                Meta sends a verification challenge when subscribing. Ensure your server validates
                the verify token before accepting inbound message payloads.
              </p>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
