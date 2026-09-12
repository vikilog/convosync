import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ArrowLeft,
  Check,
  Clock,
  Loader2,
  Pencil,
  Phone,
  PhoneCall,
  Plus,
  RefreshCw,
  Settings,
  ShieldCheck,
  Wand2,
  X,
  XCircle,
} from 'lucide-react'

import { useConfirm } from '@/components/common/ConfirmDialogProvider'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Textarea } from '@/components/ui/textarea'
import {
  NUMBER_PREFIXES,
  virtualNumberService,
  type AvailableNumber,
  type OwnedNumber,
  type VirtualNumberStage,
  type VirtualNumberStatus,
} from '@/services/virtualNumber.service'

const STAGE_PROGRESS: VirtualNumberStage[] = ['not_requested', 'pending_approval', 'approved', 'active']

/** Client-side preview only — the backend recomputes and charges the authoritative total. */
const GST_RATE = 0.18

function progressIndex(stage: VirtualNumberStage) {
  if (stage === 'rejected') return 1
  if (stage === 'number_selected' || stage === 'paid') return 2
  return Math.max(0, STAGE_PROGRESS.indexOf(stage))
}

function StageProgress({ stage }: { stage: VirtualNumberStage }) {
  const index = progressIndex(stage)
  const labels = ['Request', 'Review', 'Choose number', 'Active']
  return (
    <div className="shrink-0 space-y-1 px-4 pt-2">
      <p className="text-muted-foreground text-xs">
        Step {index + 1} of {STAGE_PROGRESS.length} · {labels[index]}
      </p>
      <div className="flex gap-1">
        {STAGE_PROGRESS.map((s, i) => (
          <div key={s} className={`h-1 flex-1 rounded-full ${i <= index ? 'bg-primary' : 'bg-muted'}`} />
        ))}
      </div>
    </div>
  )
}

function InstructionsStep({ onSend, sending }: { onSend: (label: string) => void; sending: boolean }) {
  const [label, setLabel] = useState('')
  return (
    <Card className="mt-8 max-w-lg">
      <CardContent className="space-y-5 p-8">
        <div className="flex size-12 items-center justify-center rounded-xl bg-orange-50">
          <PhoneCall className="size-5 text-orange-600" />
        </div>
        <div className="space-y-1.5">
          <h2 className="text-lg font-semibold">Get a virtual number</h2>
          <p className="text-muted-foreground text-sm leading-relaxed">
            A dedicated phone number lets your team place and receive calls from ConvoSync — routed through your
            AI agent or a Journey automation, with recordings and transcripts on every conversation.
          </p>
        </div>
        <ul className="space-y-3 text-sm">
          <li className="flex gap-2.5">
            <ShieldCheck className="text-muted-foreground mt-0.5 size-4 shrink-0" />
            <span>
              <span className="font-medium">We review your business</span> — a quick KYC check by the ConvoSync
              team before a number can be assigned to this workspace.
            </span>
          </li>
          <li className="flex gap-2.5">
            <Check className="text-muted-foreground mt-0.5 size-4 shrink-0" />
            <span>
              <span className="font-medium">You pick a number</span> — once approved, choose from a shortlist of
              available numbers for your city.
            </span>
          </li>
          <li className="flex gap-2.5">
            <Wand2 className="text-muted-foreground mt-0.5 size-4 shrink-0" />
            <span>
              <span className="font-medium">Pay to activate</span> — the number goes live the moment payment
              clears, ready to use in Calls and Journeys.
            </span>
          </li>
        </ul>
        <div className="space-y-1.5">
          <Label htmlFor="number-request-label">Name this number (optional)</Label>
          <Input
            id="number-request-label"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder="e.g. Sales Line, Support"
            maxLength={80}
          />
        </div>
        <Button className="w-full" disabled={sending} onClick={() => onSend(label.trim())}>
          {sending ? <Loader2 className="size-4 animate-spin" /> : null}
          Send request
        </Button>
      </CardContent>
    </Card>
  )
}

function PendingStep({
  requestedAt,
  onRefresh,
  refreshing,
}: {
  requestedAt: string | null | undefined
  onRefresh: () => void
  refreshing: boolean
}) {
  return (
    <Card className="mt-8 max-w-lg">
      <CardContent className="space-y-5 p-8 text-center">
        <div className="bg-muted mx-auto flex size-12 items-center justify-center rounded-full">
          <Clock className="text-muted-foreground size-5" />
        </div>
        <div className="space-y-1.5">
          <Badge variant="secondary" className="gap-1">
            <Clock className="size-3" />
            Pending review
          </Badge>
          <h2 className="text-lg font-semibold">Request sent</h2>
          <p className="text-muted-foreground text-sm leading-relaxed">
            Your request is with the ConvoSync team. This usually takes about a business day — we'll let you
            know the moment you're approved and numbers are ready to choose from.
          </p>
          {requestedAt ? (
            <p className="text-muted-foreground text-xs">Requested {new Date(requestedAt).toLocaleString()}</p>
          ) : null}
        </div>
        <Button variant="outline" size="sm" disabled={refreshing} onClick={onRefresh}>
          {refreshing ? <Loader2 className="size-3.5 animate-spin" /> : <RefreshCw className="size-3.5" />}
          Check status
        </Button>
      </CardContent>
    </Card>
  )
}

