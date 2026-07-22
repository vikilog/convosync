import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Camera, Loader2, Lock, LogOut, Save, Trash2, User } from 'lucide-react';
import { api, getUserAvatar, getUserEmail, getUserName, setUserAvatar, setUserName } from '../../lib/api';
import { compressImageFile } from '../../lib/imageUpload';
import { logoutThisDevice } from '../../lib/session';
import { disconnectSocket } from '../../lib/socket';

type ProfileUser = {
  id: string;
  name: string;
  email: string;
  avatar?: string | null;
  role?: string;
};

const inputClass =
  'mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-primary/20';

export function ProfilePanel() {
  const navigate = useNavigate();
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
      const compressed = await compressImageFile(file);
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
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-3xl space-y-4">
      {message ? (
        <p className="rounded-xl border border-primary/20 bg-primary/10 px-3 py-2 text-sm font-medium text-primary">
          {message}
        </p>
      ) : null}
      {error ? (
        <p className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-700">
          {error}
        </p>
      ) : null}

      <div className="rounded-2xl border border-black/5 bg-surface p-5 shadow-sm md:p-6">
        <h3 className="mb-4 text-sm font-semibold text-slate-900">Profile photo</h3>
        <div className="flex flex-wrap items-center gap-4">
          <div className="relative">
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt={profile.name}
                className="h-20 w-20 rounded-full border border-slate-200 object-cover"
              />
            ) : (
              <div className="flex h-20 w-20 items-center justify-center rounded-full border border-slate-200 bg-primary/10 text-2xl font-semibold text-primary">
                {initials}
              </div>
            )}
            {uploadingAvatar ? (
              <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/40">
                <Loader2 className="h-5 w-5 animate-spin text-white" />
              </div>
            ) : null}
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
              className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50 disabled:opacity-50"
            >
              <Camera className="h-4 w-4" aria-hidden />
              Upload photo
            </button>
            {avatarUrl ? (
              <button
                type="button"
                disabled={uploadingAvatar}
                onClick={() => void handleRemoveAvatar()}
                className="ml-2 inline-flex cursor-pointer items-center gap-1.5 rounded-xl border border-red-100 px-3 py-2 text-sm font-semibold text-red-600 transition-colors hover:bg-red-50 disabled:opacity-50"
              >
                <Trash2 className="h-4 w-4" aria-hidden />
                Remove
              </button>
            ) : null}
            <p className="text-xs text-slate-500">
              JPEG, PNG, or WebP. We resize to 256px for faster loading.
            </p>
          </div>
        </div>
      </div>

      <form
        onSubmit={(e) => void handleSaveName(e)}
        className="space-y-4 rounded-2xl border border-black/5 bg-surface p-5 shadow-sm md:p-6"
      >
        <div className="mb-1 flex items-center gap-2">
          <User className="h-4 w-4 text-primary" aria-hidden />
          <h3 className="text-sm font-semibold text-slate-900">Basic info</h3>
        </div>

        <label className="block">
          <span className="text-meta font-bold uppercase text-gray-500">Full name</span>
          <input
            required
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className={inputClass}
          />
        </label>

        <label className="block">
          <span className="text-meta font-bold uppercase text-gray-500">Email</span>
          <input
            type="email"
            value={profile.email}
            disabled
            className={`${inputClass} cursor-not-allowed bg-slate-50 text-slate-500`}
          />
          <p className="mt-1 text-xs text-slate-500">Email cannot be changed here.</p>
        </label>

        {profile.role ? (
          <p className="text-xs font-medium capitalize text-slate-600">
            Role in this company:{' '}
            <span className="font-semibold text-slate-800">{profile.role}</span>
          </p>
        ) : null}

        <div className="flex justify-end pt-1">
          <button
            type="submit"
            disabled={savingName || name.trim() === profile.name}
            className="inline-flex cursor-pointer items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-bold text-white transition-colors hover:bg-primary-hover disabled:opacity-60"
          >
            {savingName ? (
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
            ) : (
              <Save className="h-4 w-4" aria-hidden />
            )}
            Save name
          </button>
        </div>
      </form>

      <form
        onSubmit={(e) => void handleChangePassword(e)}
        className="space-y-4 rounded-2xl border border-black/5 bg-surface p-5 shadow-sm md:p-6"
      >
        <div className="mb-1 flex items-center gap-2">
          <Lock className="h-4 w-4 text-primary" aria-hidden />
          <h3 className="text-sm font-semibold text-slate-900">Change password</h3>
        </div>

        <label className="block">
          <span className="text-meta font-bold uppercase text-gray-500">Current password</span>
          <input
            required
            type="password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            autoComplete="current-password"
            className={inputClass}
          />
        </label>

        <label className="block">
          <span className="text-meta font-bold uppercase text-gray-500">New password</span>
          <input
            required
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            autoComplete="new-password"
            minLength={8}
            className={inputClass}
          />
        </label>

        <label className="block">
          <span className="text-meta font-bold uppercase text-gray-500">Confirm new password</span>
          <input
            required
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            autoComplete="new-password"
            minLength={8}
            className={inputClass}
          />
        </label>

        <div className="flex justify-end pt-1">
          <button
            type="submit"
            disabled={savingPassword}
            className="inline-flex cursor-pointer items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-bold text-white transition-colors hover:bg-primary-hover disabled:opacity-60"
          >
            {savingPassword ? (
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
            ) : (
              <Lock className="h-4 w-4" aria-hidden />
            )}
            Update password
          </button>
        </div>
      </form>

      <section className="rounded-2xl border border-black/5 bg-surface p-5 shadow-sm md:p-6">
        <div className="mb-1 flex items-center gap-2">
          <LogOut className="h-4 w-4 text-slate-500" aria-hidden />
          <h3 className="text-sm font-semibold text-slate-900">Sign out</h3>
        </div>
        <p className="mt-1 text-sm text-slate-500">
          Log out of ConvoSync on this device. You can sign back in anytime.
        </p>
        <div className="mt-4 flex justify-end">
          <button
            type="button"
            onClick={() => {
              void (async () => {
                disconnectSocket();
                await logoutThisDevice();
                navigate('/login', { replace: true });
              })();
            }}
            className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl border border-red-200 bg-white px-3.5 py-2 text-sm font-semibold text-red-600 transition-colors hover:bg-red-50"
          >
            <LogOut className="h-4 w-4" aria-hidden />
            Log out
          </button>
        </div>
      </section>
    </div>
  );
}
