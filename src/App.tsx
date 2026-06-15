/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useRef } from 'react';
import { Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { SideNavBar } from './components/SideNavBar';
import {
  SidebarProvider,
  useSidebarOffset,
} from './contexts/SidebarContext';
import { TopNavBar } from './components/TopNavBar';
import { TrialBanner } from './components/TrialBanner';
import { AuthPage } from './components/AuthPage';
import { SignupPage } from './components/SignupPage';
import { ProtectedRoute } from './components/ProtectedRoute';
import { DashboardView } from './components/DashboardView';
import { InboxView } from './components/InboxView';
import { ContactsView } from './components/ContactsView';
import { CampaignsView } from './components/CampaignsView';
import { TemplatesView } from './components/TemplatesView';
import { JourneyView } from './components/JourneyView';
import { AiAgentView } from './components/AiAgentView';
import { ReportsView } from './components/ReportsView';
import { AdsView } from './components/AdsView';
import { FacebookPageView } from './components/FacebookPageView';
import { WhatsAppCallbackPage } from './components/WhatsAppCallbackPage';
import { InstagramCallbackPage } from './components/InstagramCallbackPage';
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
import { UsageCost } from './pages/UsageCost';
import { motion } from 'motion/react';
import { googleToolFromPath, tabFromPath, pathForTab, pathForNewCampaign, isNewCampaignPath, type AppTab } from './routes';
import {
  GOOGLE_TOOL_META,
  isGoogleToolsMainTab,
} from './lib/googleTools';
import { KeepAlive } from './components/KeepAlive';
import { getOnboardingCache, isLoggedIn } from './lib/session';
import { getUserPermissions, getUserRole, getWorkspaceId } from './lib/api';
import { useWorkspaceAccess } from './hooks/useWorkspaceAccess';
import {
  canAccessPath,
  firstAccessibleSettingsPath,
  firstAccessibleTabPath,
} from './lib/workspacePermissions';
import { DocumentSeo } from './components/DocumentSeo';
import { LandingPage } from './components/LandingPage';
import { PrivacyPolicyPage } from './pages/PrivacyPolicyPage';
import { TermsOfServicePage } from './pages/TermsOfServicePage';
import { InboxRealtimeBridge } from './components/InboxRealtimeBridge';
import { OnboardingWizard } from './components/onboarding/OnboardingWizard';
import { OnboardingGuard } from './components/onboarding/OnboardingGuard';

function AppShell() {
  const location = useLocation();
  const navigate = useNavigate();
  const { permissions, role, canPath } = useWorkspaceAccess();
  const activeTab = tabFromPath(location.pathname);
  const [searchQuery, setSearchQuery] = useState<string>('');
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
      navigate(firstAccessibleTabPath(permissions, role), { replace: true });
      return;
    }
  }, [location.pathname, canPath, permissions, role, navigate]);

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
      if (!canAccessPath(location.pathname, permissions, role)) {
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
    if (activeTab === 'templates' && location.pathname.startsWith('/templates/')) {
      return;
    }
    if (activeTab === 'google-tools' && location.pathname.startsWith('/google-tools/')) {
      return;
    }
    const expected = pathForTab(activeTab);
    if (location.pathname !== expected && location.pathname !== '/') {
      navigate(expected, { replace: true });
    }
  }, [activeTab, location.pathname, navigate, permissions, role]);

  const getHeaderTitle = () => {
    switch (activeTab) {
      case 'dashboard':
        return 'Dashboard Overview';
      case 'manager':
        return 'WhatsApp Accounts';
      case 'inbox':
        return 'Inbox';
      case 'contacts':
        return 'Contacts';
      case 'calling':
        return 'WhatsApp Calling';
      case 'campaigns':
        return location.pathname.startsWith('/campaigns/') ? 'Campaign details' : 'Campaigns';
      case 'templates':
        if (location.pathname.includes('/canned')) return 'Canned responses';
        if (location.pathname.includes('/email')) return 'Email templates';
        return 'Message templates';
      case 'journey':
        return 'Journey Workflow Canvas';
      case 'ai-agent':
        return 'AI Agent';
      case 'ctwa':
        return 'Click-to-WhatsApp Ads Analytics';
      case 'facebook':
        return 'Facebook Page Manager';
      case 'pay':
        return 'WhatsApp Pay Settlements';
      case 'shop':
        return 'Workspace Product Catalog';
      case 'integrations':
        return 'Integrations';
      case 'google-tools': {
        const tool = googleToolFromPath(location.pathname);
        const meta =
          tool && isGoogleToolsMainTab(tool) ? GOOGLE_TOOL_META[tool] : null;
        return meta?.label ?? 'Google Tools';
      }
      case 'developers':
        return 'Developer API Console';
      case 'reports':
        return 'Operational Analytics Reports';
      case 'usage-cost':
        return 'Usage & Cost';
      case 'settings':
        return 'Settings';
      default:
        return 'ConvoSync Workspace';
    }
  };

  const headerTitle = getHeaderTitle();

  return (
    <SidebarProvider>
      <AppShellLayout
        headerTitle={headerTitle}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        activeTab={activeTab}
        companyKey={companyKey}
        mountedTabs={mountedTabs}
        navigate={navigate}
      />
    </SidebarProvider>
  );
}

