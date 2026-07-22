/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  Bot,
  CalendarClock,
  ExternalLink,
  Inbox,
  Megaphone,
  Sparkles,
} from 'lucide-react';
import { motion, useReducedMotion } from 'motion/react';
import { trackEvent } from '../../lib/analytics';
import { LandingSection, LandingSectionHeader } from './landing-ui';

const CALENDLY_DEMO_URL = 'https://calendly.com/svikasswami03/30min';

const DEMO_POINTS = [
  {
    icon: Inbox,
    title: 'Unified inbox',
    body: 'WhatsApp, Instagram, and email in one shared team view.',
  },
  {
    icon: Megaphone,
    title: 'Campaigns & journeys',
    body: 'See broadcasts and automation flows live on the call.',
  },
  {
    icon: Bot,
    title: 'AI agents',
    body: 'Watch how AI replies with your knowledge and skills.',
  },
  {
    icon: CalendarClock,
    title: 'No commitment',
    body: 'Pick a slot now — start a 14-day trial whenever you’re ready.',
  },
] as const;

export default function BookDemoSection() {
  const reduceMotion = useReducedMotion();

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
    <LandingSection id="book-demo" tone="soft" className="relative overflow-hidden">
      <div
        className="pointer-events-none absolute inset-0 opacity-70"
        aria-hidden
        style={{
          background:
            'radial-gradient(ellipse 80% 50% at 50% 0%, rgba(16,185,129,0.14), transparent 60%), radial-gradient(ellipse 60% 40% at 85% 85%, rgba(34,197,94,0.08), transparent 55%)',
        }}
      />

      <div className="relative">
        <LandingSectionHeader
          badge="Talk to us"
          title="Book a demo"
          titleAccent="Pick a time that works."
          description="A 30-minute walkthrough of inbox, campaigns, and AI agents — book instantly on Calendly."
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
              <div className="flex flex-col justify-between border-b border-emerald-100/80 p-7 sm:p-9 lg:col-span-5 lg:border-b-0 lg:border-r lg:border-emerald-100/80">
                <div>
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-emerald-800 ring-1 ring-emerald-100">
                    <Sparkles className="h-3.5 w-3.5" aria-hidden />
                    Live walkthrough
                  </span>
                  <h3 className="mt-5 font-display text-2xl font-extrabold tracking-tight text-slate-950">
                    What we’ll cover
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-slate-600">
                    A focused 30-minute session tailored to your store or support team.
                  </p>

                  <ul className="mt-8 space-y-4" role="list">
                    {DEMO_POINTS.map((point, i) => {
                      const Icon = point.icon;
                      return (
                        <motion.li
                          key={point.title}
                          custom={i}
                          variants={listItem}
                          initial="hidden"
                          whileInView="visible"
                          viewport={{ once: true, amount: 0.4 }}
                          className="flex items-start gap-3"
                        >
                          <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100">
                            <Icon className="h-4 w-4" aria-hidden />
                          </span>
                          <div>
                            <p className="text-sm font-bold text-slate-900">{point.title}</p>
                            <p className="mt-0.5 text-sm leading-snug text-slate-600">{point.body}</p>
                          </div>
                        </motion.li>
                      );
                    })}
                  </ul>
                </div>

                <div className="mt-9">
                  <motion.a
                    href={CALENDLY_DEMO_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => trackEvent('demo_calendly_click', { source: 'landing' })}
                    className="flex min-h-12 w-full cursor-pointer items-center justify-center gap-2 rounded-full bg-channel-green px-6 text-sm font-bold text-white shadow-lg shadow-emerald-600/25 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-channel-green"
                    whileHover={
                      reduceMotion ? undefined : { scale: 1.02, backgroundColor: '#20bd5a' }
                    }
                    whileTap={reduceMotion ? undefined : { scale: 0.98 }}
                    transition={{ duration: 0.18 }}
                  >
                    Book on Calendly
                    <ExternalLink className="h-4 w-4" aria-hidden />
                  </motion.a>
                  <p className="mt-3 text-center text-xs text-slate-500">
                    Or pick a slot in the calendar on the right.
                  </p>
                </div>
              </div>

              <div className="bg-emerald-50/40 p-4 sm:p-6 lg:col-span-7">
                <p className="mb-3 px-1 text-[11px] font-bold uppercase tracking-widest text-emerald-800">
                  Choose a time
                </p>
                <div className="overflow-hidden rounded-2xl border border-white/80 bg-white shadow-sm shadow-emerald-900/5">
                  <iframe
                    title="Book a ConvoSync demo on Calendly"
                    src={`${CALENDLY_DEMO_URL}?hide_gdpr_banner=1&primary_color=22c55e`}
                    className="block h-[620px] w-full border-0 sm:h-[680px]"
                    loading="lazy"
                  />
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </LandingSection>
  );
}
