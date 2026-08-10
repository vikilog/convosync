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

export type WorkspaceTagRecord = {
  id: string;
  name: string;
  folder: string | null;
  createdAt: string;
  updatedAt: string;
};

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

/** 502 send failures may include a persisted failed message for Resend. */
export class SendFailedError extends Error {
  failedMessage?: Record<string, unknown>;
  constructor(message: string, failedMessage?: Record<string, unknown>) {
    super(message);
    this.name = 'SendFailedError';
    this.failedMessage = failedMessage;
  }
}

async function parseSendFailure(res: Response): Promise<never> {
  if (res.status === 401) {
    const text = await res.text();
    forceLogoutToLogin();
    throw new Error(parseApiError(text) || 'Unauthorized');
  }
  const text = await res.text();
  try {
    const body = JSON.parse(text) as { error?: string; message?: Record<string, unknown> };
    throw new SendFailedError(
      body.error || parseApiError(text) || 'Request failed',
      body.message && typeof body.message === 'object' ? body.message : undefined
    );
  } catch (err) {
    if (err instanceof SendFailedError) throw err;
    throw new Error(parseApiError(text) || 'Request failed');
  }
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
  updateProfile: (data: { name?: string; phone?: string | null }) => patch('/auth/profile', data),
  updateAvatar: (avatar: string | null) => patch('/auth/avatar', { avatar }),
  changePassword: (data: { currentPassword: string; newPassword: string }) =>
    post('/auth/change-password', data),
  getVerificationStatus: () => get('/workspace/verification'),
  sendVerificationOtp: (data: {
    target: 'user_email' | 'company_email' | 'company_phone';
    email?: string;
    phone?: string;
  }) => post('/workspace/verification/send', data),
  verifyVerificationOtp: (data: {
    target: 'user_email' | 'company_email' | 'company_phone';
    code: string;
  }) => post('/workspace/verification/verify', data),
  /** Blacklist this JWT jti (Redis). Throws if server asks to retry. */
  logout: () => post('/auth/logout', {}),
  /** Invalidate all sessions via tokenVersion bump. */
  logoutAll: () => post('/auth/logout-all', {}),
  getCompanySettings: () => get('/workspace/company'),
  getWorkspaceAutomation: () => get('/workspace/automation'),
  updateWorkspaceAutomation: (data: unknown) => patch('/workspace/automation', data),
  getWorkspaceTags: () =>
    get('/workspace/tags') as Promise<{
      items: WorkspaceTagRecord[];
      groups: { folder: string; items: WorkspaceTagRecord[] }[];
      tags: string[];
    }>,
  createWorkspaceTag: (data: { name: string; folder?: string | null }) =>
    post('/workspace/tags', data) as Promise<WorkspaceTagRecord>,
  updateWorkspaceTag: (id: string, data: { name?: string; folder?: string | null }) =>
    patch(`/workspace/tags/${id}`, data) as Promise<WorkspaceTagRecord>,
  deleteWorkspaceTag: (id: string) => del(`/workspace/tags/${id}`),
  getNotificationPreferences: () => get('/workspace/notifications'),
  updateNotificationPreferences: (data: unknown) => patch('/workspace/notifications', data),
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
  validateBillingCoupon: (data: { code: string; amountPaise: number; planId?: string }) =>
    post('/billing/coupon/validate', data),
  createBillingSubscription: (data: {
    planId: string;
    billingCycle?: 'monthly' | 'annual';
    couponCode?: string;
  }) => post('/billing/subscription/create', data),
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
    data: {
      role: 'admin' | 'agent';
      permissions?: string[];
      inboxScope?: unknown;
      autoAssignEligible?: boolean;
      assignmentLimit?: number | null;
    }
  ) => patch(`/workspace/members/${membershipId}`, data),
  removeWorkspaceMember: (membershipId: string) => del(`/workspace/members/${membershipId}`),

  getInboxBehavior: () => get('/workspace/inbox-behavior'),
  updateInboxBehavior: (data: { mode?: 'off' | 'basic' | 'advanced'; timezone?: string | null }) =>
    patch('/workspace/inbox-behavior', data),
  getInboxGroups: () => get('/workspace/inbox-groups'),
  createInboxGroup: (name: string) => post('/workspace/inbox-groups', { name }),
  updateInboxGroup: (groupId: string, name: string) =>
    patch(`/workspace/inbox-groups/${groupId}`, { name }),
  deleteInboxGroup: (groupId: string) => del(`/workspace/inbox-groups/${groupId}`),
  addInboxGroupMember: (groupId: string, membershipId: string) =>
    post(`/workspace/inbox-groups/${groupId}/members`, { membershipId }),
  removeInboxGroupMember: (groupId: string, membershipId: string) =>
    del(`/workspace/inbox-groups/${groupId}/members/${membershipId}`),
  getInboxRules: () => get('/workspace/inbox-rules'),
  createInboxRule: (data: unknown) => post('/workspace/inbox-rules', data),
  updateInboxRule: (ruleId: string, data: unknown) =>
    patch(`/workspace/inbox-rules/${ruleId}`, data),
  deleteInboxRule: (ruleId: string) => del(`/workspace/inbox-rules/${ruleId}`),
  reorderInboxRules: (orderedIds: string[]) =>
    patch('/workspace/inbox-rules/reorder', { orderedIds }),

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
  refreshEmailProviderIdentities: (id: string, data?: unknown) =>
    post(`/email/providers/${id}/refresh-identities`, data ?? {}),
  previewSesIdentities: (data: unknown) =>
    post('/email/providers/ses/refresh-identities', data),
  testEmailProviderSesSend: (id: string, data?: unknown) =>
    post(`/email/providers/${id}/test-send`, data ?? {}),
  testSesProviderSendPreview: (data: unknown) =>
    post('/email/providers/ses/test-send', data),
  getEmailTemplates: () => get('/email/templates'),
  getEmailTemplate: (id: string) => get(`/email/templates/${id}`),
  createEmailTemplate: (data: unknown) => post('/email/templates', data),
  updateEmailTemplate: (id: string, data: unknown) => patch(`/email/templates/${id}`, data),
  deleteEmailTemplate: (id: string) => del(`/email/templates/${id}`),
  aiGenerateEmailTemplate: (prompt: string) =>
    post('/email/templates/ai-generate', { prompt }) as Promise<{
      subject: string;
      blocks: Array<{ type: string; props?: Record<string, unknown> }>;
      html?: string;
    }>,

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

  submitDemoRequest: (data: {
    name: string;
    email: string;
    phone?: string;
    message?: string;
    source?: string;
  }) => postPublic('/demo-requests', data) as Promise<{ ok: boolean; id: string }>,

  getOnboarding: () => get('/onboarding'),
  saveOnboardingStep: (step: number, data: Record<string, unknown>, skip = false) =>
    patch('/onboarding/step', { step, data, skip }),
  completeOnboarding: () => post('/onboarding/complete', {}),

  getDashboardStats: () => get('/analytics/dashboard'),
  getMessageChart: (days = 7) => get('/analytics/messages', { days: String(days) }),
  getTeamStats: () => get('/analytics/team'),
  getRecentCampaigns: () => get('/analytics/campaigns'),
  getUpcomingCampaigns: () => get('/analytics/campaigns/upcoming'),

  getContactStats: () =>
    get('/contacts/stats') as Promise<{
      all: number;
      unsubscribe: number;
      blocklist: number;
      withEmail: number;
      channels: { whatsapp: number; instagram: number; messenger: number };
      sources: { source: string; count: number }[];
      topTags: { tag: string; count: number }[];
    }>,
  getContactGrowth: (params?: Record<string, string>) =>
    get('/contacts/growth', params) as Promise<{
      range: string;
      mode: 'hour' | 'day';
      total: number;
      createdByDay: { date: string; count: number; label: string }[];
    }>,
  getContactTags: () => get('/contacts/tags') as Promise<{ tags: string[] }>,
  getContacts: (params?: Record<string, string>) =>
    get('/contacts', params) as Promise<{
      items: Record<string, unknown>[];
      nextCursor: string | null;
      hasMore: boolean;
    }>,
  getContact: (id: string) => get(`/contacts/${id}`),
  getContactLeadJourney: (id: string) =>
    get(`/contacts/${encodeURIComponent(id)}/lead-journey`) as Promise<{
      journey: {
        version: 1;
        leadId: string;
        funnelId: string | null;
        funnelName: string;
        enteredAt: string;
        convertedAt: string;
        finalStage: string;
        source: string;
        origin: {
          username: string;
          commentText: string;
          postCaption: string;
        } | null;
        timeline: Array<{
          at: string;
          type: string;
          text: string;
          fromStage?: string;
          toStage?: string;
        }>;
      } | null;
    }>,
  getContactLinks: (id: string) =>
    get(`/contacts/${encodeURIComponent(id)}/links`) as Promise<{
      groupId: string | null;
      channels: Array<{
        contactId: string;
        channel: 'whatsapp' | 'instagram' | 'messenger';
        name: string;
        phone: string;
        email: string | null;
        source: string | null;
      }>;
    }>,
  linkContactChannel: (id: string, otherContactId: string) =>
    post(`/contacts/${encodeURIComponent(id)}/links`, { otherContactId }) as Promise<{
      groupId: string | null;
      channels: Array<{
        contactId: string;
        channel: 'whatsapp' | 'instagram' | 'messenger';
        name: string;
        phone: string;
        email: string | null;
        source: string | null;
      }>;
    }>,
  unlinkContactChannel: (id: string, otherContactId: string) =>
    del(
      `/contacts/${encodeURIComponent(id)}/links/${encodeURIComponent(otherContactId)}`
    ) as Promise<{
      groupId: string | null;
      channels: Array<{
        contactId: string;
        channel: 'whatsapp' | 'instagram' | 'messenger';
        name: string;
        phone: string;
        email: string | null;
        source: string | null;
      }>;
    }>,
  getContactOverview: (id: string) =>
    get(`/contacts/${encodeURIComponent(id)}/overview`) as Promise<{
      contact: {
        id: string;
        name: string;
        phone: string;
        email: string | null;
        avatar: string | null;
        source: string | null;
        tags: string[];
        customFields: unknown;
        excludeFromInsights: boolean;
        linkGroupId: string | null;
        channel: 'whatsapp' | 'instagram' | 'messenger';
        createdAt: string;
        updatedAt: string;
      };
      links: {
        groupId: string | null;
        channels: Array<{
          contactId: string;
          channel: 'whatsapp' | 'instagram' | 'messenger';
          name: string;
          phone: string;
          email: string | null;
          source: string | null;
        }>;
      };
      channels: Array<{
        contactId: string;
        channel: 'whatsapp' | 'instagram' | 'messenger';
        name: string;
        phone: string;
        email: string | null;
        source: string | null;
        conversationCount: number;
      }>;
      stats: {
        campaigns: number;
        journeys: number;
        bots: number;
        aiReplies: number;
        templates: number;
        conversations: number;
        instagramComments: number;
      };
      campaigns: Array<{
        id: string;
        title: string;
        subtitle?: string;
        status?: string;
        timestamp: string;
      }>;
      instagramComments: Array<{
        id: string;
        postId: string;
        commentText: string;
        postCaption: string | null;
        postThumbnailUrl: string | null;
        commentedAt: string;
        intent: string | null;
        status: string;
        commenterUsername: string | null;
      }>;
      journey: {
        version: 1;
        leadId: string;
        funnelId: string | null;
        funnelName: string;
        enteredAt: string;
        convertedAt: string;
        finalStage: string;
        source: string;
        origin: {
          username: string;
          commentText: string;
          postCaption: string;
        } | null;
        timeline: Array<{
          at: string;
          type: string;
          text: string;
          fromStage?: string;
          toStage?: string;
        }>;
      } | null;
    }>,
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
  importContacts: (contacts: unknown[]) =>
    post('/contacts/import', { contacts }) as Promise<{
      created: number;
      updated: number;
      skipped: number;
      errors: { row: number; phone: string; error: string }[];
    }>,
  updateContact: (id: string, data: unknown) => put(`/contacts/${id}`, data),
  deleteContact: (id: string) => del(`/contacts/${id}`),
  countContactsByTag: (tag: string) =>
    get('/contacts/by-tag/count', { tag }) as Promise<{ tag: string; count: number }>,
  deleteContactsByTag: (tag: string) =>
    delJson('/contacts/by-tag', { tag }) as Promise<{
      success: boolean;
      tag: string;
      deleted: number;
    }>,
  getSegments: () => get('/contacts/segments'),
  getCampaignAudience: (channel: 'whatsapp' | 'email' | 'instagram') =>
    get('/contacts/campaign-audience', { channel }),
  getCampaignAudienceContacts: (
    channel: 'whatsapp' | 'email' | 'instagram',
    segmentIdOrIds: string | string[]
  ) => {
    const ids = Array.isArray(segmentIdOrIds) ? segmentIdOrIds : [segmentIdOrIds];
    const params: Record<string, string> = {
      channel,
      segmentId: ids[0] ?? 'all',
    };
    if (ids.length > 1) params.segmentIds = JSON.stringify(ids);
    return get('/contacts/campaign-audience/contacts', params);
  },

  getConversations: (params?: Record<string, string>) => get('/conversations', params),
  getConversation: (id: string) => get(`/conversations/${id}`),
  openConversation: (contactId: string, phoneNumberId?: string) =>
    post('/conversations/open', {
      contactId,
      ...(phoneNumberId ? { phoneNumberId } : {}),
    }),
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
  sendMessage: async (convId: string, content: string) => {
    const res = await fetch(apiUrl(`/conversations/${convId}/messages`), {
      method: 'POST',
      headers: authHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify({ content }),
    });
    if (!res.ok) await parseSendFailure(res);
    return res.json();
  },
  sendMediaMessage: async (convId: string, file: File, caption?: string) => {
    const form = new FormData();
    form.append('file', file);
    if (caption?.trim()) form.append('caption', caption.trim());
    const res = await fetch(`${resolveApiBaseUrl()}/conversations/${convId}/messages/media`, {
      method: 'POST',
      headers: authHeaders(),
      body: form,
    });
    if (!res.ok) await parseSendFailure(res);
    return res.json();
  },
  fetchMessageAttachment: async (messageId: string): Promise<Blob> => {
    const res = await fetch(`${resolveApiBaseUrl()}/conversations/messages/${messageId}/attachment`, {
      headers: authHeaders(),
    });
    await assertOk(res);
    return res.blob();
  },
  resendMessage: (messageId: string) =>
    post(`/conversations/messages/${messageId}/resend`, {}) as Promise<Record<string, unknown>>,
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
      if (!res.ok) await parseSendFailure(res);
      return res.json();
    }
    const res = await fetch(apiUrl(`/conversations/${convId}/messages/template`), {
      method: 'POST',
      headers: authHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify({ templateId, variables }),
    });
    if (!res.ok) await parseSendFailure(res);
    return res.json();
  },
  updateConversation: (id: string, data: unknown) => put(`/conversations/${id}`, data),
  takeoverConversation: (id: string) => post(`/conversations/${id}/takeover`),
  releaseConversationToAi: (id: string) => post(`/conversations/${id}/release-to-ai`),
  deleteConversation: (id: string) => del(`/conversations/${id}`),

  getCampaigns: () => get('/campaigns'),
  getCampaign: (id: string) => get(`/campaigns/${id}`),
  createCampaign: (data: unknown) => post('/campaigns', data),
  sendCampaign: (id: string) => post(`/campaigns/${id}/send`),
  resendCampaignFailed: (id: string) =>
    post(`/campaigns/${id}/resend-failed`, {}) as Promise<{
      total: number;
      resent: number;
      failed: number;
      results: Array<{ messageId: string; ok: boolean; error?: string }>;
    }>,
  resendCampaignRecipient: (campaignId: string, messageId: string) =>
    post(`/campaigns/${campaignId}/recipients/${messageId}/resend`, {}) as Promise<{
      messageId: string;
      ok: boolean;
      status?: string;
      error?: string;
    }>,

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
  getContactInstagramJourneyProgress: (contactId: string) =>
    get(`/instagram-journeys/contacts/${contactId}/progress`),

  getInstagramJourneys: () => get('/instagram-journeys'),
  getInstagramJourney: (id: string) => get(`/instagram-journeys/${id}`),
  createInstagramJourney: (data: unknown) => post('/instagram-journeys', data),
  updateInstagramJourney: (id: string, data: unknown) => put(`/instagram-journeys/${id}`, data),
  deleteInstagramJourney: (id: string) => del(`/instagram-journeys/${id}`),
  getInstagramJourneyGraph: (id: string) => get(`/instagram-journeys/${id}/graph`),
  saveInstagramJourneyGraph: (id: string, graph: unknown) =>
    put(`/instagram-journeys/${id}/graph`, graph),
  publishInstagramJourney: (id: string) => post(`/instagram-journeys/${id}/publish`, {}),

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
  updateAgentKnowledge: (agentId: string, kId: string, data: unknown) =>
    put(`/agents/${agentId}/knowledge/${kId}`, data),
  fetchAgentKnowledgeUrl: (agentId: string, data: unknown) =>
    post(`/agents/${agentId}/knowledge/fetch-url`, data),
  deleteAgentKnowledge: (agentId: string, kId: string) =>
    del(`/agents/${agentId}/knowledge/${kId}`),

  getMediaGallery: (params?: {
    activeOnly?: boolean;
    scope?: string;
    usage?: string;
    tag?: string;
  }) => {
    const q: Record<string, string> = {};
    if (params?.activeOnly) q.activeOnly = 'true';
    if (params?.scope) q.scope = params.scope;
    if (params?.usage) q.usage = params.usage;
    if (params?.tag) q.tag = params.tag;
    return get('/media-gallery', Object.keys(q).length ? q : undefined);
  },
  getMediaGalleryUsage: () =>
    get('/media-gallery/usage') as Promise<{
      usedBytes: number;
      limitBytes: number | null;
      storageGb?: number;
    }>,
  createMediaGalleryItem: async (data: {
    title: string;
    description: string;
    scope?: string;
    usage?: string[];
    tags?: string[];
    type?: string;
    file: File;
  }) => {
    const form = new FormData();
    form.append('title', data.title);
    form.append('description', data.description);
    form.append('scope', data.scope ?? 'customer');
    if (data.type) form.append('type', data.type);
    if (data.usage?.length) form.append('usage', JSON.stringify(data.usage));
    if (data.tags?.length) form.append('tags', JSON.stringify(data.tags));
    form.append('file', data.file);
    const res = await fetch(`${resolveApiBaseUrl()}/media-gallery`, {
      method: 'POST',
      headers: authHeaders(),
      body: form,
    });
    await assertOk(res);
    return res.json();
  },
  updateMediaGalleryItem: (
    mediaId: string,
    data: unknown
  ) => patch(`/media-gallery/${mediaId}`, data),
  /** Metadata edit and/or file replace (multipart when `file` is set). */
  updateMediaGalleryItemForm: async (
    mediaId: string,
    data: {
      title: string;
      description: string;
      scope?: string;
      usage?: string[];
      tags?: string[];
      file?: File | null;
    }
  ) => {
    const form = new FormData();
    form.append('title', data.title);
    form.append('description', data.description);
    form.append('scope', data.scope ?? 'customer');
    form.append('usage', JSON.stringify(data.usage?.length ? data.usage : ['agent']));
    form.append('tags', JSON.stringify(data.tags ?? []));
    if (data.file) form.append('file', data.file);
    const res = await fetch(`${resolveApiBaseUrl()}/media-gallery/${mediaId}`, {
      method: 'PATCH',
      headers: authHeaders(),
      body: form,
    });
    await assertOk(res);
    return res.json();
  },
  deleteMediaGalleryItem: (mediaId: string) => del(`/media-gallery/${mediaId}`),
  mediaGalleryFileUrl: (mediaId: string) =>
    `${resolveApiBaseUrl()}/media-gallery/${mediaId}/file`,
  getMediaGallerySignedUrl: (mediaId: string, expiresIn = 604_800) =>
    get(`/media-gallery/${mediaId}/signed-url`, {
      expiresIn: String(expiresIn),
    }) as Promise<{ url: string; expiresIn: number; mediaId: string }>,
  fetchMediaGalleryFile: async (mediaId: string): Promise<Blob> => {
    const res = await fetch(`${resolveApiBaseUrl()}/media-gallery/${mediaId}/file`, {
      headers: authHeaders(),
    });
    await assertOk(res);
    return res.blob();
  },

  testAgent: (agentId: string, data: unknown) => post(`/agents/${agentId}/test`, data),
  chatAgent: (agentId: string, data: unknown) => post(`/agents/${agentId}/chat`, data),
  /** Voice preview: upload MediaRecorder blob → agent's STT provider → text */
  transcribeAgentVoicePreview: async (
    agentId: string,
    blob: Blob,
    opts?: { language?: string }
  ) => {
    const form = new FormData();
    const ext = blob.type.includes('ogg') ? 'ogg' : blob.type.includes('mp4') ? 'm4a' : 'webm';
    form.append('file', blob, `preview.${ext}`);
    if (opts?.language) form.append('language', opts.language);
    const res = await fetch(apiUrl(`/agents/${agentId}/voice-preview/stt`), {
      method: 'POST',
      headers: authHeaders(),
      body: form,
    });
    const text = await res.text();
    if (!res.ok) throw new Error(parseApiError(text));
    const json = JSON.parse(text) as {
      success?: boolean;
      data?: { text: string; language: string | null; sttMs: number; provider?: string };
      message?: string;
    };
    if (!json.data?.text) throw new Error(json.message || 'Empty transcript');
    return json.data;
  },
  /** Voice preview: text → agent's TTS provider → audio blob */
  synthesizeAgentVoicePreview: async (agentId: string, text: string) => {
    const res = await fetch(apiUrl(`/agents/${agentId}/voice-preview/tts`), {
      method: 'POST',
      headers: { ...authHeaders(), 'Content-Type': 'application/json' },
      body: JSON.stringify({ text }),
    });
    if (!res.ok) {
      const errText = await res.text();
      throw new Error(parseApiError(errText));
    }
    const buf = await res.arrayBuffer();
    const mime = res.headers.get('content-type') || 'audio/mpeg';
    const ttsMs = parseInt(res.headers.get('X-TTS-Ms') || '0', 10) || 0;
    const provider = res.headers.get('X-TTS-Provider') || '';
    return { blob: new Blob([buf], { type: mime }), ttsMs, provider };
  },
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
  refreshTemplateStatus: (id: string) => post(`/templates/${id}/refresh-status`),
  deleteTemplate: (id: string) => del(`/templates/${id}`),
  syncTemplates: () => post('/templates/sync'),
  uploadTemplateHeaderMedia: async (file: File, opts?: { persistOnly?: boolean }) => {
    const form = new FormData();
    form.append('file', file);
    const q = opts?.persistOnly ? '?persistOnly=1' : '';
    const res = await fetch(`${resolveApiBaseUrl()}/templates/header-media${q}`, {
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
      businessId?: string;
      connectionMode?: 'business_api' | 'app_coexistence';
    }
  ) => post('/whatsapp/connect', { code, ...session }),
  completeWhatsAppOAuth: (code: string, state: string) =>
    post('/whatsapp/connect-oauth', { code, state }),
  getWhatsAppPaymentMode: (phoneNumberId?: string) =>
    get(
      phoneNumberId
        ? `/whatsapp/payment-mode?phoneNumberId=${encodeURIComponent(phoneNumberId)}`
        : '/whatsapp/payment-mode'
    ) as Promise<{
      phoneNumberId: string;
      wabaId: string;
      paymentMode: 'self_pay' | 'platform' | null;
      hasOwnMetaPaymentMethod: boolean;
      billingCheckStatus: 'confirmed' | 'missing' | 'unknown';
      paymentConfigCheckedAt: string | null;
      paymentSetupAcknowledgedAt: string | null;
      metaBusinessId: string | null;
      metaPaymentSetupUrl: string;
      primaryFundingId?: string | null;
      note?: string;
      error?: string;
    }>,
  setWhatsAppPaymentMode: (body: {
    paymentMode: 'self_pay' | 'platform';
    phoneNumberId?: string;
    businessId?: string;
  }) =>
    post('/whatsapp/payment-mode', body) as Promise<{
      success: boolean;
      phoneNumberId: string;
      wabaId: string;
      paymentMode: 'self_pay' | 'platform' | null;
      hasOwnMetaPaymentMethod: boolean;
      billingCheckStatus: 'confirmed' | 'missing' | 'unknown';
      paymentConfigCheckedAt: string | null;
      paymentSetupAcknowledgedAt: string | null;
      metaBusinessId: string | null;
      metaPaymentSetupUrl: string;
      primaryFundingId?: string | null;
      note?: string;
      error?: string;
    }>,
  refreshWhatsAppPaymentMode: (body?: { phoneNumberId?: string; businessId?: string }) =>
    post('/whatsapp/payment-mode/refresh', body || {}) as Promise<{
      success: boolean;
      phoneNumberId: string;
      wabaId: string;
      paymentMode: 'self_pay' | 'platform' | null;
      hasOwnMetaPaymentMethod: boolean;
      billingCheckStatus: 'confirmed' | 'missing' | 'unknown';
      paymentConfigCheckedAt: string | null;
      paymentSetupAcknowledgedAt: string | null;
      metaBusinessId: string | null;
      metaPaymentSetupUrl: string;
      primaryFundingId?: string | null;
      note?: string;
      error?: string;
    }>,
  acknowledgeWhatsAppPaymentMode: (body?: { phoneNumberId?: string }) =>
    post('/whatsapp/payment-mode/acknowledge', body || {}) as Promise<{
      success: boolean;
      phoneNumberId: string;
      wabaId: string;
      paymentMode: 'self_pay' | 'platform' | null;
      hasOwnMetaPaymentMethod: boolean;
      billingCheckStatus: 'confirmed' | 'missing' | 'unknown';
      paymentConfigCheckedAt: string | null;
      paymentSetupAcknowledgedAt: string | null;
      metaBusinessId: string | null;
      metaPaymentSetupUrl: string;
      note?: string;
      error?: string;
    }>,
  disconnectWhatsApp: (phoneNumberId?: string) =>
    del(
      phoneNumberId
        ? `/whatsapp/disconnect?phoneNumberId=${encodeURIComponent(phoneNumberId)}`
        : '/whatsapp/disconnect'
    ),
  getWhatsAppBusinessProfile: (phoneNumberId: string) =>
    get(
      `/whatsapp/accounts/${encodeURIComponent(phoneNumberId)}/business-profile`
    ) as Promise<{
      phoneNumberId: string;
      displayPhoneNumber: string | null;
      verifiedName: string | null;
      qualityRating: string | null;
      nameStatus: string | null;
      profile: {
        about: string;
        address: string;
        description: string;
        email: string;
        websites: string[];
        vertical: string;
        profilePictureUrl: string | null;
      };
      verticals: string[];
    }>,
  updateWhatsAppBusinessProfile: (
    phoneNumberId: string,
    data: {
      about?: string;
      address?: string;
      description?: string;
      email?: string;
      websites?: string[];
      vertical?: string;
    }
  ) =>
    post(`/whatsapp/accounts/${encodeURIComponent(phoneNumberId)}/business-profile`, data) as Promise<{
      success: boolean;
    }>,

  getInstagramOAuthState: () =>
    get('/instagram/oauth/state') as Promise<{
      state: string;
      redirectUri: string;
      oauthRedirectUri: string;
      webhookUrl?: string;
    }>,
  getInstagramConnectUrl: () =>
    get('/instagram/connect') as Promise<{
      oauthDialogUrl: string;
      redirectUri: string;
      state: string;
      scopes: string[];
    }>,
  getInstagramAccounts: () => get('/instagram/accounts'),
  getInstagramListeningProfile: (instagramUserId?: string) =>
    get(
      '/instagram/listening/profile',
      instagramUserId ? { instagramUserId } : undefined
    ) as Promise<{
      profile: {
        instagramUserId: string;
        pageId: string;
        pageName: string | null;
        username: string | null;
        name: string | null;
        biography: string | null;
        website: string | null;
        followersCount: number | null;
        followsCount: number | null;
        mediaCount: number | null;
        profilePictureUrl: string | null;
      };
    }>,
  getInstagramListeningMedia: (opts?: {
    instagramUserId?: string;
    after?: string;
    limit?: number;
  }) => {
    const params: Record<string, string> = {};
    if (opts?.instagramUserId) params.instagramUserId = opts.instagramUserId;
    if (opts?.after) params.after = opts.after;
    if (opts?.limit != null) params.limit = String(opts.limit);
    return get('/instagram/listening/media', params) as Promise<{
      items: Array<{
        id: string;
        caption: string | null;
        mediaType: string;
        mediaProductType: string | null;
        mediaUrl: string | null;
        thumbnailUrl: string | null;
        permalink: string | null;
        timestamp: string | null;
        likeCount: number | null;
        commentsCount: number | null;
        isReel: boolean;
      }>;
      nextCursor: string | null;
    }>;
  },
  getInstagramListeningMediaDetail: (mediaId: string, instagramUserId?: string) =>
    get(
      `/instagram/listening/media/${encodeURIComponent(mediaId)}`,
      instagramUserId ? { instagramUserId } : undefined
    ) as Promise<{
      media: {
        id: string;
        caption: string | null;
        mediaType: string;
        mediaProductType: string | null;
        mediaUrl: string | null;
        thumbnailUrl: string | null;
        permalink: string | null;
        timestamp: string | null;
        likeCount: number | null;
        commentsCount: number | null;
        isReel: boolean;
      };
    }>,
  getInstagramListeningComments: (
    mediaId: string,
    opts?: { instagramUserId?: string; after?: string; limit?: number }
  ) => {
    const params: Record<string, string> = {};
    if (opts?.instagramUserId) params.instagramUserId = opts.instagramUserId;
    if (opts?.after) params.after = opts.after;
    if (opts?.limit != null) params.limit = String(opts.limit);
    return get(
      `/instagram/listening/media/${encodeURIComponent(mediaId)}/comments`,
      params
    ) as Promise<{
      comments: Array<{
        id: string;
        text: string;
        username: string | null;
        timestamp: string | null;
        likeCount: number | null;
        fromId: string | null;
        socialCommentId?: string | null;
        intent?: string | null;
        intentLabel?: 'Interested' | 'Question' | 'Complaint' | 'Spam' | 'Neutral' | null;
        confidence?: number | null;
        classificationStatus?: 'pending' | 'classified' | 'failed' | null;
        classificationError?: string | null;
        reviewStatus?: 'pending' | 'approved' | 'ignored' | null;
        suggestedReply?: string | null;
        status?: string | null;
        publicReplyText?: string | null;
        dmReplyText?: string | null;
        dmSentAt?: string | null;
        dmStatus?: string | null;
        dmError?: string | null;
        leadId?: string | null;
        replies: Array<Record<string, unknown>>;
      }>;
      nextCursor: string | null;
      classifying?: number;
    }>;
  },
  replyInstagramListeningComment: (
    commentId: string,
    message: string,
    instagramUserId?: string
  ) =>
    post(`/instagram/listening/comments/${encodeURIComponent(commentId)}/reply`, {
      message,
      ...(instagramUserId ? { instagramUserId } : {}),
    }) as Promise<{ success: boolean; id: string }>,
  getSocialListeningComments: (params?: { status?: string; postId?: string }) => {
    const q: Record<string, string> = {};
    if (params?.status) q.status = params.status;
    if (params?.postId) q.postId = params.postId;
    return get('/social-listening/comments', q) as Promise<{
      comments: Array<{
        id: string;
        commentId: string;
        postId: string;
        username: string;
        profilePicUrl: string | null;
        commentText: string;
        postThumbnailUrl: string;
        postCaption: string;
        intent: 'Interested' | 'Question' | 'Complaint' | 'Spam' | 'Neutral';
        confidence: number;
        status: 'pending' | 'approved' | 'ignored';
        rawStatus: string;
        classificationStatus: string;
        classificationError: string | null;
        suggestedDm: string;
        publicReplyText?: string | null;
        dmReplyText?: string | null;
        dmSentAt?: string | null;
        dmStatus?: string | null;
        dmError?: string | null;
        createdAt: string;
        needsReview: boolean;
      }>;
      threshold: number;
    }>;
  },
  classifySocialListeningComment: (id: string) =>
    post(`/social-listening/comments/${encodeURIComponent(id)}/classify`, {}) as Promise<{
      success?: boolean;
      id: string;
      intent: string | null;
      intentLabel?: string;
      confidence: number | null;
      classificationStatus: string;
      classificationError: string | null;
      suggestedReply: string | null;
    }>,
  socialListeningCommentAction: (
    id: string,
    data: {
      action: 'approve_dm' | 'approve_reply' | 'escalate' | 'ignore' | 'review';
      message?: string;
      instagramUserId?: string;
    }
  ) =>
    post(`/social-listening/comments/${encodeURIComponent(id)}/action`, data) as Promise<{
      success: boolean;
      id: string;
      status: string;
      reviewStatus: string;
      replyId: string | null;
      publicReplyText?: string;
      dmReplyText?: string;
      dmStatus?: 'sent' | 'failed' | 'skipped';
      dmError?: string | null;
      dmMessageId?: string | null;
      leadId?: string | null;
    }>,
  retrySocialListeningDm: (id: string, instagramUserId?: string) =>
    post(`/social-listening/comments/${encodeURIComponent(id)}/retry-dm`, {
      ...(instagramUserId ? { instagramUserId } : {}),
    }) as Promise<{
      success?: boolean;
      dmStatus: 'sent' | 'failed';
      dmError: string | null;
      dmMessageId: string | null;
      dmReplyText: string;
    }>,
  getSocialListeningSettings: () =>
    get('/social-listening/settings') as Promise<{
      settings: {
        id: string;
        workspaceId: string;
        autoResponseEnabled: boolean;
        leadFunnelId: string | null;
        interestedMode: 'auto' | 'review' | 'off';
        questionMode: 'auto' | 'review' | 'off';
        complaintMode: 'review' | 'escalate_only';
        spamMode: 'auto_ignore' | 'review';
        confidenceThreshold: number;
        publicReplyTone: 'friendly' | 'professional' | 'playful';
        dmAgentSkillId: string | null;
        fallbackMessage: string | null;
        leadCreationRule: 'interested_only' | 'interested_and_questions' | 'never';
        maxAutoDmsPerDay: number;
        workingHoursOnly: boolean;
        workingHoursStart: string | null;
        workingHoursEnd: string | null;
        updatedAt: string;
        autoDmsSentToday: number;
      };
      dmSkillOptions: Array<{
        id: string;
        title: string;
        agentId: string;
        agentName: string;
      }>;
    }>,
  updateSocialListeningSettings: (data: Record<string, unknown>) =>
    patch('/social-listening/settings', data) as Promise<{
      settings: {
        id: string;
        workspaceId: string;
        autoResponseEnabled: boolean;
        leadFunnelId: string | null;
        interestedMode: 'auto' | 'review' | 'off';
        questionMode: 'auto' | 'review' | 'off';
        complaintMode: 'review' | 'escalate_only';
        spamMode: 'auto_ignore' | 'review';
        confidenceThreshold: number;
        publicReplyTone: 'friendly' | 'professional' | 'playful';
        dmAgentSkillId: string | null;
        fallbackMessage: string | null;
        leadCreationRule: 'interested_only' | 'interested_and_questions' | 'never';
        maxAutoDmsPerDay: number;
        workingHoursOnly: boolean;
        workingHoursStart: string | null;
        workingHoursEnd: string | null;
        updatedAt: string;
        autoDmsSentToday: number;
      };
    }>,
  getSocialListeningDashboardStats: (range: 'today' | '7d' | '30d' | 'all' = '7d') =>
    get('/social-listening/dashboard/stats', { range }) as Promise<{
      range: string;
      totalComments: number;
      pendingReview: number;
      autoHandled: number;
      leadsCreated: number;
      autoDmsSentToday: number;
      maxAutoDmsPerDay: number;
      autoResponseEnabled: boolean;
    }>,
  getSocialListeningIntentBreakdown: (range: 'today' | '7d' | '30d' | 'all' = '7d') =>
    get('/social-listening/dashboard/intent-breakdown', { range }) as Promise<{
      range: string;
      items: Array<{ intent: string; label: string; count: number }>;
    }>,
  getSocialListeningNeedsAttention: (limit = 25) =>
    get('/social-listening/dashboard/needs-attention', {
      limit: String(limit),
    }) as Promise<{
      items: Array<{
        id: string;
        kind: 'complaint' | 'interested' | 'question' | 'pending' | 'failed_dm';
        priority: number;
        commentId: string;
        postId: string;
        username: string;
        commentText: string;
        postThumbnailUrl: string;
        postCaption: string;
        intent: 'Interested' | 'Question' | 'Complaint' | 'Spam' | 'Neutral';
        confidence: number;
        waitingSince: string;
        dmError: string | null;
        suggestedAction: 'approve_dm' | 'escalate' | 'retry_dm' | 'open_review';
      }>;
    }>,
  getSocialListeningActivity: (limit = 30) =>
    get('/social-listening/dashboard/activity', { limit: String(limit) }) as Promise<{
      events: Array<{
        id: string;
        eventType: string;
        message: string;
        relatedCommentId: string | null;
        relatedLeadId: string | null;
        meta: unknown;
        createdAt: string;
      }>;
    }>,
  getSocialListeningTopPosts: (range: 'today' | '7d' | '30d' | 'all' = '7d', limit = 8) =>
    get('/social-listening/dashboard/top-posts', {
      range,
      limit: String(limit),
    }) as Promise<{
      range: string;
      posts: Array<{
        postId: string;
        commentCount: number;
        leadCount: number;
        postThumbnailUrl: string;
        postCaption: string;
      }>;
    }>,
  getSocialListeningPostAutomation: (postIds: string[]) =>
    get('/social-listening/posts/automation', {
      postIds: postIds.join(','),
    }) as Promise<{
      posts: Record<
        string,
        {
          autoResponseEnabled: boolean;
          leadFunnelId: string | null;
          commentAutomationJourneyId: string | null;
          commentAutomationJourneyName: string | null;
        }
      >;
    }>,
  getSocialListeningPostSettings: (postId: string) =>
    get(`/social-listening/posts/${encodeURIComponent(postId)}/settings`) as Promise<{
      settings: {
        id: string;
        workspaceId: string;
        postId: string;
        autoResponseEnabled: boolean;
        leadFunnelId: string | null;
        commentAutomationJourneyId: string | null;
        commentAutomationJourneyName: string | null;
        interestedMode: 'auto' | 'review' | 'off';
        questionMode: 'auto' | 'review' | 'off';
        complaintMode: 'review' | 'escalate_only';
        spamMode: 'auto_ignore' | 'review';
        confidenceThreshold: number;
        publicReplyTone: 'friendly' | 'professional' | 'playful';
        dmAgentSkillId: string | null;
        fallbackMessage: string | null;
        leadCreationRule: 'interested_only' | 'interested_and_questions' | 'never';
        maxAutoDmsPerDay: number;
        workingHoursOnly: boolean;
        workingHoursStart: string | null;
        workingHoursEnd: string | null;
        updatedAt: string;
        autoDmsSentToday: number;
      };
      dmSkillOptions: Array<{
        id: string;
        title: string;
        agentId: string;
        agentName: string;
      }>;
    }>,
  updateSocialListeningPostSettings: (postId: string, data: Record<string, unknown>) =>
    patch(`/social-listening/posts/${encodeURIComponent(postId)}/settings`, data) as Promise<{
      success: boolean;
      settings: Record<string, unknown> & {
        autoResponseEnabled: boolean;
        leadFunnelId: string | null;
        commentAutomationJourneyId: string | null;
        commentAutomationJourneyName: string | null;
        autoDmsSentToday: number;
      };
    }>,
  getLeads: (params?: { source?: string; funnelId?: string }) => {
    const q: Record<string, string> = {};
    if (params?.source && params.source !== 'all') q.source = params.source;
    if (params?.funnelId) q.funnelId = params.funnelId;
    return get('/leads', q) as Promise<{
      leads: Array<{
        id: string;
        funnelId: string | null;
        stageId: string | null;
        contactId: string | null;
        name: string | null;
        phone: string | null;
        email: string | null;
        stage: string;
        source: 'instagram' | 'manual' | 'whatsapp';
        requirement: string;
        assignedRep: null;
        createdAt: string;
        updatedAt: string;
        origin: {
          username: string;
          commentText: string;
          postThumbnailUrl: string;
          postCaption: string;
          commentedAt: string;
        } | null;
        notes: string;
        activity: Array<{
          id: string;
          type: 'stage_change' | 'dm_sent' | 'note' | 'created' | 'converted';
          text: string;
          at: string;
        }>;
      }>;
    }>;
  },
  updateLead: (
    id: string,
    data: {
      stage?: string;
      stageId?: string;
      name?: string | null;
      phone?: string | null;
      email?: string | null;
      requirement?: string;
      notes?: string;
    }
  ) =>
    patch(`/leads/${encodeURIComponent(id)}`, data) as Promise<{
      lead: {
        id: string;
        funnelId: string | null;
        stageId: string | null;
        contactId: string | null;
        name: string | null;
        phone: string | null;
        email: string | null;
        stage: string;
        source: 'instagram' | 'manual' | 'whatsapp';
        requirement: string;
        assignedRep: null;
        createdAt: string;
        updatedAt: string;
        origin: {
          username: string;
          commentText: string;
          postThumbnailUrl: string;
          postCaption: string;
          commentedAt: string;
        } | null;
        notes: string;
        activity: Array<{
          id: string;
          type: 'stage_change' | 'dm_sent' | 'note' | 'created' | 'converted';
          text: string;
          at: string;
        }>;
      };
    }>,
  convertLeadToContact: (id: string) =>
    post(`/leads/${encodeURIComponent(id)}/convert-to-contact`, {}) as Promise<{
      success: boolean;
      created: boolean;
      contactId: string;
      lead: {
        id: string;
        contactId: string | null;
        [key: string]: unknown;
      };
    }>,
  createLead: (data: {
    socialCommentId?: string;
    funnelId: string;
    name?: string;
    requirement?: string;
    source?: string;
  }) =>
    post('/leads', data) as Promise<{
      success: boolean;
      created: boolean;
      lead: {
        id: string;
        funnelId: string | null;
        stageId: string | null;
        name: string | null;
        phone: string | null;
        email: string | null;
        stage: string;
        source: 'instagram' | 'manual' | 'whatsapp';
        requirement: string;
        assignedRep: null;
        createdAt: string;
        updatedAt: string;
        origin: {
          username: string;
          commentText: string;
          postThumbnailUrl: string;
          postCaption: string;
          commentedAt: string;
        } | null;
        notes: string;
        activity: Array<{
          id: string;
          type: 'stage_change' | 'dm_sent' | 'note' | 'created';
          text: string;
          at: string;
        }>;
      } | null;
    }>,
  getLeadFunnels: () =>
    get('/lead-funnels') as Promise<{
      funnels: Array<{
        id: string;
        name: string;
        description: string;
        goal: string;
        leadCount: number;
        stages: Array<{ id: string; name: string; position: number; isFinal?: boolean }>;
        createdAt: string;
        updatedAt: string;
      }>;
    }>,
  getLeadFunnelInsights: (id: string) =>
    get(`/lead-funnels/${encodeURIComponent(id)}/insights`) as Promise<{
      insights: {
        funnelId: string;
        funnelName: string;
        entered: number;
        converted: number;
        conversionRate: number;
        stageMoves: number;
        avgDaysToConvert: number | null;
        byStage: Array<{
          stageId: string;
          name: string;
          isFinal: boolean;
          count: number;
        }>;
      };
    }>,
  createLeadFunnel: (data: { name: string; description?: string; goal?: string }) =>
    post('/lead-funnels', data) as Promise<{
      funnel: {
        id: string;
        name: string;
        description: string;
        goal: string;
        leadCount: number;
        stages: Array<{ id: string; name: string; position: number; isFinal?: boolean }>;
        createdAt: string;
        updatedAt: string;
      };
    }>,
  updateLeadFunnel: (
    id: string,
    data: { name?: string; description?: string; goal?: string }
  ) =>
    patch(`/lead-funnels/${encodeURIComponent(id)}`, data) as Promise<{
      funnel: {
        id: string;
        name: string;
        description: string;
        goal: string;
        leadCount: number;
        stages: Array<{ id: string; name: string; position: number; isFinal?: boolean }>;
        createdAt: string;
        updatedAt: string;
      };
    }>,
  deleteLeadFunnel: (id: string) =>
    del(`/lead-funnels/${encodeURIComponent(id)}`) as Promise<{ success: boolean }>,
  createLeadFunnelStage: (
    funnelId: string,
    data: { name: string; isFinal?: boolean }
  ) =>
    post(`/lead-funnels/${encodeURIComponent(funnelId)}/stages`, data) as Promise<{
      stage: { id: string; name: string; position: number; isFinal: boolean };
    }>,
  updateLeadFunnelStage: (
    funnelId: string,
    stageId: string,
    data: { name?: string; isFinal?: boolean }
  ) =>
    patch(
      `/lead-funnels/${encodeURIComponent(funnelId)}/stages/${encodeURIComponent(stageId)}`,
      data
    ) as Promise<{ stage: { id: string; name: string; position: number; isFinal: boolean } }>,
  deleteLeadFunnelStage: (funnelId: string, stageId: string) =>
    del(
      `/lead-funnels/${encodeURIComponent(funnelId)}/stages/${encodeURIComponent(stageId)}`
    ) as Promise<{ success: boolean }>,
  syncInstagramInbox: (opts?: { loadMore?: boolean; maxPages?: number }) =>
    post('/instagram/sync', opts || {}) as Promise<{
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
  markGuestCallConnected: (token: string) =>
    postPublic('/calls/guest/connected', { token }) as Promise<{ call: CallSessionDto }>,
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
  contact?: { id: string; name: string; phone: string; avatarUrl?: string | null } | null;
  handler?: {
    type: 'ai' | 'human' | 'none';
    name: string | null;
    avatarUrl: string | null;
  };
  aiAgent?: { id: string; name: string; avatarUrl: string | null } | null;
  humanAgent?: { id: string; name: string; avatarUrl: string | null } | null;
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
