import { type ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router-dom'

import { PageSkeleton } from '@/components/PageSkeleton'
import { getOnboardingCache, isOnboardingCacheFresh } from '@/lib/onboardingCache'
import { profileResource } from '@/services/profile.service'

export function OnboardingGuard({ children }: { children: ReactNode }) {
  const location = useLocation()
  const cached = getOnboardingCache()
  const { data, isPending, isError } = profileResource.useOnboarding()
  const completed =
    data?.onboardingCompleted ??
    (isOnboardingCacheFresh(cached) ? cached!.onboardingCompleted : undefined)

  if (completed === undefined && !isError && isPending) return <PageSkeleton />
  if (!isError && completed === false) {
    return <Navigate to="/onboarding" replace state={{ from: location.pathname }} />
  }
  return <>{children}</>
}
