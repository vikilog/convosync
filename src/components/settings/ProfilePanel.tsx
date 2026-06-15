import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Camera, Loader2, Lock, Save, Trash2, User } from 'lucide-react';
import { api, getUserAvatar, getUserEmail, getUserName, setUserAvatar, setUserName } from '../../lib/api';

type ProfileUser = {
  id: string;
  name: string;
  email: string;
  avatar?: string | null;
  role?: string;
};

async function compressAvatarFile(file: File, maxEdge = 256, quality = 0.85): Promise<string> {
  if (!file.type.startsWith('image/')) {
    throw new Error('Please choose a JPEG, PNG, or WebP image');
  }
  if (file.size > 5 * 1024 * 1024) {
    throw new Error('Image must be smaller than 5 MB before upload');
  }

  const dataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error('Failed to read image file'));
    reader.readAsDataURL(file);
  });

  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const scale = Math.min(1, maxEdge / Math.max(img.width, img.height));
      const width = Math.max(1, Math.round(img.width * scale));
      const height = Math.max(1, Math.round(img.height * scale));
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Could not process image'));
        return;
      }
      ctx.drawImage(img, 0, 0, width, height);
      resolve(canvas.toDataURL('image/jpeg', quality));
    };
    img.onerror = () => reject(new Error('Invalid image file'));
    img.src = dataUrl;
  });
}

