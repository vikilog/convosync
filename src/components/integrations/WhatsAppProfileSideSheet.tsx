/**
 * WhatsApp Business profile editor (Meta Cloud API) — right sidesheet.
 * Fields mirror WhatsApp Manager / Facebook Business profile panel.
 */
import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Building2, Loader2, Phone, X } from 'lucide-react';
import { api, formatCatchError } from '../../lib/api';

export type WhatsAppProfileTarget = {
  phoneNumberId: string;
  phoneNumber?: string;
  displayName?: string;
  connectionMode?: string;
};

type Props = {
  open: boolean;
  account: WhatsAppProfileTarget | null;
  onClose: () => void;
  onSaved?: () => void;
};

const VERTICAL_LABELS: Record<string, string> = {
  OTHER: 'Other',
  AUTO: 'Automotive',
  BEAUTY: 'Beauty, Spa & Salon',
  APPAREL: 'Clothing & Apparel',
  EDU: 'Education',
  ENTERTAIN: 'Entertainment',
  EVENT_PLAN: 'Event Planning',
  FINANCE: 'Finance & Banking',
  GROCERY: 'Food & Grocery',
  GOVT: 'Public Service',
  HOTEL: 'Hotel & Lodging',
  HEALTH: 'Medical & Health',
  NONPROFIT: 'Non-profit',
  PROF_SERVICES: 'Professional Services',
  RETAIL: 'Shopping & Retail',
  TRAVEL: 'Travel & Transportation',
  RESTAURANT: 'Restaurant',
  ALCOHOL: 'Alcoholic Beverages',
  ONLINE_GAMBLING: 'Online Gambling & Gaming',
  PHYSICAL_GAMBLING: 'Gambling (offline)',
  OTC_DRUGS: 'Over-the-Counter Drugs',
};

const inputClass =
  'w-full rounded-xl border border-black/10 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/15';

const labelClass = 'block text-[11px] font-bold uppercase tracking-wide text-slate-500 mb-1.5';

