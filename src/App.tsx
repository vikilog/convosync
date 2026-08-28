/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useRef } from 'react';
import { Routes, Route, Navigate, useLocation, useNavigate, useParams } from 'react-router-dom';
import { SideNavBar } from './components/SideNavBar';
import { SidebarProvider } from './contexts/SidebarContext';
import { TrialBanner } from './components/TrialBanner';
import { ImpersonatePage } from './components/ImpersonatePage';
import { AuthPage } from './components/AuthPage';
import { SignupPage } from './components/SignupPage';
import { ProtectedRoute } from './components/ProtectedRoute';
import { DashboardView } from './components/DashboardView';
import { InboxView } from './components/InboxView';
import { TeamChatView } from './components/team-chat/TeamChatView';
import { ContactsView } from './components/ContactsView';
import { CampaignsView } from './components/CampaignsView';
import { TemplatesView } from './components/TemplatesView';
import { AutomationsRouter } from './components/AutomationsRouter';
import { AiAgentView } from './components/AiAgentView';
import { MediaGalleryView } from './components/MediaGalleryView';
import { ReportsView } from './components/ReportsView';
import { AdsView } from './components/AdsView';
import { FacebookPageView } from './components/FacebookPageView';
import { WhatsAppCallbackPage } from './components/WhatsAppCallbackPage';
import { InstagramCallbackPage } from './components/InstagramCallbackPage';
import { InstagramBusinessLoginCallbackPage } from './components/InstagramBusinessLoginCallbackPage';
import { FacebookCallbackPage } from './components/FacebookCallbackPage';
import { MetaAdsCallbackPage } from './components/MetaAdsCallbackPage';
import { GoogleCallbackPage } from './components/GoogleCallbackPage';
import { CallingView } from './components/CallingView';
import { PayView } from './components/PayView';
import { ShopView } from './components/ShopView';
import { IntegrationsView } from './components/IntegrationsView';
import { GoogleToolsView } from './components/google-tools/GoogleToolsView';
import { DevelopersView } from './components/DevelopersView';
import { SettingsView } from './components/SettingsView';
import {
  SocialListeningDashboardView,
  SocialListeningFeedView,
  SocialListeningMediaDetailView,
  SocialListeningReviewView,
} from './components/social-listening';
import { LeadsKanbanView } from './components/leads';
import { DataTablesView } from './components/data-tables/DataTablesView';
import { motion } from 'motion/react';
import { tabFromPath, pathForTab, pathForNewCampaign, isNewCampaignPath, type AppTab } from './routes';
import { KeepAlive } from './components/KeepAlive';
import { RequireConnectedChannel } from './components/RequireConnectedChannel';
import { getOnboardingCache, isLoggedIn } from './lib/session';
import { getUserPermissions, getUserRole, getWorkspaceId } from './lib/api';
import { useWorkspaceAccess } from './hooks/useWorkspaceAccess';
import {
  canAccessPath,
  firstAccessibleSettingsPath,
  firstAccessibleTabPath,
} from './lib/workspacePermissions';
import { DocumentSeo } from './components/DocumentSeo';
import { AnalyticsRoot } from './components/analytics/AnalyticsRoot';
import { landingPath } from './lib/publicUrls';
import { InboxRealtimeBridge } from './components/InboxRealtimeBridge';
import { TeamChatRealtimeBridge } from './components/team-chat/TeamChatRealtimeBridge';
import { SocialListeningRealtimeBridge } from './components/social-listening/SocialListeningRealtimeBridge';
import { CallRealtimeBridge } from './components/calling/CallRealtimeBridge';
import { CallPage } from './components/calling/CallPage';
import { CallShortRedirectPage } from './components/calling/CallShortRedirectPage';
import { OnboardingWizard } from './components/onboarding/OnboardingWizard';
import { OnboardingGuard } from './components/onboarding/OnboardingGuard';
import { TooltipProvider } from './components/ui/tooltip';
import { Toaster } from './components/ui/sonner';

function LegacyWhatsAppAutomationRedirect() {
  const { id } = useParams<{ id: string }>();
  if (!id || id === 'gallery') {
    return <Navigate to="/automations/whatsapp-automation/gallery" replace />;
  }
  return <Navigate to={`/automations/whatsapp-automation/${encodeURIComponent(id)}`} replace />;
}

function LegacyInstagramAutomationRedirect() {
  const { id } = useParams<{ id: string }>();
  if (!id) return <Navigate to="/automations" replace />;
  return <Navigate to={`/automations/instagram-automation/${encodeURIComponent(id)}`} replace />;
}

