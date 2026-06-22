import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import App from './App.tsx';
import './index.css';
import { migrateLegacyStorage } from './lib/storageMigration';
import { isLoggedIn } from './lib/session';
import { connectSocket } from './lib/socket';
import { getWorkspaceId } from './lib/api';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 30_000, retry: 1 },
  },
});

function bootstrap() {
  migrateLegacyStorage();
  if (isLoggedIn()) {
    const workspaceId = getWorkspaceId();
    if (workspaceId) connectSocket(workspaceId);
  }

  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </QueryClientProvider>
    </StrictMode>
  );
}

bootstrap();
