import { ArrowLeft, Ban, Loader2, Mail, MessageSquare, Pause, Pencil, Play, UserX } from 'lucide-react'

import { CHANNEL_ICON_CLASS, CHANNEL_LABEL, ChannelIcon } from '@/components/channel-icon'
import { ContactAvatar } from '@/components/inbox/ContactAvatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { contactHandleLabel, type RealContactChannel } from '@/lib/contactChannel'
import { LIST_TAGS } from '@/lib/contactDisplay'
import type { Contact } from '@/services/realContacts.service'

export function ContactDetailHeader({
  contact,
  headerName,
  headerHandle,
  channel,
  displayEmail,
  inboxPending,
  automationPending,
  onBack,
  onInbox,
  onToggleAutomation,
  onEdit,
}: {
  contact: Contact
  headerName: string
  headerHandle: string | null
  channel: RealContactChannel
  displayEmail: string | null
  inboxPending: boolean
  automationPending: boolean
  onBack: () => void
  onInbox: () => void
  onToggleAutomation: () => void
  onEdit: () => void
}) {
  const isUnsubscribed = contact.tags.includes(LIST_TAGS.unsubscribe)
  const isBlocked = contact.tags.includes(LIST_TAGS.blocklist)
  const extraTags = contact.tags.filter((t) => t !== LIST_TAGS.unsubscribe && t !== LIST_TAGS.blocklist)

  return (
    <div className="shrink-0 border-b p-4">
      <Button variant="ghost" size="sm" onClick={onBack} className="mb-3">
        <ArrowLeft />
        Contacts
      </Button>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex min-w-0 items-start gap-3">
          <div className="relative shrink-0">
            <ContactAvatar name={headerName} src={contact.avatar} className="size-14" />
            <span
              className={`ring-background absolute -right-1 -bottom-1 flex size-5 items-center justify-center rounded-full ring-2 ${CHANNEL_ICON_CLASS[channel]}`}
            >
              <ChannelIcon channel={channel} className="size-2.5" />
            </span>
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-lg font-semibold">{headerName}</h1>
              {isUnsubscribed ? (
                <Badge variant="outline" className="gap-1">
                  <UserX className="size-3" />
                  Unsubscribed
                </Badge>
              ) : null}
              {isBlocked ? (
                <Badge variant="destructive" className="gap-1">
                  <Ban className="size-3" />
                  Blocklisted
                </Badge>
              ) : null}
            </div>
            <p className="text-muted-foreground mt-1 flex flex-wrap items-center gap-2 text-sm">
              <span className="inline-flex items-center gap-1">
                <ChannelIcon channel={channel} className="size-3.5" />
                {CHANNEL_LABEL[channel]}
              </span>
              <span className="font-mono text-xs">{headerHandle ?? contactHandleLabel(contact.phone)}</span>
              {contact.source ? <span>· {contact.source}</span> : null}
            </p>
            {displayEmail ? (
              <p className="text-muted-foreground mt-1 flex items-center gap-1.5 text-sm">
                <Mail className="size-3.5" />
                {displayEmail}
              </p>
            ) : null}
            {extraTags.length > 0 ? (
              <div className="mt-2 flex flex-wrap gap-1.5">
                {extraTags.map((tag) => (
                  <Badge key={tag} variant="outline" className="uppercase">
                    {tag}
                  </Badge>
                ))}
              </div>
            ) : null}
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" disabled={inboxPending} onClick={onInbox}>
            {inboxPending ? <Loader2 className="animate-spin" /> : <MessageSquare />}
            Open inbox
          </Button>
          <Button variant="outline" size="sm" disabled={automationPending} onClick={onToggleAutomation}>
            {contact.automationsPaused ? (
              <>
                <Play />
                Resume automation
              </>
            ) : (
              <>
                <Pause />
                Pause automation
              </>
            )}
          </Button>
          <Button size="sm" onClick={onEdit}>
            <Pencil />
            Edit
          </Button>
        </div>
      </div>
    </div>
  )
}
