import { useLocation, useNavigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'

import { CampaignWizard } from '@/components/campaigns/CampaignWizard'
import { Button } from '@/components/ui/button'

export function CampaignWizardPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const editCampaignId =
    (location.state as { editCampaignId?: string } | null)?.editCampaignId ??
    new URLSearchParams(location.search).get('edit')

  const back = () => navigate('/campaigns', { replace: true })

  return (
    <div className="flex h-full min-h-0 w-full flex-1 flex-col">
      <div className="flex items-center gap-2 border-b px-4 py-3">
        <Button variant="ghost" size="icon-sm" onClick={back} aria-label="Back to campaigns">
          <ArrowLeft />
        </Button>
        <h1 className="text-sm font-medium">{editCampaignId ? 'Edit campaign' : 'New campaign'}</h1>
      </div>
      <CampaignWizard editCampaignId={editCampaignId} onDone={back} onCancel={back} />
    </div>
  )
}
