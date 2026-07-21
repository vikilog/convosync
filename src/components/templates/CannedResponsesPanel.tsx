/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Plus, Search, Loader2, Smile, Paperclip, Trash2, X, FileText } from 'lucide-react';
import { api } from '../../lib/api';
import type { CannedResponseRecord } from './CannedResponseModal';

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
    <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden flex flex-col min-h-[560px]">
      <div className="px-6 pt-6 pb-4 border-b border-slate-200">
        <h2 className="text-lg font-bold text-gray-900">Canned Response</h2>
        <p className="text-sm text-gray-500 mt-1">
          Configure preset quick replies that are standardized across the team for the inbox.
        </p>
      </div>

      <div className="px-6 py-4 flex flex-wrap items-center justify-between gap-3 border-b border-slate-200">
        <button
          type="button"
          onClick={handleAdd}
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-gray-900 hover:bg-gray-800 text-white rounded-lg text-sm font-bold shadow-sm"
        >
          <Plus className="w-4 h-4" />
          Add Canned Response
        </button>
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by short code or content"
            className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
          />
        </div>
      </div>

      {error && (
        <p className="mx-6 mt-4 text-sm font-bold text-red-500 bg-red-50 border border-red-100 rounded-xl p-3">
          {error}
        </p>
      )}

      {loading ? (
        <div className="flex justify-center py-24 text-gray-400">
          <Loader2 className="w-8 h-8 animate-spin" />
        </div>
      ) : (
        <div className="flex flex-1 min-h-0">
          <div className="w-[280px] shrink-0 border-r border-slate-200 overflow-y-auto">
            {selectedId === 'new' && (
              <button
                type="button"
                className="w-full text-left px-4 py-3.5 border-b border-slate-200/80 bg-primary/[0.04] relative"
              >
                <span className="absolute left-0 top-0 bottom-0 w-1 bg-primary rounded-r" />
                <p className="text-sm font-bold text-gray-900 pl-2">New Canned Response</p>
              </button>
            )}
            {filtered.map((item) => {
              const active = selectedId === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setSelectedId(item.id)}
                  className={`w-full text-left px-4 py-3.5 border-b border-slate-200/80 transition-colors relative ${
                    active ? 'bg-primary/[0.04]' : 'hover:bg-gray-50'
                  }`}
                >
                  {active && (
                    <span className="absolute left-0 top-0 bottom-0 w-1 bg-primary rounded-r" />
                  )}
                  <p className="text-sm font-bold text-gray-900 pl-2 truncate flex items-center gap-1.5">
                    <span className="truncate">{listLabel(item)}</span>
                    {item.hasMedia && <Paperclip className="w-3 h-3 text-gray-400 shrink-0" />}
                  </p>
                </button>
              );
            })}
            {filtered.length === 0 && selectedId !== 'new' && (
              <p className="p-6 text-sm text-gray-400 text-center">No canned responses found</p>
            )}
          </div>

          <div className="flex-1 p-6 flex flex-col min-w-0">
            {selectedId == null && filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center flex-1 text-center py-12">
                <p className="text-sm font-bold text-gray-600">No canned responses yet</p>
                <p className="text-xs text-gray-400 mt-1 max-w-sm">
                  Add quick replies your team can insert while chatting in Inbox.
                </p>
                <button
                  type="button"
                  onClick={handleAdd}
                  className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 bg-gray-900 hover:bg-gray-800 text-white rounded-lg text-sm font-bold"
                >
                  <Plus className="w-4 h-4" />
                  Add Canned Response
                </button>
              </div>
            ) : selectedId == null ? (
              <div className="flex items-center justify-center flex-1 text-sm text-gray-400">
                Select a canned response from the list
              </div>
            ) : (
              <>
                <div className="space-y-5 flex-1">
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-sm font-bold text-gray-800">Short code</label>
                      <span className="text-xs text-gray-400">
                        {shortcut.length}/{SHORTCUT_MAX}
                      </span>
                    </div>
                    <input
                      type="text"
                      value={shortcut}
                      onChange={(e) =>
                        setShortcut(e.target.value.replace(/\s/g, '').slice(0, SHORTCUT_MAX))
                      }
                      placeholder="Text that trigger canned responses"
                      className="w-full border border-slate-200 rounded-lg py-2.5 px-3 text-sm outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                    />
                  </div>

                  <div className="flex flex-col flex-1">
                    <label className="text-sm font-bold text-gray-800 mb-1.5">Content</label>
                    <div className="border border-slate-200 rounded-lg overflow-hidden flex flex-col flex-1 min-h-[220px]">
                      <div className="flex items-center gap-1 px-2 py-1.5 border-b border-slate-200 bg-[#fafafa] relative">
                        <div ref={emojiRef} className="relative">
                          <button
                            type="button"
                            onClick={() => setShowEmoji((v) => !v)}
                            className="p-1.5 rounded-md text-gray-500 hover:bg-white hover:text-gray-800"
                            title="Insert emoji"
                          >
                            <Smile className="w-4 h-4" />
                          </button>
                          {showEmoji && (
                            <div className="absolute left-0 top-full mt-1 z-10 bg-white border border-slate-200 rounded-lg shadow-lg p-2 flex flex-wrap gap-1 w-[200px]">
                              {QUICK_EMOJIS.map((emoji) => (
                                <button
                                  key={emoji}
                                  type="button"
                                  onClick={() => insertEmoji(emoji)}
                                  className="w-8 h-8 text-lg hover:bg-gray-100 rounded"
                                >
                                  {emoji}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                        <label
                          htmlFor={mediaInputId}
                          className="p-1.5 rounded-md text-gray-700 hover:bg-white hover:text-primary cursor-pointer transition-colors"
                          title="Attach image, video, audio, or document"
                        >
                          <Paperclip className="w-4 h-4 pointer-events-none" />
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
                        <div className="px-3 py-2 border-b border-slate-200 bg-slate-50 flex items-center gap-3">
                          {previewMime.startsWith('image/') && existingMediaUrl ? (
                            <img
                              src={existingMediaUrl}
                              alt={previewName}
                              className="w-14 h-14 rounded-lg object-cover border border-slate-200"
                            />
                          ) : (
                            <div className="w-14 h-14 rounded-lg bg-white border border-slate-200 flex items-center justify-center">
                              <FileText className="w-6 h-6 text-gray-400" />
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-bold text-gray-800 truncate">{previewName}</p>
                            <p className="text-xs text-gray-400">
                              {mediaFile
                                ? 'New attachment — save to apply'
                                : 'Attached media will be sent with this reply'}
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={handleClearMedia}
                            className="p-1.5 rounded-md text-gray-400 hover:text-red-500 hover:bg-red-50"
                            title="Remove attachment"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                      <textarea
                        ref={contentRef}
                        value={content}
                        onChange={(e) => setContent(e.target.value.slice(0, CONTENT_MAX))}
                        placeholder="Please enter a content"
                        className="flex-1 w-full p-3 text-sm resize-none outline-none min-h-[180px]"
                      />
                      <div className="px-3 py-1.5 text-right text-xs text-gray-400 border-t border-slate-200">
                        {content.length}/{CONTENT_MAX}
                      </div>
                    </div>
                    <p className="text-xs text-gray-400 mt-2">
                      Content is used as caption when media is attached. Use {'{{contact.name}}'},{' '}
                      {'{{contact.phone}}'} in Inbox.
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-4 mt-4 border-t border-slate-200">
                  {selectedItem ? (
                    <button
                      type="button"
                      onClick={() => void handleDelete()}
                      className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-bold text-red-600 hover:bg-red-50 rounded-lg"
                    >
                      <Trash2 className="w-4 h-4" />
                      Delete
                    </button>
                  ) : (
                    <span />
                  )}
                  <button
                    type="button"
                    disabled={!canSave}
                    onClick={() => void handleSave()}
                    className="px-5 py-2 bg-primary hover:bg-primary-hover disabled:opacity-50 text-white rounded-lg text-sm font-bold"
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
