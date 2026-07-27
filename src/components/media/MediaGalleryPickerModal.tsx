/**
 * Pick an image from Media Gallery.
 * Thumbs via auth /file; picked src = S3 presigned URL (bucket is private).
 */
import React, { useCallback, useEffect, useState } from 'react';
import { Image as ImageIcon, Loader2, Search, X } from 'lucide-react';
import { api, formatCatchError } from '../../lib/api';

export type PickedGalleryImage = {
  id: string;
  url: string;
  title: string;
  filename: string;
};

type GalleryRow = {
  id: string;
  title: string;
  filename: string;
  thumbUrl?: string;
};

type Props = {
  open: boolean;
  onClose: () => void;
  onPick: (image: PickedGalleryImage) => void;
};

function mapImage(raw: Record<string, unknown>): GalleryRow | null {
  if (String(raw.type ?? '') !== 'image') return null;
  if (raw.isActive === false) return null;
  const id = String(raw.id ?? '');
  if (!id) return null;
  return {
    id,
    title: String(raw.title ?? raw.filename ?? 'Image'),
    filename: String(raw.filename ?? ''),
  };
}

export function MediaGalleryPickerModal({ open, onClose, onPick }: Props) {
  const [items, setItems] = useState<GalleryRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [pickingId, setPickingId] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const raw = (await api.getMediaGallery({ activeOnly: true })) as Record<
        string,
        unknown
      >[];
      const rows = raw.map(mapImage).filter((x): x is GalleryRow => Boolean(x));

      const withThumbs = await Promise.all(
        rows.map(async (row) => {
          try {
            const blob = await api.fetchMediaGalleryFile(row.id);
            if (!blob.type.startsWith('image/')) return row;
            return { ...row, thumbUrl: URL.createObjectURL(blob) };
          } catch {
            return row;
          }
        })
      );
      setItems(withThumbs);
    } catch (e) {
      setItems([]);
      setError(formatCatchError(e));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!open) return;
    setSearch('');
    void load();
  }, [open, load]);

  useEffect(() => {
    if (open) return;
    for (const item of items) {
      if (item.thumbUrl?.startsWith('blob:')) URL.revokeObjectURL(item.thumbUrl);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- revoke only on close
  }, [open]);

  const handlePick = async (item: GalleryRow) => {
    setPickingId(item.id);
    setError('');
    try {
      const signed = await api.getMediaGallerySignedUrl(item.id);
      onPick({
        id: item.id,
        url: signed.url,
        title: item.title,
        filename: item.filename,
      });
      onClose();
    } catch (e) {
      setError(formatCatchError(e));
    } finally {
      setPickingId(null);
    }
  };

  if (!open) return null;

  const q = search.trim().toLowerCase();
  const filtered = q
    ? items.filter(
        (i) =>
          i.title.toLowerCase().includes(q) || i.filename.toLowerCase().includes(q)
      )
    : items;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/40">
      <div
        role="dialog"
        aria-labelledby="media-gallery-picker-title"
        className="w-full max-w-2xl max-h-[min(80vh,640px)] flex flex-col rounded-2xl border border-black/5 bg-surface shadow-xl"
      >
        <div className="flex items-center justify-between gap-3 px-5 py-4 border-b border-black/5 shrink-0">
          <div className="min-w-0">
            <h2
              id="media-gallery-picker-title"
              className="text-sm font-bold text-gray-900 flex items-center gap-2"
            >
              <ImageIcon className="w-4 h-4 text-primary" />
              Pick from Media Gallery
            </h2>
            <p className="text-xs text-gray-400 mt-0.5">
              Uses a secure image link (S3 bucket is private)
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={Boolean(pickingId)}
            className="p-2 rounded-lg hover:bg-surface-muted text-gray-500 disabled:opacity-50"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="px-5 py-3 border-b border-black/5 shrink-0">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search images…"
              className="w-full rounded-xl border border-black/10 bg-surface-muted py-2 pl-9 pr-3 text-sm outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>
        </div>

        <div className="flex-1 min-h-0 overflow-y-auto p-5">
          {loading ? (
            <div className="flex justify-center py-16 text-gray-400">
              <Loader2 className="w-8 h-8 animate-spin" />
            </div>
          ) : error && items.length === 0 ? (
            <p className="text-sm font-semibold text-red-600 bg-red-50 border border-red-100 rounded-xl px-3 py-2">
              {error}
            </p>
          ) : filtered.length === 0 ? (
            <div className="text-center py-12">
              <ImageIcon className="w-10 h-10 text-gray-300 mx-auto mb-2" />
              <p className="text-sm font-bold text-gray-600">
                {items.length === 0 ? 'No images in Media Gallery' : 'No matches'}
              </p>
              <p className="text-xs text-gray-400 mt-1">
                {items.length === 0
                  ? 'Upload images under Media Gallery, then pick them here.'
                  : 'Try a different search.'}
              </p>
            </div>
          ) : (
            <>
              {error ? (
                <p className="mb-3 text-sm font-semibold text-red-600 bg-red-50 border border-red-100 rounded-xl px-3 py-2">
                  {error}
                </p>
              ) : null}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {filtered.map((item) => {
                  const busy = pickingId === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      disabled={Boolean(pickingId)}
                      onClick={() => void handlePick(item)}
                      className="group text-left rounded-xl border border-black/5 bg-surface-muted/40 overflow-hidden hover:border-primary/40 hover:ring-2 hover:ring-primary/15 transition-all disabled:opacity-60"
                    >
                      <div className="aspect-[4/3] bg-slate-100 overflow-hidden relative flex items-center justify-center">
                        {item.thumbUrl ? (
                          <img
                            src={item.thumbUrl}
                            alt={item.title}
                            className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform"
                          />
                        ) : (
                          <ImageIcon className="w-8 h-8 text-gray-300" />
                        )}
                        {busy ? (
                          <div className="absolute inset-0 bg-white/70 flex items-center justify-center">
                            <Loader2 className="w-6 h-6 animate-spin text-primary" />
                          </div>
                        ) : null}
                      </div>
                      <div className="px-2.5 py-2">
                        <p className="text-xs font-bold text-gray-800 truncate">{item.title}</p>
                        {item.filename ? (
                          <p className="text-[10px] text-gray-400 truncate mt-0.5">
                            {item.filename}
                          </p>
                        ) : null}
                      </div>
                    </button>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
