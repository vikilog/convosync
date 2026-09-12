import { useEffect, useMemo, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Inbox as InboxIcon, Plug } from 'lucide-react'
import { toast } from 'sonner'

import { AddContactSheet } from '@/components/contacts/AddContactSheet'
import { ConversationList } from '@/components/inbox/ConversationList'
import { ChatThread } from '@/components/inbox/ChatThread'
import { ContactPanel } from '@/components/inbox/ContactPanel'
import { InboxNewChatPicker } from '@/components/inbox/InboxNewChatPicker'
import { useKeepAliveActivation, useKeepAliveActive } from '@/components/KeepAlive'
import { EmptyState } from '@/components/common/EmptyState'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent } from '@/components/ui/sheet'
import { Skeleton } from '@/components/ui/skeleton'
import { useConnectedInboxChannels } from '@/hooks/useConnectedInboxChannels'
import { useInboxRealtime } from '@/hooks/useInboxRealtime'
import { useInboxScope } from '@/hooks/useInboxScope'
import { useIsMobile } from '@/hooks/use-mobile'
import {
  consumePendingOpenInboxConversation,
  INBOX_OPEN_CONVERSATION_EVENT,
} from '@/lib/inboxEvents'
import { setActiveInboxConversationId, setInboxVisible } from '@/lib/inboxFocus'
import { isConversationInInboxScope, isInboxChannelAllowed } from '@/lib/inboxScope'
import { setNavUnread, sumUnreadForNav } from '@/lib/navUnread'
import { realContactsService } from '@/services/realContacts.service'
import { inboxQueryKeys, realInboxService, type InboxChannel } from '@/services/realInbox.service'
import { realIntegrationsService } from '@/services/realIntegrations.service'

function useMinWidth(px: number) {
  const [matches, setMatches] = useState(false)
  useEffect(() => {
    const mql = window.matchMedia(`(min-width: ${px}px)`)
    const onChange = () => setMatches(mql.matches)
    onChange()
    mql.addEventListener('change', onChange)
    return () => mql.removeEventListener('change', onChange)
  }, [px])
  return matches
}

