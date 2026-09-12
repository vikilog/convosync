import { useState } from 'react'
import { Check, Loader2 } from 'lucide-react'

import { useConfirm } from '@/components/common/ConfirmDialogProvider'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ApiError } from '@/lib/httpClient'
import { openRazorpayCheckout } from '@/lib/razorpay'
import { isUnlimitedLimit, realBillingService, type TenantPlan } from '@/services/realBilling.service'

function planHighlights(plan: TenantPlan): string[] {
  const f = plan.features
  const lines = [f.channels, `${f.teamMembers} seats`, `${f.aiAgents} AI Agent(s)`]
  if (plan.aiCopilot) lines.push('AI Copilot included')
  if (plan.walletCredits) lines.push(`${plan.walletCredits} wallet`)
  if (plan.socialListening || plan.voiceAgent || plan.developers) {
    lines.push(
      [
        plan.socialListening ? 'Social Listening' : null,
        plan.voiceAgent ? 'Voice' : null,
        plan.developers ? 'Developers' : null,
      ]
        .filter(Boolean)
        .join(' · ')
    )
  }
  if (plan.prioritySupport) lines.push('Priority support')
  return lines.filter(Boolean).slice(0, 6)
}

export function PlansPanel() {
  const { data: sub, isLoading } = realBillingService.useSubscription()
  const { data: billing } = realBillingService.useWorkspaceBilling()
  const createSubscription = realBillingService.useCreateSubscription()
  const verifySubscription = realBillingService.useVerifySubscription()
  const cancelSubscription = realBillingService.useCancelSubscription()
  const confirm = useConfirm()

  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('monthly')
  const [upgradingPlanId, setUpgradingPlanId] = useState<string | null>(null)

  if (isLoading || !sub) {
    return (
      <div className="text-muted-foreground flex items-center gap-2 py-12 text-sm">
        <Loader2 className="size-4 animate-spin" />
        Loading plans…
      </div>
    )
  }

  const currentPlan = sub.currentPlan
  const usage = billing?.usageSnapshot

  const usageMetrics = usage
    ? [
        { label: 'Contacts', ...usage.contacts },
        { label: 'Channels', ...usage.channels },
        { label: 'AI agents', ...usage.aiAgents },
        { label: 'Team members', ...usage.teamMembers },
        { label: 'AI tokens', used: usage.aiTokens.used, limit: usage.aiTokens.limit },
      ]
    : []

  const cancelPlan = async () => {
    const ok = await confirm({
      title: 'Cancel subscription?',
      description: 'Your plan stays active until the end of the current billing period.',
      confirmLabel: 'Cancel subscription',
      destructive: true,
    })
    if (ok) {
      cancelSubscription.mutate(true, {
        onError: (err) =>
          window.alert(err instanceof ApiError ? err.message : 'Could not cancel subscription.'),
      })
    }
  }

  const upgrade = async (plan: TenantPlan) => {
    setUpgradingPlanId(plan.id)
    try {
      const result = await createSubscription.mutateAsync({ planId: plan.id, billingCycle })
      const response = await openRazorpayCheckout({
        key: result.keyId,
        subscription_id: result.subscriptionId,
        currency: result.currency,
        name: 'ConvoSync',
        description: `${result.plan.name} plan — ${result.billingCycle}`,
        theme: { color: '#16a34a' },
      })
      await verifySubscription.mutateAsync({
        razorpay_payment_id: response.razorpay_payment_id,
        razorpay_subscription_id: response.razorpay_subscription_id ?? result.subscriptionId,
        razorpay_signature: response.razorpay_signature,
      })
      window.alert('Plan upgraded successfully.')
    } catch (err) {
      const message =
        err instanceof ApiError
          ? err.message
          : err instanceof Error
            ? err.message
            : 'Upgrade could not be completed.'
      if (message !== 'Payment cancelled') window.alert(message)
    } finally {
      setUpgradingPlanId(null)
    }
  }

  return (
    <div className="space-y-4">
      {currentPlan ? (
        <Card className="border-primary/30 bg-primary/5">
          <CardHeader>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <CardTitle>{currentPlan.name} plan</CardTitle>
                  <Badge>Current</Badge>
                </div>
                <p className="text-muted-foreground mt-1 text-sm">
                  {currentPlan.price != null
                    ? `₹${currentPlan.price.toLocaleString()} / month`
                    : 'Custom pricing'}
                  {sub.trial?.isTrial ? ` · ${sub.trial.trialDaysLeft} days left in trial` : ''}
                </p>
              </div>
              {billing?.billingSubscription ? (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => void cancelPlan()}
                  disabled={cancelSubscription.isPending}
                >
                  Cancel subscription
                </Button>
              ) : null}
            </div>
          </CardHeader>
          {usageMetrics.length > 0 ? (
            <CardContent>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
                {usageMetrics.map((metric) => {
                  const unlimited = isUnlimitedLimit(metric.limit)
                  const pct = unlimited
                    ? 0
                    : Math.min(100, Math.round((metric.used / (metric.limit || 1)) * 100))
                  return (
                    <div key={metric.label}>
                      <div className="mb-1 flex items-center justify-between text-xs">
                        <span className="font-medium">{metric.label}</span>
                        <span className="text-muted-foreground">
                          {metric.used.toLocaleString()}/
                          {unlimited ? 'Unlimited' : metric.limit.toLocaleString()}
                        </span>
                      </div>
                      <Progress value={pct} />
                    </div>
                  )
                })}
              </div>
            </CardContent>
          ) : null}
        </Card>
      ) : null}

      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold">All plans</p>
        <Tabs value={billingCycle} onValueChange={(v) => setBillingCycle(v as 'monthly' | 'annual')}>
          <TabsList>
            <TabsTrigger value="monthly">Monthly</TabsTrigger>
            <TabsTrigger value="annual">
              Annual
              <Badge variant="secondary" className="ml-1">
                Save
              </Badge>
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {sub.plans.map((plan) => {
          const isCurrent = plan.id === sub.currentPlanSlug || plan.planId === sub.currentPlanSlug
          const price =
            plan.price == null
              ? null
              : billingCycle === 'annual' && plan.annualPrice
                ? plan.annualPrice
                : plan.price
          const isUpgrading = upgradingPlanId === plan.id

          return (
            <Card key={plan.id} className={plan.popular ? 'border-primary/40' : ''}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>{plan.name}</CardTitle>
                  {isCurrent ? (
                    <Badge>Current</Badge>
                  ) : plan.popular ? (
                    <Badge variant="secondary">Popular</Badge>
                  ) : null}
                </div>
                <p className="text-2xl font-semibold tabular-nums">
                  {price !== null ? `₹${price.toLocaleString()}` : (plan.priceLabel ?? 'Custom')}
                  {price !== null ? (
                    <span className="text-muted-foreground text-sm font-normal"> /mo</span>
                  ) : null}
                </p>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm">
                  {planHighlights(plan).map((f) => (
                    <li key={f} className="flex items-start gap-2">
                      <Check className="text-primary mt-0.5 size-3.5 shrink-0" />
                      <span className="text-muted-foreground">{f}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
              <CardFooter>
                <Button
                  variant={isCurrent ? 'outline' : 'default'}
                  disabled={isCurrent || plan.isCustom || isUpgrading}
                  className="w-full"
                  onClick={() => void upgrade(plan)}
                >
                  {isUpgrading ? <Loader2 className="animate-spin" /> : null}
                  {isCurrent ? 'Current plan' : plan.isCustom ? 'Contact sales' : 'Upgrade'}
                </Button>
              </CardFooter>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
