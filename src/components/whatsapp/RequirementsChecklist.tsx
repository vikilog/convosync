/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import type { FC } from 'react';
import { Check } from 'lucide-react';
import type { RequirementItem } from './businessApiOnboardingData';

type RequirementsChecklistProps = {
  title: string;
  description: string;
  items: RequirementItem[];
};

export const RequirementsChecklist: FC<RequirementsChecklistProps> = ({
  title,
  description,
  items,
}) => {
  return (
    <section className="bg-white rounded-2xl border border-slate-200 shadow-[0_1px_3px_rgba(25,26,43,0.05),0_8px_24px_rgba(65,44,221,0.05)] p-6 sm:p-8">
      <h3 className="text-lg font-black text-gray-950 tracking-tight">{title}</h3>
      <p className="mt-2 text-sm text-gray-600 font-medium leading-relaxed">{description}</p>

      <ul className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
        {items.map((item) => {
          const Icon = item.icon;
          return (
            <li
              key={item.id}
              className="flex gap-4 p-4 rounded-xl border border-slate-200 bg-slate-50/60 hover:border-primary/25 transition-colors"
            >
              <span className="flex shrink-0 items-center justify-center w-10 h-10 rounded-xl bg-[#e6f7ec] text-[#006d2f]">
                <Check className="w-5 h-5" strokeWidth={2.5} />
              </span>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <Icon className="w-4 h-4 text-primary shrink-0" strokeWidth={2} />
                  <p className="text-sm font-black text-gray-900">{item.title}</p>
                </div>
                <p className="mt-1 text-xs text-gray-500 font-medium leading-relaxed">
                  {item.description}
                </p>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
};
