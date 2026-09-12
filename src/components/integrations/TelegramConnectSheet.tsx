import { useState } from 'react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Sheet, SheetClose, SheetContent, SheetFooter, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { ApiError } from '@/lib/httpClient'
import { realIntegrationsService } from '@/services/realIntegrations.service'

const BOT_TOKEN_PATTERN = /^\d+:[\w-]{20,}$/

export function TelegramConnectSheet({
  open,
  onOpenChange,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const [botToken, setBotToken] = useState('')
  const [error, setError] = useState<string | null>(null)
  const connectTelegram = realIntegrationsService.useConnectTelegram()

  const tokenValid = BOT_TOKEN_PATTERN.test(botToken.trim())

  const reset = () => {
    setBotToken('')
    setError(null)
  }

  return (
    <Sheet
      open={open}
      onOpenChange={(next) => {
        onOpenChange(next)
        if (!next) reset()
      }}
    >
      <SheetContent side="right">
        <SheetHeader>
          <SheetTitle>Connect Telegram bot</SheetTitle>
        </SheetHeader>

        <div className="flex-1 space-y-4 overflow-y-auto px-4">
          <ol className="text-muted-foreground list-inside list-decimal space-y-1.5 text-xs leading-relaxed">
            <li>
              Open Telegram and message <span className="font-medium">@BotFather</span>.
            </li>
            <li>
              Send <span className="font-mono">/newbot</span> and follow the prompts to name your bot.
            </li>
            <li>BotFather replies with an API token that looks like a long number, a colon, then letters.</li>
            <li>Paste that token below.</li>
          </ol>

          <div className="space-y-1.5">
            <Label htmlFor="telegram-token">Bot token</Label>
            <Input
              id="telegram-token"
              value={botToken}
              onChange={(e) => {
                setBotToken(e.target.value)
                setError(null)
              }}
              placeholder="123456789:AAExample-BotToken_HereXXXXXXXXXX"
              className="font-mono text-xs"
            />
            {error ? <p className="text-destructive text-xs">{error}</p> : null}
          </div>
        </div>

        <SheetFooter className="flex-row justify-end gap-2">
          <SheetClose asChild>
            <Button variant="ghost">Cancel</Button>
          </SheetClose>
          <Button
            disabled={!tokenValid || connectTelegram.isPending}
            onClick={() => {
              connectTelegram.mutate(botToken.trim(), {
                onSuccess: () => {
                  onOpenChange(false)
                  reset()
                },
                onError: (err) => {
                  setError(err instanceof ApiError ? err.message : 'Could not connect this bot.')
                },
              })
            }}
          >
            {connectTelegram.isPending ? 'Connecting…' : 'Connect Telegram bot'}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
