import { useCallback, useEffect, useMemo, useState } from 'react';
import { api, formatCatchError } from '../../../lib/api';
import type {
  BusinessProfileIntegration,
  GbpAccount,
  GbpLocation,
  GbpMetric,
  GbpReview,
  GbpSyncStatus,
} from './types';
import { mapCachedAccount, mapCachedLocation } from './utils';

/** Cache-first GBP hook — reads PostgreSQL via API only; never calls Google directly. */
export function useBusinessProfile() {
  const [integration, setIntegration] = useState<BusinessProfileIntegration | null>(null);
  const [loading, setLoading] = useState(true);
  const [accountsLoading, setAccountsLoading] = useState(false);
  const [listLoading, setListLoading] = useState(false);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [metricsLoading, setMetricsLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [message, setMessage] = useState('');
  const [accounts, setAccounts] = useState<GbpAccount[]>([]);
  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(null);
  const [locations, setLocations] = useState<GbpLocation[]>([]);
  const [selectedLocationId, setSelectedLocationId] = useState<string | null>(null);
  const [reviews, setReviews] = useState<GbpReview[]>([]);
  const [metrics, setMetrics] = useState<GbpMetric[]>([]);
  const [syncStatus, setSyncStatus] = useState<GbpSyncStatus | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const loadIntegration = useCallback(async () => {
    const res = await api.getGoogleProducts();
    const row = (res.products ?? []).find(
      (p) => p.product === 'business_profile' && p.status === 'connected' && p.connectionId
    );
    if (!row?.connectionId) {
      setIntegration(null);
      return null;
    }
    const integrationRow: BusinessProfileIntegration = {
      connectionId: row.connectionId,
      connectionEmail: row.connectionEmail,
      lastSyncAt: row.lastSyncAt,
    };
    setIntegration(integrationRow);
    return integrationRow;
  }, []);

  const loadSyncStatus = useCallback(async (connectionId: string) => {
    try {
      const status = await api.getGoogleBusinessProfileSyncStatus(connectionId);
      setSyncStatus(status);
    } catch {
      setSyncStatus(null);
    }
  }, []);

  const loadAccounts = useCallback(async (connectionId: string) => {
    setAccountsLoading(true);
    try {
      const res = await api.listGoogleBusinessProfileAccounts(connectionId);
      const parsed = (res.accounts ?? []).map(mapCachedAccount);
      setAccounts(parsed);
      setSelectedAccountId((prev) => {
        if (prev && parsed.some((a) => a.id === prev)) return prev;
        return parsed[0]?.id ?? null;
      });
    } finally {
      setAccountsLoading(false);
    }
  }, []);

  const loadLocations = useCallback(async (connectionId: string, accountId: string) => {
    setListLoading(true);
    try {
      const res = await api.listGoogleBusinessProfileLocations(connectionId, accountId);
      const parsed = (res.locations ?? []).map(mapCachedLocation);
      setLocations(parsed);
      setSelectedLocationId((prev) => {
        if (prev && parsed.some((l) => l.id === prev)) return prev;
        return parsed[0]?.id ?? null;
      });
    } finally {
      setListLoading(false);
    }
  }, []);

  const loadReviews = useCallback(async (connectionId: string, locationId: string) => {
    setReviewsLoading(true);
    try {
      const res = await api.listGoogleBusinessProfileReviews(connectionId, locationId);
      setReviews(res.reviews ?? []);
    } finally {
      setReviewsLoading(false);
    }
  }, []);

  const loadMetrics = useCallback(async (connectionId: string, locationId: string) => {
    setMetricsLoading(true);
    try {
      const res = await api.listGoogleBusinessProfileMetrics(connectionId, locationId);
      setMetrics(res.metrics ?? []);
    } finally {
      setMetricsLoading(false);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setMessage('');
      try {
        const row = await loadIntegration();
        if (cancelled || !row) return;
        await loadAccounts(row.connectionId);
        await loadSyncStatus(row.connectionId);
      } catch (err) {
        if (!cancelled) setMessage(formatCatchError(err));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [loadIntegration, loadAccounts, loadSyncStatus]);

  useEffect(() => {
    if (!integration?.connectionId || !selectedAccountId || loading) return;
    setLocations([]);
    setSelectedLocationId(null);
    setReviews([]);
    setMetrics([]);
    void loadLocations(integration.connectionId, selectedAccountId).catch((err) =>
      setMessage(formatCatchError(err))
    );
  }, [integration?.connectionId, selectedAccountId, loadLocations, loading]);

  useEffect(() => {
    if (!integration?.connectionId || !selectedLocationId || loading) return;
    setReviews([]);
    void loadReviews(integration.connectionId, selectedLocationId).catch((err) =>
      setMessage(formatCatchError(err))
    );
  }, [integration?.connectionId, selectedLocationId, loadReviews, loading]);

  const handleSyncAccounts = useCallback(async () => {
    if (!integration) return;
    setSyncing(true);
    setMessage('');
    try {
      await api.enqueueGoogleBusinessProfileSync({
        connectionId: integration.connectionId,
        syncType: 'accounts',
        force: true,
      });
      setMessage('Accounts sync queued. Data will update shortly.');
      await loadSyncStatus(integration.connectionId);
    } catch (err) {
      setMessage(formatCatchError(err));
    } finally {
      setSyncing(false);
    }
  }, [integration, loadSyncStatus]);

  const refreshAccounts = useCallback(async () => {
    if (!integration) return;
    await loadAccounts(integration.connectionId);
    await loadSyncStatus(integration.connectionId);
  }, [integration, loadAccounts, loadSyncStatus]);

  const filteredLocations = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return locations;
    return locations.filter((loc) => {
      const title = loc.title?.toLowerCase() ?? '';
      const address = loc.storefrontAddress?.addressLines?.join(' ').toLowerCase() ?? '';
      return title.includes(q) || address.includes(q);
    });
  }, [locations, searchQuery]);

  const selectedLocation = useMemo(
    () => locations.find((l) => l.id === selectedLocationId) ?? null,
    [locations, selectedLocationId]
  );

  const selectedAccount = useMemo(
    () => accounts.find((a) => a.id === selectedAccountId) ?? null,
    [accounts, selectedAccountId]
  );

  return {
    integration,
    loading,
    accountsLoading,
    listLoading,
    reviewsLoading,
    metricsLoading,
    syncing,
    message,
    setMessage,
    accounts,
    selectedAccount,
    selectedAccountId,
    setSelectedAccountId,
    locations: filteredLocations,
    allLocations: locations,
    selectedLocation,
    selectedLocationId,
    setSelectedLocationId,
    reviews,
    metrics,
    loadMetrics,
    syncStatus,
    searchQuery,
    setSearchQuery,
    handleSyncAccounts,
    refreshAccounts,
  };
}