function AppShellLayout({
  headerTitle,
  searchQuery,
  setSearchQuery,
  activeTab,
  companyKey,
  mountedTabs,
  navigate,
}: {
  headerTitle: string;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  activeTab: string;
  companyKey: string;
  mountedTabs: Set<string>;
  navigate: ReturnType<typeof useNavigate>;
}) {
  const sidebarPadding = useSidebarOffset();
  const location = useLocation();
  const campaignCreateWizard = activeTab === 'campaigns' && isNewCampaignPath(location.pathname);

  return (
    <div className="flex min-h-screen bg-slate-50 selection:bg-sky-100">
      <InboxRealtimeBridge />
      <SideNavBar />

      <div
        className="flex h-screen min-h-0 min-w-0 flex-1 flex-col overflow-hidden transition-[padding-left] duration-200 ease-out"
        style={{ paddingLeft: sidebarPadding }}
      >
        <TopNavBar
          title={headerTitle}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          hideSearch={activeTab === 'google-tools'}
          hideTitle={activeTab === 'usage-cost'}
        />
        <div className="h-16 shrink-0" aria-hidden="true" />
        <TrialBanner />

        <main
          className={
            activeTab === 'inbox' || campaignCreateWizard
              ? 'min-h-0 flex-1 overflow-hidden'
              : activeTab === 'google-tools'
                ? 'p-2 md:p-3 flex-1 min-h-0 min-w-0 overflow-hidden'
              : activeTab === 'integrations'
                ? 'px-4 py-2 md:px-5 md:py-3 flex-1 min-h-0 overflow-x-hidden overflow-y-auto'
                : activeTab === 'dashboard' || activeTab === 'usage-cost'
                  ? 'flex-1 min-h-0 overflow-x-hidden overflow-y-auto px-4 py-5 md:px-8 md:py-6'
                  : 'flex-1 min-h-0 overflow-x-hidden overflow-y-auto p-4 md:p-6'
          }
        >
          <motion.div
            key={companyKey}
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.15 }}
            className={
              activeTab === 'inbox' || activeTab === 'google-tools' || campaignCreateWizard
                ? 'h-full min-h-0 min-w-0 overflow-hidden'
                : 'h-full min-h-0'
            }
          >
            {mountedTabs.has('dashboard') && (
              <KeepAlive active={activeTab === 'dashboard'}>
                <DashboardView
                  onAddContact={() => navigate(pathForTab('contacts'))}
                  onNewCampaign={() => navigate(pathForNewCampaign())}
                  onNewJourney={() => navigate(pathForTab('journey'))}
                  onImportCSV={() => navigate(pathForTab('contacts'))}
                />
              </KeepAlive>
            )}

            {mountedTabs.has('inbox') && (
              <KeepAlive active={activeTab === 'inbox'}>
                <InboxView />
              </KeepAlive>
            )}
            {mountedTabs.has('contacts') && (
              <KeepAlive active={activeTab === 'contacts'}>
                <ContactsView />
              </KeepAlive>
            )}
            {mountedTabs.has('campaigns') && (
              <KeepAlive active={activeTab === 'campaigns'}>
                <CampaignsView />
              </KeepAlive>
            )}
            {mountedTabs.has('templates') && (
              <KeepAlive active={activeTab === 'templates'}>
                <TemplatesView />
              </KeepAlive>
            )}
            {mountedTabs.has('journey') && (
              <KeepAlive active={activeTab === 'journey'}>
                <JourneyView />
              </KeepAlive>
            )}
            {mountedTabs.has('ai-agent') && (
              <KeepAlive active={activeTab === 'ai-agent'}>
                <AiAgentView />
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
            {mountedTabs.has('usage-cost') && (
              <KeepAlive active={activeTab === 'usage-cost'}>
                <UsageCost />
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
  return <LandingPage />;
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
    <>
      <DocumentSeo />
      <Routes>
      <Route path="/login" element={<LoginRedirect />} />
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
      <Route path="/privacy" element={<PrivacyPolicyPage />} />
      <Route path="/terms" element={<TermsOfServicePage />} />
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
    </>
  );
}
