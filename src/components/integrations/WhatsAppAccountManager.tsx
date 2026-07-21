import { CheckCircle2, MessageCircle, Settings2, Unplug } from 'lucide-react';

export type WhatsAppPhoneAccount = {
  id: string;
  phoneNumberId: string;
  label: string;
  phone: string;
  dailyLimit: string;
  qosRating: string;
  status: string;
  verified: boolean;
  connectionMode?: string;
};

type WhatsAppAccountManagerProps = {
  accounts: WhatsAppPhoneAccount[];
  onDisconnect: (phoneNumberId: string) => void;
  onEditProfile?: (account: WhatsAppPhoneAccount) => void;
};

function AccountMetric({
  label,
  value,
  tone = 'default',
}: {
  label: string;
  value: string;
  tone?: 'default' | 'success';
}) {
  return (
    <div className="rounded-xl border border-slate-100 bg-slate-50/80 px-3 py-2.5 min-w-[7.5rem]">
      <p className="text-[11px] font-medium uppercase tracking-wide text-slate-500">{label}</p>
      <p
        className={`mt-0.5 text-sm font-semibold truncate ${
          tone === 'success' ? 'text-emerald-700' : 'text-slate-800'
        }`}
      >
        {value}
      </p>
    </div>
  );
}

export function WhatsAppAccountManager({
  accounts,
  onDisconnect,
  onEditProfile,
}: WhatsAppAccountManagerProps) {
  const connectedCount = accounts.length;
  const verifiedCount = accounts.filter((a) => a.verified).length;

  return (
    <div className="space-y-6 max-w-5xl">
      <header className="rounded-2xl border border-slate-200 bg-gradient-to-br from-white via-white to-[#f4fbf6] p-5 sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-channel-green text-white shadow-sm">
              <MessageCircle className="h-6 w-6" aria-hidden />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900 sm:text-2xl">WhatsApp Business</h2>
              <p className="mt-1 max-w-xl text-sm leading-relaxed text-slate-600">
                Manage connected numbers, Meta verification, and business profile (About, category,
                websites).
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2 sm:justify-end">
            <div className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-center min-w-[5.5rem]">
              <p className="text-[11px] font-medium uppercase tracking-wide text-slate-500">
                Connected
              </p>
              <p className="text-lg font-bold text-slate-900">{connectedCount}</p>
            </div>
            <div className="rounded-xl border border-emerald-200 bg-emerald-50/80 px-3 py-2 text-center min-w-[5.5rem]">
              <p className="text-[11px] font-medium uppercase tracking-wide text-emerald-700">
                Verified
              </p>
              <p className="text-lg font-bold text-emerald-800">{verifiedCount}</p>
            </div>
          </div>
        </div>
      </header>

      <section className="space-y-4" aria-label="WhatsApp phone numbers">
        <div>
          <h3 className="text-sm font-semibold text-slate-900">Active phone accounts</h3>
          <p className="text-sm text-slate-500">
            Numbers linked to this workspace via Meta Business API.
          </p>
        </div>

        <div className="space-y-3">
          {accounts.map((account) => {
            const isBusinessApi = (account.connectionMode || 'business_api') !== 'app_coexistence';
            return (
              <article
                key={account.id}
                className="group rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 transition-colors duration-200 hover:border-slate-300 hover:shadow-sm"
              >
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="flex gap-4 min-w-0">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#e8f8ee] text-channel-green ring-1 ring-[#25D366]/15">
                      <MessageCircle className="h-6 w-6" aria-hidden />
                    </div>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-base font-semibold text-slate-900 truncate">
                          {account.label}
                        </h3>
                        {account.verified ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700 ring-1 ring-emerald-200/80">
                            <CheckCircle2 className="h-3.5 w-3.5" aria-hidden />
                            Meta verified
                          </span>
                        ) : null}
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-emerald-700">
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" aria-hidden />
                          {account.status}
                        </span>
                      </div>
                      <p className="mt-1 font-mono text-sm text-slate-600">{account.phone}</p>
                      <div className="mt-4 flex flex-wrap gap-2">
                        <AccountMetric label="Daily limit" value={account.dailyLimit} />
                        <AccountMetric label="QoS rating" value={account.qosRating} tone="success" />
                        <AccountMetric label="Phone ID" value={account.phoneNumberId} />
                      </div>
                    </div>
                  </div>

                  <div className="flex shrink-0 flex-wrap items-center gap-2 lg:pt-1">
                    {isBusinessApi && onEditProfile ? (
                      <button
                        type="button"
                        onClick={() => onEditProfile(account)}
                        className="inline-flex items-center gap-2 rounded-xl border border-primary/20 bg-primary/10 px-3.5 py-2 text-sm font-semibold text-primary transition-colors duration-200 hover:bg-primary/15 cursor-pointer"
                      >
                        <Settings2 className="h-4 w-4" aria-hidden />
                        Edit profile
                      </button>
                    ) : null}
                    <button
                      type="button"
                      onClick={() => onDisconnect(account.phoneNumberId)}
                      className="inline-flex items-center gap-2 rounded-xl border border-red-200 bg-white px-3.5 py-2 text-sm font-semibold text-red-600 transition-colors duration-200 hover:bg-red-50 cursor-pointer focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-500"
                    >
                      <Unplug className="h-4 w-4" aria-hidden />
                      Disconnect
                    </button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </section>
    </div>
  );
}
