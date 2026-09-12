/** Deep-link helpers for /leads and /leads/:funnelId. */

export function isLeadsPath(pathname: string): boolean {
  return pathname === '/leads' || pathname.startsWith('/leads/')
}

export function leadFunnelIdFromPath(pathname: string): string | null {
  const parts = pathname.replace(/^\//, '').split('/').filter(Boolean)
  if (parts[0] !== 'leads' || !parts[1]) return null
  try {
    return decodeURIComponent(parts[1])
  } catch {
    return parts[1]
  }
}

export function pathForLeadFunnel(funnelId: string): string {
  return `/leads/${encodeURIComponent(funnelId)}`
}

export function pathForLeads(): string {
  return '/leads'
}

/** Social Listening opens this to pick a funnel and POST /leads { socialCommentId }. */
export function pathForConvertSocialComment(commentId: string): string {
  return `/leads?fromComment=${encodeURIComponent(commentId)}`
}
