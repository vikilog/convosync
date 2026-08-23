/**
 * Slow-changing Inbox assignee / channel metadata via React Query.
 * Shared query keys so other screens can reuse without duplicate fetches.
 */
import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api, getUserId, getUserName } from '../../lib/api';
import { useJourneys } from '../../modules/journey/hooks/useJourneys';
import { useIgJourneys } from '../../modules/instagram-automation/hooks/useIgJourneys';

const META_STALE_MS = 60_000;
const ME_STALE_MS = 5 * 60_000;

export type InboxNamedOption = { id: string; name: string };

export type WhatsAppInboxAccount = {
  phoneNumberId: string;
  phoneNumber?: string;
  displayName?: string;
  label?: string;
};

export function useMe() {
  return useQuery({
    queryKey: ['me'],
    queryFn: () => api.getMe() as Promise<{ id: string; name: string }>,
    staleTime: ME_STALE_MS,
    refetchOnWindowFocus: true,
  });
}

export function useTeam() {
  return useQuery({
    queryKey: ['team'],
    queryFn: () => api.getTeamStats() as Promise<Array<{ id: string; name: string }>>,
    staleTime: META_STALE_MS,
    refetchOnWindowFocus: true,
  });
}

export function useAgents() {
  return useQuery({
    queryKey: ['agents'],
    queryFn: async () => {
      const raw = await api.getAgents().catch(() => []);
      return (Array.isArray(raw) ? raw : []) as Array<Record<string, unknown>>;
    },
    staleTime: META_STALE_MS,
    refetchOnWindowFocus: true,
  });
}

export function useWhatsAppAccounts() {
  return useQuery({
    queryKey: ['whatsapp-accounts'],
    queryFn: async () => {
      const data = (await api.getWhatsAppAccounts().catch(() => ({ accounts: [] }))) as {
        accounts?: Array<{
          phoneNumberId?: string;
          label?: string;
          displayName?: string;
          phoneNumber?: string;
        }>;
      };
      return (data.accounts ?? [])
        .filter((a): a is typeof a & { phoneNumberId: string } => Boolean(a.phoneNumberId))
        .map((a) => ({
          phoneNumberId: a.phoneNumberId,
          phoneNumber: a.phoneNumber,
          displayName: a.displayName,
          label: a.label,
        })) satisfies WhatsAppInboxAccount[];
    },
    staleTime: META_STALE_MS,
    refetchOnWindowFocus: true,
  });
}

export function useInstagramAccounts() {
  return useQuery({
    queryKey: ['instagram-accounts'],
    queryFn: async () => {
      const data = (await api.getInstagramAccounts().catch(() => ({ accounts: [] }))) as {
        accounts?: Array<{ label?: string; username?: string }>;
      };
      return data.accounts ?? [];
    },
    staleTime: META_STALE_MS,
    refetchOnWindowFocus: true,
  });
}

export function useMessengerAccounts() {
  return useQuery({
    queryKey: ['messenger-accounts'],
    queryFn: async () => {
      const data = (await api.getMessengerAccounts().catch(() => ({ accounts: [] }))) as {
        accounts?: Array<{ label?: string; displayName?: string; pageName?: string }>;
      };
      return data.accounts ?? [];
    },
    staleTime: META_STALE_MS,
    refetchOnWindowFocus: true,
  });
}

export function useTelegramAccounts() {
  return useQuery({
    queryKey: ['telegram-accounts'],
    queryFn: async () => {
      const data = (await api.getTelegramAccounts().catch(() => ({ accounts: [] }))) as {
        accounts?: Array<{ botId?: string; botUsername?: string; botName?: string; label?: string }>;
      };
      return data.accounts ?? [];
    },
    staleTime: META_STALE_MS,
    refetchOnWindowFocus: true,
  });
}

export function useFacebookPageConnection() {
  return useQuery({
    queryKey: ['facebook-page-connection'],
    queryFn: async () => {
      const data = (await api.getFacebookPage().catch(() => ({ connected: false }))) as {
        connected: boolean;
        page?: { name?: string };
      };
      return { connected: Boolean(data.connected), pageName: data.page?.name ?? null };
    },
    staleTime: META_STALE_MS,
    refetchOnWindowFocus: true,
  });
}

export function useEmailIntegration() {
  return useQuery({
    queryKey: ['email-integration'],
    queryFn: async () => {
      // Backend `/email/integration` returns `{ enabled }` (emailIntegrationEnabled
      // or legacy heal when a provider/domain exists — includes BYO AWS_SES).
      // IntegrationsView already maps enabled → connected; match that here.
      const data = (await api.getEmailIntegration().catch(() => ({ enabled: false }))) as {
        enabled?: boolean;
      };
      return { connected: Boolean(data.enabled) };
    },
    staleTime: META_STALE_MS,
    refetchOnWindowFocus: true,
  });
}

