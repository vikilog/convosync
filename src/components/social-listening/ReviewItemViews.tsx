import { MessageCircle, Send, Target, X } from 'lucide-react'

import { IntentBadge } from '@/components/social-listening/IntentBadge'
import { TRIAGE_THEME, primaryActionFor } from '@/components/social-listening/intentConfig'
import { PlatformIcon } from '@/components/social-listening/platform-icon'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Separator } from '@/components/ui/separator'
import { timeAgo, triageSectionForComment, type ReviewComment } from '@/lib/socialListening'

function ItemAvatar({ item }: { item: ReviewComment }) {
  return (
    <div className="relative shrink-0">
      <Avatar>
        {item.profilePicUrl ? <AvatarImage src={item.profilePicUrl} alt="" /> : null}
        <AvatarFallback>{item.username.charAt(0).toUpperCase()}</AvatarFallback>
      </Avatar>
      <span className="bg-background ring-background absolute -right-0.5 -bottom-0.5 flex size-4 items-center justify-center rounded-full ring-2">
        <PlatformIcon platform={item.platform} className="size-3" />
      </span>
    </div>
  )
}

export function ReviewCard({
  item,
  onApprove,
  onIgnore,
  onAddLead,
  addLeadBusy,
  hideQueueActions,
}: {
  item: ReviewComment
  onApprove: () => void
  onIgnore: () => void
  onAddLead?: () => void
  addLeadBusy?: boolean
  hideQueueActions?: boolean
}) {
  const section = triageSectionForComment(item)
  const theme = TRIAGE_THEME[section]
  const ActionIcon = theme.actionIcon
  const action = primaryActionFor(section)
  const isHandled = item.status !== 'pending'

  return (
    <div className={`bg-card space-y-4 rounded-xl border-l-4 p-4 ${theme.border}`}>
      <div className="flex items-start gap-3">
        <ItemAvatar item={item} />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-1.5">
            <p className="truncate text-sm font-semibold">@{item.username}</p>
            {item.leadId ? <Badge variant="secondary">Lead</Badge> : null}
          </div>
          <div className="mt-1 flex flex-wrap items-center gap-1.5">
            <IntentBadge intent={item.intent} confidence={item.confidence} />
            <span className="text-muted-foreground text-xs">{timeAgo(item.createdAt)}</span>
          </div>
        </div>
        {isHandled ? (
          <Badge variant={item.status === 'approved' ? 'default' : 'outline'} className="shrink-0 capitalize">
            {item.status}
          </Badge>
        ) : null}
      </div>

      <p className="bg-muted/60 rounded-lg p-3 text-sm leading-relaxed">{item.commentText}</p>

      <div className="text-muted-foreground flex items-center gap-2 rounded-lg border border-dashed p-2.5 text-xs">
        <MessageCircle className="size-3.5 shrink-0" />
        <span className="truncate">On post: {item.postCaption || 'Untitled post'}</span>
      </div>

      {item.publicReplyText ? (
        <div className="rounded-lg border p-3">
          <p className="text-muted-foreground mb-1 text-xs font-semibold tracking-wide uppercase">
            Suggested public reply
          </p>
          <p className="text-sm">{item.publicReplyText}</p>
        </div>
      ) : null}

      {item.suggestedDm ? (
        <div className="rounded-lg border p-3">
          <p className="text-muted-foreground mb-1 flex items-center gap-1.5 text-xs font-semibold tracking-wide uppercase">
            <Send className="size-3" />
            Suggested DM
          </p>
          <p className="text-sm">{item.suggestedDm}</p>
        </div>
      ) : null}

      {!isHandled && !hideQueueActions ? (
        <>
          <Separator />
          <div className="flex items-center gap-2">
            <Button size="sm" className="flex-1" onClick={onApprove}>
              <ActionIcon />
              {action.label}
            </Button>
            <Button variant="outline" size="sm" onClick={onIgnore}>
              <X />
              Ignore
            </Button>
          </div>
        </>
      ) : item.leadId ? (
        <Button variant="outline" size="sm" className="w-full" asChild>
          <a href="/leads">
            <Target />
            View lead
          </a>
        </Button>
      ) : onAddLead ? (
        <Button variant="outline" size="sm" className="w-full" disabled={addLeadBusy} onClick={onAddLead}>
          <Target />
          {addLeadBusy ? 'Adding…' : 'Add to lead'}
        </Button>
      ) : null}
    </div>
  )
}

export function ReviewCardTile({
  item,
  onOpen,
  onApprove,
  onIgnore,
}: {
  item: ReviewComment
  onOpen: () => void
  onApprove: () => void
  onIgnore: () => void
}) {
  const section = triageSectionForComment(item)
  const theme = TRIAGE_THEME[section]
  const ActionIcon = theme.actionIcon

  return (
    <div className={`bg-card flex flex-col gap-2.5 rounded-xl border-l-4 p-3 ${theme.border}`}>
      <button type="button" onClick={onOpen} className="flex items-start gap-2.5 text-left">
        <ItemAvatar item={item} />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold">@{item.username}</p>
          <IntentBadge intent={item.intent} confidence={item.confidence} />
        </div>
      </button>
      <button type="button" onClick={onOpen} className="text-left">
        <p className="text-muted-foreground line-clamp-2 text-xs">{item.commentText}</p>
      </button>
      <div className="flex items-center gap-1.5">
        <Button size="sm" className="flex-1" onClick={onApprove}>
          <ActionIcon />
        </Button>
        <Button variant="outline" size="icon-sm" onClick={onIgnore} aria-label="Ignore">
          <X />
        </Button>
      </div>
    </div>
  )
}

export function ReviewRow({
  item,
  selected,
  onToggleSelect,
  onOpen,
}: {
  item: ReviewComment
  selected: boolean
  onToggleSelect: () => void
  onOpen: () => void
}) {
  return (
    <div className="hover:bg-muted/40 flex items-center gap-3 border-b px-3 py-2.5 last:border-b-0">
      <Checkbox checked={selected} onCheckedChange={onToggleSelect} aria-label={`Select @${item.username}`} />
      <button type="button" onClick={onOpen} className="flex min-w-0 flex-1 items-center gap-3 text-left">
        <ItemAvatar item={item} />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-1.5">
            <p className="truncate text-sm font-medium">@{item.username}</p>
            <IntentBadge intent={item.intent} confidence={item.confidence} />
            <span className="text-muted-foreground text-xs">{timeAgo(item.createdAt)}</span>
          </div>
          <p className="text-muted-foreground truncate text-xs">{item.commentText}</p>
        </div>
      </button>
    </div>
  )
}
