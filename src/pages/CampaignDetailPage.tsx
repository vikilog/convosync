import { useNavigate } from 'react-router-dom'

import { CampaignDetailView } from '@/components/campaigns/CampaignDetailView'

export function CampaignDetailPage({ campaignId }: { campaignId: string }) {
  const navigate = useNavigate()
  return (
    <CampaignDetailView
      campaignId={campaignId}
      onBack={() => navigate('/campaigns')}
      onEdit={(id) => navigate('/campaigns/new', { state: { editCampaignId: id } })}
    />
  )
}
