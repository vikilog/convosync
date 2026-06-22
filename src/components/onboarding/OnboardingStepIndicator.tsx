import { Check } from 'lucide-react';
import { ONBOARDING_STEP_LABELS } from '../../lib/onboarding';

type Props = {
  currentStep: number;
};

export function OnboardingStepIndicator({ currentStep }: Props) {
  const steps = ONBOARDING_STEP_LABELS.map((label, index) => ({
    id: index + 1,
    label,
  }));

  return (
    <nav aria-label="Onboarding progress" className="w-full">
      <div className="mb-3 flex items-center justify-between text-xs text-gray-500">
        <span className="font-semibold">Step {currentStep} of {steps.length}</span>
        <span>{Math.round((currentStep / steps.length) * 100)}% complete</span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-[#ece9ff]">
        <div
          className="h-full rounded-full bg-primary transition-all duration-300"
          style={{ width: `${(currentStep / steps.length) * 100}%` }}
        />
      </div>
      <ol className="mt-4 hidden gap-2 md:grid md:grid-cols-7">
        {steps.map((step) => {
          const isComplete = step.id < currentStep;
          const isActive = step.id === currentStep;
          return (
            <li key={step.id} className="flex flex-col items-center gap-1.5 text-center">
              <span
                className={[
                  'flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold transition-colors',
                  isComplete
                    ? 'bg-primary text-white'
                    : isActive
                      ? 'bg-primary text-white ring-4 ring-primary/15'
                      : 'border border-slate-200 bg-white text-gray-400',
                ].join(' ')}
              >
                {isComplete ? <Check className="h-4 w-4" strokeWidth={3} /> : step.id}
              </span>
              <span
                className={[
                  'text-sm font-semibold leading-tight',
                  isActive ? 'text-primary' : isComplete ? 'text-gray-700' : 'text-gray-400',
                ].join(' ')}
              >
                {step.label}
              </span>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
