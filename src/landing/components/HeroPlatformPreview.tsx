/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import type { ReactElement, ReactNode } from 'react';
import { createContext, useContext } from 'react';
import {
  BarChart3,
  Bot,
  Check,
  CreditCard,
  GitFork,
  Inbox,
  Megaphone,
  MessageSquare,
  Sparkles,
  TrendingUp,
  Users,
  Zap,
} from 'lucide-react';
import { PRODUCT_NAME } from '../brand';

export type HeroModuleId = 'inbox' | 'ai' | 'campaigns' | 'journeys' | 'pay' | 'ads';

export const HERO_MODULES: {
  id: HeroModuleId;
  label: string;
  short: string;
  icon: typeof Inbox;
}[] = [
  { id: 'inbox', label: 'Omnichannel Inbox', short: 'Inbox', icon: Inbox },
  { id: 'ai', label: 'AI Agents', short: 'AI Agents', icon: Bot },
  { id: 'campaigns', label: 'Campaigns', short: 'Campaigns', icon: Megaphone },
  { id: 'journeys', label: 'Journeys', short: 'Journeys', icon: GitFork },
  { id: 'pay', label: 'WhatsApp Pay', short: 'Pay', icon: CreditCard },
  { id: 'ads', label: 'Meta Ads', short: 'Meta Ads', icon: BarChart3 },
];

type HeroPreviewStyle = 'chrome' | 'minimal';

const HeroPreviewStyleContext = createContext<HeroPreviewStyle>('chrome');

type HeroPlatformPreviewProps = {
  active: HeroModuleId;
  variant?: HeroPreviewStyle;
};

function PreviewChrome({ title, children }: { title: string; children: ReactNode }) {
  const variant = useContext(HeroPreviewStyleContext);

  if (variant === 'minimal') {
    return (
      <div className="w-full rounded-2xl lg:rounded-3xl border border-gray-200/80 bg-white/90 backdrop-blur-sm shadow-2xl shadow-emerald-900/5 overflow-hidden">
        <div className="p-4 sm:p-5 lg:p-6 bg-gradient-to-b from-white to-gray-50/40 min-h-[300px] sm:min-h-[360px] lg:min-h-[420px] xl:min-h-[460px]">
          {children}
        </div>
      </div>
    );
  }

  return (
    <div className="w-full rounded-2xl lg:rounded-3xl border border-gray-200 bg-white shadow-xl shadow-gray-200/60 overflow-hidden">
      <div className="flex items-center justify-between gap-3 px-4 sm:px-5 py-3 sm:py-3.5 border-b border-gray-100 bg-gray-50/80">
        <div className="flex items-center gap-2 min-w-0">
          <span className="w-2.5 h-2.5 rounded-full bg-red-400 shrink-0" aria-hidden />
          <span className="w-2.5 h-2.5 rounded-full bg-amber-400 shrink-0" aria-hidden />
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 shrink-0" aria-hidden />
          <p className="text-xs sm:text-sm font-mono text-gray-500 truncate ml-1">{title}</p>
        </div>
        <span className="text-[10px] sm:text-xs font-semibold text-emerald-600 bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded-full shrink-0">
          Live preview
        </span>
      </div>
      <div className="p-5 sm:p-6 lg:p-7 bg-gradient-to-b from-white to-gray-50/50 min-h-[340px] sm:min-h-[400px] lg:min-h-[480px] xl:min-h-[520px]">
        {children}
      </div>
    </div>
  );
}

