import { EyeOff, Heart, Reply, Trash2, UserPlus } from 'lucide-react'
import { Link } from 'react-router-dom'

import { IntentBadge } from '@/components/social-listening/IntentBadge'
import { primaryActionForComment } from '@/components/social-listening/intentConfig'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { formatCount, timeAgo, type IntentLabel, type ListeningComment, type Platform } from '@/lib/socialListening'

export function MediaCommentRow({
  comment,
  platform,
  depth,
  replyToId,
  replyText,
  replySending,
  busy,
  addLeadBusy,
  resolvedLeadId,
  onStartReply,
  onChangeReply,
  onCancelReply,
  onSendReply,
  onPrimaryAction,
  onIgnore,
  onRetryClassify,
  onRetryDm,
  onAddLead,
  onHide,
  onDelete,
}: {
  comment: ListeningComment
  platform: Platform
  depth: number
  replyToId: string | null
  replyText: string
  replySending: boolean
  busy: boolean
  addLeadBusy: boolean
  resolvedLeadId?: string | null
  onStartReply: (id: string, suggested?: string | null) => void
  onChangeReply: (text: string) => void
  onCancelReply: () => void
  onSendReply: () => void
  onPrimaryAction: (comment: ListeningComment) => void
  onIgnore: (comment: ListeningComment) => void
  onRetryClassify: (comment: ListeningComment) => void
  onRetryDm: (comment: ListeningComment) => void
  onAddLead: (comment: ListeningComment) => void
  onHide: (comment: ListeningComment) => void
  onDelete: (comment: ListeningComment) => void
}) {
  const isReplying = replyToId === comment.id
  const primary = primaryActionForComment({
    intentLabel: (comment.intentLabel ?? null) as IntentLabel | null,
    confidence: comment.confidence ?? null,
    classificationStatus: comment.classificationStatus ?? null,
    status: comment.status ?? null,
  })
  const handled = Boolean(comment.status && comment.status !== 'new')
  const hasLead = Boolean(resolvedLeadId ?? comment.leadId)

  return (
    <div className={depth > 0 ? 'ml-6 border-l pl-3' : ''}>
      <div className="rounded-xl border p-3">
        <div className="flex items-start gap-2.5">
          <Avatar className="size-7">
            <AvatarFallback className="text-[10px]">
              {(comment.username || '?').charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1 space-y-2">
            <div className="flex flex-wrap items-center gap-1.5">
              <p className="text-sm font-semibold">
                {comment.username ? `@${comment.username}` : platform === 'facebook' ? 'Facebook user' : 'Instagram user'}
              </p>
              {comment.timestamp ? (
                <span className="text-muted-foreground text-[11px]">{timeAgo(comment.timestamp)}</span>
              ) : null}
              <IntentBadge
                intent={comment.intentLabel ?? null}
                confidence={comment.confidence ?? null}
                classificationStatus={comment.classificationStatus ?? undefined}
                classificationError={comment.classificationError}
                retrying={busy}
                onRetry={comment.socialCommentId ? () => onRetryClassify(comment) : undefined}
              />
              {handled ? (
                <Badge variant="secondary" className="capitalize">
                  {comment.status}
                </Badge>
              ) : null}
              {hasLead ? <Badge variant="outline">Lead</Badge> : null}
              {comment.socialCommentId ? (
                hasLead ? (
                  <Button variant="outline" size="xs" asChild>
                    <Link to="/leads">View lead</Link>
                  </Button>
                ) : (
                  <Button
                    variant="outline"
                    size="xs"
                    disabled={addLeadBusy || busy}
                    onClick={() => onAddLead(comment)}
                  >
                    <UserPlus />
                    {addLeadBusy ? '…' : 'Add to lead'}
                  </Button>
                )
              ) : null}
            </div>

            <p className="bg-muted/60 rounded-lg px-2.5 py-2 text-sm whitespace-pre-wrap">{comment.text || '—'}</p>

            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-muted-foreground inline-flex items-center gap-1 text-[11px]">
                <Heart className="size-3" />
                {formatCount(comment.likeCount)}
              </span>

              {primary && !handled ? (
                <Button
                  size="xs"
                  disabled={busy}
                  onClick={() => {
                    if (primary.kind === 'ignore_only') {
                      onIgnore(comment)
                      return
                    }
                    if (primary.kind === 'approve_reply' || primary.kind === 'review') {
                      onStartReply(comment.id, comment.suggestedReply)
                      return
                    }
                    onPrimaryAction(comment)
                  }}
                >
                  {busy ? '…' : primary.label}
                </Button>
              ) : null}

              {!handled && primary?.kind !== 'ignore_only' ? (
                <Button
                  variant="outline"
                  size="xs"
                  disabled={busy || !comment.socialCommentId}
                  onClick={() => onIgnore(comment)}
                >
                  Ignore
                </Button>
              ) : null}

              <Button
                variant="ghost"
                size="xs"
                onClick={() => onStartReply(comment.id, comment.suggestedReply)}
              >
                <Reply />
                Reply
              </Button>

              {comment.socialCommentId ? (
                <>
                  <Button variant="ghost" size="xs" disabled={busy} onClick={() => onHide(comment)}>
                    <EyeOff />
                    Hide
                  </Button>
                  <Button variant="ghost" size="xs" disabled={busy} onClick={() => onDelete(comment)}>
                    <Trash2 />
                    Delete
                  </Button>
                </>
              ) : null}

              {comment.dmStatus === 'failed' && comment.socialCommentId ? (
                <Button variant="outline" size="xs" disabled={busy} onClick={() => onRetryDm(comment)}>
                  Retry DM
                </Button>
              ) : null}
            </div>

            {isReplying ? (
              <div className="space-y-2">
                <Textarea
                  value={replyText}
                  onChange={(e) => onChangeReply(e.target.value)}
                  placeholder="Write a public reply…"
                  rows={3}
                />
                <div className="flex justify-end gap-2">
                  <Button variant="outline" size="sm" onClick={onCancelReply}>
                    Cancel
                  </Button>
                  <Button size="sm" disabled={replySending || !replyText.trim()} onClick={onSendReply}>
                    {replySending ? 'Sending…' : 'Send reply'}
                  </Button>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </div>

      {comment.replies?.map((reply) => (
        <div key={reply.id} className="mt-2">
          <MediaCommentRow
            comment={reply}
            platform={platform}
            depth={depth + 1}
            replyToId={replyToId}
            replyText={replyText}
            replySending={replySending}
            busy={busy}
            addLeadBusy={addLeadBusy}
            resolvedLeadId={resolvedLeadId}
            onStartReply={onStartReply}
            onChangeReply={onChangeReply}
            onCancelReply={onCancelReply}
            onSendReply={onSendReply}
            onPrimaryAction={onPrimaryAction}
            onIgnore={onIgnore}
            onRetryClassify={onRetryClassify}
            onRetryDm={onRetryDm}
            onAddLead={onAddLead}
            onHide={onHide}
            onDelete={onDelete}
          />
        </div>
      ))}
    </div>
  )
}
