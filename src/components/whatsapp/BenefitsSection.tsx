/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import type { FC } from 'react';
import type { BenefitItem } from './businessApiOnboardingData';

type BenefitsSectionProps = {
  title: string;
  items: BenefitItem[];
};

export const BenefitsSection: FC<BenefitsSectionProps> = ({ title, items }) => {
  return (
    <section className="bg-white rounded-2xl border border-slate-200 shadow-[0_1px_3px_rgba(25,26,43,0.05),0_8px_24px_rgba(65,44,221,0.05)] p-6 sm:p-8">
      <h3 className="text-lg font-black text-gray-950 tracking-tight">{title}</h3>

      <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {items.map((item) => {
          const Icon = item.icon;
          return (
            <article
              key={item.id}
              className="p-5 rounded-xl border border-slate-200 bg-gradient-to-br from-white to-slate-50 hover:shadow-md hover:border-primary/20 transition-all"
            >
              <div className="w-11 h-11 rounded-xl bg-sky-50 text-primary flex items-center justify-center mb-4">
                <Icon className="w-5 h-5" strokeWidth={2} />
              </div>
              <h4 className="text-sm font-black text-gray-900">{item.title}</h4>
              <p className="mt-1.5 text-xs text-gray-500 font-medium leading-relaxed">
                {item.description}
              </p>
            </article>
          );
        })}
      </div>
    </section>
  );
};
