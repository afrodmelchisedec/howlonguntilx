'use client';
import { useState } from 'react';
import { UserSummaryCard } from './UserSummaryCard';

export interface CommentNode {
  id: string;
  body: string;
  createdAt: string;
  likeCount: number;
  liked: boolean;
  authorId: string;
  author: { id: string; name: string | null; username: string | null; image: string | null } | null;
  deletedAt: string | null;
  replies: CommentNode[];
}

interface Props {
  node: CommentNode;
  glow: string;
  currentUserId?: string;
  isAdmin: boolean;
  openReplyId: string | null;
  setOpenReplyId: (id: string | null) => void;
  onToggleLike: (id: string) => void;
  onReply: (parentId: string, body: string) => Promise<void>;
  onDelete: (id: string) => void;
}

export function formatCount(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1).replace(/\.0$/, '') + 'M';
  if (n >= 1_000) return (n / 1_000).toFixed(1).replace(/\.0$/, '') + 'K';
  return String(n);
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

// Collects every descendant of a root comment (replies, and replies-to-
// replies) into one flat, chronologically-sorted list. Actual DB threading
// (parentId) is preserved per-comment when replying — this only flattens
// the DISPLAY, matching the reference design's "See N Replies" bucket
// instead of recursively nested boxes.
function flattenReplies(node: CommentNode): CommentNode[] {
  const out: CommentNode[] = [];
  function walk(n: CommentNode) {
    for (const r of n.replies) {
      const isRemoved = Boolean(r.deletedAt) || !r.author;
      if (!isRemoved) out.push(r);
      walk(r); // keep recursing regardless — a real reply nested under a
               // deleted/blocked one still needs to surface in the bucket
    }
  }
  walk(node);
  return out.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
}

function initials(name: string | null) {
  return (name?.[0] ?? '?').toUpperCase();
}

function Avatar({ node, glow, size }: { node: CommentNode; glow: string; size: number }) {
  const isDeleted = Boolean(node.deletedAt) || !node.author;
  const px = size + 'px';
  if (isDeleted) {
    return (
      <span className="rounded-full flex items-center justify-center text-xs flex-shrink-0"
        style={{ width: px, height: px, background: 'var(--fill-secondary)', color: 'var(--text-tertiary)' }}>
        —
      </span>
    );
  }
  const avatar = node.author!.image ? (
    <img src={node.author!.image} className="rounded-full flex-shrink-0 object-cover" style={{ width: px, height: px }} alt="" />
  ) : (
    <span className="rounded-full flex items-center justify-center text-white font-bold flex-shrink-0"
      style={{ width: px, height: px, fontSize: size * 0.4, background: `rgb(${glow})` }}>
      {initials(node.author!.name)}
    </span>
  );
  return <UserSummaryCard user={node.author!}>{avatar}</UserSummaryCard>;
}

function CommentRow({
  node, glow, currentUserId, isAdmin, openReplyId, setOpenReplyId, onToggleLike, onReply, onDelete, indent,
}: Props & { indent: boolean }) {
  const isOwn = currentUserId && node.authorId === currentUserId;
  const canDelete = Boolean(isOwn || isAdmin);
  const isDeleted = Boolean(node.deletedAt) || !node.author;
  const replyOpen = openReplyId === node.id;
  const [menuOpen, setMenuOpen] = useState(false);

  async function handleReplySubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const textarea = form.elements.namedItem('reply') as HTMLTextAreaElement;
    const body = textarea.value.trim();
    if (!body) return;
    await onReply(node.id, body);
    textarea.value = '';
    setOpenReplyId(null);
  }

  return (
    <div className="flex gap-3 py-3" style={indent ? { marginLeft: 44 } : undefined}>
      <Avatar node={node} glow={glow} size={indent ? 28 : 36} />
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            {isDeleted || !node.author ? (
              <span className="text-sm font-semibold" style={{ color: 'var(--text-tertiary)' }}>Deleted</span>
            ) : (
              <UserSummaryCard user={node.author}>
                <span className="text-sm font-semibold" style={{ cursor: 'pointer', color: 'var(--text-primary)' }}>
                  {node.author.name ?? 'Someone'}
                </span>
              </UserSummaryCard>
            )}
            <span className="text-xs ml-2" style={{ color: 'var(--text-tertiary)' }}>{formatDate(node.createdAt)}</span>
          </div>
          {!isDeleted && canDelete && (
            <div className="relative flex-shrink-0">
              <button onClick={() => setMenuOpen(v => !v)} className="press text-sm px-1" style={{ color: 'var(--text-tertiary)' }} aria-label="More">⋯</button>
              {menuOpen && (
                <div className="ios-card absolute right-0 top-full mt-1 z-20 overflow-hidden" style={{ minWidth: 100 }}>
                  <button onClick={() => { setMenuOpen(false); onDelete(node.id); }}
                    className="press w-full text-left px-3 py-2 text-xs font-medium" style={{ color: 'rgb(var(--accent-red))' }}>
                    Delete
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        <p className="text-sm mt-1" style={{ color: isDeleted ? 'var(--text-tertiary)' : 'var(--text-secondary)', fontStyle: isDeleted ? 'italic' : undefined, textAlign: 'left' }}>
          {node.body}
        </p>

        {!isDeleted && (
          <div className="flex items-center gap-4 mt-2">
            <button onClick={() => onToggleLike(node.id)} className="press flex items-center gap-1 text-xs font-semibold"
              style={{ color: node.liked ? `rgb(${glow})` : 'var(--text-tertiary)' }}>
              <span style={{ transform: node.liked ? 'scale(1.15)' : 'scale(1)', display: 'inline-block', transition: 'transform 0.2s' }}>
                {node.liked ? '❤️' : '🤍'}
              </span>
              {formatCount(node.likeCount)}
            </button>
            <button onClick={() => setOpenReplyId(replyOpen ? null : node.id)} className="press text-xs font-semibold" style={{ color: 'var(--text-tertiary)' }}>
              Reply
            </button>
          </div>
        )}

        {replyOpen && (
          <form onSubmit={handleReplySubmit} className="ios-card-nested p-2 mt-3 flex gap-2 items-start">
            <textarea name="reply" autoFocus placeholder="Write a reply…" rows={2}
              className="flex-1 bg-transparent outline-none text-sm resize-none" style={{ color: 'var(--text-primary)' }} />
            <button type="submit" className="btn-filled press text-xs px-3 py-2 flex-shrink-0">Reply</button>
          </form>
        )}
      </div>
    </div>
  );
}

export function Comment(props: Props) {
  const { node } = props;
  const [expanded, setExpanded] = useState(false);
  const flatReplies = flattenReplies(node);

  return (
    <div className="anim-fade-up" style={{ borderBottom: '1px solid var(--border-hairline)' }}>
      <CommentRow {...props} indent={false} />
      {flatReplies.length > 0 && (
        <div style={{ marginLeft: 44 }} className="pb-2">
          {!expanded ? (
            <button onClick={() => setExpanded(true)} className="press text-xs font-semibold flex items-center gap-1.5"
              style={{ color: `rgb(${props.glow})` }}>
              <span style={{ width: 24, height: 1, background: 'var(--border-hairline)', display: 'inline-block' }} />
              See {formatCount(flatReplies.length)} {flatReplies.length === 1 ? 'reply' : 'replies'}
            </button>
          ) : (
            <>
              {flatReplies.map(r => (
                <CommentRow key={r.id} {...props} node={r} indent />
              ))}
              <button onClick={() => setExpanded(false)} className="press text-xs font-semibold"
                style={{ color: 'var(--text-tertiary)' }}>
                Hide replies
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
