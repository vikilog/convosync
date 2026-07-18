/**
 * Slow-changing Inbox assignee / channel metadata via React Query.
 * Shared query keys so other screens can reuse without duplicate fetches.
 */
import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api, getUserId, getUserName } from '../../lib/api';
import { useJourneys } from '../../modules/journey/hooks/useJourneys';

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

/** Derived Inbox assignee lists + channel labels from cached queries. */
export function useInboxAssigneeMeta() {
  const me = useMe();
  const team = useTeam();
  const agents = useAgents();
  const journeys = useJourneys();
  const wa = useWhatsAppAccounts();
  const ig = useInstagramAccounts();
  const messenger = useMessengerAccounts();

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

  const publishedJourneys = useMemo<InboxNamedOption[]>(
    () =>
      (journeys.data ?? [])
        .filter((j) => j.status === 'published')
        .map((j) => ({ id: j.id, name: j.name })),
    [journeys.data]
  );

  const whatsappAccounts = wa.data ?? [];

  const igList = ig.data ?? [];
  const instagramConnected = igList.length > 0;
  const instagramInboxLabel = instagramConnected
    ? igList[0].label || (igList[0].username ? `@${igList[0].username}` : 'Instagram')
    : null;

  const fbList = messenger.data ?? [];
  const messengerInboxLabel =
    fbList.length > 0
      ? fbList[0].label || fbList[0].displayName || fbList[0].pageName || 'Messenger'
      : null;

  return {
    currentUserId: me.data?.id || getUserId() || '',
    currentUserName: me.data?.name || getUserName() || '',
    teamAgents,
    aiAgents,
    ruleBasedBots,
    publishedJourneys,
    whatsappAccounts,
    instagramConnected,
    instagramInboxLabel,
    messengerInboxLabel,
  };
}
