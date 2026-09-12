import { Plus } from 'lucide-react'

import { CampaignWizard } from '@/components/campaigns/CampaignWizard'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'

export function NewCampaignSheet({
  open,
  onOpenChange,
  editCampaignId,
  showTrigger = true,
}: {
  open?: boolean
  onOpenChange?: (open: boolean) => void
  editCampaignId?: string | null
  showTrigger?: boolean
}) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      {showTrigger ? (
        <SheetTrigger asChild>
          <Button size="sm">
            <Plus />
            New campaign
          </Button>
        </SheetTrigger>
      ) : null}
      <SheetContent side="right" className="flex w-full flex-col sm:max-w-xl">
        <SheetHeader>
          <SheetTitle>{editCampaignId ? 'Edit campaign' : 'New campaign'}</SheetTitle>
        </SheetHeader>
        <CampaignWizard
          editCampaignId={editCampaignId}
          onDone={() => onOpenChange?.(false)}
          onCancel={() => onOpenChange?.(false)}
        />
      </SheetContent>
    </Sheet>
  )
}
