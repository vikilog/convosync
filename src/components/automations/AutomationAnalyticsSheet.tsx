import { BarChart3 } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Skeleton } from '@/components/ui/skeleton'
import { realAutomationsService } from '@/services/realAutomations.service'

const METRIC_KEYS = ['sent', 'delivered', 'read', 'clicked', 'replied'] as const

export function AutomationAnalyticsSheet({
  automationId,
  open,
  onClose,
}: {
  automationId: string
  open: boolean
  onClose: () => void
}) {
  const { data, isLoading, isError } = realAutomationsService.useAnalytics(automationId, open)

  return (
    <Sheet open={open} onOpenChange={(next) => !next && onClose()}>
      <SheetContent side="right">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <BarChart3 className="size-4" />
            Analytics
          </SheetTitle>
        </SheetHeader>
        <div className="space-y-4 px-4">
          {isLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
            </div>
          ) : isError ? (
            <p className="text-destructive text-sm">Couldn&apos;t load analytics.</p>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-2">
                {METRIC_KEYS.map((key) => (
                  <div key={key} className="rounded-lg border p-3">
                    <p className="text-muted-foreground text-xs capitalize">{key}</p>
                    <p className="text-lg font-semibold">{data?.metrics[key] ?? 0}</p>
                  </div>
                ))}
              </div>
              <div>
                <p className="mb-2 text-sm font-medium">Executions</p>
                <div className="flex flex-wrap gap-1.5">
                  {Object.entries(data?.executions ?? {}).length === 0 ? (
                    <p className="text-muted-foreground text-xs">No runs yet.</p>
                  ) : (
                    Object.entries(data?.executions ?? {}).map(([status, count]) => (
                      <Badge key={status} variant="outline" className="capitalize">
                        {status}: {count}
                      </Badge>
                    ))
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}
