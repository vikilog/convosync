import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react';
import { api, formatCatchError } from '../../../lib/api';
import { GMAIL_FOLDERS } from './constants';
import type {
  GmailFolder,
  GmailFolderCounts,
  GmailIntegration,
  GmailMessageDetail,
  GmailMessageSummary,
} from './types';

export function useGmailMailbox(folder: GmailFolder) {
  const [integration, setIntegration] = useState<GmailIntegration | null>(null);
  const [searchInput, setSearchInput] = useState('');
  const [activeSearch, setActiveSearch] = useState('');
  const [messages, setMessages] = useState<GmailMessageSummary[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detail, setDetail] = useState<GmailMessageDetail | null>(null);
  const [nextPageToken, setNextPageToken] = useState<string | null>(null);
  const [folderCounts, setFolderCounts] = useState<GmailFolderCounts>({});
  const [loading, setLoading] = useState(true);
  const [listLoading, setListLoading] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [banner, setBanner] = useState('');
  const [composeOpen, setComposeOpen] = useState(false);
  const [sending, setSending] = useState(false);
  const [composeForm, setComposeForm] = useState({ to: '', subject: '', body: '' });

  const folderMeta = useMemo(
    () => GMAIL_FOLDERS.find((f) => f.id === folder) ?? GMAIL_FOLDERS[0],
    [folder]
  );

  const listQuery = useMemo(() => {
    const parts: string[] = [folderMeta.query];
    if (activeSearch.trim()) parts.push(activeSearch.trim());
    return parts.join(' ');
  }, [folderMeta.query, activeSearch]);

  const loadIntegration = useCallback(async () => {
    const res = await api.getGoogleProducts();
    const gmail = (res.products ?? []).find(
      (p) => p.product === 'gmail' && p.status === 'connected' && p.connectionId
    );
    if (!gmail?.connectionId) {
      setIntegration(null);
      return null;
    }
    const row: GmailIntegration = {
      connectionId: gmail.connectionId,
      connectionEmail: gmail.connectionEmail,
      lastSyncAt: gmail.lastSyncAt,
    };
    setIntegration(row);
    return row;
  }, []);

  const loadFolderCounts = useCallback(async (connectionId: string) => {
    try {
      const results = await Promise.all(
        GMAIL_FOLDERS.map((f) =>
          api.listGoogleGmailMessages({
            connectionId,
            maxResults: 1,
            query: f.query,
          })
        )
      );
      const counts: GmailFolderCounts = {};
      GMAIL_FOLDERS.forEach((f, i) => {
        const estimate = results[i]?.resultSizeEstimate;
        if (typeof estimate === 'number' && estimate > 0) counts[f.id] = estimate;
      });
      setFolderCounts(counts);
    } catch {
      /* keep previous counts */
    }
  }, []);

  const loadMessages = useCallback(
    async (connectionId: string, options?: { pageToken?: string; append?: boolean }) => {
      if (options?.append) setLoadingMore(true);
      else setListLoading(true);
      try {
        const res = await api.listGoogleGmailMessages({
          connectionId,
          maxResults: 25,
          query: listQuery,
          pageToken: options?.pageToken,
        });
        const rows = res.messages ?? [];
        setMessages((prev) => (options?.append ? [...prev, ...rows] : rows));
        setNextPageToken(res.nextPageToken ?? null);
        if (!options?.append) {
          setSelectedId((prev) => {
            if (prev && rows.some((m) => m.id === prev)) return prev;
            return rows[0]?.id ?? null;
          });
        }
      } catch (err) {
        setBanner(formatCatchError(err));
      } finally {
        setListLoading(false);
        setLoadingMore(false);
      }
    },
    [listQuery]
  );

  const loadDetail = useCallback(async (connectionId: string, messageId: string) => {
    setDetailLoading(true);
    try {
      const res = await api.getGoogleGmailMessage({ connectionId, messageId });
      setDetail(res.message);
    } catch (err) {
      setBanner(formatCatchError(err));
      setDetail(null);
    } finally {
      setDetailLoading(false);
    }
  }, []);

  useEffect(() => {
    void (async () => {
      setLoading(true);
      try {
        await loadIntegration();
      } finally {
        setLoading(false);
      }
    })();
  }, [loadIntegration]);

  useEffect(() => {
    setSelectedId(null);
    setDetail(null);
  }, [folder]);

  useEffect(() => {
    if (!integration?.connectionId || loading) return;
    void loadMessages(integration.connectionId);
  }, [integration?.connectionId, listQuery, loading, loadMessages]);

  useEffect(() => {
    if (!integration?.connectionId) return;
    void loadFolderCounts(integration.connectionId);
  }, [integration?.connectionId, syncing, loadFolderCounts]);

  useEffect(() => {
    if (!integration?.connectionId || !selectedId) {
      setDetail(null);
      return;
    }
    void loadDetail(integration.connectionId, selectedId);
  }, [integration?.connectionId, selectedId, loadDetail]);

  const handleSync = async () => {
    if (!integration?.connectionId) return;
    setSyncing(true);
    setBanner('');
    try {
      await api.syncGoogleProduct('gmail', integration.connectionId);
      await loadMessages(integration.connectionId);
      await loadFolderCounts(integration.connectionId);
      setBanner('Inbox synced.');
    } catch (err) {
      setBanner(formatCatchError(err));
    } finally {
      setSyncing(false);
    }
  };

  const handleSearch = (e: FormEvent) => {
    e.preventDefault();
    setActiveSearch(searchInput.trim());
  };

  const clearSearch = () => {
    setSearchInput('');
    setActiveSearch('');
  };

  const handleSend = async (e: FormEvent) => {
    e.preventDefault();
    if (!integration?.connectionId) return;
    setSending(true);
    setBanner('');
    try {
      await api.sendGoogleGmail({
        connectionId: integration.connectionId,
        to: composeForm.to.trim(),
        subject: composeForm.subject.trim(),
        body: composeForm.body,
      });
      setComposeOpen(false);
      setComposeForm({ to: '', subject: '', body: '' });
      setBanner('Email sent.');
      if (folder === 'sent') {
        await loadMessages(integration.connectionId);
      }
    } catch (err) {
      setBanner(formatCatchError(err));
    } finally {
      setSending(false);
    }
  };

  const loadMore = () => {
    if (!integration?.connectionId || !nextPageToken) return;
    void loadMessages(integration.connectionId, { pageToken: nextPageToken, append: true });
  };

  const refreshMailbox = useCallback(async () => {
    if (!integration?.connectionId) return;
    await loadMessages(integration.connectionId);
    await loadFolderCounts(integration.connectionId);
  }, [integration?.connectionId, loadFolderCounts, loadMessages]);

  return {
    integration,
    loading,
    folderMeta,
    folderCounts,
    messages,
    selectedId,
    setSelectedId,
    detail,
    detailLoading,
    listLoading,
    loadingMore,
    nextPageToken,
    banner,
    syncing,
    searchInput,
    setSearchInput,
    activeSearch,
    composeOpen,
    setComposeOpen,
    composeForm,
    setComposeForm,
    sending,
    handleSync,
    handleSearch,
    clearSearch,
    handleSend,
    loadMore,
    refreshMailbox,
  };
}
