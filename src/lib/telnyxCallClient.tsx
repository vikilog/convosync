import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { TelnyxRTC } from '@telnyx/webrtc'
import type { Call as TelnyxCall } from '@telnyx/webrtc'

import { getSocket } from '@/lib/socket'
import { virtualNumberService } from '@/services/virtualNumber.service'
import type { CallDirection, CallPhase } from '@/lib/plivoCallClient'

const CALL_LOG_QUERY_KEY = ['virtualNumber', 'callLog']

/** Same shape as PlivoCallState/PlivoCallActions (see plivoCallClient.tsx) — callClient.tsx
 * dispatches between the two providers' contexts, so both must stay structurally identical. */
export type TelnyxCallState = {
  ready: boolean
  micPermission: 'unknown' | 'granted' | 'denied'
  phase: CallPhase
  direction: CallDirection | null
  remoteNumber: string | null
  remoteName: string | null
  callUuid: string | null
  muted: boolean
  elapsedSeconds: number
  error: string | null
}

type TelnyxCallActions = {
  call: (number: string, callerId?: string, name?: string) => void
  answer: () => void
  reject: () => void
  hangup: () => void
  toggleMute: () => void
  dismissError: () => void
}

const IDLE_STATE: TelnyxCallState = {
  ready: false,
  micPermission: 'unknown',
  phase: 'idle',
  direction: null,
  remoteNumber: null,
  remoteName: null,
  callUuid: null,
  muted: false,
  elapsedSeconds: 0,
  error: null,
}

/** Exported (not just the throwing useTelnyxCall hook) so callClient.tsx can read it
 * directly without throwing when Telnyx isn't this workspace's active provider. */
export const TelnyxCallContext = createContext<(TelnyxCallState & TelnyxCallActions) | null>(null)

/** Verto/TeXML call states aren't a fixed string union in @telnyx/webrtc's own types
 * (`call.state` is typed as plain `string`) — matched by substring against the documented
 * state names (new/requesting/trying/ringing/active/held/hangup/destroy/purge) rather than
 * exact equality, so an unexpected casing doesn't silently fall through. Verify against a
 * real Telnyx account's console logs before first production use. */
function phaseFromCallState(state: string, direction: CallDirection): CallPhase {
  const s = state.toLowerCase()
  if (s.includes('active') || s.includes('answer')) return 'active'
  if (s.includes('hangup') || s.includes('destroy') || s.includes('purge') || s.includes('done')) return 'ended'
  return direction === 'inbound' ? 'ringing-in' : 'ringing-out'
}

/** Mounted once at the app layout level (alongside PlivoCallProvider — see callClient.tsx)
 * so incoming calls ring no matter what page the agent is on. Only actually connects to
 * Telnyx's WebRTC network when this workspace's /browser-credentials says provider=telnyx;
 * otherwise it stays idle forever and PlivoCallProvider is the active one. */
