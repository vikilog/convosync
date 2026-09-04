/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Plus, Search, Loader2, Smile, Paperclip, Trash2, X, FileText } from 'lucide-react';
import { api } from '../../lib/api';
import type { CannedResponseRecord } from './CannedResponseModal';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';

const SHORTCUT_MAX = 150;
const CONTENT_MAX = 1024;
const MEDIA_ACCEPT =
  'image/*,video/*,audio/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt';

const QUICK_EMOJIS = ['👋', '🙂', '🙏', '✅', '❤️', '👍', '🎉', '📦', '⏰', '💬'];

type SavePayload = { title: string; content: string; shortcut?: string | null };

type MediaOptions = { file?: File | null; removeMedia?: boolean };

type Props = {
  items: CannedResponseRecord[];
  loading: boolean;
  saving: boolean;
  error?: string;
  onSave: (id: string | null, payload: SavePayload, media?: MediaOptions) => Promise<string | void>;
  onDelete: (item: CannedResponseRecord) => Promise<void>;
};

function listLabel(item: CannedResponseRecord): string {
  if (item.title.trim()) return item.title;
  if (item.shortcut?.trim()) return item.shortcut;
  return 'New Canned Response';
}

function deriveTitle(shortcut: string, content: string): string {
  const s = shortcut.trim();
  if (s) return s;
  const c = content.trim();
  if (c) return c.slice(0, 50);
  return 'New Canned Response';
}

