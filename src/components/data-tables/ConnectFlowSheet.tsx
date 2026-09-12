import { useEffect, useMemo, useState } from 'react'
import { Link2, Loader2, Unlink } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { extractFlowFields } from '@/lib/flowFieldExtract'
import { ApiError } from '@/lib/httpClient'
import {
  realDataTablesService,
  type DataTableColumn,
} from '@/services/realDataTables.service'
import { realFlowsService } from '@/services/realFlows.service'

function bestGuessMap(columns: DataTableColumn[], fields: { name: string; label: string }[]) {
  const map: Record<string, string> = {}
  for (const col of columns) {
    const match = fields.find(
      (f) =>
        f.name.toLowerCase() === col.key.toLowerCase() ||
        f.label.toLowerCase() === col.label.toLowerCase()
    )
    if (match) map[col.key] = match.name
  }
  return map
}

function errMsg(err: unknown) {
  return err instanceof ApiError || err instanceof Error ? err.message : 'Something went wrong.'
}

export function ConnectFlowSheet({
  open,
  onOpenChange,
  tableId,
  columns,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  tableId: string
  columns: DataTableColumn[]
}) {
  const { data, isLoading } = realDataTablesService.useFlows(open ? tableId : undefined)
  const connectFlow = realDataTablesService.useConnectFlow(tableId)
  const disconnectFlow = realDataTablesService.useDisconnectFlow(tableId)

  const [pickingFlowId, setPickingFlowId] = useState('')
  const [fieldMap, setFieldMap] = useState<Record<string, string>>({})
  const [error, setError] = useState('')

  const flowQuery = realFlowsService.useGet(open && pickingFlowId ? pickingFlowId : null)
  const flowFields = useMemo(
    () => extractFlowFields(flowQuery.data?.item.flowJson),
    [flowQuery.data]
  )

  useEffect(() => {
    if (!open) {
      setPickingFlowId('')
      setFieldMap({})
      setError('')
    }
  }, [open])

  useEffect(() => {
    if (flowFields.length === 0) return
    setFieldMap(bestGuessMap(columns, flowFields))
  }, [flowFields, columns])

  const connected = data?.connected ?? []
  const available = data?.available ?? []
  const saving = connectFlow.isPending || disconnectFlow.isPending

  const handleConnect = async () => {
    if (!pickingFlowId) return
    setError('')
    try {
      await connectFlow.mutateAsync({ flowId: pickingFlowId, fieldMap })
      setPickingFlowId('')
      setFieldMap({})
    } catch (err) {
      setError(errMsg(err))
    }
  }

  const handleDisconnect = async (flowId: string) => {
    setError('')
    try {
      await disconnectFlow.mutateAsync(flowId)
    } catch (err) {
      setError(errMsg(err))
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="sm:max-w-lg">
        <SheetHeader>
          <SheetTitle>Connect a Flow</SheetTitle>
        </SheetHeader>
        <div className="flex-1 space-y-4 overflow-y-auto px-4">
          <p className="text-muted-foreground text-xs">
            Every submission of a connected flow appends one row here, mapped by field.
          </p>

          {isLoading ? (
            <div className="text-muted-foreground flex justify-center py-10">
              <Loader2 className="size-5 animate-spin" />
            </div>
          ) : (
            <>
              {connected.length > 0 ? (
                <div className="space-y-2">
                  <Label>Connected</Label>
                  {connected.map((f) => (
                    <div
                      key={f.id}
                      className="flex items-center justify-between gap-2 rounded-lg border px-3 py-2"
                    >
                      <span className="truncate text-sm font-medium">{f.name}</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        disabled={saving}
                        className="text-destructive"
                        onClick={() => void handleDisconnect(f.id)}
                      >
                        <Unlink />
                        Disconnect
                      </Button>
                    </div>
                  ))}
                </div>
              ) : null}

              <div className="space-y-2">
                <Label>Connect a published flow</Label>
                {available.length === 0 ? (
                  <p className="text-muted-foreground text-xs">
                    No other published flows available. Publish a flow first from Templates → Flows.
                  </p>
                ) : (
                  <Select value={pickingFlowId || undefined} onValueChange={setPickingFlowId}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select a flow…" />
                    </SelectTrigger>
                    <SelectContent>
                      {available.map((f) => (
                        <SelectItem key={f.id} value={f.id}>
                          {f.name}
                          {f.connectedElsewhere ? ' (connected to another table)' : ''}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>

              {pickingFlowId ? (
                flowQuery.isLoading ? (
                  <div className="text-muted-foreground flex justify-center py-6">
                    <Loader2 className="size-5 animate-spin" />
                  </div>
                ) : (
                  <div className="space-y-2 rounded-lg border p-3">
                    <Label>Map columns to flow fields</Label>
                    {columns.map((col) => (
                      <div key={col.id} className="flex items-center gap-2">
                        <span className="w-28 shrink-0 truncate text-xs font-medium">{col.label}</span>
                        <Select
                          value={fieldMap[col.key] || '__none__'}
                          onValueChange={(v) =>
                            setFieldMap((prev) => {
                              const next = { ...prev }
                              if (v === '__none__') delete next[col.key]
                              else next[col.key] = v
                              return next
                            })
                          }
                        >
                          <SelectTrigger size="sm" className="flex-1">
                            <SelectValue placeholder="— not mapped —" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="__none__">— not mapped —</SelectItem>
                            {flowFields.map((f) => (
                              <SelectItem key={f.name} value={f.name}>
                                {f.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    ))}
                    <div className="flex justify-end pt-1">
                      <Button size="sm" disabled={saving} onClick={() => void handleConnect()}>
                        {saving ? <Loader2 className="animate-spin" /> : <Link2 />}
                        Connect
                      </Button>
                    </div>
                  </div>
                )
              ) : null}
            </>
          )}

          {error ? <p className="text-destructive text-xs">{error}</p> : null}
        </div>
      </SheetContent>
    </Sheet>
  )
}
