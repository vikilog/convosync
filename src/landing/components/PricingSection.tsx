/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  Ban,
  Check,
  Gauge,
  IndianRupee,
  Infinity as InfinityIcon,
  MessageCircle,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import { motion, useReducedMotion } from 'motion/react';
import { PRICING_PLANS } from '../data';
import { LandingSection, LandingSectionHeader } from './landing-ui';

interface PricingSectionProps {
  onSelectPlan: (planId: string) => void;
}

const PRO_ICONS = [Ban, InfinityIcon, MessageCircle, ShieldCheck] as const;

const TRUST_POINTS = [
  { icon: ShieldCheck, label: '14-day free trial' },
  { icon: IndianRupee, label: 'INR billing · UPI ready' },
  { icon: Gauge, label: 'Meta API costs pass-through' },
] as const;

export default function PricingSection({ onSelectPlan }: PricingSectionProps) {
  const plan = PRICING_PLANS[0];
  const reduceMotion = useReducedMotion();
  const proPoints = plan?.proPoints ?? [];

  if (!plan) return null;

  const enter = reduceMotion
    ? { initial: false as const, transition: { duration: 0 } }
    : {
        initial: { opacity: 0, y: 28 },
        whileInView: { opacity: 1, y: 0 },
        viewport: { once: true, amount: 0.2 },
        transition: { duration: 0.45, ease: [0.22, 1, 0.36, 1] as const },
      };

  const listItem = {
    hidden: { opacity: reduceMotion ? 1 : 0, y: reduceMotion ? 0 : 10 },
    visible: (i: number) => ({
      opacity: 1,
      y: 0,
      transition: reduceMotion
        ? { duration: 0 }
        : { delay: 0.08 + i * 0.045, duration: 0.28, ease: [0.22, 1, 0.36, 1] as const },
    }),
  };

  return (
    <LandingSection id="pricing" tone="soft" className="relative overflow-hidden text-center">
      <div
        className="pointer-events-none absolute inset-0 opacity-70"
        aria-hidden
        style={{
          background:
            'radial-gradient(ellipse 80% 50% at 50% 0%, rgba(16,185,129,0.14), transparent 60%), radial-gradient(ellipse 60% 40% at 20% 90%, rgba(34,197,94,0.08), transparent 55%)',
        }}
      />

      <div className="relative">
        <LandingSectionHeader
          badge="Pricing"
          title="One simple plan."
          titleAccent="Everything you need to start."
          description="14-day free trial. No credit card. Official Meta messaging rates — we don’t add a per-message markup."
        />

        <motion.div className="mx-auto max-w-5xl" {...enter}>
          <motion.div
            className="relative overflow-hidden rounded-[1.75rem] border border-emerald-200/80 bg-white/95 text-left shadow-[0_24px_60px_-28px_rgba(16,185,129,0.45)] backdrop-blur-sm"
            whileHover={reduceMotion ? undefined : { y: -3 }}
            transition={{ type: 'spring', stiffness: 320, damping: 28 }}
          >
            <div
              className="absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r from-channel-green via-emerald-400 to-teal-400"
              aria-hidden
            />

            <div className="grid grid-cols-1 lg:grid-cols-12">
              {/* Left — price + pro points + CTA */}
              <div className="flex flex-col justify-between border-b border-emerald-100/80 p-7 sm:p-9 lg:col-span-5 lg:border-b-0 lg:border-r lg:border-emerald-100/80">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-emerald-800 ring-1 ring-emerald-100">
                      <Sparkles className="h-3.5 w-3.5" aria-hidden />
                      {plan.name}
                    </span>
                    <span className="text-xs font-semibold text-slate-500">Billed monthly</span>
                  </div>

                  <div className="mt-6 flex flex-wrap items-end gap-2">
                    <p className="font-display text-5xl font-extrabold tracking-tight text-slate-950 sm:text-6xl">
                      ₹{plan.priceMonthly.toLocaleString('en-IN')}
                    </p>
                    <p className="mb-2 text-sm font-semibold text-slate-500">/ month</p>
                  </div>
                  <p className="mt-3 text-sm leading-relaxed text-slate-600">{plan.description}</p>

                  {proPoints.length > 0 ? (
                    <ul className="mt-8 space-y-3" role="list">
                      {proPoints.map((point, i) => {
                        const Icon = PRO_ICONS[i % PRO_ICONS.length];
                        return (
                          <motion.li
                            key={point}
                            custom={i}
                            variants={listItem}
                            initial="hidden"
                            whileInView="visible"
                            viewport={{ once: true, amount: 0.4 }}
                            className="flex items-start gap-3 text-sm font-semibold leading-snug text-slate-800"
                          >
                            <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100">
                              <Icon className="h-4 w-4" aria-hidden />
                            </span>
                            <span className="pt-1.5">{point}</span>
                          </motion.li>
                        );
                      })}
                    </ul>
                  ) : null}
                </div>

                <div className="mt-9">
                  <motion.button
                    id={`plan-cta-${plan.id}`}
                    type="button"
                    onClick={() => onSelectPlan(plan.id)}
                    className="flex min-h-12 w-full cursor-pointer items-center justify-center rounded-full bg-channel-green px-6 text-sm font-bold text-white shadow-lg shadow-emerald-600/25 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-channel-green"
                    whileHover={
                      reduceMotion ? undefined : { scale: 1.02, backgroundColor: '#20bd5a' }
                    }
                    whileTap={reduceMotion ? undefined : { scale: 0.98 }}
                    transition={{ duration: 0.18 }}
                  >
                    {plan.ctaText}
                  </motion.button>
                  <p className="mt-3 text-center text-xs text-slate-500">
                    Cancel anytime during trial. No card required to start.
                  </p>
                </div>
              </div>

              {/* Right — what’s included */}
              <div className="bg-emerald-50/40 p-7 sm:p-9 lg:col-span-7">
                <p className="text-[11px] font-bold uppercase tracking-widest text-emerald-800">
                  What’s included
                </p>
                <ul className="mt-5 grid grid-cols-1 gap-3.5 sm:grid-cols-2" role="list">
                  {plan.features.map((feat, i) => (
                    <motion.li
                      key={feat}
                      custom={i}
                      variants={listItem}
                      initial="hidden"
                      whileInView="visible"
                      viewport={{ once: true, amount: 0.3 }}
                      className="flex items-start gap-3 rounded-2xl border border-white/80 bg-white/90 px-3.5 py-3 text-sm font-medium leading-snug text-slate-700 shadow-sm shadow-emerald-900/5"
                    >
                      <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
                        <Check className="h-3 w-3" strokeWidth={3} aria-hidden />
                      </span>
                      <span>{feat}</span>
                    </motion.li>
                  ))}
                </ul>

                <div className="mt-8 rounded-2xl border border-emerald-100 bg-white/80 px-4 py-3.5">
                  <p className="text-xs font-bold text-slate-800">Channels in this plan</p>
                  <p className="mt-1 text-sm leading-relaxed text-slate-600">
                    <span className="font-semibold text-slate-900">2 WhatsApp</span>
                    {' · '}
                    <span className="font-semibold text-slate-900">1 Instagram</span>
                    {' · '}
                    <span className="font-semibold text-slate-900">1 Email</span>
                    {' — '}4 channels total.
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>

        <motion.div
          className="mx-auto mt-10 flex max-w-3xl flex-wrap items-center justify-center gap-x-10 gap-y-3"
          initial={reduceMotion ? false : { opacity: 0 }}
          whileInView={reduceMotion ? undefined : { opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.15, duration: 0.35 }}
        >
          {TRUST_POINTS.map(({ icon: Icon, label }) => (
            <div
              key={label}
              className="inline-flex items-center gap-2 text-xs font-semibold text-slate-600"
            >
              <Icon className="h-4 w-4 shrink-0 text-channel-green" aria-hidden />
              <span>{label}</span>
            </div>
          ))}
        </motion.div>
      </div>
    </LandingSection>
  );
}
