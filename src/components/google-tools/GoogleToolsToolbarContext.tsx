import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import type { GoogleToolsMainTab } from '../../lib/googleTools';
import { useGoogleToolsActiveTool } from './GoogleToolsActiveContext';

export type GoogleToolsToolbarState = {
  tool: GoogleToolsMainTab;
  email?: string | null;
  lastSyncAt?: string | null;
  syncing?: boolean;
  onRefresh?: () => void | Promise<void>;
  onSync?: () => void | Promise<void>;
};

type GoogleToolsToolbarContextValue = {
  toolbar: GoogleToolsToolbarState | null;
  setToolbar: (state: GoogleToolsToolbarState | null) => void;
};

const GoogleToolsToolbarContext = createContext<GoogleToolsToolbarContextValue | null>(null);

export function GoogleToolsToolbarProvider({ children }: { children: ReactNode }) {
  const [toolbar, setToolbarState] = useState<GoogleToolsToolbarState | null>(null);
  const setToolbar = useCallback((state: GoogleToolsToolbarState | null) => {
    setToolbarState(state);
  }, []);

  const value = useMemo(() => ({ toolbar, setToolbar }), [toolbar, setToolbar]);

  return (
    <GoogleToolsToolbarContext.Provider value={value}>{children}</GoogleToolsToolbarContext.Provider>
  );
}

export function useGoogleToolsToolbar() {
  const ctx = useContext(GoogleToolsToolbarContext);
  if (!ctx) {
    throw new Error('useGoogleToolsToolbar must be used within GoogleToolsToolbarProvider');
  }
  return ctx;
}

/** Register per-tool refresh/sync handlers for the shared account bar. */
export function useRegisterGoogleToolsToolbar(state: GoogleToolsToolbarState | null) {
  const { setToolbar } = useGoogleToolsToolbar();
  const activeTool = useGoogleToolsActiveTool();

  const email = state?.email ?? null;
  const lastSyncAt = state?.lastSyncAt ?? null;
  const syncing = state?.syncing ?? false;
  const tool = state?.tool;
  const onRefresh = state?.onRefresh;
  const onSync = state?.onSync;

  useEffect(() => {
    if (!tool || activeTool !== tool) {
      return;
    }
    setToolbar({
      tool,
      email,
      lastSyncAt,
      syncing,
      onRefresh,
      onSync,
    });
    return () => setToolbar(null);
  }, [activeTool, tool, email, lastSyncAt, syncing, onRefresh, onSync, setToolbar]);
}
