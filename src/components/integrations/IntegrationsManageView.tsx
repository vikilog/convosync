import { EmailManagePage } from '@/components/integrations/EmailManagePage'
import { GoogleManagePage } from '@/components/integrations/GoogleManagePage'
import { MetaAdsManagePage } from '@/components/integrations/MetaAdsManagePage'
import { WhatsAppConnectPage } from '@/components/integrations/WhatsAppConnectPage'
import { WhatsAppManagePage } from '@/components/integrations/WhatsAppManagePage'

export type IntegrationsManageViewId = 'whatsapp' | 'whatsapp-coexistence' | 'email' | 'google' | 'meta-ads'

export function IntegrationsManageView({
  view,
  whatsappConnected,
  coexistenceConnected,
  onBack,
}: {
  view: IntegrationsManageViewId
  whatsappConnected: boolean
  coexistenceConnected: boolean
  onBack: () => void
}) {
  if (view === 'whatsapp') {
    return whatsappConnected ? (
      <WhatsAppManagePage onBack={onBack} />
    ) : (
      <WhatsAppConnectPage mode="business_api" onBack={onBack} onConnected={() => undefined} />
    )
  }

  if (view === 'whatsapp-coexistence') {
    return coexistenceConnected ? (
      <WhatsAppManagePage mode="app_coexistence" onBack={onBack} />
    ) : (
      <WhatsAppConnectPage mode="app_coexistence" onBack={onBack} onConnected={() => undefined} />
    )
  }

  if (view === 'email') return <EmailManagePage onBack={onBack} />
  if (view === 'google') return <GoogleManagePage onBack={onBack} />
  return <MetaAdsManagePage onBack={onBack} />
}
