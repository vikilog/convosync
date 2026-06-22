import { createContext, useContext, type ReactNode } from 'react';
import type { GoogleToolsMainTab } from '../../lib/googleTools';

const GoogleToolsActiveContext = createContext<GoogleToolsMainTab | null>(null);

export function GoogleToolsActiveProvider({
  activeTool,
  children,
}: {
  activeTool: GoogleToolsMainTab | null;
  children: ReactNode;
}) {
  return (
    <GoogleToolsActiveContext.Provider value={activeTool}>{children}</GoogleToolsActiveContext.Provider>
  );
}

export function useGoogleToolsActiveTool() {
  return useContext(GoogleToolsActiveContext);
}
