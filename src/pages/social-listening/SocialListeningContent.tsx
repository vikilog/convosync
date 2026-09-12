import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Heart, Image as ImageIcon, LayoutGrid, List, MessageCircle, RefreshCw, Video } from 'lucide-react'

import { PlatformIcon } from '@/components/social-listening/platform-icon'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import {
  useFacebookListeningPosts,
  useFacebookPageProfile,
  useInstagramAccountsQuery,
  useListeningMedia,
  useListeningProfile,
  usePostAutomationMap,
} from '@/hooks/useSocialListeningQueries'
import {
  formatCount,
  parseApiError,
  type ListeningMedia,
  type Platform,
} from '@/lib/socialListening'
import { socialListeningApi } from '@/services/socialListening.service'

type MediaFilter = 'all' | 'posts' | 'reels'
type LayoutMode = 'grid' | 'list'

function automationLabel(info?: {
  autoResponseEnabled: boolean
  commentAutomationJourneyId: string | null
}): { label: string; variant: 'outline' | 'secondary' | 'default' } {
  const agentOn = info?.autoResponseEnabled ?? false
  const journeyOn = Boolean(info?.commentAutomationJourneyId)
  if (agentOn && journeyOn) return { label: 'Agent + Auto', variant: 'default' }
  if (agentOn) return { label: 'Agent', variant: 'secondary' }
  if (journeyOn) return { label: 'Auto', variant: 'secondary' }
  return { label: 'Off', variant: 'outline' }
}

