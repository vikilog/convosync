/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useState } from 'react';
import {
  ArrowRight,
  Bot,
  Megaphone,
  MessageSquare,
  Play,
  ShieldCheck,
  Zap,
} from 'lucide-react';
import { PRODUCT_NAME } from '../brand';
import {
  HERO_MODULES,
  HeroPlatformPreview,
  type HeroModuleId,
} from './HeroPlatformPreview';

interface HeroProps {
  onStartFree: () => void;
}

const TRUST_ITEMS = [
  { icon: MessageSquare, label: '5 channels' },
  { icon: Bot, label: 'AI agents' },
  { icon: Megaphone, label: 'Campaigns' },
  { icon: ShieldCheck, label: 'Production ready' },
] as const;

function scrollToFeatures() {
  document.getElementById('features')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

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

  const activeLabel = HERO_MODULES.find((m) => m.id === activeModule)?.short ?? 'Preview';

  return (
    <section
      id="hero"
      className="relative hero-grid-bg text-gray-900 pt-28 pb-20 sm:pb-24 overflow-hidden"
    >
      <div
        className="absolute inset-0 bg-gradient-to-b from-white/40 via-transparent to-emerald-50/30 pointer-events-none"
        aria-hidden
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Copy */}
          <div className="text-center lg:text-left">
            <div className="inline-flex flex-wrap items-center justify-center lg:justify-start gap-x-3 gap-y-1 rounded-full border border-emerald-200/70 bg-white/80 backdrop-blur-sm px-4 py-2 mb-8 text-sm shadow-sm">
              <span className="flex items-center gap-2 text-gray-700">
                <span className="w-2 h-2 rounded-full bg-channel-green shrink-0" aria-hidden />
                All-in-one customer ops
              </span>
              <span className="hidden sm:inline text-gray-300" aria-hidden>
                |
              </span>
              <button
                type="button"
                onClick={scrollToFeatures}
                className="inline-flex items-center gap-1 font-semibold text-emerald-700 hover:text-emerald-800 transition-colors duration-200 cursor-pointer"
              >
                What&apos;s new
                <ArrowRight className="w-3.5 h-3.5" aria-hidden />
              </button>
            </div>

            <h1 className="text-[2.75rem] sm:text-5xl lg:text-[3.5rem] xl:text-6xl font-extrabold font-display tracking-tight leading-[1.05] text-gray-950">
              Customer ops
              <br />
              <span className="text-channel-green">for every channel</span>
            </h1>

            <p className="mt-6 text-base sm:text-lg text-gray-600 leading-relaxed max-w-xl mx-auto lg:mx-0">
              Replace five tools with {PRODUCT_NAME}.{' '}
              <strong className="font-semibold text-gray-900">One inbox</strong>, trained{' '}
              <strong className="font-semibold text-gray-900">AI agents</strong>, and{' '}
              <strong className="font-semibold text-gray-900">campaigns</strong> — without switching
              tabs.
            </p>

            <div className="mt-8 flex flex-col sm:flex-row items-stretch sm:items-center justify-center lg:justify-start gap-3">
              <button
                id="hero-start-btn"
                type="button"
                onClick={onStartFree}
                className="inline-flex items-center justify-center gap-2 rounded-full bg-channel-green hover:bg-[#20bd5a] text-white font-bold text-sm sm:text-base px-8 py-3.5 shadow-lg shadow-emerald-600/20 transition-all duration-200 cursor-pointer focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-channel-green"
              >
                <Play className="w-4 h-4 fill-current" aria-hidden />
                <span>Start free trial</span>
              </button>
              <button
                type="button"
                onClick={scrollToFeatures}
                className="inline-flex items-center justify-center gap-2 rounded-full border border-gray-300 bg-white/90 hover:bg-white text-gray-900 font-semibold text-sm sm:text-base px-8 py-3.5 transition-colors duration-200 cursor-pointer focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gray-400"
              >
                See how it works
              </button>
            </div>

            <ul className="mt-10 flex flex-wrap items-center justify-center lg:justify-start gap-x-6 gap-y-3 text-sm text-gray-600">
              {TRUST_ITEMS.map(({ icon: Icon, label }) => (
                <li key={label} className="flex items-center gap-2">
                  <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-white border border-gray-200/80 shadow-sm">
                    <Icon className="w-4 h-4 text-gray-700" aria-hidden />
                  </span>
                  <span className="font-medium text-gray-700">{label}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Product preview */}
          <div className="relative w-full min-w-0">
            <div
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[85%] h-[85%] rounded-full bg-channel-green/15 blur-3xl pointer-events-none"
              aria-hidden
            />
            <div className="absolute -inset-4 rounded-[2rem] border border-dashed border-emerald-300/40 pointer-events-none hidden lg:block" aria-hidden />

            <div className="relative">
              <HeroPlatformPreview active={activeModule} variant="minimal" />
            </div>

            <div className="mt-5 flex flex-col items-center gap-3">
              <div className="flex items-center gap-1.5" aria-hidden>
                {HERO_MODULES.map(({ id }) => (
                  <span
                    key={id}
                    className={`h-1.5 rounded-full transition-all duration-300 ${
                      activeModule === id ? 'w-6 bg-channel-green' : 'w-1.5 bg-gray-300'
                    }`}
                  />
                ))}
              </div>
              <p className="text-xs font-medium text-gray-500 flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5 text-channel-green" aria-hidden />
                Live preview · {activeLabel}
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
