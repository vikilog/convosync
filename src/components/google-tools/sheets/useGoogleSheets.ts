import { useCallback, useEffect, useMemo, useState } from 'react';
import { api, formatCatchError } from '../../../lib/api';
import type {
  SheetsIntegration,
  SheetsSidebarView,
  SortDir,
  SortKey,
  SpreadsheetSummary,
  WorksheetInfo,
} from './types';
import { sortSpreadsheets } from './utils';

const PAGE_SIZE = 25;

export function useGoogleSheets() {
  const [integration, setIntegration] = useState<SheetsIntegration | null>(null);
  const [loading, setLoading] = useState(true);
  const [listLoading, setListLoading] = useState(false);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [message, setMessage] = useState('');
  const [sidebarView, setSidebarView] = useState<SheetsSidebarView>('connected');
  const [spreadsheets, setSpreadsheets] = useState<SpreadsheetSummary[]>([]);
  const [nextPageToken, setNextPageToken] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortKey, setSortKey] = useState<SortKey>('modified');
  const [sortDir, setSortDir] = useState<SortDir>('desc');
  const [statusFilter, setStatusFilter] = useState<'all' | 'starred' | 'shared'>('all');
  const [worksheets, setWorksheets] = useState<WorksheetInfo[]>([]);
  const [activeSheetTitle, setActiveSheetTitle] = useState<string | null>(null);
  const [previewValues, setPreviewValues] = useState<unknown[][]>([]);
  const [detailTitle, setDetailTitle] = useState<string | null>(null);

  const loadIntegration = useCallback(async () => {
    const res = await api.getGoogleProducts();
    const row = (res.products ?? []).find(
      (p) => p.product === 'sheets' && p.status === 'connected' && p.connectionId
    );
    if (!row?.connectionId) {
      setIntegration(null);
      return null;
    }
    const integrationRow: SheetsIntegration = {
      connectionId: row.connectionId,
      connectionEmail: row.connectionEmail,
      lastSyncAt: row.lastSyncAt,
    };
    setIntegration(integrationRow);
    return integrationRow;
  }, []);

  const loadSpreadsheets = useCallback(
    async (connectionId: string, opts?: { append?: boolean; pageToken?: string }) => {
      setListLoading(true);
      try {
        const res = await api.listGoogleSpreadsheets({
          connectionId,
          pageToken: opts?.pageToken,
          pageSize: PAGE_SIZE,
          starred: sidebarView === 'starred' ? true : undefined,
        });
        const rows = (res.spreadsheets ?? []) as SpreadsheetSummary[];
        setSpreadsheets((prev) => (opts?.append ? [...prev, ...rows] : rows));
        setNextPageToken(res.nextPageToken ?? null);
        if (!opts?.append) {
          setSelectedId((prev) => {
            if (prev && rows.some((r) => r.id === prev)) return prev;
            return rows[0]?.id ?? null;
          });
        }
      } finally {
        setListLoading(false);
      }
    },
    [sidebarView]
  );

  const loadPreview = useCallback(
    async (connectionId: string, spreadsheetId: string, sheetTitle?: string) => {
      setPreviewLoading(true);
      try {
        const res = await api.getGoogleSpreadsheet({
          connectionId,
          spreadsheetId,
          sheetTitle,
          previewRows: 25,
        });
        setDetailTitle(res.title ?? null);
        setWorksheets(res.worksheets ?? []);
        const title = sheetTitle ?? res.worksheets?.[0]?.title ?? null;
        setActiveSheetTitle(title);
        setPreviewValues(res.preview?.values ?? []);
      } finally {
        setPreviewLoading(false);
      }
    },
    []
  );

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const row = await loadIntegration();
        if (cancelled || !row) return;
        await loadSpreadsheets(row.connectionId);
      } catch (err) {
        if (!cancelled) setMessage(formatCatchError(err));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [loadIntegration, loadSpreadsheets]);

  useEffect(() => {
    if (!integration?.connectionId || loading) return;
    void loadSpreadsheets(integration.connectionId).catch((err) =>
      setMessage(formatCatchError(err))
    );
  }, [integration?.connectionId, sidebarView, loading, loadSpreadsheets]);

  useEffect(() => {
    if (!integration?.connectionId || !selectedId) return;
    void loadPreview(integration.connectionId, selectedId).catch((err) =>
      setMessage(formatCatchError(err))
    );
  }, [integration?.connectionId, selectedId, loadPreview]);

  const handleRefresh = useCallback(async () => {
    if (!integration) return;
    setListLoading(true);
    setMessage('');
    try {
      await loadSpreadsheets(integration.connectionId);
    } catch (err) {
      setMessage(formatCatchError(err));
    } finally {
      setListLoading(false);
    }
  }, [integration, loadSpreadsheets]);

  const handleSync = useCallback(async () => {
    if (!integration) return;
    setSyncing(true);
    setMessage('');
    try {
      await api.syncGoogleProduct('sheets', integration.connectionId);
      await loadSpreadsheets(integration.connectionId);
      setMessage('Sheets synced successfully.');
    } catch (err) {
      setMessage(formatCatchError(err));
    } finally {
      setSyncing(false);
    }
  }, [integration, loadSpreadsheets]);

  const handleSheetTab = useCallback(
    (title: string) => {
      if (!integration?.connectionId || !selectedId) return;
      setActiveSheetTitle(title);
      void loadPreview(integration.connectionId, selectedId, title);
    },
    [integration?.connectionId, selectedId, loadPreview]
  );

  const filtered = useMemo(() => {
    let rows = spreadsheets;
    if (sidebarView === 'recent') {
      rows = [...rows].sort(
        (a, b) =>
          new Date(b.modifiedTime ?? 0).getTime() - new Date(a.modifiedTime ?? 0).getTime()
      );
    }
    if (statusFilter === 'starred') rows = rows.filter((r) => r.starred);
    if (statusFilter === 'shared') rows = rows.filter((r) => r.shared);
    const q = searchQuery.trim().toLowerCase();
    if (q) {
      rows = rows.filter(
        (r) =>
          (r.name ?? '').toLowerCase().includes(q) ||
          (r.owner ?? '').toLowerCase().includes(q)
      );
    }
    return sortSpreadsheets(rows, sortKey, sortDir);
  }, [spreadsheets, sidebarView, statusFilter, searchQuery, sortKey, sortDir]);

  const selected = useMemo(
    () => spreadsheets.find((s) => s.id === selectedId) ?? null,
    [spreadsheets, selectedId]
  );

  const loadMore = useCallback(() => {
    if (!integration?.connectionId || !nextPageToken) return;
    void loadSpreadsheets(integration.connectionId, {
      append: true,
      pageToken: nextPageToken,
    });
  }, [integration?.connectionId, nextPageToken, loadSpreadsheets]);

  return {
    integration,
    loading,
    listLoading,
    previewLoading,
    syncing,
    message,
    setMessage,
    sidebarView,
    setSidebarView,
    spreadsheets: filtered,
    selected,
    selectedId,
    setSelectedId,
    searchQuery,
    setSearchQuery,
    sortKey,
    setSortKey,
    sortDir,
    setSortDir,
    statusFilter,
    setStatusFilter,
    worksheets,
    activeSheetTitle,
    previewValues,
    detailTitle,
    handleSheetTab,
    handleRefresh,
    handleSync,
    loadMore,
    hasMore: Boolean(nextPageToken),
  };
}
