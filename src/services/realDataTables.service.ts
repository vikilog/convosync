import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { ApiError, httpClient } from '@/lib/httpClient'

export type DataColumnType = 'text' | 'number' | 'date' | 'boolean' | 'select' | 'phone' | 'email'

export const DATA_COLUMN_TYPE_OPTIONS: { value: DataColumnType; label: string }[] = [
  { value: 'text', label: 'Text' },
  { value: 'number', label: 'Number' },
  { value: 'date', label: 'Date' },
  { value: 'boolean', label: 'Yes / No' },
  { value: 'select', label: 'Choice list' },
  { value: 'phone', label: 'Phone' },
  { value: 'email', label: 'Email' },
]

export type DataTableColumn = {
  id: string
  key: string
  label: string
  type: DataColumnType
  options?: string[]
}

export type DataTable = {
  id: string
  name: string
  description: string | null
  rowCount: number
  columns: DataTableColumn[]
  createdAt: string
  updatedAt: string
}

export type DataTableRow = {
  id: string
  data: Record<string, unknown>
  source: 'manual' | 'flow'
  createdAt: string
  updatedAt: string
}

export type NewColumnInput = { label: string; type: DataColumnType; options?: string[] }

export type ConnectedFlow = {
  id: string
  name: string
  fieldMap: Record<string, string>
}

export type AvailableFlow = {
  id: string
  name: string
  connectedElsewhere: boolean
}

const listKey = ['realDataTables'] as const
const detailKey = (id: string) => ['realDataTables', 'detail', id] as const
const rowsKey = (id: string) => ['realDataTables', 'rows', id] as const
const flowsKey = (id: string) => ['realDataTables', 'flows', id] as const

