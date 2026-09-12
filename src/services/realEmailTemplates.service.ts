import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { httpClient } from '@/lib/httpClient'

export type EmailTemplateStatus = 'draft' | 'active'

export type EmailTemplateRecord = {
  id: string
  name: string
  subject: string
  htmlBody: string
  textBody: string | null
  designJson: Record<string, unknown> | null
  variables: string[]
  status: EmailTemplateStatus
  createdAt?: string
  updatedAt?: string
}

export type EmailTemplateInput = {
  name: string
  subject: string
  htmlBody: string
  textBody?: string
  status?: EmailTemplateStatus
  designJson?: Record<string, unknown> | null
}

const listKey = ['realEmailTemplates'] as const

function mapEmailTemplate(row: Record<string, unknown>): EmailTemplateRecord {
  return {
    id: String(row.id ?? ''),
    name: String(row.name ?? ''),
    subject: String(row.subject ?? ''),
    htmlBody: String(row.htmlBody ?? ''),
    textBody: row.textBody != null ? String(row.textBody) : null,
    designJson:
      row.designJson && typeof row.designJson === 'object'
        ? (row.designJson as Record<string, unknown>)
        : null,
    variables: Array.isArray(row.variables) ? row.variables.map(String) : [],
    status: row.status === 'active' ? 'active' : 'draft',
    createdAt: row.createdAt ? String(row.createdAt) : undefined,
    updatedAt: row.updatedAt ? String(row.updatedAt) : undefined,
  }
}

export const realEmailTemplatesService = {
  useList: () =>
    useQuery({
      queryKey: listKey,
      queryFn: async () => {
        const rows = await httpClient.get<Record<string, unknown>[]>('/email/templates')
        return (rows ?? []).map(mapEmailTemplate)
      },
    }),

  useGet: (id: string | null) =>
    useQuery({
      queryKey: [...listKey, id],
      queryFn: async () => {
        const row = await httpClient.get<Record<string, unknown>>(`/email/templates/${id}`)
        return mapEmailTemplate(row)
      },
      enabled: Boolean(id),
    }),

  useCreate: () => {
    const queryClient = useQueryClient()
    return useMutation({
      mutationFn: (input: EmailTemplateInput) =>
        httpClient.post<Record<string, unknown>>('/email/templates', input).then(mapEmailTemplate),
      onSuccess: () => {
        void queryClient.invalidateQueries({ queryKey: listKey })
      },
    })
  },

  useUpdate: () => {
    const queryClient = useQueryClient()
    return useMutation({
      mutationFn: ({ id, patch }: { id: string; patch: Partial<EmailTemplateInput> }) =>
        httpClient.patch<Record<string, unknown>>(`/email/templates/${id}`, patch).then(mapEmailTemplate),
      onSuccess: () => {
        void queryClient.invalidateQueries({ queryKey: listKey })
      },
    })
  },

  useRemove: () => {
    const queryClient = useQueryClient()
    return useMutation({
      mutationFn: (id: string) => httpClient.del<{ ok: boolean }>(`/email/templates/${id}`),
      onSuccess: () => {
        void queryClient.invalidateQueries({ queryKey: listKey })
      },
    })
  },
}
