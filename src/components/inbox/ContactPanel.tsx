import { useState } from 'react'
import { ChevronDown, Mail, Pencil, Phone, Sparkles, User, X } from 'lucide-react'

import { ContactAvatar } from '@/components/inbox/ContactAvatar'
import { ContactAutomationPanel } from '@/components/inbox/ContactAutomationPanel'
import { ContactInsightPanel } from '@/components/inbox/ContactInsightPanel'
import { ContactLeadJourneyPanel } from '@/components/inbox/ContactLeadJourneyPanel'
import { EditContactSheet } from '@/components/contacts/EditContactSheet'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { contactHandleLabel } from '@/lib/contactChannel'
import {
  formatCustomFieldValue,
  isNoFlag,
  isYesFlag,
  labelForCustomFieldKey,
  visibleCustomFieldEntries,
} from '@/lib/contactDisplay'
import { realContactsService } from '@/services/realContacts.service'
import { isAiHandlingAssignee, realInboxService, type Conversation } from '@/services/realInbox.service'

const JOURNEY_CHANNELS = ['whatsapp', 'instagram'] as const

interface ContactPanelProps {
  conversation: Conversation
  onClose?: () => void
}

function assignedLabel(conversation: Conversation, agentName?: string, automationName?: string) {
  if (conversation.assigneeType === 'user') return conversation.agent?.name ?? agentName ?? 'Assigned teammate'
  if (isAiHandlingAssignee(conversation.assigneeType)) return agentName ?? 'AI agent'
  if (conversation.assigneeType === 'journey' || conversation.assigneeType === 'rule_based') {
    return automationName ?? 'Automation'
  }
  return 'Unassigned'
}

