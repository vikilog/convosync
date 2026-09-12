import { Loader2 } from 'lucide-react'

import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import {
  defaultRestrictedInboxScope,
  FULL_INBOX_SCOPE,
  type InboxChannel,
  type InboxScope,
} from '@/lib/inboxScope'
import { realIntegrationsService } from '@/services/realIntegrations.service'

const CHANNEL_LABELS: Record<InboxChannel, string> = {
  whatsapp: 'WhatsApp',
  instagram: 'Instagram',
  messenger: 'Messenger',
  telegram: 'Telegram',
  email: 'Email',
}

const SCOPE_CHANNELS: InboxChannel[] = ['whatsapp', 'instagram', 'messenger', 'telegram', 'email']

export function InboxScopeEditor({
  value,
  onChange,
  disabled,
}: {
  value: InboxScope
  onChange: (next: InboxScope) => void
  disabled?: boolean
}) {
  const { data: wa, isLoading: waLoading } = realIntegrationsService.useWhatsAppAccounts()
  const { data: ig, isLoading: igLoading } = realIntegrationsService.useInstagramAccounts()
  const { data: ms, isLoading: msLoading } = realIntegrationsService.useMessengerAccounts()
  const { data: tg, isLoading: tgLoading } = realIntegrationsService.useTelegramAccounts()
  const loading = waLoading || igLoading || msLoading || tgLoading

  const restricted = value.mode === 'restricted'
  const channels = new Set(value.channels ?? [])
  const accounts = value.accounts ?? {}

  const setRestricted = (next: InboxScope) => onChange(next.mode === 'all' ? FULL_INBOX_SCOPE : next)

  const toggleChannel = (channel: InboxChannel) => {
    if (disabled || !restricted) return
    const nextChannels = new Set(channels)
    const nextAccounts = { ...accounts }
    if (nextChannels.has(channel)) {
      nextChannels.delete(channel)
      delete nextAccounts[channel]
    } else {
      nextChannels.add(channel)
    }
    setRestricted({
      mode: 'restricted',
      channels: [...nextChannels],
      accounts: Object.keys(nextAccounts).length ? nextAccounts : undefined,
    })
  }

  const toggleAccount = (channel: InboxChannel, accountId: string) => {
    if (disabled || !restricted) return
    const current = new Set(accounts[channel] ?? [])
    if (current.has(accountId)) current.delete(accountId)
    else current.add(accountId)
    const nextAccounts = { ...accounts }
    if (current.size) nextAccounts[channel] = [...current]
    else delete nextAccounts[channel]
    const nextChannels = new Set(channels)
    if (current.size > 0) nextChannels.add(channel)
    setRestricted({
      mode: 'restricted',
      channels: [...nextChannels],
      accounts: Object.keys(nextAccounts).length ? nextAccounts : undefined,
    })
  }

  const lists: Record<InboxChannel, { id: string; label: string }[]> = {
    whatsapp: (wa?.accounts ?? []).map((a) => ({
      id: a.phoneNumberId,
      label: a.label || a.displayName || a.phoneNumber || a.phoneNumberId,
    })),
    instagram: (ig?.accounts ?? []).map((a) => ({
      id: a.instagramUserId,
      label: a.label || a.username || a.displayName || a.instagramUserId,
    })),
    messenger: (ms?.accounts ?? []).map((a) => ({
      id: a.pageId,
      label: a.label || a.displayName || a.pageName || a.pageId,
    })),
    telegram: (tg?.accounts ?? []).map((a) => ({
      id: a.botId,
      label: a.label || a.botUsername || a.botName || a.botId,
    })),
    email: [],
  }

  return (
    <div className="space-y-3 rounded-lg border p-3">
      <div>
        <p className="text-sm font-medium">Inbox access</p>
        <p className="text-muted-foreground mt-0.5 text-xs">
          Choose which channels and connected numbers/pages this user can manage.
        </p>
      </div>

      <div className="flex flex-wrap gap-4">
        <Label className="flex items-center gap-2 font-normal">
          <input
            type="radio"
            name="inbox-scope-mode"
            checked={!restricted}
            disabled={disabled}
            onChange={() => onChange(FULL_INBOX_SCOPE)}
          />
          All connected inboxes
        </Label>
        <Label className="flex items-center gap-2 font-normal">
          <input
            type="radio"
            name="inbox-scope-mode"
            checked={restricted}
            disabled={disabled}
            onChange={() => onChange(defaultRestrictedInboxScope())}
          />
          Selected only
        </Label>
      </div>

      {restricted ? (
        <div className="space-y-3">
          {loading ? (
            <p className="text-muted-foreground flex items-center gap-2 text-xs">
              <Loader2 className="size-3.5 animate-spin" />
              Loading connected accounts…
            </p>
          ) : (
            SCOPE_CHANNELS.map((channel) => {
              const list = lists[channel]
              const selected = new Set(accounts[channel] ?? [])
              const channelWide = channels.has(channel) && selected.size === 0
              return (
                <div key={channel} className="space-y-1.5">
                  <Label className="flex items-center gap-2 text-sm font-medium">
                    <Checkbox
                      checked={channels.has(channel) || selected.size > 0}
                      disabled={disabled}
                      onCheckedChange={() => toggleChannel(channel)}
                    />
                    {CHANNEL_LABELS[channel]}
                  </Label>
                  {channel !== 'email' && (channels.has(channel) || selected.size > 0) ? (
                    list.length === 0 ? (
                      <p className="text-muted-foreground pl-6 text-xs">
                        No connected {CHANNEL_LABELS[channel]} accounts
                      </p>
                    ) : (
                      <ul className="space-y-1 pl-6">
                        {list.map((item) => (
                          <li key={item.id}>
                            <Label className="flex items-center gap-2 text-xs font-normal">
                              <Checkbox
                                disabled={disabled || channelWide}
                                checked={channelWide || selected.has(item.id)}
                                onCheckedChange={() => toggleAccount(channel, item.id)}
                              />
                              {item.label}
                            </Label>
                          </li>
                        ))}
                        <p className="text-muted-foreground pt-1 text-xs">
                          Leave all unchecked with the channel enabled for full channel access.
                        </p>
                      </ul>
                    )
                  ) : null}
                </div>
              )
            })
          )}
        </div>
      ) : null}
    </div>
  )
}
