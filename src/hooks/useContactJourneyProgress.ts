/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { api } from '../lib/api';
import type { ContactJourneyProgress } from '../components/inbox/ContactJourneyPanel';

const FALLBACK_POLL_MS = 60_000;

function progressSnapshot(p: ContactJourneyProgress | null): string {
  if (!p) return '';
  return JSON.stringify({
    executionId: p.executionId,
    status: p.status,
    currentNodeId: p.currentNodeId,
    waitUntil: p.waitUntil,
    steps: p.steps.map((s) => ({
      nodeId: s.nodeId,
      state: s.state,
      waitUntil: s.waitUntil,
    })),
  });
}

export function useContactJourneyProgress(contactId: string | null, refreshKey = 0) {
  const [progress, setProgress] = useState<ContactJourneyProgress | null>(null);
  const [initialLoading, setInitialLoading] = useState(false);
  const loadedForContactRef = useRef<string | null>(null);

  const fetchProgress = useCallback(
    async (options?: { silent?: boolean }) => {
      if (!contactId) {
        setProgress(null);
        loadedForContactRef.current = null;
        return;
      }

      const isFirstLoadForContact = loadedForContactRef.current !== contactId;
      const silent = options?.silent ?? !isFirstLoadForContact;

      if (!silent) setInitialLoading(true);

      try {
        const data = (await api.getContactJourneyProgress(contactId)) as
          | ContactJourneyProgress
          | { active: false };
        const next = data && 'executionId' in data ? data : null;
        const snapshot = progressSnapshot(next);

        setProgress((prev) => {
          if (progressSnapshot(prev) === snapshot) return prev;
          return next;
        });
        loadedForContactRef.current = contactId;
      } catch {
        if (!silent) setProgress(null);
      } finally {
        if (!silent) setInitialLoading(false);
      }
    },
    [contactId]
  );

  useEffect(() => {
    if (!contactId) {
      setProgress(null);
      loadedForContactRef.current = null;
      return;
    }
    if (loadedForContactRef.current !== contactId) {
      setProgress(null);
    }
    void fetchProgress({ silent: loadedForContactRef.current === contactId });
  }, [contactId, fetchProgress]);

  useEffect(() => {
    if (refreshKey === 0 || !contactId) return;
    void fetchProgress({ silent: true });
  }, [refreshKey, contactId, fetchProgress]);

  // Fallback only — primary refresh is refreshKey (incoming messages). Pause when tab hidden.
  useEffect(() => {
    if (!contactId) return;
    const tick = () => {
      if (document.visibilityState === 'visible') {
        void fetchProgress({ silent: true });
      }
    };
    const timer = window.setInterval(tick, FALLBACK_POLL_MS);
    const onVis = () => {
      if (document.visibilityState === 'visible') tick();
    };
    document.addEventListener('visibilitychange', onVis);
    return () => {
      window.clearInterval(timer);
      document.removeEventListener('visibilitychange', onVis);
    };
  }, [contactId, fetchProgress]);

  return { progress, initialLoading, refetch: () => fetchProgress({ silent: true }) };
}
