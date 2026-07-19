/**
 * All authenticated API calls are scoped to the active company via JWT `workspaceId`
 * (set on login, signup, and company switch). Never send workspaceId in request bodies.
 */
import { resolveApiBaseUrl } from './publicUrls';

function apiUrl(path: string): string {
  return `${resolveApiBaseUrl()}${path}`;
}

function getToken() {
  return localStorage.getItem('convosync_token');
}

function authHeaders(extra?: Record<string, string>): Record<string, string> {
  const token = getToken();
  return {
    ...(extra ?? {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

export function parseApiError(text: string): string {
  try {
    const j = JSON.parse(text) as { error?: string; message?: string };
    return j.error || j.message || text;
  } catch {
    return text || 'Request failed';
  }
}

/** Use in catch blocks — parseApiError is for raw response bodies only. */
export function formatCatchError(err: unknown): string {
  if (err instanceof Error) return err.message;
  if (typeof err === 'string') return err;
  return 'Request failed';
}

/** Prevent parallel 401s from stacking redirects. Reset on successful setToken. */
let handlingUnauthorized = false;

/**
 * Session JWT rejected (expired / revoked / invalidated).
 * Clears local auth synchronously (so ProtectedRoute flips) then hard-redirects to login.
 */
function forceLogoutToLogin() {
  if (handlingUnauthorized) return;
  handlingUnauthorized = true;

  // Sync clear first — readLoggedIn() must flip before any catch() swallows the throw.
  localStorage.removeItem('convosync_token');
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event('convosync:auth-changed'));
  }

  void import('./socket')
    .then((m) => m.disconnectSocket())
    .catch(() => {});
  void import('./session')
    .then((m) => m.clearAuthSession())
    .catch(() => {});

  if (typeof window === 'undefined') return;
  const path = window.location.pathname;
  if (path.startsWith('/login') || path.startsWith('/signup') || path.startsWith('/auth/')) {
    handlingUnauthorized = false;
    return;
  }
  window.location.replace('/login');
}

async function assertOk(res: Response): Promise<void> {
  if (res.status === 401) {
    const text = await res.text();
    forceLogoutToLogin();
    throw new Error(parseApiError(text) || 'Unauthorized');
  }
  if (!res.ok) throw new Error(parseApiError(await res.text()));
}

export function setToken(token: string) {
  handlingUnauthorized = false;
  localStorage.setItem('convosync_token', token);
}

export function getWorkspaceId() {
  return localStorage.getItem('convosync_workspace_id');
}

export function setWorkspaceId(id: string) {
  localStorage.setItem('convosync_workspace_id', id);
}

export function setUserId(id: string) {
  localStorage.setItem('convosync_user_id', id);
}

export function getUserId() {
  return localStorage.getItem('convosync_user_id');
}

function notifyProfileUpdated() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('convosync:profile-updated'));
  }
}

export function setUserName(name: string) {
  localStorage.setItem('convosync_user_name', name);
  notifyProfileUpdated();
}

export function getUserName() {
  return localStorage.getItem('convosync_user_name');
}

export function setUserEmail(email: string) {
  localStorage.setItem('convosync_user_email', email);
}

export function getUserEmail() {
  return localStorage.getItem('convosync_user_email');
}

export function setUserRole(role: string) {
  localStorage.setItem('convosync_user_role', role);
}

export function getUserRole() {
  return localStorage.getItem('convosync_user_role');
}

export function setUserPermissions(permissions: string[]) {
  localStorage.setItem('convosync_user_permissions', JSON.stringify(permissions));
}

export function getUserPermissions(): string[] {
  try {
    const raw = localStorage.getItem('convosync_user_permissions');
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed) ? parsed.filter((p) => typeof p === 'string') : [];
  } catch {
    return [];
  }
}

export function setUserInboxScope(scope: unknown) {
  if (scope === undefined || scope === null) {
    localStorage.removeItem('convosync_user_inbox_scope');
    return;
  }
  localStorage.setItem('convosync_user_inbox_scope', JSON.stringify(scope));
}

export function getUserInboxScope(): unknown {
  try {
    const raw = localStorage.getItem('convosync_user_inbox_scope');
    if (!raw) return null;
    return JSON.parse(raw) as unknown;
  } catch {
    return null;
  }
}

export function setUserAvatar(avatar: string) {
  if (avatar) {
    localStorage.setItem('convosync_user_avatar', avatar);
  } else {
    localStorage.removeItem('convosync_user_avatar');
  }
  notifyProfileUpdated();
}

export function getUserAvatar() {
  return localStorage.getItem('convosync_user_avatar');
}

async function get(path: string, params?: Record<string, string>) {
  const url = new URL(apiUrl(path));
  if (params) Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  const res = await fetch(url.toString(), {
    headers: authHeaders(),
  });
  await assertOk(res);
  return res.json();
}

async function post(path: string, body?: unknown) {
  const res = await fetch(apiUrl(path), {
    method: 'POST',
    headers: authHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify(body ?? {}),
  });
  await assertOk(res);
  return res.json();
}

async function postPublic(path: string, body?: unknown) {
  const res = await fetch(apiUrl(path), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body ?? {}),
  });
  // Login/register 401 must NOT clear session / redirect
  if (!res.ok) throw new Error(parseApiError(await res.text()));
  return res.json();
}

async function getPublic(path: string, params?: Record<string, string>) {
  const url = new URL(apiUrl(path));
  if (params) Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  const res = await fetch(url.toString());
  if (!res.ok) throw new Error(parseApiError(await res.text()));
  return res.json();
}

async function put(path: string, body?: unknown) {
  const res = await fetch(apiUrl(path), {
    method: 'PUT',
    headers: authHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify(body),
  });
  await assertOk(res);
  return res.json();
}

async function patch(path: string, body?: unknown) {
  const res = await fetch(apiUrl(path), {
    method: 'PATCH',
    headers: authHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify(body ?? {}),
  });
  await assertOk(res);
  return res.json();
}

async function del(path: string) {
  const res = await fetch(apiUrl(path), {
    method: 'DELETE',
    headers: authHeaders(),
  });
  await assertOk(res);
  return res.json();
}

async function delJson(path: string, body?: unknown) {
  const res = await fetch(apiUrl(path), {
    method: 'DELETE',
    headers: authHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify(body ?? {}),
  });
  await assertOk(res);
  return res.json();
}

