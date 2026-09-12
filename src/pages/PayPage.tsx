import { useState, type ComponentType } from 'react'
import { Link } from 'react-router-dom'
import { CheckCircle2, Clock, CreditCard, Loader2, Plus, RefreshCw, Send, XCircle } from 'lucide-react'
import { toast } from 'sonner'

import { useConfirm } from '@/components/common/ConfirmDialogProvider'
import { EmptyState } from '@/components/common/EmptyState'
import { CreatePaymentRequestSheet } from '@/components/pay/CreatePaymentRequestSheet'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { ApiError } from '@/lib/httpClient'
import { pathForIntegrationsChannel } from '@/lib/planChannels'
import { formatPayAmount, formatPayDate } from '@/lib/payFormat'
import { realIntegrationsService } from '@/services/realIntegrations.service'
import {
  realWhatsAppPayService,
  type PayRequestFilter,
  type WhatsAppPayRequest,
} from '@/services/realWhatsAppPay.service'

const FILTERS: { value: PayRequestFilter; label: string }[] = [
  { value: 'ALL', label: 'All' },
  { value: 'draft', label: 'Draft' },
  { value: 'sent', label: 'Sent' },
  { value: 'paid', label: 'Paid' },
]

function statusVariant(status: string): 'default' | 'secondary' | 'destructive' | 'outline' {
  if (status === 'paid') return 'default'
  if (status === 'failed') return 'destructive'
  if (status === 'sent') return 'secondary'
  return 'outline'
}

function reportError(err: unknown, fallback: string) {
  toast.error(err instanceof ApiError ? err.message : fallback)
}

