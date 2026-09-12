import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'

import {
  SESSION_EXPIRED_EVENT,
  readStoredSession,
  writeStoredSession,
  type StoredSession,
} from '@/lib/authSession'
import { authApi, type AuthUser } from '@/services/authApi'

export type { AuthUser }

type AuthContextValue = {
  isAuthenticated: boolean
  user: AuthUser | null
  login: (email: string, password: string) => Promise<void>
  register: (name: string, email: string, password: string) => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

/** Real auth session backed by the ConvoSync backend (see services/authApi.ts). */
export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<StoredSession | null>(() => readStoredSession())

  // A 401 anywhere (httpClient) fires this — clear the session so RequireAuth redirects.
  useEffect(() => {
    const onExpired = () => {
      writeStoredSession(null)
      setSession(null)
    }
    window.addEventListener(SESSION_EXPIRED_EVENT, onExpired)
    return () => window.removeEventListener(SESSION_EXPIRED_EVENT, onExpired)
  }, [])

  const value = useMemo<AuthContextValue>(
    () => ({
      isAuthenticated: session !== null,
      user: session?.user ?? null,
      login: async (email, password) => {
        const res = await authApi.login(email, password)
        const next = { token: res.token, user: res.user }
        writeStoredSession(next)
        setSession(next)
      },
      register: async (name, email, password) => {
        const res = await authApi.register(name, email, password)
        const next = { token: res.token, user: res.user }
        writeStoredSession(next)
        setSession(next)
      },
      logout: () => {
        const token = session?.token
        writeStoredSession(null)
        setSession(null)
        if (token) void authApi.logout(token)
      },
    }),
    [session]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider')
  return ctx
}
