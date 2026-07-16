import React from 'react';
import { AlertTriangle, Facebook, Link2, RotateCw } from 'lucide-react';
import { AdAccount, MetaAdAccountOption } from '../../types';
import { GoogleIcon } from './GoogleIcon';
import { fmtInr } from './utils';

type ConnectionCardProps = {
  platform: 'meta' | 'google';
  connected: boolean;
  pending?: boolean;
  account: AdAccount | null;
  linkedEmail?: string | null;
  connecting: boolean;
  syncing: boolean;
  onConnect: () => void;
  onDisconnect: () => void;
  onSync: () => void;
  metaAdAccounts?: MetaAdAccountOption[];
  switchingAccount?: boolean;
  onSwitchAccount?: (id: string) => void;
};

function ConnectionCard({
  platform,
  connected,
  pending,
  account,
  linkedEmail,
  connecting,
  syncing,
  onConnect,
  onDisconnect,
  onSync,
  metaAdAccounts,
  switchingAccount,
  onSwitchAccount,
}: ConnectionCardProps) {
  const isMeta = platform === 'meta';

  if (connected && account) {
    return (
      <article className="rounded-2xl border border-slate-200 bg-white p-5 flex flex-col gap-4 h-full">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3 min-w-0">
            <div
              className={`p-2.5 rounded-xl shrink-0 ${
                isMeta ? 'bg-[#1877F2] text-white' : 'bg-white border border-slate-200'
              }`}
            >
              {isMeta ? (
                <Facebook className="w-5 h-5 fill-white" />
              ) : (
                <GoogleIcon className="w-5 h-5" />
              )}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h4 className="font-bold text-gray-900 text-sm truncate">{account.name}</h4>
                <span className="inline-flex items-center gap-1 text-xs font-bold text-green-700 bg-green-50 px-2 py-0.5 rounded-full">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
                  Connected
                </span>
              </div>
              <p className="text-xs text-gray-500 mt-1 font-medium">
                {isMeta ? 'Meta Business Ad Account' : 'Google Ads Customer Account'}
              </p>
            </div>
          </div>
        </div>

        <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
          <div>
            <dt className="text-gray-500 font-medium">Account ID</dt>
            <dd className="font-mono font-bold text-gray-800 truncate">{account.id}</dd>
          </div>
          <div>
            <dt className="text-gray-500 font-medium">Currency</dt>
            <dd className="font-bold text-gray-800">{account.currency}</dd>
          </div>
          <div>
            <dt className="text-gray-500 font-medium">Balance</dt>
            <dd className="font-bold text-sky-700">{fmtInr(account.balance)}</dd>
          </div>
          <div>
            <dt className="text-gray-500 font-medium">Timezone</dt>
            <dd className="font-bold text-gray-800 truncate">{account.timezone}</dd>
          </div>
        </dl>

        {isMeta && metaAdAccounts && metaAdAccounts.length > 1 && onSwitchAccount && (
          <div>
            <label htmlFor="meta-ad-account" className="text-xs font-bold text-gray-500 uppercase tracking-wide block mb-1">
              Ad Account
            </label>
            <select
              id="meta-ad-account"
              value={account.id}
              disabled={switchingAccount}
              onChange={(e) => onSwitchAccount(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 text-sm font-medium text-gray-700 rounded-xl hover:bg-white focus:border-channel-green focus:ring-2 focus:ring-emerald-100 outline-none cursor-pointer disabled:opacity-50"
            >
              {metaAdAccounts.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name} ({item.campaignCount} campaigns
                  {item.source === 'page_business' ? ', Page Business' : ''})
                </option>
              ))}
            </select>
          </div>
        )}

        <div className="flex items-center gap-2 mt-auto pt-1">
          <button
            type="button"
            onClick={onSync}
            disabled={syncing}
            className="px-3 py-2 bg-slate-50 border border-slate-200 text-sm font-bold text-gray-700 rounded-xl hover:bg-white transition-colors cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
          >
            <RotateCw className={`w-3.5 h-3.5 ${syncing ? 'animate-spin' : ''}`} />
            Sync
          </button>
          <button
            type="button"
            onClick={onDisconnect}
            className="px-3 py-2 bg-white border border-slate-200 text-sm font-bold text-red-600 rounded-xl hover:bg-red-50 hover:border-red-100 transition-colors cursor-pointer"
          >
            Disconnect
          </button>
        </div>
      </article>
    );
  }

  if (pending && linkedEmail) {
    return (
      <article className="rounded-2xl border border-amber-200 bg-amber-50/40 p-5 flex flex-col gap-4 h-full">
        <div className="flex items-start gap-3">
          <div className="p-2.5 bg-white border border-amber-200 rounded-xl shrink-0">
            <GoogleIcon className="w-5 h-5" />
          </div>
          <div>
            <h4 className="font-bold text-gray-900 text-sm">Google account linked</h4>
            <p className="text-xs text-gray-600 mt-1">{linkedEmail}</p>
            <p className="text-xs text-amber-800 mt-2 font-medium">
              Complete Google Ads API setup to sync Search, Display, and Performance Max campaigns.
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={onConnect}
          disabled={connecting}
          className="mt-auto w-full px-4 py-2.5 bg-white border border-amber-300 text-amber-900 text-sm font-bold rounded-xl hover:bg-amber-50 transition-colors cursor-pointer disabled:opacity-60 flex items-center justify-center gap-2"
        >
          <Link2 className="w-4 h-4" />
          {connecting ? 'Redirecting…' : 'Connect Google Ads'}
        </button>
      </article>
    );
  }

  return (
    <article className="rounded-2xl border border-dashed border-slate-300 bg-slate-50/60 p-5 flex flex-col gap-4 h-full">
      <div className="flex items-start gap-3">
        <div className={`p-2.5 rounded-xl shrink-0 ${isMeta ? 'bg-[#1877F2]/10' : 'bg-white border border-slate-200'}`}>
          {isMeta ? (
            <Facebook className="w-5 h-5 text-[#1877F2]" />
          ) : (
            <GoogleIcon className="w-5 h-5" />
          )}
        </div>
        <div>
          <h4 className="font-bold text-gray-900 text-sm">
            {isMeta ? 'Meta Ads' : 'Google Ads'}
          </h4>
          <p className="text-xs text-gray-600 mt-1 leading-relaxed">
            {isMeta
              ? 'Connect your Meta Business Ad Account for Click-to-WhatsApp campaigns and lead tracking.'
              : 'Connect Google Ads to monitor Search, Display, and lead form campaigns alongside Meta.'}
          </p>
        </div>
      </div>

      <button
        type="button"
        onClick={onConnect}
        disabled={connecting}
        className={`mt-auto w-full px-4 py-2.5 text-white text-sm font-bold rounded-xl transition-colors cursor-pointer disabled:opacity-60 flex items-center justify-center gap-2 ${
          isMeta ? 'bg-[#1877F2] hover:bg-[#166fe0]' : 'bg-gray-900 hover:bg-gray-800'
        }`}
      >
        {isMeta ? <Facebook className="w-4 h-4 fill-white" /> : <GoogleIcon className="w-4 h-4" />}
        {connecting ? 'Redirecting…' : isMeta ? 'Connect Meta Account' : 'Connect Google Ads'}
      </button>
    </article>
  );
}

