/**
 * ISO 3166-1 alpha-2 → ITU dial digits (no +).
 * Curated common set for phone pickers; unknown ISO falls back to IN (+91).
 */
export const DIAL_BY_ISO: Record<string, string> = {
  AE: '971',
  AR: '54',
  AU: '61',
  BD: '880',
  BE: '32',
  BH: '973',
  BR: '55',
  CA: '1',
  CH: '41',
  CN: '86',
  DE: '49',
  DK: '45',
  EG: '20',
  ES: '34',
  FR: '33',
  GB: '44',
  HK: '852',
  ID: '62',
  IE: '353',
  IL: '972',
  IN: '91',
  IT: '39',
  JP: '81',
  KE: '254',
  KR: '82',
  KW: '965',
  LK: '94',
  MX: '52',
  MY: '60',
  NG: '234',
  NL: '31',
  NO: '47',
  NP: '977',
  NZ: '64',
  OM: '968',
  PH: '63',
  PK: '92',
  PL: '48',
  PT: '351',
  QA: '974',
  SA: '966',
  SE: '46',
  SG: '65',
  TH: '66',
  TR: '90',
  TW: '886',
  US: '1',
  VN: '84',
  ZA: '27',
};

export type DialOption = { dial: string; label: string };

const DEFAULT_ISO = 'IN';

/** Unique +dial options for a select (US/CA share +1). */
export function listDialCodeOptions(): DialOption[] {
  const byDial = new Map<string, string[]>();
  for (const [iso, digits] of Object.entries(DIAL_BY_ISO)) {
    const dial = `+${digits}`;
    const list = byDial.get(dial) ?? [];
    list.push(iso);
    byDial.set(dial, list);
  }
  return [...byDial.entries()]
    .map(([dial, isos]) => ({
      dial,
      label: `${isos.sort().join('/')} ${dial}`,
    }))
    .sort((a, b) => {
      if (a.dial === '+91') return -1;
      if (b.dial === '+91') return 1;
      return a.label.localeCompare(b.label);
    });
}

export function dialForCountry(iso?: string | null): string {
  const code = (iso || DEFAULT_ISO).toUpperCase();
  const digits = DIAL_BY_ISO[code] ?? DIAL_BY_ISO[DEFAULT_ISO];
  return `+${digits}`;
}

/** Longest-first dial strings like '+971', '+91', '+1'. */
function knownDials(): string[] {
  return [...new Set(Object.values(DIAL_BY_ISO).map((d) => `+${d}`))].sort(
    (a, b) => b.length - a.length
  );
}

/**
 * Split stored phone into dial + national for display.
 * Strips a leading country code even when the value has no '+' (e.g. 91999…).
 */
export function splitPhone(
  phone: string | null | undefined,
  fallbackIso?: string | null
): { dial: string; national: string } {
  const fallback = dialForCountry(fallbackIso);
  const raw = (phone ?? '').trim();
  if (!raw) return { dial: fallback, national: '' };

  const dials = knownDials();

  if (raw.startsWith('+')) {
    const match = dials.find((d) => raw.startsWith(d));
    if (match) {
      return { dial: match, national: raw.slice(match.length).replace(/\D/g, '') };
    }
    return { dial: fallback, national: raw.replace(/\D/g, '') };
  }

  const digits = raw.replace(/\D/g, '');
  if (!digits) return { dial: fallback, national: '' };

  const fallbackDigits = fallback.replace(/\D/g, '');
  if (
    digits.startsWith(fallbackDigits) &&
    digits.length - fallbackDigits.length >= 6
  ) {
    return { dial: fallback, national: digits.slice(fallbackDigits.length) };
  }

  const match = dials.find((d) => {
    const cc = d.replace(/\D/g, '');
    return digits.startsWith(cc) && digits.length - cc.length >= 6;
  });
  if (match) {
    return { dial: match, national: digits.slice(match.replace(/\D/g, '').length) };
  }

  return { dial: fallback, national: digits };
}

/** Compose E.164; avoids doubling if national already includes the dial digits. */
export function toE164(dial: string, national: string): string {
  const digits = national.replace(/\D/g, '');
  if (!digits) return '';
  const cc = dial.replace(/\D/g, '') || DIAL_BY_ISO[DEFAULT_ISO];
  if (digits.startsWith(cc) && digits.length - cc.length >= 6) return `+${digits}`;
  return `+${cc}${digits}`;
}
