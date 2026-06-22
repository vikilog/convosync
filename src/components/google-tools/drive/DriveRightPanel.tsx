import { HardDrive } from 'lucide-react';
import type { DriveFile } from './types';
import type { DrivePreviewState } from './useGoogleDrive';
import { DriveFilePreview } from './DriveFilePreview';
import { DriveFileDetails } from './DriveFileDetails';
import { FileTypeIcon } from '../shared/FileTypeIcon';
import { openDriveFile } from './utils';

type DriveRightPanelProps = {
  file: DriveFile | null;
  preview: DrivePreviewState;
};

export function DriveRightPanel({ file, preview }: DriveRightPanelProps) {
  if (!file) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-8 text-center">
        <HardDrive className="w-16 h-16 text-[#CBD5E1] mb-4" />
        <h3 className="text-base font-semibold text-[#0F172A]">Select a file to preview</h3>
        <p className="text-sm text-[#64748B] mt-1 max-w-xs">
          Click any file from the list to view details
        </p>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col min-h-0 overflow-hidden">
      <div className="h-[55%] min-h-[200px] shrink-0 overflow-hidden border-b border-[#E2E8F0]">
        {file.isFolder ? (
          <div className="h-full flex flex-col items-center justify-center bg-[#1E293B]">
            <FileTypeIcon file={file} className="w-16 h-16" />
            <p className="text-sm text-white/80 mt-3">Folder — double-click to open</p>
          </div>
        ) : (
          <DriveFilePreview
            blobUrl={preview.blobUrl}
            mimeType={preview.mimeType}
            loading={preview.loading}
            error={preview.error}
            fileName={file.name}
            file={file}
            onOpenExternal={() => openDriveFile(file)}
            fillHeight
          />
        )}
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto p-4">
        <DriveFileDetails file={file} />
      </div>
    </div>
  );
}
