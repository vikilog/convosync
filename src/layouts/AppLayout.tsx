import { Suspense } from 'react'
import { Outlet, useLocation } from 'react-router-dom'

import { AppSidebar } from '@/components/app-sidebar'
import { CallingRealtimeBridge } from '@/components/calling/CallingRealtimeBridge'
import { PlivoCallWidget } from '@/components/calling/PlivoCallWidget'
import { InboxRealtimeBridge } from '@/components/inbox/InboxRealtimeBridge'
import { SectionKeepAliveSlots } from '@/components/SectionKeepAliveSlots'
import { SocialListeningRealtimeBridge } from '@/components/social-listening/SocialListeningRealtimeBridge'
import { TeamChatRealtimeBridge } from '@/components/team-chat/TeamChatRealtimeBridge'
import { PageSkeleton } from '@/components/PageSkeleton'
import { PlivoCallProvider } from '@/lib/plivoCallClient'
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar'

const FULL_BLEED_PREFIXES = [
  '/inbox',
  '/team-chat',
  '/contacts',
  '/campaigns',
  '/templates',
  '/automations',
  '/leads',
  '/data',
  '/settings',
  '/ai-agent',
  '/social-listening',
  '/media-gallery',
]

/** The persistent chrome (sidebar) around every authenticated route. */
export function AppLayout() {
  const location = useLocation()
  const isFullBleed = FULL_BLEED_PREFIXES.some((prefix) => location.pathname.startsWith(prefix))

  return (
    <PlivoCallProvider>
      <SidebarProvider className="h-svh overflow-hidden">
        <InboxRealtimeBridge />
        <TeamChatRealtimeBridge />
        <SocialListeningRealtimeBridge />
        <CallingRealtimeBridge />
        <AppSidebar />
        <SidebarInset className="h-svh overflow-hidden">
          <div className={isFullBleed ? 'flex min-h-0 flex-1' : 'min-h-0 flex-1 overflow-y-auto'}>
            <SectionKeepAliveSlots>
              <Suspense fallback={<PageSkeleton />}>
                <Outlet />
              </Suspense>
            </SectionKeepAliveSlots>
          </div>
        </SidebarInset>
      </SidebarProvider>
      <PlivoCallWidget />
    </PlivoCallProvider>
  )
}
