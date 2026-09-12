import {
  BarChart3,
  Bot,
  Code2,
  Ear,
  FileText,
  GitBranch,
  Images,
  Inbox,
  LayoutGrid,
  Megaphone,
  MessageSquare,
  Phone,
  Plug,
  Settings,
  Table2,
  Users,
  UsersRound,
} from 'lucide-react'

export type NavItem = {
  path: string
  label: string
  icon: React.ComponentType<{ className?: string }>
  unreadKey?: 'inboxUnread' | 'teamChatUnread'
}

export type NavSection = {
  label: string
  items: NavItem[]
}

/** Single source of truth for sidebar nav + route/header labels — avoids two
 * hand-kept lists (nav vs. page-title lookup) drifting out of sync. */
export const NAV_SECTIONS: NavSection[] = [
  {
    label: 'General',
    items: [
      { path: '/dashboard', label: 'Dashboard', icon: LayoutGrid },
      { path: '/inbox', label: 'Inbox', icon: Inbox, unreadKey: 'inboxUnread' },
      { path: '/team-chat', label: 'Team Chat', icon: MessageSquare, unreadKey: 'teamChatUnread' },
      { path: '/contacts', label: 'Contacts', icon: Users },
      { path: '/calling', label: 'Calls', icon: Phone },
    ],
  },
  {
    label: 'Marketing',
    items: [
      { path: '/campaigns', label: 'Campaigns', icon: Megaphone },
      { path: '/templates', label: 'Templates', icon: FileText },
      { path: '/automations', label: 'Automations', icon: GitBranch },
      { path: '/ai-agent', label: 'AI Agent', icon: Bot },
      { path: '/social-listening', label: 'Social Listening', icon: Ear },
      { path: '/leads', label: 'Leads', icon: UsersRound },
      { path: '/data', label: 'Data', icon: Table2 },
      { path: '/media-gallery', label: 'Media Gallery', icon: Images },
    ],
  },
  {
    label: 'Systems',
    items: [
      { path: '/integrations', label: 'Integrations', icon: Plug },
      { path: '/settings', label: 'Settings', icon: Settings },
    ],
  },
]

export const BOTTOM_NAV_ITEMS: NavItem[] = [
  { path: '/developers', label: 'Developers', icon: Code2 },
  { path: '/reports', label: 'Reports', icon: BarChart3 },
]

export const ALL_NAV_ITEMS: NavItem[] = [...NAV_SECTIONS.flatMap((s) => s.items), ...BOTTOM_NAV_ITEMS]

export function pathForContactsDashboard(): string {
  return '/contacts/dashboard'
}

export function pathForContactsList(): string {
  return '/contacts/list'
}

export function isInboxPath(pathname: string) {
  return pathname === '/inbox' || pathname.startsWith('/inbox/')
}

export function isTeamChatPath(pathname: string) {
  return pathname === '/team-chat' || pathname.startsWith('/team-chat/')
}

/** List/dashboard only — contact detail stays an Outlet so KeepAlive can hide the table. */
export function isContactsKeepAlivePath(pathname: string) {
  return pathname === '/contacts' || pathname === '/contacts/dashboard' || pathname === '/contacts/list'
}

export function isSocialListeningPath(pathname: string) {
  return pathname === '/social-listening' || pathname.startsWith('/social-listening/')
}

export { pathForConvertSocialComment, pathForLeadFunnel, pathForLeads } from '@/lib/leadPaths'

/** Resolves the page title for the header bar from the current pathname,
 * matching the deepest nav item whose path prefixes the location. */
export function labelForPath(pathname: string): string {
  const match = ALL_NAV_ITEMS.filter((item) => pathname.startsWith(item.path)).sort(
    (a, b) => b.path.length - a.path.length
  )[0]
  return match?.label ?? ''
}
