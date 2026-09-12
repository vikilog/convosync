import { useState } from 'react'
import { ChevronDown } from 'lucide-react'

import { TRIAGE_THEME } from '@/components/social-listening/intentConfig'
import type { TriageSection } from '@/lib/socialListening'

export function IntentSection({
  section,
  count,
  defaultOpen = true,
  children,
}: {
  section: TriageSection
  count: number
  defaultOpen?: boolean
  children: React.ReactNode
}) {
  const [open, setOpen] = useState(defaultOpen)
  const theme = TRIAGE_THEME[section]

  return (
    <div className="overflow-hidden rounded-xl border">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={`flex w-full items-center justify-between gap-2 px-4 py-2.5 text-left ${theme.bg}`}
      >
        <span className={`flex items-center gap-2 text-sm font-semibold ${theme.text}`}>
          <span className={`size-2 rounded-full ${theme.dot}`} />
          {theme.label}
          <span className="text-muted-foreground text-xs font-normal">({count})</span>
        </span>
        <ChevronDown
          className={`text-muted-foreground size-4 transition-transform ${open ? 'rotate-180' : ''}`}
        />
      </button>
      {open ? <div className="space-y-2 p-3">{children}</div> : null}
    </div>
  )
}
