import React from 'react';
import { Link } from 'react-router-dom';
import { Image as ImageIcon } from 'lucide-react';

export function TopPostsTable({
  posts,
  loading,
}: {
  posts: Array<{
    postId: string;
    commentCount: number;
    leadCount: number;
    postThumbnailUrl: string;
    postCaption: string;
  }> | null;
  loading: boolean;
}) {
  return (
    <div className="rounded-xl bg-white ring-1 ring-slate-200/80 p-5">
      <div className="mb-3">
        <h2 className="text-sm font-bold text-neutral-900">Top posts</h2>
        <p className="text-xs text-neutral-500">Ranked by comment volume in range</p>
      </div>

      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-12 animate-pulse rounded-lg bg-slate-100" />
          ))}
        </div>
      ) : !posts?.length ? (
        <p className="py-6 text-center text-xs font-medium text-gray-400">
          No post activity in this range yet.
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[480px] text-left text-xs">
            <thead>
              <tr className="border-b border-black/5 text-[10px] font-bold uppercase tracking-wide text-neutral-400">
                <th className="pb-2 pr-3 font-bold">Post</th>
                <th className="pb-2 pr-3 font-bold">Comments</th>
                <th className="pb-2 pr-3 font-bold">Leads</th>
                <th className="pb-2 font-bold" />
              </tr>
            </thead>
            <tbody>
              {posts.map((p) => (
                <tr key={p.postId} className="border-b border-black/5 last:border-b-0">
                  <td className="py-2.5 pr-3">
                    <div className="flex items-center gap-2.5">
                      {p.postThumbnailUrl ? (
                        <img
                          src={p.postThumbnailUrl}
                          alt=""
                          className="h-9 w-9 rounded-lg object-cover border border-black/5"
                        />
                      ) : (
                        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100 text-slate-400">
                          <ImageIcon className="h-4 w-4" />
                        </div>
                      )}
                      <p className="line-clamp-2 max-w-[240px] font-medium text-gray-800">
                        {p.postCaption || 'Untitled post'}
                      </p>
                    </div>
                  </td>
                  <td className="py-2.5 pr-3 tabular-nums font-bold text-gray-900">
                    {p.commentCount}
                  </td>
                  <td className="py-2.5 pr-3 tabular-nums font-bold text-gray-900">
                    {p.leadCount}
                  </td>
                  <td className="py-2.5 text-right">
                    <Link
                      to={`/social-listening/media/${encodeURIComponent(p.postId)}`}
                      className="font-bold text-primary hover:underline"
                    >
                      Open →
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
