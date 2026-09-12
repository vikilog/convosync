import { API_BASE_URL } from '@/lib/apiConfig'

export type AuthUser = {
  id: string
  name: string
  email: string
  avatar: string | null
  role: string
}

export type AuthWorkspace = {
  id: string
  name: string
  [key: string]: unknown
}

export type AuthResponse = {
  token: string
  user: AuthUser
  workspace: AuthWorkspace
  workspaces: AuthWorkspace[]
  activeWorkspaceId: string
}

function parseApiError(text: string): string {
  try {
    const body = JSON.parse(text) as { error?: string; message?: string }
    return body.error || body.message || text
  } catch {
    return text || 'Request failed'
  }
}

async function postPublic<T>(path: string, body: unknown): Promise<T> {
  let res: Response
  try {
    res = await fetch(`${API_BASE_URL}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
  } catch {
    throw new Error('Could not reach the backend. Is it running on localhost:4000?')
  }
  if (!res.ok) throw new Error(parseApiError(await res.text()))
  return res.json() as Promise<T>
}

export const authApi = {
  login: (email: string, password: string) => postPublic<AuthResponse>('/auth/login', { email, password }),
  register: (name: string, email: string, password: string, workspaceName?: string) =>
    postPublic<AuthResponse>('/auth/register', { name, email, password, workspaceName }),
  logout: async (token: string) => {
    try {
      await fetch(`${API_BASE_URL}/auth/logout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({}),
      })
    } catch {
      // best-effort — local session is cleared regardless
    }
  },
}
