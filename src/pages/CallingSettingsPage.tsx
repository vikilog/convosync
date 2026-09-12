import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, IndianRupee, Loader2, Phone, PhoneOff, Save } from 'lucide-react'

import { useConfirm } from '@/components/common/ConfirmDialogProvider'
import { EmptyState } from '@/components/common/EmptyState'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { virtualNumberService } from '@/services/virtualNumber.service'

const DEFAULT_MISSED_CALL_MESSAGE =
  "Sorry we missed your call! We'll call you back shortly. Reply here if it's urgent."

function formatInr(paise: number): string {
  return `₹${(paise / 100).toFixed(2)}`
}

export function CallingSettingsPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const confirm = useConfirm()
  const { data: numbersData, isLoading } = virtualNumberService.useNumbers()
  const number = numbersData?.numbers.find((n) => n.id === id) ?? null
  const { data: pricing, isLoading: pricingLoading } = virtualNumberService.usePricing(number?.id)
  const updateSettings = virtualNumberService.useUpdateSettings(number?.id)
  const releaseNumber = virtualNumberService.useReleaseNumber(number?.id)

  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [autoReplyEnabled, setAutoReplyEnabled] = useState(false)
  const [message, setMessage] = useState(DEFAULT_MISSED_CALL_MESSAGE)
  const [saved, setSaved] = useState(false)
  const [releaseError, setReleaseError] = useState<string | null>(null)

  useEffect(() => {
    if (!number) return
    setName(number.label || '')
    setDescription(number.description || '')
    setAutoReplyEnabled(Boolean(number.missedCallAutoReplyEnabled))
    setMessage(number.missedCallMessage || DEFAULT_MISSED_CALL_MESSAGE)
  }, [number?.label, number?.description, number?.missedCallAutoReplyEnabled, number?.missedCallMessage])

  const handleSave = async () => {
    setSaved(false)
    await updateSettings.mutateAsync({
      label: name.trim(),
      description: description.trim(),
      missedCallAutoReplyEnabled: autoReplyEnabled,
      missedCallMessage: message.trim(),
    })
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  const handleRelease = async () => {
    setReleaseError(null)
    const ok = await confirm({
      title: `Release ${number?.label || number?.number}?`,
      description:
        'This permanently releases the number back to Plivo. Calling and WhatsApp on this number stop immediately, billing stops, and this cannot be undone.',
      confirmLabel: 'Release number',
      destructive: true,
    })
    if (!ok) return
    try {
      await releaseNumber.mutateAsync()
      navigate('/calling')
    } catch (err) {
      setReleaseError(err instanceof Error ? err.message : 'Could not release this number.')
    }
  }

  return (
    <div className="mx-auto w-full max-w-2xl space-y-6 p-6">
      <div className="flex items-center gap-3 border-b pb-4">
        <Button variant="outline" size="icon-sm" onClick={() => navigate('/calling')} aria-label="Back to calls">
          <ArrowLeft className="size-3.5" />
        </Button>
        <div>
          <h1 className="text-base font-semibold">Number Settings</h1>
          <p className="text-muted-foreground mt-1 text-xs">Manage this virtual number's behavior and pricing.</p>
        </div>
      </div>

      {isLoading ? (
        <div className="text-muted-foreground flex items-center gap-2 py-12 text-sm">
          <Loader2 className="size-4 animate-spin" />
          Loading…
        </div>
      ) : !number ? (
        <EmptyState
          icon={Phone}
          title="Number not found"
          description="This number may have been released, or you don't have access to it."
        />
      ) : (
        <>
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Your number</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                <span className="bg-muted flex size-10 shrink-0 items-center justify-center rounded-full">
                  <Phone className="size-4" />
                </span>
                <div>
                  <p className="font-mono text-sm font-semibold tabular-nums">{number.number}</p>
                  <p className="text-muted-foreground text-xs">{number.city ?? 'India'}</p>
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="number-name">Name</Label>
                <Input
                  id="number-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Sales Line, Support"
                  maxLength={80}
                />
                <p className="text-muted-foreground text-xs">
                  Shown instead of the raw number wherever you pick from your numbers.
                </p>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="number-description">Description</Label>
                <Textarea
                  id="number-description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="What's this number used for? e.g. Inbound sales enquiries"
                  maxLength={300}
                  rows={2}
                />
              </div>
              <div className="flex items-center gap-2">
                <Button size="sm" disabled={updateSettings.isPending} onClick={() => void handleSave()}>
                  {updateSettings.isPending ? (
                    <Loader2 className="size-3.5 animate-spin" />
                  ) : (
                    <Save className="size-3.5" />
                  )}
                  Save
                </Button>
                {saved ? <span className="text-channel-green text-xs font-medium">Saved</span> : null}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Call pricing</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {pricingLoading ? (
                <div className="text-muted-foreground flex items-center gap-2 text-sm">
                  <Loader2 className="size-4 animate-spin" />
                  Fetching live rate…
                </div>
              ) : pricing ? (
                <>
                  <div className="flex items-center gap-2">
                    <IndianRupee className="text-channel-green size-4" />
                    <span className="text-xl font-semibold tabular-nums">
                      {formatInr(pricing.outboundPerMinInrPaise)}
                    </span>
                    <span className="text-muted-foreground text-xs">/ minute, outgoing calls</span>
                  </div>
                  <p className="text-muted-foreground text-xs">
                    Live Plivo rate for {pricing.countryName}, plus our {(pricing.markupRate * 100).toFixed(0)}%
                    service markup. Billed per call to your workspace credits.
                  </p>
                </>
              ) : (
                <p className="text-muted-foreground text-xs">Could not load pricing right now.</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Missed call auto-reply</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-medium">Send a WhatsApp message on missed calls</p>
                  <p className="text-muted-foreground text-xs">
                    When someone calls this number and the call isn't answered, send them this message.
                  </p>
                </div>
                <Switch checked={autoReplyEnabled} onCheckedChange={setAutoReplyEnabled} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="missed-call-message">Message</Label>
                <Textarea
                  id="missed-call-message"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  disabled={!autoReplyEnabled}
                  rows={3}
                  maxLength={1000}
                />
              </div>
              <div className="flex items-center gap-2">
                <Button size="sm" disabled={updateSettings.isPending} onClick={() => void handleSave()}>
                  {updateSettings.isPending ? (
                    <Loader2 className="size-3.5 animate-spin" />
                  ) : (
                    <Save className="size-3.5" />
                  )}
                  Save
                </Button>
                {saved ? <span className="text-channel-green text-xs font-medium">Saved</span> : null}
              </div>
            </CardContent>
          </Card>

          <Card className="border-destructive/30">
            <CardHeader>
              <CardTitle className="text-destructive text-sm">Danger zone</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-muted-foreground text-xs">
                Releasing this number returns it to Plivo permanently. You'll stop receiving calls and WhatsApp
                messages on it, and it cannot be recovered.
              </p>
              {releaseError ? <p className="text-destructive text-xs">{releaseError}</p> : null}
              <Button
                variant="outline"
                size="sm"
                className="border-destructive text-destructive hover:bg-destructive/10"
                disabled={releaseNumber.isPending}
                onClick={() => void handleRelease()}
              >
                {releaseNumber.isPending ? (
                  <Loader2 className="size-3.5 animate-spin" />
                ) : (
                  <PhoneOff className="size-3.5" />
                )}
                Release this number
              </Button>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}
