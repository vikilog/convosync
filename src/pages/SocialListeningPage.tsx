import { matchPath, useLocation, useSearchParams } from 'react-router-dom'

import { KeepAlive, useKeepAliveActivation } from '@/components/KeepAlive'
import { PLATFORM_LABEL, PlatformIcon } from '@/components/social-listening/platform-icon'
import { SocialListeningContent } from '@/pages/social-listening/SocialListeningContent'
import { SocialListeningDashboard } from '@/pages/social-listening/SocialListeningDashboard'
import { SocialListeningMediaDetail } from '@/pages/social-listening/SocialListeningMediaDetail'
import { SocialListeningReview } from '@/pages/social-listening/SocialListeningReview'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useInvalidateSocialListening } from '@/hooks/useSocialListeningQueries'
import type { Platform } from '@/lib/socialListening'

type Tab = 'dashboard' | 'content' | 'review'

export function SocialListeningPage() {
  const location = useLocation()
  const [searchParams, setSearchParams] = useSearchParams()
  const invalidate = useInvalidateSocialListening()
  useKeepAliveActivation(() => {
    invalidate()
  })

  const mediaMatch = matchPath('/social-listening/media/:mediaId', location.pathname)
  const showingMedia = Boolean(mediaMatch?.params.mediaId)
  const tab = (['dashboard', 'content', 'review'].includes(searchParams.get('tab') || '')
    ? searchParams.get('tab')
    : 'dashboard') as Tab
  const platform = (searchParams.get('platform') === 'facebook' ? 'facebook' : 'instagram') as Platform

  const setTab = (next: Tab) => {
    const params = new URLSearchParams(searchParams)
    params.set('tab', next)
    params.set('platform', platform)
    setSearchParams(params, { replace: true })
  }

  const setPlatform = (next: Platform) => {
    const params = new URLSearchParams(searchParams)
    params.set('platform', next)
    params.set('tab', tab)
    setSearchParams(params, { replace: true })
  }

  return (
    <div className="flex h-full min-h-0 w-full flex-1 flex-col">
      <KeepAlive active={!showingMedia}>
        <div className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-b px-4 py-3">
          <Tabs value={tab} onValueChange={(v) => setTab(v as Tab)}>
            <TabsList>
              <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
              <TabsTrigger value="content">Content</TabsTrigger>
              <TabsTrigger value="review">Review</TabsTrigger>
            </TabsList>
          </Tabs>

          <Select value={platform} onValueChange={(v) => setPlatform(v as Platform)}>
            <SelectTrigger className="w-40">
              <SelectValue>
                <span className="flex items-center gap-2">
                  <PlatformIcon platform={platform} className="size-4" />
                  {PLATFORM_LABEL[platform]}
                </span>
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="instagram">
                <span className="flex items-center gap-2">
                  <PlatformIcon platform="instagram" className="size-4" />
                  Instagram
                </span>
              </SelectItem>
              <SelectItem value="facebook">
                <span className="flex items-center gap-2">
                  <PlatformIcon platform="facebook" className="size-4" />
                  Facebook
                </span>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        {tab === 'dashboard' ? (
          <SocialListeningDashboard platform={platform} onOpenReview={() => setTab('review')} />
        ) : tab === 'content' ? (
          <SocialListeningContent platform={platform} />
        ) : (
          <SocialListeningReview platform={platform} />
        )}
      </KeepAlive>

      <KeepAlive active={showingMedia}>
        {showingMedia ? <SocialListeningMediaDetail /> : null}
      </KeepAlive>
    </div>
  )
}
