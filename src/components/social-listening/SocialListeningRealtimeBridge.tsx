/**
 * Live Social Listening comment toast (webhook → socket).
 * Top of viewport, auto-dismiss after 5s. Skipped when that post is already open.
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'motion/react';
import { Facebook, Instagram, X } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { getSocket } from '../../lib/socket';
import { slKeys } from './hooks/useSocialListeningQueries';

const TOAST_MS = 5_000;

type SocialCommentSocketPayload = {
  platform?: 'instagram' | 'facebook';
  postId?: string;
  commentId?: string;
  socialCommentId?: string | null;
  username?: string | null;
  text?: string | null;
};

type CommentToast = {
  id: string;
  postId: string;
  platform: 'instagram' | 'facebook';
  username: string;
  preview: string;
};

function viewingMediaId(pathname: string): string | null {
  const parts = pathname.replace(/\/$/, '').split('/').filter(Boolean);
  if (parts[0] === 'social-listening' && parts[1] === 'media' && parts[2]) {
    try {
      return decodeURIComponent(parts[2]);
    } catch {
      return parts[2];
    }
  }
  return null;
}

function clip(s: string, max = 72): string {
  const t = s.trim();
  if (t.length <= max) return t;
  return `${t.slice(0, max - 1)}…`;
}

export function SocialListeningRealtimeBridge() {
  const qc = useQueryClient();
  const navigate = useNavigate();
  const location = useLocation();
  const viewingPostRef = useRef<string | null>(null);
  const toastTimerRef = useRef<number | null>(null);
  const [toast, setToast] = useState<CommentToast | null>(null);

  useEffect(() => {
    viewingPostRef.current = viewingMediaId(location.pathname);
  }, [location.pathname]);

  const showToast = useCallback((next: CommentToast) => {
    setToast(next);
    if (toastTimerRef.current) window.clearTimeout(toastTimerRef.current);
    toastTimerRef.current = window.setTimeout(() => {
      setToast(null);
      toastTimerRef.current = null;
    }, TOAST_MS);
  }, []);

  useEffect(() => {
    const socket = getSocket();
    const onSocialComment = (payload: SocialCommentSocketPayload) => {
      void qc.invalidateQueries({ queryKey: slKeys.all });
      if (payload.postId) {
        void qc.invalidateQueries({
          queryKey: [...slKeys.all, 'media-comments', payload.postId],
        });
      }

      const postId = payload.postId?.trim();
      if (!postId) return;
      if (viewingPostRef.current && viewingPostRef.current === postId) return;

      const platform = payload.platform === 'facebook' ? 'facebook' : 'instagram';
      const username = (payload.username || `${platform}_user`).replace(/^@/, '');
      const preview = clip(
        payload.text || (platform === 'facebook' ? 'New Facebook comment' : 'New Instagram comment')
      );
      showToast({
        id: `${payload.commentId || postId}-${Date.now()}`,
        postId,
        platform,
        username,
        preview,
      });
    };
    socket.on('social_comment', onSocialComment);
    return () => {
      socket.off('social_comment', onSocialComment);
    };
  }, [qc, showToast]);

  useEffect(
    () => () => {
      if (toastTimerRef.current) window.clearTimeout(toastTimerRef.current);
    },
    []
  );

  const openPost = (postId: string) => {
    setToast(null);
    navigate(`/social-listening/media/${encodeURIComponent(postId)}`);
  };

  return (
    <AnimatePresence>
      {toast && (
        <motion.div
          key={toast.id}
          initial={{ opacity: 0, y: -12, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -8, scale: 0.98 }}
          transition={{ duration: 0.18 }}
          className="fixed left-1/2 top-4 z-[200] w-[min(100vw-1.5rem,22rem)] -translate-x-1/2"
        >
          <div
            role="status"
            className="relative overflow-hidden rounded-xl border border-slate-200/90 bg-white text-gray-900 shadow-lg shadow-slate-900/10"
          >
            <button
              type="button"
              onClick={() => openPost(toast.postId)}
              className={`w-full px-3 py-2.5 pr-9 text-left transition-colors ${
                toast.platform === 'facebook' ? 'hover:bg-[#e8f4ff]/50' : 'hover:bg-[#fce8f0]/50'
              }`}
            >
              <div className="flex min-w-0 items-center gap-2.5">
                {toast.platform === 'facebook' ? (
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-[#1877F2]/20 bg-[#e8f4ff] text-[#1877F2]">
                    <Facebook className="h-3.5 w-3.5" />
                  </div>
                ) : (
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-[#E1306C]/20 bg-[#fce8f0] text-[#C13584]">
                    <Instagram className="h-3.5 w-3.5" />
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline justify-between gap-2">
                    <p className="truncate text-sm font-bold text-gray-900">
                      @{toast.username}
                    </p>
                    <span
                      className={`shrink-0 text-[10px] font-bold uppercase tracking-wide ${
                        toast.platform === 'facebook' ? 'text-[#1877F2]' : 'text-[#C13584]'
                      }`}
                    >
                      Comment
                    </span>
                  </div>
                  <p className="mt-0.5 truncate text-xs leading-snug text-gray-500">
                    {toast.preview}
                  </p>
                </div>
              </div>
            </button>
            <button
              type="button"
              onClick={() => setToast(null)}
              className="absolute right-1.5 top-1.5 rounded-md p-1 text-gray-400 transition-colors hover:bg-slate-100 hover:text-gray-700"
              aria-label="Dismiss notification"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
