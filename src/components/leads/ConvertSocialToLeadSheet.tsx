import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Sheet, SheetContent, SheetFooter, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { ApiError } from '@/lib/httpClient'
import { pathForLeadFunnel } from '@/lib/leadPaths'
import { realLeadFunnelsService } from '@/services/realLeadFunnels.service'
import { realLeadsService, type Lead } from '@/services/realLeads.service'

/** Convert a social-listening comment into a lead. Open via `?fromComment=`. */
export function ConvertSocialToLeadSheet({
  socialCommentId,
  onCreated,
}: {
  socialCommentId: string | null
  onCreated?: (lead: Lead) => void
}) {
  const navigate = useNavigate()
  const location = useLocation()
  const { data, isLoading } = realLeadFunnelsService.useList()
  const createLead = realLeadsService.useCreate(null)
  const funnels = data?.funnels ?? []
  const [funnelId, setFunnelId] = useState('')

  const open = Boolean(socialCommentId)

  useEffect(() => {
    if (!open) return
    if (funnels.length === 1) setFunnelId(funnels[0].id)
    else setFunnelId((prev) => prev || '')
  }, [open, funnels])

  const close = () => {
    const next = new URLSearchParams(location.search)
    next.delete('fromComment')
    navigate({ pathname: location.pathname, search: next.toString() ? `?${next}` : '' }, { replace: true })
  }

  const submit = () => {
    if (!socialCommentId || !funnelId) return
    createLead.mutate(
      { socialCommentId, funnelId },
      {
        onSuccess: (res) => {
          const lead = res.lead
          toast.success(res.created === false ? 'Lead already exists' : 'Lead created')
          onCreated?.(lead)
          if (lead.funnelId) navigate(pathForLeadFunnel(lead.funnelId), { replace: true })
          else close()
        },
        onError: (err) =>
          toast.error('Could not convert comment', {
            description: err instanceof ApiError ? err.message : undefined,
          }),
      }
    )
  }

  return (
    <Sheet open={open} onOpenChange={(next) => !next && close()}>
      <SheetContent side="right" className="sm:max-w-md">
        <SheetHeader>
          <SheetTitle>Convert to lead</SheetTitle>
          <p className="text-muted-foreground text-xs">Choose which funnel receives this lead.</p>
        </SheetHeader>
        <div className="flex-1 space-y-3 overflow-y-auto px-4">
          {isLoading ? (
            <p className="text-muted-foreground text-sm">Loading funnels…</p>
          ) : funnels.length === 0 ? (
            <p className="text-muted-foreground text-sm">
              No funnels yet. Create one under Leads first.
            </p>
          ) : (
            <div className="space-y-1.5">
              <Label>Funnel</Label>
              <Select value={funnelId} onValueChange={setFunnelId}>
                <SelectTrigger className="w-full">
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
        </div>
        <SheetFooter className="flex-row justify-end gap-2">
          <Button variant="ghost" onClick={close}>
            Cancel
          </Button>
          <Button disabled={!funnelId || createLead.isPending || funnels.length === 0} onClick={submit}>
            {createLead.isPending ? 'Creating…' : 'Add lead'}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
