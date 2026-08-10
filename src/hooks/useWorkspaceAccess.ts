import { useCallback, useEffect, useState } from 'react';
import { api, getUserInboxScope, getUserPermissions, getUserRole, setUserInboxScope } from '../lib/api';
import { resolveEffectiveInboxScope, type InboxScope } from '../lib/inboxScope';
import {
  planFeaturesFromSubscription,
  type PlanFeatureFlags,
} from '../lib/planEntitlements';
import { AUTH_CHANGED_EVENT } from '../lib/session';
import {
  canAccessPath,
  canAccessTab,
  firstAccessibleTabPath,
  type WorkspacePermission,
} from '../lib/workspacePermissions';

export function useWorkspaceAccess() {
  const [role, setRole] = useState(getUserRole());
  const [permissions, setPermissions] = useState(getUserPermissions());
  const [planFeatures, setPlanFeatures] = useState<PlanFeatureFlags | null>(null);
  /** false until first /workspace/subscription attempt finishes (success or fail). */
  const [planFeaturesReady, setPlanFeaturesReady] = useState(false);
  const [inboxScope, setInboxScope] = useState<InboxScope>(() =>
    resolveEffectiveInboxScope(getUserRole() ?? 'agent', getUserInboxScope())
  );

  const loadPlanFeatures = useCallback(async () => {
    try {
      const res = (await api.getSubscription()) as { currentPlan?: PlanFeatureFlags | null };
      setPlanFeatures(planFeaturesFromSubscription(res.currentPlan));
    } catch {
      setPlanFeatures(null);
    } finally {
      setPlanFeaturesReady(true);
    }
  }, []);

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
    void loadPlanFeatures();
    const onAuthChanged = () => {
      void refresh();
      void loadPlanFeatures();
    };
    window.addEventListener(AUTH_CHANGED_EVENT, onAuthChanged);
    return () => window.removeEventListener(AUTH_CHANGED_EVENT, onAuthChanged);
  }, [refresh, loadPlanFeatures]);

  const canTab = useCallback(
    (tab: string) => canAccessTab(tab, permissions, role, planFeatures),
    [permissions, role, planFeatures]
  );

  const canPath = useCallback(
    (pathname: string) => canAccessPath(pathname, permissions, role, planFeatures),
    [permissions, role, planFeatures]
  );

  const firstAccessiblePath = useCallback(
    () => firstAccessibleTabPath(permissions, role, planFeatures),
    [permissions, role, planFeatures]
  );

  const hasPermission = useCallback(
    (required: WorkspacePermission) => {
      if (role === 'admin') return true;
      const list = permissions.length ? permissions : ['inbox', 'contacts'];
      return list.includes(required);
    },
    [permissions, role]
  );

  return {
    role,
    permissions,
    planFeatures,
    planFeaturesReady,
    inboxScope,
    canTab,
    canPath,
    firstAccessiblePath,
    hasPermission,
    refresh,
  };
}
