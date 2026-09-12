import { useMemo } from 'react'

import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { listCountries } from '@/lib/locale/countries'
import { listTimezoneOptions } from '@/lib/locale/timezones'

export function LocaleFields({
  country,
  timezone,
  onCountryChange,
  onTimezoneChange,
  countryHint,
  timezoneHint,
  disabled,
  idPrefix = 'locale',
}: {
  country: string
  timezone: string
  onCountryChange: (code: string) => void
  onTimezoneChange: (tz: string) => void
  countryHint?: string | null
  timezoneHint?: string | null
  disabled?: boolean
  idPrefix?: string
}) {
  const countries = useMemo(() => listCountries(), [])
  const timezones = useMemo(() => listTimezoneOptions(), [])
  const countryOptions = useMemo(() => {
    if (country && !countries.some((c) => c.code === country)) {
      return [{ code: country, label: country }, ...countries]
    }
    return countries
  }, [countries, country])
  const timezoneOptions = useMemo(() => {
    if (timezone && !timezones.some((t) => t.value === timezone)) {
      return [{ value: timezone, label: timezone }, ...timezones]
    }
    return timezones
  }, [timezones, timezone])

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <div className="space-y-1.5">
        <Label htmlFor={`${idPrefix}-country`}>Country</Label>
        <Select value={country} disabled={disabled} onValueChange={onCountryChange}>
          <SelectTrigger id={`${idPrefix}-country`} className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {countryOptions.map((c) => (
              <SelectItem key={c.code} value={c.code}>
                {c.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {countryHint ? <p className="text-muted-foreground text-xs">{countryHint}</p> : null}
      </div>
      <div className="space-y-1.5">
        <Label htmlFor={`${idPrefix}-timezone`}>Timezone</Label>
        <Select value={timezone} disabled={disabled} onValueChange={onTimezoneChange}>
          <SelectTrigger id={`${idPrefix}-timezone`} className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {timezoneOptions.map((tz) => (
              <SelectItem key={tz.value} value={tz.value}>
                {tz.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {timezoneHint ? <p className="text-muted-foreground text-xs">{timezoneHint}</p> : null}
      </div>
    </div>
  )
}
