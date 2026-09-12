import { useAuth } from '@/context/AuthContext'
import { resolveEffectiveInboxScope, type InboxScope } from '@/lib/inboxScope'
import { profileResource } from '@/services/profile.service'

export function useInboxScope(): InboxScope {
  const { user } = useAuth()
  const { data: me } = profileResource.useGet()
  const role = me?.role ?? user?.role ?? 'agent'
  return resolveEffectiveInboxScope(role, me?.inboxScope)
}
