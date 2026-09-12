import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ArrowLeft,
  Clock,
  GitBranch,
  Link2,
  Megaphone,
  MessageSquare,
  MessagesSquare,
  Phone,
  PhoneCall,
  PhoneMissed,
} from 'lucide-react'
import { toast } from 'sonner'

import { ContactCallHistory } from '@/components/contacts/ContactCallHistory'
import { ContactDetailHeader } from '@/components/contacts/ContactDetailHeader'
import { ContactChannelCard, ContactLinkedChannelsPanel } from '@/components/contacts/ContactLinkedChannelsPanel'
import { EditContactSheet } from '@/components/contacts/EditContactSheet'
import { ContactLeadJourneyPanel } from '@/components/inbox/ContactLeadJourneyPanel'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { displayNameForChannel, resolveContactChannel } from '@/lib/contactChannel'
import { formatCustomFieldValue, labelForCustomFieldKey, visibleCustomFieldEntries } from '@/lib/contactDisplay'
import {
  INTENT_CLASS,
  campaignStatusClass,
  formatCallDuration,
  formatDetailDate,
  toggleInSet,
} from '@/lib/contactDetailFormat'
import { callingService, type CallDirection, type CallStatus } from '@/services/calling.service'
import { realContactsService } from '@/services/realContacts.service'

function TabCountBadge({ count }: { count: number }) {
  return (
    <span className="bg-muted text-muted-foreground ml-0.5 rounded-full px-1.5 py-0.5 text-[11px] font-semibold tabular-nums">
      {count}
    </span>
  )
}

