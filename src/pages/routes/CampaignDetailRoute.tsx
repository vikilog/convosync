import { useNavigate, useParams } from 'react-router-dom'

import { CampaignDetailPage } from '@/pages/CampaignDetailPage'

export function CampaignDetailRoute() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  if (!id) {
    navigate('/campaigns', { replace: true })
    return null
  }

  return <CampaignDetailPage campaignId={id} />
}