export function ContactPanel({ conversation, onClose }: ContactPanelProps) {
  const { contact } = conversation
  const [editOpen, setEditOpen] = useState(false)
  const [profileOpen, setProfileOpen] = useState(true)
  const { data: detail } = realContactsService.useGet(contact.id)
  const custom = (detail?.customFields ?? {}) as Record<string, unknown>
  const extraFields = visibleCustomFieldEntries(custom)
  const { data: assignableAgents = [] } = realInboxService.useAssignableAgents()
  const { data: automations = [] } = realInboxService.useAutomations(conversation.channel)
  const setAssignee = realInboxService.useSetAssignee()
  const agentName = assignableAgents.find((a) => a.id === conversation.assigneeId)?.name
  const automationName = automations.find((j) => j.id === conversation.assigneeId)?.name
  const handle = contactHandleLabel(contact.phone) || contact.email || '—'
  const showIgProfile =
    conversation.channel === 'instagram' &&
    Boolean(
      custom.instagramBio ||
        custom.instagramFollowerCount ||
        custom.instagramVerified === 'yes' ||
        isYesFlag(custom.instagramVerified)
    )

  return (
    <div className="flex h-full w-full flex-col border-l">
      <div className="flex shrink-0 items-center justify-between border-b px-3 py-2.5">
        <p className="text-sm font-semibold">Contact & journey</p>
        {onClose ? (
          <Button variant="ghost" size="icon-sm" onClick={onClose} aria-label="Close contact details">
            <X />
          </Button>
        ) : null}
      </div>

      <Tabs defaultValue="profile" className="flex min-h-0 flex-1 flex-col">
        <TabsList className="mx-3 mt-3">
          <TabsTrigger value="profile" className="flex-1">
            <User />
            Profile
          </TabsTrigger>
          <TabsTrigger value="ai" className="flex-1">
            <Sparkles />
            AI Summary
          </TabsTrigger>
        </TabsList>

        <ScrollArea className="min-h-0 flex-1">
          <TabsContent value="profile" className="space-y-4 p-3">
            <div className="overflow-hidden rounded-xl border">
              <button
                type="button"
                onClick={() => setProfileOpen((o) => !o)}
                className="hover:bg-muted/40 flex w-full items-center gap-2 p-3 text-left"
                aria-expanded={profileOpen}
              >
                <ContactAvatar name={contact.name} src={contact.avatar} className="size-9" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">{contact.name}</p>
                  <p className="text-muted-foreground truncate font-mono text-[11px]">{handle}</p>
                </div>
                <ChevronDown
                  className={`text-muted-foreground size-4 shrink-0 transition-transform ${profileOpen ? 'rotate-180' : ''}`}
                />
              </button>

              {profileOpen ? (
                <div className="flex flex-col items-center border-t p-4 text-center">
                  <ContactAvatar name={contact.name} src={contact.avatar} className="mb-3 size-16" />
                  <div className="flex items-center gap-1.5">
                    <p className="text-sm font-semibold">{contact.name}</p>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      className="text-muted-foreground hover:text-foreground size-5"
                      onClick={() => setEditOpen(true)}
                      aria-label="Edit contact"
                    >
                      <Pencil className="size-3" />
                    </Button>
                  </div>
                  <p className="text-muted-foreground mt-0.5 font-mono text-xs">{handle}</p>
                  {contact.tags.length > 0 ? (
                    <div className="mt-3 flex flex-wrap justify-center gap-1.5">
                      {contact.tags.map((tag) => (
                        <Badge key={tag} variant="outline" className="uppercase">
                          {tag.replace(/_/g, ' ')}
                        </Badge>
                      ))}
                    </div>
                  ) : null}
                  {showIgProfile ? (
                    <div className="mt-4 w-full border-t pt-3 text-left">
                      {typeof custom.instagramBio === 'string' ? (
                        <p className="text-muted-foreground whitespace-pre-wrap text-xs leading-relaxed">
                          {custom.instagramBio}
                        </p>
                      ) : null}
                      <div className="text-muted-foreground mt-2 flex flex-wrap gap-2 text-xs font-medium">
                        {custom.instagramFollowerCount ? (
                          <span>{String(custom.instagramFollowerCount)} followers</span>
                        ) : null}
                        {custom.instagramFollowsCount ? (
                          <span>{String(custom.instagramFollowsCount)} following</span>
                        ) : null}
                        {custom.instagramMediaCount ? (
                          <span>{String(custom.instagramMediaCount)} posts</span>
                        ) : null}
                        {isYesFlag(custom.instagramVerified) ? (
                          <span className="text-sky-600">Verified</span>
                        ) : null}
                      </div>
                      {isYesFlag(custom.instagramFollowsBusiness) ||
                      isNoFlag(custom.instagramFollowsBusiness) ||
                      isYesFlag(custom.instagramBusinessFollowsUser) ||
                      isNoFlag(custom.instagramBusinessFollowsUser) ? (
                        <div className="text-muted-foreground mt-2 space-y-0.5 text-center text-[11px]">
                          {isYesFlag(custom.instagramFollowsBusiness) ||
                          isNoFlag(custom.instagramFollowsBusiness) ? (
                            <p>
                              {isYesFlag(custom.instagramFollowsBusiness)
                                ? 'Follows your business'
                                : 'Does not follow your business'}
                            </p>
                          ) : null}
                          {isYesFlag(custom.instagramBusinessFollowsUser) ||
                          isNoFlag(custom.instagramBusinessFollowsUser) ? (
                            <p>
                              {isYesFlag(custom.instagramBusinessFollowsUser)
                                ? 'Your business follows them'
                                : 'Your business does not follow them'}
                            </p>
                          ) : null}
                        </div>
                      ) : null}
                    </div>
                  ) : null}
                </div>
              ) : null}
            </div>

            <div className="space-y-2 rounded-xl border p-4">
              <p className="text-muted-foreground text-xs font-semibold tracking-wide uppercase">
                Quick info
              </p>
              {contact.phone ? (
                <p className="flex items-center gap-2 text-sm">
                  <Phone className="text-muted-foreground size-3.5" />
                  {contact.phone}
                </p>
              ) : null}
              {contact.email ? (
                <p className="flex items-center gap-2 text-sm">
                  <Mail className="text-muted-foreground size-3.5" />
                  {contact.email}
                </p>
              ) : null}
              {!contact.phone && !contact.email ? (
                <p className="text-muted-foreground text-sm">No contact details on file.</p>
              ) : null}
              {extraFields.length > 0 ? (
                <dl className="space-y-1.5 pt-1">
                  {extraFields.map(([key, value]) => (
                    <div key={key} className="flex items-start justify-between gap-3">
                      <dt className="text-muted-foreground text-xs">{labelForCustomFieldKey(key)}</dt>
                      <dd className="max-w-[60%] truncate text-right text-xs font-medium">
                        {formatCustomFieldValue(value)}
                      </dd>
                    </div>
                  ))}
                </dl>
              ) : null}
            </div>

            {JOURNEY_CHANNELS.includes(conversation.channel as (typeof JOURNEY_CHANNELS)[number]) ? (
              <ContactAutomationPanel
                contactId={contact.id}
                channel={conversation.channel as (typeof JOURNEY_CHANNELS)[number]}
                assignedJourneyId={conversation.assigneeType === 'journey' ? conversation.assigneeId : null}
                publishedJourneys={automations}
                automationsPaused={contact.automationsPaused}
                onAssignJourney={(journeyId) =>
                  setAssignee.mutate({
                    conversationId: conversation.id,
                    assigneeType: 'journey',
                    assigneeId: journeyId,
                  })
                }
              />
            ) : null}

            <ContactLeadJourneyPanel contactId={contact.id} />

            <Separator />

            <div className="space-y-1">
              <p className="text-muted-foreground text-xs font-semibold tracking-wide uppercase">
                Assigned to
              </p>
              <p className="text-sm">{assignedLabel(conversation, agentName, automationName)}</p>
            </div>
          </TabsContent>

          <TabsContent value="ai" className="p-3">
            <ContactInsightPanel contactId={contact.id} />
          </TabsContent>
        </ScrollArea>
      </Tabs>

      <EditContactSheet contactId={contact.id} open={editOpen} onOpenChange={setEditOpen} />
    </div>
  )
}
