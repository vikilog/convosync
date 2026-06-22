import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { AppLoadingScreen } from './ui/AppLoadingScreen';
import { api } from '../lib/api';
import { pathForIntegrationsChannel } from '../routes';

/**
 * Meta OAuth redirect landing page.
 * Add this URL in Meta Developer Console → Facebook Login → Valid OAuth Redirect URIs:
 * http://localhost:3000/whatsapp/callback
 */
function whatsappIntegrationsPath(flag?: 'whatsapp_connected' | 'whatsapp_error'): string {
  const base = pathForIntegrationsChannel('whatsapp');
  if (!flag) return base;
  return `${base}&${flag}=1`;
}

export function WhatsAppCallbackPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [message, setMessage] = useState('Completing WhatsApp connection…');

  useEffect(() => {
    const error = searchParams.get('error');
    const success = searchParams.get('success');
    const phone = searchParams.get('phone');
    const code = searchParams.get('code');
    const state = searchParams.get('state');

    if (error) {
      setMessage(error);
      const t = setTimeout(() => navigate(whatsappIntegrationsPath('whatsapp_error')), 2500);
      return () => clearTimeout(t);
    }

    if (success === '1') {
      setMessage(phone ? `Connected: ${phone}` : 'WhatsApp connected successfully.');
      const t = setTimeout(() => navigate(whatsappIntegrationsPath('whatsapp_connected')), 1500);
      return () => clearTimeout(t);
    }

    if (code && state) {
      api
        .completeWhatsAppOAuth(code, state)
        .then((data: { phoneNumber?: string }) => {
          setMessage(
            data.phoneNumber
              ? `Connected: ${data.phoneNumber}`
              : 'WhatsApp connected successfully.'
          );
          setTimeout(() => navigate(whatsappIntegrationsPath('whatsapp_connected')), 1500);
        })
        .catch((err: Error) => {
          setMessage(err.message || 'Connection failed');
          setTimeout(() => navigate(whatsappIntegrationsPath('whatsapp_error')), 2500);
        });
      return;
    }

    setMessage('No connection data received from Meta.');
    const t = setTimeout(() => navigate(whatsappIntegrationsPath()), 2500);
    return () => clearTimeout(t);
  }, [navigate, searchParams]);

  return (
    <AppLoadingScreen variant="card" title="WhatsApp Setup" message={message} />
  );
}
