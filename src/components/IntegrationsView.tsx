/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import type { FC } from 'react';
import { useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  ArrowLeft,
  Database,
  Facebook,
  Instagram,
  Link2,
  Loader2,
  RefreshCw,
  Mail,
  MessageSquare,
  Phone,
  LayoutGrid,
  Settings,
  ShoppingBag,
  Ticket,
  Trash2,
} from 'lucide-react';
import { api } from '../lib/api';
import { useKeepAliveActivation } from './KeepAlive';
import { ManagerView } from './ManagerView';
import { InstagramConnectPanel } from './instagram';
import { MessengerConnectPanel } from './messenger';
import { EmailPanel } from './integrations/EmailPanel';
import { GooglePanel } from './integrations/GooglePanel';

type ChannelView =
  | 'hub'
  | 'whatsapp'
  | 'instagram'
  | 'messenger'
  | 'sms'
  | 'email'
  | 'google'
  | 'voice';

function channelViewFromSearch(search: string): ChannelView {
  const channel = new URLSearchParams(search).get('channel');
  if (channel === 'email') return 'email';
  if (channel === 'google') return 'google';
  if (channel === 'whatsapp') return 'whatsapp';
  return 'hub';
}

type ComingSoonChannel = {
  title: string;
  description: string;
};

const COMING_SOON_CHANNELS: Record<'sms' | 'voice', ComingSoonChannel> = {
  sms: {
    title: 'SMS',
    description: 'SMS channel provisioning is coming soon. You will be able to connect a sender ID from this screen.',
  },
  voice: {
    title: 'Voice code',
    description: 'Voice OTP delivery integration is coming soon.',
  },
};

type IntegrationCardProps = {
  title: string;
  description: string;
  icon: FC<{ className?: string }>;
  iconBgClass: string;
  iconClass: string;
  connectLabel?: string;
  connectDisabled?: boolean;
  onConnect: () => void;
};

