import { CampaignDetailView } from '@/components/campaigns/CampaignDetailView'
import { Sheet, SheetContent } from '@/components/ui/sheet'

export function CampaignDetailSheet({
  campaignId,
  onOpenChange,
  onEdit,
}: {
  campaignId: string | null
  onOpenChange: (open: boolean) => void
  onEdit?: (id: string) => void
}) {
  return (
    <Sheet open={campaignId != null} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="flex w-full flex-col p-0 sm:max-w-2xl">
        {campaignId ? (
          <CampaignDetailView
            campaignId={campaignId}
            onEdit={(id) => {
              onOpenChange(false)
              onEdit?.(id)
            }}
          />
        ) : null}
      </SheetContent>
    </Sheet>
  )
}
