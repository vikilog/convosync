import React, { useCallback, useEffect, useState } from 'react';
import {
  Facebook,
  Eye,
  Plus,
  ArrowRight,
  Calendar,
  Send,
  AlertTriangle,
  RefreshCw,
  X,
} from 'lucide-react';
import { Link, useSearchParams } from 'react-router-dom';
import { api } from '../lib/api';
import { useKeepAliveActivation } from './KeepAlive';
import { startFacebookPageConnect } from '../lib/metaOAuth';
import { FacebookPage } from '../types';

function formatNum(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return n.toString();
}

const CreatePostModal: React.FC<{
  pageName: string;
  onClose: () => void;
  onPost: (msg: string, scheduledTime?: string) => void | Promise<void>;
}> = ({ pageName, onClose, onPost }) => {
  const [message, setMessage] = useState('');
  const [scheduleMode, setScheduleMode] = useState(false);
  const [scheduledTime, setScheduledTime] = useState('');

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-surface rounded-2xl w-full max-w-lg shadow-2xl border border-black/5">
        <div className="flex items-center justify-between p-5 border-b border-black/5">
          <h3 className="font-black text-gray-900 text-sm flex items-center gap-2">
            <Facebook className="w-4 h-4 text-[#0084FF]" /> Create Facebook Post
          </h3>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="cursor-pointer rounded-lg p-2 text-gray-400 transition-colors hover:bg-gray-50 hover:text-gray-700"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          <div className="flex items-center gap-2.5 p-3 bg-[#fafaf9] rounded-xl border border-slate-200">
            <div className="w-9 h-9 rounded-xl bg-[#0084FF] flex items-center justify-center">
              <Facebook className="w-5 h-5 text-white fill-white" />
            </div>
            <div>
              <p className="text-sm font-black text-gray-900">{pageName}</p>
              <div className="flex items-center gap-1.5 text-xs text-gray-400 font-medium">
                {scheduleMode ? (
                  <><Calendar className="w-3 h-3" /> Scheduled</>
                ) : (
                  <><Eye className="w-3 h-3" /> Posting now</>
                )}
              </div>
            </div>
          </div>

          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="What's on your mind? Share an update, announcement, or offer..."
            rows={5}
            className="w-full text-sm border border-slate-200 rounded-xl px-4 py-3 outline-none focus:border-channel-green resize-none leading-relaxed"
          />

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setScheduleMode(!scheduleMode)}
              className={`cursor-pointer flex items-center gap-2 text-sm font-bold px-3 py-2 rounded-xl border transition-all ${scheduleMode ? 'bg-sky-50 border-channel-green/30 text-sky-600' : 'bg-[#fafaf9] border-slate-200 text-gray-500'}`}
            >
              <Calendar className="w-3.5 h-3.5" />
              Schedule for later
            </button>
            {scheduleMode && (
              <input
                type="datetime-local"
                value={scheduledTime}
                onChange={(e) => setScheduledTime(e.target.value)}
                className="flex-1 text-xs border border-slate-200 rounded-xl px-3 py-2 outline-none focus:border-channel-green"
              />
            )}
          </div>

          <p className="text-xs text-gray-400">
            {message.length}/2200 characters
          </p>
        </div>

        <div className="flex items-center justify-end gap-3 p-5 border-t border-slate-200">
          <button type="button" onClick={onClose} className="cursor-pointer px-4 py-2 text-sm font-bold text-gray-600 border border-slate-200 rounded-xl hover:bg-gray-50 transition-all">
            Cancel
          </button>
          <button
            type="button"
            onClick={() => {
              void onPost(message, scheduleMode && scheduledTime ? scheduledTime : undefined);
              onClose();
            }}
            disabled={!message.trim() || (scheduleMode && !scheduledTime)}
            className="cursor-pointer px-5 py-2 bg-primary hover:bg-primary-hover disabled:bg-gray-200 disabled:cursor-not-allowed text-white text-sm font-bold rounded-xl transition-all flex items-center gap-2 shadow-md shadow-primary/20"
          >
            {scheduleMode ? <><Calendar className="w-3.5 h-3.5" /> Schedule Post</> : <><Send className="w-3.5 h-3.5" /> Publish Now</>}
          </button>
        </div>
      </div>
    </div>
  );
};

