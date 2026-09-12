import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { httpClient } from '@/lib/httpClient'

/**
 * Builds typed React Query hooks around a single GET + PATCH REST resource
 * (e.g. "my profile", "company settings"). Same seam as other real services:
 * swapping the backend later means touching this call site, not every panel.
 */
export function createSingletonResource<T, TPatch = Partial<T>>(resourceKey: string, path: string) {
  const queryKey = [resourceKey] as const

  function useGet() {
    return useQuery({ queryKey, queryFn: () => httpClient.get<T>(path) })
  }

  function useUpdate() {
    const queryClient = useQueryClient()
    return useMutation({
      mutationFn: (patch: TPatch) => httpClient.patch<Partial<T>>(path, patch),
      // Backends here return only the changed record, not the full GET shape
      // (e.g. company PATCH omits whatsappAccounts/trial) — merge, don't replace.
      onSuccess: (data) => {
        queryClient.setQueryData<T>(queryKey, (old) => (old ? { ...old, ...data } : (data as T)))
      },
    })
  }

  return { queryKey, useGet, useUpdate }
}
