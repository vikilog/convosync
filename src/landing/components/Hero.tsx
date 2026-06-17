/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useState } from 'react';
import {
  ArrowRight,
  Instagram,
  Mail,
  MessageSquare,
  Send,
  Sparkles,
} from 'lucide-react';
import { PRODUCT_NAME } from '../brand';
import { trackEvent } from '../../lib/analytics';
import {
  HERO_MODULES,
  HeroPlatformPreview,
  type HeroModuleId,
} from './HeroPlatformPreview';

interface HeroProps {
  onStartFree: () => void;
}

const CAPABILITY_HIGHLIGHTS = [
  'Unified inbox across 5 channels',
  'Custom AI agents with your docs',
  'Broadcast campaigns & journeys',
  'WhatsApp Pay in chat',
  'Meta Ads from one dashboard',
  'Reports & team performance',
];

export default function Hero({ onStartFree }: HeroProps) {
  const [activeModule, setActiveModule] = useState<HeroModuleId>('inbox');
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => setReduceMotion(mq.matches);
    update();
    mq.addEventListener('change', update);
    return () => mq.removeEventListener('change', update);
  }, []);

  useEffect(() => {
    if (reduceMotion) return;
    const interval = window.setInterval(() => {
      setActiveModule((current) => {
        const idx = HERO_MODULES.findIndex((m) => m.id === current);
        const next = HERO_MODULES[(idx + 1) % HERO_MODULES.length];
        return next.id;
      });
    }, 7000);
    return () => window.clearInterval(interval);
  }, [reduceMotion]);

  return (
    <section
      id="hero"
      className="relative bg-white text-gray-900 pt-28 pb-16 sm:pb-20 overflow-hidden"
    >
      <div
        className="absolute top-0 right-0 w-[480px] h-[480px] rounded-full bg-brand-indigo/8 blur-[120px] pointer-events-none"
        aria-hidden
      />
      <div
        className="absolute bottom-0 left-0 w-[400px] h-[400px] rounded-full bg-channel-green/8 blur-[100px] pointer-events-none"
        aria-hidden
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-14 items-center">
          {/* Copy */}
          <div className="text-center lg:text-left">
            <div className="inline-flex flex-wrap items-center justify-center lg:justify-start gap-x-2 gap-y-1 bg-brand-indigo/5 border border-brand-indigo/15 rounded-full px-4 py-2 mb-6 text-[11px] sm:text-xs font-semibold text-gray-700 max-w-lg mx-auto lg:mx-0 text-center lg:text-left leading-snug">
              <Sparkles className="w-3.5 h-3.5 text-brand-indigo shrink-0" aria-hidden />
              <span>Inbox · AI · Campaigns · Pay · Meta Ads — one workspace</span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-[3.25rem] font-extrabold font-display tracking-tight leading-[1.08] text-gray-950">
              The complete{' '}
              <span className="bg-gradient-to-r from-brand-blue to-brand-purple bg-clip-text text-transparent">
                customer ops
              </span>{' '}
              platform for growing teams
            </h1>

            <p className="mt-5 text-base sm:text-lg text-gray-600 leading-relaxed max-w-xl mx-auto lg:mx-0">
              {PRODUCT_NAME} is more than a shared inbox. Run omnichannel support, train AI agents on
              your business, launch campaigns, automate journeys, collect WhatsApp Pay, and manage Meta
              ads — without switching between five different tools.
            </p>

            <div className="mt-8 flex flex-col sm:flex-row items-stretch sm:items-center justify-center lg:justify-start gap-3">
              <button
                id="hero-start-btn"
                type="button"
                onClick={onStartFree}
                className="inline-flex items-center justify-center gap-2 bg-brand-gradient hover:bg-brand-gradient-hover text-white font-semibold text-sm sm:text-base px-8 py-4 rounded-xl shadow-lg shadow-brand-purple/25 transition-all duration-200 cursor-pointer focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-purple"
              >
                <span>Start Free — No Credit Card</span>
                <ArrowRight className="w-5 h-5" aria-hidden />
              </button>
            </div>

            <ul className="mt-8 grid grid-cols-1 min-[520px]:grid-cols-2 gap-x-6 gap-y-2.5 text-sm text-gray-600 max-w-xl mx-auto lg:mx-0 text-left">
              {CAPABILITY_HIGHLIGHTS.map((item) => (
                <li key={item} className="flex items-start gap-2">
                  <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-brand-indigo shrink-0" aria-hidden />
                  <span>{item}</span>
                </li>
              ))}
            </ul>

            <div className="mt-8 flex flex-wrap items-center justify-center lg:justify-start gap-3">
              {[
                { Icon: MessageSquare, className: 'bg-channel-green text-white' },
                { Icon: Instagram, className: 'bg-gradient-to-tr from-yellow-500 via-channel-pink to-purple-600 text-white' },
                { Icon: Send, className: 'bg-channel-sky text-white' },
                { Icon: Mail, className: 'bg-gray-500 text-white' },
              ].map(({ Icon, className }, i) => (
                <div
                  key={i}
                  className={`w-9 h-9 rounded-full flex items-center justify-center shadow-sm ${className}`}
                  aria-hidden
                >
                  <Icon className="w-4 h-4" />
                </div>
              ))}
              <span className="text-xs text-gray-500 font-medium w-full sm:w-auto text-center lg:text-left">
                WhatsApp, Instagram, Telegram, Email & more
              </span>
            </div>
          </div>

          {/* Product preview */}
          <div className="@container w-full min-w-0 max-w-3xl mx-auto lg:max-w-none lg:mx-0">
            <div
              className="grid grid-cols-2 sm:grid-cols-3 lg:flex lg:flex-nowrap gap-2 lg:overflow-x-auto lg:pb-2 scrollbar-none lg:-mx-1 lg:px-1"
              role="tablist"
              aria-label="Platform modules"
            >
              {HERO_MODULES.map(({ id, label, icon: Icon }) => {
                const selected = activeModule === id;
                return (
                  <button
                    key={id}
                    type="button"
                    role="tab"
                    id={`hero-tab-${id}`}
                    aria-selected={selected}
                    aria-controls={`hero-panel-${id}`}
                    onClick={() => {
                      trackEvent('hero_tab_change', { module_id: id, trigger: 'click' });
                      setActiveModule(id);
                    }}
                    className={`flex items-center justify-center gap-1.5 w-full lg:w-auto lg:shrink-0 px-3 py-2.5 rounded-full text-xs font-semibold border transition-colors duration-200 cursor-pointer focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-indigo ${
                      selected
                        ? 'bg-brand-gradient text-white border-transparent shadow-sm'
                        : 'bg-white text-gray-600 border-gray-200 hover:border-brand-indigo/40 hover:text-brand-indigo'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5 shrink-0" aria-hidden />
                    <span className="truncate">{label}</span>
                  </button>
                );
              })}
            </div>

            <div className="mt-3">
              <HeroPlatformPreview active={activeModule} />
            </div>

            <p className="mt-3 text-center text-[11px] text-gray-500 font-mono">
              Tap a module to explore · {PRODUCT_NAME} replaces inbox-only tools
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
