/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import type { FC } from 'react';
import type { SetupTimelineStep } from './businessApiOnboardingData';

type SetupTimelineProps = {
  title: string;
  steps: SetupTimelineStep[];
};

export const SetupTimeline: FC<SetupTimelineProps> = ({ title, steps }) => {
  return (
    <section className="bg-white rounded-2xl border border-slate-200 shadow-[0_1px_3px_rgba(25,26,43,0.05),0_8px_24px_rgba(65,44,221,0.05)] p-6 sm:p-8">
      <h3 className="text-lg font-black text-gray-950 tracking-tight">{title}</h3>

      <ol className="mt-8 relative space-y-0">
        {steps.map((item, index) => {
          const isLast = index === steps.length - 1;
          return (
            <li key={item.step} className="relative flex gap-5 pb-10 last:pb-0">
              {!isLast && (
                <span
                  className="absolute left-[18px] top-10 bottom-0 w-0.5 bg-gradient-to-b from-primary/40 to-slate-200"
                  aria-hidden
                />
              )}
              <span className="relative z-10 flex shrink-0 items-center justify-center w-9 h-9 rounded-full bg-primary text-white text-sm font-black shadow-md shadow-primary/20">
                {item.step}
              </span>
              <div className="pt-1 min-w-0">
                <p className="text-sm font-black text-gray-900 leading-snug">{item.title}</p>
                <p className="mt-1 text-xs text-gray-500 font-medium leading-relaxed">
                  {item.description}
                </p>
              </div>
            </li>
          );
        })}
      </ol>
    </section>
  );
};
