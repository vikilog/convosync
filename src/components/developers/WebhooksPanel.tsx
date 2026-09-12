import { useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { CheckCircle2, Copy, Plus, RefreshCw, Trash2, Webhook } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { WEBHOOK_EVENTS, type OutgoingWebhook, type WebhookEvent } from '@/lib/developersMockData'
import { realDevelopersService } from '@/services/realDevelopers.service'

type WebhookTab = 'incoming' | 'outgoing' | 'logs'

function formatDate(iso: string | null): string {
  if (!iso) return '—'
  return new Date(iso).toLocaleString('en-GB', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function EventPills({
  selected,
  onToggle,
}: {
  selected: WebhookEvent[]
  onToggle: (event: WebhookEvent) => void
}) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {WEBHOOK_EVENTS.map((event) => {
        const active = selected.includes(event)
        return (
          <button
            key={event}
            type="button"
            onClick={() => onToggle(event)}
            className={`rounded-full border px-2.5 py-1 font-mono text-xs transition-colors ${
              active
                ? 'bg-primary text-primary-foreground border-primary'
                : 'text-muted-foreground hover:border-primary/40 hover:text-foreground'
            }`}
          >
            {event}
          </button>
        )
      })}
    </div>
  )
}

function IncomingWebhookCard() {
  const { data: webhook, isLoading } = realDevelopersService.useIncomingWebhook()
  const updateWebhook = realDevelopersService.useUpdateIncomingWebhook()

  if (isLoading || !webhook) {
    return <p className="text-muted-foreground py-8 text-center text-sm">Loading incoming webhook…</p>
  }

  const toggleEvent = (event: WebhookEvent) => {
    const subscribedEvents = webhook.subscribedEvents.includes(event)
      ? webhook.subscribedEvents.filter((e) => e !== event)
      : [...webhook.subscribedEvents, event]
    updateWebhook.mutate({ subscribedEvents })
  }

  return (
    <div className="space-y-4 rounded-2xl border p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="text-primary flex size-9 shrink-0 items-center justify-center rounded-xl bg-sky-50">
            <Webhook className="size-4" />
          </div>
          <div>
            <p className="text-sm font-semibold">Incoming webhook</p>
            <p className="text-muted-foreground max-w-md text-xs">
              Signed with header <code className="bg-muted rounded px-1 py-0.5">X-ConvoSync-Secret</code>.
            </p>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <span className="text-muted-foreground text-xs">Enabled</span>
          <Switch
            checked={webhook.enabled}
            onCheckedChange={(v) => updateWebhook.mutate({ enabled: v })}
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <p className="text-muted-foreground text-xs font-medium">Webhook URL</p>
        <div className="flex items-center gap-2">
          <code className="bg-muted flex-1 truncate rounded-md px-2.5 py-2 font-mono text-xs">
            {webhook.webhookUrl}
          </code>
          <Button
            variant="outline"
            size="icon-sm"
            onClick={() => navigator.clipboard?.writeText(webhook.webhookUrl)}
            aria-label="Copy webhook URL"
          >
            <Copy />
          </Button>
        </div>
      </div>

      <div className="space-y-1.5">
        <p className="text-muted-foreground text-xs font-medium">Secret</p>
        <div className="flex items-center gap-2">
          <code className="bg-muted flex-1 truncate rounded-md px-2.5 py-2 font-mono text-xs">
            {webhook.secret}
          </code>
          <Button
            variant="outline"
            size="icon-sm"
            onClick={() => navigator.clipboard?.writeText(webhook.secret)}
            aria-label="Copy secret"
          >
            <Copy />
          </Button>
          <Button variant="outline" size="sm" onClick={() => updateWebhook.mutate({ regenerateSecret: true })}>
            Regenerate
          </Button>
        </div>
      </div>

      <p className="text-muted-foreground text-xs">Last event: {formatDate(webhook.lastEventAt)}</p>

      <div className="space-y-1.5">
        <p className="text-muted-foreground text-xs font-medium">Accepted event types</p>
        <EventPills selected={webhook.subscribedEvents} onToggle={toggleEvent} />
      </div>
    </div>
  )
}

function AddOutgoingForm({ onClose }: { onClose: () => void }) {
  const createWebhook = realDevelopersService.useCreateOutgoingWebhook()
  const [name, setName] = useState('')
  const [url, setUrl] = useState('')
  const [secret, setSecret] = useState('')
  const [events, setEvents] = useState<WebhookEvent[]>([])

  const toggleEvent = (event: WebhookEvent) => {
    setEvents((prev) => (prev.includes(event) ? prev.filter((e) => e !== event) : [...prev, event]))
  }

  const canSave = name.trim().length > 0 && url.trim().length > 0

  const save = () => {
    createWebhook.mutate({
      name: name.trim(),
      url: url.trim(),
      secret: secret.trim() || undefined,
      enabled: true,
      subscribedEvents: events,
      maxRetries: 3,
      timeoutMs: 10000,
    })
    onClose()
  }

  return (
    <div className="border-primary/20 bg-muted/30 space-y-3 rounded-2xl border p-4">
      <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Name" />
      <Input
        value={url}
        onChange={(e) => setUrl(e.target.value)}
        placeholder="https://your-server.com/webhook"
      />
      <Input
        value={secret}
        onChange={(e) => setSecret(e.target.value)}
        placeholder="Signing secret (optional)"
      />
      <EventPills selected={events} onToggle={toggleEvent} />
      <div className="flex justify-end gap-2">
        <Button variant="ghost" size="sm" onClick={onClose}>
          Cancel
        </Button>
        <Button size="sm" disabled={!canSave} onClick={save}>
          Save
        </Button>
      </div>
    </div>
  )
}

function OutgoingWebhooksSection() {
  const { data: webhooks = [] } = realDevelopersService.useOutgoingWebhooks()
  const removeWebhook = realDevelopersService.useRemoveOutgoingWebhook()
  const [showAdd, setShowAdd] = useState(false)

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <p className="text-muted-foreground text-xs">
          Subscribe to platform events. Retries and delivery logs are recorded automatically.
        </p>
        {!showAdd ? (
          <Button variant="ghost" size="sm" onClick={() => setShowAdd(true)}>
            <Plus />
            Add webhook
          </Button>
        ) : null}
      </div>

      {showAdd ? <AddOutgoingForm onClose={() => setShowAdd(false)} /> : null}

      {webhooks.length === 0 ? (
        <p className="text-muted-foreground py-8 text-center text-sm">No outgoing webhooks yet.</p>
      ) : (
        <div className="space-y-2">
          {webhooks.map((webhook: OutgoingWebhook) => (
            <div key={webhook.id} className="flex items-start justify-between gap-3 rounded-2xl border p-4">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <p className="truncate text-sm font-semibold">{webhook.name}</p>
                  <Badge variant={webhook.enabled ? 'default' : 'secondary'}>
                    {webhook.enabled ? 'Active' : 'Disabled'}
                  </Badge>
                </div>
                <p className="text-muted-foreground truncate text-xs">{webhook.url}</p>
                <p className="text-muted-foreground mt-1 text-xs">
                  Retries: {webhook.maxRetries} · Timeout: {webhook.timeoutMs}ms · Events:{' '}
                  {webhook.subscribedEvents.length || 'none'}
                </p>
              </div>
              <Button
                variant="ghost"
                size="icon-sm"
                className="text-muted-foreground hover:text-destructive shrink-0"
                onClick={() => removeWebhook.mutate(webhook.id)}
                aria-label={`Delete ${webhook.name}`}
              >
                <Trash2 />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

const LOG_STATUS_CLASS: Record<string, string> = {
  success: 'text-channel-green',
  failed: 'text-destructive',
  pending: 'text-amber-600',
  retrying: 'text-amber-600',
}

function EventLogsSection() {
  const { data: logs = [] } = realDevelopersService.useWebhookLogs()

  return (
    <div className="overflow-hidden rounded-2xl border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Time</TableHead>
            <TableHead>Direction</TableHead>
            <TableHead>Event</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Attempt</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {logs.length === 0 ? (
            <TableRow>
              <TableCell colSpan={5} className="text-muted-foreground py-8 text-center text-sm">
                No delivery logs yet.
              </TableCell>
            </TableRow>
          ) : (
            logs.map((log) => (
              <TableRow key={log.id}>
                <TableCell className="text-muted-foreground text-xs">{formatDate(log.createdAt)}</TableCell>
                <TableCell className="text-sm capitalize">{log.direction}</TableCell>
                <TableCell className="font-mono text-xs">{log.eventType}</TableCell>
                <TableCell>
                  <span
                    className={`inline-flex items-center gap-1 text-xs font-semibold ${LOG_STATUS_CLASS[log.status]}`}
                  >
                    {log.status === 'success' ? <CheckCircle2 className="size-3" /> : null}
                    {log.status}
                    {log.statusCode ? ` (${log.statusCode})` : ''}
                  </span>
                  {log.errorMessage ? (
                    <p className="text-muted-foreground mt-0.5 max-w-xs truncate text-[11px]">
                      {log.errorMessage}
                    </p>
                  ) : null}
                </TableCell>
                <TableCell className="text-right text-sm tabular-nums">{log.attempt}</TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  )
}

const TABS: { id: WebhookTab; label: string }[] = [
  { id: 'incoming', label: 'Incoming' },
  { id: 'outgoing', label: 'Outgoing' },
  { id: 'logs', label: 'Event Logs' },
]

export function WebhooksPanel() {
  const [tab, setTab] = useState<WebhookTab>('incoming')
  const queryClient = useQueryClient()

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-1">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
              tab === t.id ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-accent'
            }`}
          >
            {t.label}
          </button>
        ))}
        <Button
          variant="ghost"
          size="sm"
          className="ml-auto"
          onClick={() => {
            void queryClient.invalidateQueries({ queryKey: ['developer-webhooks-incoming'] })
            void queryClient.invalidateQueries({ queryKey: ['developer-webhooks-outgoing'] })
            void queryClient.invalidateQueries({ queryKey: ['developer-webhooks-logs'] })
          }}
        >
          <RefreshCw />
          Refresh
        </Button>
      </div>

      {tab === 'incoming' ? <IncomingWebhookCard /> : null}
      {tab === 'outgoing' ? <OutgoingWebhooksSection /> : null}
      {tab === 'logs' ? <EventLogsSection /> : null}
    </div>
  )
}
