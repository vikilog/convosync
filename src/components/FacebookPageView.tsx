import React, { useCallback, useEffect, useState } from 'react';
import {
  Facebook,
  ThumbsUp,
  MessageSquare,
  Share2,
  Eye,
  Reply,
  Trash2,
  EyeOff,
  Plus,
  ExternalLink,
  TrendingUp,
  Users,
  BarChart2,
  Calendar,
  Image as ImageIcon,
  Send,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  AlertTriangle,
} from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import { api } from '../lib/api';
import { useKeepAliveActivation } from './KeepAlive';
import {
  buildMetaOAuthDialogUrl,
  FACEBOOK_OAUTH_REDIRECT_STORAGE_KEY,
  FACEBOOK_PAGE_SCOPES,
} from '../lib/metaOAuth';
import {
  FacebookPost,
  FacebookComment,
  PageInsights,
  PageInsightsDailyPoint,
  FacebookPage,
} from '../types';
import { FacebookInsightsCharts } from './FacebookInsightsCharts';

function timeAgo(iso: string): string {
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

function formatNum(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return n.toString();
}

const InsightsBar: React.FC<{ insights: PageInsights }> = ({ insights }) => (
  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
    {[
      { label: 'Page Followers', value: formatNum(insights.pageFans), delta: `+${insights.pageFansDelta} this week`, icon: <Users className="w-4 h-4" />, color: 'text-sky-600', bg: 'bg-sky-50' },
      { label: 'Total Reach', value: formatNum(insights.pageImpressions), delta: 'last 28 days', icon: <Eye className="w-4 h-4" />, color: 'text-blue-600', bg: 'bg-blue-50' },
      { label: 'Engaged Users', value: formatNum(insights.pageEngagedUsers), delta: 'last 28 days', icon: <TrendingUp className="w-4 h-4" />, color: 'text-green-600', bg: 'bg-green-50' },
      { label: 'Post Engagements', value: formatNum(insights.pagePostEngagements), delta: 'last 28 days', icon: <ThumbsUp className="w-4 h-4" />, color: 'text-pink-600', bg: 'bg-pink-50' },
      { label: 'Page Views', value: formatNum(insights.pageViews), delta: 'last 28 days', icon: <BarChart2 className="w-4 h-4" />, color: 'text-orange-600', bg: 'bg-orange-50' },
      { label: 'Engagement Rate', value: `${insights.pageImpressions ? ((insights.pageEngagedUsers / insights.pageImpressions) * 100).toFixed(1) : '0.0'}%`, delta: 'of total reach', icon: <BarChart2 className="w-4 h-4" />, color: 'text-sky-600', bg: 'bg-sky-50' },
    ].map((stat) => (
      <div key={stat.label} className="bg-white border border-slate-200 rounded-2xl p-4 hover:shadow-md transition-all">
        <div className={`${stat.bg} ${stat.color} w-8 h-8 rounded-xl flex items-center justify-center mb-2`}>
          {stat.icon}
        </div>
        <p className="text-sm font-extrabold text-gray-400 uppercase tracking-widest leading-none mb-1">{stat.label}</p>
        <p className="text-xl font-black text-gray-900 font-mono">{stat.value}</p>
        <p className="text-xs text-gray-400 font-medium mt-0.5">{stat.delta}</p>
      </div>
    ))}
  </div>
);

const CommentItem: React.FC<{
  comment: FacebookComment;
  onReply: (id: string, text: string) => void | Promise<void>;
  onHide: (id: string, hidden: boolean) => void | Promise<void>;
  onDelete: (id: string) => void | Promise<void>;
}> = ({ comment, onReply, onHide, onDelete }) => {
  const [showReply, setShowReply] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [hidden, setHidden] = useState(false);
  const isSpam = comment.likeCount === 0 && comment.message.includes('!!!');

  const handleReply = () => {
    if (!replyText.trim()) return;
    void onReply(comment.id, replyText);
    setReplyText('');
    setShowReply(false);
  };

  return (
    <div className={`p-3 rounded-xl border transition-all ${hidden ? 'opacity-40 bg-gray-50 border-gray-100' : isSpam ? 'bg-red-50/50 border-red-100' : 'bg-[#fafaf9] border-slate-200'}`}>
      <div className="flex items-start gap-2.5">
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#0284c7] to-[#a78bfa] flex items-center justify-center text-white text-sm font-black flex-shrink-0">
          {comment.from.name.charAt(0)}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-bold text-gray-900">{comment.from.name}</span>
            <span className="text-xs text-gray-400 font-medium">{timeAgo(comment.createdTime)}</span>
            {isSpam && <span className="text-meta bg-red-100 text-red-600 px-1.5 py-0.5 rounded-full font-black">SPAM</span>}
            {hidden && <span className="text-meta bg-gray-200 text-gray-500 px-1.5 py-0.5 rounded-full font-black">HIDDEN</span>}
          </div>
          <p className="text-xs text-gray-700 mt-0.5 leading-relaxed">{comment.message}</p>

          <div className="flex items-center gap-3 mt-2">
            <span className="text-xs text-gray-400 font-medium flex items-center gap-1">
              <ThumbsUp className="w-3 h-3" /> {comment.likeCount}
            </span>
            <button
              type="button"
              onClick={() => setShowReply(!showReply)}
              className="text-xs text-sky-600 font-bold flex items-center gap-1 hover:underline"
            >
              <Reply className="w-3 h-3" /> Reply
            </button>
            {comment.canHide && (
              <button
                type="button"
                onClick={() => {
                  const next = !hidden;
                  setHidden(next);
                  void onHide(comment.id, next);
                }}
                className="text-xs text-gray-400 font-bold flex items-center gap-1 hover:text-gray-600"
              >
                <EyeOff className="w-3 h-3" /> {hidden ? 'Unhide' : 'Hide'}
              </button>
            )}
            {comment.canDelete && (
              <button
                type="button"
                onClick={() => onDelete(comment.id)}
                className="text-xs text-red-400 font-bold flex items-center gap-1 hover:text-red-600"
              >
                <Trash2 className="w-3 h-3" /> Delete
              </button>
            )}
          </div>

          {showReply && (
            <div className="flex gap-2 mt-2">
              <input
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleReply()}
                placeholder={`Reply to ${comment.from.name}...`}
                className="flex-1 text-xs border border-slate-200 rounded-xl px-3 py-2 outline-none focus:border-channel-green bg-white"
              />
              <button
                type="button"
                onClick={handleReply}
                className="bg-channel-green text-white p-2 rounded-xl hover:bg-[#4a3dd4] transition-all"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const PostCard: React.FC<{ post: FacebookPost }> = ({ post }) => {
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState<FacebookComment[]>([]);
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [commentsLoaded, setCommentsLoaded] = useState(false);

  useEffect(() => {
    if (!showComments || commentsLoaded) return;
    setCommentsLoading(true);
    api
      .getFacebookPostComments(post.id)
      .then((res) => {
        setComments(res.comments);
        setCommentsLoaded(true);
      })
      .catch(() => setComments([]))
      .finally(() => setCommentsLoading(false));
  }, [showComments, commentsLoaded, post.id]);

  const handleReply = async (commentId: string, text: string) => {
    await api.replyFacebookComment(commentId, text);
    const res = await api.getFacebookPostComments(post.id);
    setComments(res.comments);
  };

  const handleHide = async (commentId: string, hidden: boolean) => {
    await api.hideFacebookComment(commentId, hidden);
  };

  const handleDelete = async (commentId: string) => {
    await api.deleteFacebookComment(commentId);
    setComments((prev) => prev.filter((c) => c.id !== commentId));
  };

  return (
    <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden hover:border-channel-green/20 hover:shadow-lg transition-all">
      {post.fullPicture ? (
        <img src={post.fullPicture} alt="" className="w-full h-48 object-cover" />
      ) : (
        <div className="w-full h-32 bg-gradient-to-br from-sky-50 to-sky-50 flex items-center justify-center">
          <ImageIcon className="w-8 h-8 text-sky-600/30" />
        </div>
      )}

      <div className="p-4">
        <p className="text-sm text-gray-700 leading-relaxed line-clamp-3 mb-3">{post.message}</p>

        <div className="flex items-center justify-between mb-3">
          <span className="text-xs text-gray-400 font-medium">{timeAgo(post.createdTime)}</span>
          <a href={post.permalink} target="_blank" rel="noreferrer"
            className="text-xs text-sky-600 font-bold flex items-center gap-1 hover:underline">
            View on Facebook <ExternalLink className="w-3 h-3" />
          </a>
        </div>

        <div className="grid grid-cols-4 gap-2 mb-3">
          {[
            { icon: <ThumbsUp className="w-3.5 h-3.5" />, val: formatNum(post.likesCount), label: 'Likes' },
            { icon: <MessageSquare className="w-3.5 h-3.5" />, val: formatNum(post.commentsCount), label: 'Comments' },
            { icon: <Share2 className="w-3.5 h-3.5" />, val: formatNum(post.sharesCount), label: 'Shares' },
            { icon: <Eye className="w-3.5 h-3.5" />, val: post.reach ? formatNum(post.reach) : '—', label: 'Reach' },
          ].map((s) => (
            <div key={s.label} className="bg-[#fafaf9] border border-slate-200 rounded-xl p-2 text-center">
              <div className="flex justify-center text-gray-400 mb-1">{s.icon}</div>
              <p className="text-sm font-black text-gray-900 font-mono">{s.val}</p>
              <p className="text-meta text-gray-400 font-medium">{s.label}</p>
            </div>
          ))}
        </div>

        <button
          type="button"
          onClick={() => setShowComments(!showComments)}
          className="w-full flex items-center justify-between px-3 py-2 bg-[#fafaf9] border border-slate-200 rounded-xl text-sm font-bold text-gray-600 hover:bg-sky-50 hover:text-sky-600 hover:border-channel-green/20 transition-all"
        >
          <span className="flex items-center gap-1.5">
            <MessageSquare className="w-3.5 h-3.5" />
            {commentsLoaded ? comments.length : post.commentsCount} Comments
            {comments.some(c => c.likeCount === 0 && c.message.includes('!!!')) && (
              <span className="text-meta bg-red-100 text-red-500 px-1.5 rounded-full font-black">Spam</span>
            )}
          </span>
          {showComments ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </button>

        {showComments && (
          <div className="mt-3 space-y-2 max-h-64 overflow-y-auto pr-1">
            {commentsLoading ? (
              <p className="text-xs text-gray-400 text-center py-4">Loading comments…</p>
            ) : comments.length === 0 ? (
              <p className="text-xs text-gray-400 text-center py-4">No comments yet</p>
            ) : (
              comments.map((c) => (
                <CommentItem
                  key={c.id}
                  comment={c}
                  onReply={handleReply}
                  onHide={handleHide}
                  onDelete={handleDelete}
                />
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
};

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
      <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl border border-slate-200">
        <div className="flex items-center justify-between p-5 border-b border-slate-200">
          <h3 className="font-black text-gray-900 text-sm flex items-center gap-2">
            <Facebook className="w-4 h-4 text-[#0084FF]" /> Create Facebook Post
          </h3>
          <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-700 text-lg font-bold">×</button>
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
              className={`flex items-center gap-2 text-sm font-bold px-3 py-2 rounded-xl border transition-all ${scheduleMode ? 'bg-sky-50 border-channel-green/30 text-sky-600' : 'bg-[#fafaf9] border-slate-200 text-gray-500'}`}
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
          <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-bold text-gray-600 border border-slate-200 rounded-xl hover:bg-gray-50 transition-all">
            Cancel
          </button>
          <button
            type="button"
            onClick={() => {
              void onPost(message, scheduleMode && scheduledTime ? scheduledTime : undefined);
              onClose();
            }}
            disabled={!message.trim() || (scheduleMode && !scheduledTime)}
            className="px-5 py-2 bg-channel-green hover:bg-[#4a3dd4] disabled:bg-gray-200 disabled:cursor-not-allowed text-white text-sm font-bold rounded-xl transition-all flex items-center gap-2 shadow-md shadow-[#0284c7]/20"
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
  const [posts, setPosts] = useState<FacebookPost[]>([]);
  const [insights, setInsights] = useState<PageInsights | null>(null);
  const [insightsDaily, setInsightsDaily] = useState<PageInsightsDailyPoint[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [showCreatePost, setShowCreatePost] = useState(false);
  const [activeTab, setActiveTab] = useState<'posts' | 'insights'>('posts');
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [missingScopes, setMissingScopes] = useState<string[]>([]);

  const metaAppId = import.meta.env.VITE_META_APP_ID;
  const hasValidAppId = !!metaAppId && metaAppId !== 'your_meta_app_id_here';

  const loadPostsAndInsights = useCallback(async () => {
    setSyncing(true);
    setError(null);

    const [postsResult, insightsResult] = await Promise.allSettled([
      api.getFacebookPosts(),
      api.getFacebookInsights(),
    ]);

    const errors: string[] = [];

    if (postsResult.status === 'fulfilled') {
      setPosts(postsResult.value.posts);
    } else {
      errors.push(
        postsResult.reason instanceof Error
          ? postsResult.reason.message
          : 'Failed to load posts'
      );
    }

    if (insightsResult.status === 'fulfilled') {
      setInsights(insightsResult.value.insights);
      setInsightsDaily(insightsResult.value.daily ?? []);
    } else {
      errors.push(
        insightsResult.reason instanceof Error
          ? insightsResult.reason.message
          : 'Failed to load insights'
      );
    }

    if (errors.length > 0) {
      setError(errors.join(' · '));
    }

    setSyncing(false);
  }, []);

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
        await loadPostsAndInsights();
      } else {
        setIsConnected(false);
        setMissingScopes([]);
        setPage(null);
        setPosts([]);
        setInsights(null);
        setInsightsDaily([]);
      }
    } catch (err) {
      if (!options?.silent) {
        setError(err instanceof Error ? err.message : 'Failed to load Facebook Page status');
        setIsConnected(false);
      }
    } finally {
      if (!options?.silent) setLoading(false);
    }
  }, [loadPostsAndInsights]);

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
    if (!hasValidAppId) {
      setError('Meta App ID is missing. Set VITE_META_APP_ID in frontend/.env.');
      return;
    }

    setConnecting(true);
    setError(null);

    try {
      const oauth = await api.getFacebookOAuthState();
      const activeRedirectUri = oauth.redirectUri;
      if (!activeRedirectUri) {
        throw new Error('Missing redirect URI from server');
      }

      sessionStorage.setItem(FACEBOOK_OAUTH_REDIRECT_STORAGE_KEY, activeRedirectUri);

      const authUrl = buildMetaOAuthDialogUrl({
        clientId: metaAppId,
        redirectUri: activeRedirectUri,
        state: oauth.state,
        scope: FACEBOOK_PAGE_SCOPES,
        authType: isConnected || missingScopes.length > 0 ? 'rerequest' : undefined,
      });

      window.location.assign(authUrl);
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
      setPosts([]);
      setInsights(null);
      setInsightsDaily([]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to disconnect');
    }
  };

  const handleNewPost = async (message: string, scheduledTime?: string) => {
    await api.createFacebookPost(message, scheduledTime);
    await loadPostsAndInsights();
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
          <h3 className="font-sans font-black text-gray-900 text-lg leading-none">Facebook Page Manager</h3>
          <p className="text-xs text-gray-400 mt-1.5 font-medium">
            Manage posts, reply to comments, and track page performance — all from one place.
          </p>
        </div>
        {isConnected && (
          <button
            type="button"
            onClick={() => setShowCreatePost(true)}
            className="bg-channel-green hover:bg-[#4a3dd4] text-white px-4 py-2 rounded-xl flex items-center gap-1.5 text-sm font-bold transition-all active:scale-95 shadow-md shadow-[#0284c7]/20"
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
            Missing: {missingScopes.join(', ')}. Posts and insights need these permissions on your Page token.
          </p>
          <p>
            In Meta Developer App → App Review → Permissions and Features, enable{' '}
            <strong>pages_read_engagement</strong> and <strong>read_insights</strong> (Standard access for testing).
            Then disconnect and reconnect using a Facebook account that is App Admin/Developer/Tester.
          </p>
          <button
            type="button"
            onClick={() => void handleConnect()}
            className="px-3 py-1.5 bg-[#0084FF] text-white text-sm font-bold rounded-lg"
          >
            Reconnect with permissions
          </button>
        </div>
      )}

      {isConnected && page ? (
        <div className="bg-gradient-to-r from-blue-50 via-[#eef6ff] to-sky-50 border border-blue-100 p-5 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="p-3 bg-[#0084FF] text-white rounded-xl shadow-lg shadow-blue-200 shrink-0">
              <Facebook className="w-6 h-6 fill-white text-[#0084FF]" />
            </div>
            <div>
              <h4 className="font-bold text-gray-950 text-sm leading-none flex items-center gap-2">
                {page.name}
                <span className="w-2 h-2 rounded-full bg-green-400 inline-block" />
                <span className="text-xs text-green-600 font-black bg-green-50 px-2 rounded-full">Connected</span>
              </h4>
              <p className="text-xs text-gray-400 font-medium leading-normal mt-1.5">
                {page.category} • <strong className="text-gray-700">{formatNum(page.followersCount)} followers</strong> • Page ID: {page.id}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => void loadPostsAndInsights()}
              disabled={syncing}
              className="px-3 py-1.5 bg-white border border-slate-200 text-sm font-bold text-gray-600 rounded-xl hover:bg-gray-50 flex items-center gap-1.5 disabled:opacity-50"
            >
              <RefreshCw className={`w-3 h-3 ${syncing ? 'animate-spin' : ''}`} /> Sync
            </button>
            <button
              type="button"
              onClick={() => void handleDisconnect()}
              className="px-3 py-1.5 bg-white border border-slate-200 text-sm font-bold text-red-500 rounded-xl hover:bg-red-50 hover:border-red-200"
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
                Connect your Facebook Page to manage posts, reply to comments, and view insights.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => void handleConnect()}
            disabled={connecting}
            className="px-4 py-2 bg-[#0084FF] hover:bg-[#0071d4] disabled:opacity-60 text-white text-sm font-bold rounded-xl shadow-md transition-all whitespace-nowrap flex items-center gap-2"
          >
            <Facebook className="w-4 h-4 fill-white" />
            {connecting ? 'Redirecting…' : 'Connect Facebook Page'}
          </button>
        </div>
      )}

      {isConnected && page && (
        <>
          {insights && <InsightsBar insights={insights} />}

          <div className="flex border-b border-slate-200 select-none">
            {(['posts', 'insights'] as const).map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2 text-sm font-bold transition-all border-b-2 mr-3 capitalize ${
                  activeTab === tab
                    ? 'text-sky-600 border-channel-green font-black'
                    : 'text-gray-400 hover:text-gray-700 border-transparent'
                }`}
              >
                {tab === 'posts' ? `Posts (${posts.length})` : 'Insights & Analytics'}
              </button>
            ))}
          </div>

          {activeTab === 'posts' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {posts.length === 0 ? (
                <div className="col-span-full bg-white border border-slate-200 rounded-2xl p-8 text-center">
                  <p className="text-sm font-bold text-gray-600">No posts yet</p>
                  <p className="text-xs text-gray-400 mt-1">Create your first post or sync from Facebook</p>
                </div>
              ) : (
                posts.map((post) => (
                  <PostCard key={post.id} post={post} />
                ))
              )}
            </div>
          )}

          {activeTab === 'insights' && insights && (
            <FacebookInsightsCharts
              insights={insights}
              daily={insightsDaily}
              posts={posts}
            />
          )}

          {activeTab === 'insights' && !insights && (
            <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center">
              <BarChart2 className="w-10 h-10 text-sky-600/30 mx-auto mb-3" />
              <p className="text-sm font-bold text-gray-600">Insights unavailable</p>
              <p className="text-xs text-gray-400 mt-1">
                Grant read_insights permission and sync to load charts
              </p>
            </div>
          )}
        </>
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
