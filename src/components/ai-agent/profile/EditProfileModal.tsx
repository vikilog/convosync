import React, { useRef, useState } from 'react';
import { Camera, Loader2, X } from 'lucide-react';
import type { AgentProfileData } from '../types';
import { compressImageFile } from '../../../lib/imageUpload';

type Props = {
  profile: AgentProfileData;
  onClose: () => void;
  onSave: (patch: Partial<AgentProfileData>) => void;
  saving?: boolean;
};

export const EditProfileModal: React.FC<Props> = ({ profile, onClose, onSave, saving }) => {
  const [name, setName] = useState(profile.name);
  const [description, setDescription] = useState(profile.description);
  const [avatarUrl, setAvatarUrl] = useState<string | null | undefined>(profile.avatarUrl);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleAvatarPick = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setUploading(true);
    setError(null);
    try {
      const dataUrl = await compressImageFile(file, 256, 0.85);
      setAvatarUrl(dataUrl);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to process image');
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      name: name.trim() || profile.name,
      description,
      avatarUrl: avatarUrl ?? null,
    });
  };

  return (
    <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-lg border border-[#E5E7EB] shadow-2xl">
        <div className="flex justify-between items-center px-6 py-4 border-b border-[#E5E7EB]">
          <h3 className="text-base font-bold text-[#111827]">Edit profile</h3>
          <button type="button" onClick={onClose} className="text-[#6B7280] hover:text-[#111827]">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-[#111827] mb-2">Bot image</label>
            <div className="flex items-center gap-4">
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                disabled={uploading || saving}
                className="relative h-16 w-16 shrink-0 overflow-hidden rounded-full border border-[#E5E7EB] bg-[#F3F0FF] focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-500"
                aria-label="Upload bot image"
              >
                {avatarUrl ? (
                  <img src={avatarUrl} alt="" className="h-full w-full object-cover" />
                ) : (
                  <span className="flex h-full w-full items-center justify-center text-sky-600">
                    <Camera className="h-6 w-6" />
                  </span>
                )}
                {uploading && (
                  <span className="absolute inset-0 flex items-center justify-center bg-black/40">
                    <Loader2 className="h-5 w-5 animate-spin text-white" />
                  </span>
                )}
              </button>
              <div className="min-w-0 flex-1 space-y-2">
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  disabled={uploading || saving}
                  className="rounded-xl border border-[#E5E7EB] bg-white px-3 py-2 text-sm font-bold text-[#111827] hover:bg-slate-50 disabled:opacity-60"
                >
                  {avatarUrl ? 'Change image' : 'Upload image'}
                </button>
                {avatarUrl ? (
                  <button
                    type="button"
                    onClick={() => setAvatarUrl(null)}
                    disabled={uploading || saving}
                    className="ml-2 text-sm font-semibold text-red-600 hover:underline disabled:opacity-60"
                  >
                    Remove
                  </button>
                ) : null}
                <p className="text-xs text-[#6B7280]">JPEG, PNG, or WebP · max 5 MB</p>
              </div>
              <input
                ref={fileRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={(e) => void handleAvatarPick(e)}
              />
            </div>
          </div>

          {error && (
            <p className="rounded-xl border border-red-100 bg-red-50 px-3 py-2 text-sm text-red-600">
              {error}
            </p>
          )}

          <div>
            <label className="block text-sm font-medium text-[#111827] mb-1.5">Agent Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full border border-[#E5E7EB] rounded-xl py-2.5 px-3 text-sm focus:ring-2 focus:ring-[#0284c7]/20 focus:border-[#0284c7] outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[#111827] mb-1.5">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full border border-[#E5E7EB] rounded-xl py-2.5 px-3 text-sm resize-none focus:ring-2 focus:ring-[#0284c7]/20 focus:border-[#0284c7] outline-none"
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-bold text-[#6B7280] hover:text-[#111827]"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving || uploading}
              className="px-4 py-2 bg-channel-green hover:bg-[#20bd5a] disabled:opacity-60 text-white rounded-xl text-sm font-bold"
            >
              {saving ? 'Saving…' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
