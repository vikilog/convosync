import { useEffect, useMemo, useRef } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import {
  ArrowLeft,
  Bot,
  Info,
  Loader2,
  Pause,
  Play,
  Sparkles,
  Trash2,
  User,
  UserCircle,
  Workflow,
} from 'lucide-react'
import { toast } from 'sonner'

import { AutomationWaitingBanner } from '@/components/inbox/AutomationWaitingBanner'
import { ContactAvatar } from '@/components/inbox/ContactAvatar'
import { InboxComposer } from '@/components/inbox/InboxComposer'
import { MessageRow } from '@/components/inbox/MessageRow'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { CHANNEL_LABEL, ChannelIcon } from '@/components/channel-icon'
import { useConfirm } from '@/components/common/ConfirmDialogProvider'
import { useAuth } from '@/context/AuthContext'
import { conversationEventLabel, mergeMessagesAndEvents } from '@/lib/conversationEvents'
import { contactHandleLabel } from '@/lib/contactChannel'
import {
  inboxChannelLineLabel,
  windowAccountLabel,
  type NamedInboxAccount,
  type WhatsAppLineAccount,
} from '@/lib/inboxLineLabels'
import { patchInboxMessages, pendingAgentMessage } from '@/lib/inboxOptimistic'
import { friendlySendError } from '@/lib/inboxSendError'
import { formatBubbleTime, groupMessagesByDate } from '@/lib/inboxTime'
import { mediaKindFromFile } from '@/lib/telegramMediaLimits'
import { realAutomationsService } from '@/services/realAutomations.service'
import { realContactsService } from '@/services/realContacts.service'
import {
  inboxQueryKeys,
  isAiHandlingAssignee,
  realInboxService,
  type Conversation,
  type ConversationStatus,
} from '@/services/realInbox.service'

interface ChatThreadProps {
  conversation: Conversation
  onToggleContactPanel: () => void
  onBack?: () => void
  onNewEmail?: () => void
  whatsappAccounts?: WhatsAppLineAccount[]
  instagramAccounts?: NamedInboxAccount[]
  messengerAccounts?: NamedInboxAccount[]
  telegramAccounts?: NamedInboxAccount[]
}

const STATUS_OPTIONS: { value: ConversationStatus; label: string; dotClass: string }[] = [
  { value: 'open', label: 'Open', dotClass: 'bg-channel-green' },
  { value: 'pending', label: 'Pending', dotClass: 'bg-amber-500' },
  { value: 'resolved', label: 'Resolved', dotClass: 'bg-muted-foreground' },
]

function showSendError(err: unknown) {
  const { title, description } = friendlySendError(err)
  toast.error(title, { description, duration: 6000 })
}

