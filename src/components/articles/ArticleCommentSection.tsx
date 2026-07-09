// FILE: src/components/articles/ArticleCommentSection.tsx
'use client';
import { useSession } from 'next-auth/react';
import { ToolCommentSection } from '@/components/pro-tools/ToolCommentSection';

export function ArticleCommentSection({ glow }: { glow: string }) {
  const { data: session } = useSession();

  function requireAuth(): boolean {
    return Boolean(session?.user);
  }

  return <ToolCommentSection seedComments={[]} onRequireAuth={requireAuth} glow={glow} />;
}
