import { useEffect, useRef, useState } from 'react'
import { Building2, Camera, Loader2, Trash2 } from 'lucide-react'

import { LocaleFields } from '@/components/locale/LocaleFields'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import { compressImageFile } from '@/lib/imageUpload'
import { companyResource } from '@/services/company.service'

export function CompanyInfoPanel() {
  const { data: company, isLoading, isError, error } = companyResource.useGet()
  const updateCompany = companyResource.useUpdate()

  const [companyName, setCompanyName] = useState('')
  const [industry, setIndustry] = useState('')
  const [website, setWebsite] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [address, setAddress] = useState('')
  const [city, setCity] = useState('')
  const [state, setState] = useState('')
  const [postalCode, setPostalCode] = useState('')
  const [country, setCountry] = useState('IN')
  const [timezone, setTimezone] = useState('Asia/Kolkata')
  const [taxId, setTaxId] = useState('')
  const [saved, setSaved] = useState(false)
  const [logoError, setLogoError] = useState<string | null>(null)
  const logoRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!company) return
    setCompanyName(company.name ?? '')
    setIndustry(company.industry ?? '')
    setWebsite(company.website ?? '')
    setPhone(company.phone ?? '')
    setEmail(company.email ?? '')
    setAddress(company.address ?? '')
    setCity(company.city ?? '')
    setState(company.state ?? '')
    setPostalCode(company.postalCode ?? '')
    setCountry(company.country || 'IN')
    setTimezone(company.timezone || 'Asia/Kolkata')
    setTaxId(company.taxId ?? '')
  }, [company])

  const handleSave = () => {
    setSaved(false)
    updateCompany.mutate(
      {
        name: companyName.trim(),
        industry: industry.trim() || null,
        website: website.trim() || null,
        phone: phone.trim() || null,
        email: email.trim() || null,
        address: address.trim() || null,
        city: city.trim() || null,
        state: state.trim() || null,
        postalCode: postalCode.trim() || null,
        country: country || null,
        timezone: timezone || null,
        taxId: taxId.trim() || null,
      },
      { onSuccess: () => setSaved(true) }
    )
  }

  const handleLogo = async (file: File | null) => {
    if (!file) return
    setLogoError(null)
    try {
      const compressed = await compressImageFile(file, 320, 0.88)
      updateCompany.mutate({ logoUrl: compressed }, { onSuccess: () => setSaved(true) })
    } catch (err) {
      setLogoError(err instanceof Error ? err.message : 'Could not process logo')
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-96" />
      </div>
    )
  }

  if (isError || !company) {
    return (
      <div className="border-destructive/20 bg-destructive/10 text-destructive rounded-xl border p-4 text-sm">
        Couldn't load company settings: {error instanceof Error ? error.message : 'Unknown error'}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Company details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="bg-muted relative flex size-16 shrink-0 items-center justify-center overflow-hidden rounded-xl border">
              {company.logoUrl ? (
                <img src={company.logoUrl} alt="" className="size-full object-cover" />
              ) : (
                <Building2 className="text-muted-foreground size-6" />
              )}
              {updateCompany.isPending ? (
                <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                  <Loader2 className="size-5 animate-spin text-white" />
                </div>
              ) : null}
            </div>
            <div className="space-y-2">
              <input
                ref={logoRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0] ?? null
                  e.target.value = ''
                  void handleLogo(file)
                }}
              />
              <div className="flex flex-wrap gap-2">
                <Button variant="outline" size="sm" onClick={() => logoRef.current?.click()}>
                  <Camera />
                  {company.logoUrl ? 'Change logo' : 'Upload logo'}
                </Button>
                {company.logoUrl ? (
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-destructive"
                    onClick={() => updateCompany.mutate({ logoUrl: null })}
                  >
                    <Trash2 />
                    Remove
                  </Button>
                ) : null}
              </div>
              {logoError ? <p className="text-destructive text-xs">{logoError}</p> : null}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="company-name">Company name</Label>
              <Input id="company-name" value={companyName} onChange={(e) => setCompanyName(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="company-industry">Industry</Label>
              <Input id="company-industry" value={industry} onChange={(e) => setIndustry(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="company-website">Website</Label>
              <Input id="company-website" value={website} onChange={(e) => setWebsite(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="company-email">Company email</Label>
              <Input
                id="company-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="company-phone">Phone</Label>
              <Input id="company-phone" value={phone} onChange={(e) => setPhone(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="company-tax">Tax ID / GSTIN</Label>
              <Input id="company-tax" value={taxId} onChange={(e) => setTaxId(e.target.value)} />
            </div>
          </div>

          <LocaleFields
            idPrefix="company"
            country={country}
            timezone={timezone}
            onCountryChange={setCountry}
            onTimezoneChange={setTimezone}
          />

          <div className="space-y-1.5">
            <Label htmlFor="company-address">Address</Label>
            <Input
              id="company-address"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Street address"
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="space-y-1.5">
              <Label htmlFor="company-city">City</Label>
              <Input id="company-city" value={city} onChange={(e) => setCity(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="company-state">State</Label>
              <Input id="company-state" value={state} onChange={(e) => setState(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="company-postal">Postal code</Label>
              <Input id="company-postal" value={postalCode} onChange={(e) => setPostalCode(e.target.value)} />
            </div>
          </div>

          {updateCompany.isError ? (
            <p className="text-destructive text-xs">
              {updateCompany.error instanceof Error ? updateCompany.error.message : 'Save failed'}
            </p>
          ) : null}
          <div className="flex items-center gap-2">
            <Button size="sm" onClick={handleSave} disabled={updateCompany.isPending}>
              {updateCompany.isPending ? 'Saving…' : 'Save changes'}
            </Button>
            {saved ? <span className="text-channel-green text-xs font-medium">Saved</span> : null}
          </div>
        </CardContent>
      </Card>

      <Card className="border-sky-200 bg-sky-50 dark:border-sky-900 dark:bg-sky-950/30">
        <CardHeader>
          <CardTitle>Workspace reference</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-3">
          <div>
            <p className="text-muted-foreground text-xs">Workspace ID</p>
            <p className="truncate font-mono">{company.id}</p>
          </div>
          <div>
            <p className="text-muted-foreground text-xs">Slug</p>
            <p className="truncate font-mono">{company.slug}</p>
          </div>
          <div>
            <p className="text-muted-foreground text-xs">Connected WhatsApp numbers</p>
            <p>{company.whatsappAccounts.length} numbers</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
