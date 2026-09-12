import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import { ExternalLink, Heart, MessageCircle, RefreshCw, Video } from 'lucide-react'

import { AddLeadDialog, type FunnelOption } from '@/components/social-listening/AddLeadDialog'
import { SocialListeningPostAgentPanel } from '@/components/social-listening/SocialListeningPostAgentPanel'
import { MediaCommentRow } from '@/components/social-listening/MediaCommentThread'
import { PlatformIcon } from '@/components/social-listening/platform-icon'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { useConfirm } from '@/components/common/ConfirmDialogProvider'
import {
  slKeys,
  useFacebookListeningPosts,
  useFacebookPostComments,
  useInvalidateSocialListening,
  useMediaComments,
  useMediaDetail,
  usePostSettings,
} from '@/hooks/useSocialListeningQueries'
import { realLeadFunnelsService } from '@/services/realLeadFunnels.service'
import { socialListeningApi } from '@/services/socialListening.service'
import {
  facebookPostToMedia,
  findComment,
  formatCount,
  parseApiError,
  reviewToListeningComment,
  timeAgo,
  type ListeningComment,
  type Platform,
} from '@/lib/socialListening'

export function SocialListeningMediaDetail() {
  const { mediaId: rawId } = useParams()
  const mediaId = rawId ? decodeURIComponent(rawId) : null
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const qc = useQueryClient()
  const confirm = useConfirm()
  const invalidate = useInvalidateSocialListening()
  const platform = (searchParams.get('platform') === 'facebook' ? 'facebook' : 'instagram') as Platform
  const instagramUserId = searchParams.get('ig') || undefined

  const mediaQ = useMediaDetail(platform === 'instagram' ? mediaId : null, instagramUserId)
  const commentsQ = useMediaComments(platform === 'instagram' ? mediaId : null, instagramUserId)
  const facebookPostsQ = useFacebookListeningPosts()
  const facebookCommentsQ = useFacebookPostComments(platform === 'facebook' ? mediaId : null)
  const funnelsQ = realLeadFunnelsService.useList()
  const settingsQ = usePostSettings(mediaId)

  const facebookMedia = useMemo(() => {
    if (platform !== 'facebook' || !mediaId) return null
    const post = (facebookPostsQ.data ?? []).find((p) => p.id === mediaId)
    return post ? facebookPostToMedia(post) : null
  }, [platform, mediaId, facebookPostsQ.data])

  const media = platform === 'facebook' ? facebookMedia : mediaQ.data?.media ?? null
  const comments: ListeningComment[] =
    platform === 'facebook'
      ? (facebookCommentsQ.data ?? []).map(reviewToListeningComment)
      : ((commentsQ.data?.comments ?? []) as ListeningComment[])
  const nextCursor = platform === 'facebook' ? null : commentsQ.data?.nextCursor ?? null
  const loading =
    platform === 'facebook'
      ? (facebookPostsQ.isLoading || facebookCommentsQ.isLoading) && !facebookPostsQ.data && !facebookCommentsQ.data
      : (mediaQ.isLoading || commentsQ.isLoading) && !mediaQ.data && !commentsQ.data

  const [loadingMore, setLoadingMore] = useState(false)
  const [error, setError] = useState('')
  const [replyToId, setReplyToId] = useState<string | null>(null)
  const [replyText, setReplyText] = useState('')
  const [replySending, setReplySending] = useState(false)
  const [replyError, setReplyError] = useState('')
  const [pendingAction, setPendingAction] = useState<'approve_dm' | 'approve_reply' | 'escalate' | 'ignore' | 'review' | null>(null)
  const actionBusyRef = useRef<Set<string>>(new Set())
  const [actionBusyIds, setActionBusyIds] = useState<Set<string>>(new Set())
  const [addLeadCommentId, setAddLeadCommentId] = useState<string | null>(null)
  const [funnelId, setFunnelId] = useState('')
  const [addLeadBusy, setAddLeadBusy] = useState(false)
  const [addLeadError, setAddLeadError] = useState('')
  const postLeadFunnelId = settingsQ.data?.settings.leadFunnelId ?? null

  const markBusy = (id: string) => {
    actionBusyRef.current.add(id)
    setActionBusyIds(new Set(actionBusyRef.current))
  }
  const clearBusy = (id: string) => {
    actionBusyRef.current.delete(id)
    setActionBusyIds(new Set(actionBusyRef.current))
  }

  useEffect(() => {
    const err = mediaQ.error || commentsQ.error || facebookCommentsQ.error
    setError(err ? parseApiError(err) : '')
  }, [mediaQ.error, commentsQ.error, facebookCommentsQ.error])

  const load = useCallback(async () => {
    if (platform === 'facebook') {
      await Promise.all([facebookPostsQ.refetch(), facebookCommentsQ.refetch()])
      return
    }
    await Promise.all([mediaQ.refetch(), commentsQ.refetch()])
  }, [platform, facebookPostsQ, facebookCommentsQ, mediaQ, commentsQ])

  const runAction = async (
    comment: ListeningComment,
    action: 'approve_dm' | 'approve_reply' | 'escalate' | 'ignore' | 'review',
    message?: string,
  ) => {
    if (!comment.socialCommentId || actionBusyRef.current.has(comment.socialCommentId)) return
    markBusy(comment.socialCommentId)
    setReplyError('')
    try {
      const res = await socialListeningApi.commentAction(comment.socialCommentId, {
        action,
        message,
        instagramUserId,
      })
      setReplyToId(null)
      setReplyText('')
      setPendingAction(null)
      if (res.dmStatus === 'failed') {
        setReplyError(res.dmError || 'Public reply sent, but DM failed.')
      }
    } catch (err) {
      setReplyError(parseApiError(err))
    } finally {
      clearBusy(comment.socialCommentId)
      invalidate()
      await load()
    }
  }

  const sendReply = async () => {
    if (!replyToId || !replyText.trim()) return
    setReplySending(true)
    setReplyError('')
    try {
      const target = findComment(comments, replyToId)
      if (target?.socialCommentId) {
        await runAction(target, pendingAction ?? 'approve_reply', replyText.trim())
      } else {
        await socialListeningApi.replyListeningComment(replyToId, replyText.trim(), instagramUserId)
        setReplyToId(null)
        setReplyText('')
        await load()
      }
    } catch (err) {
      setReplyError(parseApiError(err))
    } finally {
      setReplySending(false)
    }
  }

  const funnels: FunnelOption[] = (funnelsQ.data?.funnels ?? []).map((f) => ({ id: f.id, name: f.name }))

  const openAddLead = (comment: ListeningComment) => {
    if (!comment.socialCommentId) return
    setAddLeadCommentId(comment.socialCommentId)
    setAddLeadError('')
    setFunnelId(postLeadFunnelId || funnels[0]?.id || '')
  }

  const confirmAddLead = async () => {
    if (!addLeadCommentId || !funnelId) return
    setAddLeadBusy(true)
    setAddLeadError('')
    try {
      await socialListeningApi.createLead({ socialCommentId: addLeadCommentId, funnelId })
      setAddLeadCommentId(null)
      invalidate()
    } catch (err) {
      setAddLeadError(parseApiError(err))
    } finally {
      setAddLeadBusy(false)
    }
  }

  const backTo = `/social-listening?tab=content&platform=${platform}${instagramUserId ? `&ig=${encodeURIComponent(instagramUserId)}` : ''}`
  const preview = media?.mediaUrl || media?.thumbnailUrl

  if (!mediaId) {
    return (
      <div className="flex flex-1 items-center justify-center p-6">
        <p className="text-muted-foreground text-sm">Missing media id</p>
      </div>
    )
  }

  return (
    <div className="flex h-full min-h-0 flex-1 flex-col gap-3 overflow-hidden p-4">
      <div className="flex shrink-0 flex-wrap items-center justify-between gap-2">
        <Button variant="ghost" size="sm" onClick={() => navigate(backTo)}>
          ← Back to content
        </Button>
        <div className="flex items-center gap-2">
          {media?.permalink ? (
            <Button variant="outline" size="sm" asChild>
              <a href={media.permalink} target="_blank" rel="noreferrer">
                Open on {platform === 'facebook' ? 'Facebook' : 'Instagram'}
                <ExternalLink />
              </a>
            </Button>
          ) : null}
          <Button variant="outline" size="sm" disabled={loading} onClick={() => void load()}>
            <RefreshCw className={loading ? 'animate-spin' : ''} />
            Sync
          </Button>
        </div>
      </div>

      {error ? <p className="text-destructive text-sm">{error}</p> : null}
      {replyError ? <p className="text-destructive text-sm">{replyError}</p> : null}

      <div className="grid min-h-0 flex-1 gap-3 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_20rem]">
        <Card className="overflow-hidden">
          <div className="bg-muted relative flex h-56 items-center justify-center">
            {preview ? (
              media?.mediaType === 'VIDEO' || media?.isReel ? (
                <video src={media?.mediaUrl || undefined} poster={media?.thumbnailUrl || undefined} controls className="h-full w-full object-contain" />
              ) : (
                <img src={preview} alt="" className="h-full w-full object-contain" />
              )
            ) : (
              <PlatformIcon platform={platform} className="size-10" />
            )}
            {media?.isReel ? (
              <span className="absolute top-2 left-2 inline-flex items-center gap-1 rounded-md bg-black/65 px-1.5 py-0.5 text-[10px] font-bold text-white">
                <Video className="size-3" />
                Reel
              </span>
            ) : null}
          </div>
          <CardContent className="space-y-2 pt-4">
            {media?.caption ? <p className="text-sm whitespace-pre-wrap">{media.caption}</p> : null}
            <div className="text-muted-foreground flex flex-wrap gap-4 text-xs">
              <span className="inline-flex items-center gap-1">
                <Heart className="size-3.5" />
                {formatCount(media?.likeCount)} likes
              </span>
              <span className="inline-flex items-center gap-1">
                <MessageCircle className="size-3.5" />
                {formatCount(media?.commentsCount)} comments
              </span>
              {media?.timestamp ? <span>{timeAgo(media.timestamp)} ago</span> : null}
            </div>
          </CardContent>
        </Card>

        <Card className="flex min-h-0 flex-col overflow-hidden">
          <CardContent className="flex min-h-0 flex-1 flex-col gap-3 pt-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold">Comments</h2>
              <span className="text-muted-foreground text-[11px]">
                {commentsQ.isFetching || facebookCommentsQ.isFetching ? 'Loading…' : `${comments.length} loaded`}
              </span>
            </div>
            <div className="min-h-0 flex-1 space-y-2.5 overflow-y-auto">
              {loading && !comments.length ? (
                Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24 w-full" />)
              ) : comments.length === 0 ? (
                <p className="text-muted-foreground py-8 text-center text-sm">No comments on this post yet.</p>
              ) : (
                comments.map((comment) => (
                  <MediaCommentRow
                    key={comment.id}
                    comment={comment}
                    platform={platform}
                    depth={0}
                    replyToId={replyToId}
                    replyText={replyText}
                    replySending={replySending}
                    busy={actionBusyIds.has(comment.socialCommentId || comment.id)}
                    addLeadBusy={addLeadBusy && addLeadCommentId === comment.socialCommentId}
                    resolvedLeadId={comment.leadId}
                    onStartReply={(id, suggested) => {
                      setReplyToId(id)
                      setReplyText(suggested || '')
                      setPendingAction('approve_reply')
                      setReplyError('')
                    }}
                    onChangeReply={setReplyText}
                    onCancelReply={() => {
                      setReplyToId(null)
                      setReplyText('')
                      setPendingAction(null)
                    }}
                    onSendReply={() => void sendReply()}
                    onPrimaryAction={(c) => {
                      const kind = c.intentLabel === 'Interested' ? 'approve_dm' : c.intentLabel === 'Complaint' ? 'escalate' : 'approve_reply'
                      if (kind === 'approve_dm') {
                        void confirm({
                          title: 'Send this DM now?',
                          description: 'This messages the customer and cannot be undone.',
                          confirmLabel: 'Send DM',
                        }).then((ok) => {
                          if (ok) void runAction(c, 'approve_dm')
                        })
                        return
                      }
                      void runAction(c, kind)
                    }}
                    onIgnore={(c) => void runAction(c, 'ignore')}
                    onRetryClassify={(c) => {
                      if (!c.socialCommentId) return
                      markBusy(c.socialCommentId)
                      void socialListeningApi
                        .classifyComment(c.socialCommentId)
                        .then(() => load())
                        .catch((err) => setReplyError(parseApiError(err)))
                        .finally(() => {
                          clearBusy(c.socialCommentId!)
                          invalidate()
                        })
                    }}
                    onRetryDm={(c) => {
                      if (!c.socialCommentId) return
                      markBusy(c.socialCommentId)
                      void socialListeningApi
                        .retryDm(c.socialCommentId, instagramUserId)
                        .then((res) => {
                          if (res.dmStatus === 'failed') setReplyError(res.dmError || 'DM failed.')
                        })
                        .catch((err) => setReplyError(parseApiError(err)))
                        .finally(() => {
                          clearBusy(c.socialCommentId!)
                          invalidate()
                        })
                    }}
                    onAddLead={openAddLead}
                    onHide={(c) => {
                      if (!c.socialCommentId) return
                      void socialListeningApi
                        .commentAction(c.socialCommentId, { action: 'hide_comment', hidden: true })
                        .then(() => load())
                        .catch((err) => setReplyError(parseApiError(err)))
                        .finally(() => invalidate())
                    }}
                    onDelete={(c) => {
                      if (!c.socialCommentId) return
                      void confirm({
                        title: 'Delete this comment?',
                        description: 'This removes the comment on the social platform.',
                        confirmLabel: 'Delete',
                        destructive: true,
                      }).then((ok) => {
                        if (!ok) return
                        void socialListeningApi
                          .commentAction(c.socialCommentId!, { action: 'delete_comment' })
                          .then(() => load())
                          .catch((err) => setReplyError(parseApiError(err)))
                          .finally(() => invalidate())
                      })
                    }}
                  />
                ))
              )}
            </div>
            {nextCursor ? (
              <div className="flex justify-center">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={loadingMore}
                  onClick={() => {
                    if (!mediaId || !nextCursor) return
                    setLoadingMore(true)
                    void socialListeningApi
                      .getMediaComments(mediaId, { instagramUserId, after: nextCursor, limit: 50 })
                      .then((page) => {
                        qc.setQueryData(
                          slKeys.mediaComments(mediaId, instagramUserId),
                          (prev: { comments: ListeningComment[]; nextCursor: string | null } | undefined) => ({
                            comments: [...(prev?.comments ?? []), ...page.comments],
                            nextCursor: page.nextCursor,
                          }),
                        )
                      })
                      .catch((err) => setError(parseApiError(err)))
                      .finally(() => setLoadingMore(false))
                  }}
                >
                  {loadingMore ? 'Loading…' : 'Load more'}
                </Button>
              </div>
            ) : null}
          </CardContent>
        </Card>

        {mediaId ? <SocialListeningPostAgentPanel postId={mediaId} platform={platform} /> : null}
      </div>

      <AddLeadDialog
        open={addLeadCommentId != null}
        funnels={funnels}
        loading={funnelsQ.isLoading}
        busy={addLeadBusy}
        error={addLeadError}
        funnelId={funnelId}
        onFunnelId={setFunnelId}
        onClose={() => setAddLeadCommentId(null)}
        onConfirm={() => void confirmAddLead()}
      />
    </div>
  )
}