function AppShell() {
  const location = useLocation();
  const navigate = useNavigate();
  const { permissions, role, canPath, firstAccessiblePath, planFeatures } = useWorkspaceAccess();
  const activeTab = tabFromPath(location.pathname);
  const [mountedTabs, setMountedTabs] = useState<Set<AppTab>>(() => new Set([activeTab]));
  const companyKey = getWorkspaceId() ?? 'company';
  const prevCompanyKey = useRef(companyKey);

  useEffect(() => {
    if (prevCompanyKey.current !== companyKey) {
      prevCompanyKey.current = companyKey;
      setMountedTabs(new Set([activeTab]));
      return;
    }
    setMountedTabs((prev) => {
      if (prev.has(activeTab)) return prev;
      const next = new Set(prev);
      next.add(activeTab);
      return next;
    });
  }, [activeTab, companyKey]);

  useEffect(() => {
    if (!canPath(location.pathname)) {
      navigate(firstAccessiblePath(), { replace: true });
      return;
    }
  }, [location.pathname, canPath, firstAccessiblePath, navigate]);

  useEffect(() => {
    if (location.pathname === '/manager' || location.pathname === '/manager/') {
      const params = new URLSearchParams(location.search);
      params.set('channel', 'whatsapp');
      navigate(`/integrations?${params.toString()}`, { replace: true });
    }
  }, [location.pathname, location.search, navigate]);

  useEffect(() => {
    if (activeTab === 'settings') {
      if (
        location.pathname === '/settings' ||
        location.pathname === '/settings/' ||
        !location.pathname.startsWith('/settings/')
      ) {
        navigate(firstAccessibleSettingsPath(permissions, role), { replace: true });
        return;
      }
      if (!canAccessPath(location.pathname, permissions, role, planFeatures)) {
        navigate(firstAccessibleSettingsPath(permissions, role), { replace: true });
      }
      return;
    }
    if (activeTab === 'ai-agent' && location.pathname.startsWith('/ai-agent/')) {
      return;
    }
    if (activeTab === 'campaigns' && location.pathname.startsWith('/campaigns/')) {
      return;
    }
    if (activeTab === 'contacts' && location.pathname.startsWith('/contacts/')) {
      return;
    }
    if (activeTab === 'leads' && location.pathname.startsWith('/leads/')) {
      return;
    }
    if (activeTab === 'automations' && location.pathname.startsWith('/automations')) {
      return;
    }
    if (activeTab === 'templates' && location.pathname.startsWith('/templates/')) {
      return;
    }
    if (activeTab === 'google-tools' && location.pathname.startsWith('/google-tools/')) {
      return;
    }
    if (activeTab === 'integrations' && location.pathname.startsWith('/integrations/')) {
      return;
    }
    if (activeTab === 'social-listening') {
      // Keep /social-listening and /social-listening/* on this tab (don't bounce to pathForTab)
      if (location.pathname.startsWith('/social-listening')) {
        return;
      }
    }
    const expected = pathForTab(activeTab);
    if (location.pathname !== expected && location.pathname !== '/') {
      navigate(expected, { replace: true });
    }
  }, [activeTab, location.pathname, navigate, permissions, role, planFeatures]);

  return (
    <SidebarProvider>
      <AppShellLayout
        activeTab={activeTab}
        companyKey={companyKey}
        mountedTabs={mountedTabs}
        navigate={navigate}
      />
    </SidebarProvider>
  );
}

