/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, ReactNode } from 'react';
import { Plug, Users, Brain, Activity, LineChart, ChevronRight } from 'lucide-react';

interface Step {
  id: number;
  num: string;
  title: string;
  emoji: string;
  desc: string;
  technicalTip: string;
  icon: ReactNode;
  color: string;
}

export default function HowItWorks() {
  const [hoveredStep, setHoveredStep] = useState<number | null>(null);

  const steps: Step[] = [
    {
      id: 1,
      num: '01',
      title: 'Connect Channels',
      emoji: '🔌',
      desc: 'One-click connect WhatsApp, Instagram, Messenger, Telegram, and Corporate Email via official secure channels.',
      technicalTip: 'Official Cloud API integrations setup completes in under 2 minutes.',
      color: 'bg-brand-indigo/10 border-brand-indigo/30 text-brand-indigo',
      icon: <Plug className="w-5 h-5 text-brand-indigo" />
    },
    {
      id: 2,
      num: '02',
      title: 'Import Contacts',
      emoji: '👥',
      desc: 'Upload standard CSV lists or map active Shopify/CRM segments. All historical details load instantly.',
      technicalTip: 'Direct synchronization supported for Zoho, HubSpot, and Salesforce.',
      color: 'bg-indigo-100 border-indigo-200 text-brand-indigo',
      icon: <Users className="w-5 h-5 text-brand-indigo" />
    },
    {
      id: 3,
      num: '03',
      title: 'Train AI Agent',
      emoji: '🤖',
      desc: 'Instruct your custom AI representatve Sara or Max by uploading FAQs, company URLs, or internal PDF charts.',
      technicalTip: 'Secured sandboxed vector index creates fully localized embeddings.',
      color: 'bg-emerald-50 border-emerald-100 text-emerald-600',
      icon: <Brain className="w-5 h-5 text-emerald-600" />
    },
    {
      id: 4,
      num: '04',
      title: 'Build Journeys',
      emoji: '🔄',
      desc: 'Configure flexible automation workflows: welcome drips, abandoned checkout triggers, and promo distributions.',
      technicalTip: 'Drag & drop canvas includes fallback checks for optimal delivery.',
      color: 'bg-amber-50 border-amber-100 text-amber-600',
      icon: <Activity className="w-5 h-5 text-amber-600" />
    },
    {
      id: 5,
      num: '05',
      title: 'Watch It Grow',
      emoji: '📈',
      desc: 'Relax while your automated AI clerks resolve repetitive inquiries and your sales dashboards fill with premium conversion rates.',
      technicalTip: 'High-satisfaction reports and per-agent metrics exportable to CSV anytime.',
      color: 'bg-cyan-50 border-cyan-100 text-cyan-600',
      icon: <LineChart className="w-5 h-5 text-cyan-600" />
    }
  ];

  return (
    <section id="how-it-works" className="bg-[#FAF9FF] border-b border-gray-100 py-24 text-gray-900 overflow-hidden relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Title */}
        <div className="text-center max-w-2xl mx-auto mb-20">
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

        {/* 5 steps Horizontal Timeline container with dotted connectors */}
        <div className="relative">
          
          {/* Connecting line (Desktop only) */}
          <div className="absolute top-1/2 left-4 right-4 h-0.5 border-t-2 border-dashed border-gray-200 -translate-y-12 hidden lg:block -z-10" />

          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-8 relative z-10">
            {steps.map((st) => {
              const runsHover = hoveredStep === st.id;
              return (
                <div
                  key={st.id}
                  onMouseEnter={() => setHoveredStep(st.id)}
                  onMouseLeave={() => setHoveredStep(null)}
                  className="bg-white border border-gray-100 rounded-2xl p-6 shadow-xs hover:shadow-md transition-all duration-300 transform hover:-translate-y-1 relative"
                >
                  {/* Floating badge count */}
                  <span className="absolute -top-3 left-6 font-mono text-[11px] font-bold bg-[#E6E2FF] text-brand-indigo px-2.5 py-1 rounded-full border border-white">
                    Step {st.num}
                  </span>

                  <div className="flex items-center justify-between mb-5 mt-2">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center border ${st.color}`}>
                      {st.icon}
                    </div>
                    <span className="text-xl shrink-0">{st.emoji}</span>
                  </div>

                  <h3 className="text-base font-bold text-gray-900 font-display">{st.title}</h3>
                  <p className="text-[12.5px] text-gray-500 leading-relaxed font-sans mt-2.5">{st.desc}</p>

                  {/* Technical details toggle on hover */}
                  <div className={`mt-4 pt-3 border-t border-gray-50 transition-all duration-300 ${runsHover ? 'opacity-100 max-h-16' : 'opacity-40 max-h-12'}`}>
                    <p className="text-[10px] text-gray-400 font-mono leading-relaxed">
                      💡 {st.technicalTip}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

        </div>

        {/* Bottom checklist stats */}
        <div className="mt-16 bg-white border border-gray-100 rounded-2xl p-6 flex flex-col md:flex-row justify-around items-center text-center gap-6 shadow-xs max-w-4xl mx-auto">
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