export function ChatThread({
  conversation,
  onToggleContactPanel,
  onBack,
  onNewEmail,
  whatsappAccounts = [],
  instagramAccounts = [],
  messengerAccounts = [],
  telegramAccounts = [],
}: ChatThreadProps) {
  const confirm = useConfirm()
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const { data, isLoading } = realInboxService.useMessages(conversation.id)
  const messages = data?.messages ?? []
  const hasMoreOlder = Boolean(data?.hasMore)
  const timeline = useMemo(() => mergeMessagesAndEvents(data?.messages ?? [], data?.events ?? []), [data])
  const messageGroups = useMemo(() => groupMessagesByDate(timeline), [timeline])
  const bottomRef = useRef<HTMLDivElement>(null)
  const lastMessageId = data?.messages[data.messages.length - 1]?.id
  const loadOlder = realInboxService.useLoadOlderMessages()

  useEffect(() => {
    if (isLoading) return
    queryClient.setQueryData<Conversation[]>(inboxQueryKeys.list, (prev) =>
      prev?.map((c) => (c.id === conversation.id ? { ...c, unreadCount: 0 } : c))
    )
  }, [conversation.id, isLoading, queryClient])

  useEffect(() => {
    if (isLoading || loadOlder.isPending) return
    bottomRef.current?.scrollIntoView({ block: 'end' })
  }, [conversation.id, isLoading, lastMessageId, loadOlder.isPending])

  const sendMessage = realInboxService.useSendMessage()
  const sendMedia = realInboxService.useSendMedia()
  const sendCarousel = realInboxService.useSendCarousel()
  const sendTemplate = realInboxService.useSendTemplate()
  const journeyProgress = realAutomationsService.useContactProgress(
    conversation.channel === 'whatsapp' || conversation.channel === 'instagram'
      ? conversation.contactId
      : undefined,
    conversation.channel === 'instagram' ? 'instagram' : 'whatsapp'
  )
  const resendMessage = realInboxService.useResendMessage()
  const setStatus = realInboxService.useSetStatus()
  const setAssignee = realInboxService.useSetAssignee()
  const deleteConversation = realInboxService.useDelete()
  const takeover = realInboxService.useTakeover()
  const releaseToAi = realInboxService.useReleaseToAi()
  const setAutomationPaused = realContactsService.useSetAutomationPaused()
  const { data: members = [] } = realInboxService.useTeamMembers()
  const { data: assignableAgents = [] } = realInboxService.useAssignableAgents()
  const { data: automations = [] } = realInboxService.useAutomations(conversation.channel)

  const assigneeLabel = useMemo(() => {
    if (conversation.assigneeType === 'user') return conversation.agent?.name ?? 'Unassigned'
    if (isAiHandlingAssignee(conversation.assigneeType)) {
      return assignableAgents.find((a) => a.id === conversation.assigneeId)?.name ?? 'AI agent'
    }
    if (conversation.assigneeType === 'journey') {
      return automations.find((j) => j.id === conversation.assigneeId)?.name ?? 'Automation'
    }
    return 'Unassigned'
  }, [conversation.assigneeType, conversation.assigneeId, conversation.agent, assignableAgents, automations])

  const patchMessages = (updater: Parameters<typeof patchInboxMessages>[2]) =>
    patchInboxMessages(queryClient, conversation.id, updater)

  const draftMessage = (
    pendingId: string,
    content: string,
    type: string,
    metadata: Parameters<typeof pendingAgentMessage>[0]['metadata']
  ) =>
    pendingAgentMessage({
      pendingId,
      conversationId: conversation.id,
      senderName: user?.name ?? 'Agent',
      content,
      type,
      metadata,
    })

  const send = async (content: string) => {
    if (!content.trim()) return
    const pendingId = `pending-${Date.now()}`
    patchMessages((prev) => [...prev, draftMessage(pendingId, content.trim(), 'text', null)])
    try {
      const sent = await sendMessage.mutateAsync({
        conversationId: conversation.id,
        content: content.trim(),
      })
      patchMessages((prev) => prev.map((m) => (m.id === pendingId ? sent : m)))
    } catch (err) {
      patchMessages((prev) => prev.filter((m) => m.id !== pendingId))
      showSendError(err)
      throw err
    }
  }

  const sendMediaMessage = async (file: File, caption?: string) => {
    const pendingId = `pending-${Date.now()}`
    const preview = URL.createObjectURL(file)
    const kind = mediaKindFromFile(file)
    patchMessages((prev) => [
      ...prev,
      draftMessage(pendingId, caption || file.name, kind, {
        mimeType: file.type,
        fileName: file.name,
        caption,
        mediaUrl: preview,
      }),
    ])
    try {
      const sent = await sendMedia.mutateAsync({ conversationId: conversation.id, file, caption })
      patchMessages((prev) =>
        prev.map((m) =>
          m.id === pendingId ? { ...sent, metadata: { ...(sent.metadata ?? {}), mediaUrl: preview } } : m
        )
      )
    } catch (err) {
      patchMessages((prev) => prev.filter((m) => m.id !== pendingId))
      URL.revokeObjectURL(preview)
      showSendError(err)
      throw err
    }
  }

  const sendCarouselMessage = async (files: File[], caption?: string) => {
    const pendingId = `pending-${Date.now()}`
    patchMessages((prev) => [
      ...prev,
      draftMessage(pendingId, caption || `Album (${files.length} items)`, 'carousel', {
        caption,
        items: files.map((f) => ({ mimeType: f.type, fileName: f.name })),
      }),
    ])
    try {
      const sent = await sendCarousel.mutateAsync({ conversationId: conversation.id, files, caption })
      patchMessages((prev) => prev.map((m) => (m.id === pendingId ? sent : m)))
    } catch (err) {
      patchMessages((prev) => prev.filter((m) => m.id !== pendingId))
      showSendError(err)
      throw err
    }
  }

  const sendTemplateMessage = async (
    templateId: string,
    variables: string[],
    headerMediaFile?: File | null
  ) => {
    try {
      await sendTemplate.mutateAsync({
        conversationId: conversation.id,
        templateId,
        variables,
        headerMediaFile,
      })
    } catch (err) {
      showSendError(err)
      throw err
    }
  }

  const deleteThread = async () => {
    const ok = await confirm({
      title: `Delete conversation with "${conversation.contact.name}"?`,
      description: 'This removes the entire message thread. This action cannot be undone.',
      confirmLabel: 'Delete',
      destructive: true,
    })
    if (!ok) return
    deleteConversation.mutate(conversation.id)
  }

  const resend = (messageId: string) => {
    resendMessage.mutate(
      { conversationId: conversation.id, messageId },
      { onError: (err) => showSendError(err) }
    )
  }

  const oldestId = messages[0]?.id

  return (
    <div className="flex h-full min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
      <div className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-b px-4 py-3">
        <div className="flex min-w-0 items-center gap-3">
          {onBack ? (
            <Button variant="ghost" size="icon-sm" onClick={onBack} aria-label="Back to conversations">
              <ArrowLeft />
            </Button>
          ) : null}
          <ContactAvatar name={conversation.contact.name} src={conversation.contact.avatar} />
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold">{conversation.contact.name}</p>
            <p className="text-muted-foreground flex items-center gap-1 text-xs">
              <ChannelIcon channel={conversation.channel} className="size-3" />
              {inboxChannelLineLabel({
                channel: conversation.channel,
                channelAccountId: conversation.channelAccountId,
                handle: contactHandleLabel(conversation.contact.phone),
                email: conversation.contact.email,
                whatsappAccounts,
                instagramAccounts,
                messengerAccounts,
                telegramAccounts,
              }) || CHANNEL_LABEL[conversation.channel]}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="max-w-40 gap-1.5">
                <UserCircle className="size-3.5 shrink-0" />
                <span className="truncate">{assigneeLabel}</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuItem
                onClick={() =>
                  setAssignee.mutate({
                    conversationId: conversation.id,
                    assigneeType: null,
                    assigneeId: null,
                  })
                }
              >
                Unassigned
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuLabel className="text-muted-foreground text-xs font-normal">
                Team
              </DropdownMenuLabel>
              {members.map((member) => (
                <DropdownMenuItem
                  key={member.userId}
                  onClick={() =>
                    setAssignee.mutate({
                      conversationId: conversation.id,
                      assigneeType: 'user',
                      assigneeId: member.userId,
                    })
                  }
                >
                  {member.name}
                </DropdownMenuItem>
              ))}
              <DropdownMenuSeparator />
              <DropdownMenuLabel className="text-muted-foreground text-xs font-normal">
                Automation
              </DropdownMenuLabel>
              <DropdownMenuSub>
                <DropdownMenuSubTrigger>
                  <Sparkles className="size-3.5" />
                  AI Agent
                </DropdownMenuSubTrigger>
                <DropdownMenuSubContent>
                  {assignableAgents.length === 0 ? (
                    <p className="text-muted-foreground px-2 py-1.5 text-sm">No published AI agents</p>
                  ) : (
                    assignableAgents.map((agent) => (
                      <DropdownMenuItem
                        key={agent.id}
                        onClick={() =>
                          setAssignee.mutate({
                            conversationId: conversation.id,
                            assigneeType: 'ai_agent',
                            assigneeId: agent.id,
                          })
                        }
                      >
                        {agent.name}
                      </DropdownMenuItem>
                    ))
                  )}
                </DropdownMenuSubContent>
              </DropdownMenuSub>
              {conversation.channel === 'whatsapp' || conversation.channel === 'instagram' ? (
                <DropdownMenuSub>
                  <DropdownMenuSubTrigger>
                    <Workflow className="size-3.5" />
                    {CHANNEL_LABEL[conversation.channel]} Automation
                  </DropdownMenuSubTrigger>
                  <DropdownMenuSubContent>
                    {automations.length === 0 ? (
                      <p className="text-muted-foreground px-2 py-1.5 text-sm">No published automations</p>
                    ) : (
                      automations.map((journey) => (
                        <DropdownMenuItem
                          key={journey.id}
                          onClick={() =>
                            setAssignee.mutate({
                              conversationId: conversation.id,
                              assigneeType: 'journey',
                              assigneeId: journey.id,
                            })
                          }
                        >
                          {journey.name}
                        </DropdownMenuItem>
                      ))
                    )}
                  </DropdownMenuSubContent>
                </DropdownMenuSub>
              ) : null}
            </DropdownMenuContent>
          </DropdownMenu>

          <Select
            value={conversation.status}
            onValueChange={(v) =>
              setStatus.mutate({ conversationId: conversation.id, status: v as ConversationStatus })
            }
          >
            <SelectTrigger size="sm" className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {STATUS_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  <span className={`inline-block size-1.5 rounded-full ${opt.dotClass}`} />
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button
            variant="outline"
            size="icon"
            onClick={() =>
              setAutomationPaused.mutate({
                id: conversation.contactId,
                paused: !conversation.contact.automationsPaused,
              })
            }
            aria-label={conversation.contact.automationsPaused ? 'Resume automation' : 'Pause automation'}
            title={conversation.contact.automationsPaused ? 'Resume automation' : 'Pause automation'}
          >
            {conversation.contact.automationsPaused ? <Play /> : <Pause />}
          </Button>

          <Button
            variant="outline"
            size="icon"
            onClick={() => void deleteThread()}
            aria-label="Delete conversation"
            title="Delete conversation"
          >
            <Trash2 />
          </Button>

          <Button
            variant="outline"
            size="icon"
            onClick={onToggleContactPanel}
            aria-label="Toggle contact details"
          >
            <Info />
          </Button>
        </div>
      </div>

      <ScrollArea className="min-h-0 flex-1">
        <div className="flex flex-col gap-3 p-4">
          {hasMoreOlder && oldestId ? (
            <div className="flex justify-center">
              <Button
                variant="ghost"
                size="sm"
                disabled={loadOlder.isPending}
                onClick={() => loadOlder.mutate({ conversationId: conversation.id, before: oldestId })}
              >
                {loadOlder.isPending ? <Loader2 className="size-3.5 animate-spin" /> : null}
                Load older messages
              </Button>
            </div>
          ) : null}
          {isLoading ? (
            <>
              <Skeleton className="h-10 w-2/3" />
              <Skeleton className="ml-auto h-10 w-2/3" />
            </>
          ) : timeline.length === 0 ? (
            <p className="text-muted-foreground py-10 text-center text-sm">No messages yet</p>
          ) : (
            messageGroups.map((group) => (
              <div key={group.dateKey} className="flex flex-col gap-3">
                <div className="flex justify-center py-1 select-none">
                  <span className="bg-muted text-muted-foreground rounded-full px-3 py-1 text-[11px] font-medium tracking-wide">
                    {group.label}
                  </span>
                </div>
                {group.messages.map((item) => {
                  if (item.kind === 'event') {
                    return (
                      <div key={`event:${item.event.id}`} className="flex justify-center py-1 select-none">
                        <span className="text-muted-foreground rounded-full px-3 py-1 text-[11px]">
                          {conversationEventLabel(item.event)} · {formatBubbleTime(item.event.createdAt)}
                        </span>
                      </div>
                    )
                  }
                  return (
                    <MessageRow
                      key={item.message.id}
                      message={item.message}
                      channel={conversation.channel}
                      resending={resendMessage.isPending}
                      onResend={() => resend(item.message.id)}
                    />
                  )
                })}
              </div>
            ))
          )}
          <div ref={bottomRef} />
        </div>
      </ScrollArea>

      {isAiHandlingAssignee(conversation.assigneeType) ? (
        <div className="mx-3 mb-1 flex items-center justify-between gap-2 rounded-xl border border-violet-200 bg-violet-50/80 px-3 py-2">
          <span className="inline-flex min-w-0 items-center gap-1.5 text-sm font-semibold text-violet-700">
            <Bot className="size-3.5 shrink-0" />
            <span className="truncate">AI is handling this chat</span>
          </span>
          <Button
            size="sm"
            variant="outline"
            disabled={takeover.isPending}
            onClick={() =>
              takeover.mutate(conversation.id, {
                onSuccess: () => toast.success('You took over this chat'),
                onError: (err) => showSendError(err),
              })
            }
          >
            {takeover.isPending ? (
              <Loader2 className="size-3.5 animate-spin" />
            ) : (
              <User className="size-3.5" />
            )}
            Take Over
          </Button>
        </div>
      ) : conversation.assigneeType === 'user' &&
        (conversation.assignedTo === user?.id || conversation.assigneeId === user?.id) ? (
        <div className="mx-3 mb-1 flex items-center justify-between gap-2 rounded-xl border border-sky-200 bg-sky-50/80 px-3 py-2">
          <span className="inline-flex min-w-0 items-center gap-1.5 text-sm font-semibold text-sky-700">
            <User className="size-3.5 shrink-0" />
            <span className="truncate">You're handling this chat</span>
          </span>
          <Button
            size="sm"
            variant="outline"
            disabled={releaseToAi.isPending}
            onClick={() =>
              releaseToAi.mutate(conversation.id, {
                onSuccess: () => toast.success('Released to AI'),
                onError: (err) => showSendError(err),
              })
            }
          >
            {releaseToAi.isPending ? (
              <Loader2 className="size-3.5 animate-spin" />
            ) : (
              <Bot className="size-3.5" />
            )}
            Release to AI
          </Button>
        </div>
      ) : null}

      <AutomationWaitingBanner
        progress={journeyProgress.data}
        channel={conversation.channel}
        automationsPaused={conversation.contact.automationsPaused}
      />

      <InboxComposer
        conversation={conversation}
        messages={messages}
        sending={sendMessage.isPending || sendMedia.isPending || sendCarousel.isPending}
        sendingTemplate={sendTemplate.isPending}
        accountWindowLabel={windowAccountLabel({
          channel: conversation.channel,
          channelAccountId: conversation.channelAccountId,
          instagramAccounts,
          messengerAccounts,
        })}
        onNewEmail={onNewEmail}
        onSendText={send}
        onSendTemplate={sendTemplateMessage}
        onSendMedia={sendMediaMessage}
        onSendCarousel={sendCarouselMessage}
      />
    </div>
  )
}