export const realDataTablesService = {
  useList: () =>
    useQuery({
      queryKey: listKey,
      queryFn: () => httpClient.get<{ items: DataTable[] }>('/data-tables').then((res) => res.items),
    }),

  useGet: (id: string | undefined) =>
    useQuery({
      queryKey: detailKey(id ?? ''),
      queryFn: () => httpClient.get<{ item: DataTable }>(`/data-tables/${id}`).then((res) => res.item),
      enabled: Boolean(id),
      retry: (count, err) => (err instanceof ApiError && err.status === 404 ? false : count < 2),
    }),

  useCreate: () => {
    const queryClient = useQueryClient()
    return useMutation({
      mutationFn: (input: { name: string; description?: string; columns: NewColumnInput[] }) =>
        httpClient.post<{ item: DataTable }>('/data-tables', input).then((res) => res.item),
      onSuccess: () => {
        void queryClient.invalidateQueries({ queryKey: listKey })
      },
    })
  },

  useUpdate: () => {
    const queryClient = useQueryClient()
    return useMutation({
      mutationFn: ({ id, patch }: { id: string; patch: { name?: string; description?: string | null } }) =>
        httpClient.put<{ item: DataTable }>(`/data-tables/${id}`, patch).then((res) => res.item),
      onSuccess: (_data, variables) => {
        void queryClient.invalidateQueries({ queryKey: detailKey(variables.id) })
        void queryClient.invalidateQueries({ queryKey: listKey })
      },
    })
  },

  useRemove: () => {
    const queryClient = useQueryClient()
    return useMutation({
      mutationFn: (id: string) => httpClient.del<{ ok: boolean }>(`/data-tables/${id}`),
      onSuccess: () => {
        void queryClient.invalidateQueries({ queryKey: listKey })
      },
    })
  },

  useAddColumn: (tableId: string) => {
    const queryClient = useQueryClient()
    return useMutation({
      mutationFn: (input: NewColumnInput) =>
        httpClient
          .post<{ item: DataTableColumn }>(`/data-tables/${tableId}/columns`, input)
          .then((res) => res.item),
      onSuccess: () => {
        void queryClient.invalidateQueries({ queryKey: detailKey(tableId) })
        void queryClient.invalidateQueries({ queryKey: listKey })
      },
    })
  },

  useRemoveColumn: (tableId: string) => {
    const queryClient = useQueryClient()
    return useMutation({
      mutationFn: (columnId: string) =>
        httpClient.del<{ ok: boolean }>(`/data-tables/${tableId}/columns/${columnId}`),
      onSuccess: () => {
        void queryClient.invalidateQueries({ queryKey: detailKey(tableId) })
        void queryClient.invalidateQueries({ queryKey: rowsKey(tableId) })
      },
    })
  },

  useRows: (tableId: string | undefined) =>
    useQuery({
      queryKey: rowsKey(tableId ?? ''),
      queryFn: () =>
        httpClient.get<{ items: DataTableRow[]; nextCursor: string | null }>(
          `/data-tables/${tableId}/rows?limit=500`
        ),
      enabled: Boolean(tableId),
    }),

  useAddRow: (tableId: string) => {
    const queryClient = useQueryClient()
    return useMutation({
      mutationFn: (data: Record<string, unknown>) =>
        httpClient
          .post<{ item: DataTableRow }>(`/data-tables/${tableId}/rows`, { data })
          .then((res) => res.item),
      onSuccess: () => {
        void queryClient.invalidateQueries({ queryKey: rowsKey(tableId) })
        void queryClient.invalidateQueries({ queryKey: detailKey(tableId) })
        void queryClient.invalidateQueries({ queryKey: listKey })
      },
    })
  },

  useUpdateRow: (tableId: string) => {
    const queryClient = useQueryClient()
    return useMutation({
      mutationFn: ({ rowId, data }: { rowId: string; data: Record<string, unknown> }) =>
        httpClient
          .put<{ item: DataTableRow }>(`/data-tables/${tableId}/rows/${rowId}`, { data })
          .then((res) => res.item),
      onSuccess: () => {
        void queryClient.invalidateQueries({ queryKey: rowsKey(tableId) })
      },
    })
  },

  useRemoveRow: (tableId: string) => {
    const queryClient = useQueryClient()
    return useMutation({
      mutationFn: (rowId: string) => httpClient.del<{ ok: boolean }>(`/data-tables/${tableId}/rows/${rowId}`),
      onSuccess: () => {
        void queryClient.invalidateQueries({ queryKey: rowsKey(tableId) })
        void queryClient.invalidateQueries({ queryKey: detailKey(tableId) })
        void queryClient.invalidateQueries({ queryKey: listKey })
      },
    })
  },

  useRemoveRows: (tableId: string) => {
    const queryClient = useQueryClient()
    return useMutation({
      mutationFn: async (rowIds: string[]) => {
        await Promise.all(
          rowIds.map((rowId) => httpClient.del<{ ok: boolean }>(`/data-tables/${tableId}/rows/${rowId}`))
        )
        return { deleted: rowIds.length }
      },
      onSuccess: () => {
        void queryClient.invalidateQueries({ queryKey: rowsKey(tableId) })
        void queryClient.invalidateQueries({ queryKey: detailKey(tableId) })
        void queryClient.invalidateQueries({ queryKey: listKey })
      },
    })
  },

  useImportRows: (tableId: string) => {
    const queryClient = useQueryClient()
    return useMutation({
      mutationFn: async (rows: Record<string, unknown>[]) => {
        const chunkSize = 10
        for (let i = 0; i < rows.length; i += chunkSize) {
          const chunk = rows.slice(i, i + chunkSize)
          await Promise.all(
            chunk.map((data) =>
              httpClient.post<{ item: DataTableRow }>(`/data-tables/${tableId}/rows`, { data })
            )
          )
        }
        return { created: rows.length }
      },
      onSuccess: () => {
        void queryClient.invalidateQueries({ queryKey: rowsKey(tableId) })
        void queryClient.invalidateQueries({ queryKey: detailKey(tableId) })
        void queryClient.invalidateQueries({ queryKey: listKey })
      },
    })
  },

  useFlows: (tableId: string | undefined) =>
    useQuery({
      queryKey: flowsKey(tableId ?? ''),
      queryFn: () =>
        httpClient.get<{ connected: ConnectedFlow[]; available: AvailableFlow[] }>(
          `/data-tables/${tableId}/flows`
        ),
      enabled: Boolean(tableId),
    }),

  useConnectFlow: (tableId: string) => {
    const queryClient = useQueryClient()
    return useMutation({
      mutationFn: (input: { flowId: string; fieldMap: Record<string, string> }) =>
        httpClient.put<{ ok: boolean }>(`/data-tables/${tableId}/connect-flow`, input),
      onSuccess: () => {
        void queryClient.invalidateQueries({ queryKey: flowsKey(tableId) })
        void queryClient.invalidateQueries({ queryKey: ['realFlows'] })
      },
    })
  },

  useDisconnectFlow: (tableId: string) => {
    const queryClient = useQueryClient()
    return useMutation({
      mutationFn: (flowId: string) =>
        httpClient.del<{ ok: boolean }>(`/data-tables/${tableId}/connect-flow/${flowId}`),
      onSuccess: () => {
        void queryClient.invalidateQueries({ queryKey: flowsKey(tableId) })
        void queryClient.invalidateQueries({ queryKey: ['realFlows'] })
      },
    })
  },
}
