import { useState } from 'react'
import { Coins, Loader2 } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { ApiError } from '@/lib/httpClient'
import { openRazorpayCheckout } from '@/lib/razorpay'
import { realBillingService, WALLET_USAGE_RATES } from '@/services/realBilling.service'

export function WalletPanel() {
  const { data: wallet, isLoading } = realBillingService.useWallet()
  const { data: txData } = realBillingService.useWalletTransactions(20)
  const createOrder = realBillingService.useCreateOrder()
  const verifyOrder = realBillingService.useVerifyOrder()

  const [selectedPreset, setSelectedPreset] = useState<number | null>(1000)
  const [customAmount, setCustomAmount] = useState('')
  const [recharging, setRecharging] = useState(false)

  if (isLoading || !wallet) {
    return (
      <div className="text-muted-foreground flex items-center gap-2 py-12 text-sm">
        <Loader2 className="size-4 animate-spin" />
        Loading wallet…
      </div>
    )
  }

  const transactions = txData?.transactions ?? []
  const amountInr = customAmount ? Number(customAmount) : (selectedPreset ?? 0)

  const recharge = async () => {
    if (!amountInr || amountInr < 100) {
      window.alert('Minimum recharge is ₹100.')
      return
    }
    setRecharging(true)
    try {
      const order = await createOrder.mutateAsync({
        purpose: 'wallet_topup',
        amountPaise: Math.round(amountInr * 100),
        description: `Wallet recharge — ${amountInr.toLocaleString()} CC`,
      })
      const response = await openRazorpayCheckout({
        key: order.keyId,
        order_id: order.orderId,
        amount: order.amountPaise,
        currency: order.currency,
        name: 'ConvoSync',
        description: 'Wallet recharge',
        theme: { color: '#16a34a' },
      })
      await verifyOrder.mutateAsync({
        razorpay_order_id: response.razorpay_order_id ?? order.orderId,
        razorpay_payment_id: response.razorpay_payment_id,
        razorpay_signature: response.razorpay_signature,
      })
      window.alert('Wallet recharged successfully.')
    } catch (err) {
      const message =
        err instanceof ApiError
          ? err.message
          : err instanceof Error
            ? err.message
            : 'Recharge could not be completed.'
      if (message !== 'Payment cancelled') window.alert(message)
    } finally {
      setRecharging(false)
    }
  }

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
      <div className="space-y-4 lg:col-span-2">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Balance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <Coins className="size-6 text-amber-500" />
                <p className="text-3xl font-semibold tabular-nums">{wallet.balanceInr.toLocaleString()}</p>
                <span className="text-muted-foreground text-sm">CC</span>
              </div>
              <p className="text-muted-foreground mt-2 text-xs">
                {wallet.monthSpentInr.toLocaleString()} CC spent this month
              </p>
              {wallet.isLowBalance ? (
                <Badge variant="destructive" className="mt-2">
                  Low balance
                </Badge>
              ) : null}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Recharge wallet</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-3 gap-2">
                {wallet.topUpPresetsInr.map((amount) => (
                  <Button
                    key={amount}
                    variant={selectedPreset === amount ? 'secondary' : 'outline'}
                    size="sm"
                    onClick={() => {
                      setSelectedPreset(amount)
                      setCustomAmount('')
                    }}
                  >
                    ₹{amount.toLocaleString()}
                  </Button>
                ))}
              </div>
              <Input
                type="number"
                placeholder="Custom amount (min ₹100)"
                value={customAmount}
                onChange={(e) => {
                  setCustomAmount(e.target.value)
                  setSelectedPreset(null)
                }}
              />
              <Button
                size="sm"
                className="w-full"
                disabled={!amountInr || recharging}
                onClick={() => void recharge()}
              >
                {recharging ? <Loader2 className="animate-spin" /> : null}
                Recharge {amountInr ? `₹${amountInr.toLocaleString()}` : ''}
              </Button>
              <p className="text-muted-foreground text-xs">Plus 18% GST. 1 CC = ₹1.</p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Usage rates</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="divide-y">
              {WALLET_USAGE_RATES.map((rate) => (
                <li key={rate.feature} className="flex items-center justify-between py-2 text-sm">
                  <span className="text-muted-foreground">{rate.feature}</span>
                  <span className="font-medium tabular-nums">{rate.cost}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent activity</CardTitle>
        </CardHeader>
        <CardContent>
          {transactions.length === 0 ? (
            <p className="text-muted-foreground text-sm">No transactions yet.</p>
          ) : (
            <ul className="divide-y">
              {transactions.map((tx) => (
                <li key={tx.id} className="flex items-center justify-between gap-2 py-2.5">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{tx.description ?? tx.categoryLabel}</p>
                    <p className="text-muted-foreground text-xs">
                      {new Date(tx.createdAt).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </p>
                  </div>
                  <Badge
                    variant={tx.type === 'credit' ? 'default' : 'outline'}
                    className="shrink-0 tabular-nums"
                  >
                    {tx.type === 'credit' ? '+' : '-'}
                    {tx.amountInr.toLocaleString()} CC
                  </Badge>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
