/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Bot, Calculator, Check, Contact, Loader2, Mail, Users, Zap } from 'lucide-react';
import { api, formatCatchError } from '../../lib/api';
import { openRazorpayCheckout } from '../../lib/razorpay';

type PricingRules = {
  currency: string;
  limits: {
    contacts: { min: number; max: number; step: number };
    aiAgents: { min: number; max: number; step: number };
    teamMembers: { min: number; max: number; step: number };
    channels: { min: number; max: number; step: number };
    emails: { min: number; max: number; step: number };
  };
  defaults: {
    contacts: number;
    aiAgents: number;
    teamMembers: number;
    channels: number;
    emails: number;
  };
};

type CustomPlanQuote = {
  contacts: number;
  aiAgents: number;
  teamMembers: number;
  channels: number;
  emails: number;
  monthlyTotal: number;
  annualTotal: number;
  currency: string;
  breakdown: Array<{ key: string; label: string; quantity?: number; unitLabel?: string; amount: number }>;
  matchedPlanSlug: string | null;
  matchedPlanName: string | null;
  requiresSales: boolean;
  savedAt: string | null;
};

type PlanCustomizerProps = {
  pricingRules: PricingRules;
  initialQuote: CustomPlanQuote | null;
  onSaved?: () => void;
};

function formatNumber(value: number) {
  return value.toLocaleString('en-US');
}

function ConfigSlider({
  id,
  label,
  icon: Icon,
  value,
  min,
  max,
  step,
  onChange,
}: {
  id: string;
  label: string;
  icon: typeof Contact;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (value: number) => void;
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-3">
        <label htmlFor={id} className="flex items-center gap-2 text-sm font-medium text-gray-700">
          <Icon className="h-4 w-4 text-sky-600" />
          {label}
        </label>
        <input
          type="number"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="w-24 rounded-lg border border-slate-200 px-2 py-1 text-right text-sm font-semibold text-gray-900 outline-none focus:ring-2 focus:ring-[#0284c7]"
        />
      </div>
      <input
        id={id}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="h-2 w-full cursor-pointer accent-sky-600"
      />
      <div className="flex justify-between text-xs text-gray-400">
        <span>{formatNumber(min)}</span>
        <span>{formatNumber(max)}</span>
      </div>
    </div>
  );
}

