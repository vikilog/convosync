import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Blocks, ExternalLink, Loader2 } from 'lucide-react';
import {
  GOOGLE_TOOLS_MAIN_TABS,
  isGoogleToolsMainTab,
  type GoogleToolsMainTab,
} from '../../lib/googleTools';
import { googleToolFromPath, pathForGoogleTool, pathForTab } from '../../routes';
import { useKeepAliveActivation } from '../KeepAlive';
import { GoogleCalendarView } from './GoogleCalendarView';
import { GoogleDriveView } from './drive/GoogleDriveView';
import { GoogleGmailView } from './GoogleGmailView';
import { GoogleMeetView } from './meet/GoogleMeetView';
import { GoogleSheetsView } from './sheets/GoogleSheetsView';
import { useGoogleToolsProducts } from './hooks/useGoogleToolsProducts';
import { GoogleToolsActiveProvider } from './GoogleToolsActiveContext';
import { GoogleToolsLayout } from './GoogleToolsLayout';

function GoogleToolsEmptyState() {
  const navigate = useNavigate();
  return (
    <div className="flex flex-1 items-center justify-center p-8">
      <div className="max-w-md text-center space-y-4">
        <div className="w-14 h-14 mx-auto rounded-2xl bg-[#e8f4ff] flex items-center justify-center">
          <Blocks className="w-7 h-7 text-[#4285F4]" />
        </div>
        <div>
          <h2 className="text-lg font-black text-gray-950">No Google tools connected</h2>
          <p className="text-sm text-gray-500 mt-1">
            Connect Calendar, Gmail, Drive, and other Google products from Integrations.
          </p>
        </div>
        <button
          type="button"
          onClick={() => navigate(pathForTab('integrations'))}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#4285F4] text-white text-sm font-bold hover:bg-[#3367d6] transition-colors"
        >
          Go to Integrations
          <ExternalLink className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

function defaultMainTabPath(connectedMainTabs: GoogleToolsMainTab[]): string {
  const first = GOOGLE_TOOLS_MAIN_TABS.find((tab) => connectedMainTabs.includes(tab));
  return pathForGoogleTool(first ?? 'calendar');
}

function GoogleToolsPage({ tool }: { tool: GoogleToolsMainTab }) {
  switch (tool) {
    case 'calendar':
      return <GoogleCalendarView />;
    case 'sheets':
      return <GoogleSheetsView />;
    case 'drive':
      return <GoogleDriveView />;
    case 'gmail':
      return <GoogleGmailView />;
    case 'meet':
      return <GoogleMeetView />;
    default:
      return null;
  }
}

export function GoogleToolsView() {
  const location = useLocation();
  const navigate = useNavigate();
  const { connectedTools, connectedMainTabs, isLoading, refresh } = useGoogleToolsProducts();

  const slug = googleToolFromPath(location.pathname);
  const activeTool = slug && isGoogleToolsMainTab(slug) ? slug : null;

  useKeepAliveActivation(() => {
    void refresh();
  });

  useEffect(() => {
    if (isLoading) return;
    if (!location.pathname.startsWith('/google-tools')) return;
    if (connectedTools.length === 0) return;

    if (!activeTool) {
      navigate(
        connectedMainTabs.length > 0
          ? defaultMainTabPath(connectedMainTabs)
          : pathForGoogleTool('calendar'),
        { replace: true }
      );
    }
  }, [isLoading, connectedTools.length, connectedMainTabs, activeTool, location.pathname, navigate]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16 text-sm text-gray-400">
        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
        Loading Google tools…
      </div>
    );
  }

  if (connectedTools.length === 0) {
    return (
      <div className="flex h-[calc(100vh-4.5rem)] -m-2 md:-m-3 bg-white border border-slate-200 rounded-2xl overflow-hidden">
        <GoogleToolsEmptyState />
      </div>
    );
  }

  if (!activeTool) {
    return (
      <div className="flex items-center justify-center py-16 text-sm text-gray-400">
        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
        Opening Google tool…
      </div>
    );
  }

  return (
    <GoogleToolsActiveProvider activeTool={activeTool}>
      <div className="flex h-[calc(100vh-4.5rem)] -m-2 md:-m-3 w-full min-w-0 max-w-full bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
        <GoogleToolsLayout>
          <GoogleToolsPage key={activeTool} tool={activeTool} />
        </GoogleToolsLayout>
      </div>
    </GoogleToolsActiveProvider>
  );
}
