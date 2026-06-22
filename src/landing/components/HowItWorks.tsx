/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Plug, Users, Brain, Activity, LineChart } from 'lucide-react';

interface Step {
  id: number;
  num: string;
  title: string;
  emoji: string;
  desc: string;
  technicalTip: string;
  icon: ReactNode;
  color: string;
  ring: string;
}

const ROADMAP_STEPS: Step[] = [
  {
    id: 1,
    num: '01',
    title: 'Connect Channels',
    emoji: '🔌',
    desc: 'One-click connect WhatsApp, Instagram, Messenger, Telegram, and Corporate Email via official secure channels.',
    technicalTip: 'Official Cloud API integrations setup completes in under 2 minutes.',
    color: 'bg-brand-indigo/10 border-brand-indigo/30 text-brand-indigo',
    ring: 'ring-brand-indigo/40',
    icon: <Plug className="w-5 h-5 text-brand-indigo" />,
  },
  {
    id: 2,
    num: '02',
    title: 'Import Contacts',
    emoji: '👥',
    desc: 'Upload standard CSV lists or map active Shopify/CRM segments. All historical details load instantly.',
    technicalTip: 'Direct synchronization supported for Zoho, HubSpot, and Salesforce.',
    color: 'bg-indigo-100 border-indigo-200 text-brand-indigo',
    ring: 'ring-brand-indigo/30',
    icon: <Users className="w-5 h-5 text-brand-indigo" />,
  },
  {
    id: 3,
    num: '03',
    title: 'Train AI Agent',
    emoji: '🤖',
    desc: 'Instruct your custom AI representative Sara or Max by uploading FAQs, company URLs, or internal PDF charts.',
    technicalTip: 'Secured sandboxed vector index creates fully localized embeddings.',
    color: 'bg-emerald-50 border-emerald-100 text-emerald-600',
    ring: 'ring-emerald-400/40',
    icon: <Brain className="w-5 h-5 text-emerald-600" />,
  },
  {
    id: 4,
    num: '04',
    title: 'Build Journeys',
    emoji: '🔄',
    desc: 'Configure flexible automation workflows: welcome drips, abandoned checkout triggers, and promo distributions.',
    technicalTip: 'Drag & drop canvas includes fallback checks for optimal delivery.',
    color: 'bg-amber-50 border-amber-100 text-amber-600',
    ring: 'ring-amber-400/40',
    icon: <Activity className="w-5 h-5 text-amber-600" />,
  },
  {
    id: 5,
    num: '05',
    title: 'Watch It Grow',
    emoji: '📈',
    desc: 'Relax while your automated AI clerks resolve repetitive inquiries and your sales dashboards fill with premium conversion rates.',
    technicalTip: 'High-satisfaction reports and per-agent metrics exportable to CSV anytime.',
    color: 'bg-cyan-50 border-cyan-100 text-cyan-600',
    ring: 'ring-cyan-400/40',
    icon: <LineChart className="w-5 h-5 text-cyan-600" />,
  },
];