export function PlanCustomizer({ pricingRules, initialQuote, onSaved }: PlanCustomizerProps) {
  const defaults = pricingRules.defaults;
  const [contacts, setContacts] = useState(initialQuote?.contacts ?? defaults.contacts);
  const [aiAgents, setAiAgents] = useState(initialQuote?.aiAgents ?? defaults.aiAgents);
  const [teamMembers, setTeamMembers] = useState(initialQuote?.teamMembers ?? defaults.teamMembers);
  const [channels, setChannels] = useState(initialQuote?.channels ?? defaults.channels);
  const [emails, setEmails] = useState(initialQuote?.emails ?? defaults.emails);
  const [quote, setQuote] = useState<CustomPlanQuote | null>(initialQuote);
  const [quoting, setQuoting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedMessage, setSavedMessage] = useState<string | null>(null);
  const [paying, setPaying] = useState(false);

  const payload = useMemo(
    () => ({ contacts, aiAgents, teamMembers, channels, emails }),
    [contacts, aiAgents, teamMembers, channels, emails]
  );

  const fetchQuote = useCallback(async () => {
    setQuoting(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        contacts: String(contacts),
        aiAgents: String(aiAgents),
        teamMembers: String(teamMembers),
        channels: String(channels),
        emails: String(emails),
      });
      const res = (await api.getSubscriptionQuote(params.toString())) as CustomPlanQuote;
      setQuote(res);
    } catch (err) {
      setError(formatCatchError(err));
    } finally {
      setQuoting(false);
    }
  }, [contacts, aiAgents, teamMembers, channels, emails]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void fetchQuote();
    }, 300);
    return () => window.clearTimeout(timer);
  }, [fetchQuote]);

  async function handlePayCustomPlan() {
    if (!quote || quote.requiresSales) return;
    setPaying(true);
    setError(null);
    setSavedMessage(null);
    try {
      await api.saveSubscriptionQuote(payload);
      const order = (await api.createBillingOrder({ purpose: 'custom_plan' })) as {
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
        description: 'Custom plan — first month',
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
          setSavedMessage('Payment successful. Your custom plan is now active.');
          onSaved?.();
        },
      });
    } catch (err) {
      const message = formatCatchError(err);
      if (message !== 'Payment cancelled') {
        setError(message);
      }
    } finally {
      setPaying(false);
    }
  }

  async function handleSave() {
    setSaving(true);
    setError(null);
    setSavedMessage(null);
    try {
      const res = (await api.saveSubscriptionQuote(payload)) as { quote: CustomPlanQuote };
      setQuote(res.quote);
      setSavedMessage('Your custom plan quote has been saved. Our team will follow up to activate billing.');
      onSaved?.();
    } catch (err) {
      setError(formatCatchError(err));
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="rounded-2xl border border-black/5 bg-surface p-6 shadow-sm">
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm font-bold uppercase tracking-widest text-sky-600">
            Build your plan
          </p>
          <h3 className="mt-1 text-lg font-bold text-gray-900">Customize for your team</h3>
          <p className="mt-1 max-w-xl text-sm text-gray-500">
            Set contacts, AI agents, team size, channels, and email sends — your monthly price updates automatically.
            <span className="mt-1 block text-xs text-gray-400">
              Email via AWS SES · $1 per 1,000 sends / month (1,000 included in base)
            </span>
          </p>
        </div>
        <div className="rounded-xl bg-sky-50 px-4 py-3 text-right">
          <p className="text-sm font-bold uppercase tracking-wider text-gray-400">Estimated</p>
          <p className="mt-1 text-2xl font-bold text-gray-900">
            {quoting && !quote ? (
              <Loader2 className="inline h-6 w-6 animate-spin text-sky-600" />
            ) : (
              <>
                ${quote?.monthlyTotal ?? '—'}
                <span className="text-sm font-normal text-gray-400">/mo</span>
              </>
            )}
          </p>
          {quote && (
            <p className="text-xs text-gray-500">
              ${quote.annualTotal.toLocaleString()}/yr (2 months free)
            </p>
          )}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-5">
          <ConfigSlider
            id="plan-contacts"
            label="Contacts"
            icon={Contact}
            value={contacts}
            min={pricingRules.limits.contacts.min}
            max={pricingRules.limits.contacts.max}
            step={pricingRules.limits.contacts.step}
            onChange={setContacts}
          />
          <ConfigSlider
            id="plan-ai-agents"
            label="AI agents"
            icon={Bot}
            value={aiAgents}
            min={pricingRules.limits.aiAgents.min}
            max={pricingRules.limits.aiAgents.max}
            step={pricingRules.limits.aiAgents.step}
            onChange={setAiAgents}
          />
          <ConfigSlider
            id="plan-team"
            label="Team members"
            icon={Users}
            value={teamMembers}
            min={pricingRules.limits.teamMembers.min}
            max={pricingRules.limits.teamMembers.max}
            step={pricingRules.limits.teamMembers.step}
            onChange={setTeamMembers}
          />
          <ConfigSlider
            id="plan-channels"
            label="Channels"
            icon={Zap}
            value={channels}
            min={pricingRules.limits.channels.min}
            max={pricingRules.limits.channels.max}
            step={pricingRules.limits.channels.step}
            onChange={setChannels}
          />
          <ConfigSlider
            id="plan-emails"
            label="Emails / month"
            icon={Mail}
            value={emails}
            min={pricingRules.limits.emails.min}
            max={pricingRules.limits.emails.max}
            step={pricingRules.limits.emails.step}
            onChange={setEmails}
          />
        </div>

        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
          <div className="mb-3 flex items-center gap-2 text-sm font-bold text-gray-900">
            <Calculator className="h-4 w-4 text-sky-600" />
            Price breakdown
          </div>

          {quote ? (
            <ul className="space-y-2">
              {quote.breakdown.map((line) => (
                <li key={line.key} className="flex items-start justify-between gap-3 text-sm">
                  <span className="text-gray-600">
                    {line.label}
                    {line.quantity != null && line.unitLabel ? (
                      <span className="block text-xs text-gray-400">
                        {formatNumber(line.quantity)} {line.unitLabel}
                      </span>
                    ) : null}
                  </span>
                  <span className="font-semibold text-gray-900">${line.amount}</span>
                </li>
              ))}
              <li className="flex items-center justify-between border-t border-slate-200 pt-3 text-sm font-bold text-gray-900">
                <span>Monthly total</span>
                <span>${quote.monthlyTotal}</span>
              </li>
            </ul>
          ) : (
            <p className="text-sm text-gray-400">Adjust sliders to see pricing.</p>
          )}

          {quote?.matchedPlanName && !quote.requiresSales && (
            <p className="mt-4 rounded-lg bg-white px-3 py-2 text-xs text-gray-600 border border-slate-200">
              Closest standard plan: <span className="font-semibold">{quote.matchedPlanName}</span>
            </p>
          )}

          {quote?.requiresSales && (
            <p className="mt-4 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
              This configuration needs an enterprise quote. Save your preferences and we will contact you.
            </p>
          )}
        </div>
      </div>

      {error && (
        <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      )}

      {savedMessage && (
        <div className="mt-4 flex items-start gap-2 rounded-xl border border-primary/20 bg-primary/10 px-3 py-2 text-sm text-primary">
          <Check className="mt-0.5 h-4 w-4 shrink-0" />
          {savedMessage}
        </div>
      )}

      <div className="mt-6 flex flex-wrap gap-3">
        {!quote?.requiresSales && (
          <button
            type="button"
            disabled={paying || quoting || !quote}
            onClick={() => void handlePayCustomPlan()}
            className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-white hover:bg-primary-hover disabled:opacity-50"
          >
            {paying ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            Pay with Razorpay
          </button>
        )}
        <button
          type="button"
          disabled={saving || quoting || !quote}
          onClick={() => void handleSave()}
          className="inline-flex items-center gap-2 rounded-xl border border-[#0284c7] px-5 py-2.5 text-sm font-semibold text-sky-600 hover:bg-sky-50 disabled:opacity-50"
        >
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          Save quote
        </button>
        <button
          type="button"
          onClick={() => {
            const subject = quote?.requiresSales
              ? 'Enterprise plan quote request'
              : 'Custom plan quote';
            const body = quote
              ? `Contacts: ${quote.contacts}\nAI agents: ${quote.aiAgents}\nTeam: ${quote.teamMembers}\nChannels: ${quote.channels}\nEmails/mo: ${quote.emails}\nMonthly: $${quote.monthlyTotal}`
              : '';
            window.location.href = `mailto:support@convosync.io?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
          }}
          className="rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50"
        >
          Email quote to sales
        </button>
      </div>
    </section>
  );
}