export const api = {
  login: (email: string, password: string) =>
    postPublic('/auth/login', { email, password }),
  getMe: () => get('/auth/me'),
  updateProfile: (data: { name: string }) => patch('/auth/profile', data),
  updateAvatar: (avatar: string | null) => patch('/auth/avatar', { avatar }),
  changePassword: (data: { currentPassword: string; newPassword: string }) =>
    post('/auth/change-password', data),
  /** Blacklist this JWT jti (Redis). Throws if server asks to retry. */
  logout: () => post('/auth/logout', {}),
  /** Invalidate all sessions via tokenVersion bump. */
  logoutAll: () => post('/auth/logout-all', {}),
  getCompanySettings: () => get('/workspace/company'),
  getSubscription: () => get('/workspace/subscription'),
  getSubscriptionQuote: (query: string) => get(`/workspace/subscription/quote?${query}`),
  saveSubscriptionQuote: (data: {
    contacts: number;
    aiAgents: number;
    teamMembers: number;
    channels: number;
    emails: number;
  }) => post('/workspace/subscription/quote', data),

  getBillingWorkspace: () => get('/billing/workspace'),
  getBillingWallet: () => get('/billing/wallet'),
  getBillingWalletTransactions: (limit = 50) =>
    get('/billing/wallet/transactions', { limit: String(limit) }),
  updateBillingWallet: (data: {
    lowBalanceThresholdPaise?: number;
    autoRechargeEnabled?: boolean;
    autoRechargeAmountPaise?: number;
  }) => patch('/billing/wallet', data),
  // createAutoRechargeSetup: () => post('/billing/wallet/auto-recharge/setup', {}),
  getBillingInvoices: (limit = 50) =>
    get('/billing/invoices', { limit: String(limit) }),
  getBillingPlans: () => get('/billing/plans'),
  getUsageCost: (month?: string) =>
    get('/billing/usage', month ? { month } : undefined),
  createBillingOrder: (data: {
    amountPaise?: number;
    creditAmountPaise?: number;
    purpose?: 'addon' | 'custom_plan' | 'one_time' | 'wallet_topup' | 'plan_purchase';
    addonType?: string;
    quantity?: number;
    description?: string;
  }) => post('/billing/order/create', data),
  verifyBillingOrder: (data: {
    razorpay_order_id: string;
    razorpay_payment_id: string;
    razorpay_signature: string;
  }) => post('/billing/order/verify', data),
  createBillingSubscription: (data: { planId: string; billingCycle?: 'monthly' | 'annual' }) =>
    post('/billing/subscription/create', data),
  verifyBillingSubscription: (data: {
    razorpay_payment_id: string;
    razorpay_subscription_id: string;
    razorpay_signature: string;
  }) => post('/billing/subscription/verify', data),
  cancelBillingSubscription: (data?: { cancelAtPeriodEnd?: boolean }) =>
    post('/billing/subscription/cancel', data ?? {}),
  pauseBillingSubscription: () => post('/billing/subscription/pause', {}),
  resumeBillingSubscription: () => post('/billing/subscription/resume', {}),
  refundBillingPayment: (data: { paymentId: string; amountPaise?: number; reason?: string }) =>
    post('/billing/refund', data),
  updateCompanySettings: (data: unknown) => patch('/workspace/company', data),
  getWorkspaceMembers: () => get('/workspace/members'),
  getWorkspacePermissions: () => get('/workspace/permissions'),
  addWorkspaceMember: (data: {
    email: string;
    name?: string;
    password?: string;
    role: 'admin' | 'agent';
    permissions?: string[];
    inboxScope?: unknown;
  }) => post('/workspace/members', data),
  updateWorkspaceMember: (
    membershipId: string,
    data: { role: 'admin' | 'agent'; permissions?: string[]; inboxScope?: unknown }
  ) => patch(`/workspace/members/${membershipId}`, data),
  removeWorkspaceMember: (membershipId: string) => del(`/workspace/members/${membershipId}`),

  getAiKnowledgeConfig: () => get('/ai-knowledge/config'),
  saveAiKnowledgeConfig: (data: { venueId: string; connectionString?: string }) =>
    put('/ai-knowledge/config', data),
  syncAiKnowledge: (data: { connectionString: string; venueId: string }) =>
    post('/ai-knowledge/sync', data),
  listAiKnowledgeCollections: (data: { connectionString: string; venueId: string }) =>
    post('/ai-knowledge/collections', data),
  syncAiKnowledgeCollection: (data: {
    connectionString: string;
    venueId: string;
    collectionName: string;
  }) => post('/ai-knowledge/sync/collection', data),
  getAiKnowledge: (venueId: string) =>
    get(`/ai-knowledge/${encodeURIComponent(venueId)}`),
  getAiKnowledgeContext: (data: { query: string; venueId: string }) =>
    post('/ai-knowledge/context', data),
  sendAiChatMessage: (data: {
    venueId: string;
    message: string;
    customerId: string;
    channel: string;
    history?: Array<{ role: 'user' | 'assistant'; content: string }>;
  }) => post('/ai-chat/message', data),

  getDeveloperIncomingWebhook: () => get('/developers/webhooks/incoming'),
  updateDeveloperIncomingWebhook: (data: {
    enabled?: boolean;
    subscribedEvents?: string[];
    regenerateSecret?: boolean;
  }) => put('/developers/webhooks/incoming', data),
  getDeveloperOutgoingWebhooks: () => get('/developers/webhooks/outgoing'),
  createDeveloperOutgoingWebhook: (data: unknown) =>
    post('/developers/webhooks/outgoing', data),
  updateDeveloperOutgoingWebhook: (id: string, data: unknown) =>
    put(`/developers/webhooks/outgoing/${id}`, data),
  deleteDeveloperOutgoingWebhook: (id: string) => del(`/developers/webhooks/outgoing/${id}`),
  getDeveloperWebhookLogs: (params?: { direction?: string; limit?: string }) =>
    get('/developers/webhooks/logs', params),
  getDeveloperActions: () => get('/developers/actions'),
  upsertDeveloperAction: (data: unknown) => put('/developers/actions', data),
  getDeveloperAiSync: () => get('/developers/ai-sync'),
  getDeveloperAiSyncEvents: () => get('/developers/ai-sync/events'),
  rebuildDeveloperKnowledge: () => post('/developers/ai-sync/rebuild', {}),

  getEmailIntegration: () => get('/email/integration'),
  enableEmailIntegration: () => post('/email/integration/enable', {}),
  disableEmailIntegration: () => del('/email/integration'),
  getEmailDomains: () => get('/email/domains'),
  createEmailDomain: (data: { domain: string; provider?: string }) =>
    post('/email/domains', data),
  verifyEmailDomain: (domainId: string) =>
    post('/email/domains/verify', { domainId }),
  refreshEmailDomain: (id: string) => post(`/email/domains/${id}/refresh`, {}),
  getEmailSenders: () => get('/email/senders'),
  createEmailSender: (data: unknown) => post('/email/senders', data),
  setDefaultEmailSender: (email: string) => post('/email/senders/default', { email }),
  sendEmail: (data: unknown) => post('/email/send', data),
  getEmailLogs: (params?: { limit?: string }) => get('/email/logs', params),
  getEmailProviders: () => get('/email/providers'),
  createEmailProvider: (data: unknown) => post('/email/providers', data),
  updateEmailProvider: (id: string, data: unknown) => patch(`/email/providers/${id}`, data),
  deleteEmailProvider: (id: string) => del(`/email/providers/${id}`),
  setDefaultEmailProvider: (id: string) => post(`/email/providers/${id}/default`, {}),
  testEmailProvider: (id: string) => post(`/email/providers/${id}/test`, {}),
  getEmailTemplates: () => get('/email/templates'),
  getEmailTemplate: (id: string) => get(`/email/templates/${id}`),
  createEmailTemplate: (data: unknown) => post('/email/templates', data),
  updateEmailTemplate: (id: string, data: unknown) => patch(`/email/templates/${id}`, data),
  deleteEmailTemplate: (id: string) => del(`/email/templates/${id}`),

  getCannedResponses: () => get('/canned-responses'),
  createCannedResponse: (data: unknown) => post('/canned-responses', data),
  updateCannedResponse: (id: string, data: unknown) => put(`/canned-responses/${id}`, data),
  deleteCannedResponse: (id: string) => del(`/canned-responses/${id}`),
  saveCannedResponse: async (
    id: string | null,
    data: { title: string; content: string; shortcut?: string | null },
    options?: { file?: File | null; removeMedia?: boolean }
  ) => {
    const hasFile = Boolean(options?.file);
    const useMultipart = hasFile || options?.removeMedia;
    if (!useMultipart) {
      if (id) return put(`/canned-responses/${id}`, data);
      return post('/canned-responses', data);
    }
    const form = new FormData();
    form.append('title', data.title);
    form.append('content', data.content);
    form.append('shortcut', data.shortcut?.trim() ?? '');
    if (options?.removeMedia) form.append('removeMedia', 'true');
    if (options?.file) form.append('file', options.file);
    const url = id
      ? `${resolveApiBaseUrl()}/canned-responses/${id}`
      : `${resolveApiBaseUrl()}/canned-responses`;
    const res = await fetch(url, {
      method: id ? 'PUT' : 'POST',
      headers: authHeaders(),
      body: form,
    });
    await assertOk(res);
    return res.json();
  },
  fetchCannedResponseMedia: async (id: string): Promise<Blob> => {
    const res = await fetch(`${resolveApiBaseUrl()}/canned-responses/${id}/media`, {
      headers: authHeaders(),
    });
    await assertOk(res);
    return res.blob();
  },
  cannedResponseMediaUrl: (id: string) => `${resolveApiBaseUrl()}/canned-responses/${id}/media`,

  getWorkspaces: () => get('/auth/workspaces'),
  switchWorkspace: (workspaceId: string) =>
    post('/auth/switch-workspace', { workspaceId }),
  createWorkspace: (name: string) => post('/auth/workspaces', { name }),
  register: (name: string, email: string, password: string, workspaceName?: string) =>
    postPublic('/auth/register', { name, email, password, workspaceName }),

  getOnboarding: () => get('/onboarding'),
  saveOnboardingStep: (step: number, data: Record<string, unknown>, skip = false) =>
    patch('/onboarding/step', { step, data, skip }),
  completeOnboarding: () => post('/onboarding/complete', {}),

  getDashboardStats: () => get('/analytics/dashboard'),
  getMessageChart: (days = 7) => get('/analytics/messages', { days: String(days) }),
  getTeamStats: () => get('/analytics/team'),
  getRecentCampaigns: () => get('/analytics/campaigns'),
  getUpcomingCampaigns: () => get('/analytics/campaigns/upcoming'),

  getContactStats: () => get('/contacts/stats'),
  getContacts: (params?: Record<string, string>) => get('/contacts', params),
  getContact: (id: string) => get(`/contacts/${id}`),
  getContactAudits: (id: string) => get(`/contacts/${id}/audits`),
  getContactInsightLatest: (contactId: string) =>
    get(`/contacts/${contactId}/insights/latest`) as Promise<{
      insight: ContactInsightDto | null;
      excludeFromInsights?: boolean;
    }>,
  queueContactInsight: (contactId: string) =>
    post(`/contacts/${contactId}/insights/compute`, {}) as Promise<{
      queued: boolean;
      reason: string | null;
      jobId: string | null;
    }>,
  createContact: (data: unknown) => post('/contacts', data),
  updateContact: (id: string, data: unknown) => put(`/contacts/${id}`, data),
  deleteContact: (id: string) => del(`/contacts/${id}`),
  getSegments: () => get('/contacts/segments'),
  getCampaignAudience: (channel: 'whatsapp' | 'email' | 'instagram') =>
    get('/contacts/campaign-audience', { channel }),
  getCampaignAudienceContacts: (
    channel: 'whatsapp' | 'email' | 'instagram',
    segmentId: string
  ) => get('/contacts/campaign-audience/contacts', { channel, segmentId }),

  getConversations: (params?: Record<string, string>) => get('/conversations', params),
  getConversation: (id: string) => get(`/conversations/${id}`),
  openConversation: (contactId: string) => post('/conversations/open', { contactId }),
  getMessages: (
    convId: string,
    params?: { limit?: number; before?: string }
  ) => {
    const qs = new URLSearchParams();
    if (params?.limit) qs.set('limit', String(params.limit));
    if (params?.before) qs.set('before', params.before);
    const query = qs.toString();
    return get(`/conversations/${convId}/messages${query ? `?${query}` : ''}`);
  },
  sendMessage: (convId: string, content: string) =>
    post(`/conversations/${convId}/messages`, { content }),
  sendMediaMessage: async (convId: string, file: File, caption?: string) => {
    const form = new FormData();
    form.append('file', file);
    if (caption?.trim()) form.append('caption', caption.trim());
    const res = await fetch(`${resolveApiBaseUrl()}/conversations/${convId}/messages/media`, {
      method: 'POST',
      headers: authHeaders(),
      body: form,
    });
    await assertOk(res);
    return res.json();
  },
  fetchMessageAttachment: async (messageId: string): Promise<Blob> => {
    const res = await fetch(`${resolveApiBaseUrl()}/conversations/messages/${messageId}/attachment`, {
      headers: authHeaders(),
    });
    await assertOk(res);
    return res.blob();
  },
  sendTemplateMessage: async (
    convId: string,
    templateId: string,
    variables: string[],
    headerMediaFile?: File | null
  ) => {
    if (headerMediaFile) {
      const form = new FormData();
      form.append('templateId', templateId);
      form.append('variables', JSON.stringify(variables));
      form.append('headerMedia', headerMediaFile);
      const res = await fetch(`${resolveApiBaseUrl()}/conversations/${convId}/messages/template`, {
        method: 'POST',
        headers: authHeaders(),
        body: form,
      });
      await assertOk(res);
      return res.json();
    }
    return post(`/conversations/${convId}/messages/template`, { templateId, variables });
  },
  updateConversation: (id: string, data: unknown) => put(`/conversations/${id}`, data),
  deleteConversation: (id: string) => del(`/conversations/${id}`),

  getCampaigns: () => get('/campaigns'),
  getCampaign: (id: string) => get(`/campaigns/${id}`),
  createCampaign: (data: unknown) => post('/campaigns', data),
  sendCampaign: (id: string) => post(`/campaigns/${id}/send`),

  getJourneys: () => get('/journeys'),
  getJourney: (id: string) => get(`/journeys/${id}`),
  createJourney: (data: unknown) => post('/journeys', data),
  updateJourney: (id: string, data: unknown) => put(`/journeys/${id}`, data),
  deleteJourney: (id: string) => del(`/journeys/${id}`),
  getJourneyGraph: (id: string) => get(`/journeys/${id}/graph`),
  saveJourneyGraph: (id: string, graph: unknown) => put(`/journeys/${id}/graph`, graph),
  publishJourney: (id: string) => post(`/journeys/${id}/publish`, {}),
  triggerJourney: (data: unknown) => post('/journeys/trigger', data),
  resumeJourneyExecution: (id: string) => post(`/journeys/executions/${id}/resume`, {}),
  getJourneyAnalytics: (id: string) => get(`/journeys/${id}/analytics`),
  getContactJourneyProgress: (contactId: string) =>
    get(`/journeys/contacts/${contactId}/progress`),

  getAgents: () => get('/agents'),
  getAgent: (id: string) => get(`/agents/${encodeURIComponent(id)}`),
  createAgent: (data: unknown) => post('/agents', data),
  updateAgent: (id: string, data: unknown) => put(`/agents/${id}`, data),
  toggleAgent: (id: string) => post(`/agents/${id}/toggle`),
  duplicateAgent: (id: string) => post(`/agents/${id}/duplicate`, {}),
  deleteAgent: (id: string) => del(`/agents/${id}`),

  getAgentSkills: (agentId: string) => get(`/agents/${agentId}/skills`),
  createAgentSkill: (agentId: string, data: unknown) =>
    post(`/agents/${agentId}/skills`, data),
  updateAgentSkill: (agentId: string, skillId: string, data: unknown) =>
    put(`/agents/${agentId}/skills/${skillId}`, data),
  publishAgentSkill: (agentId: string, skillId: string) =>
    patch(`/agents/${agentId}/skills/${skillId}/publish`, {}),
  deleteAgentSkill: (agentId: string, skillId: string) =>
    del(`/agents/${agentId}/skills/${skillId}`),

  getAgentKnowledge: (agentId: string) => get(`/agents/${agentId}/knowledge`),
  createAgentKnowledge: (agentId: string, data: unknown) =>
    post(`/agents/${agentId}/knowledge`, data),
  fetchAgentKnowledgeUrl: (agentId: string, data: unknown) =>
    post(`/agents/${agentId}/knowledge/fetch-url`, data),
  // ponytail: temp reindex UI — remove with KnowledgeBase upsert button
  reindexAgentKnowledge: (agentId: string) =>
    post(`/agents/${agentId}/knowledge/reindex`, {}),
  deleteAgentKnowledge: (agentId: string, kId: string) =>
    del(`/agents/${agentId}/knowledge/${kId}`),

  testAgent: (agentId: string, data: unknown) => post(`/agents/${agentId}/test`, data),
  chatAgent: (agentId: string, data: unknown) => post(`/agents/${agentId}/chat`, data),
  getAgentConversation: (agentId: string, conversationId: string) =>
    get(`/agents/${agentId}/conversations/${conversationId}`),
  getAgentTokenStats: (agentId: string, params?: Record<string, string>) =>
    get(`/agents/${agentId}/token-stats`, params),

  getAiProviderConfig: () => get('/workspace/ai-provider'),
  updateAiProviderConfig: (data: unknown) => put('/workspace/ai-provider', data),
  testAiProviderConnection: (data?: unknown) => post('/workspace/ai-provider/test', data ?? {}),

  getTemplates: (sync?: boolean) =>
    get('/templates', sync ? { sync: '1' } : undefined),
  getTemplate: (id: string) => get(`/templates/${id}`),
  createTemplate: (data: unknown) => post('/templates', data),
  updateTemplate: (id: string, data: unknown) => put(`/templates/${id}`, data),
  submitTemplate: (id: string) => post(`/templates/${id}/submit`),
  deleteTemplate: (id: string) => del(`/templates/${id}`),
  syncTemplates: () => post('/templates/sync'),
  uploadTemplateHeaderMedia: async (file: File) => {
    const form = new FormData();
    form.append('file', file);
    const res = await fetch(`${resolveApiBaseUrl()}/templates/header-media`, {
      method: 'POST',
      headers: authHeaders(),
      body: form,
    });
    await assertOk(res);
    return res.json() as Promise<{
      headerFormat: 'IMAGE' | 'VIDEO' | 'DOCUMENT';
      headerMediaHandle: string;
      headerMediaStorageKey: string;
      headerMediaMimeType: string;
      headerMediaFileName: string | null;
    }>;
  },
  templateHeaderMediaUrl: (storageKey: string) =>
    `${resolveApiBaseUrl()}/templates/header-media/${storageKey
      .split('/')
      .map(encodeURIComponent)
      .join('/')}`,

  getWhatsAppStatus: () => get('/whatsapp/status'),
  subscribeWhatsAppWebhooks: () => post('/whatsapp/webhooks/subscribe', {}),
  getWhatsAppAccounts: () => get('/whatsapp/accounts'),
  getWhatsAppOAuthState: () =>
    get('/whatsapp/oauth/state') as Promise<{
      state: string;
      redirectUri: string;
      oauthRedirectUri: string;
      backendCallbackUri: string;
      whatsappConfigId?: string;
    }>,
  connectWhatsApp: (
    code: string,
    session?: {
      redirectUri: string;
      wabaId?: string;
      phoneNumberId?: string;
      phoneNumber?: string;
      connectionMode?: 'business_api' | 'app_coexistence';
    }
  ) => post('/whatsapp/connect', { code, ...session }),
  completeWhatsAppOAuth: (code: string, state: string) =>
    post('/whatsapp/connect-oauth', { code, state }),
  disconnectWhatsApp: (phoneNumberId?: string) =>
    del(
      phoneNumberId
        ? `/whatsapp/disconnect?phoneNumberId=${encodeURIComponent(phoneNumberId)}`
        : '/whatsapp/disconnect'
    ),

  getInstagramOAuthState: () =>
    get('/instagram/oauth/state') as Promise<{
      state: string;
      redirectUri: string;
      oauthRedirectUri: string;
      webhookUrl?: string;
    }>,
  getInstagramAccounts: () => get('/instagram/accounts'),
  syncInstagramInbox: () =>
    post('/instagram/sync') as Promise<{
      success: boolean;
      status?: 'started' | 'completed' | 'in_progress';
      message?: string;
    }>,
  connectInstagram: (data: {
    connectToken?: string;
    pageId?: string;
    code?: string;
    redirectUri?: string;
  }) => post('/instagram/connect', data),
  previewInstagramConnect: (code: string, session?: { redirectUri?: string }) =>
    post('/instagram/connect/preview', { code, ...session }) as Promise<{
      success: boolean;
      connectToken: string;
      requiresSelection: boolean;
      candidates: Array<{
        pageId: string;
        pageName?: string;
        instagramUserId: string;
        username?: string;
        displayName?: string;
        profilePicture?: string;
        alreadyConnected?: boolean;
      }>;
    }>,
  disconnectInstagram: (instagramUserId?: string) =>
    del(
      instagramUserId
        ? `/instagram/disconnect?instagramUserId=${encodeURIComponent(instagramUserId)}`
        : '/instagram/disconnect'
    ),

  getMessengerAccounts: () => get('/messenger/accounts'),
  syncMessengerInbox: () =>
    post('/messenger/sync') as Promise<{
      success: boolean;
      status?: 'started' | 'completed' | 'in_progress';
      message?: string;
    }>,
  connectMessenger: (pageId?: string) =>
    post('/messenger/connect', pageId ? { pageId } : {}) as Promise<{
      success: boolean;
      pageId: string;
      pageName?: string;
      displayName?: string;
      profilePicture?: string;
    }>,
  disconnectMessenger: (pageId?: string) =>
    del(
      pageId
        ? `/messenger/disconnect?pageId=${encodeURIComponent(pageId)}`
        : '/messenger/disconnect'
    ),

  getFacebookOAuthState: () =>
    get('/facebook/oauth/state') as Promise<{
      state: string;
      redirectUri: string;
      oauthRedirectUri: string;
    }>,
  getFacebookPage: () =>
    get('/facebook/pages') as Promise<{
      connected: boolean;
      page?: {
        id: string;
        name: string;
        category: string;
        picture: string;
        followersCount: number;
        isConnected: boolean;
      };
      grantedScopes?: string[];
      missingScopes?: string[];
      tokenValid?: boolean;
    }>,
  connectFacebookPage: (code: string, session?: { redirectUri?: string; pageId?: string }) =>
    post('/facebook/connect', { code, ...session }),
  disconnectFacebookPage: () => del('/facebook/disconnect'),
  getFacebookPosts: () =>
    get('/facebook/posts') as Promise<{
      posts: Array<{
        id: string;
        message: string;
        fullPicture?: string;
        createdTime: string;
        likesCount: number;
        commentsCount: number;
        sharesCount: number;
        permalink: string;
      }>;
    }>,
  getFacebookPostComments: (postId: string) =>
    get(`/facebook/posts/${encodeURIComponent(postId)}/comments`) as Promise<{
      comments: Array<{
        id: string;
        from: { name: string; picture?: string };
        message: string;
        createdTime: string;
        likeCount: number;
        canHide: boolean;
        canDelete: boolean;
      }>;
    }>,
  replyFacebookComment: (commentId: string, message: string) =>
    post(`/facebook/comments/${encodeURIComponent(commentId)}/reply`, { message }),
  hideFacebookComment: (commentId: string, hidden = true) =>
    post(`/facebook/comments/${encodeURIComponent(commentId)}/hide`, { hidden }),
  deleteFacebookComment: (commentId: string) =>
    del(`/facebook/comments/${encodeURIComponent(commentId)}`),
  createFacebookPost: (message: string, scheduledTime?: string) =>
    post('/facebook/posts', { message, scheduledTime }),
  getFacebookInsights: () =>
    get('/facebook/insights') as Promise<{
      insights: {
        pageFans: number;
        pageFansDelta: number;
        pageImpressions: number;
        pageEngagedUsers: number;
        pagePostEngagements: number;
        pageViews: number;
      };
      daily: {
        date: string;
        label: string;
        reach: number;
        engagedUsers: number;
        postEngagements: number;
        pageViews: number;
        newFollowers: number;
      }[];
    }>,

  getMetaAdsOAuthState: () =>
    get('/meta-ads/oauth/state') as Promise<{
      state: string;
      redirectUri: string;
      oauthRedirectUri: string;
    }>,
  getMetaAdsAccount: () =>
    get('/meta-ads/account') as Promise<{
      connected: boolean;
      account?: {
        id: string;
        name: string;
        currency: string;
        status: 'ACTIVE' | 'DISABLED';
        balance: number;
        spendCap?: number;
        timezone: string;
      };
    }>,
  getMetaAdAccounts: () =>
    get('/meta-ads/accounts') as Promise<{ accounts: import('../types').MetaAdAccountOption[] }>,
  selectMetaAdAccount: (adAccountId: string) =>
    post('/meta-ads/account/select', { adAccountId }),
  connectMetaAds: (code: string, session?: { redirectUri?: string; adAccountId?: string }) =>
    post('/meta-ads/connect', { code, ...session }),
  disconnectMetaAds: () => del('/meta-ads/disconnect'),
  getMetaAdCampaigns: () =>
    get('/meta-ads/campaigns') as Promise<{ campaigns: import('../types').AdCampaign[] }>,
  pauseMetaAdCampaign: (id: string) => post(`/meta-ads/campaigns/${encodeURIComponent(id)}/pause`, {}),
  resumeMetaAdCampaign: (id: string) => post(`/meta-ads/campaigns/${encodeURIComponent(id)}/resume`, {}),
  deleteMetaAdCampaign: (id: string) => del(`/meta-ads/campaigns/${encodeURIComponent(id)}`),
  createMetaCTWAAd: (payload: {
    campaignName: string;
    dailyBudget: number;
    startDate: string;
    endDate?: string;
    headline: string;
    description: string;
    targeting: { ageMin: number; ageMax: number; locations: string[] };
  }) => post('/meta-ads/ctwa/create', payload),

  getGoogleAdsAccount: () =>
    get('/google-ads/account') as Promise<{
      connected: boolean;
      account?: {
        id: string;
        name: string;
        currency: string;
        status: 'ACTIVE' | 'DISABLED';
        balance: number;
        timezone: string;
      };
    }>,
  getGoogleAdCampaigns: () =>
    get('/google-ads/campaigns') as Promise<{ campaigns: import('../types').AdCampaign[] }>,
  disconnectGoogleAds: () => del('/google-ads/disconnect'),

  getGoogleOAuthState: (redirectUri?: string) =>
    get(
      `/google/oauth/state${redirectUri ? `?redirectUri=${encodeURIComponent(redirectUri)}` : ''}`
    ) as Promise<{
      state: string;
      redirectUri: string;
      oauthUrl: string;
      scopes: string[];
    }>,
  connectGoogleAccount: (code: string, redirectUri?: string) =>
    post('/google/connect', { code, redirectUri }) as Promise<{
      success: boolean;
      account: {
        id: string;
        email: string;
        displayName?: string | null;
        pictureUrl?: string | null;
        status: string;
      };
    }>,
  getGoogleConnections: () =>
    get('/google/connections') as Promise<{
      connections: Array<{
        id: string;
        email: string;
        displayName?: string | null;
        pictureUrl?: string | null;
        status: string;
        createdAt: string;
      }>;
    }>,
  disconnectGoogleConnection: (id: string) => del(`/google/connections/${encodeURIComponent(id)}`),
  refreshGoogleConnection: (id: string) =>
    post(`/google/connections/${encodeURIComponent(id)}/refresh`, {}),
  getGoogleProducts: () =>
    get('/google/products') as Promise<{
      products: Array<{
        product: string;
        label: string;
        description: string;
        status: string;
        connectionId: string | null;
        connectionEmail: string | null;
        lastSyncAt: string | null;
        lastError: string | null;
        syncCount: number;
        config: Record<string, unknown> | null;
      }>;
    }>,
  connectGoogleProduct: (product: string, connectionId: string) =>
    post(`/google/products/${encodeURIComponent(product)}/connect`, { connectionId }),
  disconnectGoogleProduct: (product: string, connectionId: string) =>
    post(`/google/products/${encodeURIComponent(product)}/disconnect`, { connectionId }),
  syncGoogleProduct: (product: string, connectionId: string) =>
    post(`/google/products/${encodeURIComponent(product)}/sync`, { connectionId }),
  listGoogleCalendars: (connectionId: string) =>
    post('/google/calendar/calendars', { connectionId }) as Promise<{
      calendars: Array<{
        id: string;
        summary?: string | null;
        primary?: boolean;
        timeZone?: string | null;
        backgroundColor?: string | null;
      }>;
    }>,
  listGoogleCalendarEvents: (payload: {
    connectionId: string;
    calendarId?: string;
    timeMin?: string;
    timeMax?: string;
    maxResults?: number;
  }) =>
    post('/google/calendar/events/list', payload) as Promise<{
      events: Array<{
        id: string;
        summary?: string | null;
        description?: string | null;
        htmlLink?: string | null;
        status?: string | null;
        start: string | null;
        end: string | null;
        location?: string | null;
      }>;
    }>,
  createGoogleCalendarEvent: (payload: {
    connectionId: string;
    calendarId?: string;
    summary: string;
    description?: string;
    start: string;
    end: string;
    timeZone?: string;
  }) => post('/google/calendar/events', payload) as Promise<{ event: Record<string, unknown> }>,
  deleteGoogleCalendarEvent: (payload: {
    connectionId: string;
    eventId: string;
    calendarId?: string;
  }) => delJson('/google/calendar/events', payload),
  listGoogleGmailMessages: (payload: {
    connectionId: string;
    maxResults?: number;
    query?: string;
    pageToken?: string;
  }) =>
    post('/google/gmail/messages', payload) as Promise<{
      messages: Array<{
        id: string;
        threadId: string | null;
        snippet: string | null;
        labelIds: string[];
        internalDate: string | null;
        from: string;
        to: string;
        subject: string;
        date: string;
        isUnread: boolean;
        isStarred: boolean;
      }>;
      nextPageToken: string | null;
      resultSizeEstimate: number | null;
    }>,
  getGoogleGmailMessage: (payload: { connectionId: string; messageId: string }) =>
    post('/google/gmail/messages/get', payload) as Promise<{
      message: {
        id: string;
        threadId: string | null;
        snippet: string | null;
        labelIds: string[];
        internalDate: string | null;
        from: string;
        to: string;
        subject: string;
        date: string;
        isUnread: boolean;
        isStarred: boolean;
        bodyText: string;
        bodyHtml: string;
      };
    }>,
  sendGoogleGmail: (payload: {
    connectionId: string;
    to: string;
    subject: string;
    body: string;
    html?: boolean;
  }) => post('/google/gmail/send', payload) as Promise<{ message: Record<string, unknown> }>,
  listGoogleSpreadsheets: (payload: {
    connectionId: string;
    pageToken?: string;
    pageSize?: number;
    starred?: boolean;
  }) =>
    post('/google/sheets/spreadsheets/list', payload) as Promise<{
      spreadsheets: Array<Record<string, unknown>>;
      nextPageToken: string | null;
    }>,
  getGoogleSpreadsheet: (payload: {
    connectionId: string;
    spreadsheetId: string;
    sheetTitle?: string;
    previewRows?: number;
  }) =>
    post('/google/sheets/spreadsheets/get', payload) as Promise<{
      spreadsheetId: string;
      title: string | null;
      worksheets: Array<{
        sheetId?: number;
        title?: string;
        index?: number;
        rowCount: number;
        columnCount: number;
      }>;
      preview: { range: string; values: unknown[][] } | null;
    }>,
  browseGoogleDrive: (payload: {
    connectionId: string;
    folderId?: string;
    pageToken?: string;
    view?: 'my' | 'shared' | 'recent' | 'starred' | 'folders';
    query?: string;
    pageSize?: number;
  }) =>
    post('/google/drive/browse', payload) as Promise<{
      files: Array<Record<string, unknown>>;
      nextPageToken: string | null;
    }>,
  getGoogleDriveFile: (connectionId: string, fileId: string) =>
    post('/google/drive/files/get', { connectionId, fileId }) as Promise<{
      file: Record<string, unknown>;
    }>,
  previewGoogleDriveFile: (connectionId: string, fileId: string) =>
    post('/google/drive/files/preview', { connectionId, fileId }) as Promise<{
      preview:
        | {
            previewable: true;
            mimeType: string;
            dataBase64: string;
            fileName: string | null;
            sourceMimeType?: string;
          }
        | {
            previewable: false;
            reason: string;
            mimeType: string | null;
          };
    }>,
  listGoogleMeetings: (payload: {
    connectionId: string;
    calendarId?: string;
    timeMin?: string;
    timeMax?: string;
    maxResults?: number;
  }) =>
    post('/google/meet/meetings/list', payload) as Promise<{
      meetings: Array<Record<string, unknown>>;
    }>,
  createGoogleMeet: (payload: {
    connectionId: string;
    calendarId?: string;
    summary: string;
    start: string;
    end: string;
    timeZone?: string;
    attendees?: string[];
  }) =>
    post('/google/meet/create', payload) as Promise<{
      event: Record<string, unknown>;
      meetLink: string | null;
    }>,
  cancelGoogleMeet: (connectionId: string, eventId: string, calendarId?: string) =>
    post('/google/meet/meetings/cancel', { connectionId, eventId, calendarId }) as Promise<{
      cancelled: boolean;
      eventId: string;
    }>,
  listGoogleBusinessProfileAccounts: (connectionId: string) =>
    get(`/google/business-profile/accounts?connectionId=${encodeURIComponent(connectionId)}`) as Promise<{
      accounts: Array<{
        id: string;
        googleAccountName: string;
        displayName: string | null;
        accountType: string | null;
        lastSyncedAt: string | null;
        syncStatus: string;
      }>;
    }>,
  listGoogleBusinessProfileLocations: (connectionId: string, accountId: string) =>
    get(
      `/google/business-profile/locations?connectionId=${encodeURIComponent(connectionId)}&accountId=${encodeURIComponent(accountId)}`
    ) as Promise<{
      locations: Array<{
        id: string;
        googleLocationName: string;
        title: string | null;
        address: Record<string, unknown> | null;
        regularHours: Record<string, unknown> | null;
        metadata: Record<string, unknown> | null;
        lastLocationSyncAt: string | null;
      }>;
    }>,
  listGoogleBusinessProfileReviews: (connectionId: string, locationId: string) =>
    get(
      `/google/business-profile/locations/${encodeURIComponent(locationId)}/reviews?connectionId=${encodeURIComponent(connectionId)}`
    ) as Promise<{
      reviews: Array<{
        id: string;
        reviewerName: string | null;
        starRating: number | null;
        comment: string | null;
        reviewReply: string | null;
        createTime: string | null;
        updateTime: string | null;
      }>;
    }>,
  listGoogleBusinessProfileMetrics: (connectionId: string, locationId: string) =>
    get(
      `/google/business-profile/locations/${encodeURIComponent(locationId)}/metrics?connectionId=${encodeURIComponent(connectionId)}`
    ) as Promise<{
      metrics: Array<{
        id: string;
        metricType: string;
        value: Record<string, unknown> | null;
        lastSyncedAt: string | null;
      }>;
    }>,
  enqueueGoogleBusinessProfileSync: (payload: {
    connectionId: string;
    syncType: 'accounts' | 'locations' | 'reviews' | 'metrics' | 'cache_rebuild';
    accountId?: string;
    locationId?: string;
    force?: boolean;
  }) =>
    post('/google/business-profile/sync', payload) as Promise<{ jobId: string; status: string }>,
  getGoogleBusinessProfileSyncStatus: (connectionId: string) =>
    get(
      `/google/business-profile/sync/status?connectionId=${encodeURIComponent(connectionId)}`
    ) as Promise<{
      lastSync: {
        accounts: string | null;
        locations: string | null;
        reviews: string | null;
        metrics: string | null;
      };
      counts: { accounts: number; locations: number; reviews: number; metrics: number };
      jobs: { waiting: number; active: number; failed: number };
      quotaHealth: 'healthy' | 'busy' | 'degraded';
    }>,
  getGoogleBusinessProfileSyncLogs: (connectionId: string, limit = 50) =>
    get(
      `/google/business-profile/sync/logs?connectionId=${encodeURIComponent(connectionId)}&limit=${limit}`
    ) as Promise<{
      logs: Array<{
        id: string;
        syncType: string;
        durationMs: number | null;
        requestCount: number;
        responseCount: number;
        status: string;
        error: string | null;
        createdAt: string;
      }>;
    }>,

  getWhatsAppPaySummary: () =>
    get('/whatsapp-pay/summary') as Promise<{
      totalCollectedPaise: number;
      pendingCount: number;
      paidCount: number;
      sentCount: number;
      requestCount: number;
      razorpayConfigured: boolean;
    }>,
  getWhatsAppPayRequests: (status?: string) =>
    get('/whatsapp-pay/requests', status && status !== 'ALL' ? { status } : undefined) as Promise<{
      requests: Array<{
        id: string;
        contactId: string | null;
        contactName: string;
        contactPhone: string;
        amountPaise: number;
        currency: string;
        description: string;
        status: string;
        paymentLinkUrl: string | null;
        sentAt: string | null;
        paidAt: string | null;
        expiresAt: string | null;
        createdByName: string | null;
        createdAt: string;
      }>;
    }>,
  createWhatsAppPayRequest: (data: {
    contactId?: string;
    contactName: string;
    contactPhone: string;
    amountPaise: number;
    description: string;
    sendMode?: 'plain' | 'template';
    templateId?: string;
    templateVariables?: string[];
  }) => post('/whatsapp-pay/requests', data) as Promise<{ request: { id: string } }>,
  sendWhatsAppPayRequest: (id: string) =>
    post(`/whatsapp-pay/requests/${id}/send`, {}) as Promise<{ request: { id: string; status: string } }>,
  cancelWhatsAppPayRequest: (id: string) =>
    post(`/whatsapp-pay/requests/${id}/cancel`, {}) as Promise<{ request: { id: string; status: string } }>,
  refreshWhatsAppPayRequest: (id: string) =>
    post(`/whatsapp-pay/requests/${id}/refresh`, {}) as Promise<{ request: { id: string; status: string } }>,

  createCall: (conversationId: string, direction?: 'inbound' | 'outbound') =>
    post('/calls', { conversationId, direction }) as Promise<{
      call: CallSessionDto;
      guestUrl: string | null;
      callPagePath: string;
    }>,
  listCalls: (params?: { conversationId?: string; limit?: string }) =>
    get('/calls', params) as Promise<{ calls: CallSessionDto[] }>,
  getCall: (callId: string) => get(`/calls/${callId}`) as Promise<{ call: CallSessionDto }>,
  acceptCall: (callId: string) => post(`/calls/${callId}/accept`, {}) as Promise<{ call: CallSessionDto }>,
  declineCall: (callId: string) =>
    post(`/calls/${callId}/decline`, {}) as Promise<{ call: CallSessionDto }>,
  endCall: (callId: string) => post(`/calls/${callId}/end`, {}) as Promise<{ call: CallSessionDto }>,
  markCallConnected: (callId: string) =>
    post(`/calls/${callId}/connected`, {}) as Promise<{ call: CallSessionDto }>,
  getCallToken: (callId: string) =>
    post(`/calls/${callId}/token`, {}) as Promise<{
      token: string;
      url: string;
      expiresInSeconds: number;
      callId: string;
    }>,
  listenInCall: (callId: string) =>
    post(`/calls/${callId}/listen`, {}) as Promise<{
      token: string;
      url: string;
      expiresInSeconds: number;
      callId: string;
      mode: 'listen';
    }>,
  takeOverCall: (callId: string) =>
    post(`/calls/${callId}/take-over`, {}) as Promise<{
      call: CallSessionDto;
      token: string;
      url: string;
      expiresInSeconds: number;
    }>,
  refreshCallGuestLink: (callId: string) =>
    post(`/calls/${callId}/guest-link`, {}) as Promise<{ guestUrl: string; expiresAt: string }>,
  resendCallGuestLink: (callId: string) =>
    post(`/calls/${callId}/resend-link`, {}) as Promise<{ guestUrl: string; sent: boolean }>,
  saveCallAnalytics: (callId: string, analytics: Record<string, unknown>) =>
    post(`/calls/${callId}/analytics`, analytics) as Promise<{ call: CallSessionDto }>,
  getCallRecording: (callId: string) =>
    get(`/calls/${callId}/recording`) as Promise<{
      status: string | null;
      url: string | null;
      codec: string | null;
      durationSeconds: number | null;
      fileSize: number | null;
    }>,
  deleteCallRecording: (callId: string) =>
    del(`/calls/${callId}/recording`) as Promise<{ call: CallSessionDto }>,
  fetchCallRecordingBlob: async (callId: string): Promise<Blob> => {
    const res = await fetch(`${resolveApiBaseUrl()}/calls/${callId}/recording/file`, {
      headers: authHeaders(),
    });
    await assertOk(res);
    return res.blob();
  },
  uploadCallRecording: async (
    conversationId: string,
    file: File,
    opts?: { language?: string }
  ) => {
    const form = new FormData();
    form.append('conversationId', conversationId);
    form.append('file', file);
    if (opts?.language) form.append('language', opts.language);
    const res = await fetch(`${resolveApiBaseUrl()}/calls/upload-recording`, {
      method: 'POST',
      headers: authHeaders(),
      body: form,
    });
    await assertOk(res);
    return res.json() as Promise<{ call: CallSessionDto; queuedTranscript: boolean }>;
  },
  getCallTranscript: (callId: string) =>
    get(`/calls/${callId}/transcript`) as Promise<{
      callId: string;
      status: string | null;
      text: string | null;
      language: string | null;
      segments: Array<{ start: number; end: number; text: string }>;
      error: string | null;
      at: string | null;
    }>,
  queueCallTranscribe: (callId: string, opts?: { language?: string }) =>
    post(`/calls/${callId}/transcribe`, opts?.language ? { language: opts.language } : {}) as Promise<{
      queued: boolean;
      callId: string;
      language: string | null;
    }>,
  getGuestCallSession: (token: string) =>
    getPublic('/calls/guest/session', { token }) as Promise<{
      call: CallSessionDto;
      role: 'customer';
      workspaceName: string;
      contactName: string | null;
      ended: boolean;
    }>,
  resolveGuestShortCode: (code: string) =>
    getPublic(`/calls/guest/r/${encodeURIComponent(code)}`) as Promise<{
      callId: string;
      redirectUrl: string;
      token?: string;
    }>,
  getGuestCallToken: (token: string) =>
    postPublic('/calls/guest/token', { token }) as Promise<{
      token: string;
      url: string;
      expiresInSeconds: number;
    }>,
  endGuestCall: (token: string) =>
    postPublic('/calls/guest/end', { token }) as Promise<{ call: CallSessionDto }>,
};

