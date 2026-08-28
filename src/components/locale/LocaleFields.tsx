import { useMemo } from 'react';
import { listCountries } from '../../lib/locale/countries';
import { listTimezoneOptions } from '../../lib/locale/timezones';

export type LocaleFieldsProps = {
  country: string;
  timezone: string;
  onCountryChange: (code: string) => void;
  onTimezoneChange: (tz: string) => void;
  countryHint?: string | null;
  timezoneHint?: string | null;
  disabled?: boolean;
  idPrefix?: string;
};

const selectClass =
  'mt-1 w-full rounded-xl border border-swiss-line bg-white px-3 py-2.5 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:cursor-not-allowed disabled:bg-slate-50';

export function LocaleFields({
  country,
  timezone,
  onCountryChange,
  onTimezoneChange,
  countryHint,
  timezoneHint,
  disabled,
  idPrefix = 'locale',
}: LocaleFieldsProps) {
  const countries = useMemo(() => listCountries(), []);
  const timezones = useMemo(() => listTimezoneOptions(), []);

  const countryOptions = useMemo(() => {
    if (country && !countries.some((c) => c.code === country)) {
      return [{ code: country, label: country }, ...countries];
    }
    return countries;
  }, [countries, country]);

  const timezoneOptions = useMemo(() => {
    if (timezone && !timezones.some((t) => t.value === timezone)) {
      return [{ value: timezone, label: timezone }, ...timezones];
    }
    return timezones;
  }, [timezones, timezone]);

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <label className="block" htmlFor={`${idPrefix}-country`}>
        <span className="text-meta font-bold uppercase tracking-wide text-swiss-muted">Country</span>
        <select
          id={`${idPrefix}-country`}
          value={country}
          disabled={disabled}
          onChange={(e) => onCountryChange(e.target.value)}
          className={selectClass}
        >
          {countryOptions.map((c) => (
            <option key={c.code} value={c.code}>
              {c.label}
            </option>
          ))}
        </select>
        {countryHint ? <p className="mt-1 text-xs text-slate-500">{countryHint}</p> : null}
      </label>

      <label className="block" htmlFor={`${idPrefix}-timezone`}>
        <span className="text-meta font-bold uppercase tracking-wide text-swiss-muted">Timezone</span>
        <select
          id={`${idPrefix}-timezone`}
          value={timezone}
          disabled={disabled}
          onChange={(e) => onTimezoneChange(e.target.value)}
          className={selectClass}
        >
          {timezoneOptions.map((tz) => (
            <option key={tz.value} value={tz.value}>
              {tz.label}
            </option>
          ))}
        </select>
        {timezoneHint ? <p className="mt-1 text-xs text-slate-500">{timezoneHint}</p> : null}
      </label>
    </div>
  );
}
