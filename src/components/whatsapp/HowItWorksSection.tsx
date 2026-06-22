/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import type { FC } from 'react';
import { ArrowLeftRight, Check, Cloud, Smartphone } from 'lucide-react';
import type { CoexistenceChannelFeature } from './coexistenceOnboardingData';

type HowItWorksSectionProps = {
  title?: string;
  description?: string;
  mobileFeatures: CoexistenceChannelFeature[];
  platformFeatures: CoexistenceChannelFeature[];
};

function FeatureList({ items }: { items: CoexistenceChannelFeature[] }) {
  return (
    <ul className="mt-4 space-y-2.5">
      {items.map((item) => (
        <li key={item.id} className="flex items-start gap-2.5 text-sm font-semibold text-gray-700">
          <Check className="w-4 h-4 shrink-0 mt-0.5 text-[#25D366]" strokeWidth={2.5} />
          <span>{item.label}</span>
        </li>
      ))}
    </ul>
  );
}

export const HowItWorksSection: FC<HowItWorksSectionProps> = ({
  title = 'How It Works',
  description = 'Your WhatsApp Business App remains active on your mobile device while the same account becomes available inside the platform.',
  mobileFeatures,
  platformFeatures,
}) => {
  return (
    <section className="bg-white rounded-2xl border border-slate-200 shadow-[0_1px_3px_rgba(25,26,43,0.05),0_8px_24px_rgba(65,44,221,0.05)] p-6 sm:p-8">
      <h3 className="text-lg font-black text-gray-950 tracking-tight">{title}</h3>
      <p className="mt-2 text-sm text-gray-600 font-medium leading-relaxed max-w-2xl">
        {description}
      </p>

      <div className="mt-8 relative">
        <div
          className="hidden lg:flex absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10 items-center justify-center w-12 h-12 rounded-full bg-sky-50 border-2 border-primary/20 text-primary shadow-md"
          aria-hidden
        >
          <ArrowLeftRight className="w-5 h-5" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
          <article className="relative rounded-2xl border-2 border-[#25D366]/25 bg-gradient-to-br from-[#e6f7ec]/40 to-white p-6">
            <div className="flex items-center gap-3 mb-1">
              <span className="flex items-center justify-center w-11 h-11 rounded-xl bg-[#25D366] text-white shadow-md">
                <Smartphone className="w-6 h-6" strokeWidth={1.75} />
              </span>
              <div>
                <p className="text-sm font-black uppercase tracking-widest text-[#006d2f]">
                  Mobile App
                </p>
                <h4 className="text-base font-black text-gray-950">WhatsApp Business App</h4>
              </div>
            </div>
            <FeatureList items={mobileFeatures} />
          </article>

          <article className="relative rounded-2xl border-2 border-primary/20 bg-gradient-to-br from-sky-50/50 to-white p-6">
            <div className="flex items-center gap-3 mb-1">
              <span className="flex items-center justify-center w-11 h-11 rounded-xl bg-primary text-white shadow-md shadow-primary/20">
                <Cloud className="w-6 h-6" strokeWidth={1.75} />
              </span>
              <div>
                <p className="text-sm font-black uppercase tracking-widest text-primary">
                  Platform
                </p>
                <h4 className="text-base font-black text-gray-950">ConvoSync Dashboard</h4>
              </div>
            </div>
            <FeatureList items={platformFeatures} />
          </article>
        </div>

        <div className="lg:hidden flex justify-center my-4">
          <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-sky-50 text-primary text-sm font-black border border-primary/15">
            <ArrowLeftRight className="w-4 h-4" />
            Both work together
          </span>
        </div>

        <div className="mt-6 p-4 rounded-xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-6">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <div className="p-2 rounded-lg bg-[#25D366] text-white shrink-0">
              <Smartphone className="w-4 h-4" />
            </div>
            <span className="text-sm font-bold text-gray-600 truncate">Your phone stays primary for quick replies</span>
          </div>
          <span className="hidden sm:block text-gray-300 font-black">+</span>
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <div className="p-2 rounded-lg bg-primary text-white shrink-0">
              <Cloud className="w-4 h-4" />
            </div>
            <span className="text-sm font-bold text-gray-600 truncate">
              Your team gains inbox, AI, and reporting on the web
            </span>
          </div>
        </div>
      </div>
    </section>
  );
};
