import { useEffect, useMemo, useState } from 'react'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Sheet, SheetContent, SheetFooter, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { ApiError } from '@/lib/httpClient'
import { countBodyVariables } from '@/lib/messagingWindow'
import { buildPaymentTemplateVariables, buildPlainPaymentPreview } from '@/lib/payFormat'
import { realContactsService } from '@/services/realContacts.service'
import { realTemplatesService } from '@/services/realTemplates.service'
import { realWhatsAppPayService } from '@/services/realWhatsAppPay.service'

type SendMode = 'plain' | 'template'

export function CreatePaymentRequestSheet({
  open,
  onOpenChange,
  onCreated,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  onCreated: () => void
}) {
  const { data: contactsRes, isLoading: loadingContacts } = realContactsService.useList({ limit: 100 })
  const { data: templates = [], isLoading: loadingTemplates } = realTemplatesService.useList()
  const create = realWhatsAppPayService.useCreate()
  const send = realWhatsAppPayService.useSend()

  const contacts = contactsRes?.items ?? []
  const approved = useMemo(() => templates.filter((t) => t.status === 'approved' && t.id), [templates])

  const [contactId, setContactId] = useState('')
  const [contactName, setContactName] = useState('')
  const [contactPhone, setContactPhone] = useState('')
  const [amount, setAmount] = useState('')
  const [description, setDescription] = useState('Growth plan · Monthly subscription')
  const [sendMode, setSendMode] = useState<SendMode>('template')
  const [templateId, setTemplateId] = useState('')
  const [templateVariables, setTemplateVariables] = useState<string[]>([])
  const [error, setError] = useState<string | null>(null)

  const selected = approved.find((t) => t.id === templateId) ?? null
  const varCount = selected ? countBodyVariables(selected.bodyPattern) : 0
  const amountRupees = parseFloat(amount)
  const hasValidAmount = Number.isFinite(amountRupees) && amountRupees >= 1
  const showPreview = Boolean(contactName.trim() && hasValidAmount && description.trim())

  useEffect(() => {
    if (!open) return
    const pick = approved.find((t) => t.name === 'growth_plan_payment') ?? approved[0]
    if (pick && !templateId) setTemplateId(pick.id)
  }, [open, approved, templateId])

  useEffect(() => {
    if (sendMode !== 'template' || !selected || !showPreview) return
    const auto = buildPaymentTemplateVariables(contactName, description, amountRupees)
    setTemplateVariables((prev) =>
      Array.from({ length: varCount }, (_, i) => prev[i]?.trim() || auto[i] || '')
    )
  }, [sendMode, selected, showPreview, contactName, description, amountRupees, varCount])

  const pickContact = (id: string) => {
    setContactId(id)
    const contact = contacts.find((c) => c.id === id)
    if (contact) {
      setContactName(contact.name)
      setContactPhone(contact.phone)
    }
  }

  const reset = () => {
    setContactId('')
    setContactName('')
    setContactPhone('')
    setAmount('')
    setDescription('Growth plan · Monthly subscription')
    setSendMode('template')
    setTemplateId('')
    setTemplateVariables([])
    setError(null)
  }

  const handleSubmit = async () => {
    setError(null)
    if (!hasValidAmount) {
      setError('Enter a valid amount (minimum ₹1)')
      return
    }
    const name = contactName.trim()
    const phone = contactPhone.trim()
    const desc = description.trim()
    if (!name || !phone) {
      setError('Select or enter contact details')
      return
    }
    if (sendMode === 'template') {
      if (!templateId) {
        setError('Select an approved WhatsApp template')
        return
      }
      if (varCount > 0 && templateVariables.some((v) => !v.trim())) {
        setError('Fill in all template variables')
        return
      }
    }

    try {
      const created = await create.mutateAsync({
        ...(contactId ? { contactId } : {}),
        contactName: name,
        contactPhone: phone,
        amountPaise: Math.round(amountRupees * 100),
        description: desc,
        sendMode,
        ...(sendMode === 'template'
          ? { templateId, templateVariables: templateVariables.map((v) => v.trim()) }
          : {}),
      })
      await send.mutateAsync(created.request.id)
      reset()
      onCreated()
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to create payment request')
      toast.error(err instanceof ApiError ? err.message : 'Failed to create payment request')
    }
  }

  const busy = create.isPending || send.isPending
  const preview =
    sendMode === 'plain' && showPreview
      ? buildPlainPaymentPreview(contactName, description, amountRupees)
      : sendMode === 'template' && selected && showPreview
        ? selected.bodyPattern.replace(/\{\{(\d+)\}\}/g, (_, n: string) => templateVariables[Number(n) - 1] || `{{${n}}}`)
        : ''

  return (
    <Sheet
      open={open}
      onOpenChange={(next) => {
        onOpenChange(next)
        if (!next) reset()
      }}
    >
      <SheetContent side="right" className="sm:max-w-md">
        <SheetHeader>
          <SheetTitle>New payment request</SheetTitle>
          <p className="text-muted-foreground text-xs">
            Create a Razorpay link and send it in WhatsApp.
          </p>
        </SheetHeader>

        <div className="flex-1 space-y-4 overflow-y-auto px-4">
          <div className="space-y-1.5">
            <Label htmlFor="pay-contact">Contact</Label>
            {loadingContacts ? (
              <p className="text-muted-foreground flex items-center gap-2 text-sm">
                <Loader2 className="size-4 animate-spin" />
                Loading contacts…
              </p>
            ) : (
              <Select value={contactId || '__none'} onValueChange={(v) => pickContact(v === '__none' ? '' : v)}>
                <SelectTrigger id="pay-contact" className="w-full">
                  <SelectValue placeholder="Select a contact…" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none">Enter details manually</SelectItem>
                  {contacts.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name} · {c.phone}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          {!contactId ? (
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="pay-name">Name</Label>
                <Input
                  id="pay-name"
                  value={contactName}
                  onChange={(e) => setContactName(e.target.value)}
                  placeholder="Customer name"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="pay-phone">Phone</Label>
                <Input
                  id="pay-phone"
                  value={contactPhone}
                  onChange={(e) => setContactPhone(e.target.value)}
                  placeholder="+91…"
                />
              </div>
            </div>
          ) : null}

          <div className="space-y-1.5">
            <Label htmlFor="pay-amount">Amount (INR)</Label>
            <Input
              id="pay-amount"
              type="number"
              min="1"
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="2499"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="pay-desc">Description</Label>
            <Input
              id="pay-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              maxLength={500}
            />
          </div>

          <div className="flex gap-1 rounded-lg bg-muted p-1">
            {(['template', 'plain'] as const).map((mode) => (
              <Button
                key={mode}
                type="button"
                size="sm"
                variant={sendMode === mode ? 'default' : 'ghost'}
                className="flex-1"
                onClick={() => setSendMode(mode)}
              >
                {mode === 'template' ? 'Template' : 'Quick message'}
              </Button>
            ))}
          </div>

          {sendMode === 'template' ? (
            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label htmlFor="pay-template">Template</Label>
                {loadingTemplates ? (
                  <p className="text-muted-foreground flex items-center gap-2 text-sm">
                    <Loader2 className="size-4 animate-spin" />
                    Loading templates…
                  </p>
                ) : approved.length === 0 ? (
                  <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900">
                    No approved templates. Submit one from Templates, or use Quick message.
                  </p>
                ) : (
                  <Select value={templateId} onValueChange={setTemplateId}>
                    <SelectTrigger id="pay-template" className="w-full">
                      <SelectValue placeholder="Choose a template" />
                    </SelectTrigger>
                    <SelectContent>
                      {approved.map((t) => (
                        <SelectItem key={t.id} value={t.id}>
                          {t.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>
              {selected && varCount > 0
                ? Array.from({ length: varCount }, (_, i) => (
                    <div key={i} className="space-y-1.5">
                      <Label htmlFor={`pay-var-${i}`}>{`{{${i + 1}}}`}</Label>
                      <Input
                        id={`pay-var-${i}`}
                        value={templateVariables[i] ?? ''}
                        onChange={(e) => {
                          const v = e.target.value
                          setTemplateVariables((prev) => {
                            const next = [...prev]
                            next[i] = v
                            return next
                          })
                        }}
                      />
                    </div>
                  ))
                : null}
            </div>
          ) : null}

          {/* ponytail: text preview only — skip WhatsApp bubble chrome; reuse TemplatesPage preview if operators need it */}
          {preview ? (
            <p className="bg-muted rounded-lg p-3 text-sm whitespace-pre-wrap">{preview}</p>
          ) : (
            <p className="text-muted-foreground text-xs">Select a contact, amount, and description to preview.</p>
          )}

          {error ? <p className="text-destructive text-xs">{error}</p> : null}
        </div>

        <SheetFooter>
          <div className="flex w-full gap-2">
            <Button variant="outline" className="flex-1" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button className="flex-1" disabled={busy || !showPreview} onClick={() => void handleSubmit()}>
              {busy ? 'Sending…' : 'Create & send'}
            </Button>
          </div>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
