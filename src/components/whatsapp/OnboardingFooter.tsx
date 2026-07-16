/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import type { FC } from 'react';
import { ArrowRight } from 'lucide-react';

type OnboardingFooterProps = {
  onStart: () => void;
  onBack: () => void;
  startLabel?: string;
  backLabel?: string;
  isStarting?: boolean;
};

export const OnboardingFooter: FC<OnboardingFooterProps> = ({
  onStart,
  onBack,
  startLabel = 'Start WhatsApp API Setup',
  backLabel = 'Back',
  isStarting = false,
}) => {
  return (
    <footer className="sticky bottom-0 z-20 -mx-4 px-4 py-4 sm:py-5 bg-slate-50/95 backdrop-blur-md border-t border-slate-200 mt-8">
      <div className="max-w-4xl mx-auto flex flex-col-reverse sm:flex-row sm:items-center sm:justify-between gap-3">
        <button
          type="button"
          onClick={onBack}
          disabled={isStarting}
          className="w-full sm:w-auto px-6 py-3 rounded-xl text-sm font-bold text-gray-700 bg-white border border-slate-200 hover:bg-gray-50 transition-colors disabled:opacity-50"
        >
          {backLabel}
        </button>
        <button
          type="button"
          onClick={onStart}
          disabled={isStarting}
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-full text-sm font-black text-white bg-channel-green hover:bg-[#20bd5a] shadow-lg shadow-emerald-600/20 transition-all disabled:opacity-60"
        >
          {isStarting ? 'Starting…' : startLabel}
          {!isStarting && <ArrowRight className="w-4 h-4" />}
        </button>
      </div>
    </footer>
  );
};
