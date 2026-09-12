import { useQueryClient } from '@tanstack/react-query'
import { useLocation, useSearchParams } from 'react-router-dom'

import { ConvertSocialToLeadSheet } from '@/components/leads/ConvertSocialToLeadSheet'
import { FunnelBoard } from '@/components/leads/FunnelBoard'
import { FunnelList } from '@/components/leads/FunnelList'
import { useKeepAliveActivation } from '@/components/KeepAlive'
import { leadFunnelIdFromPath } from '@/lib/leadPaths'

export function LeadsPage() {
  const location = useLocation()
  const [searchParams] = useSearchParams()
  const queryClient = useQueryClient()
  const funnelId = leadFunnelIdFromPath(location.pathname)
  const fromComment = searchParams.get('fromComment')

  useKeepAliveActivation(() => {
    void queryClient.invalidateQueries({ queryKey: ['realLeadFunnels'] })
    void queryClient.invalidateQueries({ queryKey: ['realLeads'] })
  })

  return (
    <>
      {funnelId ? <FunnelBoard funnelId={funnelId} /> : <FunnelList />}
      <ConvertSocialToLeadSheet socialCommentId={fromComment} />
    </>
  )
}
