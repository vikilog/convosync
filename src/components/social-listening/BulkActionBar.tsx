import { AlertTriangle, Check, X } from 'lucide-react'

import { Button } from '@/components/ui/button'

export function BulkActionBar({
  count,
  mixedIntents,
  primaryLabel,
  onClear,
  onIgnore,
  onApprove,
}: {
  count: number
  mixedIntents: boolean
  primaryLabel: string
  onClear: () => void
  onIgnore: () => void
  onApprove: () => void
}) {
  if (count === 0) return null

  return (
    <div className="bg-card sticky bottom-0 flex flex-wrap items-center justify-between gap-3 border-t p-3 shadow-lg">
      <div className="flex items-center gap-2 text-sm">
        <span className="font-semibold">{count} selected</span>
        {mixedIntents ? (
          <span className="flex items-center gap-1 text-xs text-amber-600">
            <AlertTriangle className="size-3.5" />
            Mixed intents
          </span>
        ) : null}
        <Button variant="link" size="sm" onClick={onClear}>
          Clear
        </Button>
      </div>
      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm" onClick={onIgnore}>
          <X />
          Ignore Selected
        </Button>
        <Button size="sm" onClick={onApprove}>
          <Check />
          {primaryLabel}
        </Button>
      </div>
    </div>
  )
}
