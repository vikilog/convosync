import React from 'react';
import { Link } from 'react-router-dom';
import { Image as ImageIcon } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../ui/table';

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
    <div className="bg-white border border-swiss-line p-5">
      <div className="mb-3">
        <h2 className="text-sm font-bold text-swiss-ink">Top posts</h2>
        <p className="text-xs text-swiss-muted">Ranked by comment volume in range</p>
      </div>

      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-12 animate-pulse rounded-lg bg-slate-100" />
          ))}
        </div>
      ) : !posts?.length ? (
        <p className="py-6 text-center text-xs font-medium text-swiss-faint">
          No post activity in this range yet.
        </p>
      ) : (
        <Table className="min-w-[480px] text-left text-xs">
            <TableHeader>
              <TableRow className="border-b border-swiss-line text-[10px] font-bold uppercase tracking-wide text-swiss-faint">
                <TableHead className="pb-2 pr-3 font-bold whitespace-normal">Post</TableHead>
                <TableHead className="pb-2 pr-3 font-bold whitespace-normal">Comments</TableHead>
                <TableHead className="pb-2 pr-3 font-bold whitespace-normal">Leads</TableHead>
                <TableHead className="pb-2 font-bold whitespace-normal" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {posts.map((p) => (
                <TableRow key={p.postId} className="border-b border-swiss-line last:border-b-0">
                  <TableCell className="py-2.5 pr-3 whitespace-normal">
                    <div className="flex items-center gap-2.5">
                      {p.postThumbnailUrl ? (
                        <img
                          src={p.postThumbnailUrl}
                          alt=""
                          className="h-9 w-9 rounded-lg object-cover border border-swiss-line"
                        />
                      ) : (
                        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100 text-slate-400">
                          <ImageIcon className="h-4 w-4" />
                        </div>
                      )}
                      <p className="line-clamp-2 max-w-[240px] font-medium text-swiss-ink">
                        {p.postCaption || 'Untitled post'}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell className="py-2.5 pr-3 tabular-nums font-bold text-swiss-ink">
                    {p.commentCount}
                  </TableCell>
                  <TableCell className="py-2.5 pr-3 tabular-nums font-bold text-swiss-ink">
                    {p.leadCount}
                  </TableCell>
                  <TableCell className="py-2.5 text-right">
                    <Link
                      to={`/social-listening/media/${encodeURIComponent(p.postId)}`}
                      className="font-bold text-swiss-accent hover:underline"
                    >
                      Open →
                    </Link>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
      )}
    </div>
  );
}
