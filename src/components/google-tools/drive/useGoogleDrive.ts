import { useCallback, useEffect, useMemo, useState } from 'react';
import { api, formatCatchError } from '../../../lib/api';
import type {
  DriveFile,
  DriveIntegration,
  DriveSortDir,
  DriveSortKey,
  DriveView,
  LayoutMode,
} from './types';
import { base64ToBlobUrl, sortFiles } from './utils';

export type DrivePreviewState = {
  blobUrl: string | null;
  mimeType: string | null;
  loading: boolean;
  error: string | null;
};

export function useGoogleDrive() {
  const [integration, setIntegration] = useState<DriveIntegration | null>(null);
  const [loading, setLoading] = useState(true);
  const [listLoading, setListLoading] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [message, setMessage] = useState('');
  const [view, setView] = useState<DriveView>('my');
  const [folderId, setFolderId] = useState<string | null>(null);
  const [files, setFiles] = useState<DriveFile[]>([]);
  const [nextPageToken, setNextPageToken] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selectedDetail, setSelectedDetail] = useState<DriveFile | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortKey, setSortKey] = useState<DriveSortKey>('modified');
  const [sortDir, setSortDir] = useState<DriveSortDir>('desc');
  const [layout, setLayout] = useState<LayoutMode>('list');
  const [preview, setPreview] = useState<DrivePreviewState>({
    blobUrl: null,
    mimeType: null,
    loading: false,
    error: null,
  });

  const loadIntegration = useCallback(async () => {
    const res = await api.getGoogleProducts();
    const row = (res.products ?? []).find(
      (p) => p.product === 'drive' && p.status === 'connected' && p.connectionId
    );
    if (!row?.connectionId) {
      setIntegration(null);
      return null;
    }
    return {
      connectionId: row.connectionId,
      connectionEmail: row.connectionEmail,
      lastSyncAt: row.lastSyncAt,
    } satisfies DriveIntegration;
  }, []);

  const loadFiles = useCallback(
    async (connectionId: string, opts?: { append?: boolean; pageToken?: string }) => {
      setListLoading(true);
      try {
        const res = await api.browseGoogleDrive({
          connectionId,
          folderId: folderId ?? undefined,
          pageToken: opts?.pageToken,
          view: view === 'my' && !folderId ? undefined : view,
          query: searchQuery.trim() || undefined,
        });
        const rows = (res.files ?? []) as DriveFile[];
        setFiles((prev) => (opts?.append ? [...prev, ...rows] : rows));
        setNextPageToken(res.nextPageToken ?? null);
        if (!opts?.append) {
          setSelectedId((prev) => {
            if (prev && rows.some((f) => f.id === prev)) return prev;
            return rows[0]?.id ?? null;
          });
        }
      } finally {
        setListLoading(false);
      }
    },
    [folderId, view, searchQuery]
  );

  const loadFileDetail = useCallback(async (connectionId: string, fileId: string) => {
    setDetailLoading(true);
    try {
      const res = await api.getGoogleDriveFile(connectionId, fileId);
      setSelectedDetail(res.file as DriveFile);
    } finally {
      setDetailLoading(false);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const row = await loadIntegration();
        if (cancelled) return;
        setIntegration(row);
        if (row) await loadFiles(row.connectionId);
      } catch (err) {
        if (!cancelled) setMessage(formatCatchError(err));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [loadIntegration, loadFiles]);

  useEffect(() => {
    if (!integration?.connectionId || loading) return;
    void loadFiles(integration.connectionId).catch((err) => setMessage(formatCatchError(err)));
  }, [integration?.connectionId, view, folderId, loading, loadFiles]);

  useEffect(() => {
    if (!integration?.connectionId || !selectedId) {
      setSelectedDetail(null);
      return;
    }
    void loadFileDetail(integration.connectionId, selectedId).catch((err) =>
      setMessage(formatCatchError(err))
    );
  }, [integration?.connectionId, selectedId, loadFileDetail]);

  useEffect(() => {
    let cancelled = false;
    let activeBlob: string | null = null;

    const revokeActive = () => {
      if (activeBlob) {
        URL.revokeObjectURL(activeBlob);
        activeBlob = null;
      }
    };

    if (!integration?.connectionId || !selectedId) {
      revokeActive();
      setPreview({ blobUrl: null, mimeType: null, loading: false, error: null });
      return revokeActive;
    }

    const file = files.find((f) => f.id === selectedId) ?? selectedDetail;
    if (!file || file.isFolder) {
      revokeActive();
      setPreview({ blobUrl: null, mimeType: null, loading: false, error: null });
      return revokeActive;
    }

    setPreview({ blobUrl: null, mimeType: null, loading: true, error: null });

    void api
      .previewGoogleDriveFile(integration.connectionId, selectedId)
      .then((res) => {
        if (cancelled) return;
        revokeActive();
        const p = res.preview;
        if (!p.previewable) {
          const msg =
            p.reason === 'too_large'
              ? 'File is too large to preview here. Use Open in Google.'
              : p.reason === 'unsupported_type'
                ? 'This Google file type cannot be previewed in-app.'
                : 'Preview not available.';
          setPreview({ blobUrl: null, mimeType: null, loading: false, error: msg });
          return;
        }
        activeBlob = base64ToBlobUrl(p.dataBase64, p.mimeType);
        setPreview({
          blobUrl: activeBlob,
          mimeType: p.mimeType,
          loading: false,
          error: null,
        });
      })
      .catch((err) => {
        if (!cancelled) {
          revokeActive();
          setPreview({
            blobUrl: null,
            mimeType: null,
            loading: false,
            error: formatCatchError(err),
          });
        }
      });

    return () => {
      cancelled = true;
      revokeActive();
    };
  }, [integration?.connectionId, selectedId, files, selectedDetail]);

  const handleSync = useCallback(async () => {
    if (!integration) return;
    setSyncing(true);
    try {
      await api.syncGoogleProduct('drive', integration.connectionId);
      await loadFiles(integration.connectionId);
      setMessage('Drive synced successfully.');
    } catch (err) {
      setMessage(formatCatchError(err));
    } finally {
      setSyncing(false);
    }
  }, [integration, loadFiles]);

  const openFolder = useCallback((id: string) => {
    setFolderId(id);
    setView('my');
    setSelectedId(null);
  }, []);

  const filtered = useMemo(() => {
    let rows = files;
    const q = searchQuery.trim().toLowerCase();
    if (q) {
      rows = rows.filter(
        (f) =>
          (f.name ?? '').toLowerCase().includes(q) ||
          (f.owner ?? '').toLowerCase().includes(q)
      );
    }
    return sortFiles(rows, sortKey, sortDir);
  }, [files, searchQuery, sortKey, sortDir]);

  const selected = useMemo(
    () => files.find((f) => f.id === selectedId) ?? null,
    [files, selectedId]
  );

  const loadMore = useCallback(() => {
    if (!integration?.connectionId || !nextPageToken) return;
    void loadFiles(integration.connectionId, { append: true, pageToken: nextPageToken });
  }, [integration?.connectionId, nextPageToken, loadFiles]);

  return {
    integration,
    loading,
    listLoading,
    detailLoading,
    syncing,
    message,
    setMessage,
    view,
    setView,
    folderId,
    setFolderId,
    openFolder,
    files: filtered,
    selected,
    selectedDetail,
    selectedId,
    setSelectedId,
    searchQuery,
    setSearchQuery,
    sortKey,
    setSortKey,
    sortDir,
    setSortDir,
    layout,
    setLayout,
    handleSync,
    loadMore,
    hasMore: Boolean(nextPageToken),
    refresh: () => integration && loadFiles(integration.connectionId),
    preview,
  };
}
