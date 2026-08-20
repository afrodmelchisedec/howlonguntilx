// FILE: src/components/community/CommentThread.tsx
'use client';
import { useEffect, useState, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Comment, type CommentNode, formatCount } from './Comment';

interface FlatComment {
  id: string;
  body: string;
  createdAt: string;
  likeCount: number;
  liked: boolean;
  authorId: string;
  parentId: string | null;
  author: { id: string; name: string | null; username: string | null; image: string | null } | null;
  deletedAt: string | null;
}

interface Props {
  subjectType: 'article' | 'event' | 'userEvent' | 'tool';
  subjectId: string;
  glow: string;
}

function buildTree(flat: FlatComment[]): CommentNode[] {
  const byId = new Map<string, CommentNode>();
  flat.forEach(c => byId.set(c.id, { ...c, replies: [] }));
  const roots: CommentNode[] = [];
  flat.forEach(c => {
    const node = byId.get(c.id)!;
    if (c.parentId && byId.has(c.parentId)) {
      byId.get(c.parentId)!.replies.push(node);
    } else {
      roots.push(node);
    }
  });
  return roots;
}

export function CommentThread({ subjectType, subjectId, glow }: Props) {
  const { data: session } = useSession();
  const router = useRouter();
  const isAdmin = session?.user?.role === 'ADMIN';

  const [flat, setFlat] = useState<FlatComment[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(false);
  const [draft, setDraft] = useState('');
  const [openReplyId, setOpenReplyId] = useState<string | null>(null);
  const [posting, setPosting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/comments?subjectType=${subjectType}&subjectId=${subjectId}`);
      const data = await res.json().catch(() => ({ comments: [] }));
      setFlat(data.comments ?? []);
    } finally {
      setLoading(false);
    }
  }, [subjectType, subjectId]);

  useEffect(() => { load(); }, [load]);

  function requireAuth() {
    router.push(`/auth/signin?callbackUrl=${encodeURIComponent(window.location.pathname)}`);
  }

  async function postComment(body: string, parentId?: string) {
    if (!session) { requireAuth(); return; }
    if (!body.trim()) return;
    setPosting(true);
    try {
      const res = await fetch('/api/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subjectType, subjectId, parentId, body: body.trim() }),
      });
      if (!res.ok) return;
      const created = await res.json();
      setFlat(prev => [...prev, { ...created, liked: false }]);
    } finally {
      setPosting(false);
    }
  }

  async function handleTopLevelSubmit(e: React.FormEvent) {
    e.preventDefault();
    await postComment(draft);
    setDraft('');
  }

  async function toggleLike(id: string) {
    if (!session) { requireAuth(); return; }
    setFlat(prev => prev.map(c => c.id === id
      ? { ...c, liked: !c.liked, likeCount: c.liked ? c.likeCount - 1 : c.likeCount + 1 }
      : c));
    try {
      const res = await fetch(`/api/comments/${id}/like`, { method: 'POST' });
      if (!res.ok) throw new Error();
      const data = await res.json();
      setFlat(prev => prev.map(c => c.id === id ? { ...c, liked: data.liked, likeCount: data.likeCount } : c));
    } catch {
      setFlat(prev => prev.map(c => c.id === id
        ? { ...c, liked: !c.liked, likeCount: c.liked ? c.likeCount - 1 : c.likeCount + 1 }
        : c));
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this comment?')) return;
    const res = await fetch(`/api/comments/${id}`, { method: 'PATCH' });
    if (!res.ok) return;
    setFlat(prev => prev.map(c => c.id === id
      ? { ...c, body: '[deleted]', author: null, deletedAt: new Date().toISOString() }
      : c));
  }

  const tree = buildTree(flat);
  const total = flat.length;

  if (loading) {
    return <div className="mt-8 text-caption" style={{ color: 'var(--text-tertiary)' }}>Loading comments…</div>;
  }

  return (
    <div id="comments-section" className="mt-8">
      {!expanded && (
        <button
          onClick={() => setExpanded(true)}
          className="ios-card-nested press w-full py-3 text-footnote font-semibold text-center"
        >
          💬 Show comments ({total})
        </button>
      )}
      {expanded && (
        <>
          <p className="text-headline mb-3">💬 Comments ({total})</p>

          <form onSubmit={handleTopLevelSubmit} className="ios-card-nested p-3 mb-5 flex gap-2 items-start">
            <textarea
              value={draft}
              onChange={e => setDraft(e.target.value)}
              onFocus={() => { if (!session) requireAuth(); }}
              placeholder={session ? 'Share your thoughts…' : 'Sign in to leave a comment'}
              rows={2}
              className="flex-1 bg-transparent outline-none text-footnote resize-none"
              style={{ color: 'var(--text-primary)' }}
            />
            <button type="submit" disabled={posting} className="btn-filled press text-xs px-4 py-2 flex-shrink-0 disabled:opacity-50">
              Post
            </button>
          </form>

          {tree.length === 0 ? (
            <p className="text-footnote text-center py-6" style={{ color: 'var(--text-tertiary)' }}>
              No comments yet — be the first to say something.
            </p>
          ) : (
            <div className="flex flex-col gap-3 sg">
              {tree.map(node => (
                <Comment
                  key={node.id}
                  node={node}
                  glow={glow}
                  currentUserId={session?.user?.id}
                  isAdmin={isAdmin}
                  openReplyId={openReplyId}
                  setOpenReplyId={setOpenReplyId}
                  onToggleLike={toggleLike}
                  onReply={(parentId, body) => postComment(body, parentId)}
                  onDelete={handleDelete}
                />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