function RejectedStep({ reason }: { reason: string | null | undefined }) {
  return (
    <Card className="mt-8 max-w-lg">
      <CardContent className="space-y-5 p-8 text-center">
        <div className="bg-destructive/10 mx-auto flex size-12 items-center justify-center rounded-full">
          <XCircle className="text-destructive size-5" />
        </div>
        <div className="space-y-1.5">
          <h2 className="text-lg font-semibold">Request declined</h2>
          <p className="text-muted-foreground text-sm leading-relaxed">
            {reason || 'The ConvoSync team could not approve this request.'}
          </p>
        </div>
      </CardContent>
    </Card>
  )
}

function SelectStep({ selectedNumber }: { selectedNumber: VirtualNumberStatus['selectedNumber'] }) {
  const [pattern, setPattern] = useState<string | undefined>(undefined)
  const { data, isLoading, error, fetchNextPage, hasNextPage, isFetchingNextPage } =
    virtualNumberService.useAvailableNumbers(true, pattern)
  const selectNumber = virtualNumberService.useSelectNumber()
  const payAndActivate = virtualNumberService.usePayAndActivate()
  const [payError, setPayError] = useState<string | null>(null)

  const numbers = data?.pages.flatMap((p) => p.numbers) ?? []
  const selected =
    numbers.find((n) => n.number === selectedNumber?.number) ??
    (selectedNumber
      ? {
          number: selectedNumber.number,
          displayNumber: selectedNumber.number,
          city: selectedNumber.city,
          type: 'fixed',
          priceInrPaise: selectedNumber.priceInrPaise ?? 0,
        }
      : null)

  const pay = async () => {
    setPayError(null)
    try {
      await payAndActivate.mutateAsync()
    } catch (err) {
      setPayError(err instanceof Error ? err.message : 'Payment failed')
    }
  }

  const baseInrPaise = selected?.priceInrPaise ?? 0
  const gstInrPaise = Math.round(baseInrPaise * GST_RATE)
  const totalInrPaise = baseInrPaise + gstInrPaise

  return (
    <div className="flex h-full min-h-0 w-full flex-col gap-6 py-6 md:flex-row">
      <div className="min-w-0 flex-1 space-y-5 overflow-y-auto">
        <div className="space-y-1">
          <h2 className="text-lg font-semibold">Choose your number</h2>
          <p className="text-muted-foreground text-sm">You're approved — pick a number to activate.</p>
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          <button
            type="button"
            onClick={() => setPattern(undefined)}
            className={`rounded-full border px-3 py-1 text-xs font-semibold transition-colors ${
              pattern === undefined
                ? 'border-primary bg-primary text-primary-foreground'
                : 'hover:bg-muted/50'
            }`}
          >
            All prefixes
          </button>
          {NUMBER_PREFIXES.map((p) => (
            <button
              key={p.value}
              type="button"
              onClick={() => setPattern(p.value)}
              className={`rounded-full border px-3 py-1 text-xs font-semibold transition-colors ${
                pattern === p.value
                  ? 'border-primary bg-primary text-primary-foreground'
                  : 'hover:bg-muted/50'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>

        {isLoading ? (
          <div className="text-muted-foreground flex items-center gap-2 text-sm">
            <Loader2 className="size-4 animate-spin" />
            Loading available numbers…
          </div>
        ) : error ? (
          <p className="text-destructive text-sm">Could not load available numbers. Try again shortly.</p>
        ) : (
          <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
            {numbers.map((number: AvailableNumber) => {
              const isSelected = number.number === selectedNumber?.number
              return (
                <button
                  key={number.number}
                  type="button"
                  disabled={selectNumber.isPending}
                  onClick={() => selectNumber.mutate(number)}
                  className={`flex items-start justify-between gap-2 rounded-xl border p-3.5 text-left transition-colors ${
                    isSelected ? 'border-primary ring-primary/15 ring-2' : 'hover:bg-muted/50'
                  }`}
                >
                  <div className="min-w-0">
                    <p className="font-mono text-sm font-semibold tabular-nums whitespace-nowrap">
                      {number.displayNumber}
                    </p>
                    <p className="text-muted-foreground mt-0.5 text-xs capitalize">
                      {number.city ?? '—'} · {number.type}
                    </p>
                    <p className="mt-1.5 text-xs font-semibold tabular-nums">
                      ₹{(number.priceInrPaise / 100).toFixed(0)}/mo
                    </p>
                  </div>
                  <span
                    className={`mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full border-2 ${
                      isSelected ? 'border-primary bg-primary' : 'border-muted-foreground/30'
                    }`}
                  >
                    {isSelected ? <Check className="text-primary-foreground size-3" strokeWidth={3} /> : null}
                  </span>
                </button>
              )
            })}
          </div>
        )}

        {hasNextPage ? (
          <div className="flex justify-center">
            <Button
              variant="outline"
              size="sm"
              disabled={isFetchingNextPage}
              onClick={() => void fetchNextPage()}
            >
              {isFetchingNextPage ? <Loader2 className="size-3.5 animate-spin" /> : null}
              {isFetchingNextPage ? 'Loading…' : 'Load more numbers'}
            </Button>
          </div>
        ) : null}
      </div>

      <div className="shrink-0 md:w-64 md:border-l md:pl-6">
        <div className="md:sticky md:top-6">
          {selected ? (
            <Card>
              <CardContent className="space-y-3">
                <div>
                  <p className="text-muted-foreground text-xs font-semibold tracking-wide uppercase">
                    Selected number
                  </p>
                  <p className="mt-1 font-mono text-base font-semibold tabular-nums">
                    {selected.displayNumber}
                  </p>
                  <p className="text-muted-foreground text-xs capitalize">
                    {selected.city ?? '—'} · {selected.type}
                  </p>
                </div>
                <div className="space-y-1.5 border-t pt-3 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Base price</span>
                    <span className="tabular-nums">₹{(baseInrPaise / 100).toFixed(0)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">GST (18%)</span>
                    <span className="tabular-nums">₹{(gstInrPaise / 100).toFixed(2)}</span>
                  </div>
                  <div className="flex items-center justify-between border-t pt-1.5 font-semibold">
                    <span>Total / month</span>
                    <span className="tabular-nums">₹{(totalInrPaise / 100).toFixed(2)}</span>
                  </div>
                </div>
                {payError ? <p className="text-destructive text-xs">{payError}</p> : null}
                <Button className="w-full" disabled={payAndActivate.isPending} onClick={() => void pay()}>
                  {payAndActivate.isPending ? <Loader2 className="size-4 animate-spin" /> : null}
                  {payAndActivate.isPending
                    ? 'Processing payment…'
                    : `Pay ₹${(totalInrPaise / 100).toFixed(2)}`}
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="text-muted-foreground rounded-xl border border-dashed p-6 text-center text-xs">
              Select a number on the left to see pricing here.
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function NumberCard({ number }: { number: OwnedNumber }) {
  const navigate = useNavigate()
  const updateSettings = virtualNumberService.useUpdateSettings(number.id)
  const [editing, setEditing] = useState(false)
  const [name, setName] = useState(number.label || '')
  const [description, setDescription] = useState(number.description || '')

  const startEdit = () => {
    setName(number.label || '')
    setDescription(number.description || '')
    setEditing(true)
  }

  const save = async () => {
    await updateSettings.mutateAsync({ label: name.trim(), description: description.trim() })
    setEditing(false)
  }

  return (
    <Card>
      <CardContent className="space-y-3 p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <span className="bg-muted flex size-10 shrink-0 items-center justify-center rounded-full">
              <Phone className="size-4" />
            </span>
            <div className="min-w-0">
              {editing ? (
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Sales Line"
                  maxLength={80}
                  className="h-7 text-sm font-semibold"
                  autoFocus
                />
              ) : (
                <p className="truncate text-sm font-semibold">{number.label || number.number}</p>
              )}
              <p className="text-muted-foreground truncate font-mono text-xs tabular-nums">{number.number}</p>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-1">
            {!editing ? (
              <Button variant="ghost" size="icon-sm" onClick={startEdit} aria-label="Rename">
                <Pencil className="size-3.5" />
              </Button>
            ) : null}
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => navigate(`/calling/settings/${number.id}`)}
              aria-label="Number settings"
              title="Number settings"
            >
              <Settings className="size-3.5" />
            </Button>
          </div>
        </div>

        {editing ? (
          <>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What's this number used for? e.g. Inbound sales enquiries"
              maxLength={300}
              rows={2}
              className="text-xs"
            />
            <div className="flex items-center gap-2">
              <Button size="sm" disabled={updateSettings.isPending} onClick={() => void save()}>
                {updateSettings.isPending ? <Loader2 className="size-3.5 animate-spin" /> : <Check className="size-3.5" />}
                Save
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setEditing(false)}>
                <X className="size-3.5" />
                Cancel
              </Button>
            </div>
          </>
        ) : (
          <p className="text-muted-foreground text-xs">{number.description || 'No description yet.'}</p>
        )}
      </CardContent>
    </Card>
  )
}

function NumbersList({ numbers }: { numbers: OwnedNumber[] }) {
  return (
    <div className="mt-8 max-w-3xl space-y-3">
      <div className="space-y-1">
        <h2 className="text-sm font-semibold">
          Your number{numbers.length > 1 ? 's' : ''} ({numbers.length})
        </h2>
        <p className="text-muted-foreground text-xs">
          Name each one so your team can tell them apart — e.g. Sales, Support.
        </p>
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {numbers.map((n) => (
          <NumberCard key={n.id} number={n} />
        ))}
      </div>
    </div>
  )
}

export function VirtualNumberFlow({ onBack }: { onBack: () => void }) {
  const confirm = useConfirm()
  const { data: status, isLoading, refetch, isFetching } = virtualNumberService.useStatus()
  const { data: numbersData } = virtualNumberService.useNumbers()
  const ownedNumbers = numbersData?.numbers ?? []
  const requestAccess = virtualNumberService.useRequestAccess()
  const [wizardOpen, setWizardOpen] = useState(false)

  const handleBuyAnother = async () => {
    // A request is already in flight — just reveal its progress instead of starting another.
    if (status && status.stage !== 'active' && status.stage !== 'rejected' && status.stage !== 'not_requested') {
      setWizardOpen(true)
      return
    }
    const ok = await confirm({
      title: 'Request another number?',
      description: 'Your existing numbers keep working exactly as they are while this new one goes through approval.',
      confirmLabel: 'Request number',
    })
    if (ok) {
      requestAccess.mutate()
      setWizardOpen(true)
    }
  }

  if (isLoading || !status) {
    return (
      <div className="flex h-full min-h-0 w-full flex-1 items-center justify-center">
        <Loader2 className="text-muted-foreground size-5 animate-spin" />
      </div>
    )
  }

  const stage = status.stage
  // A wizard step only needs showing while the latest request hasn't become a usable
  // number yet — once it's active, that row shows up in the list below instead.
  const showWizard = stage !== 'active'

  const stepContent = (() => {
    switch (stage) {
      case 'not_requested':
        return (
          <InstructionsStep
            onSend={(label) => requestAccess.mutate(label ? { label } : undefined)}
            sending={requestAccess.isPending}
          />
        )
      case 'pending_approval':
        return (
          <PendingStep
            requestedAt={status.requestedAt}
            onRefresh={() => void refetch()}
            refreshing={isFetching}
          />
        )
      case 'rejected':
        return <RejectedStep reason={status.rejectionReason} />
      case 'approved':
      case 'number_selected':
      case 'paid':
        return <SelectStep selectedNumber={status.selectedNumber} />
      case 'active':
        return null
    }
  })()

  return (
    <div className="flex h-full min-h-0 w-full flex-1 flex-col">
      <div className="flex items-center justify-between gap-2 border-b px-4 py-3">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon-sm" onClick={onBack} aria-label="Back to integrations">
            <ArrowLeft />
          </Button>
          <h1 className="text-sm font-medium">Virtual Number</h1>
        </div>
        {ownedNumbers.length > 0 ? (
          <Button variant="outline" size="sm" disabled={requestAccess.isPending} onClick={() => void handleBuyAnother()}>
            {requestAccess.isPending ? <Loader2 className="size-3.5 animate-spin" /> : <Plus className="size-3.5" />}
            Buy another number
          </Button>
        ) : null}
      </div>

      {showWizard && ownedNumbers.length === 0 ? <StageProgress stage={stage} /> : null}

      <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-6">
        {ownedNumbers.length > 0 ? <NumbersList numbers={ownedNumbers} /> : null}
        {showWizard && ownedNumbers.length === 0 ? stepContent : null}
      </div>

      {showWizard && ownedNumbers.length === 0 ? (
        <div className="flex shrink-0 gap-2 border-t p-4">
          <Button variant="ghost" onClick={onBack}>
            Back to Integrations
          </Button>
        </div>
      ) : null}

      {/* Once numbers already exist, a new request's progress opens as its own panel
          instead of appearing inline, so it never looks like stray page content. */}
      {ownedNumbers.length > 0 ? (
        <Sheet open={showWizard && wizardOpen} onOpenChange={setWizardOpen}>
          <SheetContent side="right" className="data-[side=right]:sm:max-w-3xl">
            <SheetHeader>
              <SheetTitle>New number</SheetTitle>
            </SheetHeader>
            <div className="flex-1 space-y-4 overflow-y-auto pb-6">
              <StageProgress stage={stage} />
              <div className="px-4">{stepContent}</div>
            </div>
          </SheetContent>
        </Sheet>
      ) : null}
    </div>
  )
}
