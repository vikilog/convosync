import type { ReactNode } from 'react';
import { GoogleToolsAccountBar } from './GoogleToolsAccountBar';
import { useGoogleToolsActiveTool } from './GoogleToolsActiveContext';
import { GoogleToolsToolbarProvider } from './GoogleToolsToolbarContext';

type GoogleToolsLayoutProps = {
  children: ReactNode;
};

export function GoogleToolsLayout({ children }: GoogleToolsLayoutProps) {
  const activeTool = useGoogleToolsActiveTool();
  const hideAccountBar =
    activeTool === 'calendar' || activeTool === 'sheets' || activeTool === 'drive';

  return (
    <GoogleToolsToolbarProvider>
      <div className="flex h-full w-full min-w-0 flex-col overflow-hidden bg-[#F8FAFC]">
        {!hideAccountBar && <GoogleToolsAccountBar />}

        <div className="flex-1 min-h-0 min-w-0 overflow-hidden">{children}</div>
      </div>
    </GoogleToolsToolbarProvider>
  );
}