export const CannedResponsesPanel: React.FC<Props> = ({
  items,
  loading,
  saving,
  error,
  onSave,
  onDelete,
}) => {
  const [search, setSearch] = useState('');
  const [selectedId, setSelectedId] = useState<string | 'new' | null>(null);
  const [shortcut, setShortcut] = useState('');
  const [content, setContent] = useState('');
  const [showEmoji, setShowEmoji] = useState(false);
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [removeMedia, setRemoveMedia] = useState(false);
  const [existingMediaUrl, setExistingMediaUrl] = useState<string | null>(null);
  const contentRef = useRef<HTMLTextAreaElement>(null);
  const emojiRef = useRef<HTMLDivElement>(null);
  const mediaInputId = 'canned-response-media-upload';

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return items;
    return items.filter(
      (item) =>
        listLabel(item).toLowerCase().includes(q) ||
        item.content.toLowerCase().includes(q) ||
        (item.shortcut ?? '').toLowerCase().includes(q)
    );
  }, [items, search]);

  const selectedItem =
    selectedId && selectedId !== 'new' ? items.find((i) => i.id === selectedId) ?? null : null;

  useEffect(() => {
    if (loading) return;
    if (selectedId === 'new') return;
    if (selectedId && items.some((i) => i.id === selectedId)) return;
    if (filtered.length > 0) setSelectedId(filtered[0].id);
    else if (items.length === 0) setSelectedId('new');
    else setSelectedId(null);
  }, [loading, items, filtered, selectedId]);

  useEffect(() => {
    if (selectedId === 'new') {
      setShortcut('');
      setContent('');
      setMediaFile(null);
      setRemoveMedia(false);
      return;
    }
    if (selectedItem) {
      setShortcut(selectedItem.shortcut ?? '');
      setContent(selectedItem.content);
      setMediaFile(null);
      setRemoveMedia(false);
    } else {
      setShortcut('');
      setContent('');
      setMediaFile(null);
      setRemoveMedia(false);
    }
  }, [selectedId, selectedItem]);

  useEffect(() => {
    let objectUrl: string | null = null;
    let cancelled = false;

    const load = async () => {
      if (mediaFile) {
        objectUrl = URL.createObjectURL(mediaFile);
        setExistingMediaUrl(objectUrl);
        return;
      }
      if (selectedItem?.hasMedia && !removeMedia) {
        try {
          const blob = await api.fetchCannedResponseMedia(selectedItem.id);
          if (cancelled) return;
          objectUrl = URL.createObjectURL(blob);
          setExistingMediaUrl(objectUrl);
        } catch {
          if (!cancelled) setExistingMediaUrl(null);
        }
        return;
      }
      setExistingMediaUrl(null);
    };

    void load();
    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [selectedItem, mediaFile, removeMedia]);

  useEffect(() => {
    if (!showEmoji) return;
    const onDoc = (e: MouseEvent) => {
      if (emojiRef.current && !emojiRef.current.contains(e.target as Node)) {
        setShowEmoji(false);
      }
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, [showEmoji]);

  const insertEmoji = (emoji: string) => {
    const el = contentRef.current;
    if (!el) {
      setContent((prev) => (prev + emoji).slice(0, CONTENT_MAX));
      setShowEmoji(false);
      return;
    }
    const start = el.selectionStart ?? content.length;
    const end = el.selectionEnd ?? content.length;
    const next = content.slice(0, start) + emoji + content.slice(end);
    setContent(next.slice(0, CONTENT_MAX));
    setShowEmoji(false);
    requestAnimationFrame(() => {
      el.focus();
      const pos = start + emoji.length;
      el.setSelectionRange(pos, pos);
    });
  };

  const handleAdd = () => {
    setSelectedId('new');
    setSearch('');
    setMediaFile(null);
    setRemoveMedia(false);
  };

  const handlePickMedia = (file: File) => {
    setMediaFile(file);
    setRemoveMedia(false);
  };

  const handleClearMedia = () => {
    setMediaFile(null);
    if (selectedItem?.hasMedia) setRemoveMedia(true);
  };

  const hasMediaAttached =
    Boolean(mediaFile) || Boolean(selectedItem?.hasMedia && !removeMedia);

  const handleSave = async () => {
    if (!content.trim() && !hasMediaAttached) return;
    const payload: SavePayload = {
      title: deriveTitle(shortcut, content),
      content: content.trim(),
      shortcut: shortcut.trim() || null,
    };
    const savedId = await onSave(selectedId === 'new' ? null : selectedId, payload, {
      file: mediaFile,
      removeMedia: removeMedia && !mediaFile,
    });
    if (savedId) {
      setSelectedId(savedId);
      setMediaFile(null);
      setRemoveMedia(false);
    } else if (selectedId === 'new') {
      setSelectedId(null);
    } else {
      setMediaFile(null);
      setRemoveMedia(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedItem) return;
    if (!window.confirm(`Delete canned response "${listLabel(selectedItem)}"?`)) return;
    await onDelete(selectedItem);
    setSelectedId(null);
  };

  const canSave = (content.trim().length > 0 || hasMediaAttached) && !saving;

  const previewMime = mediaFile?.type || selectedItem?.mediaMimeType || '';
  const previewName = mediaFile?.name || selectedItem?.mediaFileName || 'attachment';

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden bg-white border border-swiss-line">
      <div className="shrink-0 border-b border-swiss-line px-5 py-4 sm:px-6">
        <h2 className="text-lg font-semibold text-dark-navy">Canned Response</h2>
        <p className="mt-1 text-sm text-swiss-muted">
          Configure preset quick replies that are standardized across the team for the inbox.
        </p>
      </div>

      <div className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-b border-swiss-line px-5 py-3 sm:px-6">
        <button
          type="button"
          onClick={handleAdd}
          className="inline-flex items-center gap-1.5 rounded-xl bg-swiss-accent px-3.5 py-2 text-sm font-semibold text-white hover:bg-swiss-accent-hover"
        >
          <Plus className="h-4 w-4" />
          Add Canned Response
        </button>
        <div className="relative w-full sm:w-72">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-swiss-faint" />
          <Input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by short code or content"
            className="h-auto w-full rounded-xl border border-swiss-line bg-white py-2 pl-9 pr-3 text-sm outline-none focus:ring-2 focus:ring-swiss-accent/15"
          />
        </div>
      </div>

      {error && (
        <p className="mx-5 mt-3 rounded-xl border border-red-100 bg-red-50 p-3 text-sm font-semibold text-red-500 sm:mx-6">
          {error}
        </p>
      )}

      {loading ? (
        <div className="flex flex-1 items-center justify-center text-swiss-faint">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      ) : (
        <div className="flex min-h-0 flex-1">
          <div className="w-[min(280px,40%)] shrink-0 overflow-y-auto border-r border-swiss-line">
            {selectedId === 'new' && (
              <button
                type="button"
                className="relative w-full border-b border-swiss-line bg-swiss-accent/[0.04] px-4 py-3.5 text-left"
              >
                <span className="absolute bottom-0 left-0 top-0 w-1 rounded-r bg-swiss-accent" />
                <p className="pl-2 text-sm font-semibold text-dark-navy">New Canned Response</p>
              </button>
            )}
            {filtered.map((item) => {
              const active = selectedId === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setSelectedId(item.id)}
                  className={`relative w-full border-b border-swiss-line px-4 py-3.5 text-left transition-colors ${
                    active ? 'bg-swiss-accent/[0.04]' : 'hover:bg-surface-muted/70'
                  }`}
                >
                  {active && (
                    <span className="absolute bottom-0 left-0 top-0 w-1 rounded-r bg-swiss-accent" />
                  )}
                  <p className="flex items-center gap-1.5 truncate pl-2 text-sm font-semibold text-dark-navy">
                    <span className="truncate">{listLabel(item)}</span>
                    {item.hasMedia && <Paperclip className="h-3 w-3 shrink-0 text-swiss-faint" />}
                  </p>
                </button>
              );
            })}
            {filtered.length === 0 && selectedId !== 'new' && (
              <p className="p-6 text-center text-sm text-swiss-faint">No canned responses found</p>
            )}
          </div>

          <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-y-auto p-5 sm:p-6">
            {selectedId == null && filtered.length === 0 ? (
              <div className="flex flex-1 flex-col items-center justify-center py-12 text-center">
                <p className="text-sm font-semibold text-swiss-ink">No canned responses yet</p>
                <p className="mt-1 max-w-sm text-xs text-swiss-faint">
                  Add quick replies your team can insert while chatting in Inbox.
                </p>
                <button
                  type="button"
                  onClick={handleAdd}
                  className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-swiss-accent px-3.5 py-2 text-sm font-semibold text-white hover:bg-swiss-accent-hover"
                >
                  <Plus className="h-4 w-4" />
                  Add Canned Response
                </button>
              </div>
            ) : selectedId == null ? (
              <div className="flex flex-1 items-center justify-center text-sm text-swiss-faint">
                Select a canned response from the list
              </div>
            ) : (
              <>
                <div className="min-h-0 flex-1 space-y-5">
                  <div>
                    <div className="mb-1.5 flex items-center justify-between">
                      <label className="text-sm font-semibold text-dark-navy">Short code</label>
                      <span className="text-xs text-swiss-faint">
                        {shortcut.length}/{SHORTCUT_MAX}
                      </span>
                    </div>
                    <Input
                      type="text"
                      value={shortcut}
                      onChange={(e) =>
                        setShortcut(e.target.value.replace(/\s/g, '').slice(0, SHORTCUT_MAX))
                      }
                      placeholder="Text that trigger canned responses"
                      className="h-auto w-full rounded-xl border border-swiss-line bg-white px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-swiss-accent/15"
                    />
                  </div>

                  <div className="flex min-h-0 flex-1 flex-col">
                    <label className="mb-1.5 text-sm font-semibold text-dark-navy">Content</label>
                    <div className="flex min-h-[280px] flex-1 flex-col overflow-hidden rounded-xl border border-swiss-line">
                      <div className="relative flex items-center gap-1 border-b border-swiss-line bg-white px-2 py-1.5">
                        <div ref={emojiRef} className="relative">
                          <button
                            type="button"
                            onClick={() => setShowEmoji((v) => !v)}
                            className="rounded-md p-1.5 text-swiss-muted hover:bg-surface hover:text-dark-navy"
                            title="Insert emoji"
                          >
                            <Smile className="h-4 w-4" />
                          </button>
                          {showEmoji && (
                            <div className="absolute left-0 top-full z-10 mt-1 flex w-[200px] flex-wrap gap-1 bg-white border border-swiss-line p-2">
                              {QUICK_EMOJIS.map((emoji) => (
                                <button
                                  key={emoji}
                                  type="button"
                                  onClick={() => insertEmoji(emoji)}
                                  className="h-8 w-8 rounded text-lg hover:bg-surface-muted"
                                >
                                  {emoji}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                        <label
                          htmlFor={mediaInputId}
                          className="cursor-pointer rounded-md p-1.5 text-swiss-ink transition-colors hover:bg-surface hover:text-swiss-accent"
                          title="Attach image, video, audio, or document"
                        >
                          <Paperclip className="pointer-events-none h-4 w-4" />
                        </label>
                        <input
                          id={mediaInputId}
                          type="file"
                          accept={MEDIA_ACCEPT}
                          className="sr-only"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) handlePickMedia(file);
                            e.target.value = '';
                          }}
                        />
                      </div>
                      {hasMediaAttached && (
                        <div className="flex items-center gap-3 border-b border-swiss-line bg-white px-3 py-2">
                          {previewMime.startsWith('image/') && existingMediaUrl ? (
                            <img
                              src={existingMediaUrl}
                              alt={previewName}
                              className="h-14 w-14 rounded-lg border border-swiss-line object-cover"
                            />
                          ) : (
                            <div className="flex h-14 w-14 items-center justify-center rounded-lg bg-white ring-1 ring-swiss-line">
                              <FileText className="h-6 w-6 text-swiss-faint" />
                            </div>
                          )}
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-semibold text-dark-navy">
                              {previewName}
                            </p>
                            <p className="text-xs text-swiss-faint">
                              {mediaFile
                                ? 'New attachment — save to apply'
                                : 'Attached media will be sent with this reply'}
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={handleClearMedia}
                            className="rounded-md p-1.5 text-swiss-faint hover:bg-red-50 hover:text-red-500"
                            title="Remove attachment"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      )}
                      <Textarea
                        ref={contentRef}
                        value={content}
                        onChange={(e) => setContent(e.target.value.slice(0, CONTENT_MAX))}
                        placeholder="Please enter a content"
                        className="min-h-0 min-h-[180px] w-full flex-1 resize-none bg-white p-3 text-sm outline-none"
                      />
                      <div className="border-t border-swiss-line px-3 py-1.5 text-right text-xs text-swiss-faint">
                        {content.length}/{CONTENT_MAX}
                      </div>
                    </div>
                    <p className="mt-2 text-xs text-swiss-faint">
                      Content is used as caption when media is attached. Use {'{{contact.name}}'},{' '}
                      {'{{contact.phone}}'} in Inbox.
                    </p>
                  </div>
                </div>

                <div className="mt-4 flex shrink-0 items-center justify-between border-t border-swiss-line pt-4">
                  {selectedItem ? (
                    <button
                      type="button"
                      onClick={() => void handleDelete()}
                      className="inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-sm font-semibold text-red-600 hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4" />
                      Delete
                    </button>
                  ) : (
                    <span />
                  )}
                  <button
                    type="button"
                    disabled={!canSave}
                    onClick={() => void handleSave()}
                    className="rounded-xl bg-swiss-accent px-5 py-2 text-sm font-semibold text-white hover:bg-swiss-accent-hover disabled:opacity-50"
                  >
                    {saving ? 'Saving…' : selectedId === 'new' ? 'Create' : 'Save'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
