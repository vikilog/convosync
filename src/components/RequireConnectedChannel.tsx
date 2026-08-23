import type { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { useInboxAssigneeMeta } from '../hooks/inbox/useInboxMeta';
import { pathForIntegrationsChannel, type IntegrationsChannel } from '../routes';
import { ConnectChannelEmpty } from './ConnectChannelEmpty';

export type RequiredConnectChannel = 'whatsapp' | 'instagram' | 'messenger' | 'email' | 'facebook';

type Props = {
  children: ReactNode;
  /** At least one of these must be connected. Default: messaging channels. */
  anyOf?: RequiredConnectChannel[];
  title?: string;
  description?: string;
  /** Integrations deep-link when CTA is clicked. */
  connectChannel?: IntegrationsChannel;
};

/** Blocks a screen until one of the required channels is connected. */
export function RequireConnectedChannel({
  children,
  anyOf = ['whatsapp', 'instagram', 'messenger'],
  title,
  description,
  connectChannel = 'whatsapp',
}: Props) {
  const navigate = useNavigate();
  const {
    whatsappAccounts,
    instagramConnected,
    messengerConnected,
    emailConnected,
    facebookPageConnected,
    channelsReady,
  } = useInboxAssigneeMeta();

  const connected: Record<RequiredConnectChannel, boolean> = {
    whatsapp: whatsappAccounts.length > 0,
    instagram: instagramConnected,
    messenger: messengerConnected,
    email: emailConnected,
    facebook: facebookPageConnected,
  };

  const hasRequired = anyOf.some((channel) => connected[channel]);

  if (channelsReady && !hasRequired) {
    const defaultDescription =
      anyOf.length === 2 && anyOf.includes('whatsapp') && anyOf.includes('email')
        ? 'Connect WhatsApp or Email to create and send campaigns.'
        : 'Connect WhatsApp, Instagram, or Messenger to get started.';

    return (
      <div className="flex h-full min-h-0 overflow-hidden bg-surface-muted">
        <ConnectChannelEmpty
          title={title ?? 'Connect a channel first'}
          description={description ?? defaultDescription}
          onConnect={() => navigate(pathForIntegrationsChannel(connectChannel))}
        />
      </div>
    );
  }

  return <>{children}</>;
}