/** Derived Inbox assignee lists + channel labels from cached queries. */
export function useInboxAssigneeMeta() {
  const me = useMe();
  const team = useTeam();
  const agents = useAgents();
  const journeys = useJourneys();
  const igJourneys = useIgJourneys();
  const wa = useWhatsAppAccounts();
  const ig = useInstagramAccounts();
  const messenger = useMessengerAccounts();
  const telegram = useTelegramAccounts();
  const email = useEmailIntegration();
  const facebookPage = useFacebookPageConnection();

  const teamAgents = useMemo<InboxNamedOption[]>(
    () => (team.data ?? []).map((a) => ({ id: a.id, name: a.name })),
    [team.data]
  );

  const aiAgents = useMemo<InboxNamedOption[]>(
    () =>
      (agents.data ?? [])
        .filter(
          (a) =>
            (a.category === 'ai_agent' || a.category === 'responsive') &&
            a.isPublished === true &&
            a.isEnabled !== false &&
            typeof a.id === 'string' &&
            typeof a.name === 'string'
        )
        .map((a) => ({ id: String(a.id), name: String(a.name) })),
    [agents.data]
  );

  const ruleBasedBots = useMemo<InboxNamedOption[]>(
    () =>
      (agents.data ?? [])
        .filter(
          (a) =>
            a.category === 'rule_based' &&
            a.isEnabled !== false &&
            typeof a.id === 'string' &&
            typeof a.name === 'string'
        )
        .map((a) => ({ id: String(a.id), name: String(a.name) })),
    [agents.data]
  );

  /** WhatsApp Automation (Journey) — for WhatsApp inbox only. */
  const publishedWhatsAppJourneys = useMemo<InboxNamedOption[]>(
    () =>
      (journeys.data ?? [])
        .filter((j) => j.status === 'published')
        .map((j) => ({ id: j.id, name: j.name })),
    [journeys.data]
  );

  /** Instagram Automation — for Instagram inbox only. */
  const publishedInstagramJourneys = useMemo<InboxNamedOption[]>(
    () =>
      (igJourneys.data ?? [])
        .filter((j) => j.status === 'published')
        .map((j) => ({ id: j.id, name: j.name })),
    [igJourneys.data]
  );

  /** @deprecated Prefer channel-specific lists — kept as WA alias for older callers. */
  const publishedJourneys = publishedWhatsAppJourneys;

  const whatsappAccounts = wa.data ?? [];

  const igList = ig.data ?? [];
  const instagramConnected = igList.length > 0;
  const instagramInboxLabel = instagramConnected
    ? igList[0].label || (igList[0].username ? `@${igList[0].username}` : 'Instagram')
    : null;

  const fbList = messenger.data ?? [];
  const messengerConnected = fbList.length > 0;
  const messengerInboxLabel = messengerConnected
    ? fbList[0].label || fbList[0].displayName || fbList[0].pageName || 'Messenger'
    : null;

  const tgList = telegram.data ?? [];
  const telegramConnected = tgList.length > 0;
  const telegramInboxLabel = telegramConnected
    ? tgList[0].label || (tgList[0].botUsername ? `@${tgList[0].botUsername}` : 'Telegram')
    : null;

  const emailConnected = email.data?.connected === true;
  const facebookPageConnected = facebookPage.data?.connected === true;
  const facebookPageInboxLabel = facebookPageConnected
    ? facebookPage.data?.pageName || 'Facebook Page'
    : null;

  return {
    currentUserId: me.data?.id || getUserId() || '',
    currentUserName: me.data?.name || getUserName() || '',
    teamAgents,
    aiAgents,
    ruleBasedBots,
    publishedJourneys,
    publishedWhatsAppJourneys,
    publishedInstagramJourneys,
    whatsappAccounts,
    instagramConnected,
    instagramInboxLabel,
    messengerConnected,
    messengerInboxLabel,
    telegramConnected,
    telegramInboxLabel,
    emailConnected,
    facebookPageConnected,
    facebookPageInboxLabel,
    /** True once WA / IG / Messenger / Telegram / Email / Facebook Page queries have settled. */
    channelsReady:
      wa.isFetched &&
      ig.isFetched &&
      messenger.isFetched &&
      telegram.isFetched &&
      email.isFetched &&
      facebookPage.isFetched,
  };
}