export function InboxPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [searchParams] = useSearchParams()
  const deepLinkId = searchParams.get('c')
  const isMobile = useIsMobile()
  const isXl = useMinWidth(1280)
  const inboxTabActive = useKeepAliveActive()
  const inboxScope = useInboxScope()
  const { data: conversations = [], isLoading, isError, error } = realInboxService.useList()
  const channels = useConnectedInboxChannels(inboxScope)
  const [selectedId, setSelectedId] = useState<string | null>(deepLinkId)
  const [channelFilter, setChannelFilter] = useState<InboxChannel>('whatsapp')
  const [desktopPanelOpen, setDesktopPanelOpen] = useState(true)
  const [contactSheetOpen, setContactSheetOpen] = useState(false)
  const [mobilePane, setMobilePane] = useState<'list' | 'chat'>('list')
  const [newChatOpen, setNewChatOpen] = useState(false)
  const [addContactOpen, setAddContactOpen] = useState(false)
  const [pendingPhoneNumberId, setPendingPhoneNumberId] = useState<string | undefined>()
  const [pickerError, setPickerError] = useState<string | null>(null)
  const realtime = useInboxRealtime(selectedId)
  const syncInstagram = realIntegrationsService.useSyncInstagram()
  const syncMessenger = realIntegrationsService.useSyncMessenger()
  const openConversation = realInboxService.useOpenConversation()
  const sendInboxEmail = realInboxService.useSendInboxEmail()
  const createContact = realContactsService.useCreate()

  const scopedConversations = useMemo(
    () => conversations.filter((c) => isConversationInInboxScope(c, inboxScope)),
    [conversations, inboxScope]
  )
  const visibleChannels = useMemo(
    () => channels.connected.filter((ch) => isInboxChannelAllowed(ch, inboxScope)),
    [channels.connected, inboxScope]
  )

  useEffect(() => {
    if (deepLinkId) {
      setSelectedId(deepLinkId)
      setMobilePane('chat')
    }
  }, [deepLinkId])

  useEffect(() => {
    if (visibleChannels.length === 0) return
    if (!visibleChannels.includes(channelFilter)) {
      setChannelFilter(visibleChannels[0])
    }
  }, [visibleChannels, channelFilter])

  useEffect(() => {
    if (!scopedConversations.length) return
    if (selectedId && !scopedConversations.some((c) => c.id === selectedId)) {
      setSelectedId(null)
      setMobilePane('list')
    }
  }, [scopedConversations, selectedId])

  useEffect(() => {
    if (isMobile || selectedId || deepLinkId) return
    const first =
      scopedConversations.find((c) => c.channel === channelFilter) ?? scopedConversations[0] ?? null
    if (first) setSelectedId(first.id)
  }, [isMobile, selectedId, scopedConversations, channelFilter, deepLinkId])

  /** Selected chat only counts as "reading" while Inbox tab is visible (KeepAlive). */
  const viewingConversationId = inboxTabActive ? selectedId : null

  useKeepAliveActivation(() => {
    void queryClient.invalidateQueries({ queryKey: inboxQueryKeys.list })
    if (selectedId) {
      void queryClient.invalidateQueries({ queryKey: inboxQueryKeys.messages(selectedId) })
    }
  })

  useEffect(() => {
    setInboxVisible(inboxTabActive)
  }, [inboxTabActive])

  useEffect(() => {
    setActiveInboxConversationId(selectedId ?? '')
  }, [selectedId])

  useEffect(() => () => setInboxVisible(false), [])

  useEffect(() => {
    const openConversation = (conversationId: string) => {
      setSelectedId(conversationId)
      setMobilePane('chat')
    }
    const pending = consumePendingOpenInboxConversation()
    if (pending) openConversation(pending)
    const onOpen = (event: Event) => {
      const conversationId = (event as CustomEvent<{ conversationId: string }>).detail?.conversationId
      if (!conversationId) return
      consumePendingOpenInboxConversation()
      openConversation(conversationId)
    }
    window.addEventListener(INBOX_OPEN_CONVERSATION_EVENT, onOpen)
    return () => window.removeEventListener(INBOX_OPEN_CONVERSATION_EVENT, onOpen)
  }, [])

  useEffect(() => {
    setNavUnread('inboxUnread', sumUnreadForNav(scopedConversations, viewingConversationId))
  }, [scopedConversations, viewingConversationId])

  const activeConversation = scopedConversations.find((c) => c.id === selectedId) ?? null

  const selectOpened = (id: string, channel?: InboxChannel) => {
    setSelectedId(id)
    setMobilePane('chat')
    if (channel) setChannelFilter(channel)
    setNewChatOpen(false)
    setAddContactOpen(false)
  }

  if (isLoading || channels.isLoading) {
    return (
      <div className="flex h-full min-h-0 flex-1 items-center justify-center p-6">
        <Skeleton className="h-full w-full" />
      </div>
    )
  }

  if (isError) {
    return (
      <div className="border-destructive/20 bg-destructive/10 text-destructive m-4 rounded-xl border p-4 text-sm">
        Couldn't load conversations: {error instanceof Error ? error.message : 'Unknown error'}
      </div>
    )
  }

  if (visibleChannels.length === 0) {
    return (
      <EmptyState
        icon={Plug}
        title="Connect a channel first"
        description="Connect WhatsApp, Instagram, or Messenger to get started."
        className="h-full rounded-none border-none"
        action={
          <Button onClick={() => navigate('/integrations')}>
            <Plug />
            Go to Integrations
          </Button>
        }
      />
    )
  }

  const list = (
    <ConversationList
      conversations={scopedConversations}
      selectedId={activeConversation?.id ?? null}
      onSelect={(id) => {
        setSelectedId(id)
        setMobilePane('chat')
      }}
      connectedChannels={visibleChannels}
      channelFilter={channelFilter}
      onChannelFilterChange={setChannelFilter}
      instagramConnected={channels.instagramConnected}
      messengerConnected={channels.messengerConnected}
      instagramSyncing={realtime.instagramSyncing || syncInstagram.isPending}
      instagramSyncHint={realtime.instagramSyncHint}
      instagramHasMore={realtime.instagramHasMore}
      onSyncInstagram={(opts) => syncInstagram.mutate(opts)}
      messengerSyncing={realtime.messengerSyncing || syncMessenger.isPending}
      onSyncMessenger={() => syncMessenger.mutate()}
      whatsappAccounts={channels.whatsappAccounts}
      onNewChat={() => {
        setPickerError(null)
        setNewChatOpen(true)
      }}
    />
  )

  const thread = activeConversation ? (
    <ChatThread
      conversation={activeConversation}
      onToggleContactPanel={() => {
        if (isXl) setDesktopPanelOpen((v) => !v)
        else setContactSheetOpen((v) => !v)
      }}
      onBack={isMobile ? () => setMobilePane('list') : undefined}
      onNewEmail={() => {
        setPickerError(null)
        setChannelFilter('email')
        setNewChatOpen(true)
      }}
      whatsappAccounts={channels.whatsappAccounts}
      instagramAccounts={channels.instagramAccounts}
      messengerAccounts={channels.messengerAccounts}
      telegramAccounts={channels.telegramAccounts}
    />
  ) : (
    <EmptyState
      icon={InboxIcon}
      title="Select a conversation"
      description="Pick a chat from the list, or wait for new messages to arrive."
      className="h-full rounded-none border-none"
    />
  )

  const contact = activeConversation ? (
    <ContactPanel
      conversation={activeConversation}
      onClose={() => {
        setDesktopPanelOpen(false)
        setContactSheetOpen(false)
      }}
    />
  ) : null

  const chrome = (
    <>
      <InboxNewChatPicker
        open={newChatOpen}
        onOpenChange={setNewChatOpen}
        initialChannel={channelFilter === 'email' ? 'email' : 'whatsapp'}
        emailReady={channels.emailReady}
        whatsappAccounts={channels.whatsappAccounts}
        error={pickerError}
        onSelectContact={async (contactId, phoneNumberId) => {
          setPickerError(null)
          try {
            const conv = await openConversation.mutateAsync({ contactId, phoneNumberId })
            selectOpened(conv.id, 'whatsapp')
          } catch (err) {
            const message = err instanceof Error ? err.message : 'Could not start chat'
            setPickerError(message)
            throw err
          }
        }}
        onSendEmail={async (payload) => {
          setPickerError(null)
          try {
            const result = await sendInboxEmail.mutateAsync(payload)
            if (!result.conversation?.id) throw new Error('Email sent but conversation was not returned')
            selectOpened(result.conversation.id, 'email')
          } catch (err) {
            const message = err instanceof Error ? err.message : 'Could not send email'
            setPickerError(message)
            throw err
          }
        }}
        onAddNewContact={(phoneNumberId) => {
          setPendingPhoneNumberId(phoneNumberId)
          setNewChatOpen(false)
          setAddContactOpen(true)
        }}
      />
      <AddContactSheet
        open={addContactOpen}
        onOpenChange={setAddContactOpen}
        trigger={null}
        onAdd={(input) => {
          createContact.mutate(
            { name: input.name, phone: input.phone, email: input.email, tags: input.tags },
            {
              onSuccess: (contactRow) => {
                void openConversation
                  .mutateAsync({ contactId: contactRow.id, phoneNumberId: pendingPhoneNumberId })
                  .then((conv) => selectOpened(conv.id, 'whatsapp'))
                  .catch((err) =>
                    toast.error('Contact saved, but chat could not be opened', {
                      description: err instanceof Error ? err.message : 'Unknown error',
                    })
                  )
              },
              onError: (err) =>
                toast.error('Could not add contact', {
                  description: err instanceof Error ? err.message : 'Unknown error',
                }),
            }
          )
        }}
      />
    </>
  )

  if (isMobile) {
    return (
      <div className="flex h-full min-h-0 flex-1 overflow-hidden">
        {mobilePane === 'list' ? <div className="min-w-0 flex-1">{list}</div> : thread}
        <Sheet open={Boolean(contactSheetOpen && mobilePane === 'chat' && contact)} onOpenChange={setContactSheetOpen}>
          <SheetContent side="right" className="w-80 p-0 sm:max-w-sm" showCloseButton={false}>
            {contact}
          </SheetContent>
        </Sheet>
        {chrome}
      </div>
    )
  }

  return (
    <div className="flex h-full min-h-0 flex-1 overflow-hidden">
      <div className="w-80 min-w-0 shrink-0 overflow-hidden">{list}</div>
      {thread}
      {desktopPanelOpen && contact && isXl ? <div className="w-80 shrink-0">{contact}</div> : null}
      <Sheet open={Boolean(contactSheetOpen && contact && !isXl)} onOpenChange={setContactSheetOpen}>
        <SheetContent side="right" className="w-80 p-0 sm:max-w-sm" showCloseButton={false}>
          {contact}
        </SheetContent>
      </Sheet>
      {chrome}
    </div>
  )
}
