/**
 * Global inbox socket listener: nav unread badge + toast/sound when not viewing that chat.
 */

import { useCallback, useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'

import { useInboxScope } from '@/hooks/useInboxScope'
import { dispatchOpenInboxConversation, INBOX_MESSAGE_NOTIFICATION_EVENT } from '@/lib/inboxEvents'
import { getViewingInboxConversationId, isViewingInboxConversation } from '@/lib/inboxFocus'
import { isConversationInInboxScope } from '@/lib/inboxScope'
import { playMessageNotifySound } from '@/lib/messageNotifySound'
import { setNavUnread, sumUnreadForNav } from '@/lib/navUnread'
import { connectSocket } from '@/lib/socket'
import { profileResource } from '@/services/profile.service'
import { inboxQueryKeys, realInboxService, type Conversation } from '@/services/realInbox.service'

type InboxToast = {
  conversationId: string
  contactName: string
  preview: string
}

function maybeDesktopNotify(title: string, body: string) {
  if (typeof Notification === 'undefined') return
  if (Notification.permission !== 'granted') return
  if (!document.hidden) return
  try {
    new Notification(title, { body, silent: true })
  } catch {
    // unsupported / blocked
  }
}

function clipPreview(preview: string) {
  return preview.length > 72 ? `${preview.slice(0, 69)}…` : preview
}

export function InboxRealtimeBridge() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const inboxScope = useInboxScope()
  const { data: me } = profileResource.useGet()
  const { data: conversations } = realInboxService.useList()
  const workspaceId = me?.activeWorkspaceId || me?.workspaceId

  useEffect(() => {
    if (!conversations) return
    const scoped = conversations.filter((c) => isConversationInInboxScope(c, inboxScope))
    setNavUnread('inboxUnread', sumUnreadForNav(scoped, getViewingInboxConversationId() || undefined))
  }, [conversations, inboxScope])

  const resolveContactName = useCallback(
    (conversationId: string, senderName?: string | null) => {
      const fromPayload = senderName?.trim()
      if (fromPayload) return fromPayload
      const list = queryClient.getQueryData<Conversation[]>(inboxQueryKeys.list)
      const conv = list?.find((row) => row.id === conversationId)
      return conv?.contact?.name?.trim() || conv?.contact?.phone?.trim() || 'New message'
    },
    [queryClient]
  )

  const showToast = useCallback(
    (next: InboxToast, withSound = true) => {
      const preview = clipPreview(next.preview)
      if (withSound) playMessageNotifySound()
      toast.custom(
        (id) => (
          <button
            type="button"
            className="bg-popover text-popover-foreground w-[min(100vw-2rem,20rem)] rounded-lg border p-3 text-left shadow-md"
            onClick={() => {
              toast.dismiss(id)
              navigate('/inbox')
              dispatchOpenInboxConversation(next.conversationId)
            }}
          >
            <div className="flex items-baseline justify-between gap-2">
              <p className="truncate text-sm font-semibold">{next.contactName}</p>
              <span className="text-muted-foreground shrink-0 text-[10px] font-medium uppercase">
                New
              </span>
            </div>
            <p className="text-muted-foreground mt-0.5 truncate text-xs">{preview}</p>
          </button>
        ),
        { duration: 4000 }
      )
      maybeDesktopNotify(next.contactName, preview)
    },
    [navigate]
  )

  useEffect(() => {
    if (!workspaceId) return
    const socket = connectSocket(workspaceId)

    const onNewMessage = (payload: {
      conversationId?: string
      message?: { sender?: string; content?: string; senderName?: string | null }
    }) => {
      const conversationId = payload.conversationId
      void queryClient.invalidateQueries({ queryKey: inboxQueryKeys.list })
      if (!conversationId) return

      const isIncoming = payload.message?.sender === 'contact'
      if (!isIncoming) return
      // KeepAlive keeps Inbox mounted — only skip when that chat is actually on screen
      if (isViewingInboxConversation(conversationId)) return

      const previewRaw = typeof payload.message?.content === 'string' ? payload.message.content.trim() : ''
      if (!previewRaw) return

      showToast({
        conversationId,
        contactName: resolveContactName(conversationId, payload.message?.senderName),
        preview: previewRaw,
      })
    }

    const onInboxChanged = () => {
      void queryClient.invalidateQueries({ queryKey: inboxQueryKeys.list })
    }

    const onReconnect = () => {
      socket.emit('join-workspace', workspaceId)
      void queryClient.invalidateQueries({ queryKey: inboxQueryKeys.list })
    }

    socket.on('new_message', onNewMessage)
    socket.on('conversation_updated', onInboxChanged)
    socket.on('conversation_deleted', onInboxChanged)
    socket.io.on('reconnect', onReconnect)

    return () => {
      socket.off('new_message', onNewMessage)
      socket.off('conversation_updated', onInboxChanged)
      socket.off('conversation_deleted', onInboxChanged)
      socket.io.off('reconnect', onReconnect)
    }
  }, [queryClient, resolveContactName, showToast, workspaceId])

  useEffect(() => {
    const onExternalToast = (event: Event) => {
      const detail = (event as CustomEvent<InboxToast>).detail
      if (!detail?.conversationId) return
      const preview = typeof detail.preview === 'string' ? detail.preview.trim() : ''
      if (!preview) return
      showToast({ ...detail, preview }, true)
    }
    window.addEventListener(INBOX_MESSAGE_NOTIFICATION_EVENT, onExternalToast)
    return () => window.removeEventListener(INBOX_MESSAGE_NOTIFICATION_EVENT, onExternalToast)
  }, [showToast])

  return null
}