export const PlatformConnectionPanel: React.FC<{
  metaConnected: boolean;
  metaAccount: AdAccount | null;
  metaAdAccounts: MetaAdAccountOption[];
  metaConnecting: boolean;
  metaSyncing: boolean;
  metaSwitchingAccount: boolean;
  onMetaConnect: () => void;
  onMetaDisconnect: () => void;
  onMetaSync: () => void;
  onMetaSwitchAccount: (id: string) => void;
  googleConnected: boolean;
  googlePending: boolean;
  googleAccount: AdAccount | null;
  googleLinkedEmail: string | null;
  googleConnecting: boolean;
  googleSyncing: boolean;
  onGoogleConnect: () => void;
  onGoogleDisconnect: () => void;
  onGoogleSync: () => void;
}> = (props) => {
  const noneConnected = !props.metaConnected && !props.googleConnected && !props.googlePending;

  return (
    <section aria-label="Ad platform connections" className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h4 className="text-sm font-black text-gray-900">Connected platforms</h4>
          <p className="text-xs text-gray-500 mt-0.5">
            Link Meta and Google to manage paid campaigns from one workspace.
          </p>
        </div>
        {noneConnected && (
          <span className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-full">
            <AlertTriangle className="w-3.5 h-3.5" />
            Setup required
          </span>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <ConnectionCard
          platform="meta"
          connected={props.metaConnected}
          account={props.metaAccount}
          connecting={props.metaConnecting}
          syncing={props.metaSyncing}
          onConnect={props.onMetaConnect}
          onDisconnect={props.onMetaDisconnect}
          onSync={props.onMetaSync}
          metaAdAccounts={props.metaAdAccounts}
          switchingAccount={props.metaSwitchingAccount}
          onSwitchAccount={props.onMetaSwitchAccount}
        />
        <ConnectionCard
          platform="google"
          connected={props.googleConnected}
          pending={props.googlePending}
          account={props.googleAccount}
          linkedEmail={props.googleLinkedEmail}
          connecting={props.googleConnecting}
          syncing={props.googleSyncing}
          onConnect={props.onGoogleConnect}
          onDisconnect={props.onGoogleDisconnect}
          onSync={props.onGoogleSync}
        />
      </div>
    </section>
  );
};
