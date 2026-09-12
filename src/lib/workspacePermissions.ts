export const WORKSPACE_PERMISSION_DEFS = [
  { key: 'inbox', label: 'Inbox & conversations' },
  { key: 'contacts', label: 'Contacts & CRM' },
  { key: 'campaigns', label: 'Campaigns & journeys' },
  { key: 'ai', label: 'AI & automation' },
  { key: 'analytics', label: 'Analytics & reports' },
  { key: 'settings', label: 'Workspace settings' },
  { key: 'billing', label: 'Billing & subscription' },
  { key: 'users', label: 'Users & teams' },
  { key: 'integrations', label: 'Channels & integrations' },
] as const

export type WorkspacePermission = (typeof WORKSPACE_PERMISSION_DEFS)[number]['key']

export const DEFAULT_AGENT_PERMISSIONS: WorkspacePermission[] = ['inbox', 'contacts']

export function asPermissionList(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((v): v is string => typeof v === 'string') : []
}

export function hasWorkspacePermission(
  permissions: string[] | null | undefined,
  required: WorkspacePermission,
  role?: string | null
): boolean {
  if (role === 'admin') return true
  const list = permissions?.length ? permissions : DEFAULT_AGENT_PERMISSIONS
  return list.includes(required)
}

export function settingsSectionPermission(section: string): WorkspacePermission | null {
  if (section === 'profile') return null
  if (section === 'users') return 'users'
  if (['wallet', 'usage', 'subscription', 'billing', 'recharge', 'invoices'].includes(section))
    return 'billing'
  if (section === 'canned-response') return 'inbox'
  if (['ai-copilot', 'ai-knowledge', 'ai-provider', 'web-widget'].includes(section)) return 'ai'
  return 'settings'
}
