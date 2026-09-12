import { lazy } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'

import { ErrorBoundary } from '@/components/common/ErrorBoundary'
import { OnboardingGuard } from '@/components/onboarding/OnboardingGuard'
import { AppLayout } from '@/layouts/AppLayout'
import { RequireAuth } from '@/layouts/RequireAuth'
import { RequireGuest } from '@/layouts/RequireGuest'
import { Toaster } from '@/components/ui/sonner'
import { TooltipProvider } from '@/components/ui/tooltip'

const LoginPage = lazy(() => import('@/pages/LoginPage').then((m) => ({ default: m.LoginPage })))
const SignupPage = lazy(() => import('@/pages/SignupPage').then((m) => ({ default: m.SignupPage })))
const NotFoundPage = lazy(() => import('@/pages/NotFoundPage').then((m) => ({ default: m.NotFoundPage })))

const DashboardRoute = lazy(() =>
  import('@/pages/routes/DashboardRoute').then((m) => ({ default: m.DashboardRoute }))
)
const InboxPage = lazy(() => import('@/pages/InboxPage').then((m) => ({ default: m.InboxPage })))
const TeamChatPage = lazy(() => import('@/pages/TeamChatPage').then((m) => ({ default: m.TeamChatPage })))
const ContactsPage = lazy(() => import('@/pages/ContactsPage').then((m) => ({ default: m.ContactsPage })))
const ContactDetailRoute = lazy(() =>
  import('@/pages/routes/ContactDetailRoute').then((m) => ({ default: m.ContactDetailRoute }))
)
const CallingPage = lazy(() => import('@/pages/CallingPage').then((m) => ({ default: m.CallingPage })))
const CallDetailPage = lazy(() =>
  import('@/pages/CallDetailPage').then((m) => ({ default: m.CallDetailPage }))
)
const CallingSettingsPage = lazy(() =>
  import('@/pages/CallingSettingsPage').then((m) => ({ default: m.CallingSettingsPage }))
)
const CampaignsPage = lazy(() => import('@/pages/CampaignsPage').then((m) => ({ default: m.CampaignsPage })))
const CampaignWizardPage = lazy(() =>
  import('@/pages/CampaignWizardPage').then((m) => ({ default: m.CampaignWizardPage }))
)
const CampaignDetailRoute = lazy(() =>
  import('@/pages/routes/CampaignDetailRoute').then((m) => ({ default: m.CampaignDetailRoute }))
)
const TemplatesPage = lazy(() => import('@/pages/TemplatesPage').then((m) => ({ default: m.TemplatesPage })))
const EmailTemplateBuilderPage = lazy(() =>
  import('@/pages/EmailTemplateBuilderPage').then((m) => ({ default: m.EmailTemplateBuilderPage }))
)
const AutomationsPage = lazy(() =>
  import('@/pages/AutomationsPage').then((m) => ({ default: m.AutomationsPage }))
)
const AutomationBuilderRoute = lazy(() =>
  import('@/pages/routes/AutomationBuilderRoute').then((m) => ({ default: m.AutomationBuilderRoute }))
)
const AutomationGalleryRoute = lazy(() =>
  import('@/pages/routes/AutomationGalleryRoute').then((m) => ({ default: m.AutomationGalleryRoute }))
)
const AIAgentsPage = lazy(() => import('@/pages/AIAgentsPage').then((m) => ({ default: m.AIAgentsPage })))
const AgentDetailRoute = lazy(() =>
  import('@/pages/routes/AgentDetailRoute').then((m) => ({ default: m.AgentDetailRoute }))
)
const AgentSkillRoute = lazy(() =>
  import('@/pages/routes/AgentSkillRoute').then((m) => ({ default: m.AgentSkillRoute }))
)
const SocialListeningPage = lazy(() =>
  import('@/pages/SocialListeningPage').then((m) => ({ default: m.SocialListeningPage }))
)
const LeadsPage = lazy(() => import('@/pages/LeadsPage').then((m) => ({ default: m.LeadsPage })))
const DataTablesPage = lazy(() =>
  import('@/pages/DataTablesPage').then((m) => ({ default: m.DataTablesPage }))
)
const DataTableDetailRoute = lazy(() =>
  import('@/pages/routes/DataTableDetailRoute').then((m) => ({ default: m.DataTableDetailRoute }))
)
const MediaGalleryPage = lazy(() =>
  import('@/pages/MediaGalleryPage').then((m) => ({ default: m.MediaGalleryPage }))
)
const IntegrationsPage = lazy(() =>
  import('@/pages/IntegrationsPage').then((m) => ({ default: m.IntegrationsPage }))
)
const InstagramPage = lazy(() =>
  import('@/pages/InstagramPage').then((m) => ({ default: m.InstagramPage }))
)
const MessengerPage = lazy(() =>
  import('@/pages/MessengerPage').then((m) => ({ default: m.MessengerPage }))
)
const VirtualNumberPage = lazy(() =>
  import('@/pages/VirtualNumberPage').then((m) => ({ default: m.VirtualNumberPage }))
)
const SettingsPage = lazy(() => import('@/pages/SettingsPage').then((m) => ({ default: m.SettingsPage })))
const OnboardingPage = lazy(() =>
  import('@/pages/OnboardingPage').then((m) => ({ default: m.OnboardingPage }))
)
const DevelopersPage = lazy(() =>
  import('@/pages/DevelopersPage').then((m) => ({ default: m.DevelopersPage }))
)
const ReportsPage = lazy(() => import('@/pages/ReportsPage').then((m) => ({ default: m.ReportsPage })))
const PayPage = lazy(() => import('@/pages/PayPage').then((m) => ({ default: m.PayPage })))
const MetaConnectCallbackRoute = lazy(() =>
  import('@/pages/routes/MetaConnectCallbackRoute').then((m) => ({ default: m.MetaConnectCallbackRoute }))
)
const DirectConnectCallbackRoute = lazy(() =>
  import('@/pages/routes/DirectConnectCallbackRoute').then((m) => ({ default: m.DirectConnectCallbackRoute }))
)
const InstagramBusinessLoginCallbackRoute = lazy(() =>
  import('@/pages/routes/InstagramBusinessLoginCallbackRoute').then((m) => ({
    default: m.InstagramBusinessLoginCallbackRoute,
  }))
)

