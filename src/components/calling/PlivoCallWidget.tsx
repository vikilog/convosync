import { useEffect } from 'react'
import { Mic, MicOff, Phone, PhoneOff } from 'lucide-react'

import { callerInitials, displayCallerNumber, isWhatsAppCaller } from '@/lib/callDisplay'
import { useCall } from '@/lib/callClient'

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m}:${s.toString().padStart(2, '0')}`
}

/** Live call chrome for the whole app: incoming sheet, or a bottom dock once connected.
 * Mounted once in AppLayout so a call rings on any page. */
export function PlivoCallWidget() {
  const call = useCall()
  // Plivo can hand back a bare 10-digit number needing '+91' assumed; Telnyx never omits
  // the country code, and a bare-10-digit guess there would mangle e.g. a complete
  // Singapore number — see displayCallerNumber's own comment.
  const number = displayCallerNumber(call.remoteNumber, call.provider === 'telnyx' ? null : 'IN')
  const name = call.remoteName?.trim() || null
  const whatsapp = isWhatsAppCaller(call.remoteNumber)
  const initials = callerInitials(name, number)
  const title = name ?? (number || 'Incoming call')

  useEffect(() => {
    if (call.error) {
      const t = setTimeout(call.dismissError, 6000)
      return () => clearTimeout(t)
    }
  }, [call.error, call.dismissError])

  useEffect(() => {
    if (call.phase !== 'ringing-in') return
    const onKey = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement | null
      const typing =
        el &&
        (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.tagName === 'SELECT' || el.isContentEditable)
      if (e.key === 'Escape') {
        e.preventDefault()
        call.reject()
      } else if (e.key === 'Enter' && !typing) {
        e.preventDefault()
        call.answer()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [call.phase, call.answer, call.reject])

  if (call.phase === 'idle') {
    return call.error ? (
      <div className="bg-destructive text-destructive-foreground fixed top-4 left-1/2 z-50 max-w-xs -translate-x-1/2 rounded-lg px-4 py-3 text-xs font-medium shadow-lg">
        {call.error}
      </div>
    ) : null
  }

  if (call.phase === 'ringing-in') {
    return (
      <div className="fixed inset-0 z-50 grid place-items-center p-6" role="presentation">
        <div
          role="alertdialog"
          aria-modal="true"
          aria-labelledby="incoming-call-title"
          className="w-full max-w-[380px] rounded-[28px] border border-black/10 bg-white px-6 pt-12 pb-5 text-center shadow-[0_18px_50px_rgb(15_23_42/0.16)]"
        >
          <div className="relative mx-auto mb-4 size-[88px]">
            <span className="border-channel-green/40 pointer-events-none absolute -inset-2 rounded-full border-2 motion-reduce:hidden motion-safe:animate-[ping_1.6s_cubic-bezier(0,0,0.2,1)_infinite]" />
            <span className="bg-foreground text-background relative flex size-[88px] items-center justify-center rounded-full text-2xl font-semibold">
              {initials}
            </span>
          </div>
          <p className="text-channel-green text-[11px] font-bold tracking-[0.14em] uppercase">Incoming call</p>
          <h2 id="incoming-call-title" className="mt-1 text-[22px] font-semibold tracking-tight">
            {title}
          </h2>
          {name && number ? (
            <p className="text-muted-foreground mt-1 font-mono text-sm tabular-nums">{number}</p>
          ) : null}
          {whatsapp ? (
            <p className="bg-channel-green/10 text-channel-green mt-3 inline-flex rounded-full px-2.5 py-1 text-xs font-semibold">
              WhatsApp voice
            </p>
          ) : null}
          <div className="mt-6 flex justify-center gap-9">
            <button type="button" onClick={call.reject} className="group cursor-pointer">
              <span className="bg-destructive flex size-14 items-center justify-center rounded-full text-white group-active:scale-95">
                <PhoneOff className="size-5" />
              </span>
              <span className="text-muted-foreground mt-2 block text-xs font-semibold">Decline</span>
            </button>
            <button type="button" onClick={call.answer} autoFocus className="group cursor-pointer">
              <span className="bg-channel-green flex size-14 items-center justify-center rounded-full text-white group-active:scale-95">
                <Phone className="size-5 rotate-[135deg]" />
              </span>
              <span className="text-muted-foreground mt-2 block text-xs font-semibold">Answer</span>
            </button>
          </div>
          <p className="text-muted-foreground/70 mt-4 text-[11px]">Enter to answer · Esc to decline</p>
        </div>
      </div>
    )
  }

  const isActive = call.phase === 'active'
  const label = isActive ? formatDuration(call.elapsedSeconds) : call.direction === 'outbound' ? 'Calling…' : 'Connecting…'

  return (
    <div className="fixed bottom-6 left-1/2 z-50 flex min-w-[320px] max-w-[min(420px,calc(100vw-2rem))] -translate-x-1/2 items-center gap-3 rounded-full bg-zinc-900 py-2.5 pr-2.5 pl-3.5 text-white shadow-xl">
      <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-zinc-700 text-xs font-semibold">
        {initials}
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold">{title}</p>
        <p className="truncate text-[11px] text-zinc-400 tabular-nums">
          {name && number ? <>{number} · </> : null}
          {isActive ? <span className="text-channel-green">● Live</span> : null}
          {isActive ? ' · ' : null}
          {label}
          {whatsapp ? ' · WhatsApp' : null}
        </p>
      </div>
      {isActive ? (
        <button
          type="button"
          onClick={call.toggleMute}
          aria-label={call.muted ? 'Unmute' : 'Mute'}
          title={call.muted ? 'Unmute' : 'Mute'}
          className={`flex size-9 shrink-0 cursor-pointer items-center justify-center rounded-full ${
            call.muted ? 'bg-white text-zinc-900' : 'bg-zinc-800 text-zinc-200 hover:bg-zinc-700'
          }`}
        >
          {call.muted ? <MicOff className="size-4" /> : <Mic className="size-4" />}
        </button>
      ) : null}
      <button
        type="button"
        onClick={call.hangup}
        aria-label="Hang up"
        title="Hang up"
        className="bg-destructive flex size-9 shrink-0 cursor-pointer items-center justify-center rounded-full text-white hover:opacity-90"
      >
        <PhoneOff className="size-4" />
      </button>
    </div>
  )
}