export function ContactDetailPage({ contactId, onBack }: { contactId: string; onBack: () => void }) {
  const navigate = useNavigate()
  const { data: overview, isLoading, isError, error, refetch } = realContactsService.useOverview(contactId)
  const setAutomationPaused = realContactsService.useSetAutomationPaused()
  const openInbox = realContactsService.useOpenInbox()
  const unlink = realContactsService.useUnlinkChannel()
  const { data: callsData, isLoading: callsLoading } = callingService.useCallsForContact(contactId)
  const [editOpen, setEditOpen] = useState(false)
  const [activeTab, setActiveTab] = useState<'overview' | 'calls' | 'campaigns' | 'channels' | 'comments'>(
    'overview'
  )
  const [callDirectionFilters, setCallDirectionFilters] = useState<Set<CallDirection>>(new Set())
  const [callStatusFilters, setCallStatusFilters] = useState<Set<CallStatus>>(new Set())

  if (isLoading) {
    return (
      <div className="space-y-4 p-6">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-36 w-full" />
        <Skeleton className="h-48 w-full" />
      </div>
    )
  }

  if (isError || !overview) {
    return (
      <div className="p-6">
        <Button variant="ghost" size="sm" onClick={onBack} className="mb-4">
          <ArrowLeft />
          Back to contacts
        </Button>
        <p className="text-destructive text-sm">{error instanceof Error ? error.message : 'Contact not found'}</p>
      </div>
    )
  }

  const contact = overview.contact
  const channels = overview.channels ?? []
  const campaigns = overview.campaigns ?? []
  const instagramComments = overview.instagramComments ?? []
  const hasInstagramChannel = channels.some((c) => c.channel === 'instagram')
  const calls = callsData?.entries ?? []
  const filteredCalls = calls.filter((call) => {
    if (callDirectionFilters.size > 0 && !callDirectionFilters.has(call.direction)) return false
    if (callStatusFilters.size > 0 && !callStatusFilters.has(call.status)) return false
    return true
  })
  const extraFields = visibleCustomFieldEntries(contact.customFields)
  const channel = contact.channel ?? resolveContactChannel(contact.phone)
  const displayEmail = contact.email?.trim() || channels.map((c) => c.email?.trim()).find(Boolean) || null
  const linkedHumanName =
    channels.find(
      (c) =>
        c.channel === 'whatsapp' &&
        c.name.trim() &&
        !c.name.trim().startsWith('@') &&
        !/^\d+$/.test(c.name.trim())
    )?.name ?? null
  const headerName = contact.name.trim().startsWith('@') && linkedHumanName ? linkedHumanName : contact.name
  const headerHandle = headerName !== contact.name ? displayNameForChannel(contact.name, contact.phone) : null
  const metrics = [
    { label: 'Campaigns', value: overview.stats.campaigns, icon: Megaphone, tone: 'bg-sky-50 text-sky-600' },
    { label: 'Journeys', value: overview.stats.journeys, icon: GitBranch, tone: 'bg-violet-50 text-violet-600' },
    {
      label: 'Conversations',
      value: overview.stats.conversations,
      icon: MessagesSquare,
      tone: 'bg-[#e6f7ec] text-channel-green',
    },
    {
      label: 'IG comments',
      value: overview.stats.instagramComments ?? 0,
      icon: MessageSquare,
      tone: 'bg-pink-50 text-pink-600',
    },
    { label: 'Bots', value: overview.stats.bots, icon: MessageSquare, tone: 'bg-amber-50 text-amber-600' },
  ]

  const answeredCalls = calls.filter((c) => c.status === 'answered')
  const callMetrics = [
    { label: 'Total calls', value: calls.length, icon: Phone, tone: 'bg-sky-50 text-sky-600' },
    { label: 'Answered', value: answeredCalls.length, icon: PhoneCall, tone: 'bg-[#e6f7ec] text-channel-green' },
    {
      label: 'Missed',
      value: calls.length - answeredCalls.length,
      icon: PhoneMissed,
      tone: 'bg-destructive/10 text-destructive',
    },
    {
      label: 'Avg. call duration',
      value: formatCallDuration(
        answeredCalls.length > 0
          ? Math.round(answeredCalls.reduce((sum, c) => sum + c.durationSeconds, 0) / answeredCalls.length)
          : 0
      ),
      icon: Clock,
      tone: 'bg-amber-50 text-amber-600',
    },
  ]

  const goInbox = (id: string) => {
    openInbox.mutate(id, {
      onSuccess: (conv) => navigate(`/inbox?c=${encodeURIComponent(conv.id)}`),
      onError: (err) =>
        toast.error('Could not open inbox', { description: err instanceof Error ? err.message : undefined }),
    })
  }

  return (
    <div className="flex h-full min-h-0 w-full flex-1 flex-col overflow-y-auto">
      <ContactDetailHeader
        contact={contact}
        headerName={headerName}
        headerHandle={headerHandle}
        channel={channel}
        displayEmail={displayEmail}
        inboxPending={openInbox.isPending}
        automationPending={setAutomationPaused.isPending}
        onBack={onBack}
        onInbox={() => goInbox(contact.id)}
        onToggleAutomation={() =>
          setAutomationPaused.mutate({ id: contact.id, paused: !contact.automationsPaused })
        }
        onEdit={() => setEditOpen(true)}
      />

      <div className="w-full p-6">
        <div className="flex flex-col gap-6">
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as typeof activeTab)}>
            <TabsList variant="line">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="calls">
                <Phone />
                Call history
                {calls.length > 0 ? <TabCountBadge count={calls.length} /> : null}
              </TabsTrigger>
              <TabsTrigger value="campaigns">
                <Megaphone />
                Campaigns
                {campaigns.length > 0 ? <TabCountBadge count={campaigns.length} /> : null}
              </TabsTrigger>
              <TabsTrigger value="channels">
                <Link2 />
                Channels
                {channels.length > 0 ? <TabCountBadge count={channels.length} /> : null}
              </TabsTrigger>
              {hasInstagramChannel ? (
                <TabsTrigger value="comments">
                  Comments
                  {instagramComments.length > 0 ? <TabCountBadge count={instagramComments.length} /> : null}
                </TabsTrigger>
              ) : null}
            </TabsList>
          </Tabs>

          <div className="min-w-0">
            {activeTab === 'overview' ? (
              <div className="space-y-5">
                <div>
                  <p className="text-muted-foreground mb-2.5 text-xs font-semibold tracking-wide uppercase">
                    Engagement
                  </p>
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
                    {metrics.map((m) => (
                      <Card key={m.label} size="sm">
                        <CardContent className="space-y-2">
                          <div className={`flex size-9 items-center justify-center rounded-xl ${m.tone}`}>
                            <m.icon className="size-4" />
                          </div>
                          <p className="text-muted-foreground text-xs font-semibold tracking-wide uppercase">
                            {m.label}
                          </p>
                          <p className="font-mono text-xl font-bold tabular-nums">{m.value}</p>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-muted-foreground mb-2.5 text-xs font-semibold tracking-wide uppercase">
                    Calling
                  </p>
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                    {callMetrics.map((m) => (
                      <Card key={m.label} size="sm">
                        <CardContent className="space-y-2">
                          <div className={`flex size-9 items-center justify-center rounded-xl ${m.tone}`}>
                            <m.icon className="size-4" />
                          </div>
                          <p className="text-muted-foreground text-xs font-semibold tracking-wide uppercase">
                            {m.label}
                          </p>
                          <p className="font-mono text-xl font-bold tabular-nums">{m.value}</p>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              </div>
            ) : null}

            {activeTab === 'calls' ? (
              <ContactCallHistory
                calls={calls}
                filteredCalls={filteredCalls}
                loading={callsLoading}
                directionFilters={callDirectionFilters}
                statusFilters={callStatusFilters}
                onToggleDirection={(value) => setCallDirectionFilters((prev) => toggleInSet(prev, value))}
                onToggleStatus={(value) => setCallStatusFilters((prev) => toggleInSet(prev, value))}
              />
            ) : null}

            {activeTab === 'campaigns' ? (
              campaigns.length === 0 ? (
                <p className="text-muted-foreground py-6 text-sm">Not included in any campaigns yet.</p>
              ) : (
                <ul className="divide-y">
                  {campaigns.map((c) => (
                    <li key={c.id}>
                      <button
                        type="button"
                        onClick={() => navigate('/campaigns')}
                        className="hover:bg-muted/40 flex w-full items-center justify-between gap-3 py-3 text-left"
                      >
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold">{c.title}</p>
                          {c.subtitle ? (
                            <p className="text-muted-foreground mt-0.5 truncate text-xs">{c.subtitle}</p>
                          ) : null}
                        </div>
                        <div className="shrink-0 text-right">
                          {c.status ? (
                            <Badge variant="outline" className={`uppercase ${campaignStatusClass(c.status)}`}>
                              {c.status}
                            </Badge>
                          ) : null}
                          <p className="text-muted-foreground mt-1 text-[11px]">{formatDetailDate(c.timestamp)}</p>
                        </div>
                      </button>
                    </li>
                  ))}
                </ul>
              )
            ) : null}

            {activeTab === 'comments' && hasInstagramChannel ? (
              instagramComments.length === 0 ? (
                <p className="text-muted-foreground py-6 text-sm">
                  No comments found for this Instagram username across posts.
                </p>
              ) : (
                <ul className="space-y-3 pt-3">
                  {instagramComments.map((c) => (
                    <li key={c.id}>
                      <button
                        type="button"
                        onClick={() => navigate('/social-listening')}
                        className="hover:bg-muted/40 flex w-full items-start gap-3 rounded-xl border p-3 text-left"
                      >
                        {c.postThumbnailUrl ? (
                          <img
                            src={c.postThumbnailUrl}
                            alt=""
                            className="bg-muted size-14 shrink-0 rounded-lg object-cover"
                          />
                        ) : null}
                        <div className="min-w-0 flex-1">
                          <p className="line-clamp-3 text-sm">{c.commentText}</p>
                          <div className="mt-2 flex flex-wrap items-center gap-1.5">
                            {c.intent ? (
                              <Badge
                                variant="outline"
                                className={`uppercase ${INTENT_CLASS[c.intent.toLowerCase()] ?? ''}`}
                              >
                                {c.intent}
                              </Badge>
                            ) : null}
                            {c.status ? (
                              <span className="text-muted-foreground text-[10px] font-semibold tracking-wide uppercase">
                                {c.status}
                              </span>
                            ) : null}
                            {c.commentedAt ? (
                              <span className="text-muted-foreground text-[11px]">{formatDetailDate(c.commentedAt)}</span>
                            ) : null}
                          </div>
                          {c.postCaption ? (
                            <p className="text-muted-foreground mt-1 line-clamp-2 text-xs">{c.postCaption}</p>
                          ) : null}
                        </div>
                      </button>
                    </li>
                  ))}
                </ul>
              )
            ) : null}

            {activeTab === 'channels' ? (
              <div className="space-y-5">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-muted-foreground text-xs font-semibold tracking-wide uppercase">
                    Linked channels
                  </p>
                  <ContactLinkedChannelsPanel contactId={contactId} onChanged={() => void refetch()} />
                </div>
                {channels.length === 0 ? (
                  <p className="text-muted-foreground text-sm">No linked channels.</p>
                ) : (
                  <div className="grid gap-3 sm:grid-cols-2">
                    {channels.map((row) => (
                      <ContactChannelCard
                        key={row.contactId}
                        row={row}
                        viewingId={contactId}
                        onOpen={(id) => navigate(`/contacts/${id}`)}
                        onInbox={goInbox}
                        onUnlink={(id) =>
                          unlink.mutate({ id: contactId, otherContactId: id }, { onSuccess: () => void refetch() })
                        }
                        inboxPending={openInbox.isPending}
                        unlinkPending={unlink.isPending}
                      />
                    ))}
                  </div>
                )}

                <ContactLeadJourneyPanel contactId={contactId} />

                {extraFields.length > 0 ? (
                  <div>
                    <p className="text-muted-foreground mb-2 text-xs font-semibold tracking-wide uppercase">
                      Custom fields
                    </p>
                    <dl className="space-y-2 rounded-xl border p-4">
                      {extraFields.map(([key, value]) => (
                        <div key={key} className="flex items-start justify-between gap-3">
                          <dt className="text-muted-foreground text-xs">{labelForCustomFieldKey(key)}</dt>
                          <dd className="max-w-[60%] truncate text-right text-sm">{formatCustomFieldValue(value)}</dd>
                        </div>
                      ))}
                    </dl>
                  </div>
                ) : null}
              </div>
            ) : null}
          </div>
        </div>
      </div>

      <EditContactSheet contactId={contact.id} open={editOpen} onOpenChange={setEditOpen} />
    </div>
  )
}
