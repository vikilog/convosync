/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useCallback, useEffect, useState } from 'react';
import {
  Calendar,
  FileSpreadsheet,
  FolderOpen,
  HardDrive,
  Loader2,
  Mail,
  MapPin,
  RefreshCw,
  Settings,
  Trash2,
  Video,
} from 'lucide-react';
import { api, formatCatchError } from '../../lib/api';
import { getGoogleOAuthRedirectUri, startGoogleOAuth } from '../../lib/googleOAuth';
import { notifyGoogleToolsChanged } from '../../lib/googleTools';
import { pathForGoogleTool } from '../../routes';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { GbpSyncPanel } from './GbpSyncPanel';

type GoogleProductKey =
  | 'calendar'
  | 'business_profile'
  | 'sheets'
  | 'drive'
  | 'gmail'
  | 'meet';

type GoogleConnection = {
  id: string;
  email: string;
  displayName?: string | null;
  pictureUrl?: string | null;
  status: string;
};

type GoogleProductSummary = {
  product: GoogleProductKey;
  label: string;
  description: string;
  status: string;
  connectionId: string | null;
  connectionEmail: string | null;
  lastSyncAt: string | null;
  lastError: string | null;
  syncCount: number;
  config: Record<string, unknown> | null;
};

const PRODUCT_ICONS: Record<
  GoogleProductKey,
  { icon: React.FC<{ className?: string }>; bg: string; color: string }
> = {
  calendar: { icon: Calendar, bg: 'bg-[#e8f4ff]', color: 'text-[#4285F4]' },
  business_profile: { icon: MapPin, bg: 'bg-[#e6f7ec]', color: 'text-[#34A853]' },
  sheets: { icon: FileSpreadsheet, bg: 'bg-[#e6f7ec]', color: 'text-[#0F9D58]' },
  drive: { icon: HardDrive, bg: 'bg-[#fff8e6]', color: 'text-[#F4B400]' },
  gmail: { icon: Mail, bg: 'bg-[#fce8f0]', color: 'text-[#EA4335]' },
  meet: { icon: Video, bg: 'bg-[#e8f4ff]', color: 'text-[#4285F4]' },
};

function formatDate(iso: string | null): string {
  if (!iso) return 'Never';
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return iso;
  }
}

function statusLabel(status: string): string {
  if (status === 'connected') return 'Connected';
  if (status === 'error') return 'Error';
  if (status === 'syncing') return 'Syncing';
  return 'Not connected';
}

function statusClass(status: string): string {
  if (status === 'connected') return 'bg-[#e6f7ec] text-[#006d2f] border-[#5dfd8a]/40';
  if (status === 'error') return 'bg-red-50 text-red-700 border-red-200';
  if (status === 'syncing') return 'bg-[#e8f4ff] text-[#4285F4] border-[#4285F4]/20';
  return 'bg-gray-50 text-gray-500 border-gray-200';
}

type GoogleProductCardProps = {
  product: GoogleProductSummary;
  connections: GoogleConnection[];
  busy: boolean;
  onConnect: (connectionId: string) => void;
  onDisconnect: () => void;
  onSync: () => void;
  onManage: () => void;
};

