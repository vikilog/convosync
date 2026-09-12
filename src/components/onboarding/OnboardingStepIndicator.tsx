import { Check } from 'lucide-react'

import { Progress } from '@/components/ui/progress'
import { ONBOARDING_STEP_LABELS } from '@/lib/onboarding'

export function OnboardingStepIndicator({ currentStep }: { currentStep: number }) {
  const total = ONBOARDING_STEP_LABELS.length
  const pct = Math.round((currentStep / total) * 100)

  return (
    <nav aria-label="Onboarding progress" className="w-full">
      <div className="text-muted-foreground mb-3 flex items-center justify-between text-xs">
        <span className="font-semibold">
          Step {currentStep} of {total}
        </span>
        <span className="font-medium tabular-nums">{pct}% complete</span>
      </div>
      <Progress value={pct} className="h-2" />
      <ol className="mt-5 hidden gap-1.5 md:grid md:grid-cols-7">
        {ONBOARDING_STEP_LABELS.map((label, index) => {
          const id = index + 1
          const isComplete = id < currentStep
          const isActive = id === currentStep
          return (
            <li key={id} className="flex flex-col items-center gap-1.5 text-center">
              <span
                className={`flex size-8 items-center justify-center rounded-full text-sm font-bold ${
                  isComplete || isActive
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground border'
                } ${isActive ? 'ring-primary/20 ring-4' : ''}`}
              >
                {isComplete ? <Check className="size-4" strokeWidth={3} aria-hidden /> : id}
              </span>
              <span
                className={`text-[11px] leading-tight font-semibold ${
                  isActive ? 'text-primary' : isComplete ? 'text-foreground' : 'text-muted-foreground'
                }`}
              >
                {label}
              </span>
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
