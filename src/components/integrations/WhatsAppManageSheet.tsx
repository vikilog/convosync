import { useEffect, useState } from 'react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Sheet, SheetClose, SheetContent, SheetFooter, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Textarea } from '@/components/ui/textarea'
import { ApiError } from '@/lib/httpClient'
import { realIntegrationsService } from '@/services/realIntegrations.service'

export function WhatsAppManageSheet({
  phoneNumberId,
  open,
  onOpenChange,
}: {
  phoneNumberId: string | null
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const { data: bundle } = realIntegrationsService.useWhatsAppBusinessProfile(open ? phoneNumberId : null)
  const updateProfile = realIntegrationsService.useUpdateWhatsAppBusinessProfile(phoneNumberId)

  const [about, setAbout] = useState('')
  const [address, setAddress] = useState('')
  const [description, setDescription] = useState('')
  const [email, setEmail] = useState('')
  const [vertical, setVertical] = useState('OTHER')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (bundle && open) {
      setAbout(bundle.profile.about ?? '')
      setAddress(bundle.profile.address ?? '')
      setDescription(bundle.profile.description ?? '')
      setEmail(bundle.profile.email ?? '')
      setVertical(bundle.profile.vertical || 'OTHER')
      setError(null)
    }
  }, [bundle, open])

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right">
        <SheetHeader>
          <SheetTitle>WhatsApp business profile</SheetTitle>
        </SheetHeader>

        <div className="flex-1 space-y-4 overflow-y-auto px-4">
          {bundle ? (
            <div className="space-y-1 rounded-lg border p-3 text-xs">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Number</span>
                <span className="font-medium">{bundle.displayPhoneNumber ?? '—'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Verified name</span>
                <span className="font-medium">{bundle.verifiedName ?? '—'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Quality rating</span>
                <span className="font-medium">{bundle.qualityRating ?? '—'}</span>
              </div>
            </div>
          ) : null}

          <div className="space-y-1.5">
            <Label htmlFor="wa-about">About</Label>
            <Input id="wa-about" value={about} onChange={(e) => setAbout(e.target.value)} maxLength={139} />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="wa-description">Description</Label>
            <Textarea
              id="wa-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="wa-address">Address</Label>
            <Input id="wa-address" value={address} onChange={(e) => setAddress(e.target.value)} />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="wa-email">Contact email</Label>
            <Input id="wa-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>

          <div className="space-y-1.5">
            <Label>Category</Label>
            <Select value={vertical} onValueChange={setVertical}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(bundle?.verticals ?? [vertical]).map((v) => (
                  <SelectItem key={v} value={v}>
                    {v}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {error ? <p className="text-destructive text-xs">{error}</p> : null}
        </div>

        <SheetFooter className="flex-row justify-end gap-2">
          <SheetClose asChild>
            <Button variant="ghost">Cancel</Button>
          </SheetClose>
          <Button
            disabled={updateProfile.isPending || !phoneNumberId}
            onClick={() => {
              setError(null)
              updateProfile.mutate(
                { about, address, description, email, vertical },
                {
                  onSuccess: () => onOpenChange(false),
                  onError: (err) => {
                    setError(err instanceof ApiError ? err.message : 'Could not save this profile.')
                  },
                }
              )
            }}
          >
            {updateProfile.isPending ? 'Saving…' : 'Save'}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
