import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { httpClient } from '@/lib/httpClient'
import { emailIntegrationHooks } from '@/services/realIntegrations.email'
import type {
  AiProviderConfig,
  AiProviderUpdateInput,
  FacebookPageStatus,
  GoogleConnection,
  GoogleProductKey,
  GoogleProductSummary,
  InstagramAccount,
  MessengerAccount,
  MetaAdAccountOption,
  MetaAdsStatus,
  TelegramAccount,
  WhatsAppBusinessProfileBundle,
  WhatsAppBusinessProfileUpdate,
  WhatsAppConnectInput,
  WhatsAppConnectResult,
  WhatsAppFlowStatus,
  WhatsAppFullAccount,
  WhatsAppPaymentStatus,
  WhatsAppStatus,
} from '@/services/realIntegrations.types'

export * from '@/services/realIntegrations.types'

export const realIntegrationsService = {
  ...emailIntegrationHooks,

  useWhatsAppStatus: () =>
    useQuery({
      queryKey: ['realIntegrations', 'whatsapp'],
      queryFn: () => httpClient.get<WhatsAppStatus>('/whatsapp/status'),
    }),

  useInstagramAccounts: () =>
    useQuery({
      queryKey: ['realIntegrations', 'instagram'],
      queryFn: () => httpClient.get<{ accounts: InstagramAccount[] }>('/instagram/accounts'),
    }),

  useMessengerAccounts: () =>
    useQuery({
      queryKey: ['realIntegrations', 'messenger'],
      queryFn: () => httpClient.get<{ accounts: MessengerAccount[] }>('/messenger/accounts'),
    }),

  useFacebookPage: () =>
    useQuery({
      queryKey: ['realIntegrations', 'facebook'],
      queryFn: () => httpClient.get<FacebookPageStatus>('/facebook/pages'),
    }),

  useTelegramAccounts: () =>
    useQuery({
      queryKey: ['realIntegrations', 'telegram'],
      queryFn: () => httpClient.get<{ accounts: TelegramAccount[] }>('/telegram/accounts'),
    }),

  useMetaAdsStatus: () =>
    useQuery({
      queryKey: ['realIntegrations', 'meta_ads'],
      queryFn: () => httpClient.get<MetaAdsStatus>('/meta-ads/account'),
    }),

  useGoogleConnections: () =>
    useQuery({
      queryKey: ['realIntegrations', 'google'],
      queryFn: () => httpClient.get<{ connections: GoogleConnection[] }>('/google/connections'),
    }),

  useAiProviderConfig: () =>
    useQuery({
      queryKey: ['realIntegrations', 'ai_provider'],
      queryFn: () =>
        httpClient.get<{ config: AiProviderConfig }>('/workspace/ai-provider').then((r) => r.config),
    }),

  useWhatsAppFlowStatus: () =>
    useQuery({
      queryKey: ['realIntegrations', 'whatsapp_flow'],
      queryFn: () => httpClient.get<WhatsAppFlowStatus>('/integrations/whatsapp-flow'),
    }),

  useConnectTelegram: () => {
    const queryClient = useQueryClient()
    return useMutation({
      mutationFn: (botToken: string) =>
        httpClient.post<{ success: boolean; botUsername?: string }>('/telegram/connect', { botToken }),
      onSuccess: () => {
        void queryClient.invalidateQueries({ queryKey: ['realIntegrations', 'telegram'] })
      },
    })
  },

  useDisconnectTelegram: () => {
    const queryClient = useQueryClient()
    return useMutation({
      mutationFn: (botId?: string) =>
        httpClient.del<{ success: boolean }>(
          `/telegram/disconnect${botId ? `?botId=${encodeURIComponent(botId)}` : ''}`
        ),
      onSuccess: () => {
        void queryClient.invalidateQueries({ queryKey: ['realIntegrations', 'telegram'] })
      },
    })
  },

  useUpdateAiProvider: () => {
    const queryClient = useQueryClient()
    return useMutation({
      mutationFn: (input: AiProviderUpdateInput) =>
        httpClient.put<{ config: AiProviderConfig }>('/workspace/ai-provider', input).then((r) => r.config),
      onSuccess: () => {
        void queryClient.invalidateQueries({ queryKey: ['realIntegrations', 'ai_provider'] })
      },
    })
  },

  useTestAiProvider: () =>
    useMutation({
      mutationFn: (draft?: AiProviderUpdateInput) =>
        httpClient.post<{ ok: boolean; error?: string }>('/workspace/ai-provider/test', draft ?? {}),
    }),

  useRequestWhatsAppFlow: () => {
    const queryClient = useQueryClient()
    return useMutation({
      mutationFn: () => httpClient.post<WhatsAppFlowStatus>('/integrations/whatsapp-flow/request-access'),
      onSuccess: () => {
        void queryClient.invalidateQueries({ queryKey: ['realIntegrations', 'whatsapp_flow'] })
      },
    })
  },

  useDisconnectInstagram: () => {
    const queryClient = useQueryClient()
    return useMutation({
      mutationFn: (instagramUserId?: string) =>
        httpClient.del<{ success: boolean }>(
          `/instagram/disconnect${instagramUserId ? `?instagramUserId=${encodeURIComponent(instagramUserId)}` : ''}`
        ),
      onSuccess: () => {
        void queryClient.invalidateQueries({ queryKey: ['realIntegrations', 'instagram'] })
      },
    })
  },

  useSyncInstagram: () =>
    useMutation({
      mutationFn: (opts?: { loadMore?: boolean }) =>
        httpClient.post<{ success: boolean; status: string; message?: string }>('/instagram/sync', opts ?? {}),
    }),

  useConnectMessenger: () => {
    const queryClient = useQueryClient()
    return useMutation({
      mutationFn: () => httpClient.post<{ success: boolean }>('/messenger/connect'),
      onSuccess: () => {
        void queryClient.invalidateQueries({ queryKey: ['realIntegrations', 'messenger'] })
      },
    })
  },

  useDisconnectMessenger: () => {
    const queryClient = useQueryClient()
    return useMutation({
      mutationFn: (pageId?: string) =>
        httpClient.del<{ success: boolean }>(
          `/messenger/disconnect${pageId ? `?pageId=${encodeURIComponent(pageId)}` : ''}`
        ),
      onSuccess: () => {
        void queryClient.invalidateQueries({ queryKey: ['realIntegrations', 'messenger'] })
      },
    })
  },

  useSyncMessenger: () =>
    useMutation({
      mutationFn: () =>
        httpClient.post<{ success: boolean; status: string; message?: string }>('/messenger/sync'),
    }),

  useDisconnectFacebook: () => {
    const queryClient = useQueryClient()
    return useMutation({
      mutationFn: () => httpClient.del<{ success: boolean }>('/facebook/disconnect'),
      onSuccess: () => {
        void queryClient.invalidateQueries({ queryKey: ['realIntegrations', 'facebook'] })
      },
    })
  },

  useDisconnectMetaAds: () => {
    const queryClient = useQueryClient()
    return useMutation({
      mutationFn: () => httpClient.del<{ success: boolean }>('/meta-ads/disconnect'),
      onSuccess: () => {
        void queryClient.invalidateQueries({ queryKey: ['realIntegrations', 'meta_ads'] })
      },
    })
  },

  useDisconnectGoogleConnection: () => {
    const queryClient = useQueryClient()
    return useMutation({
      mutationFn: (id: string) => httpClient.del<{ success: boolean }>(`/google/connections/${id}`),
      onSuccess: () => {
        void queryClient.invalidateQueries({ queryKey: ['realIntegrations', 'google'] })
      },
    })
  },

  useWhatsAppBusinessProfile: (phoneNumberId: string | null) =>
    useQuery({
      queryKey: ['realIntegrations', 'whatsapp', 'profile', phoneNumberId ?? ''],
      queryFn: () =>
        httpClient.get<WhatsAppBusinessProfileBundle>(`/whatsapp/accounts/${phoneNumberId}/business-profile`),
      enabled: Boolean(phoneNumberId),
    }),

  useUpdateWhatsAppBusinessProfile: (phoneNumberId: string | null) => {
    const queryClient = useQueryClient()
    return useMutation({
      mutationFn: (input: WhatsAppBusinessProfileUpdate) =>
        httpClient.post<WhatsAppBusinessProfileBundle>(
          `/whatsapp/accounts/${phoneNumberId}/business-profile`,
          input
        ),
      onSuccess: () => {
        void queryClient.invalidateQueries({
          queryKey: ['realIntegrations', 'whatsapp', 'profile', phoneNumberId ?? ''],
        })
        void queryClient.invalidateQueries({ queryKey: ['realIntegrations', 'whatsapp'] })
      },
    })
  },

  useWhatsAppAccounts: () =>
    useQuery({
      queryKey: ['realIntegrations', 'whatsapp', 'accounts'],
      queryFn: () => httpClient.get<{ accounts: WhatsAppFullAccount[] }>('/whatsapp/accounts'),
    }),

  useDisconnectWhatsAppAccount: () => {
    const queryClient = useQueryClient()
    return useMutation({
      mutationFn: (phoneNumberId?: string) =>
        httpClient.del<{ success: boolean }>(
          phoneNumberId
            ? `/whatsapp/disconnect?phoneNumberId=${encodeURIComponent(phoneNumberId)}`
            : '/whatsapp/disconnect'
        ),
      onSuccess: () => {
        void queryClient.invalidateQueries({ queryKey: ['realIntegrations', 'whatsapp'] })
      },
    })
  },

  useConnectWhatsApp: () => {
    const queryClient = useQueryClient()
    return useMutation({
      mutationFn: (input: WhatsAppConnectInput) =>
        httpClient.post<WhatsAppConnectResult>('/whatsapp/connect', input),
      onSuccess: () => {
        void queryClient.invalidateQueries({ queryKey: ['realIntegrations', 'whatsapp'] })
      },
    })
  },

  useWhatsAppOAuthState: () =>
    useMutation({
      mutationFn: () =>
        httpClient.get<{
          state: string
          redirectUri: string
          oauthRedirectUri: string
          backendCallbackUri: string
          whatsappConfigId?: string
        }>('/whatsapp/oauth/state'),
    }),

  useGoogleProducts: () =>
    useQuery({
      queryKey: ['realIntegrations', 'google', 'products'],
      queryFn: () => httpClient.get<{ products: GoogleProductSummary[] }>('/google/products'),
    }),

  useConnectGoogleProduct: () => {
    const queryClient = useQueryClient()
    return useMutation({
      mutationFn: ({ product, connectionId }: { product: GoogleProductKey; connectionId: string }) =>
        httpClient.post(`/google/products/${encodeURIComponent(product)}/connect`, { connectionId }),
      onSuccess: () => {
        void queryClient.invalidateQueries({ queryKey: ['realIntegrations', 'google'] })
      },
    })
  },

  useDisconnectGoogleProduct: () => {
    const queryClient = useQueryClient()
    return useMutation({
      mutationFn: ({ product, connectionId }: { product: GoogleProductKey; connectionId: string }) =>
        httpClient.post(`/google/products/${encodeURIComponent(product)}/disconnect`, { connectionId }),
      onSuccess: () => {
        void queryClient.invalidateQueries({ queryKey: ['realIntegrations', 'google'] })
      },
    })
  },

  useSyncGoogleProduct: () => {
    const queryClient = useQueryClient()
    return useMutation({
      mutationFn: ({ product, connectionId }: { product: GoogleProductKey; connectionId: string }) =>
        product === 'business_profile'
          ? httpClient.post('/google/business-profile/sync', {
              connectionId,
              syncType: 'accounts',
              force: true,
            })
          : httpClient.post(`/google/products/${encodeURIComponent(product)}/sync`, { connectionId }),
      onSuccess: () => {
        void queryClient.invalidateQueries({ queryKey: ['realIntegrations', 'google'] })
      },
    })
  },

  useMetaAdAccounts: (enabled = true) =>
    useQuery({
      queryKey: ['realIntegrations', 'meta_ads', 'accounts'],
      queryFn: () => httpClient.get<{ accounts: MetaAdAccountOption[] }>('/meta-ads/accounts'),
      enabled,
    }),

  useSelectMetaAdAccount: () => {
    const queryClient = useQueryClient()
    return useMutation({
      mutationFn: (adAccountId: string) =>
        httpClient.post<{ success: boolean }>('/meta-ads/account/select', { adAccountId }),
      onSuccess: () => {
        void queryClient.invalidateQueries({ queryKey: ['realIntegrations', 'meta_ads'] })
      },
    })
  },

  useWhatsAppPaymentMode: (phoneNumberId: string | null) =>
    useQuery({
      queryKey: ['realIntegrations', 'whatsapp', 'payment-mode', phoneNumberId ?? ''],
      queryFn: () =>
        httpClient.get<WhatsAppPaymentStatus>(
          `/whatsapp/payment-mode?phoneNumberId=${encodeURIComponent(phoneNumberId ?? '')}`
        ),
      enabled: Boolean(phoneNumberId),
    }),

  useSetWhatsAppPaymentMode: (phoneNumberId: string) => {
    const queryClient = useQueryClient()
    return useMutation({
      mutationFn: (paymentMode: 'self_pay' | 'platform') =>
        httpClient.post<{ success: boolean } & WhatsAppPaymentStatus>('/whatsapp/payment-mode', {
          paymentMode,
          phoneNumberId,
        }),
      onSuccess: () => {
        void queryClient.invalidateQueries({
          queryKey: ['realIntegrations', 'whatsapp', 'payment-mode', phoneNumberId],
        })
      },
    })
  },

  useRefreshWhatsAppPaymentMode: (phoneNumberId: string) => {
    const queryClient = useQueryClient()
    return useMutation({
      mutationFn: () =>
        httpClient.post<{ success: boolean } & WhatsAppPaymentStatus>('/whatsapp/payment-mode/refresh', {
          phoneNumberId,
        }),
      onSuccess: () => {
        void queryClient.invalidateQueries({
          queryKey: ['realIntegrations', 'whatsapp', 'payment-mode', phoneNumberId],
        })
      },
    })
  },

  useAcknowledgeWhatsAppPaymentMode: (phoneNumberId: string) => {
    const queryClient = useQueryClient()
    return useMutation({
      mutationFn: () =>
        httpClient.post<{ success: boolean } & WhatsAppPaymentStatus>('/whatsapp/payment-mode/acknowledge', {
          phoneNumberId,
        }),
      onSuccess: () => {
        void queryClient.invalidateQueries({
          queryKey: ['realIntegrations', 'whatsapp', 'payment-mode', phoneNumberId],
        })
      },
    })
  },
}
