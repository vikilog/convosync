import { Download, ExternalLink, MoreHorizontal, Share2 } from 'lucide-react';
import type { DriveFile } from './types';
import { FileTypeIcon, fileTypeBadgeClass } from '../shared/FileTypeIcon';
import {
  fileTypeLabel,
  formatBytes,
  formatDate,
  getDriveDownloadUrl,
  getDriveOpenUrl,
  openDriveFile,
} from './utils';

type DriveFileDetailsProps = {
  file: DriveFile;
};

export function DriveFileDetails({ file }: DriveFileDetailsProps) {
  const openUrl = getDriveOpenUrl(file);
  const downloadUrl = getDriveDownloadUrl(file);
  const typeLabel = fileTypeLabel(file);

  return (
    <div className="rounded-xl border border-[#E2E8F0] bg-white p-5 shadow-sm">
      <div className="flex items-start gap-3 mb-4">
        <FileTypeIcon file={file} className="w-10 h-10" />
        <div className="min-w-0 flex-1">
          <h2 className="text-lg font-bold text-[#0F172A] break-words">{file.name}</h2>
          <span
            className={`inline-block mt-2 text-sm font-semibold px-2 py-0.5 rounded-full ${fileTypeBadgeClass(file)}`}
          >
            {typeLabel}
          </span>
        </div>
      </div>

      <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm mb-5">
        <div>
          <dt className="text-xs font-medium text-[#64748B]">Owner</dt>
          <dd className="font-medium text-[#0F172A] mt-0.5 truncate">{file.owner ?? '—'}</dd>
        </div>
        <div>
          <dt className="text-xs font-medium text-[#64748B]">Size</dt>
          <dd className="font-medium text-[#0F172A] mt-0.5">{formatBytes(file.size)}</dd>
        </div>
        <div>
          <dt className="text-xs font-medium text-[#64748B]">Modified</dt>
          <dd className="font-medium text-[#0F172A] mt-0.5">{formatDate(file.modifiedTime)}</dd>
        </div>
        <div>
          <dt className="text-xs font-medium text-[#64748B]">Created</dt>
          <dd className="font-medium text-[#0F172A] mt-0.5">{formatDate(file.createdTime)}</dd>
        </div>
        <div>
          <dt className="text-xs font-medium text-[#64748B]">Shared with</dt>
          <dd className="font-medium text-[#0F172A] mt-0.5">{file.shared ? 'Shared' : 'Private'}</dd>
        </div>
        <div>
          <dt className="text-xs font-medium text-[#64748B]">Location</dt>
          <dd className="font-medium text-[#0F172A] mt-0.5">{file.isFolder ? 'Folder' : 'My Drive'}</dd>
        </div>
      </dl>

      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => openDriveFile(file)}
          className="inline-flex items-center gap-1.5 h-9 px-4 rounded-lg text-sm font-semibold bg-[#2563EB] text-white hover:bg-[#1D4ED8] transition-colors"
        >
          <ExternalLink className="w-4 h-4" />
          Open
        </button>
        <button
          type="button"
          onClick={() => window.open(openUrl, '_blank', 'noopener,noreferrer')}
          className="inline-flex items-center gap-1.5 h-9 px-3 rounded-lg text-sm font-semibold border border-[#E2E8F0] text-[#0F172A] bg-white hover:bg-[#F8FAFC]"
        >
          <Share2 className="w-4 h-4" />
          Share
        </button>
        {downloadUrl && !file.isFolder && (
          <a
            href={downloadUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 h-9 px-3 rounded-lg text-sm font-semibold border border-[#E2E8F0] text-[#0F172A] bg-white hover:bg-[#F8FAFC]"
          >
            <Download className="w-4 h-4" />
            Download
          </a>
        )}
        <button
          type="button"
          className="inline-flex items-center justify-center h-9 w-9 rounded-lg border border-[#E2E8F0] text-[#64748B] bg-white hover:bg-[#F8FAFC]"
          title="More actions"
        >
          <MoreHorizontal className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
