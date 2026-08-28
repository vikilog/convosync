import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Camera,
  CheckCircle2,
  ChevronDown,
  Globe,
  Loader2,
  Lock,
  LogOut,
  Save,
  ShieldCheck,
  Trash2,
} from 'lucide-react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import {
  api,
  getUserAvatar,
  getUserEmail,
  getUserName,
  getUserPermissions,
  getUserRole,
  setUserAvatar,
  setUserName,
} from '../../lib/api';
import { compressImageFile } from '../../lib/imageUpload';
import { logoutThisDevice } from '../../lib/session';
import { disconnectSocket } from '../../lib/socket';
import { hasWorkspacePermission } from '../../lib/workspacePermissions';
import { LocaleFields } from '../locale/LocaleFields';
import { Input } from '../ui/input';

type ProfileUser = {
  id: string;
  name: string;
  email: string;
  avatar?: string | null;
  role?: string;
  emailVerified?: boolean;
};

const inputClass =
  'mt-1 w-full rounded-xl border border-swiss-line px-3 py-2.5 text-sm text-slate-800 transition-colors focus:outline-none focus:ring-2 focus:ring-primary/20';

const cardClass = 'bg-white border border-swiss-line p-5 md:p-6';

const SHEET_SPRING = { type: 'spring' as const, damping: 28, stiffness: 320 };

