import {
  setToken,
  setWorkspaceId,
  setUserId,
  setUserName,
  setUserEmail,
  setUserRole,
  setUserPermissions,
  setUserInboxScope,
  setUserAvatar,
} from './api';

export type OnboardingCache = {
  onboardingCompleted: boolean;
  onboardingStep: number;
  progressPercent: number;
  onboardingSkippedSteps: number[];
  fetchedAt: number;
};

export type AuthSession = {
  token: string;
  user?: {
    id: string;
    name: string;
    email: string;
    role: string;
    permissions?: string[];
    inboxScope?: unknown;
    avatar?: string | null;
    onboardingCompleted?: boolean;
    onboardingStep?: number;
    onboardingSkippedSteps?: number[];
  };
  workspace?: { id: string; name: string };
  activeWorkspaceId?: string;
};

const ONBOARDING_CACHE_KEY = 'wabiz_onboarding_cache';
const ONBOARDING_CACHE_TTL_MS = 60_000;
export const AUTH_CHANGED_EVENT = 'wabiz:auth-changed';

function notifyAuthChanged() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event(AUTH_CHANGED_EVENT));
  }
}

export function subscribeAuth(callback: () => void) {
  if (typeof window === 'undefined') return () => {};
  const handler = () => callback();
  window.addEventListener(AUTH_CHANGED_EVENT, handler);
  window.addEventListener('storage', handler);
  return () => {
    window.removeEventListener(AUTH_CHANGED_EVENT, handler);
    window.removeEventListener('storage', handler);
  };
}

export function readLoggedIn(): boolean {
  if (typeof window === 'undefined') return false;
  return !!localStorage.getItem('wabiz_token');
}

export function isLoggedIn(): boolean {
  return readLoggedIn();
}

export function userNeedsOnboarding(user?: {
  onboardingCompleted?: boolean;
}): boolean {
  return user?.onboardingCompleted === false;
}

export function applyAuthSession(res: AuthSession) {
  if (res.token) setToken(res.token);
  const wsId = res.activeWorkspaceId ?? res.workspace?.id;
  if (wsId) setWorkspaceId(wsId);
  if (res.user?.id) setUserId(res.user.id);
  if (res.user?.name) setUserName(res.user.name);
  if (res.user?.email) setUserEmail(res.user.email);
  if (res.user?.role) setUserRole(res.user.role);
  if (res.user?.permissions !== undefined) setUserPermissions(res.user.permissions);
  if (res.user?.inboxScope !== undefined) setUserInboxScope(res.user.inboxScope);
  if (res.user?.avatar !== undefined) setUserAvatar(res.user.avatar ?? '');
  if (res.user?.onboardingCompleted !== undefined) {
    setOnboardingCache({
      onboardingCompleted: res.user.onboardingCompleted,
      onboardingStep: res.user.onboardingStep ?? 1,
      progressPercent: res.user.onboardingCompleted ? 100 : 0,
      onboardingSkippedSteps: res.user.onboardingSkippedSteps ?? [],
    });
  }
  notifyAuthChanged();
}

export function setOnboardingCache(
  input: Omit<OnboardingCache, 'fetchedAt'> & { fetchedAt?: number }
) {
  const payload: OnboardingCache = {
    ...input,
    fetchedAt: input.fetchedAt ?? Date.now(),
  };
  sessionStorage.setItem(ONBOARDING_CACHE_KEY, JSON.stringify(payload));
}

export function getOnboardingCache(): OnboardingCache | null {
  try {
    const raw = sessionStorage.getItem(ONBOARDING_CACHE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as OnboardingCache;
  } catch {
    return null;
  }
}

export function isOnboardingCacheFresh(cache: OnboardingCache | null) {
  if (!cache) return false;
  return Date.now() - cache.fetchedAt < ONBOARDING_CACHE_TTL_MS;
}

export function clearAuthSession() {
  localStorage.removeItem('wabiz_token');
  localStorage.removeItem('wabiz_workspace_id');
  localStorage.removeItem('wabiz_user_id');
  localStorage.removeItem('wabiz_user_name');
  localStorage.removeItem('wabiz_user_email');
  localStorage.removeItem('wabiz_user_role');
  localStorage.removeItem('wabiz_user_permissions');
  localStorage.removeItem('wabiz_user_inbox_scope');
  localStorage.removeItem('wabiz_user_avatar');
  sessionStorage.removeItem(ONBOARDING_CACHE_KEY);
  sessionStorage.removeItem('wabiz_onboarding');
  notifyAuthChanged();
}
