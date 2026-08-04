/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { api } from '../lib/api';
import type { ContactJourneyProgress } from '../components/inbox/ContactJourneyPanel';

const FALLBACK_POLL_MS = 60_000;

export type JourneyProgressChannel = 'whatsapp' | 'instagram' | null | undefined;

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

export function useContactJourneyProgress(
  contactId: string | null,
  refreshKey = 0,
  channel: JourneyProgressChannel = 'whatsapp'
) {
  const [progress, setProgress] = useState<ContactJourneyProgress | null>(null);
  const [initialLoading, setInitialLoading] = useState(false);
  const loadedForContactRef = useRef<string | null>(null);

  const fetchProgress = useCallback(
    async (options?: { silent?: boolean }) => {
      if (!contactId || !channel) {
        setProgress(null);
        loadedForContactRef.current = null;
        return;
      }

      const isFirstLoadForContact = loadedForContactRef.current !== contactId;
      const silent = options?.silent ?? !isFirstLoadForContact;

      if (!silent) setInitialLoading(true);

      try {
        const data = (await (channel === 'instagram'
          ? api.getContactInstagramJourneyProgress(contactId)
          : api.getContactJourneyProgress(contactId))) as
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
    [contactId, channel]
  );

  useEffect(() => {
    if (!contactId || !channel) {
      setProgress(null);
      loadedForContactRef.current = null;
      return;
    }
    if (loadedForContactRef.current !== contactId) {
      setProgress(null);
    }
    void fetchProgress({ silent: loadedForContactRef.current === contactId });
  }, [contactId, channel, fetchProgress]);

  useEffect(() => {
    if (refreshKey === 0 || !contactId || !channel) return;
    void fetchProgress({ silent: true });
  }, [refreshKey, contactId, channel, fetchProgress]);

  // Fallback only — primary refresh is refreshKey (incoming messages). Pause when tab hidden.
  // When waiting/running, poll faster so missed-webhook recovery can unstick the flow.
  useEffect(() => {
    if (!contactId || !channel) return;
    const tick = () => {
      if (document.visibilityState === 'visible') {
        void fetchProgress({ silent: true });
      }
    };
    const waiting = progress?.status === 'waiting' || progress?.status === 'running';
    const ms = waiting ? 5_000 : FALLBACK_POLL_MS;
    const timer = window.setInterval(tick, ms);
    const onVis = () => {
      if (document.visibilityState === 'visible') tick();
    };
    document.addEventListener('visibilitychange', onVis);
    return () => {
      window.clearInterval(timer);
      document.removeEventListener('visibilitychange', onVis);
    };
  }, [contactId, channel, fetchProgress, progress?.status]);

  return { progress, initialLoading, refetch: () => fetchProgress({ silent: true }) };
}