export function WhatsAppProfileSideSheet({ open, account, onClose, onSaved }: Props) {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [verifiedName, setVerifiedName] = useState('');
  const [displayPhone, setDisplayPhone] = useState('');
  const [qualityRating, setQualityRating] = useState<string | null>(null);
  const [nameStatus, setNameStatus] = useState<string | null>(null);
  const [pictureUrl, setPictureUrl] = useState<string | null>(null);
  const [verticals, setVerticals] = useState<string[]>(Object.keys(VERTICAL_LABELS));

  const [about, setAbout] = useState('');
  const [address, setAddress] = useState('');
  const [description, setDescription] = useState('');
  const [email, setEmail] = useState('');
  const [website1, setWebsite1] = useState('');
  const [website2, setWebsite2] = useState('');
  const [vertical, setVertical] = useState('');

  useEffect(() => {
    if (!open || !account?.phoneNumberId) return;
    let cancelled = false;
    setLoading(true);
    setError(null);
    setSuccess(null);
    void api
      .getWhatsAppBusinessProfile(account.phoneNumberId)
      .then((data) => {
        if (cancelled) return;
        setVerifiedName(data.verifiedName || account.displayName || '');
        setDisplayPhone(data.displayPhoneNumber || account.phoneNumber || '');
        setQualityRating(data.qualityRating);
        setNameStatus(data.nameStatus);
        setPictureUrl(data.profile.profilePictureUrl);
        setAbout(data.profile.about || '');
        setAddress(data.profile.address || '');
        setDescription(data.profile.description || '');
        setEmail(data.profile.email || '');
        setWebsite1(data.profile.websites[0] || '');
        setWebsite2(data.profile.websites[1] || '');
        setVertical(data.profile.vertical || '');
        if (data.verticals?.length) setVerticals(data.verticals);
      })
      .catch((err) => {
        if (!cancelled) setError(formatCatchError(err));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [open, account?.phoneNumberId, account?.displayName, account?.phoneNumber]);

  const handleSave = async () => {
    if (!account?.phoneNumberId) return;
    setSaving(true);
    setError(null);
    setSuccess(null);
    try {
      await api.updateWhatsAppBusinessProfile(account.phoneNumberId, {
        about,
        address,
        description,
        email,
        websites: [website1, website2].map((u) => u.trim()).filter(Boolean),
        vertical,
      });
      setSuccess('Profile updated on WhatsApp');
      onSaved?.();
    } catch (err) {
      setError(formatCatchError(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <AnimatePresence>
      {open && account && (
        <>
          <motion.button
            type="button"
            aria-label="Close profile sheet"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[78] bg-slate-900/30 cursor-pointer border-0"
            onClick={onClose}
          />
          <motion.aside
            key="wa-profile-sheet"
            role="dialog"
            aria-modal="true"
            aria-label="WhatsApp business profile"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 320 }}
            className="fixed top-0 right-0 z-[79] flex h-full w-full max-w-lg flex-col border-l border-black/5 bg-surface shadow-2xl"
          >
            <header className="flex items-start justify-between gap-3 border-b border-black/5 px-5 py-4 shrink-0">
              <div className="flex gap-3 min-w-0">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                  <Building2 className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <h2 className="text-base font-bold text-slate-900 truncate">Business profile</h2>
                  <p className="text-xs text-slate-500 font-medium mt-0.5">
                    Same fields as WhatsApp Manager / Meta Business Suite
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 hover:bg-surface-muted cursor-pointer"
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </button>
            </header>

            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">
              {loading ? (
                <div className="flex items-center justify-center gap-2 py-16 text-slate-500 text-sm">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Loading profile from Meta…
                </div>
              ) : (
                <>
                  <section className="rounded-2xl border border-black/5 bg-surface-muted/80 p-4">
                    <div className="flex items-center gap-3">
                      {pictureUrl ? (
                        <img
                          src={pictureUrl}
                          alt=""
                          className="h-14 w-14 rounded-full object-cover border border-black/5 bg-white"
                        />
                      ) : (
                        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-white border border-black/5 text-primary">
                          <Phone className="h-6 w-6" />
                        </div>
                      )}
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-slate-900 truncate">
                          {verifiedName || 'WhatsApp Business'}
                        </p>
                        <p className="text-xs font-mono text-slate-600 mt-0.5 truncate">
                          {displayPhone || account.phoneNumberId}
                        </p>
                        <div className="mt-1.5 flex flex-wrap gap-1.5">
                          {qualityRating && (
                            <span className="rounded-full bg-white border border-black/5 px-2 py-0.5 text-[10px] font-semibold text-slate-600">
                              Quality · {qualityRating}
                            </span>
                          )}
                          {nameStatus && (
                            <span className="rounded-full bg-white border border-black/5 px-2 py-0.5 text-[10px] font-semibold text-slate-600">
                              Name · {nameStatus}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <p className="mt-3 text-[11px] text-slate-500 leading-relaxed">
                      Display name is set via Meta verification. Profile photo changes still use
                      WhatsApp Manager / Meta Business Suite upload.
                    </p>
                  </section>

                  {error && (
                    <div className="text-sm font-medium text-red-700 bg-red-50 border border-red-100 rounded-xl px-3 py-2 space-y-1">
                      <p>{error}</p>
                      {/missing permissions|does not exist|whatsapp_business_management|Reconnect/i.test(
                        error
                      ) ? (
                        <p className="text-xs font-normal text-red-600/90">
                          Tip: In Meta Business Suite open the number → Profile, or disconnect this
                          WhatsApp number in ConvoSync and reconnect with Business API (full
                          permissions).
                        </p>
                      ) : null}
                    </div>
                  )}
                  {success && (
                    <p className="text-sm font-medium text-primary bg-primary/10 border border-primary/15 rounded-xl px-3 py-2">
                      {success}
                    </p>
                  )}

                  <div>
                    <label className={labelClass} htmlFor="wa-about">
                      About ({about.length}/139)
                    </label>
                    <textarea
                      id="wa-about"
                      value={about}
                      maxLength={139}
                      rows={2}
                      onChange={(e) => setAbout(e.target.value)}
                      className={inputClass}
                      placeholder="Short status under your profile photo"
                    />
                  </div>

                  <div>
                    <label className={labelClass} htmlFor="wa-description">
                      Description ({description.length}/512)
                    </label>
                    <textarea
                      id="wa-description"
                      value={description}
                      maxLength={512}
                      rows={4}
                      onChange={(e) => setDescription(e.target.value)}
                      className={inputClass}
                      placeholder="Tell customers what your business does"
                    />
                  </div>

                  <div>
                    <label className={labelClass} htmlFor="wa-address">
                      Address
                    </label>
                    <input
                      id="wa-address"
                      value={address}
                      maxLength={256}
                      onChange={(e) => setAddress(e.target.value)}
                      className={inputClass}
                      placeholder="Business address"
                    />
                  </div>

                  <div>
                    <label className={labelClass} htmlFor="wa-email">
                      Email
                    </label>
                    <input
                      id="wa-email"
                      type="email"
                      value={email}
                      maxLength={128}
                      onChange={(e) => setEmail(e.target.value)}
                      className={inputClass}
                      placeholder="hello@yourbusiness.com"
                    />
                  </div>

                  <div>
                    <label className={labelClass} htmlFor="wa-vertical">
                      Category
                    </label>
                    <select
                      id="wa-vertical"
                      value={vertical}
                      onChange={(e) => setVertical(e.target.value)}
                      className={inputClass}
                    >
                      <option value="">Select category</option>
                      {verticals.map((v) => (
                        <option key={v} value={v}>
                          {VERTICAL_LABELS[v] || v}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-1 gap-3">
                    <div>
                      <label className={labelClass} htmlFor="wa-web1">
                        Website 1
                      </label>
                      <input
                        id="wa-web1"
                        value={website1}
                        maxLength={256}
                        onChange={(e) => setWebsite1(e.target.value)}
                        className={inputClass}
                        placeholder="https://"
                      />
                    </div>
                    <div>
                      <label className={labelClass} htmlFor="wa-web2">
                        Website 2
                      </label>
                      <input
                        id="wa-web2"
                        value={website2}
                        maxLength={256}
                        onChange={(e) => setWebsite2(e.target.value)}
                        className={inputClass}
                        placeholder="https://"
                      />
                    </div>
                  </div>
                </>
              )}
            </div>

            <footer className="shrink-0 border-t border-black/5 px-5 py-4 flex items-center justify-end gap-2 bg-surface">
              <button
                type="button"
                onClick={onClose}
                className="rounded-xl border border-black/10 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-surface-muted cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={loading || saving || !about.trim()}
                onClick={() => void handleSave()}
                className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-bold text-white hover:bg-primary-hover disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                Save profile
              </button>
            </footer>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