function App() {
  return (
    <TooltipProvider delayDuration={200}>
      <Toaster />
      <ErrorBoundary>
      <Routes>
        <Route
          path="/login"
          element={
            <RequireGuest>
              <LoginPage />
            </RequireGuest>
          }
        />
        <Route
          path="/signup"
          element={
            <RequireGuest>
              <SignupPage />
            </RequireGuest>
          }
        />

        <Route
          path="/instagram/callback"
          element={
            <RequireAuth>
              <MetaConnectCallbackRoute channel="instagram" />
            </RequireAuth>
          }
        />
        <Route
          path="/facebook/callback"
          element={
            <RequireAuth>
              <MetaConnectCallbackRoute channel="facebook" />
            </RequireAuth>
          }
        />
        <Route
          path="/google/callback"
          element={
            <RequireAuth>
              <DirectConnectCallbackRoute channel="google" />
            </RequireAuth>
          }
        />
        <Route
          path="/meta-ads/callback"
          element={
            <RequireAuth>
              <DirectConnectCallbackRoute channel="meta_ads" />
            </RequireAuth>
          }
        />
        <Route
          path="/instagram/business-login/callback"
          element={
            <RequireAuth>
              <InstagramBusinessLoginCallbackRoute />
            </RequireAuth>
          }
        />
        <Route
          path="/onboarding"
          element={
            <RequireAuth>
              <OnboardingPage />
            </RequireAuth>
          }
        />

        <Route
          element={
            <RequireAuth>
              <OnboardingGuard>
                <AppLayout />
              </OnboardingGuard>
            </RequireAuth>
          }
        >
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<DashboardRoute />} />
          <Route path="/inbox" element={<InboxPage />} />
          <Route path="/team-chat" element={<TeamChatPage />} />
          <Route path="/contacts" element={<ContactsPage />} />
          <Route path="/contacts/dashboard" element={<ContactsPage />} />
          <Route path="/contacts/list" element={<ContactsPage />} />
          <Route path="/contacts/:contactId" element={<ContactDetailRoute />} />
          <Route path="/calling" element={<CallingPage />} />
          <Route path="/calling/settings/:id" element={<CallingSettingsPage />} />
          <Route path="/calling/:numberId/:callId" element={<CallDetailPage />} />
          <Route path="/campaigns" element={<CampaignsPage />} />
          <Route path="/campaigns/new" element={<CampaignWizardPage />} />
          <Route path="/campaigns/:id" element={<CampaignDetailRoute />} />
          <Route path="/templates" element={<TemplatesPage />} />
          <Route path="/templates/email/new/builder" element={<EmailTemplateBuilderPage />} />
          <Route path="/templates/email/:id/builder" element={<EmailTemplateBuilderPage />} />
          <Route path="/automations" element={<AutomationsPage />} />
          <Route path="/automations/whatsapp-automation/gallery" element={<AutomationGalleryRoute />} />
          <Route path="/automations/whatsapp-automation/:automationId" element={<AutomationBuilderRoute />} />
          <Route
            path="/automations/instagram-automation/:automationId"
            element={<AutomationBuilderRoute />}
          />
          <Route path="/automations/:automationId" element={<AutomationBuilderRoute />} />
          <Route path="/ai-agent" element={<AIAgentsPage />} />
          <Route path="/ai-agent/:agentId" element={<AgentDetailRoute />} />
          <Route path="/ai-agent/:agentId/:section" element={<AgentDetailRoute />} />
          <Route path="/ai-agent/:agentId/skills/:skillId" element={<AgentSkillRoute />} />
          <Route path="/social-listening" element={<SocialListeningPage />} />
          <Route path="/social-listening/media/:mediaId" element={<SocialListeningPage />} />
          <Route path="/leads" element={<LeadsPage />} />
          <Route path="/leads/:funnelId" element={<LeadsPage />} />
          <Route path="/data" element={<DataTablesPage />} />
          <Route path="/data/:tableId" element={<DataTableDetailRoute />} />
          <Route path="/media-gallery" element={<MediaGalleryPage />} />
          <Route path="/integrations" element={<IntegrationsPage />} />
          <Route path="/integrations/virtual-number" element={<VirtualNumberPage />} />
          <Route path="/instagram" element={<InstagramPage />} />
          <Route path="/messenger" element={<MessengerPage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/developers" element={<DevelopersPage />} />
          <Route path="/reports" element={<ReportsPage />} />
          <Route path="/pay" element={<PayPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Routes>
      </ErrorBoundary>
    </TooltipProvider>
  )
}

export default App