export const FacebookPageView: React.FC = () => {
  const [searchParams] = useSearchParams();
  const [page, setPage] = useState<FacebookPage | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [showCreatePost, setShowCreatePost] = useState(false);
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [missingScopes, setMissingScopes] = useState<string[]>([]);

  const loadPageStatus = useCallback(async (options?: { silent?: boolean }) => {
    if (!options?.silent) setLoading(true);
    if (!options?.silent) setError(null);
    try {
      const res = await api.getFacebookPage();
      if (res.connected && res.page) {
        setIsConnected(true);
        setMissingScopes(res.missingScopes ?? []);
        setPage({
          id: res.page.id,
          name: res.page.name,
          category: res.page.category,
          picture: res.page.picture,
          accessToken: '',
          followersCount: res.page.followersCount,
          isConnected: true,
        });
      } else {
        setIsConnected(false);
        setMissingScopes([]);
        setPage(null);
      }
    } catch (err) {
      if (!options?.silent) {
        setError(err instanceof Error ? err.message : 'Failed to load Facebook Page status');
        setIsConnected(false);
      }
    } finally {
      if (!options?.silent) setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadPageStatus();
  }, [loadPageStatus]);

  useKeepAliveActivation(() => {
    void loadPageStatus({ silent: true });
  });

  useEffect(() => {
    if (searchParams.get('facebook_connected') === '1') {
      void loadPageStatus();
    }
    if (searchParams.get('facebook_error') === '1') {
      setError('Facebook connection failed. Please try again.');
    }
  }, [searchParams, loadPageStatus]);

  const handleConnect = async () => {
    setConnecting(true);
    setError(null);
    try {
      await startFacebookPageConnect({ rerequest: isConnected || missingScopes.length > 0 });
    } catch (err) {
      setConnecting(false);
      setError(err instanceof Error ? err.message : 'Failed to start Facebook login');
    }
  };

  const handleDisconnect = async () => {
    try {
      await api.disconnectFacebookPage();
      setIsConnected(false);
      setMissingScopes([]);
      setPage(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to disconnect');
    }
  };

  const handleNewPost = async (message: string, scheduledTime?: string) => {
    await api.createFacebookPost(message, scheduledTime);
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadPageStatus();
    setRefreshing(false);
  };

  if (loading) {
    return (
      <div className="flex-1 max-w-7xl mx-auto pb-12 flex items-center justify-center min-h-[240px]">
        <p className="text-sm text-gray-400 font-medium">Loading Facebook Page…</p>
      </div>
    );
  }

  return (
    <div className="flex-1 space-y-6 max-w-7xl mx-auto pb-12 text-left selection:bg-sky-50">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h3 className="font-display font-black text-gray-900 text-lg leading-none">Facebook Page</h3>
          <p className="text-xs text-gray-400 mt-1.5 font-medium">
            Connect your Page and publish posts — comments, AI replies, and analytics live in Social Listening.
          </p>
        </div>
        {isConnected && (
          <button
            type="button"
            onClick={() => setShowCreatePost(true)}
            className="cursor-pointer bg-primary hover:bg-primary-hover text-white px-4 py-2 rounded-xl flex items-center gap-1.5 text-sm font-bold transition-all active:scale-95 shadow-md shadow-primary/20"
          >
            <Plus className="w-3.5 h-3.5" /> Create Post
          </button>
        )}
      </div>

      {error && (
        <div className="bg-red-50 border border-red-100 text-red-600 text-xs font-medium px-4 py-3 rounded-xl">
          {error}
        </div>
      )}

      {isConnected && missingScopes.length > 0 && (
        <div className="bg-[#fff5e6]/60 border border-[#f2994a]/40 text-orange-800 text-xs font-medium px-4 py-3 rounded-xl space-y-2">
          <p className="font-bold">Meta permissions incomplete</p>
          <p>
            Missing: {missingScopes.join(', ')}. Comments and insights in Social Listening need these permissions on your Page token.
          </p>
          <p>
            In Meta Developer App → App Review → Permissions and Features, enable{' '}
            <strong>pages_read_engagement</strong>, <strong>pages_read_user_content</strong>, and{' '}
            <strong>read_insights</strong> (Standard access for testing).
            Then disconnect and reconnect using a Facebook account that is App Admin/Developer/Tester.
          </p>
          <button
            type="button"
            onClick={() => void handleConnect()}
            className="cursor-pointer px-3 py-1.5 bg-[#0084FF] hover:bg-[#0071d4] text-white text-sm font-bold rounded-lg transition-colors"
          >
            Reconnect with permissions
          </button>
        </div>
      )}

      {isConnected && page ? (
        <div className="bg-white border border-[#1877F2]/20 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
          <div className="flex items-center gap-3 min-w-0">
            <div className="relative shrink-0">
              {page.picture ? (
                <img
                  src={page.picture}
                  alt=""
                  className="w-11 h-11 rounded-xl object-cover border border-black/5"
                />
              ) : (
                <div className="w-11 h-11 rounded-xl bg-[#0084FF] flex items-center justify-center">
                  <Facebook className="w-5 h-5 text-white fill-white" />
                </div>
              )}
              <span className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-white border border-black/5 flex items-center justify-center">
                <Facebook className="w-2.5 h-2.5 text-[#1877F2] fill-[#1877F2]" />
              </span>
            </div>
            <div className="min-w-0">
              <p className="font-bold text-gray-950 text-sm leading-none truncate">{page.name}</p>
              <p className="text-xs text-gray-400 font-medium leading-normal mt-1.5 truncate">
                {page.category} · {formatNum(page.followersCount)} followers · Page ID: {page.id}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <span className="inline-flex items-center gap-1.5 text-xs font-black text-[#1877F2] bg-[#e8f4ff] border border-[#1877F2]/20 px-2.5 py-1.5 rounded-xl">
              <span className="w-1.5 h-1.5 rounded-full bg-[#1877F2]" /> Connected
            </span>
            <button
              type="button"
              onClick={() => void handleRefresh()}
              disabled={refreshing}
              className="cursor-pointer px-3 py-1.5 bg-surface border border-black/5 text-sm font-bold text-gray-600 rounded-xl hover:bg-surface-muted flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <RefreshCw className={`w-3 h-3 ${refreshing ? 'animate-spin' : ''}`} /> Refresh
            </button>
            <button
              type="button"
              onClick={() => void handleDisconnect()}
              className="cursor-pointer px-3 py-1.5 bg-surface border border-black/5 text-sm font-bold text-red-500 rounded-xl hover:bg-red-50 hover:border-red-200"
            >
              Disconnect
            </button>
          </div>
        </div>
      ) : (
        <div className="bg-[#fff5e6]/40 border border-[#f2994a]/30 p-5 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="p-2.5 bg-[#fff5e6] rounded-xl shrink-0">
              <AlertTriangle className="w-5 h-5 text-orange-400" />
            </div>
            <div>
              <p className="text-sm font-bold text-gray-900 leading-none">No Facebook Page Connected</p>
              <p className="text-meta text-gray-400 font-medium leading-normal mt-1">
                Connect your Facebook Page to publish posts and let Social Listening classify and reply to comments.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => void handleConnect()}
            disabled={connecting}
            className="cursor-pointer px-4 py-2 bg-[#0084FF] hover:bg-[#0071d4] disabled:opacity-60 disabled:cursor-not-allowed text-white text-sm font-bold rounded-xl shadow-md transition-all whitespace-nowrap flex items-center gap-2"
          >
            <Facebook className="w-4 h-4 fill-white" />
            {connecting ? 'Redirecting…' : 'Connect Facebook Page'}
          </button>
        </div>
      )}

      {isConnected && page && (
        <Link
          to="/social-listening/content?platform=facebook"
          className="flex items-center justify-between gap-3 rounded-2xl border border-black/5 bg-surface p-5 hover:border-primary/20 hover:shadow-md transition-all group"
        >
          <div>
            <p className="text-sm font-bold text-gray-900">View posts &amp; comments in Social Listening</p>
            <p className="text-xs text-gray-400 mt-1">
              Browse posts, see AI-classified comments, and reply, hide, or delete — all with the same automation Instagram uses.
            </p>
          </div>
          <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-primary transition-colors shrink-0" />
        </Link>
      )}

      {showCreatePost && page && (
        <CreatePostModal
          pageName={page.name}
          onClose={() => setShowCreatePost(false)}
          onPost={handleNewPost}
        />
      )}
    </div>
  );
};