export function ProfilePanel() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [profile, setProfile] = useState<ProfileUser>(() => ({
    id: '',
    name: getUserName() || '',
    email: getUserEmail() || '',
    avatar: getUserAvatar(),
  }));
  const [name, setName] = useState(profile.name);
  const [loading, setLoading] = useState(true);
  const [savingName, setSavingName] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const loadProfile = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const me = (await api.getMe()) as ProfileUser;
      setProfile(me);
      setName(me.name);
      if (me.name) setUserName(me.name);
      if (me.avatar !== undefined) setUserAvatar(me.avatar ?? '');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load profile');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadProfile();
  }, [loadProfile]);

  const handleSaveName = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (trimmed.length < 2) {
      setError('Name must be at least 2 characters');
      return;
    }

    setSavingName(true);
    setError(null);
    setMessage(null);
    try {
      const res = (await api.updateProfile({ name: trimmed })) as { user: ProfileUser };
      setProfile((prev) => ({ ...prev, ...res.user }));
      setName(res.user.name);
      setUserName(res.user.name);
      setMessage('Profile name updated.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update name');
    } finally {
      setSavingName(false);
    }
  };

  const handleAvatarPick = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    setUploadingAvatar(true);
    setError(null);
    setMessage(null);
    try {
      const compressed = await compressAvatarFile(file);
      const res = (await api.updateAvatar(compressed)) as { user: ProfileUser };
      setProfile((prev) => ({ ...prev, avatar: res.user.avatar ?? null }));
      setUserAvatar(res.user.avatar ?? '');
      setMessage('Profile photo updated.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to upload photo');
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleRemoveAvatar = async () => {
    setUploadingAvatar(true);
    setError(null);
    setMessage(null);
    try {
      const res = (await api.updateAvatar(null)) as { user: ProfileUser };
      setProfile((prev) => ({ ...prev, avatar: null }));
      setUserAvatar('');
      setMessage('Profile photo removed.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to remove photo');
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 8) {
      setError('New password must be at least 8 characters');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('New passwords do not match');
      return;
    }

    setSavingPassword(true);
    setError(null);
    setMessage(null);
    try {
      await api.changePassword({ currentPassword, newPassword });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setMessage('Password changed successfully.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to change password');
    } finally {
      setSavingPassword(false);
    }
  };

  const avatarUrl = profile.avatar || getUserAvatar() || '';
  const initials = (profile.name || 'U').charAt(0).toUpperCase();

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-4 max-w-2xl">
      {message && (
        <p className="text-sm font-bold text-accent-green bg-accent-green-bg border border-accent-green/15 rounded-xl px-4 py-2">
          {message}
        </p>
      )}
      {error && (
        <p className="text-sm font-bold text-danger-red bg-red-50 border border-red-100 rounded-xl px-4 py-2">
          {error}
        </p>
      )}

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
        <h3 className="text-sm font-black text-gray-950 mb-4">Profile photo</h3>
        <div className="flex flex-wrap items-center gap-4">
          <div className="relative">
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt={profile.name}
                className="w-20 h-20 rounded-full object-cover border-2 border-slate-200"
              />
            ) : (
              <div className="w-20 h-20 rounded-full bg-[#c4c0ff] flex items-center justify-center text-primary font-black text-2xl border-2 border-slate-200">
                {initials}
              </div>
            )}
            {uploadingAvatar && (
              <div className="absolute inset-0 rounded-full bg-black/40 flex items-center justify-center">
                <Loader2 className="w-5 h-5 animate-spin text-white" />
              </div>
            )}
          </div>

          <div className="space-y-2">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={(e) => void handleAvatarPick(e)}
            />
            <button
              type="button"
              disabled={uploadingAvatar}
              onClick={() => fileInputRef.current?.click()}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary text-white text-sm font-bold disabled:opacity-50"
            >
              <Camera className="w-3.5 h-3.5" />
              Upload photo
            </button>
            {avatarUrl && (
              <button
                type="button"
                disabled={uploadingAvatar}
                onClick={() => void handleRemoveAvatar()}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-bold text-danger-red hover:bg-red-50 disabled:opacity-50 ml-2"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Remove
              </button>
            )}
            <p className="text-meta text-gray-500 font-medium">
              JPEG, PNG, or WebP. We resize to 256px for faster loading.
            </p>
          </div>
        </div>
      </div>

      <form
        onSubmit={(e) => void handleSaveName(e)}
        className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4"
      >
        <div className="flex items-center gap-2 mb-1">
          <User className="w-4 h-4 text-primary" />
          <h3 className="text-sm font-black text-gray-950">Basic info</h3>
        </div>

        <label className="block space-y-1">
          <span className="text-sm font-bold text-gray-500 uppercase tracking-wide">Full name</span>
          <input
            required
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        </label>

        <label className="block space-y-1">
          <span className="text-sm font-bold text-gray-500 uppercase tracking-wide">Email</span>
          <input
            type="email"
            value={profile.email}
            disabled
            className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl bg-gray-50 text-gray-500 cursor-not-allowed"
          />
          <p className="text-xs text-gray-400 font-medium">Email cannot be changed here.</p>
        </label>

        {profile.role && (
          <p className="text-meta text-gray-500 font-medium capitalize">
            Role in this company: <span className="font-bold text-gray-800">{profile.role}</span>
          </p>
        )}

        <div className="flex justify-end pt-1">
          <button
            type="submit"
            disabled={savingName || name.trim() === profile.name}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary text-white text-sm font-bold disabled:opacity-50"
          >
            {savingName ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
            Save name
          </button>
        </div>
      </form>

      <form
        onSubmit={(e) => void handleChangePassword(e)}
        className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4"
      >
        <div className="flex items-center gap-2 mb-1">
          <Lock className="w-4 h-4 text-primary" />
          <h3 className="text-sm font-black text-gray-950">Change password</h3>
        </div>

        <label className="block space-y-1">
          <span className="text-sm font-bold text-gray-500 uppercase tracking-wide">Current password</span>
          <input
            required
            type="password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            autoComplete="current-password"
            className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        </label>

        <label className="block space-y-1">
          <span className="text-sm font-bold text-gray-500 uppercase tracking-wide">New password</span>
          <input
            required
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            autoComplete="new-password"
            minLength={8}
            className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        </label>

        <label className="block space-y-1">
          <span className="text-sm font-bold text-gray-500 uppercase tracking-wide">Confirm new password</span>
          <input
            required
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            autoComplete="new-password"
            minLength={8}
            className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        </label>

        <div className="flex justify-end pt-1">
          <button
            type="submit"
            disabled={savingPassword}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary text-white text-sm font-bold disabled:opacity-50"
          >
            {savingPassword ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Lock className="w-3.5 h-3.5" />}
            Update password
          </button>
        </div>
      </form>
    </div>
  );
}
