import type { AuthUser } from '@/services/authApi'

export type StoredSession = { token: string; user: AuthUser }

const STORAGE_KEY = 'convosync_shadcn_session'

/** Fired when the backend rejects the stored token (401) so AuthContext can clear it. */
export const SESSION_EXPIRED_EVENT = 'convosync:session-expired'

export function readStoredSession(): StoredSession | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    return JSON.parse(raw) as StoredSession
  } catch {
    return null
  }
}

export function writeStoredSession(session: StoredSession | null) {
  try {
    if (session) localStorage.setItem(STORAGE_KEY, JSON.stringify(session))
    else localStorage.removeItem(STORAGE_KEY)
  } catch {
    // localStorage unavailable (private mode, etc.) — session just won't persist across reloads
  }
}

export function getStoredToken(): string | null {
  return readStoredSession()?.token ?? null
}
