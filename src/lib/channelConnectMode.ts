export function instagramShowsConnect(statusLabels: readonly string[]): boolean {
  return statusLabels.length === 0 || statusLabels.some((s) => s === 'expired' || s === 'revoked')
}

export function messengerStandaloneMode(
  hasInstagram: boolean,
  messengerCount: number
): 'need-instagram' | 'enable' | 'connected' {
  if (messengerCount > 0) return 'connected'
  if (!hasInstagram) return 'need-instagram'
  return 'enable'
}
