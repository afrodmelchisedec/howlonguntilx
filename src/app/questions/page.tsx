// FILE: src/app/questions/page.tsx
import { getQuestionsFeed, getQuestionsCategories } from '@/lib/questionsFeed';
import { QuestionsFeedClient } from '@/components/questions/QuestionsFeedClient';
import { StarField } from '@/components/ui/StarField';

export const metadata = {
  title: 'Questions — HowLongUntilX',
  description: `Browse every "How long until…?" article and live countdown on the site, organized by category.`,
};

// Server-rendered so the default (no category filter) page of results is
// already in the initial HTML — same lesson as community/page.tsx: the
// browser can start requesting the first card's image immediately instead
// of waiting on a full JS-download-hydrate-then-fetch waterfall.
export default async function QuestionsPage() {
  const [{ items, nextCursor }, categories] = await Promise.all([
    getQuestionsFeed({}),
    getQuestionsCategories(),
  ]);

  return (
    <div className="relative" style={{ background: 'var(--bg-base)' }}>
      <StarField />
      <div className="relative z-10">
        <QuestionsFeedClient
          initialItems={items}
          initialCursor={nextCursor}
          initialCategories={categories}
        />
      </div>
    </div>
  );
}
