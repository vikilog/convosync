/**
 * Nested under /automations:
 *   /automations                              → list
 *   /automations/whatsapp-automation/:id      → WA builder
 *   /automations/whatsapp-automation/gallery  → WA templates
 *   /automations/instagram-automation/:id    → IG builder
 */
import { useLocation } from 'react-router-dom';
import {
  isInstagramAutomationPath,
  isJourneyGalleryPath,
  isWhatsAppAutomationPath,
  journeyIdFromPath,
  instagramAutomationIdFromPath,
} from '../routes';
import { AutomationsView } from './AutomationsView';
import { JourneyView } from './JourneyView';
import { InstagramAutomationView } from './InstagramAutomationView';
import { RequireConnectedChannel } from './RequireConnectedChannel';

export function AutomationsRouter() {
  const { pathname } = useLocation();

  if (isWhatsAppAutomationPath(pathname) && (journeyIdFromPath(pathname) || isJourneyGalleryPath(pathname))) {
    return (
      <RequireConnectedChannel>
        <JourneyView />
      </RequireConnectedChannel>
    );
  }

  if (isInstagramAutomationPath(pathname) && instagramAutomationIdFromPath(pathname)) {
    return (
      <RequireConnectedChannel
        anyOf={['instagram']}
        title="Connect Instagram first"
        description="Instagram Automation needs a connected Instagram account."
        connectChannel="instagram"
      >
        <InstagramAutomationView />
      </RequireConnectedChannel>
    );
  }

  return <AutomationsView />;
}
