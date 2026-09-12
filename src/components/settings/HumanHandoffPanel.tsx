import { useEffect, useState } from 'react'
import { Loader2, Mail, MessageCircle, Plus, X } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { realTemplatesService } from '@/services/realTemplates.service'
import { realWorkspaceMembersService } from '@/services/realWorkspaceMembers.service'
import {
  realWorkspaceSettingsService,
  type NotificationChannels,
} from '@/services/realWorkspaceSettings.service'

export function HumanHandoffPanel() {
  const { data, isLoading } = realWorkspaceSettingsService.useNotifications()
  const updatePref = realWorkspaceSettingsService.useUpdateNotification()
  const { data: membersData } = realWorkspaceMembersService.useList()
  const { data: templates = [] } = realTemplatesService.useList()

  const pref = data?.preferences.find((p) => p.eventType === 'human_handoff')
  const members = membersData ?? []
  const approvedTemplates = templates.filter((t) => t.status === 'approved')

  const [channels, setChannels] = useState<NotificationChannels | null>(null)
  const [extraEmail, setExtraEmail] = useState('')
  const [phoneInput, setPhoneInput] = useState('')

  useEffect(() => {
    if (pref) setChannels(pref.channels)
  }, [pref?.eventType, data])

  if (isLoading || !pref || !channels) {
    return (
      <div className="text-muted-foreground flex items-center gap-2 py-12 text-sm">
        <Loader2 className="size-4 animate-spin" />
        Loading handoff notifications…
      </div>
    )
  }

  const save = (next: NotificationChannels, enabled = pref.enabled) => {
    setChannels(next)
    updatePref.mutate({ eventType: 'human_handoff', enabled, channels: next })
  }

  const toggleRecipient = (userId: string) => {
    const has = channels.email.recipients.userIds.includes(userId)
    save({
      ...channels,
      email: {
        ...channels.email,
        recipients: {
          ...channels.email.recipients,
          userIds: has
            ? channels.email.recipients.userIds.filter((id) => id !== userId)
            : [...channels.email.recipients.userIds, userId],
        },
      },
    })
  }

  const addExtraEmail = () => {
    const email = extraEmail.trim()
    if (!email) return
    save({
      ...channels,
      email: {
        ...channels.email,
        recipients: {
          ...channels.email.recipients,
          extraEmails: [...channels.email.recipients.extraEmails, email],
        },
      },
    })
    setExtraEmail('')
  }

  const removeExtraEmail = (email: string) =>
    save({
      ...channels,
      email: {
        ...channels.email,
        recipients: {
          ...channels.email.recipients,
          extraEmails: channels.email.recipients.extraEmails.filter((e) => e !== email),
        },
      },
    })

  const addPhone = () => {
    const phone = phoneInput.trim()
    if (!phone) return
    save({
      ...channels,
      whatsapp: { ...channels.whatsapp, phoneNumbers: [...channels.whatsapp.phoneNumbers, phone] },
    })
    setPhoneInput('')
  }

  const removePhone = (phone: string) =>
    save({
      ...channels,
      whatsapp: {
        ...channels.whatsapp,
        phoneNumbers: channels.whatsapp.phoneNumbers.filter((p) => p !== phone),
      },
    })

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="flex items-center justify-between gap-3 pt-6">
          <div>
            <p className="text-sm font-medium">Escalate to a human</p>
            <p className="text-muted-foreground text-xs">
              Notify your team when the AI agent hands off a conversation.
            </p>
          </div>
          <Switch
            checked={pref.enabled}
            onCheckedChange={(checked) => updatePref.mutate({ eventType: 'human_handoff', enabled: checked })}
          />
        </CardContent>
      </Card>

      {pref.enabled ? (
        <>
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Mail className="text-muted-foreground size-4" />
                  <CardTitle>Email</CardTitle>
                </div>
                <Switch
                  checked={channels.email.enabled}
                  onCheckedChange={(checked) =>
                    save({ ...channels, email: { ...channels.email, enabled: checked } })
                  }
                />
              </div>
            </CardHeader>
            {channels.email.enabled ? (
              <CardContent className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="handoff-subject">Subject template</Label>
                  <Input
                    id="handoff-subject"
                    value={channels.email.subjectTemplate}
                    onChange={(e) =>
                      setChannels({
                        ...channels,
                        email: { ...channels.email, subjectTemplate: e.target.value },
                      })
                    }
                    onBlur={() => save(channels)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="handoff-template">Message template</Label>
                  <Textarea
                    id="handoff-template"
                    value={channels.email.bodyTemplate}
                    onChange={(e) =>
                      setChannels({ ...channels, email: { ...channels.email, bodyTemplate: e.target.value } })
                    }
                    onBlur={() => save(channels)}
                    rows={3}
                  />
                  <p className="text-muted-foreground text-xs">
                    Variables: <code className="bg-muted rounded px-1">{'{{customer_name}}'}</code>{' '}
                    <code className="bg-muted rounded px-1">{'{{customer_phone}}'}</code>{' '}
                    <code className="bg-muted rounded px-1">{'{{reason}}'}</code>{' '}
                    <code className="bg-muted rounded px-1">{'{{conversation_id}}'}</code>
                  </p>
                </div>
                <div className="space-y-1.5">
                  <Label className="flex items-center gap-2">
                    <Checkbox
                      checked={channels.email.recipients.workspaceEmail}
                      onCheckedChange={(checked) =>
                        save({
                          ...channels,
                          email: {
                            ...channels.email,
                            recipients: { ...channels.email.recipients, workspaceEmail: Boolean(checked) },
                          },
                        })
                      }
                    />
                    Workspace email
                  </Label>
                  {members.map((m) => (
                    <label key={m.userId} className="flex items-center gap-2 text-sm">
                      <Checkbox
                        checked={channels.email.recipients.userIds.includes(m.userId)}
                        onCheckedChange={() => toggleRecipient(m.userId)}
                      />
                      {m.name} <span className="text-muted-foreground text-xs">({m.email})</span>
                    </label>
                  ))}
                </div>
                <div className="space-y-1.5">
                  <Label>Extra emails</Label>
                  <div className="flex flex-wrap gap-1.5">
                    {channels.email.recipients.extraEmails.map((email) => (
                      <Badge key={email} variant="secondary" className="gap-1">
                        {email}
                        <button
                          type="button"
                          onClick={() => removeExtraEmail(email)}
                          aria-label={`Remove ${email}`}
                        >
                          <X className="size-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <Input
                      type="email"
                      value={extraEmail}
                      onChange={(e) => setExtraEmail(e.target.value)}
                      placeholder="ops@example.com"
                      className="flex-1"
                    />
                    <Button variant="outline" size="sm" onClick={addExtraEmail} disabled={!extraEmail.trim()}>
                      <Plus />
                      Add
                    </Button>
                  </div>
                </div>
              </CardContent>
            ) : null}
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <MessageCircle className="text-channel-green size-4" />
                  <CardTitle>WhatsApp</CardTitle>
                </div>
                <Switch
                  checked={channels.whatsapp.enabled}
                  onCheckedChange={(checked) =>
                    save({ ...channels, whatsapp: { ...channels.whatsapp, enabled: checked } })
                  }
                />
              </div>
            </CardHeader>
            {channels.whatsapp.enabled ? (
              <CardContent className="space-y-4">
                <p className="text-muted-foreground text-sm">
                  Sends an approved template to on-call team phone numbers when a handoff occurs.
                </p>
                <div className="space-y-1.5">
                  <Label>Template</Label>
                  <Select
                    value={channels.whatsapp.templateId ?? ''}
                    onValueChange={(v) =>
                      save({ ...channels, whatsapp: { ...channels.whatsapp, templateId: v } })
                    }
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Choose an approved template…" />
                    </SelectTrigger>
                    <SelectContent>
                      {approvedTemplates.map((t) => (
                        <SelectItem key={t.id} value={t.id}>
                          {t.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {approvedTemplates.length === 0 ? (
                    <p className="text-muted-foreground text-xs">
                      No approved WhatsApp templates yet — create and get one approved under Templates.
                    </p>
                  ) : null}
                </div>
                <div className="space-y-1.5">
                  <Label>Phone numbers</Label>
                  <div className="flex flex-wrap gap-1.5">
                    {channels.whatsapp.phoneNumbers.map((phone) => (
                      <Badge key={phone} variant="secondary" className="gap-1">
                        {phone}
                        <button
                          type="button"
                          onClick={() => removePhone(phone)}
                          aria-label={`Remove ${phone}`}
                        >
                          <X className="size-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <Input
                      value={phoneInput}
                      onChange={(e) => setPhoneInput(e.target.value)}
                      placeholder="+91XXXXXXXXXX"
                      className="flex-1"
                    />
                    <Button variant="outline" size="sm" onClick={addPhone} disabled={!phoneInput.trim()}>
                      <Plus />
                      Add
                    </Button>
                  </div>
                </div>
              </CardContent>
            ) : null}
          </Card>
        </>
      ) : null}
    </div>
  )
}
