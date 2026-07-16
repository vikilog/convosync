/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import type { FC } from 'react';
import { ArrowUpRight, CalendarCheck, MessageCircle, Sparkles } from 'lucide-react';
import { CONNECTION_SIDEBAR_BENEFITS } from './connectionComparisonData';

type ConnectionBenefitsSidebarProps = {
  onTalkToExpert?: () => void;
  onLearnMore?: () => void;
};

export const ConnectionBenefitsSidebar: FC<ConnectionBenefitsSidebarProps> = ({
  onTalkToExpert,
  onLearnMore,
}) => {
  return (
    <aside className="lg:sticky lg:top-20 h-fit">
      <div className="rounded-2xl border border-slate-200 bg-white shadow-[0_1px_3px_rgba(25,26,43,0.05),0_12px_32px_rgba(65,44,221,0.06)] overflow-hidden">
        <div className="p-5 border-b border-slate-200 bg-gradient-to-br from-slate-50 to-white">
          <div className="flex items-center gap-2 mb-1">
            <span className="p-2 rounded-xl bg-sky-50 text-primary">
              <MessageCircle className="w-4 h-4" strokeWidth={2} />
            </span>
            <h3 className="text-sm font-black text-gray-950">Why Connect WhatsApp?</h3>
          </div>
        </div>

        <ul className="p-5 space-y-3">
          {CONNECTION_SIDEBAR_BENEFITS.map((item) => (
            <li key={item} className="flex items-start gap-2.5">
              <Sparkles className="w-3.5 h-3.5 shrink-0 mt-0.5 text-primary" strokeWidth={2.5} />
              <span className="text-sm font-semibold text-gray-700 leading-snug">{item}</span>
            </li>
          ))}
        </ul>

        <div className="h-px bg-slate-200 mx-5" />

        <div className="p-5 space-y-3">
          <h4 className="text-sm font-black text-gray-950">Need Help Choosing?</h4>
          <button
            type="button"
            onClick={onTalkToExpert}
            className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-black text-white bg-channel-green hover:bg-[#20bd5a] shadow-md shadow-primary/20 transition-all"
          >
            <CalendarCheck className="w-4 h-4" />
            Talk to an Expert
          </button>
          <button
            type="button"
            onClick={onLearnMore}
            className="w-full inline-flex items-center justify-center gap-1.5 text-sm font-bold text-primary hover:text-primary-hover transition-colors"
          >
            Learn More
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </aside>
  );
};
