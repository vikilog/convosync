import { API_BASE_URL } from '@/lib/apiConfig'
import { SESSION_EXPIRED_EVENT, getStoredToken } from '@/lib/authSession'

export class ApiError extends Error {
  status: number
  constructor(message: string, status: number) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

function parseErrorBody(text: string): string {
  try {
    const body = JSON.parse(text) as { error?: string; message?: string }
    return body.error || body.message || text
  } catch {
    return text || 'Request failed'
  }
}

type RequestOptions = { method?: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE'; body?: unknown }

async function rawFetch(path: string, options: RequestOptions = {}): Promise<Response> {
  const token = getStoredToken()

  const hasBody = options.body !== undefined
  const isFormData = options.body instanceof FormData

  let res: Response
  try {
    res = await fetch(`${API_BASE_URL}${path}`, {
      method: options.method ?? 'GET',
      headers: {
        ...(hasBody && !isFormData ? { 'Content-Type': 'application/json' } : {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: hasBody ? (isFormData ? (options.body as FormData) : JSON.stringify(options.body)) : undefined,
    })
  } catch {
    throw new ApiError('Could not reach the backend. Is it running on localhost:4000?', 0)
  }

  if (res.status === 401) {
    window.dispatchEvent(new Event(SESSION_EXPIRED_EVENT))
    throw new ApiError(parseErrorBody(await res.text()) || 'Session expired', 401)
  }

  return res
}

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const res = await rawFetch(path, options)
  const text = await res.text()
  if (!res.ok) throw new ApiError(parseErrorBody(text), res.status)
  return (text ? JSON.parse(text) : undefined) as T
}

async function requestBlob(path: string, options: RequestOptions = {}): Promise<Blob> {
  const res = await rawFetch(path, options)
  if (!res.ok) throw new ApiError(parseErrorBody(await res.text()), res.status)
  return res.blob()
}

/** Thin authenticated JSON client for the real ConvoSync backend. Every real
 * (non-mock) service module goes through this single seam. */
export const httpClient = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, body?: unknown) => request<T>(path, { method: 'POST', body }),
  patch: <T>(path: string, body?: unknown) => request<T>(path, { method: 'PATCH', body }),
  put: <T>(path: string, body?: unknown) => request<T>(path, { method: 'PUT', body }),
  del: <T>(path: string, body?: unknown) => request<T>(path, { method: 'DELETE', body }),
  getBlob: (path: string) => requestBlob(path),
}
