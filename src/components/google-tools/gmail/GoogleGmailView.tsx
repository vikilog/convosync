import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail } from 'lucide-react';
import { pathForTab } from '../../../routes';
import { useRegisterGoogleToolsToolbar } from '../GoogleToolsToolbarContext';
import { GmailBanner, GmailHeader, GmailLoadingState } from './GmailHeader';
import { GmailComposeDialog } from './GmailComposeDialog';
import { GmailMessageList } from './GmailMessageList';
import { GmailReadingPane } from './GmailReadingPane';
import { GmailSidebar } from './GmailSidebar';
import type { GmailFolder } from './types';
import { useGmailMailbox } from './useGmailMailbox';

export function GoogleGmailView() {
  const navigate = useNavigate();
  const [folder, setFolder] = useState<GmailFolder>('inbox');
  const [mobilePane, setMobilePane] = useState<'list' | 'read'>('list');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const mailbox = useGmailMailbox(folder);

  const onRefresh = useCallback(() => void mailbox.refreshMailbox(), [mailbox.refreshMailbox]);
  const onSync = useCallback(() => void mailbox.handleSync(), [mailbox.handleSync]);

  useRegisterGoogleToolsToolbar(
    mailbox.integration
      ? {
          tool: 'gmail',
          email: mailbox.integration.connectionEmail,
          lastSyncAt: mailbox.integration.lastSyncAt,
          syncing: mailbox.syncing,
          onRefresh,
          onSync,
        }
      : { tool: 'gmail' }
  );

  useEffect(() => {
    if (mailbox.selectedId) setMobilePane('read');
  }, [mailbox.selectedId]);

  const handleSelect = (id: string) => {
    mailbox.setSelectedId(id);
    setMobilePane('read');
  };

  const handleFolderChange = (next: GmailFolder) => {
    setFolder(next);
    setMobilePane('list');
    setSidebarOpen(false);
  };

  if (!mailbox.loading && !mailbox.integration) {
    return (
      <div className="flex flex-1 items-center justify-center p-8 bg-slate-50">
        <div className="max-w-md text-center rounded-2xl border border-slate-200 bg-white px-8 py-10 shadow-[0_4px_24px_rgba(91,76,245,0.06)]">
          <Mail className="w-10 h-10 mx-auto text-[#EA4335] mb-4" />
          <h2 className="text-lg font-black text-gray-950">Gmail not connected</h2>
          <p className="text-sm text-gray-500 mt-2 leading-relaxed">
            Connect Gmail from Integrations → Google to read and send mail here.
          </p>
          <button
            type="button"
            onClick={() => navigate(`${pathForTab('integrations')}?channel=google`)}
            className="mt-5 px-4 py-2.5 rounded-xl bg-primary text-white text-sm font-bold shadow-[0_2px_8px_rgba(91,76,245,0.25)]"
          >
            Go to Integrations
          </button>
        </div>
      </div>
    );
  }

  if (mailbox.loading) {
    return <GmailLoadingState label="Loading Gmail…" />;
  }

  const showList = mobilePane === 'list';
  const showRead = mobilePane === 'read';

  return (
    <div className="flex h-full w-full min-w-0 max-w-full overflow-hidden bg-white">
      {sidebarOpen && (
        <button
          type="button"
          aria-label="Close sidebar overlay"
          className="lg:hidden fixed inset-0 z-30 bg-black/20 backdrop-blur-[1px]"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <div
        className={`${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } lg:translate-x-0 fixed lg:relative z-40 lg:z-auto h-full shrink-0 transition-transform duration-200 ease-out shadow-xl lg:shadow-none`}
      >
        <GmailSidebar
          folder={folder}
          onFolderChange={handleFolderChange}
          folderCounts={mailbox.folderCounts}
          onClose={() => setSidebarOpen(false)}
        />
      </div>

      <div className="flex flex-1 flex-col min-w-0 min-h-0 overflow-hidden">
        <GmailHeader
          searchInput={mailbox.searchInput}
          onSearchInputChange={mailbox.setSearchInput}
          onSearchSubmit={mailbox.handleSearch}
          activeSearch={mailbox.activeSearch}
          onClearSearch={mailbox.clearSearch}
          onCompose={() => mailbox.setComposeOpen(true)}
          onToggleSidebar={() => setSidebarOpen(true)}
        />

        <GmailBanner message={mailbox.banner} />

        <div className="relative flex flex-1 min-h-0 min-w-0 overflow-hidden">
          <div
            className={`min-w-0 min-h-0 overflow-hidden ${
              showList ? 'flex w-full lg:w-auto' : 'hidden lg:flex'
            }`}
          >
            <GmailMessageList
              folder={folder}
              messages={mailbox.messages}
              selectedId={mailbox.selectedId}
              onSelect={handleSelect}
              loading={mailbox.listLoading}
              loadingMore={mailbox.loadingMore}
              hasMore={Boolean(mailbox.nextPageToken)}
              onLoadMore={mailbox.loadMore}
            />
          </div>

          <div
            className={`flex-1 min-w-0 min-h-0 overflow-hidden ${
              showRead ? 'flex' : 'hidden lg:flex'
            }`}
          >
            <GmailReadingPane
              detail={mailbox.detail}
              loading={mailbox.detailLoading}
              empty={!mailbox.selectedId}
              showBack={mobilePane === 'read'}
              onBack={() => setMobilePane('list')}
            />
          </div>
        </div>
      </div>

      <GmailComposeDialog
        open={mailbox.composeOpen}
        onClose={() => mailbox.setComposeOpen(false)}
        form={mailbox.composeForm}
        onChange={mailbox.setComposeForm}
        onSubmit={(e) => void mailbox.handleSend(e)}
        sending={mailbox.sending}
      />
    </div>
  );
}
