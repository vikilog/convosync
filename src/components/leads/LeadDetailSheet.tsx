import { useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { CheckCircle2, Loader2, Mail, MessageSquare, Phone, UserPlus } from 'lucide-react'
import { toast } from 'sonner'

import { ChannelIcon } from '@/components/channel-icon'
import { ContactLeadJourneyPanel } from '@/components/inbox/ContactLeadJourneyPanel'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Textarea } from '@/components/ui/textarea'
import { formatCustomFieldValue, labelForCustomFieldKey, visibleCustomFieldEntries } from '@/lib/contactDisplay'
import { SOURCE_LABEL, timeAgo } from '@/lib/leadLabels'
import { realContactsService } from '@/services/realContacts.service'
import type { LeadFunnelStage } from '@/services/realLeadFunnels.service'
import type { Lead, LeadUpdateInput } from '@/services/realLeads.service'

const LEAD_JOURNEY_FIELD = 'leadJourney'

export function LeadDetailSheet({
  lead,
  stages,
  onOpenChange,
  onUpdate,
  onConvert,
}: {
  lead: Lead | null
  stages: LeadFunnelStage[]
  onOpenChange: (open: boolean) => void
  onUpdate: (id: string, patch: LeadUpdateInput) => void
  onConvert: (lead: Lead) => void
}) {
  const navigate = useNavigate()
  const openInbox = realContactsService.useOpenInbox()
  const { data: contact } = realContactsService.useGet(lead?.contactId ?? undefined)
  const pending = useRef<Record<string, LeadUpdateInput>>({})
  const timers = useRef<Record<string, ReturnType<typeof setTimeout>>>({})

  useEffect(() => {
    const pendingMap = pending.current
    const timerMap = timers.current
    return () => {
      for (const id of Object.keys(timerMap)) clearTimeout(timerMap[id])
      for (const [id, patch] of Object.entries(pendingMap)) {
        if (Object.keys(patch).length) onUpdate(id, patch)
      }
    }
    // ponytail: flush in-flight edits on unmount only
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const schedule = (id: string, patch: LeadUpdateInput, immediate = false) => {
    pending.current[id] = { ...pending.current[id], ...patch }
    const existing = timers.current[id]
    if (existing) clearTimeout(existing)
    const flush = () => {
      delete timers.current[id]
      const body = pending.current[id]
      delete pending.current[id]
      if (body && Object.keys(body).length) onUpdate(id, body)
    }
    if (immediate) {
      flush()
      return
    }
    timers.current[id] = setTimeout(flush, 450)
  }

  const stageMeta = lead ? stages.find((s) => s.id === lead.stageId) : undefined
  const canConvert = Boolean(stageMeta?.isFinal) && !lead?.contactId
  const extraFields = visibleCustomFieldEntries(contact?.customFields).filter(([key]) => key !== LEAD_JOURNEY_FIELD)

  return (
    <Sheet open={lead != null} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="sm:max-w-md">
        {lead ? (
          <>
            <SheetHeader>
              <div className="flex items-center justify-between gap-2">
                <SheetTitle className="truncate">{lead.name || 'Unknown'}</SheetTitle>
                <Badge variant="outline">{SOURCE_LABEL[lead.source] ?? SOURCE_LABEL.manual}</Badge>
              </div>
              <p className="text-muted-foreground pt-1 text-xs">
                {stageMeta?.name ?? lead.stage} · Updated {timeAgo(lead.updatedAt)}
              </p>
            </SheetHeader>

            <Tabs defaultValue="details" className="flex min-h-0 flex-1 flex-col">
              <TabsList className="mx-4 mt-1">
                <TabsTrigger value="details" className="flex-1">
                  Details
                </TabsTrigger>
                <TabsTrigger value="notes" className="flex-1">
                  Notes
                </TabsTrigger>
                <TabsTrigger value="activity" className="flex-1">
                  Activity
                </TabsTrigger>
              </TabsList>

              <div className="min-h-0 flex-1 overflow-y-auto">
                <TabsContent value="details" className="space-y-4 p-4">
                  {lead.contactId ? (
                    <div className="space-y-2">
                      <Button
                        variant="outline"
                        className="w-full"
                        onClick={() => navigate(`/contacts/${lead.contactId}`)}
                      >
                        <CheckCircle2 />
                        Contact created — open contact
                      </Button>
                      <Button
                        variant="outline"
                        className="w-full"
                        disabled={openInbox.isPending}
                        onClick={() =>
                          openInbox.mutate(lead.contactId as string, {
                            onSuccess: (conv) => navigate(`/inbox?c=${encodeURIComponent(conv.id)}`),
                            onError: (err) =>
                              toast.error('Could not open inbox', {
                                description: err instanceof Error ? err.message : undefined,
                              }),
                          })
                        }
                      >
                        {openInbox.isPending ? <Loader2 className="animate-spin" /> : <MessageSquare />}
                        Open inbox
                      </Button>
                    </div>
                  ) : canConvert ? (
                    <Button className="w-full" onClick={() => onConvert(lead)}>
                      <UserPlus />
                      Add to contact
                    </Button>
                  ) : null}

                  <div className="space-y-1.5">
                    <Label htmlFor="lead-name-edit">Name</Label>
                    <Input
                      id="lead-name-edit"
                      value={lead.name ?? ''}
                      placeholder="Unknown"
                      onChange={(e) => schedule(lead.id, { name: e.target.value || null })}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="lead-phone">Phone</Label>
                    <div className="relative">
                      <Phone className="text-muted-foreground pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2" />
                      <Input
                        id="lead-phone"
                        value={lead.phone ?? ''}
                        placeholder="+91 … (optional — IG leads use a synthetic id)"
                        className="pl-8"
                        onChange={(e) => schedule(lead.id, { phone: e.target.value || null })}
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="lead-email">Email</Label>
                    <div className="relative">
                      <Mail className="text-muted-foreground pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2" />
                      <Input
                        id="lead-email"
                        value={lead.email ?? ''}
                        placeholder="name@company.com"
                        className="pl-8"
                        onChange={(e) => schedule(lead.id, { email: e.target.value || null })}
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label>Board</Label>
                    <div className="flex flex-wrap gap-1">
                      {stages.map((s) => {
                        const active = lead.stageId === s.id
                        return (
                          <Button
                            key={s.id}
                            type="button"
                            size="xs"
                            variant={active ? 'default' : 'outline'}
                            onClick={() => {
                              if (lead.stageId === s.id) return
                              schedule(lead.id, { stageId: s.id }, true)
                            }}
                          >
                            {s.name}
                            {s.isFinal ? ' · Final' : ''}
                          </Button>
                        )
                      })}
                    </div>
                  </div>

                  {lead.origin ? (
                    <div className="space-y-1.5 rounded-lg border p-3">
                      <p className="flex items-center gap-1.5 text-xs font-semibold">
                        <ChannelIcon channel="instagram" className="size-3.5" />
                        Original Instagram comment
                      </p>
                      <div className="flex gap-3">
                        {lead.origin.postThumbnailUrl ? (
                          <img
                            src={lead.origin.postThumbnailUrl}
                            alt=""
                            className="size-16 shrink-0 rounded-xl border object-cover"
                          />
                        ) : null}
                        <div className="min-w-0">
                          <p className="text-sm font-semibold">@{lead.origin.username}</p>
                          {lead.origin.commentText ? (
                            <p className="text-muted-foreground mt-1 text-xs leading-relaxed whitespace-pre-wrap">
                              {lead.origin.commentText}
                            </p>
                          ) : null}
                          {lead.origin.commentedAt ? (
                            <p className="text-muted-foreground mt-2 text-[11px]">
                              {timeAgo(lead.origin.commentedAt)}
                            </p>
                          ) : null}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <p className="text-muted-foreground text-sm">No Instagram origin on this lead.</p>
                  )}

                  <div className="space-y-1.5">
                    <Label htmlFor="lead-requirement">Requirement</Label>
                    <Textarea
                      id="lead-requirement"
                      value={lead.requirement}
                      rows={4}
                      onChange={(e) => schedule(lead.id, { requirement: e.target.value })}
                    />
                  </div>

                  {lead.contactId ? <ContactLeadJourneyPanel contactId={lead.contactId} /> : null}

                  {extraFields.length > 0 ? (
                    <div className="space-y-2">
                      <p className="text-xs font-semibold">Custom fields</p>
                      <dl className="space-y-1.5">
                        {extraFields.map(([key, value]) => (
                          <div key={key} className="flex justify-between gap-3 text-sm">
                            <dt className="text-muted-foreground">{labelForCustomFieldKey(key)}</dt>
                            <dd className="text-right break-all">{formatCustomFieldValue(value)}</dd>
                          </div>
                        ))}
                      </dl>
                    </div>
                  ) : null}
                </TabsContent>

                <TabsContent value="notes" className="space-y-3 p-4">
                  <Textarea
                    value={lead.notes}
                    onChange={(e) => schedule(lead.id, { notes: e.target.value })}
                    placeholder="Internal notes…"
                    rows={8}
                  />
                </TabsContent>

                <TabsContent value="activity" className="p-4">
                  {lead.activity.length === 0 ? (
                    <p className="text-muted-foreground text-sm">No activity yet.</p>
                  ) : (
                    <ol className="space-y-3">
                      {lead.activity.map((entry) => (
                        <li key={entry.id} className="flex gap-3">
                          <div className="bg-primary mt-1.5 size-1.5 shrink-0 rounded-full" />
                          <div className="min-w-0">
                            <p className="text-sm">{entry.text}</p>
                            <p className="text-muted-foreground text-xs">{timeAgo(entry.at)}</p>
                          </div>
                        </li>
                      ))}
                    </ol>
                  )}
                </TabsContent>
              </div>
            </Tabs>
          </>
        ) : null}
      </SheetContent>
    </Sheet>
  )
}
