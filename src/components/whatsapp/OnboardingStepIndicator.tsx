/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import type { FC } from 'react';
import { Check } from 'lucide-react';
import type { OnboardingProgressStep } from './businessApiOnboardingData';

type OnboardingStepIndicatorProps = {
  steps: OnboardingProgressStep[];
  activeStep: number;
};

export const OnboardingStepIndicator: FC<OnboardingStepIndicatorProps> = ({
  steps,
  activeStep,
}) => {
  return (
    <nav aria-label="Setup progress" className="w-full">
      <ol className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-0">
        {steps.map((step, index) => {
          const isComplete = step.id < activeStep;
          const isActive = step.id === activeStep;
          const isLast = index === steps.length - 1;

          return (
            <li
              key={step.id}
              className={`flex sm:flex-1 items-center gap-3 sm:gap-0 ${!isLast ? 'sm:min-w-0' : ''}`}
            >
              <div className="flex items-center gap-3 sm:flex-col sm:gap-2 sm:flex-1 sm:min-w-0">
                <span
                  className={[
                    'flex shrink-0 items-center justify-center w-9 h-9 rounded-full text-sm font-black transition-colors',
                    isComplete
                      ? 'bg-primary text-white'
                      : isActive
                        ? 'bg-primary text-white ring-4 ring-primary/20'
                        : 'bg-sky-50 text-gray-400 border border-slate-200',
                  ].join(' ')}
                  aria-current={isActive ? 'step' : undefined}
                >
                  {isComplete ? <Check className="w-4 h-4" strokeWidth={3} /> : step.id}
                </span>
                <span
                  className={[
                    'text-sm font-bold leading-tight sm:text-center sm:px-1',
                    isActive ? 'text-primary' : isComplete ? 'text-gray-700' : 'text-gray-400',
                  ].join(' ')}
                >
                  {step.label}
                </span>
              </div>
              {!isLast && (
                <div
                  className={[
                    'hidden sm:block flex-1 h-0.5 mx-2 rounded-full min-w-[12px]',
                    step.id < activeStep ? 'bg-primary' : 'bg-slate-200',
                  ].join(' ')}
                  aria-hidden
                />
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
};
