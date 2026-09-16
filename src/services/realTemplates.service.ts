import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { httpClient } from '@/lib/httpClient'

export type TemplateCategory = 'Marketing' | 'Utility' | 'Authentication'
export type TemplateStatus = 'draft' | 'pending' | 'approved' | 'rejected' | 'paused' | 'disabled'
export type TemplateHeaderFormat = 'TEXT' | 'IMAGE' | 'VIDEO' | 'DOCUMENT' | null
export type TemplateButtonType = 'QUICK_REPLY' | 'URL' | 'PHONE_NUMBER' | 'FLOW' | null

export type WhatsAppTemplate = {
  id: string
  name: string
  category: string
  status: TemplateStatus
  language: string
  bodyPattern: string
  header: string | null
  headerFormat: TemplateHeaderFormat
  footer: string | null
  variables: string[]
  buttonType: TemplateButtonType
  buttonText: string | null
  buttonUrl: string | null
  buttonPhoneNumber: string | null
  buttonFlowId: string | null
  rejectionReason: string | null
  waTemplateId: string | null
  headerMediaHandle?: string | null
  headerMediaStorageKey?: string | null
  headerMediaMimeType?: string | null
  headerMediaFileName?: string | null
  groupId: string | null
  updatedAt: string
}

export type WhatsAppTemplateInput = {
  name?: string
  category?: TemplateCategory
  language?: string
  bodyPattern?: string
  header?: string | null
  headerFormat?: TemplateHeaderFormat
  headerMediaHandle?: string | null
  headerMediaStorageKey?: string | null
  headerMediaMimeType?: string | null
  headerMediaFileName?: string | null
  footer?: string | null
  variables?: string[]
  variableSamples?: string[]
  buttonType?: TemplateButtonType
  buttonText?: string | null
  buttonUrl?: string | null
  buttonPhoneNumber?: string | null
  buttonFlowId?: string | null
  buttonUrlSample?: string | null
  submitToMeta?: boolean
  groupId?: string | null
}

export type NewWhatsAppTemplateInput = WhatsAppTemplateInput & {
  name: string
  category: TemplateCategory
  bodyPattern: string
  submitToMeta: boolean
}

export type HeaderMediaUpload = {
  headerFormat: 'IMAGE' | 'VIDEO' | 'DOCUMENT'
  headerMediaHandle: string
  headerMediaStorageKey: string
  headerMediaMimeType: string
  headerMediaFileName: string | null
}

export type TemplateInsightDataPoint = {
  start: number
  end: number
  sent: number
  delivered: number
  read: number
  clicked: { type: string; button_content?: string; count: number }[]
}

export type TemplateInsights = {
  templateId: string
  waTemplateId: string
  start: number
  end: number
  dataPoints: TemplateInsightDataPoint[]
  totals: { sent: number; delivered: number; read: number; clicked: Record<string, number> }
}

const listKey = ['realTemplates', 'whatsapp'] as const

const STATUSES: TemplateStatus[] = ['draft', 'pending', 'approved', 'rejected', 'paused', 'disabled']

function mapCategory(raw: unknown): string {
  const key = String(raw ?? 'Utility').trim().toUpperCase()
  if (key === 'MARKETING') return 'Marketing'
  if (key === 'AUTHENTICATION') return 'Authentication'
  return 'Utility'
}

function mapStatus(raw: unknown): TemplateStatus {
  const slug = String(raw ?? 'draft').toLowerCase()
  return STATUSES.includes(slug as TemplateStatus) ? (slug as TemplateStatus) : 'draft'
}

export function mapWhatsAppTemplate(raw: Record<string, unknown>): WhatsAppTemplate {
  return {
    id: String(raw.id ?? ''),
    name: String(raw.name ?? ''),
    category: mapCategory(raw.category),
    status: mapStatus(raw.status),
    language: raw.language ? String(raw.language) : 'en',
    bodyPattern: String(raw.bodyPattern ?? ''),
    header: raw.header != null ? String(raw.header) : null,
    headerFormat: (raw.headerFormat as TemplateHeaderFormat) ?? null,
    footer: raw.footer != null ? String(raw.footer) : null,
    variables: Array.isArray(raw.variables) ? raw.variables.map(String) : [],
    buttonType: (raw.buttonType as TemplateButtonType) ?? null,
    buttonText: raw.buttonText != null ? String(raw.buttonText) : null,
    buttonUrl: raw.buttonUrl != null ? String(raw.buttonUrl) : null,
    buttonPhoneNumber: raw.buttonPhoneNumber != null ? String(raw.buttonPhoneNumber) : null,
    buttonFlowId: raw.buttonFlowId != null ? String(raw.buttonFlowId) : null,
    rejectionReason: raw.rejectionReason != null ? String(raw.rejectionReason) : null,
    waTemplateId: raw.waTemplateId != null ? String(raw.waTemplateId) : null,
    headerMediaHandle: raw.headerMediaHandle != null ? String(raw.headerMediaHandle) : null,
    headerMediaStorageKey: raw.headerMediaStorageKey != null ? String(raw.headerMediaStorageKey) : null,
    headerMediaMimeType: raw.headerMediaMimeType != null ? String(raw.headerMediaMimeType) : null,
    headerMediaFileName: raw.headerMediaFileName != null ? String(raw.headerMediaFileName) : null,
    groupId: raw.groupId != null ? String(raw.groupId) : null,
    updatedAt: raw.updatedAt ? String(raw.updatedAt) : '',
  }
}

