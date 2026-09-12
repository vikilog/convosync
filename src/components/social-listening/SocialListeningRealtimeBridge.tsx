import { useCallback, useEffect, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import { X } from 'lucide-react'

import { PlatformIcon } from '@/components/social-listening/platform-icon'
import { Button } from '@/components/ui/button'
import { slKeys } from '@/hooks/useSocialListeningQueries'
import { getSocket } from '@/lib/socket'
import type { Platform } from '@/lib/socialListening'

const TOAST_MS = 5_000

type SocialCommentSocketPayload = {
  platform?: Platform
  postId?: string
  commentId?: string
  username?: string | null
  text?: string | null
}

type CommentToast = {
  id: string
  postId: string
  platform: Platform
  username: string
  preview: string
}

function viewingMediaId(pathname: string): string | null {
  const parts = pathname.replace(/\/$/, '').split('/').filter(Boolean)
  if (parts[0] === 'social-listening' && parts[1] === 'media' && parts[2]) {
    try {
      return decodeURIComponent(parts[2])
    } catch {
      return parts[2]
    }
  }
  return null
}

function clip(s: string, max = 72): string {
  const t = s.trim()
  if (t.length <= max) return t
  return `${t.slice(0, max - 1)}…`
}

export function SocialListeningRealtimeBridge() {
  const qc = useQueryClient()
  const navigate = useNavigate()
  const location = useLocation()
  const viewingPostRef = useRef<string | null>(null)
  const toastTimerRef = useRef<number | null>(null)
  const [toast, setToast] = useState<CommentToast | null>(null)

  useEffect(() => {
    viewingPostRef.current = viewingMediaId(location.pathname)
  }, [location.pathname])

  const showToast = useCallback((next: CommentToast) => {
    setToast(next)
    if (toastTimerRef.current) window.clearTimeout(toastTimerRef.current)
    toastTimerRef.current = window.setTimeout(() => {
      setToast(null)
      toastTimerRef.current = null
    }, TOAST_MS)
  }, [])

  useEffect(() => {
    const socket = getSocket()
    const onSocialComment = (payload: SocialCommentSocketPayload) => {
      void qc.invalidateQueries({ queryKey: slKeys.all })
      if (payload.postId) {
        void qc.invalidateQueries({ queryKey: [...slKeys.all, 'media-comments', payload.postId] })
      }
      const postId = payload.postId?.trim()
      if (!postId) return
      if (viewingPostRef.current && viewingPostRef.current === postId) return
      const platform = payload.platform === 'facebook' ? 'facebook' : 'instagram'
      showToast({
        id: `${payload.commentId || postId}-${Date.now()}`,
        postId,
        platform,
        username: (payload.username || `${platform}_user`).replace(/^@/, ''),
        preview: clip(payload.text || (platform === 'facebook' ? 'New Facebook comment' : 'New Instagram comment')),
      })
    }
    socket.on('social_comment', onSocialComment)
    return () => {
      socket.off('social_comment', onSocialComment)
    }
  }, [qc, showToast])

  useEffect(
    () => () => {
      if (toastTimerRef.current) window.clearTimeout(toastTimerRef.current)
    },
    [],
  )

  if (!toast) return null

  return (
    <div className="fixed top-4 left-1/2 z-50 w-[min(100vw-1.5rem,22rem)] -translate-x-1/2">
      <div className="bg-card relative overflow-hidden rounded-xl border shadow-lg">
        <button
          type="button"
          onClick={() => navigate(`/social-listening/media/${encodeURIComponent(toast.postId)}?platform=${toast.platform}`)}
          className="hover:bg-muted/50 w-full px-3 py-2.5 pr-9 text-left"
        >
          <div className="flex min-w-0 items-center gap-2.5">
            <PlatformIcon platform={toast.platform} className="size-5" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold">@{toast.username}</p>
              <p className="text-muted-foreground truncate text-xs">{toast.preview}</p>
            </div>
          </div>
        </button>
        <Button
          variant="ghost"
          size="icon-xs"
          className="absolute top-1.5 right-1.5"
          aria-label="Dismiss notification"
          onClick={() => setToast(null)}
        >
          <X />
        </Button>
      </div>
    </div>
  )
}
