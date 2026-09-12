import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Sheet, SheetContent, SheetFooter, SheetHeader, SheetTitle } from '@/components/ui/sheet'

export type FunnelOption = { id: string; name: string }

export function AddLeadDialog({
  open,
  funnels,
  loading,
  busy,
  error,
  funnelId,
  onFunnelId,
  onClose,
  onConfirm,
}: {
  open: boolean
  funnels: FunnelOption[]
  loading: boolean
  busy: boolean
  error: string
  funnelId: string
  onFunnelId: (id: string) => void
  onClose: () => void
  onConfirm: () => void
}) {
  return (
    <Sheet open={open} onOpenChange={(next) => !next && onClose()}>
      <SheetContent side="right" className="sm:max-w-sm">
        <SheetHeader>
          <SheetTitle>Add to lead</SheetTitle>
        </SheetHeader>
        <div className="space-y-3 px-4">
          <p className="text-muted-foreground text-sm">Choose which funnel receives this lead.</p>
          {loading ? (
            <p className="text-muted-foreground text-sm">Loading funnels…</p>
          ) : funnels.length === 0 ? (
            <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900">
              No funnels yet. Create one under Leads first.
            </p>
          ) : (
            <div className="space-y-2">
              <Label htmlFor="lead-funnel">Funnel</Label>
              <Select value={funnelId} onValueChange={onFunnelId}>
                <SelectTrigger id="lead-funnel" className="w-full">
                  <SelectValue placeholder="Select funnel…" />
                </SelectTrigger>
                <SelectContent>
                  {funnels.map((f) => (
                    <SelectItem key={f.id} value={f.id}>
                      {f.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          {error ? <p className="text-destructive text-xs font-medium">{error}</p> : null}
        </div>
        <SheetFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button disabled={!funnelId || busy || loading} onClick={onConfirm}>
            {busy ? 'Adding…' : 'Add to lead'}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
