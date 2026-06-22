import { useCallback, useEffect, useState } from 'react';
import { api, getUserInboxScope, getUserPermissions, getUserRole, setUserInboxScope } from '../lib/api';
import { resolveEffectiveInboxScope, type InboxScope } from '../lib/inboxScope';
import { AUTH_CHANGED_EVENT } from '../lib/session';
import {
  canAccessPath,
  canAccessTab,
  type WorkspacePermission,
} from '../lib/workspacePermissions';

export function useWorkspaceAccess() {
  const [role, setRole] = useState(getUserRole());
  const [permissions, setPermissions] = useState(getUserPermissions());
  const [inboxScope, setInboxScope] = useState<InboxScope>(() =>
    resolveEffectiveInboxScope(getUserRole() ?? 'agent', getUserInboxScope())
  );

  const refresh = useCallback(async () => {
    setRole(getUserRole());
    setPermissions(getUserPermissions());
    setInboxScope(resolveEffectiveInboxScope(getUserRole() ?? 'agent', getUserInboxScope()));
    try {
      const me = (await api.getMe()) as {
        role?: string;
        permissions?: string[];
        inboxScope?: unknown;
      };
      if (me.role) setRole(me.role);
      if (me.permissions) setPermissions(me.permissions);
      if (me.inboxScope !== undefined) {
        setUserInboxScope(me.inboxScope);
        setInboxScope(resolveEffectiveInboxScope(me.role ?? 'agent', me.inboxScope));
      }
    } catch {
      // keep cached values
    }
  }, []);

  useEffect(() => {
    void refresh();
    const onAuthChanged = () => void refresh();
    window.addEventListener(AUTH_CHANGED_EVENT, onAuthChanged);
    return () => window.removeEventListener(AUTH_CHANGED_EVENT, onAuthChanged);
  }, [refresh]);

  const canTab = useCallback(
    (tab: string) => canAccessTab(tab, permissions, role),
    [permissions, role]
  );

  const canPath = useCallback(
    (pathname: string) => canAccessPath(pathname, permissions, role),
    [permissions, role]
  );

  const hasPermission = useCallback(
    (required: WorkspacePermission) => {
      if (role === 'admin') return true;
      const list = permissions.length ? permissions : ['inbox', 'contacts'];
      return list.includes(required);
    },
    [permissions, role]
  );

  return { role, permissions, inboxScope, canTab, canPath, hasPermission, refresh };
}
