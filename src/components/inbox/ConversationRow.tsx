import type { ComponentType } from 'react'
import { Star } from 'lucide-react'
import { ContactAvatar } from '@/components/inbox/ContactAvatar'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { CHANNEL_ICON_CLASS, ChannelIcon, type ChannelKind } from '@/components/channel-icon'
import { formatInboxTime } from '@/lib/inboxTime'
import type { Conversation } from '@/services/realInbox.service'

export function ConversationRow({
  conversation: c,
  active,
  checked,
  waLine,
  badge,
  onSelect,
  onToggleSelected,
  onToggleFavorite,
}: {
  conversation: Conversation
  active: boolean
  checked: boolean
  waLine: string | false
  badge: { icon: ComponentType<{ className?: string }> | null; label: string } | null
  onSelect: (id: string) => void
  onToggleSelected: (id: string) => void
  onToggleFavorite: (id: string, isFavorite: boolean) => void
}) {
  const preview = (c.lastMessage ?? 'No messages yet').replace(/\s+/g, ' ').trim()
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onSelect(c.id)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          onSelect(c.id)
        }
      }}
      className={`hover:bg-muted/60 grid min-w-0 cursor-pointer grid-cols-[auto_auto_minmax(0,1fr)_auto] items-start gap-2 px-3 py-3 transition-colors ${
        active ? 'bg-muted' : ''
      }`}
    >
      <div
        className="mt-1.5"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={(e) => e.stopPropagation()}
      >
        <Checkbox
          checked={checked}
          onCheckedChange={() => onToggleSelected(c.id)}
          aria-label={checked ? 'Deselect chat' : 'Select chat'}
        />
      </div>
      <div className="relative mt-0.5 shrink-0">
        <ContactAvatar name={c.contact.name} src={c.contact.avatar} />
        <span
          className={`ring-background absolute -right-0.5 -bottom-0.5 flex size-4 items-center justify-center rounded-full ring-2 ${CHANNEL_ICON_CLASS[c.channel as ChannelKind]}`}
        >
          <ChannelIcon channel={c.channel} className="size-2.5" />
        </span>
      </div>
      <div className="min-w-0">
        <div className="flex min-w-0 items-center gap-1.5">
          <p className="min-w-0 truncate text-sm font-medium">{c.contact.name}</p>
          {badge ? (
            <span className="text-muted-foreground inline-flex shrink-0 items-center gap-0.5 text-[11px]">
              {badge.icon ? <badge.icon className="size-3" /> : null}
              {badge.label}
            </span>
          ) : null}
        </div>
        {waLine ? (
          <p className="text-channel-green mt-0.5 truncate text-[11px] font-medium">{waLine}</p>
        ) : null}
        <p className="text-muted-foreground mt-0.5 truncate text-xs">{preview}</p>
      </div>
      <div
        className="flex items-center gap-1 pt-0.5"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={() => onToggleFavorite(c.id, !c.isFavorite)}
          className={c.isFavorite ? 'text-amber-500' : 'text-muted-foreground hover:text-amber-500'}
          title={c.isFavorite ? 'Remove from favorites' : 'Mark as favorite'}
          aria-label={c.isFavorite ? 'Remove from favorites' : 'Mark as favorite'}
        >
          <Star className="size-4" fill={c.isFavorite ? 'currentColor' : 'none'} />
        </button>
        <span className="text-muted-foreground text-[11px] whitespace-nowrap">
          {c.lastMessageAt ? formatInboxTime(c.lastMessageAt) : ''}
        </span>
        {c.unreadCount > 0 ? <Badge className="ml-0.5 shrink-0">{c.unreadCount}</Badge> : null}
      </div>
    </div>
  )
}
