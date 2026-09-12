/**
 * Global team-chat socket listener: nav unread badge + toast/sound when not viewing that DM.
 */

import { useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'

import { useAuth } from '@/context/AuthContext'
import { playMessageNotifySound } from '@/lib/messageNotifySound'
import { connectSocket } from '@/lib/socket'
import { dispatchOpenTeamChatPeer, incrementTeamChatUnread } from '@/lib/teamChatEvents'
import { isViewingTeamChatPeer } from '@/lib/teamChatFocus'
import { profileResource } from '@/services/profile.service'
import {
  applyIncomingTeamChatMessage,
  applyIncomingTeamPresence,
  type TeamChatMessage,
} from '@/services/realTeamChat.service'

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

export function TeamChatRealtimeBridge() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { user } = useAuth()
  const { data: me } = profileResource.useGet()
  const workspaceId = me?.activeWorkspaceId || me?.workspaceId
  const selfId = user?.id ?? ''

  useEffect(() => {
    if (!workspaceId || !selfId) return
    const socket = connectSocket(workspaceId)

    const openPeer = (peerUserId: string) => {
      navigate('/team-chat')
      dispatchOpenTeamChatPeer(peerUserId)
    }

    const onMsg = (payload: TeamChatMessage) => {
      if (!payload?.sender?.id) return
      applyIncomingTeamChatMessage(queryClient, payload, selfId)
      if (payload.sender.id === selfId) return

      const peerUserId = payload.sender.id
      if (isViewingTeamChatPeer(peerUserId) && !document.hidden) return

      incrementTeamChatUnread(peerUserId)

      const previewRaw = typeof payload.body === 'string' ? payload.body.trim() : ''
      if (!previewRaw) return

      const senderName = payload.sender.name?.trim() || 'Team mate'
      const preview = previewRaw.length > 72 ? `${previewRaw.slice(0, 69)}…` : previewRaw

      playMessageNotifySound()
      toast.custom(
        (id) => (
          <button
            type="button"
            className="bg-popover text-popover-foreground w-[min(100vw-2rem,20rem)] rounded-lg border p-3 text-left shadow-md"
            onClick={() => {
              toast.dismiss(id)
              openPeer(peerUserId)
            }}
          >
            <div className="flex items-baseline justify-between gap-2">
              <p className="truncate text-sm font-semibold">{senderName}</p>
              <span className="text-muted-foreground shrink-0 text-[10px] font-medium uppercase">
                Team
              </span>
            </div>
            <p className="text-muted-foreground mt-0.5 truncate text-xs">{preview}</p>
          </button>
        ),
        { duration: 4000 }
      )
      maybeDesktopNotify(senderName, preview)
    }

    const onPresence = (payload: { online?: Array<{ userId: string }> }) => {
      applyIncomingTeamPresence(queryClient, payload)
    }

    const onReconnect = () => {
      socket.emit('join-workspace', workspaceId)
    }

    socket.on('team_chat_message', onMsg)
    socket.on('team_presence', onPresence)
    socket.io.on('reconnect', onReconnect)

    return () => {
      socket.off('team_chat_message', onMsg)
      socket.off('team_presence', onPresence)
      socket.io.off('reconnect', onReconnect)
    }
  }, [navigate, queryClient, selfId, workspaceId])

  return null
}
