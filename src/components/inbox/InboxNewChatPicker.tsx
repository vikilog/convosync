import { useEffect, useMemo, useState } from 'react'
import { ArrowLeft, Loader2, Mail, Plus, Search, Send, User } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Textarea } from '@/components/ui/textarea'
import { whatsappAccountLabel, type WhatsAppLineAccount } from '@/lib/inboxLineLabels'
import { stripHtmlToText } from '@/lib/sanitizeEmailHtml'
import { realContactsService } from '@/services/realContacts.service'
import { realInboxService, type InboxChannel } from '@/services/realInbox.service'

export type InboxEmailSendPayload = {
  contactId: string
  subject: string
  text?: string
  html?: string
  templateId?: string
}

type ContactRow = { id: string; name: string; phone: string; email?: string | null; tags: string[] }

function isWhatsAppPhone(phone: string): boolean {
  if (phone.startsWith('ig:') || phone.startsWith('fb:') || phone.startsWith('tg:')) return false
  return /^\+[1-9]\d{6,14}$/.test(phone.replace(/[\s-]/g, ''))
}

export function InboxNewChatPicker({
  open,
  onOpenChange,
  initialChannel = 'whatsapp',
  emailReady = false,
  whatsappAccounts = [],
  error,
  onSelectContact,
  onSendEmail,
  onAddNewContact,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  initialChannel?: InboxChannel
  emailReady?: boolean
  whatsappAccounts?: WhatsAppLineAccount[]
  error?: string | null
  onSelectContact: (contactId: string, phoneNumberId?: string) => Promise<void>
  onSendEmail: (payload: InboxEmailSendPayload) => Promise<void>
  onAddNewContact: (phoneNumberId?: string) => void
}) {
  const [channel, setChannel] = useState<'whatsapp' | 'email'>('whatsapp')
  const [search, setSearch] = useState('')
  const [debounced, setDebounced] = useState('')
  const [fromPhoneNumberId, setFromPhoneNumberId] = useState('')
  const [selectingId, setSelectingId] = useState<string | null>(null)
  const [emailContact, setEmailContact] = useState<ContactRow | null>(null)
  const [subject, setSubject] = useState('')
  const [message, setMessage] = useState('')
  const [htmlBody, setHtmlBody] = useState<string | undefined>()
  const [templateId, setTemplateId] = useState('')
  const [fieldError, setFieldError] = useState<string | null>(null)
  const [sending, setSending] = useState(false)

  useEffect(() => {
    const t = window.setTimeout(() => setDebounced(search), search ? 250 : 0)
    return () => window.clearTimeout(t)
  }, [search])

  const contactsQuery = realContactsService.useList({
    list: 'all',
    limit: 100,
    search: debounced.trim() || undefined,
  })
  const templatesQuery = realInboxService.useEmailTemplates(open && channel === 'email')

  useEffect(() => {
    if (!open) return
    setChannel(initialChannel === 'email' ? 'email' : 'whatsapp')
    setSearch('')
    setDebounced('')
    setFromPhoneNumberId('')
    setSelectingId(null)
    setEmailContact(null)
    setSubject('')
    setMessage('')
    setHtmlBody(undefined)
    setTemplateId('')
    setFieldError(null)
    setSending(false)
  }, [open, initialChannel])

  const needsFromPick = channel === 'whatsapp' && whatsappAccounts.length > 1
  const resolvedFromId = needsFromPick ? fromPhoneNumberId : whatsappAccounts[0]?.phoneNumberId
  const canProceedWa = !needsFromPick || Boolean(fromPhoneNumberId)

  const contacts = useMemo(() => {
    const rows = (contactsQuery.data?.items ?? []).filter((c) =>
      channel === 'email' ? Boolean(c.email?.trim()) : isWhatsAppPhone(c.phone)
    )
    return rows.map((c) => ({
      id: c.id,
      name: c.name,
      phone: c.phone,
      email: c.email,
      tags: c.tags,
    }))
  }, [contactsQuery.data, channel])

  const templates = useMemo(
    () => (templatesQuery.data ?? []).filter((t) => t.id && t.name && t.status === 'active'),
    [templatesQuery.data]
  )

  const applyTemplate = (id: string) => {
    setTemplateId(id)
    setFieldError(null)
    if (!id) {
      setHtmlBody(undefined)
      return
    }
    const tpl = templates.find((t) => t.id === id)
    if (!tpl) return
    setSubject(tpl.subject || '')
    setMessage(stripHtmlToText(tpl.htmlBody || ''))
    setHtmlBody(tpl.htmlBody || undefined)
  }

  const handleSelectWa = async (contactId: string) => {
    if (!canProceedWa) return
    setSelectingId(contactId)
    try {
      await onSelectContact(contactId, resolvedFromId)
    } finally {
      setSelectingId(null)
    }
  }

  const handleSendEmail = async () => {
    setFieldError(null)
    if (!emailContact) {
      setFieldError('Select a contact to email.')
      return
    }
    if (!emailContact.email?.trim()) {
      setFieldError('Selected contact has no email address.')
      return
    }
    if (!subject.trim()) {
      setFieldError('Subject is required.')
      return
    }
    if (!templateId && !message.trim() && !htmlBody?.trim()) {
      setFieldError('Message is required.')
      return
    }
    if (!emailReady) {
      setFieldError('Email is not connected. Check your email provider in Integrations.')
      return
    }
    setSending(true)
    try {
      await onSendEmail({
        contactId: emailContact.id,
        subject: subject.trim(),
        ...(templateId
          ? { templateId, ...(message.trim() ? { text: message.trim() } : {}) }
          : { text: message.trim(), ...(htmlBody?.trim() ? { html: htmlBody } : {}) }),
      })
    } finally {
      setSending(false)
    }
  }

  const title = channel === 'email' ? (emailContact ? 'Compose email' : 'New email') : 'New WhatsApp chat'

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="data-[side=right]:sm:max-w-md">
        <SheetHeader>
          <SheetTitle>{title}</SheetTitle>
        </SheetHeader>

        <div className="flex min-h-0 flex-1 flex-col">
          <div className="bg-muted/40 mx-4 mb-3 flex gap-1 rounded-xl border p-1">
            {(
              [
                { id: 'whatsapp' as const, label: 'WhatsApp' },
                { id: 'email' as const, label: 'Email' },
              ] as const
            ).map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => {
                  setChannel(tab.id)
                  setEmailContact(null)
                  setFieldError(null)
                  setSearch('')
                }}
                className={`flex-1 rounded-lg py-1.5 text-xs font-semibold ${
                  channel === tab.id ? 'bg-background shadow-sm' : 'text-muted-foreground'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {channel === 'email' && emailContact ? (
            <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto px-4 pb-4">
              <Button
                variant="ghost"
                size="sm"
                className="self-start"
                onClick={() => {
                  setEmailContact(null)
                  setFieldError(null)
                }}
              >
                <ArrowLeft />
                Change contact
              </Button>
              <div className="bg-muted/40 flex items-center gap-3 rounded-xl border px-3 py-2.5">
                <Mail className="size-4 text-emerald-700" />
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold">{emailContact.name}</p>
                  <p className="text-muted-foreground truncate font-mono text-xs">{emailContact.email}</p>
                </div>
              </div>
              {!emailReady ? (
                <p className="text-destructive rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs">
                  Email is not connected. Enable a provider in Integrations before sending.
                </p>
              ) : null}
              <div className="space-y-1.5">
                <Label htmlFor="new-email-template">Template (optional)</Label>
                <Select value={templateId || 'none'} onValueChange={(v) => applyTemplate(v === 'none' ? '' : v)}>
                  <SelectTrigger id="new-email-template" className="w-full">
                    <SelectValue placeholder="No template" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No template — write your own</SelectItem>
                    {templates.map((t) => (
                      <SelectItem key={t.id} value={t.id}>
                        {t.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="new-email-subject">Subject</Label>
                <Input
                  id="new-email-subject"
                  value={subject}
                  onChange={(e) => {
                    setSubject(e.target.value)
                    setFieldError(null)
                  }}
                  disabled={sending}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="new-email-body">Message</Label>
                <Textarea
                  id="new-email-body"
                  value={message}
                  rows={7}
                  disabled={sending}
                  onChange={(e) => {
                    setMessage(e.target.value)
                    setHtmlBody(undefined)
                    setTemplateId('')
                    setFieldError(null)
                  }}
                />
              </div>
              {(fieldError || error) && (
                <p className="text-destructive rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs">
                  {fieldError || error}
                </p>
              )}
              <Button disabled={sending || !emailReady} onClick={() => void handleSendEmail()}>
                {sending ? <Loader2 className="animate-spin" /> : <Send />}
                Send email
              </Button>
            </div>
          ) : (
            <>
              {needsFromPick ? (
                <div className="space-y-1.5 px-4 pb-3">
                  <Label htmlFor="new-wa-from">Send from which number?</Label>
                  <Select value={fromPhoneNumberId} onValueChange={setFromPhoneNumberId}>
                    <SelectTrigger id="new-wa-from" className="w-full">
                      <SelectValue placeholder="Select a WhatsApp number…" />
                    </SelectTrigger>
                    <SelectContent>
                      {whatsappAccounts.map((acc) => (
                        <SelectItem key={acc.phoneNumberId} value={acc.phoneNumberId}>
                          {whatsappAccountLabel(acc)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ) : null}
              <div className="relative px-4 pb-3">
                <Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-7 size-4 -translate-y-1/2" />
                <Input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder={channel === 'email' ? 'Search by name or email…' : 'Search by name or phone…'}
                  className="pl-8"
                />
              </div>
              {(error || fieldError || contactsQuery.isError) && (
                <p className="text-destructive mx-4 mb-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs">
                  {fieldError ||
                    error ||
                    (contactsQuery.error instanceof Error ? contactsQuery.error.message : 'Failed to load contacts')}
                </p>
              )}
              <ScrollArea className="min-h-0 flex-1">
                {contactsQuery.isLoading ? (
                  <p className="text-muted-foreground flex items-center justify-center gap-2 py-10 text-sm">
                    <Loader2 className="size-4 animate-spin" />
                    Loading contacts…
                  </p>
                ) : contacts.length === 0 ? (
                  <p className="text-muted-foreground px-4 py-10 text-center text-sm">
                    {search.trim()
                      ? 'No contacts match your search.'
                      : channel === 'email'
                        ? 'No contacts with an email address yet.'
                        : 'No WhatsApp contacts yet. Add a contact with a phone number.'}
                  </p>
                ) : (
                  contacts.map((contact) => (
                    <button
                      key={contact.id}
                      type="button"
                      disabled={channel === 'whatsapp' && (Boolean(selectingId) || !canProceedWa)}
                      onClick={() => {
                        if (channel === 'email') {
                          if (!contact.email?.trim()) {
                            setFieldError('This contact has no email address.')
                            return
                          }
                          setEmailContact(contact)
                          setFieldError(null)
                          return
                        }
                        void handleSelectWa(contact.id)
                      }}
                      className="hover:bg-muted/60 flex w-full items-center gap-3 px-4 py-3 text-left disabled:opacity-60"
                    >
                      {channel === 'email' ? (
                        <Mail className="size-4 shrink-0 text-emerald-700" />
                      ) : (
                        <User className="size-4 shrink-0" />
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">{contact.name}</p>
                        <p className="text-muted-foreground truncate font-mono text-xs">
                          {channel === 'email' ? contact.email : contact.phone}
                        </p>
                      </div>
                      {selectingId === contact.id ? <Loader2 className="size-4 animate-spin" /> : null}
                    </button>
                  ))
                )}
              </ScrollArea>
              {channel === 'whatsapp' ? (
                <div className="border-t p-3">
                  <Button
                    className="w-full"
                    disabled={!canProceedWa}
                    onClick={() => onAddNewContact(resolvedFromId)}
                  >
                    <Plus />
                    Add new contact
                  </Button>
                </div>
              ) : null}
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}
