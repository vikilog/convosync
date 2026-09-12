export type OnboardingCache = {
  onboardingCompleted: boolean
  onboardingStep: number
  progressPercent: number
  onboardingSkippedSteps: number[]
  fetchedAt: number
}

const KEY = 'convosync_shadcn_onboarding'
const TTL_MS = 60_000

export function setOnboardingCache(input: Omit<OnboardingCache, 'fetchedAt'> & { fetchedAt?: number }) {
  const payload: OnboardingCache = { ...input, fetchedAt: input.fetchedAt ?? Date.now() }
  try {
    sessionStorage.setItem(KEY, JSON.stringify(payload))
  } catch {
    // private mode — guard will refetch
  }
}

export function getOnboardingCache(): OnboardingCache | null {
  try {
    const raw = sessionStorage.getItem(KEY)
    if (!raw) return null
    return JSON.parse(raw) as OnboardingCache
  } catch {
    return null
  }
}

export function isOnboardingCacheFresh(cache: OnboardingCache | null) {
  return Boolean(cache && Date.now() - cache.fetchedAt < TTL_MS)
}
