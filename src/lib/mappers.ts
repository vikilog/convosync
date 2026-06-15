import { parseAgentActions } from '../components/ai-agent/profile/parseAgentActions';
import type {
  AgentBot,
  AgentFlowDefinition,
  CampaignRecord,
  CampaignRecordStatus,
  CampaignDetail,
  CampaignInsights,
  CampaignRecipientInsight,
  CampaignTemplate,
  EmailTemplateRecord,
  ChatMessage,
  Contact,
  QuickCampaign,
  Segment,
  TeamMember,
} from '../types';
import { statusSlugToUi } from './templateLabels';
import { formatInboxListTime, formatMessageTime } from './formatDates';

const SEGMENT_ICONS: Record<string, string> = {
  all: 'users',
  hot_leads: 'flame',
  students: 'graduation-cap',
};

function formatRelativeTime(date: Date | string | null | undefined): string {
  if (!date) return '—';
  const d = typeof date === 'string' ? new Date(date) : date;
  const diff = Date.now() - d.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

function capitalizeStatus(status: string): 'Open' | 'Pending' | 'Resolved' {
  const s = status.toLowerCase();
  if (s === 'pending') return 'Pending';
  if (s === 'resolved') return 'Resolved';
  return 'Open';
}

function assigneeDisplayFromConv(conv?: Record<string, unknown>): string {
  const type = conv?.assigneeType as string | null | undefined;
  if (!type) {
    return (conv?.agent as { name?: string })?.name || 'Unassigned';
  }
  switch (type) {
    case 'ai':
      return 'AI Copilot';
    case 'rule_based':
      return 'Rule-based bot';
    case 'journey':
      return 'Journey';
    case 'user':
      return (conv?.agent as { name?: string })?.name || 'Team member';
    default:
      return 'Unassigned';
  }
}

function parseInstagramYesNo(value: string | undefined): boolean | undefined {
  if (value === 'yes') return true;
  if (value === 'no') return false;
  return undefined;
}

function formatInstagramCount(value: string | undefined): string | undefined {
  if (!value) return undefined;
  const n = Number(value);
  if (Number.isNaN(n)) return value;
  return n.toLocaleString('en-IN');
}

export function mapContactFromApi(raw: Record<string, unknown>, conv?: Record<string, unknown>): Contact {
  const customFields = (raw.customFields as Record<string, string>) || {};
  const source = String(raw.source ?? '—');
  const channel =
    conv?.channel === 'instagram' || source === 'Instagram'
      ? 'instagram'
      : conv?.channel === 'messenger' || source === 'Messenger'
        ? 'messenger'
        : 'whatsapp';
  const phone = String(raw.phone);
  const instagramUsername = customFields.instagramUsername;
  const handle =
    channel === 'instagram'
      ? instagramUsername
        ? `@${instagramUsername}`
        : phone.startsWith('ig:')
          ? `Instagram user ${phone.slice(3, 9)}…`
          : phone
      : channel === 'messenger'
        ? phone.startsWith('fb:')
          ? `Messenger user ${phone.slice(3, 9)}…`
          : phone
        : phone;

  return {
    id: String(raw.id),
    name: String(raw.name),
    email: raw.email ? String(raw.email) : undefined,
    phone,
    phoneRaw: phone.replace(/\D/g, ''),
    avatar: raw.avatar as string | undefined,
    lastActive: formatInboxListTime((conv?.lastMessageAt as string) || (raw.updatedAt as string)),
    unreadCount: Number(conv?.unreadCount ?? 0),
    lastMessage: String(conv?.lastMessage ?? ''),
    status: capitalizeStatus(String(conv?.status ?? 'open')),
    assignedAgent: assigneeDisplayFromConv(conv),
    source,
    channel,
    channelAccountId: conv?.channelAccountId ? String(conv.channelAccountId) : null,
    handle,
    courseInterest: String(customFields.courseInterest ?? '—'),
    location: String(customFields.location ?? '—'),
    tags: (raw.tags as string[]) || [],
    instagramBio: customFields.instagramBio,
    instagramFollowerCount: formatInstagramCount(customFields.instagramFollowerCount),
    instagramFollowsCount: formatInstagramCount(customFields.instagramFollowsCount),
    instagramMediaCount: formatInstagramCount(customFields.instagramMediaCount),
    instagramVerified: parseInstagramYesNo(customFields.instagramVerified),
    instagramFollowsBusiness: parseInstagramYesNo(customFields.instagramFollowsBusiness),
    instagramBusinessFollowsUser: parseInstagramYesNo(customFields.instagramBusinessFollowsUser),
    journeyStatus:
      (raw.journeyStatus as Contact['journeyStatus']) ||
      (conv ? 'In Discussion' : channel === 'instagram' ? 'WhatsApp Initiated' : 'WhatsApp Initiated'),
    journeyDates: {},
  };
}

export function mapSegmentFromApi(raw: { id: string; name: string; count: number; icon?: string }): Segment {
  return {
    id: raw.id,
    name: raw.name,
    icon: raw.icon || SEGMENT_ICONS[raw.id] || 'users',
    count: raw.count,
  };
}

function mapMessageMediaFromApi(metadata: unknown): ChatMessage['media'] | undefined {
  if (!metadata || typeof metadata !== 'object') return undefined;
  const m = metadata as Record<string, unknown>;
  const hasMedia =
    m.storageKey ||
    m.mimeType ||
    m.fileName ||
    m.latitude != null ||
    m.longitude != null;
  if (!hasMedia) return undefined;
  return {
    mimeType: m.mimeType ? String(m.mimeType) : undefined,
    fileName: m.fileName ? String(m.fileName) : undefined,
    caption: m.caption ? String(m.caption) : undefined,
    storageKey: m.storageKey ? String(m.storageKey) : undefined,
    latitude: typeof m.latitude === 'number' ? m.latitude : undefined,
    longitude: typeof m.longitude === 'number' ? m.longitude : undefined,
    locationName: m.locationName ? String(m.locationName) : undefined,
    locationAddress: m.locationAddress ? String(m.locationAddress) : undefined,
  };
}

export function mapMessageFromApi(raw: Record<string, unknown>): ChatMessage {
  const createdAt = String(raw.createdAt ?? new Date().toISOString());
  const type = raw.type ? (String(raw.type) as ChatMessage['type']) : 'text';
  const media = mapMessageMediaFromApi(raw.metadata);
  return {
    id: String(raw.id),
    sender: raw.sender as ChatMessage['sender'],
    senderName: String(raw.senderName ?? ''),
    content: String(raw.content),
    type,
    media,
    createdAt,
    timestamp: formatMessageTime(createdAt),
    status: raw.status as ChatMessage['status'],
  };
}

export function mapTemplateFromApi(raw: Record<string, unknown>): CampaignTemplate {
  const updated = (raw.updatedAt ?? raw.createdAt) as string;
  const slug = String(raw.status || 'pending').toLowerCase();
  return {
    id: raw.id ? String(raw.id) : undefined,
    name: String(raw.name),
    category: (String(raw.category) as CampaignTemplate['category']) || 'Utility',
    status: statusSlugToUi(slug),
    language: raw.language ? String(raw.language) : 'en',
    lastUpdated: formatRelativeTime(updated),
    variables: (raw.variables as string[]) || [],
    bodyPattern: String(raw.bodyPattern),
    buttons: (raw.buttons as string[]) || [],
    header: raw.header ? String(raw.header) : undefined,
    footer: raw.footer ? String(raw.footer) : undefined,
    buttonType: raw.buttonType ? String(raw.buttonType) : undefined,
    buttonText: raw.buttonText ? String(raw.buttonText) : undefined,
    buttonUrl: raw.buttonUrl ? String(raw.buttonUrl) : undefined,
    rejectionReason: raw.rejectionReason ? String(raw.rejectionReason) : undefined,
  };
}

const AGENT_ROLE_LABELS: Record<string, AgentBot['role']> = {
  lead_acquisition: 'Lead Acquisition',
  customer_service: 'Order Support',
  shop_assistant: 'General FAQ',
  custom: 'General FAQ',
};

function parseFlowDefinition(raw: unknown): AgentFlowDefinition | null {
  if (!raw || typeof raw !== 'object') return null;
  const obj = raw as Record<string, unknown>;
  const nodesRaw = Array.isArray(obj.nodes) ? obj.nodes : [];
  const nodes = nodesRaw
    .filter((n): n is Record<string, unknown> => Boolean(n && typeof n === 'object'))
    .map((n) => ({
      id: String(n.id ?? `node_${Math.random()}`),
      type: (String(n.type ?? 'send_messages') as AgentFlowDefinition['nodes'][0]['type']),
      title: String(n.title ?? 'Step'),
      x: Number(n.x ?? 280),
      y: Number(n.y ?? 120),
    }));

  const triggerTypeRaw = obj.triggerType;
  const triggerType =
    triggerTypeRaw === 'keyword' || triggerTypeRaw === 'click_button' ? triggerTypeRaw : null;

  let keywordList: string[] = [];
  if (Array.isArray(obj.keywordList)) {
    keywordList = obj.keywordList.map((k) => String(k));
  } else if (obj.triggerKeywords) {
    keywordList = String(obj.triggerKeywords)
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
  }

  const keywordMatchRule: AgentFlowDefinition['keywordMatchRule'] =
    obj.keywordMatchRule === 'exact_match' ? 'exact_match' : 'containing';

  return {
    name: String(obj.name ?? `${new Date().toISOString().replace(/\D/g, '').slice(0, 14)}FLOW`),
    status: obj.status === 'active' ? 'active' : 'inactive',
    triggerType,
    keywordMatchRule,
    keywordList,
    nodes,
  };
}

export function mapAgentFromApi(raw: Record<string, unknown>): AgentBot {
  const roleKey = String(raw.role);
  const categoryRaw = String(raw.category ?? 'ai_agent');
  const category: AgentBot['category'] =
    categoryRaw === 'responsive' || categoryRaw === 'rule_based' ? categoryRaw : 'ai_agent';
  const fallbackRaw = String(raw.intentFallback ?? 'silent');
  const intentFallback: AgentBot['intentFallback'] =
    fallbackRaw === 'automated_response' || fallbackRaw === 'transfer_human'
      ? fallbackRaw
      : 'silent';

  const toneRaw = String(raw.toneOfVoice ?? 'professional');
  const toneOfVoice: AgentBot['toneOfVoice'] =
    toneRaw === 'friendly' ||
    toneRaw === 'casual' ||
    toneRaw === 'humorous' ||
    toneRaw === 'formal'
      ? toneRaw === 'formal'
        ? 'professional'
        : toneRaw
      : 'professional';
  const langRaw = String(raw.fallbackLanguage ?? 'english');
  const fallbackLanguage: AgentBot['fallbackLanguage'] =
    langRaw === 'hindi' ||
    langRaw === 'hinglish' ||
    langRaw === 'spanish' ||
    langRaw === 'arabic' ||
    langRaw === 'french'
      ? langRaw
      : 'english';

  return {
    id: String(raw.id),
    name: String(raw.name),
    category,
    role: AGENT_ROLE_LABELS[roleKey] || 'General FAQ',
    description: String(raw.description ?? raw.systemPrompt ?? ''),
    avatarUrl: raw.avatarUrl ? String(raw.avatarUrl) : null,
    welcomeMessageEnabled: Boolean(raw.welcomeMessageEnabled),
    welcomeMessageText: raw.welcomeMessageText ? String(raw.welcomeMessageText) : null,
    intentFallback,
    conversationCloseWaitMins: Number(raw.conversationCloseWaitMins ?? 10),
    toneOfVoice,
    fallbackLanguage,
    instructions: raw.instructions ? String(raw.instructions) : '',
    brandBackground: raw.brandBackground ? String(raw.brandBackground) : '',
    actions: parseAgentActions(raw.actions),
    isPublished: Boolean(raw.isPublished),
    publishedAt: raw.publishedAt ? String(raw.publishedAt) : null,
    conversationsCount: Number(raw.conversationsCount ?? 0),
    escalatedCount: Number(raw.escalatedCount ?? 0),
    flowsCount: Number(raw.flowsCount ?? 1),
    flowDefinition: parseFlowDefinition(raw.flowDefinition),
    isEnabled: Boolean(raw.isEnabled),
    lastActive: formatRelativeTime(raw.createdAt as string),
  };
}

export function mapTeamMemberFromApi(raw: Record<string, unknown>): TeamMember {
  return {
    id: String(raw.id),
    name: String(raw.name),
    initials: String(raw.initials ?? ''),
    email: String(raw.email ?? ''),
    conversationsCount: Number(raw.conversationsCount ?? 0),
    csat: Number(raw.csat ?? 0),
    avgResponse: String(raw.avgResponse ?? '—'),
    trend: String(raw.trend ?? ''),
  };
}

function mapCampaignStatus(statusRaw: string): CampaignRecordStatus {
  const s = statusRaw.toLowerCase();
  if (s === 'running') return 'Running';
  if (s === 'completed') return 'Completed';
  if (s === 'failed') return 'Failed';
  return 'Draft';
}

export function mapCampaignFromApi(raw: Record<string, unknown>): CampaignRecord {
  const filter = (raw.audienceFilter ?? {}) as Record<string, unknown>;
  const channel =
    filter.channel === 'email' || filter.channel === 'instagram' ? filter.channel : 'whatsapp';
  const segmentId = String(filter.segmentId ?? 'all');
  let segmentLabel = 'All contacts';
  if (segmentId.startsWith('tag:')) {
    segmentLabel = `Tag: ${segmentId.slice(4)}`;
  }

  return {
    id: String(raw.id),
    name: String(raw.name),
    status: mapCampaignStatus(String(raw.status ?? 'draft')),
    channel,
    segmentLabel,
    totalRecipients: Number(raw.totalRecipients ?? 0),
    sentCount: Number(raw.sentCount ?? 0),
    deliveredCount: Number(raw.deliveredCount ?? 0),
    readCount: Number(raw.readCount ?? 0),
    createdAt: String(raw.createdAt ?? new Date().toISOString()),
    sentAt: raw.sentAt ? String(raw.sentAt) : null,
  };
}

export function mapCampaignDetailFromApi(raw: Record<string, unknown>): CampaignDetail {
  const campaign = (raw.campaign ?? {}) as Record<string, unknown>;
  const filter = (campaign.audienceFilter ?? {}) as Record<string, unknown>;
  const channel =
    raw.channel === 'email' || raw.channel === 'instagram'
      ? raw.channel
      : filter.channel === 'email' || filter.channel === 'instagram'
        ? filter.channel
        : 'whatsapp';

  const insightsRaw = (raw.insights ?? {}) as Record<string, unknown>;
  const insights: CampaignInsights = {
    totalRecipients: Number(insightsRaw.totalRecipients ?? 0),
    sent: Number(insightsRaw.sent ?? 0),
    delivered: Number(insightsRaw.delivered ?? 0),
    read: Number(insightsRaw.read ?? 0),
    failed: Number(insightsRaw.failed ?? 0),
    pending: Number(insightsRaw.pending ?? 0),
    deliveryRate: Number(insightsRaw.deliveryRate ?? 0),
    readRate: Number(insightsRaw.readRate ?? 0),
  };

  const templateRaw = raw.template as Record<string, unknown> | null | undefined;
  const template = templateRaw
    ? {
        id: String(templateRaw.id),
        name: String(templateRaw.name),
        ...(templateRaw.category != null ? { category: String(templateRaw.category) } : {}),
        ...(templateRaw.language != null ? { language: String(templateRaw.language) } : {}),
        ...(templateRaw.bodyPattern != null ? { bodyPattern: String(templateRaw.bodyPattern) } : {}),
        ...(templateRaw.subject != null ? { subject: String(templateRaw.subject) } : {}),
        ...(templateRaw.htmlBody != null ? { htmlBody: String(templateRaw.htmlBody) } : {}),
        ...(templateRaw.textBody != null ? { textBody: String(templateRaw.textBody) } : {}),
        ...(Array.isArray(templateRaw.variables)
          ? { variables: templateRaw.variables.map(String) }
          : {}),
        status: String(templateRaw.status),
      }
    : null;

  const variableMappingsRaw = raw.variableMappings as Record<string, unknown> | undefined;
  const variableMappings: Record<string, string> = {};
  if (variableMappingsRaw && typeof variableMappingsRaw === 'object') {
    for (const [key, value] of Object.entries(variableMappingsRaw)) {
      if (typeof value === 'string') variableMappings[key] = value;
    }
  }

  const recipients = ((raw.recipients ?? []) as Record<string, unknown>[]).map(
    (r): CampaignRecipientInsight => ({
      messageId: String(r.messageId),
      conversationId: String(r.conversationId ?? ''),
      contactId: String(r.contactId),
      contactName: String(r.contactName),
      phone: String(r.phone ?? ''),
      email: r.email ? String(r.email) : null,
      status: String(r.status),
      sentAt: String(r.sentAt),
      content: String(r.content ?? ''),
      errorMessage: r.errorMessage != null ? String(r.errorMessage) : null,
    })
  );

  return {
    id: String(campaign.id),
    name: String(campaign.name),
    status: mapCampaignStatus(String(campaign.status ?? 'draft')),
    channel,
    segmentLabel: String(raw.segmentLabel ?? 'All contacts'),
    audienceType: String(campaign.audienceType ?? 'all'),
    totalRecipients: Number(campaign.totalRecipients ?? 0),
    sentCount: Number(campaign.sentCount ?? 0),
    deliveredCount: Number(campaign.deliveredCount ?? 0),
    readCount: Number(campaign.readCount ?? 0),
    createdAt: String(campaign.createdAt ?? new Date().toISOString()),
    sentAt: campaign.sentAt ? String(campaign.sentAt) : null,
    scheduledAt: campaign.scheduledAt ? String(campaign.scheduledAt) : null,
    template,
    variableMappings,
    insights,
    recipients,
  };
}

function mapQuickCampaignStatus(statusRaw: string): QuickCampaign['status'] {
  const s = statusRaw.toLowerCase();
  if (s === 'running') return 'Running';
  if (s === 'completed') return 'Completed';
  if (s === 'failed') return 'Failed';
  if (s === 'paused') return 'Paused';
  if (s === 'scheduled') return 'Scheduled';
  if (s === 'draft') return 'Draft';
  return 'Active';
}

export function mapQuickCampaignFromApi(raw: Record<string, unknown>): QuickCampaign {
  const filter = (raw.audienceFilter ?? {}) as Record<string, unknown>;
  const channelRaw = raw.channel ?? filter.channel;
  const channel =
    channelRaw === 'email' || channelRaw === 'instagram' ? channelRaw : 'whatsapp';
  const sentCount = Number(raw.sentCount ?? 0);
  const deliveredCount = Number(raw.deliveredCount ?? 0);
  const scheduledAt = raw.scheduledAt ? String(raw.scheduledAt) : null;
  const dateSource = scheduledAt ?? raw.sentAt ?? raw.createdAt;
  const date = dateSource
    ? new Date(String(dateSource)).toLocaleDateString('en-GB', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      })
    : '—';

  return {
    id: String(raw.id),
    name: String(raw.name),
    status: mapQuickCampaignStatus(String(raw.status ?? 'draft')),
    channel,
    date,
    scheduledAt,
    sentCount,
    deliveredCount,
    audienceCount: String(raw.audienceCount ?? raw.totalRecipients ?? '0'),
    engagementMetric: String(raw.engagementMetric ?? '—'),
  };
}

export function mapChartDay(
  raw: { date: string; sent: number; delivered: number; read: number },
  options?: { compact?: boolean }
) {
  const date = new Date(`${raw.date}T12:00:00`);
  const day = options?.compact
    ? date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    : date.toLocaleDateString('en-US', { weekday: 'short' });
  return { day, sent: raw.sent, delivered: raw.delivered, read: raw.read };
}

export function mapEmailTemplateFromApi(row: Record<string, unknown>): EmailTemplateRecord {
  return {
    id: String(row.id ?? ''),
    name: String(row.name ?? ''),
    subject: String(row.subject ?? ''),
    htmlBody: String(row.htmlBody ?? ''),
    textBody: row.textBody != null ? String(row.textBody) : null,
    designJson:
      row.designJson && typeof row.designJson === 'object'
        ? (row.designJson as Record<string, unknown>)
        : null,
    variables: Array.isArray(row.variables) ? row.variables.map(String) : [],
    status: row.status === 'active' ? 'active' : 'draft',
    createdAt: row.createdAt ? String(row.createdAt) : undefined,
    updatedAt: row.updatedAt ? String(row.updatedAt) : undefined,
  };
}