export default function HowItWorks() {
  const sectionRef = useRef<HTMLElement>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [activeStep, setActiveStep] = useState(1);

  useEffect(() => {
    const node = sectionRef.current;
    if (!node) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.2, rootMargin: '0px 0px -8% 0px' },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!isVisible) return;

    const prefersReduced =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReduced) return;

    const interval = window.setInterval(() => {
      setActiveStep((prev) => (prev >= ROADMAP_STEPS.length ? 1 : prev + 1));
    }, 3200);

    return () => window.clearInterval(interval);
  }, [isVisible]);

  const steps = ROADMAP_STEPS;

  return (
    <section
      ref={sectionRef}
      id="how-it-works"
      className="bg-[#FAF9FF] border-b border-gray-100 py-24 text-gray-900 overflow-hidden relative"
    >
      <div
        className="absolute inset-0 dot-grid opacity-30 pointer-events-none"
        aria-hidden
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        <div className="text-center max-w-2xl mx-auto mb-16 lg:mb-20">
          <span className="text-xs uppercase font-extrabold text-brand-indigo tracking-widest font-mono">
            SETUP FOOTPRINT
          </span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold font-display tracking-tight text-gray-900 mt-2">
            Zero to live AI-resolution in 10 minutes
          </h2>
          <p className="text-xs sm:text-sm text-gray-500 mt-3 font-sans">
            A frictionless setup pipeline engineered to transition teams away from communication chaos rapidly.
          </p>
        </div>

        {/* Desktop horizontal roadmap */}
        <div className="hidden lg:block relative mb-6">
          <div className="flex items-center justify-between text-[10px] font-mono font-bold uppercase tracking-widest text-gray-400 px-2 mb-3">
            <span className="text-brand-blue">Start</span>
            <span className="text-brand-purple">Go live</span>
          </div>

          <div className="relative h-14 mx-8">
            <div className="absolute top-1/2 left-0 right-0 h-1 -translate-y-1/2 rounded-full bg-gray-200/80" />
            <div
              className={`absolute top-1/2 left-0 right-0 h-1 -translate-y-1/2 rounded-full bg-brand-gradient ${
                isVisible ? 'roadmap-line-x' : 'scale-x-0'
              }`}
            />
            {isVisible && (
              <span
                className="roadmap-travel-dot absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-white border-2 border-brand-purple shadow-md shadow-brand-purple/30"
                aria-hidden
              />
            )}

            <div className="absolute inset-0 flex justify-between items-center">
              {steps.map((st, index) => {
                const isActive = activeStep === st.id;
                const delay = `${index * 0.12}s`;

                return (
                  <button
                    key={st.id}
                    type="button"
                    onClick={() => setActiveStep(st.id)}
                    className={`relative flex flex-col items-center group cursor-pointer ${
                      isVisible ? 'roadmap-milestone-visible' : 'opacity-0 scale-75'
                    }`}
                    style={{ animationDelay: delay }}
                    aria-label={`Step ${st.num}: ${st.title}`}
                    aria-current={isActive ? 'step' : undefined}
                  >
                    <span
                      className={`w-11 h-11 rounded-full border-[3px] border-white bg-white shadow-md flex items-center justify-center font-mono text-xs font-bold transition-all duration-300 ${
                        isActive
                          ? `bg-brand-gradient text-white scale-110 shadow-brand-purple/30 ring-4 ${st.ring}`
                          : 'text-brand-indigo ring-2 ring-gray-100 group-hover:ring-brand-indigo/30'
                      }`}
                    >
                      {st.num}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Mobile / tablet vertical roadmap */}
        <div className="lg:hidden max-w-xl mx-auto mb-10 space-y-0">
          {steps.map((st, index) => {
            const isActive = activeStep === st.id;
            const delay = `${0.15 + index * 0.1}s`;
            const isLast = index === steps.length - 1;

            return (
              <div
                key={st.id}
                className={`flex gap-4 ${isVisible ? 'roadmap-step-visible' : 'opacity-0 translate-y-5'}`}
                style={{ animationDelay: delay }}
              >
                <div className="flex flex-col items-center shrink-0 w-9 pt-1">
                  <button
                    type="button"
                    onClick={() => setActiveStep(st.id)}
                    className={`w-9 h-9 rounded-full border-[3px] border-white font-mono text-[10px] font-bold flex items-center justify-center shadow-md transition-all duration-300 cursor-pointer ${
                      isActive
                        ? 'bg-brand-gradient text-white scale-110 ring-4 ring-brand-purple/20'
                        : 'bg-white text-brand-indigo'
                    } ${isVisible ? 'roadmap-milestone-visible' : ''}`}
                    style={{ animationDelay: delay }}
                    aria-label={`Step ${st.num}: ${st.title}`}
                  >
                    {st.num}
                  </button>
                  {!isLast && (
                    <div className="relative w-0.5 flex-1 min-h-10 my-1.5 rounded-full bg-gray-200 overflow-hidden">
                      <div
                        className={`absolute inset-0 origin-top bg-brand-gradient transition-transform duration-700 ${
                          isVisible && (isActive || index < activeStep - 1) ? 'scale-y-100' : 'scale-y-0'
                        }`}
                      />
                    </div>
                  )}
                </div>

                <article
                  onMouseEnter={() => setActiveStep(st.id)}
                  className={`flex-1 bg-white border rounded-2xl p-5 shadow-xs mb-4 transition-all duration-500 ${
                    isActive
                      ? 'border-brand-indigo/25 shadow-lg shadow-brand-purple/10'
                      : 'border-gray-100'
                  }`}
                >
                  <div className="flex items-center justify-between mb-4">
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center border ${st.color} ${
                        isActive ? 'scale-110' : ''
                      } transition-transform`}
                    >
                      {st.icon}
                    </div>
                    <span className="text-xl shrink-0">{st.emoji}</span>
                  </div>
                  <h3 className="text-base font-bold text-gray-900 font-display">{st.title}</h3>
                  <p className="text-[12.5px] text-gray-500 leading-relaxed font-sans mt-2">{st.desc}</p>
                  <div
                    className={`mt-3 pt-3 border-t border-gray-50 transition-opacity duration-300 ${
                      isActive ? 'opacity-100' : 'opacity-50'
                    }`}
                  >
                    <p className="text-[10px] text-gray-400 font-mono leading-relaxed">
                      💡 {st.technicalTip}
                    </p>
                  </div>
                </article>
              </div>
            );
          })}
        </div>

        {/* Desktop step cards */}
        <div className="hidden lg:grid lg:grid-cols-5 gap-5 relative z-10">
          {steps.map((st, index) => {
            const isActive = activeStep === st.id;
            const delay = `${0.15 + index * 0.1}s`;

            return (
              <article
                key={st.id}
                onMouseEnter={() => setActiveStep(st.id)}
                className={`bg-white border rounded-2xl p-6 shadow-xs transition-all duration-500 relative ${
                  isVisible ? 'roadmap-step-visible' : 'opacity-0 translate-y-5'
                } ${
                  isActive
                    ? 'border-brand-indigo/25 shadow-lg shadow-brand-purple/10 -translate-y-1 scale-[1.02]'
                    : 'border-gray-100 hover:shadow-md hover:-translate-y-0.5'
                }`}
                style={{ animationDelay: delay }}
              >
                <span className="absolute -top-3 left-6 font-mono text-[11px] font-bold bg-[#E6E2FF] text-brand-indigo px-2.5 py-1 rounded-full border border-white">
                  Step {st.num}
                </span>

                <div className="flex items-center justify-between mb-5 mt-2">
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center border transition-transform duration-300 ${
                      st.color
                    } ${isActive ? 'scale-110' : ''}`}
                  >
                    {st.icon}
                  </div>
                  <span className="text-xl shrink-0">{st.emoji}</span>
                </div>

                <h3 className="text-base font-bold text-gray-900 font-display">{st.title}</h3>
                <p className="text-[12.5px] text-gray-500 leading-relaxed font-sans mt-2.5">{st.desc}</p>

                <div
                  className={`mt-4 pt-3 border-t border-gray-50 transition-all duration-300 ${
                    isActive ? 'opacity-100' : 'opacity-50'
                  }`}
                >
                  <p className="text-[10px] text-gray-400 font-mono leading-relaxed">
                    💡 {st.technicalTip}
                  </p>
                </div>
              </article>
            );
          })}
        </div>

        {/* Bottom stats */}
        <div
          className={`mt-16 bg-white border border-gray-100 rounded-2xl p-6 flex flex-col md:flex-row justify-around items-center text-center gap-6 shadow-xs max-w-4xl mx-auto transition-all duration-700 ${
            isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
          }`}
          style={{ transitionDelay: '0.7s' }}
        >
          <div>
            <p className="text-2xl font-extrabold text-sky-600">1 click</p>
            <p className="text-xs text-gray-500 font-mono mt-0.5">METACHANNEL HANDSHAKES</p>
          </div>
          <div className="h-8 w-px bg-gray-100 hidden md:block" />
          <div>
            <p className="text-2xl font-extrabold text-emerald-600">89.4%</p>
            <p className="text-xs text-gray-500 font-mono mt-0.5">AI INITIAL HIT RESOLUTIONS</p>
          </div>
          <div className="h-8 w-px bg-gray-100 hidden md:block" />
          <div>
            <p className="text-2xl font-extrabold text-gray-900">&lt; 10 min</p>
            <p className="text-xs text-gray-500 font-mono mt-0.5">LAUNCH TO CUSTOMERS WINDOW</p>
          </div>
        </div>
      </div>
    </section>
  );
}
