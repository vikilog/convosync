import { useNavigate } from 'react-router-dom';
import { HardDrive, Loader2, Upload } from 'lucide-react';
import { pathForTab } from '../../../routes';
import { GoogleToolsPageHeader } from '../shared/GoogleToolsPageHeader';
import { GoogleToolsSplitLayout } from '../shared/GoogleToolsSplitLayout';
import { PillSubTabs } from '../shared/PillSubTabs';
import type { DriveFile } from './types';
import { DriveFileList } from './DriveFileList';
import { DriveRightPanel } from './DriveRightPanel';
import { openDriveFile } from './utils';
import { useGoogleDrive } from './useGoogleDrive';

export function GoogleDriveView() {
  const navigate = useNavigate();
  const drive = useGoogleDrive();

  if (!drive.loading && !drive.integration) {
    return (
      <div className="flex flex-1 items-center justify-center p-8 bg-[#F8FAFC]">
        <div className="max-w-md text-center rounded-xl border border-[#E2E8F0] bg-white px-8 py-10 shadow-sm">
          <HardDrive className="w-10 h-10 mx-auto text-[#2563EB] mb-4" />
          <h2 className="text-lg font-bold text-[#0F172A]">Google Drive not connected</h2>
          <p className="text-sm text-[#64748B] mt-2">Connect Drive from Integrations → Google.</p>
          <button
            type="button"
            onClick={() => navigate(`${pathForTab('integrations')}?channel=google`)}
            className="mt-5 px-4 py-2.5 rounded-lg bg-[#2563EB] text-white text-sm font-semibold hover:bg-[#1D4ED8]"
          >
            Go to Integrations
          </button>
        </div>
      </div>
    );
  }

  if (drive.loading) {
    return (
      <div className="flex flex-1 items-center justify-center text-sm text-[#64748B]">
        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
        Loading Google Drive…
      </div>
    );
  }

  const detail = drive.selectedDetail ?? drive.selected;

  const handleFileActivate = (file: DriveFile) => {
    drive.setSelectedId(file.id);
    if (file.isFolder) {
      drive.openFolder(file.id);
    }
  };

  return (
    <GoogleToolsSplitLayout
      header={
        <GoogleToolsPageHeader
          toolLabel="Google Drive"
          email={drive.integration?.connectionEmail ?? null}
          avatarClassName="bg-amber-100 text-amber-700"
          lastSyncAt={drive.integration?.lastSyncAt ?? null}
          syncing={drive.syncing}
          onSync={() => void drive.handleSync()}
          onRefresh={() => {
            if (drive.integration) void drive.refresh();
          }}
          actions={
            <button
              type="button"
              title="Upload coming via Drive API"
              className="inline-flex items-center gap-2 h-9 px-3 rounded-lg text-sm font-semibold bg-[#2563EB] text-white hover:bg-[#1D4ED8] transition-colors"
            >
              <Upload className="w-4 h-4" />
              Upload
            </button>
          }
        />
      }
      subTabs={
        <PillSubTabs
          tabs={[
            {
              id: 'my',
              label: 'My Drive',
              active: drive.view === 'my' && !drive.folderId,
              onClick: () => {
                drive.setView('my');
                drive.setFolderId(null);
              },
            },
            {
              id: 'shared',
              label: 'Shared with me',
              active: drive.view === 'shared',
              onClick: () => drive.setView('shared'),
            },
            {
              id: 'recent',
              label: 'Recent',
              active: drive.view === 'recent',
              onClick: () => drive.setView('recent'),
            },
            {
              id: 'folders',
              label: 'Folders',
              active: drive.view === 'folders',
              onClick: () => drive.setView('folders'),
            },
          ]}
        />
      }
      banner={
        drive.message ? (
          <div className="shrink-0 px-4 py-2 text-xs font-medium text-[#0F172A] bg-[#EFF6FF] border-b border-[#BFDBFE]">
            {drive.message}
          </div>
        ) : null
      }
      leftPanel={
        <DriveFileList
          files={drive.files}
          selectedId={drive.selectedId}
          layout={drive.layout}
          searchQuery={drive.searchQuery}
          listLoading={drive.listLoading}
          hasMore={drive.hasMore}
          folderId={drive.folderId}
          onSearchChange={drive.setSearchQuery}
          onLayoutChange={drive.setLayout}
          onSelect={handleFileActivate}
          onOpen={openDriveFile}
          onFolderBack={() => drive.setFolderId(null)}
          onLoadMore={drive.loadMore}
        />
      }
      rightPanel={<DriveRightPanel file={detail} preview={drive.preview} />}
    />
  );
}
