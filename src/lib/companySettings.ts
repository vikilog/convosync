import type { CompanySettingsResponse } from '../components/settings/companyFormUtils';

export function normalizeCompanySettingsResponse(raw: unknown): CompanySettingsResponse {
  if (!raw || typeof raw !== 'object') return {};
  const data = raw as Record<string, unknown>;
  if (data.workspace && typeof data.workspace === 'object') {
    return {
      ...(data.workspace as CompanySettingsResponse),
      whatsappAccounts:
        (data.whatsappAccounts as CompanySettingsResponse['whatsappAccounts']) ??
        (data.workspace as CompanySettingsResponse).whatsappAccounts,
    };
  }
  return data as CompanySettingsResponse;
}