export function PayPage() {
  const confirm = useConfirm()
  const { data: waStatus, isLoading: waLoading } = realIntegrationsService.useWhatsAppStatus()
  const [filter, setFilter] = useState<PayRequestFilter>('ALL')
  const [showCreate, setShowCreate] = useState(false)
  const summaryQuery = realWhatsAppPayService.useSummary()
  const listQuery = realWhatsAppPayService.useList(filter)
  const send = realWhatsAppPayService.useSend()
  const cancel = realWhatsAppPayService.useCancel()
  const refresh = realWhatsAppPayService.useRefresh()

  const summary = summaryQuery.data
  const requests = listQuery.data?.requests ?? []
  const busyId = send.isPending
    ? send.variables
    : cancel.isPending
      ? cancel.variables
      : refresh.isPending
        ? refresh.variables
        : null

  const run = (id: string, fn: (id: string) => Promise<unknown>, fallback: string) => {
    void fn(id).catch((err: unknown) => reportError(err, fallback))
  }

  if (waLoading) {
    return (
      <div className="text-muted-foreground flex items-center justify-center gap-2 p-12 text-sm">
        <Loader2 className="size-4 animate-spin" />
        Loading WhatsApp Pay…
      </div>
    )
  }

  if (!waStatus?.connected) {
    return (
      <div className="mx-auto max-w-lg p-8">
        <EmptyState
          icon={CreditCard}
          title="WhatsApp Pay"
          description="Connect WhatsApp first, then send Razorpay payment links in customer chats."
          action={
            <Button asChild>
              <Link to={pathForIntegrationsChannel('whatsapp')}>Connect WhatsApp</Link>
            </Button>
          }
        />
      </div>
    )
  }

  const payApiUnavailable = !summary && Boolean(summaryQuery.error)
  const canCreate = Boolean(summary?.razorpayConfigured) && !payApiUnavailable

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-6">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold">WhatsApp Pay</h1>
          <p className="text-muted-foreground mt-1 max-w-2xl text-sm">
            Create payment requests and send secure UPI / card links inside WhatsApp conversations.
          </p>
        </div>
        <Button disabled={!canCreate} onClick={() => setShowCreate(true)}>
          <Plus />
          New payment request
        </Button>
      </header>

      {!summary?.razorpayConfigured && !payApiUnavailable ? (
        <p className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          Razorpay is not configured on the server. Payment links cannot be created until{' '}
          <code className="rounded bg-amber-100 px-1 text-xs">RAZORPAY_KEY_ID</code> and{' '}
          <code className="rounded bg-amber-100 px-1 text-xs">RAZORPAY_KEY_SECRET</code> are set.
        </p>
      ) : null}

      {summaryQuery.error ? (
        <p className="text-destructive rounded-xl border px-4 py-3 text-sm">
          {summaryQuery.error instanceof ApiError ? summaryQuery.error.message : 'Failed to load WhatsApp Pay'}
        </p>
      ) : null}

      <section className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Kpi
          label="Collected"
          value={formatPayAmount(summary?.totalCollectedPaise ?? 0)}
          sub={`${summary?.paidCount ?? 0} paid`}
          icon={CheckCircle2}
        />
        <Kpi label="Pending" value={String(summary?.pendingCount ?? 0)} sub="Awaiting payment" icon={Clock} />
        <Kpi label="Sent in chat" value={String(summary?.sentCount ?? 0)} sub="WhatsApp links delivered" icon={Send} />
        <Kpi label="Total requests" value={String(summary?.requestCount ?? 0)} sub="All time" icon={CreditCard} />
      </section>

      <div className="flex flex-wrap items-center gap-2">
        {FILTERS.map((f) => (
          <Button
            key={f.value}
            size="sm"
            variant={filter === f.value ? 'default' : 'outline'}
            onClick={() => setFilter(f.value)}
          >
            {f.label}
          </Button>
        ))}
        <Button
          size="sm"
          variant="ghost"
          className="ml-auto"
          onClick={() => {
            void summaryQuery.refetch()
            void listQuery.refetch()
          }}
        >
          <RefreshCw />
          Refresh
        </Button>
      </div>

      {requests.length === 0 ? (
        <EmptyState
          icon={CreditCard}
          title="No payment requests yet"
          description="Create a request and send a secure payment link in WhatsApp chat."
          action={
            <Button disabled={!canCreate} onClick={() => setShowCreate(true)}>
              <Plus />
              New payment request
            </Button>
          }
        />
      ) : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Contact</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Updated</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {requests.map((row) => (
                  <PayRow
                    key={row.id}
                    row={row}
                    busy={busyId === row.id}
                    onSend={() => run(row.id, (id) => send.mutateAsync(id), 'Failed to send payment request')}
                    onRefresh={() => run(row.id, (id) => refresh.mutateAsync(id), 'Failed to refresh status')}
                    onCancel={() =>
                      void confirm({
                        title: 'Cancel this payment request?',
                        confirmLabel: 'Cancel request',
                        destructive: true,
                      }).then((ok) => {
                        if (ok) run(row.id, (id) => cancel.mutateAsync(id), 'Failed to cancel')
                      })
                    }
                  />
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      <p className="text-muted-foreground text-xs">
        Payments are processed via Razorpay. Enable the{' '}
        <code className="bg-muted rounded px-1">payment_link.paid</code> webhook event for automatic status
        updates. Open{' '}
        <Link to="/inbox" className="text-primary font-medium hover:underline">
          Inbox
        </Link>{' '}
        to see payment messages in conversation threads.
      </p>

      <CreatePaymentRequestSheet
        open={showCreate}
        onOpenChange={setShowCreate}
        onCreated={() => setShowCreate(false)}
      />
    </div>
  )
}

function Kpi({
  label,
  value,
  sub,
  icon: Icon,
}: {
  label: string
  value: string
  sub: string
  icon: ComponentType<{ className?: string }>
}) {
  return (
    <Card>
      <CardContent className="space-y-1">
        <Icon className="text-muted-foreground size-4" />
        <p className="text-muted-foreground text-[11px] font-semibold tracking-wide uppercase">{label}</p>
        <p className="font-mono text-2xl font-semibold">{value}</p>
        <p className="text-muted-foreground text-xs">{sub}</p>
      </CardContent>
    </Card>
  )
}

function PayRow({
  row,
  busy,
  onSend,
  onRefresh,
  onCancel,
}: {
  row: WhatsAppPayRequest
  busy: boolean
  onSend: () => void
  onRefresh: () => void
  onCancel: () => void
}) {
  return (
    <TableRow>
      <TableCell>
        <p className="font-medium">{row.contactName}</p>
        <p className="text-muted-foreground text-xs">{row.contactPhone}</p>
      </TableCell>
      <TableCell className="font-mono font-medium">{formatPayAmount(row.amountPaise)}</TableCell>
      <TableCell className="max-w-[200px] truncate">{row.description}</TableCell>
      <TableCell>
        <Badge variant={statusVariant(row.status)} className="capitalize">
          {row.status}
        </Badge>
      </TableCell>
      <TableCell className="text-muted-foreground text-xs">
        {formatPayDate(row.paidAt ?? row.sentAt ?? row.createdAt)}
      </TableCell>
      <TableCell>
        <div className="flex items-center justify-end gap-1">
          {row.status === 'draft' || row.status === 'sent' ? (
            <Button size="sm" disabled={busy} onClick={onSend}>
              {busy ? <Loader2 className="animate-spin" /> : <Send />}
              {row.status === 'draft' ? 'Send' : 'Resend'}
            </Button>
          ) : null}
          {row.status === 'sent' ? (
            <Button size="sm" variant="outline" disabled={busy} onClick={onRefresh}>
              Check
            </Button>
          ) : null}
          {row.status !== 'paid' && row.status !== 'cancelled' ? (
            <Button size="icon-sm" variant="ghost" disabled={busy} onClick={onCancel} aria-label="Cancel">
              <XCircle className="text-destructive" />
            </Button>
          ) : null}
          {row.paymentLinkUrl ? (
            <a
              href={row.paymentLinkUrl}
              target="_blank"
              rel="noreferrer"
              className="text-primary px-1 text-xs font-medium hover:underline"
            >
              Link
            </a>
          ) : null}
        </div>
      </TableCell>
    </TableRow>
  )
}
