import { LegalPageLayout } from './legal/LegalPageLayout';
import { termsOfServiceDocument } from './legal/termsOfServiceContent';

export function TermsOfServicePage() {
  return <LegalPageLayout document={termsOfServiceDocument} />;
}