function AppShellLayout({
  activeTab,
  companyKey,
  mountedTabs,
  navigate,
}: {
  activeTab: string;
  companyKey: string;
  mountedTabs: Set<string>;
  navigate: ReturnType<typeof useNavigate>;
}) {
  const location = useLocation();
  const campaignCreateWizard = activeTab === 'campaigns' && isNewCampaignPath(location.pathname);

  return (
    <div
      className="flex min-h-screen bg-white selection:bg-primary/15"
    >
      <InboxRealtimeBridge />
      <TeamChatRealtimeBridge />
      <SocialListeningRealtimeBridge />
      <CallRealtimeBridge />
      <SideNavBar />

      {/* ponytail: sidebar is lg:static in-flow — no paddingLeft offset (was causing a gutter gap) */}
      <div className="flex h-screen min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
        <TrialBanner />

        <main
          className={
            activeTab === 'inbox' ||
            activeTab === 'team-chat' ||
            activeTab === 'contacts' ||
            campaignCreateWizard
              ? 'min-h-0 flex-1 overflow-hidden px-0'
              : activeTab === 'google-tools' ||
                  activeTab === 'templates' ||
                  activeTab === 'leads' ||
                  activeTab === 'data' ||
                  activeTab === 'social-listening' ||
                  activeTab === 'automations'
                ? 'px-2 md:px-4 py-2 md:py-3 flex-1 min-h-0 min-w-0 overflow-hidden'
                : 'flex-1 min-h-0 overflow-x-hidden overflow-y-auto px-2 md:px-4 pt-2 md:pt-3'
          }
        >
          <motion.div
            key={companyKey}
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.15 }}
            className={
              activeTab === 'inbox' ||
              activeTab === 'team-chat' ||
              activeTab === 'contacts' ||
              activeTab === 'google-tools' ||
              activeTab === 'templates' ||
              activeTab === 'leads' ||
              activeTab === 'data' ||
              activeTab === 'social-listening' ||
              activeTab === 'automations' ||
              campaignCreateWizard
                ? 'h-full min-h-0 min-w-0 overflow-hidden'
                : 'h-full min-h-0 w-full'
            }
          >
            {mountedTabs.has('dashboard') && (
              <KeepAlive active={activeTab === 'dashboard'}>
                <DashboardView
                  onAddContact={() => navigate(pathForTab('contacts'))}
                  onNewCampaign={() => navigate(pathForNewCampaign())}
                  onNewJourney={() => navigate(pathForTab('automations'))}
                  onImportCSV={() => navigate(`${pathForTab('contacts')}?import=1`)}
                />
              </KeepAlive>
            )}

            {mountedTabs.has('inbox') && (
              <KeepAlive active={activeTab === 'inbox'}>
                <InboxView />
              </KeepAlive>
            )}
            {mountedTabs.has('team-chat') && (
              <KeepAlive active={activeTab === 'team-chat'}>
                <TeamChatView />
              </KeepAlive>
            )}
            {mountedTabs.has('contacts') && (
              <KeepAlive active={activeTab === 'contacts'}>
                <ContactsView />
              </KeepAlive>
            )}
            {mountedTabs.has('campaigns') && (
              <KeepAlive active={activeTab === 'campaigns'}>
                <RequireConnectedChannel
                  anyOf={['whatsapp', 'email']}
                  title="Connect WhatsApp or Email first"
                  description="Campaigns need WhatsApp or Email before you can create broadcasts."
                  connectChannel="whatsapp"
                >
                  <CampaignsView />
                </RequireConnectedChannel>
              </KeepAlive>
            )}
            {mountedTabs.has('templates') && (
              <KeepAlive active={activeTab === 'templates'}>
                <RequireConnectedChannel
                  anyOf={['whatsapp', 'email']}
                  title="Connect WhatsApp or Email first"
                  description="Templates need WhatsApp or Email before you can create and manage them."
                  connectChannel="whatsapp"
                >
                  <TemplatesView />
                </RequireConnectedChannel>
              </KeepAlive>
            )}
            {mountedTabs.has('automations') && (
              <KeepAlive active={activeTab === 'automations'}>
                <AutomationsRouter />
              </KeepAlive>
            )}
            {mountedTabs.has('ai-agent') && (
              <KeepAlive active={activeTab === 'ai-agent'}>
                <AiAgentView />
              </KeepAlive>
            )}
            {mountedTabs.has('media-gallery') && (
              <KeepAlive active={activeTab === 'media-gallery'}>
                <MediaGalleryView />
              </KeepAlive>
            )}
            {mountedTabs.has('social-listening') && (
              <KeepAlive active={activeTab === 'social-listening'}>
                <RequireConnectedChannel
                  anyOf={['instagram', 'facebook']}
                  title="Connect Instagram or a Facebook Page first"
                  description="Social Listening needs a connected Instagram account or Facebook Page to classify and triage comments."
                  connectChannel="instagram"
                >
                  {location.pathname.startsWith('/social-listening/review') ? (
                    <SocialListeningReviewView />
                  ) : location.pathname.startsWith('/social-listening/media/') ? (
                    <SocialListeningMediaDetailView />
                  ) : location.pathname.startsWith('/social-listening/content') ? (
                    <SocialListeningFeedView />
                  ) : (
                    <SocialListeningDashboardView />
                  )}
                </RequireConnectedChannel>
              </KeepAlive>
            )}
            {mountedTabs.has('leads') && (
              <KeepAlive active={activeTab === 'leads'}>
                <RequireConnectedChannel>
                  <LeadsKanbanView />
                </RequireConnectedChannel>
              </KeepAlive>
            )}
            {mountedTabs.has('data') && (
              <KeepAlive active={activeTab === 'data'}>
                <DataTablesView />
              </KeepAlive>
            )}
            {mountedTabs.has('ctwa') && (
              <KeepAlive active={activeTab === 'ctwa'}>
                <AdsView />
              </KeepAlive>
            )}
            {mountedTabs.has('facebook') && (
              <KeepAlive active={activeTab === 'facebook'}>
                <FacebookPageView />
              </KeepAlive>
            )}
            {mountedTabs.has('reports') && (
              <KeepAlive active={activeTab === 'reports'}>
                <ReportsView />
              </KeepAlive>
            )}
            {mountedTabs.has('calling') && (
              <KeepAlive active={activeTab === 'calling'}>
                <CallingView />
              </KeepAlive>
            )}
            {mountedTabs.has('pay') && (
              <KeepAlive active={activeTab === 'pay'}>
                <PayView />
              </KeepAlive>
            )}
            {mountedTabs.has('shop') && (
              <KeepAlive active={activeTab === 'shop'}>
                <ShopView />
              </KeepAlive>
            )}
            {mountedTabs.has('integrations') && (
              <KeepAlive active={activeTab === 'integrations'}>
                <IntegrationsView isActive={activeTab === 'integrations'} />
              </KeepAlive>
            )}
            {mountedTabs.has('google-tools') && (
              <KeepAlive active={activeTab === 'google-tools'}>
                <GoogleToolsView />
              </KeepAlive>
            )}
            {mountedTabs.has('developers') && (
              <KeepAlive active={activeTab === 'developers'}>
                <DevelopersView />
              </KeepAlive>
            )}
            {mountedTabs.has('settings') && (
              <KeepAlive active={activeTab === 'settings'}>
                <SettingsView />
              </KeepAlive>
            )}
          </motion.div>
        </main>
      </div>
    </div>
  );
}

