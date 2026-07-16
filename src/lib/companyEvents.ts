export const COMPANY_UPDATED_EVENT = 'convosync:company-updated';

export function dispatchCompanyUpdated(detail: {
  name?: string | null;
  logoUrl?: string | null;
}) {
  window.dispatchEvent(new CustomEvent(COMPANY_UPDATED_EVENT, { detail }));
}
