// FILE: src/components/pro-tools/ToolCommentSection.tsx
'use client';
import { useState } from 'react';
import { useSession } from 'next-auth/react';
import type { SeedComment } from '@/lib/seedComments';

interface Props {
  seedComments: SeedComment[];
  onRequireAuth: () => void;
  glow: string;
}

interface LiveComment extends SeedComment { liked: boolean }

const PAGE_SIZE = 3;

export function ToolCommentSection({ seedComments, onRequireAuth, glow }: Props) {
  const { data: session } = useSession();
  const [comments, setComments] = useState<LiveComment[]>(seedComments.map(c => ({ ...c, liked: false })));
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [draft, setDraft] = useState('');

  const visible = comments.slice(0, visibleCount);
  const hasMore = visibleCount < comments.length;

  function toggleLike(id: string) {
    if (!session) { onRequireAuth(); return; }
    setComments(prev => prev.map(c => c.id === id
      ? { ...c, liked: !c.liked, likes: c.liked ? c.likes - 1 : c.likes + 1 }
      : c));
  }

  function submitComment() {
    if (!session) { onRequireAuth(); return; }
    if (!draft.trim()) return;
    const newComment: LiveComment = {
      id: `local-${Date.now()}`,
      author: session.user?.name?.split(' ')[0] ?? session.user?.email?.split('@')[0] ?? 'You',
      avatarColor: '83, 74, 217',
      text: draft.trim(),
      likes: 0,
      liked: false,
      timeAgo: 'just now',
    };
    setComments(prev => [newComment, ...prev]);
    setDraft('');
    setVisibleCount(v => v + 1);
  }

  return (
    <div id="comments-section" className="mt-8">
      <p className="text-headline mb-3">💬 Comments ({comments.length})</p>

      <div className="ios-card-nested p-3 mb-5 flex gap-2 items-start">
        <textarea
          value={draft}
          onChange={e => setDraft(e.target.value)}
          onFocus={() => { if (!session) onRequireAuth(); }}
          placeholder={session ? 'Share your budgeting tip…' : 'Sign up to leave a comment'}
          rows={2}
          className="flex-1 bg-transparent outline-none text-footnote resize-none"
          style={{ color: 'var(--text-primary)' }}
        />
        <button onClick={submitComment} className="btn-filled press text-xs px-4 py-2 flex-shrink-0">Post</button>
      </div>

      <div className="flex flex-col gap-3">
        {visible.map((c, i) => (
          <div key={c.id} className="ios-card-nested p-4 anim-fade-up" style={{ animationDelay: `${(i % PAGE_SIZE) * 90}ms` }}>
            <div className="flex items-start gap-3">
              <span className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                style={{ background: `rgb(${c.avatarColor})` }}>
                {c.author[0].toUpperCase()}
              </span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-footnote font-bold">{c.author}</span>
                  <span className="text-caption">{c.timeAgo}</span>
                </div>
                <p className="text-footnote mt-0.5" style={{ color: 'var(--text-secondary)' }}>{c.text}</p>
                <button onClick={() => toggleLike(c.id)} className="press flex items-center gap-1 mt-2 text-caption font-semibold"
                  style={{ color: c.liked ? `rgb(${glow})` : 'var(--text-tertiary)' }}>
                  <span style={{ transform: c.liked ? 'scale(1.15)' : 'scale(1)', display: 'inline-block', transition: 'transform 0.2s' }}>
                    {c.liked ? '❤️' : '🤍'}
                  </span>
                  {c.likes}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {hasMore && (
        <button
          onClick={() => setVisibleCount(v => Math.min(v + PAGE_SIZE, comments.length))}
          className="ios-card-nested press w-full mt-4 py-2.5 text-footnote font-semibold text-center"
        >
          Load more comments ({comments.length - visibleCount} left)
        </button>
      )}
    </div>
  );
}
