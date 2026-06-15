import { ExternalLink, FileSpreadsheet, FileText, Loader2 } from 'lucide-react';
import type { DriveFile } from './types';
import { FileTypeIcon } from '../shared/FileTypeIcon';
import { fileTypeLabel } from './utils';

type DriveFilePreviewProps = {
  blobUrl: string | null;
  mimeType: string | null;
  loading: boolean;
  error: string | null;
  fileName: string | null;
  file?: DriveFile | null;
  onOpenExternal?: () => void;
  fillHeight?: boolean;
};

export function DriveFilePreview({
  blobUrl,
  mimeType,
  loading,
  error,
  fileName,
  file,
  onOpenExternal,
  fillHeight = false,
}: DriveFilePreviewProps) {
  const heightClass = fillHeight ? 'h-full min-h-[200px]' : 'h-[min(420px,50vh)]';

  if (loading) {
    return (
      <div
        className={`flex items-center justify-center bg-[#1E293B] ${heightClass}`}
      >
        <div className="text-sm text-white/70 flex items-center gap-2">
          <Loader2 className="w-4 h-4 animate-spin" />
          Loading preview…
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div
        className={`flex flex-col items-center justify-center bg-[#1E293B] p-8 text-center ${heightClass}`}
      >
        {file && <FileTypeIcon file={file} className="w-14 h-14 mb-3" />}
        <p className="text-sm font-medium text-white/90">{error}</p>
        {onOpenExternal && (
          <button
            type="button"
            onClick={onOpenExternal}
            className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-[#93C5FD] hover:underline"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            Open in Google instead
          </button>
        )}
      </div>
    );
  }

  if (!blobUrl || !mimeType) {
    if (file) {
      const label = fileTypeLabel(file);
      return (
        <div
          className={`flex flex-col items-center justify-center bg-[#1E293B] ${heightClass}`}
        >
          <FileTypeIcon file={file} className="w-16 h-16" />
          {label === 'Sheet' && onOpenExternal && (
            <button
              type="button"
              onClick={onOpenExternal}
              className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#16A34A] text-white text-sm font-semibold hover:bg-[#15803D]"
            >
              <FileSpreadsheet className="w-4 h-4" />
              Open in Sheets
            </button>
          )}
          {label !== 'Sheet' && (
            <p className="text-sm text-white/70 mt-3">Preview not available</p>
          )}
        </div>
      );
    }
    return null;
  }

  const isImage = mimeType.startsWith('image/');
  const isVideo = mimeType.startsWith('video/');
  const isPdf = mimeType === 'application/pdf';

  return (
    <div className={`overflow-hidden bg-[#1E293B] ${heightClass}`}>
      {isImage && (
        <div className="h-full flex items-center justify-center p-4">
          <img
            src={blobUrl}
            alt={fileName ?? 'Preview'}
            className="max-w-full max-h-full object-contain rounded-lg"
          />
        </div>
      )}
      {isVideo && (
        <div className="h-full flex items-center justify-center bg-black relative">
          <video src={blobUrl} controls className="w-full h-full max-h-full" playsInline>
            Your browser does not support video playback.
          </video>
        </div>
      )}
      {isPdf && (
        <iframe
          title={fileName ?? 'Document preview'}
          src={blobUrl}
          className="w-full h-full border-0"
        />
      )}
      {!isImage && !isVideo && !isPdf && (
        <div className="h-full flex flex-col items-center justify-center p-8 text-center">
          <FileText className="w-12 h-12 text-white/40 mb-3" />
          <p className="text-sm text-white/70">Preview not available for this format.</p>
          {onOpenExternal && (
            <button
              type="button"
              onClick={onOpenExternal}
              className="mt-3 text-sm font-semibold text-[#93C5FD] hover:underline"
            >
              Open in Google
            </button>
          )}
        </div>
      )}
    </div>
  );
}