function headerMediaPath(storageKey: string): string {
  return `/templates/header-media/${storageKey.split('/').map(encodeURIComponent).join('/')}`
}

export const realTemplatesService = {
  useList: () =>
    useQuery({
      queryKey: listKey,
      queryFn: async () => {
        const rows = await httpClient.get<Record<string, unknown>[]>('/templates')
        return (rows ?? []).map(mapWhatsAppTemplate)
      },
    }),

  useGet: (id: string | null) =>
    useQuery({
      queryKey: [...listKey, id],
      queryFn: async () => {
        const row = await httpClient.get<Record<string, unknown>>(`/templates/${id}`)
        return mapWhatsAppTemplate(row)
      },
      enabled: Boolean(id),
    }),

  useCreate: () => {
    const queryClient = useQueryClient()
    return useMutation({
      mutationFn: (input: NewWhatsAppTemplateInput) =>
        httpClient.post<Record<string, unknown>>('/templates', input).then(mapWhatsAppTemplate),
      onSuccess: () => {
        void queryClient.invalidateQueries({ queryKey: listKey })
      },
    })
  },

  useUpdate: () => {
    const queryClient = useQueryClient()
    return useMutation({
      mutationFn: ({ id, patch }: { id: string; patch: WhatsAppTemplateInput }) =>
        httpClient.put<Record<string, unknown>>(`/templates/${id}`, patch).then(mapWhatsAppTemplate),
      onSuccess: () => {
        void queryClient.invalidateQueries({ queryKey: listKey })
      },
    })
  },

  useSubmit: () => {
    const queryClient = useQueryClient()
    return useMutation({
      mutationFn: (id: string) =>
        httpClient.post<Record<string, unknown>>(`/templates/${id}/submit`).then(mapWhatsAppTemplate),
      onSuccess: () => {
        void queryClient.invalidateQueries({ queryKey: listKey })
      },
    })
  },

  useRefreshStatus: () => {
    const queryClient = useQueryClient()
    return useMutation({
      mutationFn: (id: string) =>
        httpClient.post<Record<string, unknown>>(`/templates/${id}/refresh-status`).then(mapWhatsAppTemplate),
      onSuccess: () => {
        void queryClient.invalidateQueries({ queryKey: listKey })
      },
    })
  },

  useSync: () => {
    const queryClient = useQueryClient()
    return useMutation({
      mutationFn: () => httpClient.post<{ synced: number }>('/templates/sync'),
      onSuccess: () => {
        void queryClient.invalidateQueries({ queryKey: listKey })
      },
    })
  },

  useRemove: () => {
    const queryClient = useQueryClient()
    return useMutation({
      mutationFn: (id: string) => httpClient.del<{ success: boolean }>(`/templates/${id}`),
      onSuccess: () => {
        void queryClient.invalidateQueries({ queryKey: listKey })
      },
    })
  },

  uploadHeaderMedia: (file: File) => {
    const form = new FormData()
    form.append('file', file)
    return httpClient.post<HeaderMediaUpload>('/templates/header-media', form)
  },

  fetchHeaderMedia: (storageKey: string) => httpClient.getBlob(headerMediaPath(storageKey)),

  useInsights: (id: string | null, days: 7 | 30 | 90) =>
    useQuery({
      queryKey: ['realTemplates', 'insights', id, days],
      queryFn: () => httpClient.get<TemplateInsights>(`/templates/${id}/insights?days=${days}`),
      enabled: Boolean(id),
      retry: false,
    }),
}

export type TemplateGroup = {
  id: string
  name: string
  order: number
  templateCount: number
}

const groupsKey = ['realTemplates', 'groups'] as const

export const templateGroupsService = {
  useList: () =>
    useQuery({
      queryKey: groupsKey,
      queryFn: () => httpClient.get<TemplateGroup[]>('/template-groups'),
    }),

  useCreate: () => {
    const queryClient = useQueryClient()
    return useMutation({
      mutationFn: (name: string) => httpClient.post<TemplateGroup>('/template-groups', { name }),
      onSuccess: () => void queryClient.invalidateQueries({ queryKey: groupsKey }),
    })
  },

  useUpdate: () => {
    const queryClient = useQueryClient()
    return useMutation({
      mutationFn: ({ id, patch }: { id: string; patch: { name?: string; order?: number } }) =>
        httpClient.put<TemplateGroup>(`/template-groups/${id}`, patch),
      onSuccess: () => void queryClient.invalidateQueries({ queryKey: groupsKey }),
    })
  },

  useRemove: () => {
    const queryClient = useQueryClient()
    return useMutation({
      mutationFn: (id: string) => httpClient.del<{ ok: boolean }>(`/template-groups/${id}`),
      onSuccess: () => {
        void queryClient.invalidateQueries({ queryKey: groupsKey })
        void queryClient.invalidateQueries({ queryKey: listKey })
      },
    })
  },
}