function GoogleProductCard({
  product,
  connections,
  busy,
  onConnect,
  onDisconnect,
  onSync,
  onManage,
}: GoogleProductCardProps) {
  const meta = PRODUCT_ICONS[product.product];
  const Icon = meta.icon;
  const isConnected = product.status === 'connected';
  const [selectedConnection, setSelectedConnection] = useState(
    product.connectionId || connections[0]?.id || ''
  );

  useEffect(() => {
    if (product.connectionId) setSelectedConnection(product.connectionId);
    else if (connections[0]?.id) setSelectedConnection(connections[0].id);
  }, [product.connectionId, connections]);

  return (
    <article className="bg-white rounded-2xl border border-slate-200 p-5 flex flex-col h-full shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
      <div className="flex items-start gap-3 min-w-0">
        <div
          className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${meta.bg}`}
        >
          <Icon className={`w-5 h-5 ${meta.color}`} />
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="text-sm font-black text-gray-950 leading-tight">{product.label}</h3>
          <span
            className={`mt-1 inline-flex text-sm font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${statusClass(product.status)}`}
          >
            {statusLabel(product.status)}
          </span>
        </div>
      </div>

      <p className="mt-2 text-xs text-gray-500 font-medium leading-relaxed flex-1">
        {product.description}
      </p>

      <div className="mt-3 space-y-1 text-xs text-gray-400 font-medium">
        <p>Last sync: {formatDate(product.lastSyncAt)}</p>
        {product.connectionEmail && <p>Account: {product.connectionEmail}</p>}
        {product.lastError && (
          <p className="text-red-500 font-bold truncate" title={product.lastError}>
            {product.lastError}
          </p>
        )}
      </div>

      {!isConnected && connections.length > 0 && (
        <div className="mt-3">
          <label className="text-sm font-bold text-gray-400 uppercase tracking-wide">
            Google account
          </label>
          <select
            value={selectedConnection}
            onChange={(e) => setSelectedConnection(e.target.value)}
            className="mt-1 w-full text-xs border border-slate-200 rounded-lg px-2 py-1.5 font-medium"
          >
            {connections.map((c) => (
              <option key={c.id} value={c.id}>
                {c.email}
              </option>
            ))}
          </select>
        </div>
      )}

      <div className="mt-4 flex flex-wrap gap-2">
        {!isConnected ? (
          <button
            type="button"
            disabled={busy || connections.length === 0}
            onClick={() => selectedConnection && onConnect(selectedConnection)}
            className="flex-1 min-w-[80px] px-3 py-2 rounded-lg text-sm font-bold bg-gray-900 hover:bg-gray-800 text-white disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Connect
          </button>
        ) : (
          <>
            <button
              type="button"
              disabled={busy}
              onClick={onSync}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-sm font-black border border-[#4285F4]/20 text-[#4285F4] bg-[#e8f4ff] hover:bg-[#dbeafe] disabled:opacity-50"
            >
              <RefreshCw className={`w-3 h-3 ${busy ? 'animate-spin' : ''}`} />
              Sync
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={onManage}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-sm font-black border border-gray-200 text-gray-600 bg-gray-50 hover:bg-gray-100 disabled:opacity-50"
            >
              <Settings className="w-3 h-3" />
              Manage
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={onDisconnect}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-sm font-black border border-red-200 text-red-600 bg-red-50 hover:bg-red-100 disabled:opacity-50"
            >
              <Trash2 className="w-3 h-3" />
              Disconnect
            </button>
          </>
        )}
      </div>
    </article>
  );
}

export function GooglePanel() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const showGbpSync = searchParams.get('gbp') === 'sync';
  const [connections, setConnections] = useState<GoogleConnection[]>([]);
  const [products, setProducts] = useState<GoogleProductSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [connectingAccount, setConnectingAccount] = useState(false);
  const [busyProduct, setBusyProduct] = useState<GoogleProductKey | null>(null);
  const [message, setMessage] = useState('');
  const [manageProduct, setManageProduct] = useState<GoogleProductKey | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [connRes, prodRes] = await Promise.all([
        api.getGoogleConnections(),
        api.getGoogleProducts(),
      ]);
      setConnections(connRes.connections ?? []);
      setProducts(prodRes.products ?? []);
    } catch (err) {
      setMessage(formatCatchError(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const handleConnectAccount = async () => {
    setConnectingAccount(true);
    setMessage('');
    try {
      const redirectUri = getGoogleOAuthRedirectUri();
      const state = await api.getGoogleOAuthState(redirectUri);
      startGoogleOAuth(state.oauthUrl, state.redirectUri);
    } catch (err) {
      setMessage(formatCatchError(err));
      setConnectingAccount(false);
    }
  };

  const handleDisconnectAccount = async (id: string) => {
    setMessage('');
    try {
      await api.disconnectGoogleConnection(id);
      await load();
    } catch (err) {
      setMessage(formatCatchError(err));
    }
  };

  const handleProductConnect = async (product: GoogleProductKey, connectionId: string) => {
    setBusyProduct(product);
    setMessage('');
    try {
      await api.connectGoogleProduct(product, connectionId);
      await load();
      notifyGoogleToolsChanged();
      if (product === 'calendar') {
        navigate(pathForGoogleTool('calendar'));
      }
    } catch (err) {
      setMessage(formatCatchError(err));
    } finally {
      setBusyProduct(null);
    }
  };

  const handleProductDisconnect = async (product: GoogleProductSummary) => {
    if (!product.connectionId) return;
    setBusyProduct(product.product);
    setMessage('');
    try {
      await api.disconnectGoogleProduct(product.product, product.connectionId);
      await load();
      notifyGoogleToolsChanged();
    } catch (err) {
      setMessage(formatCatchError(err));
    } finally {
      setBusyProduct(null);
    }
  };

  const handleProductSync = async (product: GoogleProductSummary) => {
    if (!product.connectionId) return;
    setBusyProduct(product.product);
    setMessage('');
    try {
      if (product.product === 'business_profile') {
        await api.enqueueGoogleBusinessProfileSync({
          connectionId: product.connectionId,
          syncType: 'accounts',
          force: true,
        });
        setMessage('Business Profile accounts sync queued.');
      } else {
        await api.syncGoogleProduct(product.product, product.connectionId);
      }
      await load();
    } catch (err) {
      setMessage(formatCatchError(err));
    } finally {
      setBusyProduct(null);
    }
  };

  const manageSummary = manageProduct
    ? products.find((p) => p.product === manageProduct)
    : null;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16 text-gray-400">
        <Loader2 className="w-6 h-6 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {message && (
        <p className="text-sm font-bold text-red-500 bg-red-50 border border-red-100 rounded-xl px-4 py-2">
          {message}
        </p>
      )}

      <section className="bg-white border border-slate-200 rounded-2xl p-5">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h3 className="text-sm font-black text-gray-950">Google accounts</h3>
            <p className="text-xs text-gray-500 font-medium mt-1">
              Connect one or more Google accounts at the workspace level. Products reuse the same OAuth tokens.
            </p>
          </div>
          <button
            type="button"
            onClick={() => void handleConnectAccount()}
            disabled={connectingAccount}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold bg-[#4285F4] hover:bg-[#3367d6] text-white disabled:opacity-50"
          >
            {connectingAccount ? <Loader2 className="w-4 h-4 animate-spin" /> : <FolderOpen className="w-4 h-4" />}
            {connectingAccount ? 'Redirecting…' : 'Connect Google account'}
          </button>
        </div>

        {connections.length > 0 ? (
          <ul className="mt-4 space-y-2">
            {connections.map((c) => (
              <li
                key={c.id}
                className="flex items-center justify-between gap-3 px-3 py-2 rounded-xl border border-slate-200 bg-slate-50"
              >
                <div className="flex items-center gap-2 min-w-0">
                  {c.pictureUrl ? (
                    <img src={c.pictureUrl} alt="" className="w-8 h-8 rounded-full" />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-[#e8f4ff] flex items-center justify-center text-[#4285F4] text-sm font-black">
                      G
                    </div>
                  )}
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-gray-900 truncate">{c.email}</p>
                    {c.displayName && (
                      <p className="text-xs text-gray-400 truncate">{c.displayName}</p>
                    )}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => void handleDisconnectAccount(c.id)}
                  className="text-sm font-bold text-red-500 hover:text-red-700"
                >
                  Remove
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-4 text-xs text-gray-400 font-medium">
            No Google accounts connected yet.
          </p>
        )}
      </section>

      {(() => {
        const gbp = products.find(
          (p) => p.product === 'business_profile' && p.status === 'connected' && p.connectionId
        );
        if (!gbp?.connectionId) return null;
        return (
          <GbpSyncPanel
            connectionId={gbp.connectionId}
            connectionEmail={gbp.connectionEmail}
          />
        );
      })()}

      {showGbpSync && (
        <p className="text-meta text-gray-400 -mt-4">
          Google Business Profile sync controls are shown above when connected.
        </p>
      )}

      <section>
        <h3 className="text-sm font-black text-gray-950 mb-4">Google products</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {products.map((product) => (
            <GoogleProductCard
              key={product.product}
              product={product}
              connections={connections}
              busy={busyProduct === product.product}
              onConnect={(connectionId) => void handleProductConnect(product.product, connectionId)}
              onDisconnect={() => void handleProductDisconnect(product)}
              onSync={() => void handleProductSync(product)}
              onManage={() => setManageProduct(product.product)}
            />
          ))}
        </div>
      </section>

      {manageProduct && manageSummary && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30">
          <div className="bg-white rounded-2xl border border-slate-200 max-w-lg w-full p-6 shadow-xl max-h-[80vh] overflow-auto">
            <h3 className="text-lg font-black text-gray-950">{manageSummary.label}</h3>
            <p className="text-xs text-gray-500 mt-1 font-medium">
              Integration config and sync metadata (for Journey Engine, AI Agent, and webhooks).
            </p>
            <pre className="mt-4 text-xs font-mono bg-gray-50 border border-gray-100 rounded-xl p-3 overflow-auto max-h-48">
              {JSON.stringify(manageSummary.config ?? {}, null, 2)}
            </pre>
            <div className="mt-4 flex justify-end">
              <button
                type="button"
                onClick={() => setManageProduct(null)}
                className="px-4 py-2 rounded-lg text-sm font-bold bg-gray-900 text-white"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
