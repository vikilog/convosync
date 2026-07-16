export type CompanyForm = {
  name: string;
  legalName: string;
  industry: string;
  website: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  country: string;
  postalCode: string;
  timezone: string;
  taxId: string;
  logoUrl: string;
};

export type CompanySettingsResponse = {
  id?: string;
  slug?: string;
  name?: string | null;
  logoUrl?: string | null;
  legalName?: string | null;
  industry?: string | null;
  website?: string | null;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  country?: string | null;
  postalCode?: string | null;
  timezone?: string | null;
  taxId?: string | null;
  waPhoneNumber?: string | null;
  whatsappAccounts?: { phoneNumber?: string | null }[];
};

export function mapWorkspaceToForm(
  data: CompanySettingsResponse,
  fallback?: { email?: string }
): CompanyForm {
  const waLines: string[] = [];
  if (data.waPhoneNumber) waLines.push(data.waPhoneNumber);
  for (const acc of data.whatsappAccounts ?? []) {
    if (acc.phoneNumber && !waLines.includes(acc.phoneNumber)) waLines.push(acc.phoneNumber);
  }

  return {
    name: data.name ?? '',
    legalName: data.legalName ?? '',
    industry: data.industry ?? '',
    website: data.website ?? '',
    email: data.email ?? fallback?.email ?? '',
    phone: data.phone ?? data.waPhoneNumber ?? waLines[0] ?? '',
    address: data.address ?? '',
    city: data.city ?? '',
    state: data.state ?? '',
    country: data.country ?? 'IN',
    postalCode: data.postalCode ?? '',
    timezone: data.timezone ?? 'Asia/Kolkata',
    taxId: data.taxId ?? '',
    logoUrl: data.logoUrl ?? '',
  };
}

export function whatsappLinesFromSettings(data: CompanySettingsResponse): string[] {
  const lines: string[] = [];
  if (data.waPhoneNumber) lines.push(data.waPhoneNumber);
  for (const acc of data.whatsappAccounts ?? []) {
    if (acc.phoneNumber && !lines.includes(acc.phoneNumber)) lines.push(acc.phoneNumber);
  }
  return lines;
}