function IntegrationCard({
  title,
  description,
  icon: Icon,
  iconBgClass,
  iconClass,
  connectLabel = 'Connect',
  connectDisabled,
  onConnect,
}: IntegrationCardProps) {
  return (
    <article className="bg-white rounded-2xl border border-slate-200 p-5 flex flex-col h-full shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
      <div className="flex items-center gap-3 min-w-0">
        <div
          className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${iconBgClass}`}
        >
          <Icon className={`w-5 h-5 ${iconClass}`} />
        </div>
        <h3 className="text-sm font-black text-gray-950 leading-tight truncate flex-1 min-w-0">
          {title}
        </h3>
      </div>
      <p className="mt-2 text-xs text-gray-500 font-medium leading-relaxed flex-1">{description}</p>

      <div className="mt-5">
        <button
          type="button"
          disabled={connectDisabled}
          onClick={onConnect}
          className={`w-full px-3 py-2 rounded-lg text-sm font-bold transition-all ${
            connectDisabled
              ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
              : 'bg-gray-900 hover:bg-gray-800 text-white'
          }`}
        >
          {connectLabel}
        </button>
      </div>
    </article>
  );
}

function WhatsAppBrandIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.435 9.884-9.884 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  );
}

type WhatsAppAccountSummary = {
  id: string;
  phoneNumberId: string;
  phoneNumber?: string;
  displayName?: string;
  label?: string;
  wabaId?: string;
};

type InstagramAccountSummary = {
  id: string;
  instagramUserId: string;
  username?: string;
  displayName?: string;
  pageName?: string;
  profilePicture?: string;
  label?: string;
};

type MessengerAccountSummary = {
  id: string;
  pageId: string;
  pageName?: string;
  displayName?: string;
  profilePicture?: string;
  label?: string;
};

type EmailIntegrationSummary = {
  connected: boolean;
  defaultSenderEmail?: string;
  defaultSenderName?: string;
  verifiedDomainCount: number;
  providerLabel?: string;
};

type ConnectedChannelCardProps = {
  channel: 'whatsapp' | 'instagram' | 'messenger' | 'email';
  channelLabel: string;
  title: string;
  subtitle: string;
  detail?: string;
  avatarUrl?: string;
  disconnecting?: boolean;
  onDisconnect?: () => void;
  onManage?: () => void;
  onSync?: () => void;
  syncing?: boolean;
};

function ConnectedChannelCard({
  channel,
  channelLabel,
  title,
  subtitle,
  detail,
  avatarUrl,
  disconnecting,
  onDisconnect,
  onManage,
  onSync,
  syncing = false,
}: ConnectedChannelCardProps) {
  const iconBg =
    channel === 'whatsapp'
      ? 'bg-[#e6f7ec]'
      : channel === 'messenger'
        ? 'bg-[#e8f4ff]'
        : channel === 'email'
          ? 'bg-[#e8f4ff]'
          : 'bg-[#fce8f0]';
  const iconColor =
    channel === 'whatsapp'
      ? 'text-channel-green'
      : channel === 'messenger'
        ? 'text-[#1877F2]'
        : channel === 'email'
          ? 'text-channel-blue'
          : 'text-[#C13584]';
  const borderAccent =
    channel === 'whatsapp'
      ? 'border-channel-green/20'
      : channel === 'messenger'
        ? 'border-[#1877F2]/25'
        : channel === 'email'
          ? 'border-channel-blue/25'
          : 'border-[#E1306C]/25';
  const syncBtnClass =
    channel === 'messenger'
      ? 'text-[#1877F2] bg-[#e8f4ff] border-[#1877F2]/20 hover:bg-[#dbeafe]'
      : channel === 'instagram'
        ? 'text-[#C13584] bg-[#fce8f0] border-[#E1306C]/20 hover:bg-[#fad9e8]'
        : 'text-primary bg-sky-50 border-primary/20 hover:bg-primary/10';
  const manageBtnClass =
    channel === 'whatsapp'
      ? 'text-channel-green bg-[#e6f7ec] border-channel-green/20 hover:bg-[#d4f5df]'
      : 'text-channel-blue bg-[#e8f4ff] border-channel-blue/20 hover:bg-[#dbeafe]';
  const statusText =
    channel === 'email' ? 'Connected · Ready to send' : 'Connected · Inbox ready';
  const metaLine = [subtitle, detail].filter(Boolean).join(' · ');

  return (
    <article
      className={`bg-white rounded-xl border ${borderAccent} p-3.5 flex flex-col gap-2.5 h-full shadow-[0_1px_2px_rgba(0,0,0,0.04)]`}
    >
      <div className="flex items-start gap-2.5 min-w-0">
        {avatarUrl ? (
          <img
            src={avatarUrl}
            alt=""
            className="w-9 h-9 rounded-lg object-cover border border-slate-200 shrink-0"
          />
        ) : (
          <div
            className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${iconBg}`}
          >
            {channel === 'whatsapp' ? (
              <WhatsAppBrandIcon className={`w-4 h-4 ${iconColor}`} />
            ) : channel === 'messenger' ? (
              <Facebook className={`w-4 h-4 ${iconColor}`} />
            ) : channel === 'email' ? (
              <Mail className={`w-4 h-4 ${iconColor}`} />
            ) : (
              <Instagram className={`w-4 h-4 ${iconColor}`} />
            )}
          </div>
        )}

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5 min-w-0">
            <span className="text-[11px] font-black uppercase tracking-wide text-gray-500 truncate">
              {channelLabel}
            </span>
            <span className="shrink-0 inline-flex items-center text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full bg-accent-green-bg text-accent-green border border-accent-green/10">
              Live
            </span>
          </div>
          <p className="mt-0.5 text-sm font-bold text-gray-900 leading-snug truncate">{title}</p>
          {metaLine ? (
            <p className="mt-0.5 text-[11px] text-gray-500 leading-snug truncate" title={metaLine}>
              {metaLine}
            </p>
          ) : null}
        </div>

        <div className="flex items-center gap-0.5 shrink-0 -mt-0.5">
          {onManage ? (
            <button
              type="button"
              onClick={onManage}
              aria-label={`Manage ${title}`}
              className="p-1 rounded-md text-gray-400 hover:text-primary hover:bg-sky-50 transition-colors cursor-pointer"
            >
              <Settings className="w-3.5 h-3.5" />
            </button>
          ) : null}
          {onDisconnect ? (
            <button
              type="button"
              onClick={onDisconnect}
              disabled={disconnecting}
              aria-label={`Disconnect ${title}`}
              className="p-1 rounded-md text-gray-400 hover:text-danger-red hover:bg-red-50 transition-colors disabled:opacity-50 cursor-pointer"
            >
              {disconnecting ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Trash2 className="w-3.5 h-3.5" />
              )}
            </button>
          ) : null}
        </div>
      </div>

      <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide truncate">
          {statusText}
        </p>
        {(channel === 'email' || channel === 'whatsapp') && onManage ? (
          <button
            type="button"
            onClick={onManage}
            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold border transition-colors cursor-pointer shrink-0 ${manageBtnClass}`}
          >
            <Settings className="w-3 h-3" />
            Manage
          </button>
        ) : onSync ? (
          <button
            type="button"
            onClick={onSync}
            disabled={syncing || disconnecting}
            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold border disabled:opacity-50 transition-colors cursor-pointer shrink-0 ${syncBtnClass}`}
          >
            <RefreshCw className={`w-3 h-3 ${syncing ? 'animate-spin' : ''}`} />
            {syncing ? 'Syncing…' : 'Sync chats'}
          </button>
        ) : null}
      </div>
    </article>
  );
}

