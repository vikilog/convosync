/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useRef, useState } from 'react';
import { Folder, Image as ImageIcon, Upload, X } from 'lucide-react';
import { MediaGalleryBrowser, type PickedGalleryImage } from '../media/MediaGalleryPickerModal';
import { telegramFileSizeError } from '../../lib/telegramMediaLimits';

type Source = 'device' | 'gallery';

type SendMediaDialogProps = {
  open: boolean;
  onClose: () => void;
  /** Multi-select (album) is only meaningful where the channel supports it — Telegram today. */
  allowMultiSelect: boolean;
  /** Same gate as allowMultiSelect in practice (Telegram-only today) — kept separate since the two are different concerns. */
  enforceTelegramLimits: boolean;
  maxSelect?: number;
  onDeviceFiles: (files: File[]) => void;
  onGalleryPick: (image: PickedGalleryImage) => void;
  onGalleryPickMultiple: (images: PickedGalleryImage[]) => void;
};

export function SendMediaDialog({
  open,
  onClose,
  allowMultiSelect,
  enforceTelegramLimits,
  maxSelect,
  onDeviceFiles,
  onGalleryPick,
  onGalleryPickMultiple,
}: SendMediaDialogProps) {
  const [source, setSource] = useState<Source>('device');
  const [multiSelect, setMultiSelect] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!open) return null;

  const cap = maxSelect ?? 10;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 sm:items-center">
      <div
        className="w-full max-w-lg rounded-xl bg-white ring-1 ring-slate-200/80 shadow-xl"
        role="dialog"
        aria-modal="true"
        aria-labelledby="send-media-title"
      >
        <div className="flex items-center justify-between border-b border-[#E5E7EB] px-5 py-3">
          <h4 id="send-media-title" className="text-sm font-bold text-slate-900">
            Send media
          </h4>
          <button
            type="button"
            onClick={onClose}
            className="cursor-pointer rounded-lg p-1 text-slate-500 hover:bg-slate-100"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="px-5 py-4 space-y-3">
          <div className="grid grid-cols-2 gap-2 rounded-xl bg-surface-muted p-1">
            <button
              type="button"
              onClick={() => {
                setSource('device');
                setError('');
              }}
              className={`flex items-center justify-center gap-1.5 rounded-lg py-2 text-sm font-bold transition-colors ${
                source === 'device' ? 'bg-white shadow-sm text-primary' : 'text-gray-500'
              }`}
            >
              <Folder className="h-4 w-4" />
              Device
            </button>
            <button
              type="button"
              onClick={() => {
                setSource('gallery');
                setError('');
              }}
              className={`flex items-center justify-center gap-1.5 rounded-lg py-2 text-sm font-bold transition-colors ${
                source === 'gallery' ? 'bg-white shadow-sm text-primary' : 'text-gray-500'
              }`}
            >
              <ImageIcon className="h-4 w-4" />
              Media Gallery
            </button>
          </div>

          {allowMultiSelect && (
            <label className="flex items-center gap-2.5 text-sm font-medium text-gray-700 cursor-pointer">
              <input
                type="checkbox"
                checked={multiSelect}
                onChange={(e) => setMultiSelect(e.target.checked)}
                className="h-4 w-4 rounded border-gray-300 accent-primary"
              />
              Select multiple (up to {cap}) — sends as an album
            </label>
          )}

          {error && (
            <p className="text-sm font-semibold text-red-600 bg-red-50 border border-red-100 rounded-xl px-3 py-2">
              {error}
            </p>
          )}

          {source === 'device' ? (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="flex w-full flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-slate-200 bg-surface-muted/40 py-8 text-center hover:border-primary/40 hover:bg-primary/5 transition-colors"
            >
              <Upload className="h-6 w-6 text-primary" />
              <span className="text-sm font-bold text-gray-800">
                {multiSelect ? 'Choose files' : 'Choose a file'}
              </span>
              <span className="text-xs text-gray-400">
                {multiSelect ? `Pick 2–${cap} photos or videos` : 'Click to browse your device'}
              </span>
              <input
                ref={fileInputRef}
                type="file"
                multiple={multiSelect}
                className="hidden"
                accept={
                  multiSelect
                    ? 'image/*,video/*'
                    : 'image/*,video/*,audio/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt'
                }
                onChange={(e) => {
                  const fileList = e.target.files;
                  const files: File[] = [];
                  if (fileList) {
                    for (let i = 0; i < fileList.length && i < cap; i++) {
                      const f = fileList.item(i);
                      if (f) files.push(f);
                    }
                  }
                  if (files.length === 0) return;
                  if (enforceTelegramLimits) {
                    const sizeError = files.map(telegramFileSizeError).find(Boolean);
                    if (sizeError) {
                      setError(sizeError);
                      e.target.value = '';
                      return;
                    }
                  }
                  setError('');
                  onDeviceFiles(files);
                  onClose();
                }}
              />
            </button>
          ) : (
            <MediaGalleryBrowser
              active={open}
              multiple={multiSelect}
              maxSelect={cap}
              embedded
              onPick={(image) => {
                onGalleryPick(image);
                onClose();
              }}
              onPickMultiple={
                multiSelect
                  ? (images) => {
                      onGalleryPickMultiple(images);
                      onClose();
                    }
                  : undefined
              }
            />
          )}
        </div>
      </div>
    </div>
  );
}
