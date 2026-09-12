import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'

import { AiKnowledgePanel } from '@/components/settings/AiKnowledgePanel'
import { AiProviderPanel } from '@/components/settings/AiProviderPanel'
import { AutomationSettingsPanel } from '@/components/settings/AutomationSettingsPanel'
import { CompanyInfoPanel } from '@/components/settings/CompanyInfoPanel'
import { HumanHandoffPanel } from '@/components/settings/HumanHandoffPanel'
import { InboxBehaviorPanel } from '@/components/settings/InboxBehaviorPanel'
import { InvoicesPanel } from '@/components/settings/InvoicesPanel'
import { PlansPanel } from '@/components/settings/PlansPanel'
import { ProfilePanel } from '@/components/settings/ProfilePanel'
import { UsagePanel } from '@/components/settings/UsagePanel'
import { UsersTeamsPanel } from '@/components/settings/UsersTeamsPanel'
import { WalletPanel } from '@/components/settings/WalletPanel'
import { WebWidgetPanel } from '@/components/settings/WebWidgetPanel'
import { CannedResponsesPanel } from '@/components/templates/CannedResponsesPanel'
import {
  SETTINGS_NAV,
  SETTINGS_SECTION_SUBTITLE,
  isSettingsSection,
  type SettingsSection,
} from '@/lib/settingsNav'
import { asPermissionList, hasWorkspacePermission, settingsSectionPermission } from '@/lib/workspacePermissions'
import { profileResource } from '@/services/profile.service'

function SettingsPanelSwitch({ section }: { section: SettingsSection }) {
  switch (section) {
    case 'profile':
      return <ProfilePanel />
    case 'company-info':
      return <CompanyInfoPanel />
    case 'users':
      return <UsersTeamsPanel />
    case 'automation':
      return <AutomationSettingsPanel />
    case 'inbox-behavior':
      return <InboxBehaviorPanel />
    case 'alerts':
      return <HumanHandoffPanel />
    case 'subscription':
      return <PlansPanel />
    case 'wallet':
      return <WalletPanel />
    case 'usage':
      return <UsagePanel />
    case 'invoices':
      return <InvoicesPanel />
    case 'web-widget':
      return <WebWidgetPanel />
    case 'ai-knowledge':
      return <AiKnowledgePanel />
    case 'ai-provider':
      return <AiProviderPanel />
    case 'canned-response':
      return (
        <div className="h-[min(40rem,calc(100vh-12rem))] min-h-[28rem] overflow-hidden rounded-lg border">
          <CannedResponsesPanel />
        </div>
      )
  }
}

export function SettingsPage() {
  const { data: me, isLoading: meLoading } = profileResource.useGet()
  const role = me?.role
  const permissions = asPermissionList(me?.permissions)
  const [searchParams, setSearchParams] = useSearchParams()
  const sectionParam = searchParams.get('section')
  const [section, setSection] = useState<SettingsSection>(() =>
    isSettingsSection(sectionParam) ? sectionParam : 'profile'
  )

  const visibleNav = useMemo(
    () =>
      SETTINGS_NAV.map((group) => ({
        ...group,
        items: group.items.filter((item) => {
          if (meLoading || !me) return true
          const required = settingsSectionPermission(item.id)
          if (!required) return true
          return hasWorkspacePermission(permissions, required, role)
        }),
      })).filter((group) => group.items.length > 0),
    [me, meLoading, permissions, role]
  )

  const sectionAllowed = useMemo(() => {
    if (meLoading || !me) return true
    const required = settingsSectionPermission(section)
    if (!required) return true
    return hasWorkspacePermission(permissions, required, role)
  }, [me, meLoading, permissions, role, section])

  useEffect(() => {
    if (isSettingsSection(sectionParam)) setSection(sectionParam)
  }, [sectionParam])

  const selectSection = (next: SettingsSection) => {
    setSection(next)
    const params = new URLSearchParams(searchParams)
    params.set('section', next)
    setSearchParams(params, { replace: true })
  }

  return (
    <div className="flex h-full min-h-0 w-full flex-1">
      <nav className="w-56 shrink-0 space-y-5 overflow-y-auto border-r p-3">
        {visibleNav.map((group) => (
          <div key={group.title}>
            <p className="text-muted-foreground mb-1.5 px-2 text-[11px] font-semibold tracking-wide uppercase">
              {group.title}
            </p>
            <div className="space-y-0.5">
              {group.items.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => selectSection(item.id)}
                  className={`w-full rounded-md px-2 py-1.5 text-left text-sm transition-colors ${
                    section === item.id
                      ? 'bg-primary/10 text-primary font-medium'
                      : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>
        ))}
      </nav>

      <div className="min-h-0 flex-1 overflow-y-auto">
        <div className="space-y-4 p-6">
          <div>
            <h1 className="text-lg font-semibold">
              {visibleNav.flatMap((g) => g.items).find((i) => i.id === section)?.label ??
              SETTINGS_NAV.flatMap((g) => g.items).find((i) => i.id === section)?.label}
            </h1>
            <p className="text-muted-foreground text-sm">{SETTINGS_SECTION_SUBTITLE[section]}</p>
          </div>
          {sectionAllowed ? (
            <SettingsPanelSwitch section={section} />
          ) : (
            <p className="text-muted-foreground text-sm">
              You do not have permission to view this settings section. Ask an admin to update your
              access under Users and teams.
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
