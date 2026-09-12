import { ArrowRight } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

import { Button } from '@/components/ui/button'
import { pathForSettingsSection } from '@/lib/planChannels'
import { profileResource } from '@/services/profile.service'

export function OnboardingProfileBanner() {
  const navigate = useNavigate()
  const { data } = profileResource.useOnboarding()
  if (!data) return null

  const show = !data.onboardingCompleted || data.onboardingSkippedSteps.includes(5)
  if (!show) return null

  const progress = data.onboardingCompleted ? 100 : data.progressPercent

  return (
    <div className="bg-muted/40 overflow-hidden rounded-xl border p-4 md:p-5">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="min-w-0">
          <p className="text-sm font-semibold">Complete your profile</p>
          <p className="text-muted-foreground mt-0.5 text-xs">
            Finish setup to unlock the best experience — {progress}% complete.
          </p>
          <div className="bg-muted mt-2 h-1.5 w-full max-w-xs overflow-hidden rounded-full">
            <div className="bg-primary h-full rounded-full" style={{ width: `${progress}%` }} />
          </div>
        </div>
        <Button
          size="sm"
          onClick={() =>
            navigate(data.onboardingCompleted ? pathForSettingsSection('profile') : '/onboarding')
          }
        >
          Continue setup
          <ArrowRight />
        </Button>
      </div>
    </div>
  )
}