function MarketingRedirect({ path }: { path: string }) {
  // Without VITE_LANDING_URL, fall back to console login (avoid redirect loops).
  const href = landingPath(path, '/login');
  useEffect(() => {
    if (href.startsWith('http')) {
      window.location.replace(href);
    }
  }, [href]);

  if (href.startsWith('http')) {
    return (
      <div className="flex min-h-screen items-center justify-center text-sm text-slate-600">
        Redirecting…
      </div>
    );
  }
  return <Navigate to={href} replace />;
}

function HomeRoute() {
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  if (params.get('code') || params.get('error')) {
    return <Navigate to={`/google/callback${location.search}`} replace />;
  }
  if (isLoggedIn()) {
    const cache = getOnboardingCache();
    if (cache && !cache.onboardingCompleted) {
      return <Navigate to="/onboarding" replace />;
    }
    return (
      <Navigate to={firstAccessibleTabPath(getUserPermissions(), getUserRole())} replace />
    );
  }
  return <Navigate to="/login" replace />;
}

function LoginRedirect() {
  const location = useLocation();
  if (isLoggedIn()) {
    const from = (location.state as { from?: string } | null)?.from;
    const cache = getOnboardingCache();
    const fromOnboarding = from === '/onboarding' || from?.startsWith('/onboarding?');
    if ((cache && !cache.onboardingCompleted) || fromOnboarding) {
      return <Navigate to="/onboarding" replace />;
    }
    const fallback = firstAccessibleTabPath(getUserPermissions(), getUserRole());
    const target =
      from && from !== '/login' && canAccessPath(from, getUserPermissions(), getUserRole())
        ? from
        : fallback;
    return <Navigate to={target} replace />;
  }
  return <AuthPage />;
}

function SignupRedirect() {
  if (isLoggedIn()) {
    const cache = getOnboardingCache();
    if (cache && !cache.onboardingCompleted) {
      return <Navigate to="/onboarding" replace />;
    }
    return (
      <Navigate to={firstAccessibleTabPath(getUserPermissions(), getUserRole())} replace />
    );
  }
  return <SignupPage />;
}

function NotFoundRedirect() {
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  if (params.get('code') || params.get('error')) {
    return <Navigate to={`/google/callback${location.search}`} replace />;
  }
  return <Navigate to="/" replace />;
}