function InboxPreview() {
  const threads = [
    { name: 'Priya M.', channel: 'WhatsApp', msg: 'Course fee payment link?', unread: true },
    { name: 'Rahul S.', channel: 'Instagram', msg: 'Order #7731 status?', unread: false },
    { name: 'Ananya K.', channel: 'Telegram', msg: 'Demo slot tomorrow?', unread: true },
  ];

  return (
    <PreviewChrome title={`${PRODUCT_NAME} · Unified Inbox`}>
      <div className="grid grid-cols-1 @min-[520px]:grid-cols-5 gap-3 h-full min-h-[260px] sm:min-h-[300px] lg:min-h-[360px]">
        <div className="@min-[520px]:col-span-2 space-y-2">
          {threads.map((t) => (
            <div
              key={t.name}
              className={`rounded-xl border p-2.5 ${t.unread ? 'border-brand-indigo/30 bg-brand-indigo/5' : 'border-gray-100 bg-white'}`}
            >
              <div className="flex items-center justify-between gap-1">
                <span className="text-[11px] font-semibold text-gray-900 truncate">{t.name}</span>
                {t.unread && <span className="w-1.5 h-1.5 rounded-full bg-brand-indigo shrink-0" />}
              </div>
              <p className="text-[10px] text-gray-500 mt-0.5">{t.channel}</p>
              <p className="text-[10px] text-gray-600 truncate mt-1">{t.msg}</p>
            </div>
          ))}
        </div>
        <div className="@min-[520px]:col-span-3 rounded-xl border border-gray-100 bg-white p-3 sm:p-4 flex flex-col min-h-[220px] sm:min-h-[260px] lg:min-h-[300px]">
          <div className="flex items-center gap-2 pb-2 border-b border-gray-100">
            <div className="w-7 h-7 rounded-full bg-brand-indigo/10 text-brand-indigo flex items-center justify-center text-xs font-bold">
              P
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-900">Priya Mehta</p>
              <p className="text-[10px] text-channel-green font-medium">WhatsApp · AI assigned</p>
            </div>
          </div>
          <div className="flex-1 space-y-2 py-3">
            <div className="max-w-[85%] rounded-xl rounded-tl-sm bg-gray-100 px-2.5 py-2 text-[11px] text-gray-700">
              Is the April cohort still open? Can I pay via UPI?
            </div>
            <div className="max-w-[90%] ml-auto rounded-xl rounded-tr-sm bg-[#102C1B] border border-channel-green/20 px-2.5 py-2 text-[11px] text-gray-100">
              Yes — cohort closes Sunday. I sent a secure WhatsApp Pay link for ₹14,999.
            </div>
          </div>
          <div className="flex gap-2">
            <div className="flex-1 h-8 rounded-lg bg-gray-50 border border-gray-200 text-[10px] text-gray-400 flex items-center px-2">
              Reply or assign to team…
            </div>
            <div className="w-8 h-8 rounded-lg bg-brand-indigo text-white flex items-center justify-center">
              <MessageSquare className="w-3.5 h-3.5" />
            </div>
          </div>
        </div>
      </div>
    </PreviewChrome>
  );
}