export function ProfilePanel() {
  const navigate = useNavigate();
  const reduceMotion = useReducedMotion();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [profile, setProfile] = useState<ProfileUser>(() => ({
    id: '',
    name: getUserName() || '',
    email: getUserEmail() || '',
    avatar: getUserAvatar(),
  }));
  const [name, setName] = useState(profile.name);
  const [loading, setLoading] = useState(true);
  const [savingAccount, setSavingAccount] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [emailVerified, setEmailVerified] = useState(false);
  const [otpPending, setOtpPending] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [otpBusy, setOtpBusy] = useState<'send' | 'verify' | null>(null);
  const [otpSentHint, setOtpSentHint] = useState<string | null>(null);
  const canEditLocale = hasWorkspacePermission(getUserPermissions(), 'settings', getUserRole());
  const [country, setCountry] = useState('IN');
  const [timezone, setTimezone] = useState('Asia/Kolkata');
  const [savedCountry, setSavedCountry] = useState('IN');
  const [savedTimezone, setSavedTimezone] = useState('Asia/Kolkata');
  const [passwordOpen, setPasswordOpen] = useState(false);

  const loadProfile = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [me, verification, company] = await Promise.all([
        api.getMe() as Promise<ProfileUser>,
        api.getVerificationStatus().catch(() => null) as Promise<{
          userEmail?: { verified?: boolean };
        } | null>,
        api.getCompanySettings().catch(() => null) as Promise<{
          country?: string | null;
          timezone?: string | null;
        } | null>,
      ]);
      setProfile(me);
      setName(me.name);
      setEmailVerified(Boolean(me.emailVerified ?? verification?.userEmail?.verified));
      if (me.name) setUserName(me.name);
      if (me.avatar !== undefined) setUserAvatar(me.avatar ?? '');
      const nextCountry = company?.country || 'IN';
      const nextTimezone = company?.timezone || 'Asia/Kolkata';
      setCountry(nextCountry);
      setTimezone(nextTimezone);
      setSavedCountry(nextCountry);
      setSavedTimezone(nextTimezone);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load profile');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadProfile();
  }, [loadProfile]);

  const handleSaveAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (trimmed.length < 2) {
      setError('Name must be at least 2 characters');
      return;
    }

    const nameChanged = trimmed !== profile.name;
    const localeChanged = canEditLocale && (country !== savedCountry || timezone !== savedTimezone);
    if (!nameChanged && !localeChanged) return;

    setSavingAccount(true);
    setError(null);
    setMessage(null);
    try {
      if (nameChanged) {
        const res = (await api.updateProfile({ name: trimmed })) as { user: ProfileUser };
        setProfile((prev) => ({ ...prev, ...res.user }));
        setName(res.user.name);
        setUserName(res.user.name);
      }
      if (localeChanged) {
        const res = await api.updateLocale({ country, timezone });
        setCountry(res.country || country);
        setTimezone(res.timezone || timezone);
        setSavedCountry(res.country || country);
        setSavedTimezone(res.timezone || timezone);
      }
      setMessage('Profile updated.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update profile');
    } finally {
      setSavingAccount(false);
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
    <div className="w-full space-y-4">
      <AnimatePresence initial={false}>
        {message ? (
          <motion.p
            key="profile-message"
            initial={reduceMotion ? false : { opacity: 0, y: -6, height: 0 }}
            animate={{ opacity: 1, y: 0, height: 'auto' }}
            exit={reduceMotion ? undefined : { opacity: 0, y: -6, height: 0 }}
            transition={{ duration: reduceMotion ? 0 : 0.2 }}
            className="overflow-hidden rounded-xl border border-primary/20 bg-primary/10 px-3 py-2 text-sm font-medium text-primary"
          >
            {message}
          </motion.p>
        ) : null}
        {error ? (
          <motion.p
            key="profile-error"
            initial={reduceMotion ? false : { opacity: 0, y: -6, height: 0 }}
            animate={{ opacity: 1, y: 0, height: 'auto' }}
            exit={reduceMotion ? undefined : { opacity: 0, y: -6, height: 0 }}
            transition={{ duration: reduceMotion ? 0 : 0.2 }}
            className="overflow-hidden rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-700"
          >
            {error}
          </motion.p>
        ) : null}
      </AnimatePresence>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={(e) => void handleAvatarPick(e)}
      />

      {/* Wide-screen layout: editable settings on the left, a sticky identity
          card + session card on the right — uses the full settings width
          instead of a lone centered column with dead space beside it. */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_320px] lg:items-start">
        <div className="space-y-4 lg:order-1">
          <div className={cardClass}>
            <form onSubmit={(e) => void handleSaveAccount(e)} className="space-y-4">
            <h3 className="text-sm font-semibold text-slate-900">Account details</h3>

            <div className="max-w-md space-y-4">
              <label className="block">
                <span className="text-meta font-bold uppercase tracking-wide text-swiss-muted">
                  Full name
                </span>
                <Input
                  required
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className={inputClass}
                />
              </label>

              <div className="block">
                <span className="text-meta font-bold uppercase tracking-wide text-swiss-muted">
                  Email
                </span>
                <div className="mt-1 flex gap-2">
                  <Input
                    type="email"
                    value={profile.email}
                    disabled
                    className={`h-auto ${inputClass} mt-0 min-w-0 flex-1 cursor-not-allowed bg-slate-50 text-slate-500`}
                  />
                  {emailVerified ? (
                    <span className="inline-flex shrink-0 items-center gap-1 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2.5 text-xs font-semibold text-emerald-700">
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      Verified
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        void (async () => {
                          setOtpBusy('send');
                          setError(null);
                          setMessage(null);
                          setOtpSentHint(null);
                          try {
                            const res = (await api.sendVerificationOtp({
                              target: 'user_email',
                            })) as {
                              alreadyVerified?: boolean;
                              destinationHint?: string;
                            };
                            if (res.alreadyVerified) {
                              setEmailVerified(true);
                              setOtpPending(false);
                              setMessage('Email already verified.');
                            } else {
                              setOtpPending(true);
                              setOtpSentHint(
                                res.destinationHint
                                  ? `Check your email (${res.destinationHint}) for the OTP`
                                  : 'Check your email for the OTP'
                              );
                            }
                          } catch (err) {
                            setOtpPending(false);
                            setError(err instanceof Error ? err.message : 'Failed to send OTP');
                          } finally {
                            setOtpBusy(null);
                          }
                        })();
                      }}
                      disabled={otpBusy !== null}
                      className="inline-flex shrink-0 cursor-pointer items-center gap-1.5 rounded-xl border border-swiss-line bg-white px-3 py-2.5 text-xs font-semibold text-slate-800 transition-colors hover:bg-slate-50 active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {otpBusy === 'send' ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
                      {otpPending ? 'Resend' : 'Verify'}
                    </button>
                  )}
                </div>
                {otpPending && !emailVerified ? (
                  <div className="mt-2 space-y-1.5">
                    {otpSentHint ? (
                      <p className="text-xs font-medium text-accent-green">{otpSentHint}</p>
                    ) : null}
                    <div className="flex gap-2">
                      <Input
                        value={otpCode}
                        onChange={(e) => setOtpCode(e.target.value)}
                        inputMode="numeric"
                        autoComplete="one-time-code"
                        placeholder="Enter OTP"
                        className="h-auto min-w-0 flex-1 rounded-xl border border-swiss-line px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          void (async () => {
                            setOtpBusy('verify');
                            setError(null);
                            setMessage(null);
                            try {
                              const status = (await api.verifyVerificationOtp({
                                target: 'user_email',
                                code: otpCode.trim(),
                              })) as { userEmail?: { verified?: boolean } };
                              setEmailVerified(Boolean(status.userEmail?.verified));
                              setOtpPending(false);
                              setOtpCode('');
                              setMessage('Email verified.');
                            } catch (err) {
                              setError(err instanceof Error ? err.message : 'Failed to verify OTP');
                            } finally {
                              setOtpBusy(null);
                            }
                          })();
                        }}
                        disabled={otpBusy !== null || otpCode.trim().length < 4}
                        className="inline-flex shrink-0 cursor-pointer items-center gap-1.5 rounded-xl bg-slate-900 px-3 py-2 text-xs font-semibold text-white transition-colors hover:bg-slate-800 active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {otpBusy === 'verify' ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
                        Confirm
                      </button>
                    </div>
                  </div>
                ) : null}
                <p className="mt-1 text-xs text-slate-500">Email cannot be changed here.</p>
              </div>
            </div>

            <div className="border-t border-slate-100 pt-5">
              <div className="mb-1 flex items-center gap-2">
                <Globe className="h-4 w-4 text-primary" aria-hidden />
                <h3 className="text-sm font-semibold text-slate-900">Country &amp; timezone</h3>
              </div>
              <p className="text-sm text-slate-500">
                Workspace defaults used for scheduling and business hours. Same fields as Company
                info.
              </p>
              <div className="mt-4 max-w-xl">
                <LocaleFields
                  idPrefix="profile"
                  country={country}
                  timezone={timezone}
                  disabled={!canEditLocale}
                  onCountryChange={setCountry}
                  onTimezoneChange={setTimezone}
                />
              </div>
              {!canEditLocale ? (
                <p className="mt-3 text-xs text-slate-500">
                  Ask a workspace admin to change these settings.
                </p>
              ) : null}
            </div>

            <div className="flex justify-end border-t border-slate-100 pt-4">
              <button
                type="submit"
                disabled={
                  savingAccount ||
                  (name.trim() === profile.name &&
                    (!canEditLocale || (country === savedCountry && timezone === savedTimezone)))
                }
                className="inline-flex cursor-pointer items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-bold text-white transition-colors hover:bg-primary-hover active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {savingAccount ? (
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                ) : (
                  <Save className="h-4 w-4" aria-hidden />
                )}
                Save
              </button>
            </div>
          </form>
          </div>

          <div className={cardClass}>
            <button
              type="button"
              onClick={() => setPasswordOpen((v) => !v)}
              aria-expanded={passwordOpen}
              className="flex w-full cursor-pointer items-center justify-between gap-2 text-left active:scale-[0.99]"
            >
              <span className="flex items-center gap-2">
                <Lock className="h-4 w-4 text-primary" aria-hidden />
                <span className="text-sm font-semibold text-slate-900">Change password</span>
              </span>
              <ChevronDown
                className={`h-4 w-4 shrink-0 text-slate-400 transition-transform ${
                  passwordOpen ? 'rotate-180' : ''
                }`}
                aria-hidden
              />
            </button>

            <AnimatePresence initial={false}>
              {passwordOpen ? (
                <motion.div
                  key="password-fields"
                  initial={reduceMotion ? false : { height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={reduceMotion ? undefined : { height: 0, opacity: 0 }}
                  transition={reduceMotion ? { duration: 0 } : SHEET_SPRING}
                  className="overflow-hidden"
                >
                  <form
                    onSubmit={(e) => void handleChangePassword(e)}
                    className="max-w-md space-y-4 pt-4"
                  >
                    <label className="block">
                      <span className="text-meta font-bold uppercase tracking-wide text-swiss-muted">
                        Current password
                      </span>
                      <Input
                        required
                        type="password"
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        autoComplete="current-password"
                        className={inputClass}
                      />
                    </label>

                    <label className="block">
                      <span className="text-meta font-bold uppercase tracking-wide text-swiss-muted">
                        New password
                      </span>
                      <Input
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
                      <span className="text-meta font-bold uppercase tracking-wide text-swiss-muted">
                        Confirm new password
                      </span>
                      <Input
                        required
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        autoComplete="new-password"
                        minLength={8}
                        className={inputClass}
                      />
                    </label>

                    <div className="flex justify-end border-t border-slate-100 pt-4">
                      <button
                        type="submit"
                        disabled={savingPassword}
                        className="inline-flex cursor-pointer items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-bold text-white transition-colors hover:bg-primary-hover active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-60"
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
                </motion.div>
              ) : null}
            </AnimatePresence>
          </div>
        </div>

        {/* Sticky right rail: who you are + session control — stays in view
            while the settings forms on the left scroll. */}
        <div className="space-y-4 lg:sticky lg:top-4 lg:order-2">
          <div className={cardClass}>
            <div className="flex flex-col items-center text-center">
              <button
                type="button"
                disabled={uploadingAvatar}
                onClick={() => fileInputRef.current?.click()}
                aria-label="Change profile photo"
                className="group relative shrink-0 cursor-pointer rounded-full outline-none active:scale-[0.97] disabled:cursor-not-allowed"
              >
                {avatarUrl ? (
                  <img
                    src={avatarUrl}
                    alt={profile.name}
                    className="h-24 w-24 rounded-full border border-swiss-line object-cover"
                  />
                ) : (
                  <div className="flex h-24 w-24 items-center justify-center rounded-full border border-swiss-line bg-primary/10 text-3xl font-semibold text-primary">
                    {initials}
                  </div>
                )}
                <span
                  className={`absolute inset-0 flex items-center justify-center rounded-full bg-black/45 text-white backdrop-blur-[1px] transition-opacity ${
                    uploadingAvatar
                      ? 'opacity-100'
                      : 'opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100'
                  }`}
                  aria-hidden
                >
                  {uploadingAvatar ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <Camera className="h-5 w-5" />
                  )}
                </span>
                <span className="pointer-events-none absolute bottom-0 right-0 flex h-7 w-7 items-center justify-center rounded-full border-2 border-white bg-primary text-white shadow-sm transition-transform group-hover:scale-110">
                  <Camera className="h-3.5 w-3.5" aria-hidden />
                </span>
              </button>

              <h2 className="mt-3 max-w-full truncate text-lg font-bold text-slate-900">
                {profile.name || 'Your profile'}
              </h2>
              {profile.role ? (
                <span className="mt-1.5 inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-0.5 text-[11px] font-semibold capitalize text-primary ring-1 ring-primary/20">
                  <ShieldCheck className="h-3 w-3" aria-hidden />
                  {profile.role}
                </span>
              ) : null}

              <div className="mt-3 flex w-full flex-wrap items-center justify-center gap-1.5 text-sm text-slate-500">
                <span className="max-w-full truncate">{profile.email}</span>
              </div>
              {emailVerified ? (
                <span className="mt-1.5 inline-flex shrink-0 items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700 ring-1 ring-emerald-200">
                  <CheckCircle2 className="h-3 w-3" />
                  Verified
                </span>
              ) : null}

              {avatarUrl ? (
                <div className="mt-4 flex w-full items-center justify-center border-t border-slate-100 pt-4">
                  <button
                    type="button"
                    disabled={uploadingAvatar}
                    onClick={() => void handleRemoveAvatar()}
                    className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl border border-swiss-line px-3 py-2 text-xs font-semibold text-slate-500 transition-colors hover:border-red-100 hover:bg-red-50 hover:text-red-600 active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <Trash2 className="h-3.5 w-3.5" aria-hidden />
                    Remove photo
                  </button>
                </div>
              ) : null}
              <p className="mt-3 text-xs text-slate-400">
                Click your photo to change it · JPEG, PNG, or WebP
              </p>
            </div>
          </div>

          <section className={cardClass}>
            <div className="mb-1 flex items-center gap-2">
              <LogOut className="h-4 w-4 text-slate-500" aria-hidden />
              <h3 className="text-sm font-semibold text-slate-900">Sign out</h3>
            </div>
            <p className="mt-1 text-sm text-slate-500">
              Log out of ConvoSync on this device. You can sign back in anytime.
            </p>
            <button
              type="button"
              onClick={() => {
                void (async () => {
                  disconnectSocket();
                  await logoutThisDevice();
                  navigate('/login', { replace: true });
                })();
              }}
              className="mt-4 inline-flex w-full cursor-pointer items-center justify-center gap-1.5 rounded-xl border border-swiss-line bg-white px-3.5 py-2 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50 active:scale-[0.97]"
            >
              <LogOut className="h-4 w-4" aria-hidden />
              Log out
            </button>
          </section>
        </div>
      </div>
    </div>
  );
}
