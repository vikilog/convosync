import { Loader2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { api, setToken, setWorkspaceId } from '../lib/api';
import { applyAuthSession } from '../lib/session';
import { connectSocket } from '../lib/socket';
import { pathForTab } from '../routes';

export function ImpersonatePage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const token = searchParams.get('token');
    const workspaceId = searchParams.get('workspaceId');
    if (!token) {
      setError('Missing impersonation token');
      return;
    }

    let cancelled = false;

    (async () => {
      try {
        setToken(token);
        if (workspaceId) setWorkspaceId(workspaceId);
        const me = (await api.getMe()) as {
          id: string;
          name: string;
          email: string;
          role: string;
          permissions?: string[];
          inboxScope?: unknown;
          avatar?: string | null;
          onboardingCompleted?: boolean;
          onboardingStep?: number;
          onboardingSkippedSteps?: number[];
          activeWorkspaceId?: string;
          activeWorkspace?: { id: string; name: string };
        };

        if (cancelled) return;

        applyAuthSession({
          token,
          user: {
            id: me.id,
            name: me.name,
            email: me.email,
            role: me.role,
            permissions: me.permissions,
            inboxScope: me.inboxScope as never,
            avatar: me.avatar,
            onboardingCompleted: me.onboardingCompleted,
            onboardingStep: me.onboardingStep,
            onboardingSkippedSteps: me.onboardingSkippedSteps,
          },
          workspace: me.activeWorkspace,
          activeWorkspaceId: me.activeWorkspaceId ?? workspaceId ?? me.activeWorkspace?.id,
        });

        const wsId = me.activeWorkspaceId ?? workspaceId ?? me.activeWorkspace?.id;
        if (wsId) connectSocket(wsId);

        navigate(pathForTab('dashboard'), { replace: true });
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Impersonation failed');
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [navigate, searchParams]);

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
        <div className="max-w-md rounded-2xl border border-red-200 bg-white p-6 text-center shadow-sm">
          <p className="text-sm font-semibold text-red-700">{error}</p>
          <button
            type="button"
            onClick={() => navigate('/login', { replace: true })}
            className="mt-4 text-sm font-medium text-primary hover:underline"
          >
            Go to login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50">
      <div className="flex items-center gap-3 text-slate-500">
        <Loader2 className="h-6 w-6 animate-spin" />
        <span className="text-sm font-medium">Opening workspace…</span>
      </div>
    </div>
  );
}
