import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import Plivo from 'plivo-browser-sdk'
import type { Client as PlivoSdkClient } from 'plivo-browser-sdk/client'

import { getSocket } from '@/lib/socket'
import { virtualNumberService } from '@/services/virtualNumber.service'

const CALL_LOG_QUERY_KEY = ['virtualNumber', 'callLog']

export type CallDirection = 'inbound' | 'outbound'
export type CallPhase = 'idle' | 'ringing-out' | 'ringing-in' | 'active' | 'ended'

export type PlivoCallState = {
  /** true once the browser is registered and able to place/receive calls. */
  ready: boolean
  /** null if mic permission hasn't been requested/denied yet, else the outcome. */
  micPermission: 'unknown' | 'granted' | 'denied'
  phase: CallPhase
  direction: CallDirection | null
  remoteNumber: string | null
  /** Known contact name for the current call, if the number matched one — inbound only. */
  remoteName: string | null
  /** Plivo's call id for the call currently shown — used to match the backend's
   * "this call ended" ping to the right call instead of clobbering a newer one. */
  callUuid: string | null
  muted: boolean
  elapsedSeconds: number
  error: string | null
}

type PlivoCallActions = {
  /** `callerId` picks which of the workspace's numbers shows up as caller ID — required
   * when the workspace owns more than one, since the browser identity is shared across all. */
  call: (number: string, callerId?: string) => void
  answer: () => void
  reject: () => void
  hangup: () => void
  toggleMute: () => void
  dismissError: () => void
}

const IDLE_STATE: PlivoCallState = {
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

const PlivoCallContext = createContext<(PlivoCallState & PlivoCallActions) | null>(null)

/** Mounted once at the app layout level so incoming calls ring no matter what page
 * the agent is on. Logs the workspace's browser (one shared identity per workspace)
 * into Plivo's WebRTC network so calls carry real two-way audio through the mic. */
export function PlivoCallProvider({ children }: { children: ReactNode }) {
  const { data: numbersData } = virtualNumberService.useNumbers()
  const hasActiveNumber = Boolean(numbersData?.numbers.length)
  const { data: credentials } = virtualNumberService.useBrowserCredentials(hasActiveNumber)

  const clientRef = useRef<PlivoSdkClient | null>(null)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [state, setState] = useState<PlivoCallState>(IDLE_STATE)
  const phaseRef = useRef(state.phase)
  phaseRef.current = state.phase
  const queryClient = useQueryClient()
  /** Call list rows only get their final status/duration once the backend's hangup
   * webhook lands — refetch on every call-ending signal so it shows up without a
   * manual reload. Partial key match invalidates every number's call log. */
  const refreshCallLog = useCallback(() => {
    void queryClient.invalidateQueries({ queryKey: CALL_LOG_QUERY_KEY })
  }, [queryClient])

  // The SIP registration behind this client has a short TTL and needs the tab's JS
  // timers running to keep renewing — browsers throttle those in a backgrounded tab,
  // so a long-hidden tab can silently drop its registration. Forcing a fresh
  // login/registration whenever the tab regains focus (matching what a manual reload
  // does) keeps calls working without requiring the agent to remember to refresh.
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

  // Backend-driven "someone's calling" signal — fires the moment Plivo hits our
  // inbound-answer-xml webhook, independent of whether the browser's own WebRTC
  // session is alive to receive the SDK's onIncomingCall event. Shows the caller
  // screen right away; the ended ping (from the hangup webhook) takes it back down.
  useEffect(() => {
    const socket = getSocket()

    const onIncomingCall = (payload: {
      callUuid: string | null
      from: string
      contactName: string | null
    }) => {
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
        // The SDK's own onIncomingCall already put us in ringing-in without this
        // payload's extra info (contact name, call id) — merge it in rather than
        // overwrite, so a matching "ended" ping can still find it later.
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
    if (!credentials) return

    const plivo = new Plivo({
      permOnClick: true,
      closeProtection: true,
      debug: 'ERROR',
    })
    const client = plivo.client
    clientRef.current = client

    client.on('onLogin', () => setState((s) => ({ ...s, ready: true, error: null })))
    client.on('onLoginFailed', () =>
      setState((s) => ({ ...s, ready: false, error: 'Could not connect to calling — try reloading the page.' }))
    )

    client.on('onIncomingCall', (callerId: string) => {
      setState((s) => ({
        ...s,
        phase: 'ringing-in',
        direction: 'inbound',
        remoteNumber: callerId,
        remoteName: s.direction === 'inbound' ? s.remoteName : null,
        muted: false,
        elapsedSeconds: 0,
      }))
    })

    client.on('onIncomingCallCanceled', () => {
      setState((s) => {
        if (s.phase !== 'ringing-in') return s
        refreshCallLog()
        return { ...IDLE_STATE, ready: s.ready }
      })
    })

    client.on('onCallAnswered', () => {
      startTimer()
      setState((s) => ({ ...s, phase: 'active' }))
    })

    client.on('onCallTerminated', () => {
      stopTimer()
      refreshCallLog()
      setState((s) => ({ ...IDLE_STATE, ready: s.ready }))
    })

    client.on('onCallFailed', (reason: string) => {
      stopTimer()
      refreshCallLog()
      setState((s) => ({
        ...IDLE_STATE,
        ready: s.ready,
        error: reason ? `Call failed: ${reason}` : 'Call failed.',
      }))
    })

    client.on('onMediaPermissionError', () => {
      setState((s) => ({ ...s, micPermission: 'denied', error: 'Microphone access is blocked for this site.' }))
    })

    client.login(credentials.username, credentials.password)

    return () => {
      stopTimer()
      client.removeAllListeners()
      client.logout()
      clientRef.current = null
    }
  }, [credentials, reconnectKey, startTimer, stopTimer, refreshCallLog])

  const call = useCallback((number: string, callerId?: string) => {
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
      muted: false,
      elapsedSeconds: 0,
      error: null,
    }))
    const digits = number.replace(/\D/g, '')
    const dest = digits.length === 10 ? `91${digits}` : digits
    const callerDigits = callerId?.replace(/\D/g, '')
    client.call(dest, callerDigits ? { 'X-PH-callerId': callerDigits } : {})
  }, [])

  const answer = useCallback(() => {
    clientRef.current?.answer('', 'ignore')
  }, [])

  const reject = useCallback(() => {
    clientRef.current?.reject('')
    refreshCallLog()
    setState((s) => ({ ...IDLE_STATE, ready: s.ready }))
  }, [refreshCallLog])

  const hangup = useCallback(() => {
    clientRef.current?.hangup()
  }, [])

  const toggleMute = useCallback(() => {
    const client = clientRef.current
    if (!client) return
    setState((s) => {
      if (s.muted) client.unmute()
      else client.mute()
      return { ...s, muted: !s.muted }
    })
  }, [])

  const dismissError = useCallback(() => setState((s) => ({ ...s, error: null })), [])

  return (
    <PlivoCallContext.Provider value={{ ...state, call, answer, reject, hangup, toggleMute, dismissError }}>
      {children}
    </PlivoCallContext.Provider>
  )
}

export function usePlivoCall() {
  const ctx = useContext(PlivoCallContext)
  if (!ctx) {
    throw new Error('usePlivoCall must be used within a PlivoCallProvider')
  }
  return ctx
}