export function SocialListeningContent({ platform }: { platform: Platform }) {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const igFromUrl = searchParams.get('ig')
  const [selectedIgId, setSelectedIgId] = useState<string | null>(igFromUrl)
  const [filter, setFilter] = useState<MediaFilter>('all')
  const [layout, setLayout] = useState<LayoutMode>('grid')
  const [loadingMore, setLoadingMore] = useState(false)
  const [error, setError] = useState('')
  const [extraItems, setExtraItems] = useState<ListeningMedia[]>([])
  const [extraCursor, setExtraCursor] = useState<string | null>(null)

  const accountsQ = useInstagramAccountsQuery()
  const accounts = accountsQ.data ?? []
  const facebookPageQ = useFacebookPageProfile()
  const facebookPostsQ = useFacebookListeningPosts()

  useEffect(() => {
    if (!accounts.length) {
      setSelectedIgId(null)
      return
    }
    if (selectedIgId && accounts.some((a) => a.instagramUserId === selectedIgId)) return
    setSelectedIgId(accounts[0].instagramUserId)
  }, [accounts, selectedIgId])

  useEffect(() => {
    setExtraItems([])
    setExtraCursor(null)
  }, [selectedIgId])

  const profileQ = useListeningProfile(platform === 'instagram' ? selectedIgId : null)
  const mediaQ = useListeningMedia(platform === 'instagram' ? selectedIgId : null)
  const pageItems = (mediaQ.data?.items ?? []) as ListeningMedia[]
  const items = useMemo(() => {
    const seen = new Set(pageItems.map((i) => i.id))
    return [...pageItems, ...extraItems.filter((i) => !seen.has(i.id))]
  }, [pageItems, extraItems])
  const nextCursor = extraCursor !== null ? extraCursor : (mediaQ.data?.nextCursor ?? null)
  const automationQ = usePostAutomationMap(items.map((i) => i.id))
  const automationByPost = automationQ.data ?? {}

  useEffect(() => {
    const err = accountsQ.error || profileQ.error || mediaQ.error || facebookPostsQ.error
    setError(err ? parseApiError(err) : '')
  }, [accountsQ.error, profileQ.error, mediaQ.error, facebookPostsQ.error])

  const filteredItems = useMemo(() => {
    if (filter === 'reels') return items.filter((i) => i.isReel)
    if (filter === 'posts') return items.filter((i) => !i.isReel)
    return items
  }, [items, filter])

  const openPost = (postId: string) => {
    const params = new URLSearchParams()
    params.set('platform', platform)
    params.set('tab', 'content')
    if (platform === 'instagram' && selectedIgId) params.set('ig', selectedIgId)
    navigate(`/social-listening/media/${encodeURIComponent(postId)}?${params.toString()}`)
  }

  const sync = () => {
    setExtraItems([])
    setExtraCursor(null)
    void accountsQ.refetch()
    void profileQ.refetch()
    void mediaQ.refetch()
    void facebookPostsQ.refetch()
    void facebookPageQ.refetch()
  }

  const loadMore = async () => {
    if (!selectedIgId || !nextCursor || loadingMore) return
    setLoadingMore(true)
    try {
      const mediaRes = await socialListeningApi.getListeningMedia({
        instagramUserId: selectedIgId,
        after: nextCursor,
        limit: 24,
      })
      setExtraItems((prev) => [...prev, ...mediaRes.items])
      setExtraCursor(mediaRes.nextCursor)
    } catch (err) {
      setError(parseApiError(err))
    } finally {
      setLoadingMore(false)
    }
  }

  const facebookPosts = platform === 'facebook' ? (facebookPostsQ.data ?? []) : []
  const facebookConnected = platform === 'facebook' && facebookPageQ.data != null

  const renderMediaCard = (item: ListeningMedia) => {
    const thumb = item.thumbnailUrl || item.mediaUrl
    const auto = automationLabel(automationByPost[item.id])
    if (layout === 'list') {
      return (
        <button
          key={item.id}
          type="button"
          onClick={() => openPost(item.id)}
          className="hover:bg-muted/40 flex w-full items-center gap-3 rounded-xl border p-2 text-left"
        >
          <div className="bg-muted relative size-16 shrink-0 overflow-hidden rounded-lg">
            {thumb ? (
              <img src={thumb} alt="" className="size-full object-cover" />
            ) : (
              <div className="text-muted-foreground flex size-full items-center justify-center">
                {item.isReel ? <Video className="size-5" /> : <ImageIcon className="size-5" />}
              </div>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <p className="line-clamp-2 text-sm">{item.caption || 'Untitled post'}</p>
            <div className="text-muted-foreground mt-1 flex items-center gap-3 text-xs">
              <span className="inline-flex items-center gap-1">
                <Heart className="size-3" />
                {formatCount(item.likeCount)}
              </span>
              <span className="inline-flex items-center gap-1">
                <MessageCircle className="size-3" />
                {formatCount(item.commentsCount)}
              </span>
            </div>
          </div>
          <Badge variant={auto.variant}>{auto.label}</Badge>
        </button>
      )
    }

    return (
      <button
        key={item.id}
        type="button"
        onClick={() => openPost(item.id)}
        className="group bg-muted relative aspect-square overflow-hidden rounded-xl border text-left"
      >
        {thumb ? (
          <img src={thumb} alt="" className="size-full object-cover transition-transform group-hover:scale-[1.03]" />
        ) : (
          <div className="text-muted-foreground flex size-full items-center justify-center">
            {item.isReel ? <Video className="size-8" /> : <ImageIcon className="size-8" />}
          </div>
        )}
        <div className="absolute top-2 right-2 flex flex-col items-end gap-1">
          <Badge variant={auto.variant}>{auto.label}</Badge>
          {item.isReel ? <Badge variant="outline">Reel</Badge> : null}
        </div>
        <div className="absolute inset-x-0 bottom-0 translate-y-full bg-gradient-to-t from-black/80 to-transparent p-3 text-white opacity-0 transition-all group-hover:translate-y-0 group-hover:opacity-100">
          <p className="line-clamp-2 text-xs">{item.caption}</p>
          <div className="mt-1.5 flex items-center gap-3 text-[11px]">
            <span className="flex items-center gap-1">
              <Heart className="size-3" />
              {formatCount(item.likeCount)}
            </span>
            <span className="flex items-center gap-1">
              <MessageCircle className="size-3" />
              {formatCount(item.commentsCount)}
            </span>
          </div>
        </div>
      </button>
    )
  }

  if (platform === 'facebook') {
    return (
      <div className="min-h-0 flex-1 space-y-4 overflow-auto p-4">
        <div className="flex items-center justify-end gap-2">
          <div className="inline-flex items-center rounded-lg border p-0.5">
            <Button
              variant={layout === 'grid' ? 'secondary' : 'ghost'}
              size="icon-sm"
              onClick={() => setLayout('grid')}
              aria-label="Grid view"
            >
              <LayoutGrid />
            </Button>
            <Button
              variant={layout === 'list' ? 'secondary' : 'ghost'}
              size="icon-sm"
              onClick={() => setLayout('list')}
              aria-label="List view"
            >
              <List />
            </Button>
          </div>
          <Button variant="outline" size="sm" onClick={sync}>
            <RefreshCw className={facebookPostsQ.isFetching ? 'animate-spin' : ''} />
            Sync
          </Button>
        </div>
        {error ? <p className="text-destructive text-sm">{error}</p> : null}
        {!facebookConnected && !facebookPageQ.isLoading ? (
          <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed p-12 text-center">
            <PlatformIcon platform="facebook" className="size-8" />
            <p className="text-sm font-medium">Connect a Facebook Page</p>
            <Button onClick={() => navigate('/integrations')}>Connect Facebook</Button>
          </div>
        ) : facebookPostsQ.isLoading && !facebookPosts.length ? (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="aspect-square rounded-xl" />
            ))}
          </div>
        ) : facebookPosts.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed p-12 text-center">
            <ImageIcon className="text-muted-foreground size-8" />
            <p className="text-sm font-medium">No posts synced yet</p>
          </div>
        ) : (
          <div className={layout === 'list' ? 'space-y-2' : 'grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4'}>
            {facebookPosts.map((post) =>
              renderMediaCard({
                id: post.id,
                caption: post.message || null,
                mediaType: 'IMAGE',
                mediaProductType: null,
                mediaUrl: post.fullPicture || null,
                thumbnailUrl: post.fullPicture || null,
                permalink: post.permalink || null,
                timestamp: post.createdTime,
                likeCount: post.likesCount,
                commentsCount: post.commentsCount,
                isReel: false,
              }),
            )}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="min-h-0 flex-1 space-y-4 overflow-auto p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-1.5">
          {(['all', 'posts', 'reels'] as const).map((id) => (
            <Button key={id} size="sm" variant={filter === id ? 'secondary' : 'ghost'} onClick={() => setFilter(id)}>
              {id === 'all' ? 'All' : id === 'posts' ? 'Posts' : 'Reels'}
            </Button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <div className="inline-flex items-center rounded-lg border p-0.5">
            <Button
              variant={layout === 'grid' ? 'secondary' : 'ghost'}
              size="icon-sm"
              onClick={() => setLayout('grid')}
              aria-label="Grid view"
            >
              <LayoutGrid />
            </Button>
            <Button
              variant={layout === 'list' ? 'secondary' : 'ghost'}
              size="icon-sm"
              onClick={() => setLayout('list')}
              aria-label="List view"
            >
              <List />
            </Button>
          </div>
          <Button
            variant="outline"
            size="sm"
            disabled={!selectedIgId || mediaQ.isFetching}
            onClick={sync}
          >
            <RefreshCw className={mediaQ.isFetching ? 'animate-spin' : ''} />
            Sync
          </Button>
        </div>
      </div>

      {accounts.length > 1 ? (
        <div className="flex flex-wrap gap-2">
          {accounts.map((account) => {
            const active = account.instagramUserId === selectedIgId
            const label = account.username
              ? `@${account.username}`
              : account.displayName || account.pageName || 'Instagram'
            return (
              <Button
                key={account.instagramUserId}
                size="sm"
                variant={active ? 'default' : 'outline'}
                onClick={() => {
                  setSelectedIgId(account.instagramUserId)
                  const next = new URLSearchParams(searchParams)
                  next.set('ig', account.instagramUserId)
                  setSearchParams(next, { replace: true })
                }}
              >
                {label}
              </Button>
            )
          })}
        </div>
      ) : null}

      {error ? <p className="text-destructive text-sm">{error}</p> : null}

      {!accountsQ.isLoading && accounts.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed p-12 text-center">
          <PlatformIcon platform="instagram" className="size-8" />
          <p className="text-sm font-medium">Connect Instagram</p>
          <Button onClick={() => navigate('/integrations')}>Connect Instagram</Button>
        </div>
      ) : mediaQ.isLoading && !items.length ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="aspect-square rounded-xl" />
          ))}
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed p-12 text-center">
          <ImageIcon className="text-muted-foreground size-8" />
          <p className="text-sm font-medium">No posts synced yet</p>
        </div>
      ) : (
        <>
          <div className={layout === 'list' ? 'space-y-2' : 'grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4'}>
            {filteredItems.map(renderMediaCard)}
          </div>
          {nextCursor ? (
            <div className="flex justify-center">
              <Button variant="outline" disabled={loadingMore} onClick={() => void loadMore()}>
                {loadingMore ? 'Loading…' : 'Load more'}
              </Button>
            </div>
          ) : null}
        </>
      )}
    </div>
  )
}