function AiPreview() {
  return (
    <PreviewChrome title={`${PRODUCT_NAME} · AI Agent Studio`}>
      <div className="grid sm:grid-cols-2 gap-4">
        <div className="rounded-xl border border-gray-100 bg-white p-3 space-y-3">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-brand-indigo/10 text-brand-indigo flex items-center justify-center">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-900">Agent Sara</p>
              <p className="text-[10px] text-gray-500">Support · 24/7 auto-resolve</p>
            </div>
          </div>
          <div className="space-y-1.5">
            {['pricing-faq.pdf', 'return-policy.docx', 'product-catalog.url'].map((doc) => (
              <div key={doc} className="flex items-center gap-2 text-[11px] text-gray-600 bg-gray-50 rounded-lg px-2 py-1.5">
                <Sparkles className="w-3.5 h-3.5 text-brand-indigo shrink-0" />
                <span className="truncate">{doc}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="space-y-3">
          <div className="rounded-xl border border-emerald-100 bg-emerald-50/80 p-3">
            <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-700">This week</p>
            <p className="text-2xl font-extrabold text-gray-900 mt-1">847</p>
            <p className="text-xs text-gray-600">conversations resolved without a human</p>
          </div>
          <div className="rounded-xl border border-gray-100 bg-white p-3 space-y-2">
            <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide">Live handoff rule</p>
            <p className="text-xs text-gray-700 leading-relaxed">
              Escalate to human when sentiment drops or payment amount exceeds ₹25,000.
            </p>
            <div className="flex items-center gap-1.5 text-[10px] text-emerald-600 font-medium">
              <Check className="w-3.5 h-3.5" />
              <span>Active on WhatsApp + Instagram</span>
            </div>
          </div>
        </div>
      </div>
    </PreviewChrome>
  );
}

function CampaignsPreview() {
  return (
    <PreviewChrome title={`${PRODUCT_NAME} · Campaign Broadcast`}>
      <div className="grid sm:grid-cols-2 gap-4">
        <div className="rounded-xl border border-gray-100 bg-white p-3">
          <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-2">Template</p>
          <p className="text-sm font-semibold text-gray-900">Flash sale — 20% off</p>
          <p className="text-xs text-gray-600 mt-2 leading-relaxed">
            Hi {'{{name}}'}, your cart is waiting. Complete checkout in the next 6 hours for an exclusive discount.
          </p>
          <div className="mt-3 flex flex-wrap gap-1.5">
            {['WhatsApp', 'SMS fallback'].map((ch) => (
              <span key={ch} className="text-[10px] px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 font-medium">
                {ch}
              </span>
            ))}
          </div>
        </div>
        <div className="space-y-3">
          {[
            { label: 'Audience', value: '8,420 opted-in contacts' },
            { label: 'Delivered', value: '8,103 (96.2%)' },
            { label: 'Clicked', value: '1,284 (15.8%)' },
          ].map((row) => (
            <div key={row.label} className="flex items-center justify-between rounded-lg border border-gray-100 bg-white px-3 py-2">
              <span className="text-xs text-gray-500">{row.label}</span>
              <span className="text-xs font-semibold text-gray-900">{row.value}</span>
            </div>
          ))}
          <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
            <div className="h-full w-[82%] bg-brand-indigo rounded-full" />
          </div>
          <p className="text-[10px] text-gray-500">Campaign completes in 4m · ₹0 platform markup on Meta fees</p>
        </div>
      </div>
    </PreviewChrome>
  );
}

function JourneysPreview() {
  const steps = [
    { label: 'New signup', sub: 'WhatsApp trigger', color: 'bg-channel-green' },
    { label: 'Wait 2h', sub: 'No reply', color: 'bg-amber-400' },
    { label: 'AI nurture', sub: 'Agent Sara', color: 'bg-brand-indigo' },
    { label: 'Collect payment', sub: 'WhatsApp Pay', color: 'bg-emerald-500' },
  ];

  return (
    <PreviewChrome title={`${PRODUCT_NAME} · Journey Builder`}>
      <div className="grid grid-cols-2 @min-[540px]:flex @min-[540px]:items-center gap-2 @min-[540px]:gap-1">
        {steps.map((step, i) => (
          <div key={step.label} className="flex items-center gap-1 @min-[540px]:flex-1 min-w-0">
            <div className="flex-1 rounded-xl border border-gray-100 bg-white p-2.5 min-w-0">
              <div className={`w-2 h-2 rounded-full ${step.color} mb-1.5`} />
              <p className="text-[11px] font-semibold text-gray-900 truncate">{step.label}</p>
              <p className="text-[10px] text-gray-500 truncate">{step.sub}</p>
            </div>
            {i < steps.length - 1 && (
              <Zap className="w-3.5 h-3.5 text-gray-300 shrink-0 hidden @min-[540px]:block" aria-hidden />
            )}
          </div>
        ))}
      </div>
      <div className="mt-4 grid grid-cols-3 gap-2">
        {[
          { label: 'Enrolled', value: '1,204' },
          { label: 'Completed', value: '68%' },
          { label: 'Revenue', value: '₹8.4L' },
        ].map((stat) => (
          <div key={stat.label} className="rounded-lg bg-gray-50 border border-gray-100 p-2 text-center">
            <p className="text-[10px] text-gray-500">{stat.label}</p>
            <p className="text-sm font-bold text-gray-900">{stat.value}</p>
          </div>
        ))}
      </div>
    </PreviewChrome>
  );
}

function PayPreview() {
  return (
    <PreviewChrome title={`${PRODUCT_NAME} · WhatsApp Pay`}>
      <div className="max-w-sm mx-auto space-y-3">
        <div className="rounded-xl rounded-tl-sm bg-gray-100 px-3 py-2 text-[11px] text-gray-700 ml-0 mr-8">
          Please share payment for the Growth plan.
        </div>
        <div className="ml-auto mr-0 max-w-[88%] rounded-xl border border-channel-green/25 bg-white shadow-sm overflow-hidden">
          <div className="bg-channel-green/10 px-3 py-2 flex items-center gap-2 border-b border-channel-green/15">
            <CreditCard className="w-4 h-4 text-channel-green" />
            <span className="text-[11px] font-semibold text-gray-900">Payment request</span>
          </div>
          <div className="p-3 space-y-2">
            <div className="flex items-baseline justify-between">
              <span className="text-xs text-gray-500">Amount</span>
              <span className="text-lg font-extrabold text-gray-900">₹4,999</span>
            </div>
            <p className="text-[10px] text-gray-500">Growth plan · Monthly · UPI / Card</p>
            <button
              type="button"
              className="w-full py-2 rounded-lg bg-channel-green text-white text-xs font-semibold cursor-default"
              tabIndex={-1}
            >
              Pay securely in WhatsApp
            </button>
            <p className="text-[10px] text-emerald-600 flex items-center gap-1">
              <Check className="w-3 h-3" />
              Paid · Receipt sent automatically
            </p>
          </div>
        </div>
      </div>
    </PreviewChrome>
  );
}

function AdsPreview() {
  const campaigns = [
    { name: 'Diwali retargeting', spend: '₹18,200', roas: '4.6x', status: 'Active' },
    { name: 'Lead gen — Bangalore', spend: '₹12,450', roas: '3.1x', status: 'Active' },
    { name: 'Catalog sales', spend: '₹9,800', roas: '2.8x', status: 'Learning' },
  ];

  return (
    <PreviewChrome title={`${PRODUCT_NAME} · Meta Ads Manager`}>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-4">
        {[
          { label: 'Spend (7d)', value: '₹45.2K', icon: TrendingUp },
          { label: 'Leads', value: '234', icon: Users },
          { label: 'ROAS', value: '4.2x', icon: BarChart3 },
        ].map(({ label, value, icon: Icon }) => (
          <div key={label} className="rounded-xl border border-gray-100 bg-white p-2.5">
            <Icon className="w-4 h-4 text-brand-indigo mb-1" />
            <p className="text-[10px] text-gray-500">{label}</p>
            <p className="text-sm font-bold text-gray-900">{value}</p>
          </div>
        ))}
      </div>
      <div className="rounded-xl border border-gray-100 overflow-hidden">
        <div className="grid grid-cols-[1.4fr_1fr_1fr] sm:grid-cols-4 gap-2 px-3 py-2 bg-gray-50 text-[10px] font-semibold text-gray-500 uppercase tracking-wide">
          <span className="sm:col-span-2">Campaign</span>
          <span>Spend</span>
          <span>ROAS</span>
        </div>
        {campaigns.map((c) => (
          <div
            key={c.name}
            className="grid grid-cols-[1.4fr_1fr_1fr] sm:grid-cols-4 gap-2 px-3 py-2 border-t border-gray-100 text-[11px] items-center"
          >
            <span className="sm:col-span-2 font-medium text-gray-800 truncate">{c.name}</span>
            <span className="text-gray-600">{c.spend}</span>
            <span className="font-semibold text-emerald-600">{c.roas}</span>
          </div>
        ))}
      </div>
    </PreviewChrome>
  );
}

const PREVIEW_MAP: Record<HeroModuleId, () => ReactElement> = {
  inbox: InboxPreview,
  ai: AiPreview,
  campaigns: CampaignsPreview,
  journeys: JourneysPreview,
  pay: PayPreview,
  ads: AdsPreview,
};

export function HeroPlatformPreview({ active, variant = 'chrome' }: HeroPlatformPreviewProps) {
  const Preview = PREVIEW_MAP[active];
  const moduleLabel = HERO_MODULES.find((m) => m.id === active)?.label ?? 'Platform preview';
  return (
    <HeroPreviewStyleContext.Provider value={variant}>
      <div
        key={active}
        className="w-full motion-safe:animate-fade-in"
        role="img"
        aria-label={`${PRODUCT_NAME} ${moduleLabel} preview`}
      >
        <Preview />
      </div>
    </HeroPreviewStyleContext.Provider>
  );
}
