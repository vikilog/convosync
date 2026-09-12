import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { httpClient } from '@/lib/httpClient'
import type {
  EmailDomain,
  EmailIntegrationStatus,
  EmailLog,
  EmailProviderConfig,
  EmailProviderStatus,
  NewEmailProviderInput,
} from '@/services/realIntegrations.types'

export const emailIntegrationHooks = {
  useEmailIntegration: () =>
    useQuery({
      queryKey: ['realIntegrations', 'email'],
      queryFn: () => httpClient.get<EmailIntegrationStatus>('/email/integration'),
    }),

  useEnableEmail: () => {
    const queryClient = useQueryClient()
    return useMutation({
      mutationFn: () => httpClient.post<EmailIntegrationStatus>('/email/integration/enable'),
      onSuccess: () => {
        void queryClient.invalidateQueries({ queryKey: ['realIntegrations', 'email'] })
      },
    })
  },

  useDisableEmail: () => {
    const queryClient = useQueryClient()
    return useMutation({
      mutationFn: () => httpClient.del<EmailIntegrationStatus>('/email/integration'),
      onSuccess: () => {
        void queryClient.invalidateQueries({ queryKey: ['realIntegrations', 'email'] })
      },
    })
  },

  useEmailDomains: () =>
    useQuery({
      queryKey: ['realIntegrations', 'email', 'domains'],
      queryFn: () => httpClient.get<EmailDomain[]>('/email/domains'),
    }),

  useAddEmailDomain: () => {
    const queryClient = useQueryClient()
    return useMutation({
      mutationFn: (domain: string) => httpClient.post<EmailDomain>('/email/domains', { domain }),
      onSuccess: () => {
        void queryClient.invalidateQueries({ queryKey: ['realIntegrations', 'email', 'domains'] })
        void queryClient.invalidateQueries({ queryKey: ['realIntegrations', 'email'] })
      },
    })
  },

  useVerifyEmailDomain: () => {
    const queryClient = useQueryClient()
    return useMutation({
      mutationFn: (domainId: string) => httpClient.post<EmailDomain>('/email/domains/verify', { domainId }),
      onSuccess: () => {
        void queryClient.invalidateQueries({ queryKey: ['realIntegrations', 'email', 'domains'] })
        void queryClient.invalidateQueries({ queryKey: ['realIntegrations', 'email'] })
      },
    })
  },

  useRefreshEmailDomain: () => {
    const queryClient = useQueryClient()
    return useMutation({
      mutationFn: (domainId: string) => httpClient.post<EmailDomain>(`/email/domains/${domainId}/refresh`),
      onSuccess: () => {
        void queryClient.invalidateQueries({ queryKey: ['realIntegrations', 'email', 'domains'] })
      },
    })
  },

  useEmailProviders: () =>
    useQuery({
      queryKey: ['realIntegrations', 'email', 'providers'],
      queryFn: () => httpClient.get<EmailProviderConfig[]>('/email/providers'),
    }),

  useCreateEmailProvider: () => {
    const queryClient = useQueryClient()
    return useMutation({
      mutationFn: (input: NewEmailProviderInput) =>
        httpClient.post<EmailProviderConfig>('/email/providers', input),
      onSuccess: () => {
        void queryClient.invalidateQueries({ queryKey: ['realIntegrations', 'email', 'providers'] })
        void queryClient.invalidateQueries({ queryKey: ['realIntegrations', 'email'] })
      },
    })
  },

  useUpdateEmailProvider: () => {
    const queryClient = useQueryClient()
    return useMutation({
      mutationFn: ({ id, status }: { id: string; status: EmailProviderStatus }) =>
        httpClient.patch<EmailProviderConfig>(`/email/providers/${id}`, { status }),
      onSuccess: () => {
        void queryClient.invalidateQueries({ queryKey: ['realIntegrations', 'email', 'providers'] })
        void queryClient.invalidateQueries({ queryKey: ['realIntegrations', 'email'] })
      },
    })
  },

  useSetDefaultEmailProvider: () => {
    const queryClient = useQueryClient()
    return useMutation({
      mutationFn: (id: string) => httpClient.post<EmailProviderConfig>(`/email/providers/${id}/default`),
      onSuccess: () => {
        void queryClient.invalidateQueries({ queryKey: ['realIntegrations', 'email', 'providers'] })
        void queryClient.invalidateQueries({ queryKey: ['realIntegrations', 'email'] })
      },
    })
  },

  useTestEmailProvider: () =>
    useMutation({
      mutationFn: (id: string) =>
        httpClient.post<{ ok: boolean; message?: string; error?: string }>(`/email/providers/${id}/test`),
    }),

  useEmailLogs: (limit = 50) =>
    useQuery({
      queryKey: ['realIntegrations', 'email', 'logs', limit],
      queryFn: () => httpClient.get<EmailLog[]>(`/email/logs?limit=${limit}`),
    }),

  useSendTestEmail: () =>
    useMutation({
      mutationFn: (to: string) =>
        httpClient.post('/email/send', {
          to,
          subject: 'Test email from ConvoSync',
          text: 'This is a test email sent from your ConvoSync email integration.',
        }),
    }),
}
