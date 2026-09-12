import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { PhoneMissed, X } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { getSocket } from '@/lib/socket'

const TOAST_MS = 8_000

type CallNotificationPayload = {
  type?: string
  title?: string
  message?: string
  metadata?: { numberId?: string; fromNumber?: string } | null
}

type MissedCallToast = {
  id: string
  title: string
  message: string
  numberId: string | null
}

/** Global "missed call" alert — pops a top-center card whenever an inbound call
 * on any of the workspace's numbers goes unanswered, regardless of which page
 * the agent is currently on. */
export function CallingRealtimeBridge() {
  const navigate = useNavigate()
  const toastTimerRef = useRef<number | null>(null)
  const [toast, setToast] = useState<MissedCallToast | null>(null)

  const showToast = useCallback((next: MissedCallToast) => {
    setToast(next)
    if (toastTimerRef.current) window.clearTimeout(toastTimerRef.current)
    toastTimerRef.current = window.setTimeout(() => {
      setToast(null)
      toastTimerRef.current = null
    }, TOAST_MS)
  }, [])

  useEffect(() => {
    const socket = getSocket()
    const onNotification = (payload: CallNotificationPayload) => {
      if (payload.type !== 'call_missed') return
      showToast({
        id: `${payload.metadata?.numberId ?? 'call'}-${Date.now()}`,
        title: payload.title || 'Missed call',
        message: payload.message || 'A call went unanswered.',
        numberId: payload.metadata?.numberId ?? null,
      })
    }
    socket.on('workspace_notification', onNotification)
    return () => {
      socket.off('workspace_notification', onNotification)
    }
  }, [showToast])

  useEffect(
    () => () => {
      if (toastTimerRef.current) window.clearTimeout(toastTimerRef.current)
    },
    [],
  )

  if (!toast) return null

  return (
    <div className="fixed top-4 left-1/2 z-50 w-[min(100vw-1.5rem,24rem)] -translate-x-1/2">
      <div className="bg-card relative overflow-hidden rounded-xl border shadow-lg">
        <button
          type="button"
          onClick={() => {
            navigate(toast.numberId ? `/calling/${toast.numberId}` : '/calling')
            setToast(null)
          }}
          className="hover:bg-muted/50 flex w-full items-start gap-2.5 px-3 py-2.5 pr-9 text-left"
        >
          <span className="bg-destructive/10 mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full">
            <PhoneMissed className="text-destructive size-4" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold">{toast.title}</p>
            <p className="text-muted-foreground truncate text-xs">{toast.message}</p>
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