export default function App() {
  return (
    <TooltipProvider delayDuration={200}>
      <DocumentSeo />
      <AnalyticsRoot />
      <Toaster position="top-right" />
      <Routes>
      <Route path="/login" element={<LoginRedirect />} />
      <Route path="/c/:code" element={<CallShortRedirectPage />} />
      <Route path="/call/:callId" element={<CallPage />} />
      <Route path="/auth/impersonate" element={<ImpersonatePage />} />
      <Route path="/signup" element={<SignupRedirect />} />
      <Route
        path="/onboarding"
        element={
          <ProtectedRoute>
            <OnboardingWizard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/whatsapp/callback"
        element={
          <ProtectedRoute>
            <WhatsAppCallbackPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/instagram/callback"
        element={
          <ProtectedRoute>
            <InstagramCallbackPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/instagram/business-login/callback"
        element={
          <ProtectedRoute>
            <InstagramBusinessLoginCallbackPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/facebook/callback"
        element={
          <ProtectedRoute>
            <FacebookCallbackPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/meta-ads/callback"
        element={
          <ProtectedRoute>
            <MetaAdsCallbackPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/google/callback"
        element={
          <ProtectedRoute>
            <GoogleCallbackPage />
          </ProtectedRoute>
        }
      />
      <Route path="/" element={<HomeRoute />} />
      <Route path="/privacy" element={<MarketingRedirect path="/privacy" />} />
      <Route path="/terms" element={<MarketingRedirect path="/terms" />} />
      <Route
        path="/ai-agent/*"
        element={
          <ProtectedRoute>
            <OnboardingGuard>
              <AppShell />
            </OnboardingGuard>
          </ProtectedRoute>
        }
      />
      <Route
        path="/settings/*"
        element={
          <ProtectedRoute>
            <OnboardingGuard>
              <AppShell />
            </OnboardingGuard>
          </ProtectedRoute>
        }
      />
      <Route
        path="/campaigns/*"
        element={
          <ProtectedRoute>
            <OnboardingGuard>
              <AppShell />
            </OnboardingGuard>
          </ProtectedRoute>
        }
      />
      <Route
        path="/contacts/*"
        element={
          <ProtectedRoute>
            <OnboardingGuard>
              <AppShell />
            </OnboardingGuard>
          </ProtectedRoute>
        }
      />
      <Route
        path="/leads/*"
        element={
          <ProtectedRoute>
            <OnboardingGuard>
              <AppShell />
            </OnboardingGuard>
          </ProtectedRoute>
        }
      />
      <Route
        path="/automations/*"
        element={
          <ProtectedRoute>
            <OnboardingGuard>
              <AppShell />
            </OnboardingGuard>
          </ProtectedRoute>
        }
      />
      {/* Legacy builder URLs → nested under /automations */}
      <Route path="/journey/gallery" element={<Navigate to="/automations/whatsapp-automation/gallery" replace />} />
      <Route path="/journey/:id" element={<LegacyWhatsAppAutomationRedirect />} />
      <Route path="/journey" element={<Navigate to="/automations" replace />} />
      <Route path="/instagram-automation/:id" element={<LegacyInstagramAutomationRedirect />} />
      <Route path="/instagram-automation" element={<Navigate to="/automations" replace />} />
      {/* Usage moved into Settings */}
      <Route path="/usage-cost" element={<Navigate to="/settings/usage" replace />} />
      <Route
        path="/templates/*"
        element={
          <ProtectedRoute>
            <OnboardingGuard>
              <AppShell />
            </OnboardingGuard>
          </ProtectedRoute>
        }
      />
      <Route
        path="/google-tools/*"
        element={
          <ProtectedRoute>
            <OnboardingGuard>
              <AppShell />
            </OnboardingGuard>
          </ProtectedRoute>
        }
      />
      <Route
        path="/integrations/*"
        element={
          <ProtectedRoute>
            <OnboardingGuard>
              <AppShell />
            </OnboardingGuard>
          </ProtectedRoute>
        }
      />
      {/* Nested review URL + aliases — must mount AppShell (else * → / → inbox) */}
      <Route
        path="/social-listening/*"
        element={
          <ProtectedRoute>
            <OnboardingGuard>
              <AppShell />
            </OnboardingGuard>
          </ProtectedRoute>
        }
      />
      <Route
        path="/:tab"
        element={
          <ProtectedRoute>
            <OnboardingGuard>
              <AppShell />
            </OnboardingGuard>
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<NotFoundRedirect />} />
      </Routes>
    </TooltipProvider>
  );
}
