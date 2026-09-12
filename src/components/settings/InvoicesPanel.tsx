import { Loader2 } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { realBillingService, type BillingTransaction } from '@/services/realBilling.service'

function statusVariant(status: string): 'default' | 'destructive' | 'outline' {
  if (status === 'paid' || status === 'captured') return 'default'
  if (status === 'failed') return 'destructive'
  return 'outline'
}

function formatAmount(tx: BillingTransaction) {
  const amount = tx.amountPaise / 100
  const symbol = tx.currency === 'USD' ? '$' : '₹'
  return `${symbol}${amount.toLocaleString()}`
}

export function InvoicesPanel() {
  const { data, isLoading } = realBillingService.useInvoices(100)
  const transactions = data?.transactions ?? []

  return (
    <Card>
      <CardHeader>
        <CardTitle>Invoice logs</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="text-muted-foreground flex items-center gap-2 py-8 text-sm">
            <Loader2 className="size-4 animate-spin" />
            Loading invoices…
          </div>
        ) : transactions.length === 0 ? (
          <p className="text-muted-foreground py-8 text-center text-sm">No invoices yet.</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Payment ID</TableHead>
                <TableHead>Order ID</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {transactions.map((invoice) => (
                <TableRow key={invoice.id}>
                  <TableCell className="text-muted-foreground text-xs">
                    {new Date(invoice.createdAt).toLocaleDateString('en-IN', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </TableCell>
                  <TableCell className="text-sm">{invoice.description ?? '—'}</TableCell>
                  <TableCell className="text-muted-foreground text-sm capitalize">
                    {invoice.type.replace(/_/g, ' ')}
                  </TableCell>
                  <TableCell className="text-sm font-medium">{formatAmount(invoice)}</TableCell>
                  <TableCell>
                    <Badge variant={statusVariant(invoice.status)} className="capitalize">
                      {invoice.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground font-mono text-xs">
                    {invoice.razorpayPaymentId ?? '—'}
                  </TableCell>
                  <TableCell className="text-muted-foreground font-mono text-xs">
                    {invoice.razorpayOrderId ?? '—'}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  )
}
