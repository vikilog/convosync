import { useNavigate, useParams } from 'react-router-dom'

import { PageSkeleton } from '@/components/PageSkeleton'
import { Button } from '@/components/ui/button'
import { DataTableDetailPage } from '@/pages/DataTableDetailPage'
import { realDataTablesService } from '@/services/realDataTables.service'

/** Route shell for /data/:tableId — resolves the table from the real backend
 * and wires back navigation. Row/column mutations live in DataTableDetailPage. */
export function DataTableDetailRoute() {
  const { tableId } = useParams<{ tableId: string }>()
  const navigate = useNavigate()
  const { data: table, isLoading, isError } = realDataTablesService.useGet(tableId)

  if (isLoading) return <PageSkeleton />
  if (isError || !table) {
    return (
      <div className="flex flex-1 flex-col items-start gap-3 p-6">
        <Button variant="ghost" size="sm" onClick={() => navigate('/data')}>
          Back to tables
        </Button>
        <p className="text-destructive text-sm">Table not found.</p>
      </div>
    )
  }

  return <DataTableDetailPage key={table.id} table={table} onBack={() => navigate('/data')} />
}
