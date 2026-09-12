import { useEffect, useRef, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'

import {
  formatInstagramSyncProgress,
  readInstagramHasMore,
  writeInstagramHasMore,
  type InstagramSyncProgressPayload,
} from '@/lib/instagramSyncEvents'
import { applyMessageStatus } from '@/lib/messageMedia'
import { connectSocket } from '@/lib/socket'
import { profileResource } from '@/services/profile.service'
import {
  inboxQueryKeys,
  type ConversationMessage,
  type MessagesPage,
} from '@/services/realInbox.service'

export function useInboxRealtime(selectedConversationId: string | null) {
  const queryClient = useQueryClient()
  const { data: me } = profileResource.useGet()
  const workspaceId = me?.activeWorkspaceId || me?.workspaceId
  const selectedRef = useRef(selectedConversationId)
  useEffect(() => {
    selectedRef.current = selectedConversationId
  }, [selectedConversationId])

  const [instagramSyncing, setInstagramSyncing] = useState(false)
  const [instagramSyncHint, setInstagramSyncHint] = useState('')
  const [instagramHasMore, setInstagramHasMore] = useState(readInstagramHasMore)
  const [messengerSyncing, setMessengerSyncing] = useState(false)

  useEffect(() => {
    if (!workspaceId) return
    const socket = connectSocket(workspaceId)

    const invalidateList = () => {
      void queryClient.invalidateQueries({ queryKey: inboxQueryKeys.list })
    }
    const invalidateMessages = (conversationId: string) => {
      void queryClient.invalidateQueries({ queryKey: inboxQueryKeys.messages(conversationId) })
    }

    const onNewMessage = (payload: { conversationId?: string }) => {
      const conversationId = payload?.conversationId
      invalidateList()
      if (conversationId && conversationId === selectedRef.current) {
        invalidateMessages(conversationId)
      }
    }

    const onConversationUpdated = (payload: { conversationId?: string }) => {
      invalidateList()
      const conversationId = payload?.conversationId
      if (conversationId && conversationId === selectedRef.current) {
        invalidateMessages(conversationId)
      }
    }

    const onContactUpdated = () => invalidateList()

    const onMessageStatus = (payload: {
      messageId?: string
      status?: string
      clicked?: boolean
      errors?: Array<{ code?: number; title?: string; message?: string }>
    }) => {
      if (!payload?.messageId || !payload.status) return
      const err = payload.errors?.[0]
      const deliveryError = err
        ? [err.title || err.message, err.code != null ? `(${err.code})` : null].filter(Boolean).join(' ') ||
          undefined
        : undefined
      queryClient.setQueriesData<MessagesPage>({ queryKey: ['realInbox', 'messages'] }, (prev) => {
        if (!prev) return prev
        const next = applyMessageStatus(prev.messages, {
          messageId: payload.messageId!,
          status: payload.status!,
          clicked: payload.clicked,
          deliveryError,
        })
        if (next === prev.messages) return prev
        return { ...prev, messages: next as ConversationMessage[] }
      })
    }

    const onConversationEvent = (payload: { conversationId?: string }) => {
      if (payload?.conversationId && payload.conversationId === selectedRef.current) {
        invalidateMessages(payload.conversationId)
      }
    }

    const onInstagramSyncProgress = (payload: InstagramSyncProgressPayload) => {
      if (payload.phase === 'started') {
        setInstagramSyncing(true)
        setInstagramSyncHint(formatInstagramSyncProgress(payload))
      } else if (payload.phase === 'completed') {
        setInstagramSyncing(false)
        setInstagramSyncHint(formatInstagramSyncProgress(payload))
        const more = Boolean(payload.hasMore)
        setInstagramHasMore(more)
        writeInstagramHasMore(more)
        invalidateList()
      } else if (payload.phase === 'error') {
        setInstagramSyncing(false)
        setInstagramSyncHint(formatInstagramSyncProgress(payload))
      } else if (payload.message) {
        setInstagramSyncHint(payload.message)
      }
    }

    const onMessengerSyncProgress = (payload: { phase?: string }) => {
      if (payload.phase === 'started') setMessengerSyncing(true)
      if (payload.phase === 'completed' || payload.phase === 'error') {
        setMessengerSyncing(false)
        invalidateList()
      }
    }

    const onReconnect = () => {
      socket.emit('join-workspace', workspaceId)
      invalidateList()
      if (selectedRef.current) invalidateMessages(selectedRef.current)
    }

    socket.on('new_message', onNewMessage)
    socket.on('conversation_updated', onConversationUpdated)
    socket.on('contact_updated', onContactUpdated)
    socket.on('message_status', onMessageStatus)
    socket.on('conversation_event', onConversationEvent)
    socket.on('instagram_sync_progress', onInstagramSyncProgress)
    socket.on('messenger_sync_progress', onMessengerSyncProgress)
    socket.io.on('reconnect', onReconnect)

    return () => {
      socket.off('new_message', onNewMessage)
      socket.off('conversation_updated', onConversationUpdated)
      socket.off('contact_updated', onContactUpdated)
      socket.off('message_status', onMessageStatus)
      socket.off('conversation_event', onConversationEvent)
      socket.off('instagram_sync_progress', onInstagramSyncProgress)
      socket.off('messenger_sync_progress', onMessengerSyncProgress)
      socket.io.off('reconnect', onReconnect)
    }
  }, [queryClient, workspaceId])

  return { instagramSyncing, instagramSyncHint, instagramHasMore, messengerSyncing }
}