export function TelnyxCallProvider({ children }: { children: ReactNode }) {
  const { data: numbersData } = virtualNumberService.useNumbers()
  const hasActiveNumber = Boolean(numbersData?.numbers.length)
  const { data: credentials } = virtualNumberService.useBrowserCredentials(hasActiveNumber)

  const clientRef = useRef<TelnyxRTC | null>(null)
  const activeCallRef = useRef<TelnyxCall | null>(null)
  // The SDK's docs say it auto-creates + appends a remote <audio> element when none is
  // given — confirmed live that it does NOT in this app's setup (checked the DOM mid-call:
  // zero <audio> elements existed even though "First remote audio/video track received"
  // fired), so the far end's voice had nowhere to play even though it was arriving fine.
  // Owning the element ourselves and passing it as `remoteElement` sidesteps relying on
  // that auto-creation at all.
  const remoteAudioRef = useRef<HTMLAudioElement | null>(null)
  useEffect(() => {
    const el = document.createElement('audio')
    el.autoplay = true
    el.style.display = 'none'
    document.body.appendChild(el)
    remoteAudioRef.current = el
    return () => {
      el.remove()
      remoteAudioRef.current = null
    }
  }, [])
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const [state, setState] = useState<TelnyxCallState>(IDLE_STATE)
  const phaseRef = useRef(state.phase)
  phaseRef.current = state.phase
  const queryClient = useQueryClient()
  const refreshCallLog = useCallback(() => {
    void queryClient.invalidateQueries({ queryKey: CALL_LOG_QUERY_KEY })
  }, [queryClient])

  const [reconnectKey, setReconnectKey] = useState(0)
  useEffect(() => {
    const onVisibility = () => {
      const busy = phaseRef.current === 'ringing-out' || phaseRef.current === 'ringing-in' || phaseRef.current === 'active'
      if (document.visibilityState === 'visible' && !busy) {
        setReconnectKey((k) => k + 1)
      }
    }
    document.addEventListener('visibilitychange', onVisibility)
    return () => document.removeEventListener('visibilitychange', onVisibility)
  }, [])

  // Backend-driven "someone's calling" signal — same socket events Plivo's provider
  // listens for, fired from virtualNumberWebhooks.telnyx.ts's inbound-answer-xml handler.
  useEffect(() => {
    const socket = getSocket()

    const onIncomingCall = (payload: { callUuid: string | null; from: string; contactName: string | null }) => {
      setState((s) => {
        if (s.phase === 'idle') {
          return {
            ...s,
            phase: 'ringing-in',
            direction: 'inbound',
            remoteNumber: payload.from,
            remoteName: payload.contactName,
            callUuid: payload.callUuid,
            muted: false,
            elapsedSeconds: 0,
          }
        }
        if (s.phase === 'ringing-in' && !s.callUuid) {
          return { ...s, callUuid: payload.callUuid, remoteName: payload.contactName }
        }
        return s
      })
    }

    const onIncomingCallEnded = (payload: { callUuid: string | null }) => {
      setState((s) => {
        if (s.phase !== 'ringing-in' || (payload.callUuid && s.callUuid !== payload.callUuid)) return s
        refreshCallLog()
        return { ...IDLE_STATE, ready: s.ready }
      })
    }

    socket.on('incoming_call', onIncomingCall)
    socket.on('incoming_call_ended', onIncomingCallEnded)
    return () => {
      socket.off('incoming_call', onIncomingCall)
      socket.off('incoming_call_ended', onIncomingCallEnded)
    }
  }, [refreshCallLog])

  const startTimer = useCallback(() => {
    if (timerRef.current) return
    const startedAt = Date.now()
    timerRef.current = setInterval(() => {
      setState((s) => ({ ...s, elapsedSeconds: Math.floor((Date.now() - startedAt) / 1000) }))
    }, 1000)
  }, [])

  const stopTimer = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current)
    timerRef.current = null
  }, [])

  useEffect(() => {
    // Guards against connecting to Telnyx with another provider's credentials — a
    // Plivo-routed (India) workspace's /browser-credentials response is never meant
    // for this client. See callClient.tsx for how the two providers coexist.
    if (!credentials || credentials.provider !== 'telnyx') return

    const client = new TelnyxRTC({ login: credentials.username, password: credentials.password })
    clientRef.current = client

    client.on('telnyx.ready', () => setState((s) => ({ ...s, ready: true, error: null })))
    client.on('telnyx.error', () =>
      setState((s) => ({ ...s, ready: false, error: 'Could not connect to calling — try reloading the page.' })),
    )

    client.on('telnyx.notification', (notification) => {
      if (notification.type === 'userMediaError') {
        setState((s) => ({ ...s, micPermission: 'denied', error: 'Microphone access is blocked for this site.' }))
        return
      }
      if (notification.type !== 'callUpdate' || !notification.call) return
      const call = notification.call
      const direction: CallDirection = call.direction === 'inbound' ? 'inbound' : 'outbound'
      const phase = phaseFromCallState(call.state, direction)

      if (phase === 'ringing-in' && activeCallRef.current?.id !== call.id) {
        activeCallRef.current = call
        setState((s) => ({
          ...s,
          phase: 'ringing-in',
          direction: 'inbound',
          remoteNumber: call.options.remoteCallerNumber ?? s.remoteNumber,
          remoteName: s.direction === 'inbound' ? s.remoteName : null,
          muted: false,
          elapsedSeconds: 0,
        }))
        return
      }

      if (phase === 'active' && phaseRef.current !== 'active') {
        activeCallRef.current = call
        startTimer()
        setState((s) => ({ ...s, phase: 'active' }))
        return
      }

      if (phase === 'ended') {
        stopTimer()
        refreshCallLog()
        activeCallRef.current = null
        setState((s) => ({
          ...IDLE_STATE,
          ready: s.ready,
          error: call.cause && call.cause.toLowerCase() !== 'normal_clearing' ? `Call failed: ${call.cause}` : null,
        }))
      }
    })

    client.connect()

    return () => {
      stopTimer()
      client.disconnect()
      clientRef.current = null
      activeCallRef.current = null
    }
  }, [credentials, reconnectKey, startTimer, stopTimer, refreshCallLog])

  const call = useCallback((number: string, callerId?: string, name?: string) => {
    const client = clientRef.current
    if (!client) {
      setState((s) => ({ ...s, error: 'Calling isn’t ready yet — try again in a moment.' }))
      return
    }
    setState((s) => ({
      ...s,
      phase: 'ringing-out',
      direction: 'outbound',
      remoteNumber: number,
      remoteName: name?.trim() || null,
      muted: false,
      elapsedSeconds: 0,
      error: null,
    }))
    const dest = number.replace(/[^\d+]/g, '')
    const callerDigits = callerId?.replace(/\D/g, '')
    const newCall = client.newCall({
      destinationNumber: dest,
      ...(remoteAudioRef.current ? { remoteElement: remoteAudioRef.current } : {}),
      ...(callerDigits ? { customHeaders: [{ name: 'X-Telnyx-CallerId', value: callerDigits }] } : {}),
    })
    activeCallRef.current = newCall
  }, [])

  const answer = useCallback(() => {
    activeCallRef.current?.answer(remoteAudioRef.current ? { remoteElement: remoteAudioRef.current } : {})
  }, [])

  const reject = useCallback(() => {
    activeCallRef.current?.hangup()
    refreshCallLog()
    setState((s) => ({ ...IDLE_STATE, ready: s.ready }))
  }, [refreshCallLog])

  const hangup = useCallback(() => {
    activeCallRef.current?.hangup()
  }, [])

  const toggleMute = useCallback(() => {
    const activeCall = activeCallRef.current
    if (!activeCall) return
    setState((s) => {
      if (s.muted) activeCall.unmuteAudio()
      else activeCall.muteAudio()
      return { ...s, muted: !s.muted }
    })
  }, [])

  const dismissError = useCallback(() => setState((s) => ({ ...s, error: null })), [])

  return (
    <TelnyxCallContext.Provider value={{ ...state, call, answer, reject, hangup, toggleMute, dismissError }}>
      {children}
    </TelnyxCallContext.Provider>
  )
}

export function useTelnyxCall() {
  const ctx = useContext(TelnyxCallContext)
  if (!ctx) {
    throw new Error('useTelnyxCall must be used within a TelnyxCallProvider')
  }
  return ctx
}
