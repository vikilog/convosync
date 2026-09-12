import { useState } from 'react'
import { Link } from 'react-router-dom'
import { AlertCircle, Database, Loader2, RefreshCw, Sparkles } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { realDevelopersService, type AiConnectionStatus, type SyncEvent } from '@/services/realDevelopers.service'

function formatDate(iso: string | null): string {
  if (!iso) return '—'
  return new Date(iso).toLocaleString('en-GB', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  })
}

const STATUS_STYLES: Record<string, string> = {
  connected: 'bg-[#e6f7ec] text-channel-green border-[#25d366]/40',
  syncing: 'bg-sky-50 text-primary border-primary/20',
  failed: 'bg-destructive/10 text-destructive border-destructive/20',
  disconnected: 'bg-amber-50 text-amber-700 border-amber-200',
  not_configured: 'bg-muted text-muted-foreground border-border',
}

const EVENT_STATUS_CLASS: Record<SyncEvent['status'], string> = {
  completed: 'text-channel-green',
  failed: 'text-destructive',
  pending: 'text-amber-600',
  processing: 'text-amber-600',
}

export function AiSyncPanel() {
  const dashQ = realDevelopersService.useAiSync()
  const eventsQ = realDevelopersService.useAiSyncEvents()
  const rebuild = realDevelopersService.useRebuildKnowledge()
  const [rebuildMsg, setRebuildMsg] = useState<string | null>(null)

  const dashboard = dashQ.data
  const events = eventsQ.data ?? []
  const error = dashQ.error ?? eventsQ.error ?? rebuild.error
  const status = (dashboard?.connectionStatus ?? 'not_configured') as AiConnectionStatus
  const loading = dashQ.isLoading && !dashboard

  const refresh = () => {
    void dashQ.refetch()
    void eventsQ.refetch()
  }

  if (loading) {
    return (
      <div className="text-muted-foreground flex items-center gap-2 py-8 text-sm">
        <Loader2 className="size-4 animate-spin" />
        Loading AI Sync…
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <p className="text-muted-foreground max-w-lg text-xs">
          Uses existing AI Knowledge Sync. Rebuild enqueues an event-driven full sync — ready for Vector DB,
          AI Agent, and Journey Engine pipelines.
        </p>
        <Link to="/settings?section=ai-knowledge" className="text-primary shrink-0 text-xs font-semibold hover:underline">
          Configure MongoDB →
        </Link>
      </div>

      {error ? (
        <div className="border-destructive/20 bg-destructive/10 text-destructive flex items-start gap-2 rounded-lg border px-3 py-2.5 text-xs">
          <AlertCircle className="size-4 shrink-0" />
          <span>{error instanceof Error ? error.message : 'Failed to load AI Sync'}</span>
        </div>
      ) : null}

      {rebuildMsg ? (
        <div className="border-channel-green/40 text-channel-green rounded-lg border bg-[#e6f7ec] px-3 py-2 text-xs font-medium">
          {rebuildMsg}
        </div>
      ) : null}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="space-y-3 rounded-2xl border p-4">
          <div className="flex items-center gap-2">
            <Database className="text-muted-foreground size-4" />
            <p className="text-sm font-semibold">Connection</p>
          </div>
          <span
            className={`inline-flex w-fit rounded-full border px-2.5 py-1 text-xs font-semibold capitalize ${STATUS_STYLES[status] ?? STATUS_STYLES.not_configured}`}
          >
            {status.replace(/_/g, ' ')}
          </span>
          <dl className="space-y-1.5 text-xs">
            <div className="flex justify-between gap-2">
              <dt className="text-muted-foreground">Venue ID</dt>
              <dd className="truncate font-mono">{dashboard?.venueId ?? '—'}</dd>
            </div>
            <div className="flex justify-between gap-2">
              <dt className="text-muted-foreground">Last sync</dt>
              <dd>{formatDate(dashboard?.lastSyncTime ?? null)}</dd>
            </div>
            <div className="flex justify-between gap-2">
              <dt className="text-muted-foreground">Last event</dt>
              <dd>{formatDate(dashboard?.lastEventTime ?? null)}</dd>
            </div>
          </dl>
        </div>

        <div className="space-y-3 rounded-2xl border p-4">
          <div className="flex items-center gap-2">
            <Sparkles className="text-muted-foreground size-4" />
            <p className="text-sm font-semibold">Knowledge health</p>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {(
              [
                ['Services', dashboard?.knowledgeHealth.services ?? 0],
                ['Products', dashboard?.knowledgeHealth.products ?? 0],
                ['Customers', dashboard?.knowledgeHealth.customers ?? 0],
                ['Staff', dashboard?.knowledgeHealth.staff ?? 0],
              ] as const
            ).map(([label, value]) => (
              <div key={label} className="bg-muted/40 rounded-xl border px-3 py-2 text-center">
                <p className="font-mono text-lg font-bold tabular-nums">{value.toLocaleString()}</p>
                <p className="text-muted-foreground text-xs">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border p-4">
        <div className="flex flex-wrap items-center gap-4 text-sm">
          <span>
            Pending jobs:{' '}
            <span className="font-semibold text-amber-600">{dashboard?.pendingQueueJobs ?? 0}</span>
          </span>
          <span>
            Failed events: <span className="text-destructive font-semibold">{dashboard?.failedEvents ?? 0}</span>
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={refresh}>
            <RefreshCw />
            Refresh
          </Button>
          <Button
            size="sm"
            disabled={rebuild.isPending || status === 'not_configured'}
            onClick={() => {
              setRebuildMsg(null)
              void rebuild.mutateAsync().then((res) => setRebuildMsg(res.message ?? 'Rebuild queued'))
            }}
          >
            {rebuild.isPending ? <Loader2 className="animate-spin" /> : <RefreshCw />}
            Rebuild knowledge
          </Button>
        </div>
      </div>

      {events.length > 0 ? (
        <div className="overflow-hidden rounded-2xl border">
          <div className="bg-muted/50 px-4 py-2 text-xs font-semibold tracking-wide uppercase">Recent sync events</div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Time</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {events.map((event) => (
                <TableRow key={event.id}>
                  <TableCell className="text-muted-foreground text-xs">{formatDate(event.createdAt)}</TableCell>
                  <TableCell className="font-mono text-xs">{event.eventType}</TableCell>
                  <TableCell>
                    <span className={`text-xs font-semibold capitalize ${EVENT_STATUS_CLASS[event.status] ?? ''}`}>
                      {event.status}
                    </span>
                    {event.errorMessage ? (
                      <p className="text-muted-foreground mt-0.5 max-w-xs truncate text-[11px]">{event.errorMessage}</p>
                    ) : null}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      ) : null}
    </div>
  )
}
