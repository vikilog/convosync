import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, Table2, Trash2 } from 'lucide-react'
import { toast } from 'sonner'

import { EmptyState } from '@/components/common/EmptyState'
import { useConfirm } from '@/components/common/ConfirmDialogProvider'
import { NewDataTableSheet, type NewDataTableInput } from '@/components/data-tables/NewDataTableSheet'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { readListAlive, writeListAlive } from '@/lib/dataTableKeepAlive'
import { ApiError } from '@/lib/httpClient'
import { realDataTablesService, type DataTable } from '@/services/realDataTables.service'

function formatUpdated(iso: string): string {
  return new Date(iso).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })
}

function reportError(err: unknown) {
  toast.error(err instanceof ApiError ? err.message : 'Something went wrong. Please try again.')
}

export function DataTablesPage() {
  const navigate = useNavigate()
  const confirm = useConfirm()
  const { data: tables = [], isLoading, isError } = realDataTablesService.useList()
  const createTableMutation = realDataTablesService.useCreate()
  const removeTable = realDataTablesService.useRemove()

  const [query, setQuery] = useState(() => readListAlive().query)

  useEffect(() => {
    writeListAlive({ query })
  }, [query])

  const filtered = useMemo(
    () => tables.filter((t) => t.name.toLowerCase().includes(query.toLowerCase())),
    [tables, query]
  )

  const createTable = async (input: NewDataTableInput) => {
    try {
      const table = await createTableMutation.mutateAsync({
        name: input.name,
        description: input.description || undefined,
        columns: input.columns,
      })
      navigate(`/data/${table.id}`)
    } catch (err) {
      reportError(err)
      throw err
    }
  }

  const handleDelete = async (table: DataTable) => {
    const ok = await confirm({
      title: `Delete "${table.name}"?`,
      description: 'This removes the table and all its rows. This action cannot be undone.',
      confirmLabel: 'Delete',
      destructive: true,
    })
    if (ok) removeTable.mutate(table.id, { onError: reportError })
  }

  return (
    <div className="flex h-full min-h-0 w-full flex-1 flex-col">
      <div className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-b p-4">
        <div className="relative min-w-[220px] flex-1">
          <Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search tables…"
            className="pl-8"
          />
        </div>
        <NewDataTableSheet onCreate={createTable} pending={createTableMutation.isPending} />
      </div>

      <div className="min-h-0 flex-1 overflow-auto p-4">
        {isLoading ? (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-36 w-full" />
            ))}
          </div>
        ) : isError ? (
          <EmptyState
            icon={Table2}
            title="Couldn’t load tables"
            description="Check your connection and try again."
          />
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={Table2}
            title={tables.length === 0 ? 'No tables yet' : 'No tables match your search'}
            description="Design a table with your own columns, then connect it to a Flow so submissions land here automatically — or enter data by hand."
          />
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((table) => (
              <Card
                key={table.id}
                className="hover:border-primary/30 cursor-pointer transition-colors"
                onClick={() => navigate(`/data/${table.id}`)}
              >
                <CardHeader>
                  <div className="flex items-start justify-between gap-2">
                    <CardTitle className="truncate">{table.name}</CardTitle>
                    <Badge variant="outline" className="shrink-0">
                      {table.rowCount} row{table.rowCount === 1 ? '' : 's'}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  {table.description ? (
                    <p className="text-muted-foreground line-clamp-2 text-xs">{table.description}</p>
                  ) : null}
                  <p className="text-muted-foreground mt-2 text-xs">
                    {table.columns.length} column{table.columns.length === 1 ? '' : 's'} · Updated{' '}
                    {formatUpdated(table.updatedAt)}
                  </p>
                </CardContent>
                <CardFooter className="justify-end bg-transparent">
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    className="text-muted-foreground hover:text-destructive"
                    onClick={(e) => {
                      e.stopPropagation()
                      void handleDelete(table)
                    }}
                    aria-label={`Delete ${table.name}`}
                  >
                    <Trash2 />
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
