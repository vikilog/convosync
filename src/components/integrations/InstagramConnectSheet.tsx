import { useState } from 'react'

import { Button } from '@/components/ui/button'
import { Sheet, SheetClose, SheetContent, SheetFooter, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { ApiError } from '@/lib/httpClient'
import { startInstagramBusinessLogin, startInstagramConnect } from '@/lib/integrationsOAuth'

export function InstagramConnectSheet({
  open,
  onOpenChange,
  connectDisabled,
  connectDisabledMessage,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  connectDisabled?: boolean
  connectDisabledMessage?: string
}) {
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState<'facebook' | 'instagram' | null>(null)

  const run = async (kind: 'facebook' | 'instagram', start: () => Promise<void>) => {
    if (connectDisabled) {
      setError(connectDisabledMessage || 'Instagram is not available on your current plan.')
      return
    }
    setBusy(kind)
    setError(null)
    try {
      await start()
    } catch (err) {
      setBusy(null)
      setError(err instanceof ApiError ? err.message : 'Could not start Instagram connect.')
    }
  }

  return (
    <Sheet
      open={open}
      onOpenChange={(next) => {
        onOpenChange(next)
        if (!next) {
          setError(null)
          setBusy(null)
        }
      }}
    >
      <SheetContent side="right">
        <SheetHeader>
          <SheetTitle>Connect Instagram</SheetTitle>
        </SheetHeader>

        <div className="flex-1 space-y-4 overflow-y-auto px-4">
          <p className="text-muted-foreground text-sm">
            Authorize via Facebook Login to link an Instagram Professional account for inbox DMs
            and Social Listening.
          </p>
          <ul className="text-muted-foreground list-inside list-disc space-y-1 text-xs">
            <li>Instagram must be a Professional account (Business or Creator)</li>
            <li>Instagram must be linked to a Facebook Page you admin</li>
            <li>Log in with the Facebook profile that manages that Page</li>
          </ul>

          {connectDisabled && connectDisabledMessage ? (
            <p className="text-sm font-medium text-amber-700">{connectDisabledMessage}</p>
          ) : null}
          {error ? <p className="text-destructive text-sm">{error}</p> : null}

          <Button
            disabled={Boolean(connectDisabled) || busy != null}
            onClick={() => void run('facebook', startInstagramConnect)}
          >
            {busy === 'facebook' ? 'Redirecting…' : connectDisabled ? 'Upgrade plan' : 'Continue with Facebook'}
          </Button>

          <div className="border-t pt-4">
            <p className="text-muted-foreground text-xs font-medium">
              Prefer logging in with Instagram directly (no Facebook Page required)?
            </p>
            <Button
              variant="outline"
              className="mt-2"
              disabled={busy != null}
              onClick={() => void run('instagram', startInstagramBusinessLogin)}
            >
              {busy === 'instagram' ? 'Redirecting…' : 'Continue with Instagram Login'}
            </Button>
          </div>
        </div>

        <SheetFooter>
          <SheetClose asChild>
            <Button variant="outline">Cancel</Button>
          </SheetClose>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
