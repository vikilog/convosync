import { LegalPageLayout } from './legal/LegalPageLayout';
import { privacyPolicyDocument } from './legal/privacyPolicyContent';

export function PrivacyPolicyPage() {
  return <LegalPageLayout document={privacyPolicyDocument} />;
}