type IntegrationsViewProps = {
  isActive?: boolean;
};

export const IntegrationsView: FC<IntegrationsViewProps> = ({ isActive = true }) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [view, setView] = useState<ChannelView>(() =>
    channelViewFromSearch(window.location.search)
  );
  const [whatsappAccounts, setWhatsappAccounts] = useState<WhatsAppAccountSummary[]>([]);
  const [instagramAccounts, setInstagramAccounts] = useState<InstagramAccountSummary[]>([]);
  const [messengerAccounts, setMessengerAccounts] = useState<MessengerAccountSummary[]>([]);
  const [disconnectingKey, setDisconnectingKey] = useState<string | null>(null);
  const [instagramConnectError, setInstagramConnectError] = useState('');
  const [googleConnectError, setGoogleConnectError] = useState('');
  const [googleRefreshKey, setGoogleRefreshKey] = useState(0);
  const [messengerConnectError, setMessengerConnectError] = useState('');
  const [instagramAutoLaunch, setInstagramAutoLaunch] = useState(false);
  const [messengerAutoLaunch, setMessengerAutoLaunch] = useState(false);
  const [messengerSyncing, setMessengerSyncing] = useState(false);
  const [messengerSyncMessage, setMessengerSyncMessage] = useState('');
  const [instagramSyncing, setInstagramSyncing] = useState(false);
  const [instagramSyncMessage, setInstagramSyncMessage] = useState('');
  const [emailStatus, setEmailStatus] = useState<EmailIntegrationSummary>({
    connected: false,
    verifiedDomainCount: 0,
    defaultSenderEmail: 'noreply@convosync.io',
  });
  const [enablingEmail, setEnablingEmail] = useState(false);
  const [emailError, setEmailError] = useState('');

  const goToHub = useCallback(() => {
    setView('hub');
    const next = new URLSearchParams(searchParams);
    next.delete('channel');
    setSearchParams(next, { replace: true });
  }, [searchParams, setSearchParams]);

  const openEmailChannel = useCallback(() => {
    setView('email');
    const next = new URLSearchParams(searchParams);
    next.set('channel', 'email');
    setSearchParams(next, { replace: true });
  }, [searchParams, setSearchParams]);

  const openGoogleChannel = useCallback(() => {
    setView('google');
    const next = new URLSearchParams(searchParams);
    next.set('channel', 'google');
    setSearchParams(next, { replace: true });
  }, [searchParams, setSearchParams]);

  const openWhatsappChannel = useCallback(() => {
    setView('whatsapp');
    const next = new URLSearchParams(searchParams);
    next.set('channel', 'whatsapp');
    setSearchParams(next, { replace: true });
  }, [searchParams, setSearchParams]);

  const loadWhatsappAccounts = useCallback(() => {
    if (!localStorage.getItem('convosync_token')) return Promise.resolve();
    return api
      .getWhatsAppAccounts()
      .then((data: { accounts?: WhatsAppAccountSummary[] }) => {
        setWhatsappAccounts(data.accounts ?? []);
      })
      .catch(console.error);
  }, []);

  const loadInstagramAccounts = useCallback(() => {
    if (!localStorage.getItem('convosync_token')) return Promise.resolve();
    return api
      .getInstagramAccounts()
      .then((data: { accounts?: InstagramAccountSummary[] }) => {
        setInstagramAccounts(data.accounts ?? []);
      })
      .catch(console.error);
  }, []);

  const loadMessengerAccounts = useCallback(() => {
    if (!localStorage.getItem('convosync_token')) return Promise.resolve();
    return api
      .getMessengerAccounts()
      .then((data: { accounts?: MessengerAccountSummary[] }) => {
        setMessengerAccounts(data.accounts ?? []);
      })
      .catch(console.error);
  }, []);

  const loadEmailStatus = useCallback(() => {
    if (!localStorage.getItem('convosync_token')) return Promise.resolve();
    return api
      .getEmailIntegration()
      .then((res: {
        enabled?: boolean;
        defaultSenderEmail?: string;
        defaultSenderName?: string;
        verifiedDomainCount?: number;
        providerLabel?: string | null;
      }) => {
        setEmailStatus({
          connected: Boolean(res.enabled),
          defaultSenderEmail: res.defaultSenderEmail ?? 'noreply@convosync.io',
          defaultSenderName: res.defaultSenderName ?? undefined,
          verifiedDomainCount: res.verifiedDomainCount ?? 0,
          providerLabel: res.providerLabel ?? undefined,
        });
      })
      .catch(console.error);
  }, []);

  const handleEnableEmail = useCallback(async () => {
    setEnablingEmail(true);
    setEmailError('');
    try {
      await api.enableEmailIntegration();
      await loadEmailStatus();
      openEmailChannel();
    } catch (err) {
      setEmailError(err instanceof Error ? err.message : 'Failed to enable email');
    } finally {
      setEnablingEmail(false);
    }
  }, [loadEmailStatus, openEmailChannel]);

  const handleEmailDisconnect = useCallback(async () => {
    if (
      !window.confirm(
        'Remove email integration? Custom domains, senders, and provider settings will be deleted. Delivery logs and templates are kept.'
      )
    ) {
      return;
    }
    setDisconnectingKey('email');
    setEmailError('');
    try {
      await api.disableEmailIntegration();
      await loadEmailStatus();
      setView('hub');
    } catch (err) {
      setEmailError(err instanceof Error ? err.message : 'Failed to remove email integration');
    } finally {
      setDisconnectingKey(null);
    }
  }, [loadEmailStatus]);

  useEffect(() => {
    if (!isActive) return;
    loadWhatsappAccounts();
    loadInstagramAccounts();
    loadMessengerAccounts();
    loadEmailStatus();
  }, [isActive, loadWhatsappAccounts, loadInstagramAccounts, loadMessengerAccounts, loadEmailStatus]);

  useEffect(() => {
    if (!isActive || view !== 'hub') return;
    void loadEmailStatus();
  }, [isActive, view, loadEmailStatus]);

  useEffect(() => {
    if (!isActive) return;
    if (searchParams.get('channel') === 'email') {
      setView('email');
    }
    if (searchParams.get('channel') === 'google') {
      setView('google');
    }
    if (searchParams.get('channel') === 'whatsapp') {
      setView('whatsapp');
    }
    if (searchParams.get('whatsapp_connected') === '1') {
      void loadWhatsappAccounts();
      setView('whatsapp');
      const next = new URLSearchParams(searchParams);
      next.delete('whatsapp_connected');
      if (!next.get('channel')) next.set('channel', 'whatsapp');
      setSearchParams(next, { replace: true });
    }
    if (searchParams.get('whatsapp_error') === '1') {
      setView('whatsapp');
      const next = new URLSearchParams(searchParams);
      next.delete('whatsapp_error');
      if (!next.get('channel')) next.set('channel', 'whatsapp');
      setSearchParams(next, { replace: true });
    }
    if (searchParams.get('instagram_connected') === '1') {
      void loadInstagramAccounts();
      setView('hub');
      setInstagramConnectError('');
      const next = new URLSearchParams(searchParams);
      next.delete('instagram_connected');
      setSearchParams(next, { replace: true });
    }
    if (searchParams.get('instagram_error') === '1') {
      setInstagramConnectError('Instagram connection failed. Please try again.');
      setView('instagram');
      const next = new URLSearchParams(searchParams);
      next.delete('instagram_error');
      setSearchParams(next, { replace: true });
    }
    if (searchParams.get('messenger_connected') === '1') {
      void loadMessengerAccounts();
      setView('hub');
      setMessengerConnectError('');
      const next = new URLSearchParams(searchParams);
      next.delete('messenger_connected');
      setSearchParams(next, { replace: true });
    }
    if (searchParams.get('messenger_error') === '1') {
      setMessengerConnectError('Messenger connection failed. Please try again.');
      setView('messenger');
      const next = new URLSearchParams(searchParams);
      next.delete('messenger_error');
      setSearchParams(next, { replace: true });
    }
    if (searchParams.get('google_connected') === '1') {
      setView('google');
      setGoogleConnectError('');
      setGoogleRefreshKey((k) => k + 1);
      const next = new URLSearchParams(searchParams);
      next.delete('google_connected');
      setSearchParams(next, { replace: true });
    }
    if (searchParams.get('google_error') === '1') {
      setGoogleConnectError('Google connection failed. Please try again.');
      setView('google');
      const next = new URLSearchParams(searchParams);
      next.delete('google_error');
      setSearchParams(next, { replace: true });
    }
  }, [
    isActive,
    loadInstagramAccounts,
    loadMessengerAccounts,
    loadWhatsappAccounts,
    searchParams,
    setSearchParams,
  ]);

  const handleInstagramDisconnect = async (instagramUserId: string) => {
    setDisconnectingKey(`ig:${instagramUserId}`);
    try {
      await api.disconnectInstagram(instagramUserId);
      await loadInstagramAccounts();
    } catch (err) {
      console.error(err);
    } finally {
      setDisconnectingKey(null);
    }
  };

  const handleInstagramConnect = () => {
    setInstagramConnectError('');
    setInstagramAutoLaunch(true);
    setView('instagram');
  };

  const handleInstagramConnectSuccess = async () => {
    setInstagramConnectError('');
    setInstagramAutoLaunch(false);
    await loadInstagramAccounts();
    setView('hub');
  };

  const handleMessengerDisconnect = async (pageId: string) => {
    setDisconnectingKey(`fb:${pageId}`);
    try {
      await api.disconnectMessenger(pageId);
      await loadMessengerAccounts();
    } catch (err) {
      console.error(err);
    } finally {
      setDisconnectingKey(null);
    }
  };

  const handleMessengerConnect = () => {
    setMessengerConnectError('');
    if (instagramAccounts.length === 0) {
      setMessengerConnectError(
        'Connect Instagram first. Messenger uses the same Meta Page access token.'
      );
      return;
    }
    setMessengerAutoLaunch(true);
    setView('messenger');
  };

  const handleMessengerConnectSuccess = async () => {
    setMessengerConnectError('');
    setMessengerAutoLaunch(false);
    await loadMessengerAccounts();
    setView('hub');
  };

  const handleMessengerSync = async () => {
    setMessengerSyncMessage('');
    setMessengerSyncing(true);
    try {
      const res = await api.syncMessengerInbox();
      setMessengerSyncMessage(
        res.message || 'Messenger sync started. Check Inbox in a few moments.'
      );
    } catch (err) {
      setMessengerSyncMessage(
        err instanceof Error ? err.message : 'Failed to start Messenger sync'
      );
    } finally {
      setMessengerSyncing(false);
    }
  };

  const handleInstagramSync = async () => {
    setInstagramSyncMessage('');
    setInstagramSyncing(true);
    try {
      const res = await api.syncInstagramInbox();
      setInstagramSyncMessage(
        res.message || 'Instagram sync started. Check Inbox in a few moments.'
      );
    } catch (err) {
      setInstagramSyncMessage(
        err instanceof Error ? err.message : 'Failed to start Instagram sync'
      );
    } finally {
      setInstagramSyncing(false);
    }
  };

  if (view === 'messenger') {
    return (
      <div className="w-full pb-12 space-y-6 animate-scale-up max-w-3xl">
        <button
          type="button"
          onClick={() => {
            setView('hub');
            setMessengerAutoLaunch(false);
            setMessengerConnectError('');
          }}
          className="inline-flex items-center gap-1.5 text-sm font-bold text-gray-500 hover:text-primary transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to integrations
        </button>

        <MessengerConnectPanel
          hasInstagram={instagramAccounts.length > 0}
          autoStart={messengerAutoLaunch}
          onAutoStartConsumed={() => setMessengerAutoLaunch(false)}
          onSuccess={() => void handleMessengerConnectSuccess()}
          onError={(error) => setMessengerConnectError(error)}
        />

        {messengerConnectError && (
          <p className="text-sm font-bold text-red-500">{messengerConnectError}</p>
        )}
      </div>
    );
  }

  if (view === 'instagram') {
    return (
      <div className="w-full pb-12 space-y-6 animate-scale-up max-w-3xl">
        <button
          type="button"
          onClick={() => {
            setView('hub');
            setInstagramAutoLaunch(false);
            setInstagramConnectError('');
          }}
          className="inline-flex items-center gap-1.5 text-sm font-bold text-gray-500 hover:text-primary transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to integrations
        </button>

        <InstagramConnectPanel
          autoStart={instagramAutoLaunch}
          onAutoStartConsumed={() => setInstagramAutoLaunch(false)}
          onSuccess={() => void handleInstagramConnectSuccess()}
          onError={(error) => setInstagramConnectError(error)}
        />

        {instagramConnectError && (
          <p className="text-sm font-bold text-red-500">{instagramConnectError}</p>
        )}
      </div>
    );
  }

  if (view === 'email') {
    const defaultEmail = emailStatus.defaultSenderEmail ?? 'noreply@convosync.io';

    if (!emailStatus.connected) {
      return (
        <div className="w-full pb-12 space-y-6 animate-scale-up max-w-lg">
          <button
            type="button"
            onClick={goToHub}
            className="inline-flex items-center gap-1.5 text-sm font-bold text-gray-500 hover:text-primary transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to integrations
          </button>

          <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-[#e8f4ff] text-channel-blue flex items-center justify-center">
                <Mail className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-black text-gray-950">Enable Email</h2>
                <p className="text-xs text-gray-500 font-medium mt-0.5">
                  Turn on outbound email for this workspace.
                </p>
              </div>
            </div>

            <p className="text-sm text-gray-600 leading-relaxed">
              Default sender will be{' '}
              <span className="font-mono font-bold text-gray-900">{defaultEmail}</span>. You can add
              custom domains and senders after enabling.
            </p>

            {emailError && (
              <p className="text-sm font-bold text-red-600 bg-red-50 border border-red-100 rounded-xl px-4 py-2">
                {emailError}
              </p>
            )}

            <button
              type="button"
              disabled={enablingEmail}
              onClick={() => void handleEnableEmail()}
              className="w-full px-4 py-2.5 bg-gray-900 hover:bg-gray-800 disabled:opacity-60 text-white text-sm font-bold rounded-xl transition-all"
            >
              {enablingEmail ? 'Enabling…' : 'Enable Email'}
            </button>
          </div>
        </div>
      );
    }

    return (
      <div className="w-full pb-12 space-y-6 animate-scale-up max-w-6xl">
        <button
          type="button"
          onClick={goToHub}
          className="inline-flex items-center gap-1.5 text-sm font-bold text-gray-500 hover:text-primary transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to integrations
        </button>

        <header className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div>
            <h2 className="text-xl font-black text-gray-950">Email</h2>
            <p className="text-xs text-gray-500 font-medium mt-1">
              Verify domains, manage sender addresses, and send transactional email from{' '}
              {defaultEmail} or your own domain.
            </p>
          </div>
          <button
            type="button"
            disabled={disconnectingKey === 'email'}
            onClick={() => void handleEmailDisconnect()}
            className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl border border-red-200 text-sm font-bold text-danger-red hover:bg-red-50 disabled:opacity-50 transition-colors shrink-0"
          >
            {disconnectingKey === 'email' ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Trash2 className="w-4 h-4" />
            )}
            Remove integration
          </button>
        </header>

        {emailError && (
          <p className="text-sm font-bold text-red-600 bg-red-50 border border-red-100 rounded-xl px-4 py-2">
            {emailError}
          </p>
        )}

        <EmailPanel />
      </div>
    );
  }

  if (view === 'google') {
    return (
      <div className="w-full pb-12 space-y-6 animate-scale-up max-w-6xl">
        <button
          type="button"
          onClick={goToHub}
          className="inline-flex items-center gap-1.5 text-sm font-bold text-gray-500 hover:text-primary transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to integrations
        </button>

        <header>
          <h2 className="text-xl font-black text-gray-950">Google</h2>
          <p className="text-xs text-gray-500 font-medium mt-1">
            Connect Calendar, Business Profile, Sheets, Drive, Gmail, and Meet with shared OAuth — ready for journeys and AI agents.
          </p>
        </header>

        {googleConnectError && (
          <p className="text-sm font-bold text-red-600 bg-red-50 border border-red-100 rounded-xl px-4 py-2">
            {googleConnectError}
          </p>
        )}

        <GooglePanel key={googleRefreshKey} />
      </div>
    );
  }

  if (view === 'sms' || view === 'voice') {
    const channel = COMING_SOON_CHANNELS[view];
    return (
      <div className="w-full pb-12 space-y-6 animate-scale-up max-w-lg">
        <button
          type="button"
          onClick={goToHub}
          className="inline-flex items-center gap-1.5 text-sm font-bold text-gray-500 hover:text-primary transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to integrations
        </button>
        <div className="bg-white border border-slate-200 rounded-2xl p-6 text-center space-y-3">
          <h3 className="text-lg font-black text-gray-950">{channel.title}</h3>
          <p className="text-sm text-gray-500 font-medium">{channel.description}</p>
          <span className="inline-block text-sm font-black uppercase tracking-wider px-3 py-1 rounded-full bg-[#f3eeff] text-primary">
            Coming soon
          </span>
        </div>
      </div>
    );
  }

  if (view === 'whatsapp') {
    return (
      <div className="w-full pb-12 space-y-6 animate-scale-up">
        <ManagerView
          isActive={isActive}
          variant="integrations"
          onBackToHub={goToHub}
          onAccountsChanged={() => void loadWhatsappAccounts()}
        />
      </div>
    );
  }

  const whatsappConnected = whatsappAccounts.length > 0;
  const instagramConnected = instagramAccounts.length > 0;
  const messengerConnected = messengerAccounts.length > 0;
  const emailConnected = emailStatus.connected;
  const hasConnectedChannels =
    whatsappConnected || instagramConnected || emailConnected;

  return (
    <div className="w-full space-y-5 pb-8 animate-scale-up">
      {/* {messengerSyncMessage && (
        <p className="text-sm font-bold text-[#1877F2] bg-[#e8f4ff] border border-[#1877F2]/15 rounded-xl px-4 py-2">
          {messengerSyncMessage}
        </p>
      )} */}

      {emailError && (
        <p className="text-sm font-bold text-red-600 bg-red-50 border border-red-100 rounded-xl px-4 py-2">
          {emailError}
        </p>
      )}

      {instagramSyncMessage && (
        <p className="text-sm font-bold text-[#C13584] bg-[#fce8f0] border border-[#E1306C]/15 rounded-xl px-4 py-2">
          {instagramSyncMessage}
        </p>
      )}

      {hasConnectedChannels && (
        <section>
          <h3 className="text-sm font-black text-gray-950 mb-3">Connected channels</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
            {whatsappAccounts.map((account) => {
              const title = account.label || account.displayName || 'WhatsApp Business';
              const phone = account.phoneNumber || account.phoneNumberId;
              return (
                <ConnectedChannelCard
                  key={account.id}
                  channel="whatsapp"
                  channelLabel="WhatsApp"
                  title={title}
                  subtitle={phone}
                  detail={account.wabaId ? `WABA · ${account.wabaId}` : undefined}
                  onManage={openWhatsappChannel}
                />
              );
            })}

            {instagramAccounts.map((account) => {
              const title =
                account.label ||
                (account.username ? `@${account.username}` : account.displayName || 'Instagram');
              return (
                <ConnectedChannelCard
                  key={account.id}
                  channel="instagram"
                  channelLabel="Instagram"
                  title={title}
                  subtitle={account.pageName ? `Page · ${account.pageName}` : 'Instagram DMs'}
                  detail={account.username ? `@${account.username}` : undefined}
                  avatarUrl={account.profilePicture}
                  disconnecting={disconnectingKey === `ig:${account.instagramUserId}`}
                  onDisconnect={() => void handleInstagramDisconnect(account.instagramUserId)}
                  onSync={() => void handleInstagramSync()}
                  syncing={instagramSyncing}
                />
              );
            })}

            {/* Messenger — hidden for now
            {messengerAccounts.map((account) => {
              const title = account.label || account.displayName || account.pageName || 'Messenger';
              return (
                <ConnectedChannelCard
                  key={account.id}
                  channel="messenger"
                  channelLabel="Messenger"
                  title={title}
                  subtitle={account.pageName ? `Page · ${account.pageName}` : 'Facebook Page'}
                  disconnecting={disconnectingKey === `fb:${account.pageId}`}
                  onDisconnect={() => void handleMessengerDisconnect(account.pageId)}
                  onSync={() => void handleMessengerSync()}
                  syncing={messengerSyncing}
                />
              );
            })}
            */}

            {emailConnected && (
              <ConnectedChannelCard
                channel="email"
                channelLabel="Email"
                title={emailStatus.defaultSenderName || 'Email sending'}
                subtitle={emailStatus.defaultSenderEmail || 'Sender configured'}
                detail={
                  emailStatus.verifiedDomainCount > 0
                    ? `${emailStatus.verifiedDomainCount} verified domain${emailStatus.verifiedDomainCount === 1 ? '' : 's'}`
                    : emailStatus.providerLabel
                      ? `Provider · ${emailStatus.providerLabel.replace(/_/g, ' ')}`
                      : undefined
                }
                onManage={openEmailChannel}
                onDisconnect={() => void handleEmailDisconnect()}
                disconnecting={disconnectingKey === 'email'}
              />
            )}
          </div>
        </section>
      )}

      <section>
        <h3 className="text-sm font-black text-gray-950 mb-3">Add a channel</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {!whatsappConnected && (
            <IntegrationCard
              title="WhatsApp"
              description="Connect WhatsApp Business API or Business App for inbox, templates, broadcasts, and customer support."
              icon={WhatsAppBrandIcon}
              iconBgClass="bg-[#e6f7ec]"
              iconClass="text-channel-green"
              onConnect={openWhatsappChannel}
            />
          )}

          {/* Facebook Messenger — hidden for now
          {!messengerConnected && instagramConnected && (
            <IntegrationCard
              title="Facebook Messenger"
              description="Enable Messenger using your connected Instagram Page token — no extra Meta login."
              icon={Facebook}
              iconBgClass="bg-[#e8f4ff]"
              iconClass="text-channel-blue"
              onConnect={handleMessengerConnect}
            />
          )}
          */}

          {!instagramConnected && (
            <IntegrationCard
              title="Instagram"
              description="Connect Instagram DMs to your inbox. Requires a linked Facebook Page and Instagram Business account."
              icon={Instagram}
              iconBgClass="bg-[#fce8f0]"
              iconClass="text-channel-pink"
              onConnect={handleInstagramConnect}
            />
          )}

          {/* SMS — hidden for now
          <IntegrationCard
            title="SMS"
            description="Send text messages to customers worldwide. Reach users on any device with global SMS delivery."
            icon={MessageSquare}
            iconBgClass="bg-[#fff8e6]"
            iconClass="text-amber-500"
            onConnect={() => setView('sms')}
          />
          */}

          {!emailConnected && (
            <IntegrationCard
              title="Email"
              description={`Send transactional and marketing email. Enable to use the shared sender ${emailStatus.defaultSenderEmail ?? 'noreply@convosync.io'} or add your own domain later.`}
              icon={Mail}
              iconBgClass="bg-[#e8f4ff]"
              iconClass="text-channel-blue"
              connectLabel={enablingEmail ? 'Enabling…' : 'Enable'}
              connectDisabled={enablingEmail}
              onConnect={() => void handleEnableEmail()}
            />
          )}

          {/* Voice code — hidden for now
          <IntegrationCard
            title="Voice code"
            description="Verification method for delivering one-time passwords via automated phone calls to users."
            icon={Phone}
            iconBgClass="bg-[#f3eeff]"
            iconClass="text-primary"
            onConnect={() => setView('voice')}
          />
          */}
        </div>
      </section>

      {/* Google — hidden for now
      <section>
        <h3 className="text-sm font-black text-gray-950 mb-4">Google</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <IntegrationCard
            title="Google Workspace"
            description="Calendar, Business Profile, Sheets, Drive, Gmail, and Meet — one OAuth framework for journeys and AI."
            icon={LayoutGrid}
            iconBgClass="bg-[#e8f4ff]"
            iconClass="text-[#4285F4]"
            onConnect={openGoogleChannel}
          />
        </div>
      </section>
      */}

      {/* Tools — hidden for now
      <section>
        <h3 className="text-sm font-black text-gray-950 mb-4">Tools</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <IntegrationCard
            title="HubSpot"
            description="Sync contacts and conversations with HubSpot CRM for sales and support workflows."
            icon={Link2}
            iconBgClass="bg-[#fff0ed]"
            iconClass="text-orange-600"
            connectDisabled
            onConnect={() => {}}
          />

          <IntegrationCard
            title="Data connectors"
            description="Connect databases and data warehouses to sync customer data into ConvoSync."
            icon={Database}
            iconBgClass="bg-[#e8f4ff]"
            iconClass="text-channel-blue"
            connectDisabled
            onConnect={() => {}}
          />

          <IntegrationCard
            title="Shopify"
            description="Connect your Shopify store to send order updates and cart recovery messages."
            icon={ShoppingBag}
            iconBgClass="bg-[#e6f7ec]"
            iconClass="text-channel-green"
            connectDisabled
            onConnect={() => {}}
          />

          <IntegrationCard
            title="WhatsApp MM Lite API"
            description="Lightweight WhatsApp messaging API for high-volume marketing and notification use cases."
            icon={Link2}
            iconBgClass="bg-[#f3eeff]"
            iconClass="text-primary"
            connectDisabled
            onConnect={() => {}}
          />

          <IntegrationCard
            title="Coupons"
            description="Generate and deliver coupon codes automatically through chat campaigns and journeys."
            icon={Ticket}
            iconBgClass="bg-[#fce8f0]"
            iconClass="text-channel-pink"
            connectDisabled
            onConnect={() => {}}
          />
        </div>
      </section>
      */}
    </div>
  );
};