export type CallSessionDto = {
  callId: string;
  workspaceId: string;
  conversationId: string | null;
  contactId: string | null;
  direction: string;
  status: string;
  roomName: string;
  assignedTo: string | null;
  initiatedByUserId?: string | null;
  acceptedByUserId: string | null;
  ringingAt: string | null;
  ringingUntil: string | null;
  acceptedAt: string | null;
  connectedAt: string | null;
  endedAt: string | null;
  durationSeconds: number | null;
  endReason: string | null;
  guestTokenExpiresAt?: string | null;
  guestJoinedAt?: string | null;
  guestLinkSentAt?: string | null;
  recordingStatus?: string | null;
  recordingUrl?: string | null;
  recordingStorageKey?: string | null;
  recordingStartedAt?: string | null;
  recordingEndedAt?: string | null;
  recordingDurationSeconds?: number | null;
  recordingCodec?: string | null;
  recordingFileSize?: number | null;
  transcriptStatus?: string | null;
  transcriptLanguage?: string | null;
  transcriptAt?: string | null;
  currentHandler?: 'none' | 'ai' | 'human' | string;
  takenOverAt?: string | null;
  takenOverByUserId?: string | null;
  createdAt: string;
  contact?: { id: string; name: string; phone: string } | null;
};

export type ContactInsightDto = {
  insightId: string;
  contactId: string;
  isGenuineCustomerInteraction: boolean;
  healthScore: number | null;
  churnRiskScore: number | null;
  purchaseIntentScore: number | null;
  sentimentScore: number | null;
  summary: string;
  painPoints: string[];
  interests: string[];
  recommendedAction: string | null;
  modelVersion: string;
  computedAt: string;
  basedOnConversationIds: string[];
  basedOnCallSessionIds: string[];
};
