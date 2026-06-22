import {
  File,
  FileSpreadsheet,
  FileText,
  FileVideo,
  Folder,
  Image as ImageIcon,
} from 'lucide-react';
import type { DriveFile } from '../drive/types';
import { fileTypeLabel } from '../drive/utils';

type FileTypeIconProps = {
  file: DriveFile;
  className?: string;
};

export function FileTypeIcon({ file, className = 'w-8 h-8' }: FileTypeIconProps) {
  if (file.thumbnailLink && !file.isFolder) {
    return (
      <img
        src={file.thumbnailLink}
        alt=""
        className={`${className} rounded-lg object-cover shrink-0`}
      />
    );
  }

  const label = fileTypeLabel(file);
  let icon = <File className="w-4 h-4" />;
  let colors = 'bg-slate-100 text-slate-600';

  if (file.isFolder || label === 'Folder') {
    icon = <Folder className="w-4 h-4" />;
    colors = 'bg-amber-100 text-amber-600';
  } else if (label === 'Sheet') {
    icon = <FileSpreadsheet className="w-4 h-4" />;
    colors = 'bg-emerald-100 text-emerald-600';
  } else if (label === 'Doc' || label === 'Slides') {
    icon = <FileText className="w-4 h-4" />;
    colors = 'bg-blue-100 text-blue-600';
  } else if (label === 'PDF') {
    icon = <FileText className="w-4 h-4" />;
    colors = 'bg-red-100 text-red-600';
  } else if (label === 'Video') {
    icon = <FileVideo className="w-4 h-4" />;
    colors = 'bg-violet-100 text-violet-600';
  } else if (label === 'Image') {
    icon = <ImageIcon className="w-4 h-4" />;
    colors = 'bg-sky-100 text-sky-600';
  }

  return (
    <div
      className={`${className} rounded-lg flex items-center justify-center shrink-0 ${colors}`}
    >
      {icon}
    </div>
  );
}

export function fileTypeBadgeClass(file: DriveFile): string {
  const label = fileTypeLabel(file);
  if (file.isFolder || label === 'Folder') return 'bg-amber-100 text-amber-700';
  if (label === 'Sheet') return 'bg-emerald-100 text-emerald-700';
  if (label === 'Doc' || label === 'Slides') return 'bg-blue-100 text-blue-700';
  if (label === 'PDF') return 'bg-red-100 text-red-700';
  if (label === 'Video') return 'bg-violet-100 text-violet-700';
  if (label === 'Image') return 'bg-sky-100 text-sky-700';
  return 'bg-slate-100 text-slate-700';
}
