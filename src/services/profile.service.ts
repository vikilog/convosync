import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { httpClient } from '@/lib/httpClient'
import { detectBrowserTimezone } from '@/lib/locale/detectBrowserTimezone'
import type { OnboardingState } from '@/lib/onboarding'
import { setOnboardingCache } from '@/lib/onboardingCache'

export type MeResponse = {
  id: string
  name: string
  email: string
  avatar: string | null
  role: string
  workspaceId: string
  createdAt: string
  phone: string | null
  emailVerified: boolean
  phoneVerified: boolean
  permissions: unknown
  inboxScope: unknown
  workspaces: { id: string; name: string; [key: string]: unknown }[]
  activeWorkspaceId: string
  activeWorkspace: { id: string; name: string; [key: string]: unknown }
  onboardingCompleted?: boolean
  [key: string]: unknown
}

/** `/auth/profile` and `/auth/avatar` both reply `{ user: {...narrower fields} }`,
 * not the full `/auth/me` shape — so updates merge into the cached "me" record
 * rather than replacing it outright. */
type ProfileUpdateResponse = { user: Partial<MeResponse> }

const meQueryKey = ['me'] as const
const onboardingQueryKey = ['onboarding'] as const

function cacheOnboarding(state: OnboardingState) {
  setOnboardingCache({
    onboardingCompleted: state.onboardingCompleted,
    onboardingStep: state.onboardingStep,
    progressPercent: state.progressPercent,
    onboardingSkippedSteps: state.onboardingSkippedSteps,
  })
}

export type { OnboardingState }

export type LocaleSuggestion = {
  country: string | null
  timezone: string | null
  countryHint: string | null
  timezoneHint: string | null
}

export const profileResource = {
  queryKey: meQueryKey,

  getOnboarding: () => httpClient.get<OnboardingState>('/onboarding'),

  saveOnboardingStep: (step: number, data: Record<string, unknown>, skip = false) =>
    httpClient.patch<OnboardingState>('/onboarding/step', { step, data, skip }),

  completeOnboarding: () => httpClient.post<OnboardingState>('/onboarding/complete', {}),

  detectLocale: (browserTimezone?: string) =>
    httpClient.get<LocaleSuggestion>(
      `/workspace/locale/detect${browserTimezone ? `?browserTimezone=${encodeURIComponent(browserTimezone)}` : ''}`,
    ),

  useGet: () => useQuery({ queryKey: meQueryKey, queryFn: () => httpClient.get<MeResponse>('/auth/me') }),

  useOnboarding: () =>
    useQuery({
      queryKey: onboardingQueryKey,
      queryFn: async () => {
        const state = await httpClient.get<OnboardingState>('/onboarding')
        cacheOnboarding(state)
        return state
      },
      staleTime: 60_000,
      refetchOnWindowFocus: false,
    }),

  useDetectLocale: (enabled: boolean) =>
    useQuery({
      queryKey: ['workspace-locale-detect'],
      queryFn: () => {
        const tz = detectBrowserTimezone()
        return httpClient.get<LocaleSuggestion>(
          `/workspace/locale/detect${tz ? `?browserTimezone=${encodeURIComponent(tz)}` : ''}`,
        )
      },
      enabled,
      staleTime: Infinity,
    }),

  useSaveOnboardingStep: () => {
    const queryClient = useQueryClient()
    return useMutation({
      mutationFn: ({
        step,
        data,
        skip = false,
      }: {
        step: number
        data: Record<string, unknown>
        skip?: boolean
      }) => httpClient.patch<OnboardingState>('/onboarding/step', { step, data, skip }),
      onSuccess: (state) => {
        cacheOnboarding(state)
        queryClient.setQueryData(onboardingQueryKey, state)
      },
    })
  },

  useCompleteOnboarding: () => {
    const queryClient = useQueryClient()
    return useMutation({
      mutationFn: () => httpClient.post<OnboardingState>('/onboarding/complete', {}),
      onSuccess: (state) => {
        cacheOnboarding(state)
        queryClient.setQueryData(onboardingQueryKey, state)
      },
    })
  },

  useUpdateProfile: () => {
    const queryClient = useQueryClient()
    return useMutation({
      mutationFn: (patch: { name?: string; phone?: string | null }) =>
        httpClient.patch<ProfileUpdateResponse>('/auth/profile', patch),
      onSuccess: ({ user }) => {
        queryClient.setQueryData<MeResponse>(meQueryKey, (old) =>
          old ? { ...old, ...user } : (user as MeResponse)
        )
      },
    })
  },

  useChangePassword: () =>
    useMutation({
      mutationFn: (input: { currentPassword: string; newPassword: string }) =>
        httpClient.post<{ success: boolean }>('/auth/change-password', input),
    }),

  useUpdateLocale: () => {
    const queryClient = useQueryClient()
    return useMutation({
      mutationFn: (input: { country: string; timezone: string }) =>
        httpClient.patch<{ id: string; country: string | null; timezone: string | null }>(
          '/workspace/locale',
          input
        ),
      onSuccess: () => {
        void queryClient.invalidateQueries({ queryKey: ['companySettings'] })
      },
    })
  },

  useUpdateAvatar: () => {
    const queryClient = useQueryClient()
    return useMutation({
      mutationFn: (avatar: string | null) =>
        httpClient.patch<ProfileUpdateResponse>('/auth/avatar', { avatar }),
      onSuccess: ({ user }) => {
        queryClient.setQueryData<MeResponse>(meQueryKey, (old) =>
          old ? { ...old, ...user } : (user as MeResponse)
        )
      },
    })
  },
}
