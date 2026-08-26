// FILE: src/app/admin/AdminClient.tsx
'use client';
import { useState, Fragment } from 'react';
import { useToast, ToastHost } from '@/components/ui/Toast';
import { useTheme } from '@/components/ui/ThemeProvider';
import { CategoriesManager } from '@/components/admin/CategoriesManager';
import { AffiliateBannersManager } from '@/components/admin/AffiliateBannersManager';
import { LeadMagnetManager } from '@/components/admin/LeadMagnetManager';
import { ReviewersManager } from '@/components/admin/ReviewersManager';
import { CalendarEventsManager } from '@/components/admin/CalendarEventsManager';
import { UserEventsModerationManager } from '@/components/admin/UserEventsModerationManager';
import { DefaultFollowConfigManager } from '@/components/admin/DefaultFollowConfigManager';
import { CommentsModerationManager } from '@/components/admin/CommentsModerationManager';
import SubscribersPanel from './SubscribersPanel';
import ApiUsersPanel from './ApiUsersPanel';
import LifeExpectancyPanel from './LifeExpectancyPanel';
import { hasInternalLink } from '@/components/articles/ArticleBlocks';
import { PersonalOverviewPanel } from '@/components/admin/PersonalOverviewPanel';
import { MyEventsPanel } from '@/components/admin/MyEventsPanel';
import { WorldPanel } from '@/components/premium/panels/WorldPanel';

interface User {
  id: string; name: string | null; email: string | null;
  emailVerified: Date | null; plan: string; role: string;
  createdAt: Date; lastSeen: Date | null; blockedAt: Date | null;
  _count: { timers: number; sessions: number };
}
interface ReviewerRow { id: string; slug: string; name: string; credentials: string | null; active: boolean }
interface ReviewRow {
  id: string;
  rating: number;
  title: string | null;
  comment: string | null;
  userId: string | null;
  createdAt: Date;
  updatedAt: Date;
}
interface EventRow {
  id: string; slug: string; name: string; views: number; targetDate: Date;
  categoryId: string | null; subcategoryId: string | null;
  category: CategoryRow | null; subcategory: CategoryRow | null;
  heroImageUrl?: string | null;
  heroImageAlt?: string | null;
  authorName?: string | null;
  reviewerName?: string | null;
  reviewerCredentials?: string | null;
  reviewerId?: string | null;
  reviewEnabled?: boolean;
  published: boolean;
  publishedAt?: Date | null;
  content?: any;
  updatedAt?: Date;
}
interface CategoryRow { id: string; slug: string; name: string; emoji: string; parentId: string | null }
interface ArticleRow {
  id: string; slug: string; title: string; status: string;
  categoryId: string | null; subcategoryId: string | null;
  category: CategoryRow | null; subcategory: CategoryRow | null;
  updatedAt: Date; publishedAt: Date | null;
  dek?: string | null;
  blocks?: any;
  heroData?: any;
  questionType?: string | null;
  heroImageUrl?: string | null;
  heroImageAlt?: string | null;
  reviewerId?: string | null;
  reviewEnabled?: boolean;
}
interface Stats {
  totalUsers: number; verifiedUsers: number; unverifiedUsers: number;
  proUsers: number; freeUsers: number; totalTimers: number; totalEvents: number; totalViews: number;
}
type Tab = 'overview' | 'myEvents' | 'worldEvents' | 'users' | 'subscribers' | 'apiUsers' | 'longevity' | 'events' | 'articles' | 'categories' | 'affiliateBanners' | 'leadMagnet' | 'reviewers' | 'calendarEvents' | 'userEvents' | 'comments' | 'defaultFollow' | 'reviews';

const STAT_COLORS: Record<string, string> = {
  totalUsers: '#534AB7', verifiedUsers: '#1D9E75', unverifiedUsers: '#D85A30',
  proUsers: '#BA7517', freeUsers: '#378ADD', totalTimers: '#D4537E',
  totalEvents: '#639922', totalViews: '#534AB7',
};

const TAB_ICONS: Record<Tab, string> = {
  defaultFollow: '📌',
  userEvents: '🌍', comments: '💬',
  overview: '📊', myEvents: '📅', worldEvents: '🌍', users: '👥', subscribers: '💳', apiUsers: '🔑', longevity: '⏳', events: '📅', articles: '📝', categories: '🗂️', affiliateBanners: '🔗', leadMagnet: '🎁', reviewers: '🩺',
  calendarEvents: '🗓️', reviews: '⭐',
};
const TAB_LABELS: Record<Tab, string> = {
  defaultFollow: 'Default Follow',
  overview: 'overview', myEvents: 'my events', worldEvents: 'world events', users: 'users', subscribers: 'subscribers', apiUsers: 'API users', longevity: 'longevity', events: 'events', articles: 'articles', categories: 'categories', affiliateBanners: 'Affiliate Banners', leadMagnet: 'Lead Magnet', reviewers: 'Reviewers',
  calendarEvents: 'Calendar Events', reviews: 'Reviews',
  userEvents: 'Community events', comments: 'Comments',
};

// Single source of truth for who can see each tab. Explicit listing (not a
// blocklist/allowlist inferred from naming) so nothing admin-only is ever
// exposed by omission. requiresPremium is a visual PRO-badge marker only —
// mirrors the old PremiumSidebar PRO array behavior where the tab stays
// clickable and the gating happens inside the panel content itself
// (WorldPanel's own isPremium ? content : <ProGate>).
const TAB_ACCESS: Record<Tab, { roles: ('ADMIN'|'USER')[]; requiresPremium?: boolean }> = {
  overview:         { roles: ['ADMIN','USER'] }, // content branches inside the panel, not here
  myEvents:         { roles: ['ADMIN','USER'] },
  worldEvents:      { roles: ['ADMIN','USER'], requiresPremium: true },
  users:            { roles: ['ADMIN'] },
  subscribers:      { roles: ['ADMIN'] },
  apiUsers:         { roles: ['ADMIN'] },
  longevity:        { roles: ['ADMIN'] },
  events:           { roles: ['ADMIN'] },
  articles:         { roles: ['ADMIN'] },
  categories:       { roles: ['ADMIN'] },
  affiliateBanners: { roles: ['ADMIN'] },
  leadMagnet:       { roles: ['ADMIN'] },
  reviewers:        { roles: ['ADMIN'] },
  calendarEvents:   { roles: ['ADMIN'] },
  userEvents:       { roles: ['ADMIN'] },
  comments:         { roles: ['ADMIN'] },
  defaultFollow:    { roles: ['ADMIN'] },
  reviews:          { roles: ['ADMIN'] },
};

function Pagination({
  page, totalPages, onPageChange, pageSize, onPageSizeChange, totalItems,
}: {
  page: number; totalPages: number; onPageChange: (p: number) => void;
  pageSize: number; onPageSizeChange: (n: number) => void; totalItems: number;
}) {
  if (totalItems === 0) return null;
  return (
    <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100 dark:border-gray-800 text-xs text-gray-500">
      <div className="flex items-center gap-2">
        <span>Rows per page:</span>
        <select
          value={pageSize}
          onChange={e => onPageSizeChange(Number(e.target.value))}
          className="border border-gray-200 dark:border-gray-700 rounded-lg px-2 py-1 bg-white dark:bg-gray-900 focus:outline-none">
          {[10, 20, 50, 100].map(n => <option key={n} value={n}>{n}</option>)}
        </select>
      </div>
      <div className="flex items-center gap-3">
        <button
          onClick={() => onPageChange(Math.max(1, page - 1))}
          disabled={page <= 1}
          className="px-2 py-1 rounded-lg border border-gray-200 dark:border-gray-700 disabled:opacity-40 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
          ← Prev
        </button>
        <span>Page {page} of {totalPages}</span>
        <button
          onClick={() => onPageChange(Math.min(totalPages, page + 1))}
          disabled={page >= totalPages}
          className="px-2 py-1 rounded-lg border border-gray-200 dark:border-gray-700 disabled:opacity-40 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
          Next →
        </button>
      </div>
    </div>
  );
}

type SortDir = 'asc' | 'desc';
interface SortState { key: string; dir: SortDir }

function toggleSort(current: SortState | null, key: string): SortState {
  if (current?.key === key) return { key, dir: current.dir === 'asc' ? 'desc' : 'asc' };
  return { key, dir: 'asc' };
}

// Generic comparator: strings compare case-insensitively, dates/numbers/booleans
// compare natively, nulls always sort last regardless of direction.
function applySort<T>(rows: T[], sort: SortState | null, accessor: (row: T, key: string) => any): T[] {
  if (!sort) return rows;
  const sorted = [...rows].sort((a, b) => {
    const av = accessor(a, sort.key);
    const bv = accessor(b, sort.key);
    if (av == null && bv == null) return 0;
    if (av == null) return 1;
    if (bv == null) return -1;
    if (typeof av === 'string' && typeof bv === 'string') return av.localeCompare(bv, undefined, { sensitivity: 'base' });
    if (av instanceof Date && bv instanceof Date) return av.getTime() - bv.getTime();
    if (typeof av === 'boolean' && typeof bv === 'boolean') return av === bv ? 0 : av ? -1 : 1;
    return av > bv ? 1 : av < bv ? -1 : 0;
  });
  if (sort.dir === 'desc') sorted.reverse();
  return sorted;
}

function SortableTh({
  label, sortKey, sort, onSort,
}: {
  label: string; sortKey: string | null; sort: SortState | null; onSort: (key: string) => void;
}) {
  if (!sortKey) {
    return <th className="text-left px-4 py-3 font-medium text-gray-400 text-[11px] uppercase tracking-wide whitespace-nowrap">{label}</th>;
  }
  const active = sort?.key === sortKey;
  return (
    <th
      onClick={() => onSort(sortKey)}
      className="text-left px-4 py-3 font-medium text-gray-400 text-[11px] uppercase tracking-wide whitespace-nowrap cursor-pointer select-none hover:text-gray-600 dark:hover:text-gray-300 transition-colors">
      <span className="inline-flex items-center gap-1">
        {label}
        <span className={active ? 'text-brand-500' : 'text-gray-300 dark:text-gray-700'}>
          {active ? (sort!.dir === 'asc' ? '▲' : '▼') : '↕'}
        </span>
      </span>
    </th>
  );
}

function userAccessor(u: User, key: string) {
  switch (key) {
    case 'user': return (u.name ?? u.email ?? '').toLowerCase();
    case 'status': return u.emailVerified ? 1 : 0;
    case 'plan': return u.role === 'ADMIN' ? 'PRO (Admin)' : u.plan;
    case 'timers': return u._count.timers;
    case 'joined': return new Date(u.createdAt);
    case 'lastSeen': return u.lastSeen ? new Date(u.lastSeen) : null;
    default: return null;
  }
}
function eventAccessor(ev: EventRow, key: string) {
  switch (key) {
    case 'event': return ev.name.toLowerCase();
    case 'category': return ev.category ? ev.category.name.toLowerCase() : null;
    case 'subcategory': return ev.subcategory ? ev.subcategory.name.toLowerCase() : null;
    case 'targetDate': return new Date(ev.targetDate);
    case 'views': return ev.views;
    case 'published': return ev.published ? 1 : 0;
    case 'seoScore': return computeEventSeoScore(ev).score;
    default: return null;
  }
}

function computeEventSeoScore(ev: EventRow): SeoResult {
  const bodyBlocks = Array.isArray(ev.content?.body) ? ev.content.body : [];
  const words = bodyBlocks.reduce((sum: number, b: any) => sum + String(b?.text ?? '').trim().split(/\s+/).filter(Boolean).length, 0);
  const faqs = Array.isArray(ev.content?.faqs) ? ev.content.faqs : [];
  const sources = Array.isArray(ev.content?.sources) ? ev.content.sources : [];

  const checks: (SeoCheck & { weight: number })[] = [
    {
      label: 'Custom hero image set',
      passed: !!ev.heroImageUrl,
      detail: ev.heroImageUrl ? 'Using a custom per-event image.' : 'No heroImageUrl set — falling back to the shared category-pool image.',
      weight: 15,
    },
    {
      label: 'Hero image alt text',
      passed: !!ev.heroImageUrl && !!ev.heroImageAlt,
      detail: !ev.heroImageUrl ? 'Set a custom image first, then add matching alt text.' : ev.heroImageAlt ? 'Alt text present.' : 'heroImageUrl is set but heroImageAlt is missing.',
      weight: 5,
    },
    {
      label: 'Category + subcategory assigned',
      passed: !!ev.categoryId && !!ev.subcategoryId,
      detail: !ev.categoryId ? 'No category assigned.' : !ev.subcategoryId ? 'Category set, but no subcategory.' : 'Fully categorized.',
      weight: 20,
    },
    {
      label: 'Body content depth (≥300 words)',
      passed: words >= 300,
      detail: words === 0 ? 'No body content — add paragraphs/headings via content.body.' : words < 300 ? '~' + words + ' words — add more for depth.' : '~' + words + ' words — solid depth.',
      weight: 30,
    },
    {
      label: 'FAQ coverage (≥3 questions)',
      passed: faqs.length >= 3,
      detail: faqs.length === 0 ? 'No FAQs in content.faqs.' : 'Only ' + faqs.length + ' FAQ' + (faqs.length === 1 ? '' : 's') + ' — add more.',
      weight: 15,
    },
    {
      label: 'Sources present (≥1)',
      passed: sources.length >= 1,
      detail: sources.length === 0 ? 'No sources in content.sources.' : sources.length + ' source(s) present.',
      weight: 15,
    },
  ];

  const score = checks.reduce((sum, c) => sum + (c.passed ? c.weight : 0), 0);
  return { score, checks: checks.map(({ weight, ...c }) => c) };
}
function articleAccessor(a: ArticleRow, key: string) {
  switch (key) {
    case 'title': return a.title.toLowerCase();
    case 'status': return a.status;
    case 'category': return (a.category?.name ?? '').toLowerCase();
    case 'subcategory': return (a.subcategory?.name ?? '').toLowerCase();
    case 'seoScore': return computeSeoScore(a).score;
    default: return null;
  }
}
// --- SEO scorer -------------------------------------------------------
// Pure client-side scoring against fields already present on ArticleRow —
// no extra API calls. Each check is weighted; weights sum to 100.
interface SeoCheck { label: string; passed: boolean; detail: string }
interface SeoResult { score: number; checks: SeoCheck[] }

function blocksArray(a: ArticleRow): any[] {
  return Array.isArray(a.blocks) ? a.blocks : [];
}
function wordCount(a: ArticleRow): number {
  return blocksArray(a)
    .filter(b => b?.type === 'paragraph' || b?.type === 'heading')
    .reduce((sum, b) => sum + String(b.text ?? '').split(/\s+/).filter(Boolean).length, 0);
}
function faqItems(a: ArticleRow): any[] {
  return blocksArray(a).find(b => b?.type === 'faq')?.items ?? [];
}
function sourceItems(a: ArticleRow): any[] {
  return blocksArray(a).find(b => b?.type === 'sources')?.items ?? [];
}
function hasChart(a: ArticleRow): boolean {
  return blocksArray(a).some(b => b?.type === 'chart');
}
function hasHeroCountdownBlock(a: ArticleRow): boolean {
  return blocksArray(a).some(b => b?.type === 'hero_countdown');
}
function sourcesAreDeepLinked(a: ArticleRow): boolean {
  const items = sourceItems(a);
  if (items.length === 0) return false;
  return items.every(s => {
    try { return new URL(s.url).pathname.replace(/\/+$/, '').length > 1; }
    catch { return false; }
  });
}

function computeSeoScore(a: ArticleRow): SeoResult {
  const dekLen = (a.dek ?? '').length;
  const faqs = faqItems(a);
  const sources = sourceItems(a);
  const words = wordCount(a);
  const heroOk = (a.questionType === 'DURATION' && !!a.heroData) || hasHeroCountdownBlock(a);
  const blocks = blocksArray(a);

  // First 4 blocks after intro — where a heading with a number/range in it
  // means the direct numeric answer surfaces near the top of the page,
  // instead of being buried under paragraphs of context. Digit check catches
  // things like "(18-24 Weeks)" or "6 Months" in a heading's text.
  const earlyHeadings = blocks.slice(0, 4).filter((b: any) => b?.type === 'heading');
  const hasSnippetReadyHeading = earlyHeadings.some((b: any) => /\d/.test(b?.text ?? ''));

  const questionWordPattern = /^(how|what|why|when|do|does|can|will|is|are)\b/i;
  const titleIsQuestion = questionWordPattern.test((a.title ?? '').trim()) && (a.title ?? '').trim().endsWith('?');

  const faqsArePhrased = faqs.length > 0 && faqs.every((f: any) =>
    questionWordPattern.test((f.q ?? '').trim()) && (f.q ?? '').trim().endsWith('?')
  );

  const internalLinkPresent = hasInternalLink(blocks);

  const checks: (SeoCheck & { weight: number })[] = [
    {
      label: 'Meta description content',
      // dek is auto-truncated to ~155 chars at render time (see truncateDescription()
      // in renderArticlePage.tsx) — so the live meta tag is safe regardless of stored
      // length. This only flags genuinely missing or excessively long content.
      passed: dekLen >= 40 && dekLen <= 400,
      detail: dekLen === 0
        ? 'No dek/shortAnswer set — meta description will be empty.'
        : dekLen < 40
          ? 'Currently ' + dekLen + ' chars — quite thin as an on-page summary; consider expanding it a bit.'
          : dekLen > 400
            ? 'Currently ' + dekLen + ' chars — very long even as an on-page summary; consider tightening it.'
            : 'Currently ' + dekLen + ' chars — auto-truncated to ~155 for the meta tag, full length shown on-page. Fine as-is.',
      weight: 10,
    },
    {
      label: 'Custom hero image set',
      passed: !!a.heroImageUrl,
      detail: a.heroImageUrl
        ? 'Using a custom per-article image.'
        : 'No heroImageUrl set — falling back to the shared category-pool image, which may not match this article.',
      weight: 5,
    },
    {
      label: 'Hero image alt text',
      passed: !!a.heroImageUrl && !!a.heroImageAlt,
      detail: !a.heroImageUrl
        ? 'Set a custom image first, then add matching alt text.'
        : a.heroImageAlt
          ? 'Alt text present.'
          : 'heroImageUrl is set but heroImageAlt is missing — add descriptive alt text for accessibility and image SEO.',
      weight: 5,
    },
    {
      label: 'Category + subcategory assigned',
      passed: !!a.categoryId && !!a.subcategoryId,
      detail: !a.categoryId
        ? 'No category assigned — set both Category and Subcategory in the dropdowns.'
        : !a.subcategoryId
          ? 'Category set, but no subcategory — add one for full classification.'
          : 'Fully categorized.',
      weight: 10,
    },
    {
      label: 'FAQ coverage (≥3 questions)',
      passed: faqs.length >= 3,
      detail: faqs.length === 0
        ? 'No FAQ block — add at least 3 FAQs to help long-tail search coverage and FAQPage rich results.'
        : 'Only ' + faqs.length + ' FAQ' + (faqs.length === 1 ? '' : 's') + ' — add more to reach at least 3.',
      weight: 10,
    },
    {
      label: 'FAQ phrased as real questions',
      passed: faqsArePhrased,
      detail: faqs.length === 0
        ? 'Add FAQs first — this checks whether they read as natural search queries (start with How/What/Why/etc, end in "?").'
        : faqsArePhrased
          ? 'All FAQs are phrased as natural questions — good match for People-Also-Ask and voice search.'
          : 'One or more FAQs aren\'t phrased as a direct question (missing a leading question word or trailing "?") — rewrite to mirror how people actually search.',
      weight: 5,
    },
    {
      label: 'Sources (≥2, deep-linked)',
      passed: sources.length >= 2 && sourcesAreDeepLinked(a),
      detail: sources.length === 0
        ? 'No sources block — add at least 2 authoritative, deep-linked sources.'
        : sources.length < 2
          ? 'Only ' + sources.length + ' source — add at least one more.'
          : !sourcesAreDeepLinked(a)
            ? 'Some sources link to homepages instead of the specific page — deep-link them.'
            : sources.length + ' sources, all deep-linked.',
      weight: 10,
    },
    {
      label: 'Visual content (chart/graph)',
      passed: hasChart(a),
      detail: hasChart(a) ? 'Chart block present.' : 'No chart block — a supporting chart improves comprehension and dwell time.',
      weight: 5,
    },
    {
      label: 'Content depth (≥600 words)',
      passed: words >= 600,
      detail: words === 0
        ? 'No body content detected.'
        : words < 600
          ? '~' + words + ' words — thin for a competitive query; aim for 600+ across paragraphs/headings.'
          : '~' + words + ' words — solid depth.',
      weight: 10,
    },
    {
      label: 'Hero/questionType consistency',
      passed: heroOk,
      detail: heroOk
        ? 'Hero renders correctly for this question type.'
        : a.questionType
          ? 'questionType is "' + a.questionType + '" but no matching heroData/hero_countdown block was found.'
          : 'No questionType set and no hero_countdown block — this article has no hero at all.',
      weight: 5,
    },
    {
      label: 'Question-intent H1',
      passed: titleIsQuestion,
      detail: titleIsQuestion
        ? 'Title reads as a natural question — matches how people actually search.'
        : 'Title doesn\'t start with a question word (How/What/Why/etc) and end in "?" — search snippets and voice assistants favor direct question-form titles.',
      weight: 5,
    },
    {
      label: 'Snippet-ready early answer',
      passed: hasSnippetReadyHeading,
      detail: hasSnippetReadyHeading
        ? 'A heading near the top of the article states the numeric answer directly — good for featured snippets.'
        : 'None of the first few headings contain a number/range — consider adding an early H2 like "How Many Weeks Until X? (18–24 Weeks)" so the direct answer surfaces before readers scroll far.',
      weight: 10,
    },
    {
      label: 'Internal link present',
      passed: internalLinkPresent,
      detail: internalLinkPresent
        ? 'At least one link points to another page on this site.'
        : 'No internal links found — link to a related tool or category page to help spread authority across the site and give readers a next step.',
      weight: 10,
    },
  ];

  const score = checks.reduce((sum, c) => sum + (c.passed ? c.weight : 0), 0);
  return { score, checks: checks.map(({ weight, ...c }) => c) };
}
function seoScoreColor(score: number): string {
  if (score >= 90) return '#1D9E75'; // green
  if (score >= 70) return '#BA7517'; // amber
  return '#D85A30'; // red
}

export function AdminClient({
  isAdmin, isPremium = false,
  users = [], events = [], articles = [], categories = [], stats, reviewers = [], reviews = [],
  timers = [], popular = [], myEvents = [], userName,
}: {
  isAdmin: boolean; isPremium?: boolean;
  users?: User[]; events?: EventRow[]; articles?: ArticleRow[]; categories?: CategoryRow[]; stats?: Stats; reviewers?: ReviewerRow[]; reviews?: ReviewRow[];
  timers?: any[]; popular?: any[]; myEvents?: any[]; userName?: string | null;
}) {
  const [tab, setTab] = useState<Tab>('overview');
  const [search, setSearch] = useState('');
  const [planFilter, setPlanFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const { toast, showToast } = useToast();
  const { theme } = useTheme();

  // Articles tab state
  const [jsonInput, setJsonInput] = useState('');
  const [importing, setImporting] = useState(false);
  const [eventJsonInput, setEventJsonInput] = useState('');
  const [importingEvents, setImportingEvents] = useState(false);
  const [eventImportResults, setEventImportResults] = useState<{
    updated: number;
    created: number;
    failed: { slug: string; error?: string }[];
  } | null>(null);
  const [articleRows, setArticleRows] = useState(articles);
  const [eventRows, setEventRows] = useState(events);
  const [savingRow, setSavingRow] = useState<string | null>(null);
  const [savingEventRow, setSavingEventRow] = useState<string | null>(null);
  const [articleSearch, setArticleSearch] = useState('');
  const [articleCategoryFilter, setArticleCategoryFilter] = useState<string | null>(null);
  const [eventSearch, setEventSearch] = useState('');
  const [eventCategoryFilter, setEventCategoryFilter] = useState<string | null>(null);
  const [pageSize, setPageSize] = useState(10);
  const [userPage, setUserPage] = useState(1);
  const [eventPage, setEventPage] = useState(1);
  const [articlePage, setArticlePage] = useState(1);
  const resetPages = () => { setUserPage(1); setEventPage(1); setArticlePage(1); };

  const [reviewsState, setReviewsState] = useState(reviews);
const [userSort, setUserSort] = useState<SortState | null>(null);
  const [eventSort, setEventSort] = useState<SortState | null>(null);
  const [articleSort, setArticleSort] = useState<SortState | null>(null);
  const onUserSort = (key: string) => { setUserSort(s => toggleSort(s, key)); setUserPage(1); };
  const onEventSort = (key: string) => { setEventSort(s => toggleSort(s, key)); setEventPage(1); };
  const onArticleSort = (key: string) => { setArticleSort(s => toggleSort(s, key)); setArticlePage(1); };
  const [expandedSeoId, setExpandedSeoId] = useState<string | null>(null);
  const [expandedEventSeoId, setExpandedEventSeoId] = useState<string | null>(null);

  const topLevelCategories = categories.filter(c => !c.parentId);
  const subcategoriesFor = (parentId: string | null) =>
    parentId ? categories.filter(c => c.parentId === parentId) : [];
  // Inactive reviewers can still be shown if already assigned to a row (so the
  // dropdown doesn't silently blank out an existing assignment), but never
  // offered as a fresh pick.
  const activeReviewers = reviewers.filter(r => r.active);
  const reviewerOptionsFor = (currentId: string | null | undefined) => {
    const assigned = currentId ? reviewers.find(r => r.id === currentId) : null;
    if (assigned && !assigned.active) return [assigned, ...activeReviewers];
    return activeReviewers;
  };

  const filtered = users.filter(u => {
    const s = search.toLowerCase();
    const matchSearch = !s || (u.email ?? '').toLowerCase().includes(s) || (u.name ?? '').toLowerCase().includes(s);
    const matchPlan = planFilter === 'all' || u.plan === planFilter.toUpperCase();
    const matchStatus = statusFilter === 'all'
      || (statusFilter === 'verified' && u.emailVerified)
      || (statusFilter === 'unverified' && !u.emailVerified);
    return matchSearch && matchPlan && matchStatus;
  });

  async function updatePlan(userId: string, plan: string) {
    await fetch('/api/admin/users/' + userId, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ plan }),
    });
    window.location.reload();
  }

  async function blockUser(userId: string, email: string) {
    const reason = window.prompt('Reason for blocking ' + email + '? (optional)');
    if (reason === null) return;
    await fetch('/api/admin/users/' + userId, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'block', reason }),
    });
    window.location.reload();
  }

  async function unblockUser(userId: string, email: string) {
    await fetch('/api/admin/users/' + userId, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'unblock' }),
    });
    window.location.reload();
  }

  async function deleteUser(userId: string, email: string) {
    if (!confirm('Delete user ' + email + '? Cannot be undone.')) return;
    await fetch('/api/admin/users/' + userId, { method: 'DELETE' });
    window.location.reload();
  }

  async function deleteEvent(eventId: string, name: string) {
    if (!confirm('Delete event "' + name + '"? Cannot be undone.')) return;
    const res = await fetch('/api/admin/events/' + eventId, { method: 'DELETE' });
    if (res.ok) {
      showToast('Event deleted', '🗑️');
      setEventRows(rows => rows.filter(r => r.id !== eventId));
    } else {
      showToast('Could not delete event', '⚠️');
    }
  }

  async function toggleEventPublish(eventId: string, currentPublished: boolean) {
    const nextPublished = !currentPublished;
    setSavingEventRow(eventId);
    try {
      const res = await fetch('/api/admin/events/' + eventId, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ published: nextPublished }),
      });
      if (res.ok) {
        const updated = await res.json();
        setEventRows(rows => rows.map(r =>
          r.id === eventId ? { ...r, published: updated.published, publishedAt: updated.publishedAt } : r
        ));
        showToast(nextPublished ? 'Event published!' : 'Event unpublished', nextPublished ? '🚀' : '📝');
      } else {
        showToast('Could not update status', '⚠️');
      }
    } catch {
      showToast('Network error', '⚠️');
    } finally {
      setSavingEventRow(null);
    }
  }

  // Reconstructs the exact shape accepted by "Import from JSON" above.
  function downloadEventJson(ev: EventRow) {
    const exportObj: Record<string, any> = {
      slug: ev.slug,
      authorName: ev.authorName ?? '',
      content: ev.content ?? {},
    };
    if (ev.heroImageUrl) exportObj.heroImageUrl = ev.heroImageUrl;
    if (ev.heroImageAlt) exportObj.heroImageAlt = ev.heroImageAlt;

    const json = JSON.stringify([exportObj], null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = ev.slug + '.json';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  function updateEventRowCategory(eventId: string, categoryId: string) {
    setEventRows(rows => rows.map(r =>
      r.id === eventId ? { ...r, categoryId: categoryId || null, category: topLevelCategories.find(c => c.id === categoryId) ?? null, subcategoryId: null, subcategory: null } : r
    ));
  }

  function updateEventRowSubcategory(eventId: string, subcategoryId: string) {
    setEventRows(rows => rows.map(r =>
      r.id === eventId ? { ...r, subcategoryId: subcategoryId || null, subcategory: categories.find(c => c.id === subcategoryId) ?? null } : r
    ));
  }

  function updateEventRowReviewer(eventId: string, reviewerId: string) {
    setEventRows(rows => rows.map(r =>
      r.id === eventId ? { ...r, reviewerId: reviewerId || null } : r
    ));
  }

  function updateEventRowReviewEnabled(eventId: string, reviewEnabled: boolean) {
    setEventRows(rows => rows.map(r =>
      r.id === eventId ? { ...r, reviewEnabled } : r
    ));
  }

  async function saveEventCategory(
    eventId: string,
    categoryId: string | null,
    subcategoryId: string | null,
    reviewerId?: string | null,
    reviewEnabled?: boolean,
  ) {
    setSavingEventRow(eventId);
    try {
      const res = await fetch('/api/admin/events/' + eventId, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ categoryId, subcategoryId, reviewerId, reviewEnabled }),
      });
      if (res.ok) {
        showToast('Saved', '💾');
      } else {
        showToast('Could not save', '⚠️');
      }
    } catch {
      showToast('Network error', '⚠️');
    } finally {
      setSavingEventRow(null);
    }
  }

  async function importArticles() {
    let parsed: unknown;
    try {
      parsed = JSON.parse(jsonInput);
    } catch {
      showToast('Invalid JSON — check syntax', '⚠️');
      return;
    }
    setImporting(true);
    try {
      const res = await fetch('/api/admin/articles/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(parsed),
      });
      const data = await res.json();
      if (!res.ok) {
        showToast(data.error ?? 'Import failed', '⚠️');
      } else {
        const { created, updated, failed } = data;
        if (failed && failed.length > 0) {
          showToast(`${created} created, ${updated} updated, ${failed.length} failed`, '⚠️');
          console.error('Import errors:', failed);
        } else {
          showToast(`${created} created, ${updated} updated`, '✅');
          setJsonInput('');
        }
        window.location.reload();
      }
    } catch {
      showToast('Network error during import', '⚠️');
    } finally {
      setImporting(false);
    }
  }
  async function importEvents() {
    let parsed: unknown;
    try {
      parsed = JSON.parse(eventJsonInput);
    } catch {
      showToast('Invalid JSON — check syntax', '⚠️');
      return;
    }
    setImportingEvents(true);
    setEventImportResults(null);
    try {
      const res = await fetch('/api/admin/events/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(parsed),
      });

      // The route can fail before it ever produces JSON (auth, body parse,
      // unexpected server error). Guard the parse so a non-JSON response
      // (e.g. Next's HTML error page) doesn't get swallowed as a silent
      // "network error" with no explanation.
      let data: any;
      try {
        data = await res.json();
      } catch {
        showToast(`Import failed — server returned a non-JSON response (HTTP ${res.status})`, '⚠️');
        return;
      }

      if (!res.ok) {
        showToast(data.error ?? `Import failed (HTTP ${res.status})`, '⚠️');
        return;
      }

      const { updated = 0, created = 0, failed = [] } = data;
      setEventImportResults({ updated, created, failed });

      if (failed.length > 0) {
        showToast(`${updated} updated, ${created} created, ${failed.length} failed — see details below`, '⚠️');
      } else {
        showToast(`${updated} updated, ${created} created`, '✅');
        setEventJsonInput('');
        window.location.reload();
      }
    } catch {
      showToast('Network error during import', '⚠️');
    } finally {
      setImportingEvents(false);
    }
  }

  async function saveArticleCategory(
    articleId: string,
    categoryId: string | null,
    subcategoryId: string | null,
    reviewerId?: string | null,
    reviewEnabled?: boolean,
  ) {
    setSavingRow(articleId);
    try {
      const res = await fetch('/api/admin/articles/' + articleId, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ categoryId, subcategoryId, reviewerId, reviewEnabled }),
      });
      if (res.ok) {
        showToast('Saved', '💾');
      } else {
        showToast('Could not save', '⚠️');
      }
    } catch {
      showToast('Network error', '⚠️');
    } finally {
      setSavingRow(null);
    }
  }

  async function togglePublish(articleId: string, currentStatus: string) {
    const nextStatus = currentStatus === 'published' ? 'draft' : 'published';
    setSavingRow(articleId);
    try {
      const res = await fetch('/api/admin/articles/' + articleId, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: nextStatus }),
      });
      if (res.ok) {
        const updated = await res.json();
        setArticleRows(rows => rows.map(r =>
          r.id === articleId ? { ...r, status: updated.status, publishedAt: updated.publishedAt } : r
        ));
        showToast(nextStatus === 'published' ? 'Article published!' : 'Moved back to draft', nextStatus === 'published' ? '🚀' : '📝');
      } else {
        showToast('Could not update status', '⚠️');
      }
    } catch {
      showToast('Network error', '⚠️');
    } finally {
      setSavingRow(null);
    }
  }

  async function deleteArticle(articleId: string, title: string) {
    if (!confirm('Delete article "' + title + '"? Cannot be undone.')) return;
    const res = await fetch('/api/admin/articles/' + articleId, { method: 'DELETE' });
    if (res.ok) {
      showToast('Article deleted', '🗑️');
      setArticleRows(rows => rows.filter(r => r.id !== articleId));
    } else {
      showToast('Could not delete article', '⚠️');
    }
  }

  // Reconstructs the exact shape accepted by "Import from JSON" above.
  // faqs/sources live as blocks (type 'faq' / 'sources') internally for
  // rendering — pull them back into their own top-level arrays here, and
  // title/dek back into motherQuestion/shortAnswer, so the downloaded file
  // can be re-pasted straight into the import box unchanged.
  function downloadArticleJson(a: ArticleRow) {
    const blocks = blocksArray(a);
    const exportBlocks = blocks.filter(b => b?.type !== 'faq' && b?.type !== 'sources');
    const exportObj: Record<string, any> = {
      slug: a.slug,
      motherQuestion: a.title,
      shortAnswer: a.dek ?? '',
      blocks: exportBlocks,
      faqs: faqItems(a),
      sources: sourceItems(a),
    };
    if (a.questionType) exportObj.questionType = a.questionType;
    if (a.heroImageUrl) exportObj.heroImageUrl = a.heroImageUrl;
    if (a.heroImageAlt) exportObj.heroImageAlt = a.heroImageAlt;
    if (a.heroData) exportObj.heroData = a.heroData;

    const json = JSON.stringify([exportObj], null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = a.slug + '.json';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  function updateRowCategory(articleId: string, categoryId: string) {
    setArticleRows(rows => rows.map(r =>
      r.id === articleId ? { ...r, categoryId: categoryId || null, subcategoryId: null } : r
    ));
  }

  function updateRowSubcategory(articleId: string, subcategoryId: string) {
    setArticleRows(rows => rows.map(r =>
      r.id === articleId ? { ...r, subcategoryId: subcategoryId || null } : r
    ));
  }

  function updateRowReviewer(articleId: string, reviewerId: string) {
    setArticleRows(rows => rows.map(r =>
      r.id === articleId ? { ...r, reviewerId: reviewerId || null } : r
    ));
  }

  function updateRowReviewEnabled(articleId: string, reviewEnabled: boolean) {
    setArticleRows(rows => rows.map(r =>
      r.id === articleId ? { ...r, reviewEnabled } : r
    ));
  }

  const filteredArticles = articleRows.filter(a => {
    const s = articleSearch.toLowerCase();
    const matchSearch = !s || a.title.toLowerCase().includes(s) || a.slug.toLowerCase().includes(s);
    const matchCategory = !articleCategoryFilter || a.categoryId === articleCategoryFilter;
    return matchSearch && matchCategory;
  });

  const filteredEvents = eventRows.filter(ev => {
    const s = eventSearch.toLowerCase();
    const matchSearch = !s
      || ev.name.toLowerCase().includes(s)
      || ev.slug.toLowerCase().includes(s)
      || (ev.category?.name ?? '').toLowerCase().includes(s)
      || (ev.subcategory?.name ?? '').toLowerCase().includes(s);
    const matchCategory = !eventCategoryFilter || ev.categoryId === eventCategoryFilter;
    return matchSearch && matchCategory;
  });

  const sortedUsers = applySort(filtered, userSort, userAccessor);
  const userTotalPages = Math.max(1, Math.ceil(sortedUsers.length / pageSize));
  const safeUserPage = Math.min(userPage, userTotalPages);
  const pagedUsers = sortedUsers.slice((safeUserPage - 1) * pageSize, safeUserPage * pageSize);

  const sortedEvents = applySort(filteredEvents, eventSort, eventAccessor);
  const eventTotalPages = Math.max(1, Math.ceil(sortedEvents.length / pageSize));
  const safeEventPage = Math.min(eventPage, eventTotalPages);
  const pagedEvents = sortedEvents.slice((safeEventPage - 1) * pageSize, safeEventPage * pageSize);

  const sortedArticles = applySort(filteredArticles, articleSort, articleAccessor);
  const articleTotalPages = Math.max(1, Math.ceil(sortedArticles.length / pageSize));
  const safeArticlePage = Math.min(articlePage, articleTotalPages);
  const pagedArticles = sortedArticles.slice((safeArticlePage - 1) * pageSize, safeArticlePage * pageSize);

  return (
    <div className="flex min-h-screen text-gray-900 dark:text-gray-100" style={{ colorScheme: theme }}>
      <ToastHost toast={toast} />

      {/* Sidebar */}
      <aside className="w-48 flex-shrink-0 border-r border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-3">
        <div className="mb-4 px-2 pt-1">
          <p className="text-xs font-bold uppercase tracking-widest text-amber-600 dark:text-amber-400">{isAdmin ? 'Admin Panel' : 'Dashboard'}</p>
          <p className="text-xs text-gray-400 mt-0.5">{stats ? `${stats.totalUsers} users` : ''}</p>
        </div>
        {(Object.keys(TAB_ACCESS) as Tab[])
          .filter(t => TAB_ACCESS[t].roles.includes(isAdmin ? 'ADMIN' : 'USER'))
          .map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={'w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm mb-0.5 capitalize transition-colors ' + (
              tab === t ? 'bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 font-medium' : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800'
            )}>
            {TAB_ICONS[t]} {TAB_LABELS[t]}
            {TAB_ACCESS[t].requiresPremium && !isPremium && (
              <span className="ml-auto text-[9px] px-1.5 py-0.5 rounded-full font-bold" style={{ background: 'rgba(186,117,23,0.15)', color: '#BA7517' }}>PRO</span>
            )}
          </button>
        ))}
        <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-800">
          <a href="/" className="block text-xs text-gray-400 hover:text-brand-500 px-2 py-1">← Home</a>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 p-6 bg-gray-50 dark:bg-gray-950 overflow-auto">

        {/* OVERVIEW */}
        {tab === 'overview' && (isAdmin ? (
          <div>
            <h1 className="text-xl font-medium mb-6">Platform overview</h1>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
              {(Object.entries(stats ?? {}) as [string, number][]).map(([key, val]) => (
                <div key={key} className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-4">
                  <p className="text-[11px] uppercase tracking-widest text-gray-400 mb-1">
                    {key.replace(/([A-Z])/g,' $1').toLowerCase()}
                  </p>
                  <p className="text-2xl font-medium" style={{ color: STAT_COLORS[key] ?? '#534AB7' }}>
                    {val.toLocaleString()}
                  </p>
                </div>
              ))}
            </div>
            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-5">
              <h2 className="text-sm font-medium mb-4">Recent signups ({users.length} total)</h2>
              <div className="space-y-0">
                {users.slice(0,10).map((u, i) => (
                  <div key={u.id} className={'flex items-center justify-between py-2.5 ' + (i < 9 ? 'border-b border-gray-100 dark:border-gray-800' : '')}>
                    <div className="flex items-center gap-3">
                      <div className="w-7 h-7 rounded-full bg-brand-100 dark:bg-brand-900/30 flex items-center justify-center text-xs font-medium text-brand-500">
                        {(u.name ?? u.email ?? '?')[0].toUpperCase()}
                      </div>
                      <div>
                        <p className="text-sm font-medium">{u.name ?? 'No name'}</p>
                        <p className="text-xs text-gray-400">{u.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={'text-xs px-2 py-0.5 rounded-full font-medium ' + (u.emailVerified ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' : 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400')}>
                        {u.emailVerified ? '✓ Verified' : '⏳ Pending'}
                      </span>
                      <span className={'text-xs px-2 py-0.5 rounded-full font-medium ' + (u.plan === 'PRO' ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400' : 'bg-gray-100 dark:bg-gray-800 text-gray-500')}>
                        {u.plan}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <PersonalOverviewPanel userName={userName} timers={timers} popular={popular} />
        ))}

        {/* USERS */}
        {tab === 'users' && (
          <div>
            <div className="flex items-center justify-between mb-5">
              <h1 className="text-xl font-medium">All users ({filtered.length} shown)</h1>
            </div>
            <div className="flex gap-3 mb-5 flex-wrap">
              <input placeholder="Search name or email..." value={search} onChange={e => { setSearch(e.target.value); setUserPage(1); }}
                className="flex-1 min-w-48 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-2 text-sm bg-white dark:bg-gray-900 focus:outline-none focus:border-brand-500" />
              <select value={planFilter} onChange={e => { setPlanFilter(e.target.value); setUserPage(1); }}
                className="border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2 text-sm bg-white dark:bg-gray-900 focus:outline-none">
                <option value="all">All plans</option>
                <option value="free">Free</option>
                <option value="pro">Pro / Paid</option>
              </select>
              <select value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setUserPage(1); }}
                className="border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2 text-sm bg-white dark:bg-gray-900 focus:outline-none">
                <option value="all">All status</option>
                <option value="verified">Verified (clicked link)</option>
                <option value="unverified">Pending (link not clicked)</option>
              </select>
            </div>
            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
                    <tr>
                      <SortableTh label="User" sortKey="user" sort={userSort} onSort={onUserSort} />
                      <SortableTh label="Status" sortKey="status" sort={userSort} onSort={onUserSort} />
                      <SortableTh label="Plan" sortKey="plan" sort={userSort} onSort={onUserSort} />
                      <SortableTh label="Timers" sortKey="timers" sort={userSort} onSort={onUserSort} />
                      <SortableTh label="Joined" sortKey="joined" sort={userSort} onSort={onUserSort} />
                      <SortableTh label="Last seen" sortKey="lastSeen" sort={userSort} onSort={onUserSort} />
                      <SortableTh label="Actions" sortKey={null} sort={userSort} onSort={onUserSort} />
                    </tr>
                  </thead>
                  <tbody>
                    {pagedUsers.map((u, i) => (
                      <tr key={u.id} className={'border-b border-gray-100 dark:border-gray-800 last:border-0 hover:bg-gray-50/50 dark:hover:bg-gray-800/30 ' + (u.role === 'ADMIN' ? 'bg-amber-50/30 dark:bg-amber-900/10' : '')}>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-full bg-brand-100 dark:bg-brand-900/30 flex items-center justify-center text-xs font-medium text-brand-500 flex-shrink-0">
                              {(u.name ?? u.email ?? '?')[0].toUpperCase()}
                            </div>
                            <div>
                              <p className="font-medium text-xs">{u.name ?? '—'}</p>
                              <p className="text-gray-400 text-xs truncate max-w-32">{u.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex flex-col gap-1">
                            <span className={'text-xs px-2 py-0.5 rounded-full font-medium w-fit ' + (u.emailVerified ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' : 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400')}>
                              {u.emailVerified ? '✓ Active' : '⏳ Pending'}
                            </span>
                            {u.role === 'ADMIN' && <span className="text-xs bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 px-1.5 py-0.5 rounded-full font-bold w-fit">ADMIN</span>}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          {u.role === 'ADMIN' ? (
                            <span className="text-xs text-amber-600 font-medium">PRO (Admin)</span>
                          ) : (
                            <select value={u.plan} onChange={e => updatePlan(u.id, e.target.value)}
                              className={'text-xs px-2 py-1 rounded-lg border font-medium cursor-pointer focus:outline-none ' + (u.plan === 'PRO' ? 'border-purple-300 bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300' : 'border-gray-200 dark:border-gray-700 bg-transparent text-gray-500')}>
                              <option value="FREE">FREE</option>
                              <option value="PRO">PRO</option>
                            </select>
                          )}
                        </td>
                        <td className="px-4 py-3 text-gray-500 text-xs text-center">{u._count.timers}</td>
                        <td className="px-4 py-3 text-gray-400 text-xs whitespace-nowrap">{new Date(u.createdAt).toLocaleDateString()}</td>
                        <td className="px-4 py-3 text-gray-400 text-xs whitespace-nowrap">{u.lastSeen ? new Date(u.lastSeen).toLocaleDateString() : '—'}</td>
                        <td className="px-4 py-3">
                          {u.role !== 'ADMIN' && (
                            <div className="flex items-center gap-2">
                              {u.blockedAt ? (
                                <button onClick={() => unblockUser(u.id, u.email ?? '')}
                                  className="text-xs text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 px-2 py-1 rounded-lg transition-colors">
                                  Unblock
                                </button>
                              ) : (
                                <button onClick={() => blockUser(u.id, u.email ?? '')}
                                  className="text-xs text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-900/20 px-2 py-1 rounded-lg transition-colors">
                                  Block
                                </button>
                              )}
                              <button onClick={() => deleteUser(u.id, u.email ?? '')}
                                className="text-xs text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 px-2 py-1 rounded-lg transition-colors">
                                Delete
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {filtered.length === 0 && <p className="text-center text-gray-400 text-sm py-12">No users match your filters</p>}
              </div>
            </div>
            <Pagination page={safeUserPage} totalPages={userTotalPages} onPageChange={setUserPage} pageSize={pageSize} onPageSizeChange={n => { setPageSize(n); resetPages(); }} totalItems={filtered.length} />
          </div>
        )}

        {/* EVENTS */}
        {tab === 'events' && (
          <div>
            <h1 className="text-xl font-medium mb-5">Events ({filteredEvents.length}{(eventSearch || eventCategoryFilter) ? ' of ' + events.length : ''})</h1>
            {/* Import box */}
            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-5 mb-6">
              <h2 className="text-sm font-medium mb-3">Import from JSON (updates existing events only — matched by slug)</h2>
              <textarea
                value={eventJsonInput}
                onChange={e => setEventJsonInput(e.target.value)}
                placeholder='[{"slug": "easter", "authorName": "...", "heroImageUrl": "...", "heroImageAlt": "...", "content": {"heroFact": "...", "body": [{"type":"heading","text":"..."},{"type":"paragraph","text":"..."}], "faqs": [...], "sources": [...]}}]'
                rows={8}
                className="w-full border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 text-xs font-mono bg-white dark:bg-gray-900 focus:outline-none focus:border-brand-500 mb-3"
              />
              <button
                onClick={importEvents}
                disabled={importingEvents || !eventJsonInput.trim()}
                className="bg-brand-500 text-white rounded-xl px-5 py-2 text-sm font-medium hover:bg-brand-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                {importingEvents ? 'Importing…' : 'Import events'}
              </button>

              {eventImportResults && (
                <div className="mt-4 text-sm">
                  <p className="text-gray-500 dark:text-gray-400 mb-2">
                    {eventImportResults.updated} updated · {eventImportResults.created} created · {eventImportResults.failed.length} failed
                  </p>
                  {eventImportResults.failed.length > 0 && (
                    <ul className="space-y-1">
                      {eventImportResults.failed.map((f, i) => (
                        <li key={i} className="text-red-500 dark:text-red-400 text-xs font-mono">
                          <span className="font-semibold">{f.slug}</span>: {f.error ?? 'Unknown error'}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
            </div>
            <div className="flex gap-3 mb-4">
              <input
                placeholder="Search event name, slug, or category..."
                value={eventSearch}
                onChange={e => { setEventSearch(e.target.value); setEventPage(1); }}
                className="flex-1 min-w-48 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-2 text-sm bg-white dark:bg-gray-900 focus:outline-none focus:border-brand-500"
              />
            </div>

            {/* Category tag filter row */}
            <div className="flex flex-wrap gap-2 mb-5">
              <button
                onClick={() => { setEventCategoryFilter(null); setEventPage(1); }}
                className={'text-xs px-3 py-1.5 rounded-full font-medium border transition-colors ' + (
                  eventCategoryFilter === null
                    ? 'bg-brand-500 border-brand-500 text-white'
                    : 'border-gray-200 dark:border-gray-700 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800'
                )}>
                All
              </button>
              {topLevelCategories.map(c => (
                <button
                  key={c.id}
                  onClick={() => { setEventCategoryFilter(prev => prev === c.id ? null : c.id); setEventPage(1); }}
                  className={'text-xs px-3 py-1.5 rounded-full font-medium border transition-colors ' + (
                    eventCategoryFilter === c.id
                      ? 'bg-brand-500 border-brand-500 text-white'
                      : 'border-gray-200 dark:border-gray-700 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800'
                  )}>
                  {c.emoji} {c.name}
                </button>
              ))}
            </div>

            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
                  <tr>
                    <SortableTh label="#" sortKey={null} sort={eventSort} onSort={onEventSort} />
                    <SortableTh label="Event" sortKey="event" sort={eventSort} onSort={onEventSort} />
                    <SortableTh label="Status" sortKey="published" sort={eventSort} onSort={onEventSort} />
                    <SortableTh label="Category" sortKey="category" sort={eventSort} onSort={onEventSort} />
                    <SortableTh label="Subcategory" sortKey="subcategory" sort={eventSort} onSort={onEventSort} />
                    <SortableTh label="Reviewer" sortKey={null} sort={eventSort} onSort={onEventSort} />
                    <SortableTh label="Target date" sortKey="targetDate" sort={eventSort} onSort={onEventSort} />
                    <SortableTh label="SEO" sortKey="seoScore" sort={eventSort} onSort={onEventSort} />
                    <SortableTh label="Actions" sortKey={null} sort={eventSort} onSort={onEventSort} />
                  </tr>
                </thead>
                <tbody>
                  {pagedEvents.map((ev, i) => {
                  const seo = computeEventSeoScore(ev);
                  const seoOpen = expandedEventSeoId === ev.id;
                  return (
                  <Fragment key={ev.id}>
                    <tr className="border-b border-gray-100 dark:border-gray-800 last:border-0 hover:bg-gray-50 dark:hover:bg-gray-800/30">
                      <td className="px-4 py-3 text-gray-400 text-xs font-medium w-8">{i + 1}</td>
                      <td className="px-4 py-3">
                        <a href={'/questions/how-long-until-' + ev.slug} target="_blank" className="font-medium hover:text-brand-500 transition-colors">{ev.name}</a>
                        <p className="text-xs text-gray-400 mt-0.5">/questions/how-long-until-{ev.slug}</p>
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => toggleEventPublish(ev.id, ev.published)}
                          disabled={savingEventRow === ev.id}
                          title={ev.published && ev.publishedAt ? 'Published ' + new Date(ev.publishedAt).toLocaleDateString() : 'Click to publish'}
                          className={'flex items-center gap-1.5 text-xs px-2 py-1 rounded-full font-medium transition-colors disabled:opacity-50 ' + (ev.published ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 hover:bg-green-200' : 'bg-gray-100 dark:bg-gray-800 text-gray-500 hover:bg-gray-200')}>
                          <span className={'w-2 h-2 rounded-full ' + (ev.published ? 'bg-green-500' : 'bg-gray-400')} />
                          {ev.published ? 'Published' : 'Draft'}
                        </button>
                      </td>
                      <td className="px-4 py-3">
                        <select
                          value={ev.categoryId ?? ''}
                          onChange={e => updateEventRowCategory(ev.id, e.target.value)}
                          className={'text-xs border rounded-lg px-2 py-1 bg-white dark:bg-gray-900 focus:outline-none ' + (ev.categoryId ? 'border-gray-200 dark:border-gray-700' : 'border-amber-300 dark:border-amber-700')}>
                          <option value="">— Uncategorized —</option>
                          {topLevelCategories.map(c => (
                            <option key={c.id} value={c.id}>{c.emoji} {c.name}</option>
                          ))}
                        </select>
                      </td>
                      <td className="px-4 py-3">
                        <select
                          value={ev.subcategoryId ?? ''}
                          onChange={e => updateEventRowSubcategory(ev.id, e.target.value)}
                          disabled={!ev.categoryId}
                          className="text-xs border border-gray-200 dark:border-gray-700 rounded-lg px-2 py-1 bg-white dark:bg-gray-900 focus:outline-none disabled:opacity-40">
                          <option value="">— none —</option>
                          {subcategoriesFor(ev.categoryId).map(c => (
                            <option key={c.id} value={c.id}>{c.emoji} {c.name}</option>
                          ))}
                        </select>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-col gap-1">
                          <select
                            value={ev.reviewerId ?? ''}
                            onChange={e => updateEventRowReviewer(ev.id, e.target.value)}
                            className="text-xs border border-gray-200 dark:border-gray-700 rounded-lg px-2 py-1 bg-white dark:bg-gray-900 focus:outline-none">
                            <option value="">— N/A —</option>
                            {reviewerOptionsFor(ev.reviewerId).map(r => (
                              <option key={r.id} value={r.id}>{r.name}{r.credentials ? `, ${r.credentials}` : ''}</option>
                            ))}
                          </select>
                          <label className="flex items-center gap-1.5 text-xs text-gray-400">
                            <input
                              type="checkbox"
                              checked={!!ev.reviewEnabled}
                              disabled={!ev.reviewerId}
                              onChange={e => updateEventRowReviewEnabled(ev.id, e.target.checked)}
                            />
                            Show publicly
                          </label>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-400">{new Date(ev.targetDate).toLocaleDateString()}</td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => setExpandedEventSeoId(seoOpen ? null : ev.id)}
                          title="Click for SEO details"
                          className="flex items-center gap-1.5 text-xs font-bold px-2 py-1 rounded-full transition-colors"
                          style={{ color: seoScoreColor(seo.score), background: seoScoreColor(seo.score) + '1a', border: '1px solid ' + seoScoreColor(seo.score) + '40' }}>
                          {seo.score}%
                          <span style={{ fontSize: 9 }}>{seoOpen ? '▲' : '▼'}</span>
                        </button>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => saveEventCategory(ev.id, ev.categoryId, ev.subcategoryId, ev.reviewerId, ev.reviewEnabled)}
                            disabled={savingEventRow === ev.id}
                            className="text-xs text-brand-500 hover:bg-brand-50 dark:hover:bg-brand-900/20 px-2 py-1 rounded-lg transition-colors disabled:opacity-50">
                            {savingEventRow === ev.id ? 'Saving…' : 'Save'}
                          </button>
                          <button
                            onClick={() => downloadEventJson(ev)}
                            title="Download this event's JSON"
                            className="text-xs text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 px-2 py-1 rounded-lg transition-colors flex items-center gap-1">
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                            JSON
                          </button>
                          <button onClick={() => deleteEvent(ev.id, ev.name)}
                            className="text-xs text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 px-2 py-1 rounded-lg transition-colors">
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                    {seoOpen && (
                      <tr className="bg-gray-50 dark:bg-gray-800/40 border-b border-gray-100 dark:border-gray-800">
                        <td colSpan={9} className="px-4 py-4">
                          <p className="text-xs font-bold mb-2" style={{ color: seoScoreColor(seo.score) }}>
                            SEO score: {seo.score}% — {seo.score >= 90 ? 'Excellent' : seo.score >= 70 ? 'Needs work' : 'Poor'}
                          </p>
                          <ul className="flex flex-col gap-1.5">
                            {seo.checks.map(c => (
                              <li key={c.label} className="flex items-start gap-2 text-xs">
                                <span className={c.passed ? 'text-green-500' : 'text-red-500'}>{c.passed ? '✓' : '✗'}</span>
                                <span>
                                  <span className="font-medium">{c.label}:</span>{' '}
                                  <span className="text-gray-500">{c.detail}</span>
                                </span>
                              </li>
                            ))}
                          </ul>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                  );
                  })}
                </tbody>
              </table>
              {filteredEvents.length === 0 && (
                <p className="text-center text-gray-400 text-sm py-12">
                  {eventSearch ? 'No events match your search' : 'No events yet'}
                </p>
              )}
            </div>
            <Pagination page={safeEventPage} totalPages={eventTotalPages} onPageChange={setEventPage} pageSize={pageSize} onPageSizeChange={n => { setPageSize(n); resetPages(); }} totalItems={filteredEvents.length} />
          </div>
        )}

        {/* ARTICLES */}
        {tab === 'articles' && (
          <div>
            <h1 className="text-xl font-medium mb-5">Question articles ({filteredArticles.length}{(articleSearch || articleCategoryFilter) ? ' of ' + articleRows.length : ''})</h1>

            {/* Import box */}
            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-5 mb-6">
              <h2 className="text-sm font-medium mb-3">Import from JSON</h2>
              <textarea
                value={jsonInput}
                onChange={e => setJsonInput(e.target.value)}
                placeholder='[{"slug": "...", "motherQuestion": "...", "shortAnswer": "...", "blocks": [...], "faqs": [...], "sources": [...]}]'
                rows={8}
                className="w-full border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 text-xs font-mono bg-white dark:bg-gray-900 focus:outline-none focus:border-brand-500 mb-3"
              />
              <button
                onClick={importArticles}
                disabled={importing || !jsonInput.trim()}
                className="bg-brand-500 text-white rounded-xl px-5 py-2 text-sm font-medium hover:bg-brand-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                {importing ? 'Importing…' : 'Import articles'}
              </button>
            </div>

            {/* Search */}
            <div className="flex gap-3 mb-4">
              <input
                placeholder="Search by title or slug..."
                value={articleSearch}
                onChange={e => { setArticleSearch(e.target.value); setArticlePage(1); }}
                className="flex-1 min-w-48 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-2 text-sm bg-white dark:bg-gray-900 focus:outline-none focus:border-brand-500"
              />
            </div>

            {/* Category tag filter row */}
            <div className="flex flex-wrap gap-2 mb-5">
              <button
                onClick={() => { setArticleCategoryFilter(null); setArticlePage(1); }}
                className={'text-xs px-3 py-1.5 rounded-full font-medium border transition-colors ' + (
                  articleCategoryFilter === null
                    ? 'bg-brand-500 border-brand-500 text-white'
                    : 'border-gray-200 dark:border-gray-700 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800'
                )}>
                All
              </button>
              {topLevelCategories.map(c => (
                <button
                  key={c.id}
                  onClick={() => { setArticleCategoryFilter(prev => prev === c.id ? null : c.id); setArticlePage(1); }}
                  className={'text-xs px-3 py-1.5 rounded-full font-medium border transition-colors ' + (
                    articleCategoryFilter === c.id
                      ? 'bg-brand-500 border-brand-500 text-white'
                      : 'border-gray-200 dark:border-gray-700 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800'
                  )}>
                  {c.emoji} {c.name}
                </button>
              ))}
            </div>

            {/* Article list */}
            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
                  <tr>
                    <SortableTh label="Title / Slug" sortKey="title" sort={articleSort} onSort={onArticleSort} />
                    <SortableTh label="Status" sortKey="status" sort={articleSort} onSort={onArticleSort} />
                    <SortableTh label="Category" sortKey="category" sort={articleSort} onSort={onArticleSort} />
                    <SortableTh label="Subcategory" sortKey="subcategory" sort={articleSort} onSort={onArticleSort} />
                    <SortableTh label="Reviewer" sortKey={null} sort={articleSort} onSort={onArticleSort} />
                    <SortableTh label="SEO" sortKey="seoScore" sort={articleSort} onSort={onArticleSort} />
                    <SortableTh label="Actions" sortKey={null} sort={articleSort} onSort={onArticleSort} />
                  </tr>
                </thead>
                <tbody>
                  {pagedArticles.map(a => {
                  const seo = computeSeoScore(a);
                  const seoOpen = expandedSeoId === a.id;
                  return (
                  <Fragment key={a.id}>
                    <tr key={a.id} className="border-b border-gray-100 dark:border-gray-800 last:border-0 hover:bg-gray-50 dark:hover:bg-gray-800/30">
                      <td className="px-4 py-3">
                        <a href={'/questions/' + a.slug} target="_blank" className="font-medium hover:text-brand-500 transition-colors">{a.title}</a>
                        <p className="text-xs text-gray-400 mt-0.5">/{a.slug}</p>
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => togglePublish(a.id, a.status)}
                          disabled={savingRow === a.id}
                          title={a.status === 'published' && a.publishedAt ? 'Published ' + new Date(a.publishedAt).toLocaleDateString() : 'Click to publish'}
                          className={'flex items-center gap-1.5 text-xs px-2 py-1 rounded-full font-medium transition-colors disabled:opacity-50 ' + (a.status === 'published' ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 hover:bg-green-200' : 'bg-gray-100 dark:bg-gray-800 text-gray-500 hover:bg-gray-200')}>
                          <span className={'w-2 h-2 rounded-full ' + (a.status === 'published' ? 'bg-green-500' : 'bg-gray-400')} />
                          {a.status === 'published' ? 'Published' : 'Draft'}
                        </button>
                      </td>
                      <td className="px-4 py-3">
                        <select
                          value={a.categoryId ?? ''}
                          onChange={e => updateRowCategory(a.id, e.target.value)}
                          className="text-xs border border-gray-200 dark:border-gray-700 rounded-lg px-2 py-1 bg-white dark:bg-gray-900 focus:outline-none">
                          <option value="">— none —</option>
                          {topLevelCategories.map(c => (
                            <option key={c.id} value={c.id}>{c.emoji} {c.name}</option>
                          ))}
                        </select>
                      </td>
                      <td className="px-4 py-3">
                        <select
                          value={a.subcategoryId ?? ''}
                          onChange={e => updateRowSubcategory(a.id, e.target.value)}
                          disabled={!a.categoryId}
                          className="text-xs border border-gray-200 dark:border-gray-700 rounded-lg px-2 py-1 bg-white dark:bg-gray-900 focus:outline-none disabled:opacity-40">
                          <option value="">— none —</option>
                          {subcategoriesFor(a.categoryId).map(c => (
                            <option key={c.id} value={c.id}>{c.emoji} {c.name}</option>
                          ))}
                        </select>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-col gap-1">
                          <select
                            value={a.reviewerId ?? ''}
                            onChange={e => updateRowReviewer(a.id, e.target.value)}
                            className="text-xs border border-gray-200 dark:border-gray-700 rounded-lg px-2 py-1 bg-white dark:bg-gray-900 focus:outline-none">
                            <option value="">— N/A —</option>
                            {reviewerOptionsFor(a.reviewerId).map(r => (
                              <option key={r.id} value={r.id}>{r.name}{r.credentials ? `, ${r.credentials}` : ''}</option>
                            ))}
                          </select>
                          <label className="flex items-center gap-1.5 text-xs text-gray-400">
                            <input
                              type="checkbox"
                              checked={!!a.reviewEnabled}
                              disabled={!a.reviewerId}
                              onChange={e => updateRowReviewEnabled(a.id, e.target.checked)}
                            />
                            Show publicly
                          </label>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => setExpandedSeoId(seoOpen ? null : a.id)}
                          title="Click for SEO details"
                          className="flex items-center gap-1.5 text-xs font-bold px-2 py-1 rounded-full transition-colors"
                          style={{ color: seoScoreColor(seo.score), background: seoScoreColor(seo.score) + '1a', border: '1px solid ' + seoScoreColor(seo.score) + '40' }}>
                          {seo.score}%
                          <span style={{ fontSize: 9 }}>{seoOpen ? '▲' : '▼'}</span>
                        </button>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => saveArticleCategory(a.id, a.categoryId, a.subcategoryId, a.reviewerId, a.reviewEnabled)}
                            disabled={savingRow === a.id}
                            className="text-xs text-brand-500 hover:bg-brand-50 dark:hover:bg-brand-900/20 px-2 py-1 rounded-lg transition-colors disabled:opacity-50">
                            {savingRow === a.id ? 'Saving…' : 'Save'}
                          </button>
                          <button
                            onClick={() => downloadArticleJson(a)}
                            title="Download this article's JSON"
                            className="text-xs text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 px-2 py-1 rounded-lg transition-colors flex items-center gap-1">
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                            JSON
                          </button>
                          <button
                            onClick={() => deleteArticle(a.id, a.title)}
                            className="text-xs text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 px-2 py-1 rounded-lg transition-colors">
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                    {seoOpen && (
                      <tr className="bg-gray-50 dark:bg-gray-800/40 border-b border-gray-100 dark:border-gray-800">
                        <td colSpan={7} className="px-4 py-4">
                          <p className="text-xs font-bold mb-2" style={{ color: seoScoreColor(seo.score) }}>
                            SEO score: {seo.score}% — {seo.score >= 90 ? 'Excellent' : seo.score >= 70 ? 'Needs work' : 'Poor'}
                          </p>
                          <ul className="flex flex-col gap-1.5">
                            {seo.checks.map(c => (
                              <li key={c.label} className="flex items-start gap-2 text-xs">
                                <span className={c.passed ? 'text-green-500' : 'text-red-500'}>{c.passed ? '✓' : '✗'}</span>
                                <span>
                                  <span className="font-medium">{c.label}:</span>{' '}
                                  <span className="text-gray-500">{c.detail}</span>
                                </span>
                              </li>
                            ))}
                          </ul>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                  );
                  })}
                </tbody>
              </table>
              {filteredArticles.length === 0 && (
                <p className="text-center text-gray-400 text-sm py-12">
                  {articleSearch ? 'No articles match your search' : 'No articles yet — import some above'}
                </p>
              )}
            </div>
            <Pagination page={safeArticlePage} totalPages={articleTotalPages} onPageChange={setArticlePage} pageSize={pageSize} onPageSizeChange={n => { setPageSize(n); resetPages(); }} totalItems={filteredArticles.length} />
          </div>
        )}

        {/* SUBSCRIBERS */}
        {tab === 'subscribers' && <SubscribersPanel />}

        {tab === 'apiUsers' && <ApiUsersPanel />}

        {/* LIFE EXPECTANCY DATA */}
        {tab === 'longevity' && <LifeExpectancyPanel />}

        {/* CATEGORIES */}
        {tab === 'categories' && <CategoriesManager />}
        {/* AFFILIATE BANNERS */}
        {tab === 'affiliateBanners' && <AffiliateBannersManager />}
        {tab === 'leadMagnet' && <LeadMagnetManager />}
{tab === 'reviews' && (
  <div>
    <h1 className="text-xl font-medium mb-5">Reviews ({reviewsState.length})</h1>
    <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden">
      <table className="w-full text-sm">
        <thead className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
          <tr>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-400">ID</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-400">Rating</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-400">Title</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-400">Comment</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-400">User</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-400">Created</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-400">Actions</th>
          </tr>
        </thead>
        <tbody>
          {reviewsState.map(r => (
            <tr key={r.id} className="border-b border-gray-100 dark:border-gray-800 last:border-0 hover:bg-gray-50 dark:hover:bg-gray-800/30">
              <td className="px-4 py-3 text-xs text-gray-400">{r.id.slice(0,8)}…</td>
              <td className="px-4 py-3 text-xs text-gray-400">{r.rating}</td>
              <td className="px-4 py-3 text-xs text-gray-400">{r.title ?? '-'}</td>
              <td className="px-4 py-3 text-xs text-gray-400">{r.comment?.length ?? 0 > 0 ? (r.comment.length > 50 ? r.comment.substring(0,50)+'…' : r.comment) : '-'}</td>
              <td className="px-4 py-3 text-xs text-gray-400">{r.userId ?? '(anonymous)'}</td>
              <td className="px-4 py-3 text-xs text-gray-400">{new Date(r.createdAt).toLocaleString()}</td>
              <td className="px-4 py-3 flex items-center gap-2">
                <button
                  onClick={() => {
                    if (confirm('Delete this review?')) {
                      fetch(`/api/admin/reviews/${r.id}`, { method: 'DELETE' })
                        .then(res => {
                          if (res.ok) {
                            setReviewsState(prev => prev.filter(rev => rev.id !== r.id));
                            showToast('Review deleted', '🗑️');
                          } else {
                            showToast('Failed to delete', '⚠️');
                          }
                        })
                        .catch(() => showToast('Network error', '⚠️'));
                    }
                  }}
                  className="text-xs text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 px-2 py-1 rounded-lg transition-colors"
                >
                  Delete
                </button>
              </td>
            </tr>
          ))}
          {reviewsState.length === 0 && (
            <tr>
              <td colSpan="7" className="px-4 py-3 text-center text-gray-400">
                No reviews yet.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  </div>
)}
        {tab === 'reviewers' && <ReviewersManager />}
        {tab === 'calendarEvents' && <CalendarEventsManager />}
        {tab === 'userEvents' && <UserEventsModerationManager />}
        {tab === 'comments' && <CommentsModerationManager />}
        {tab === 'defaultFollow' && <DefaultFollowConfigManager />}

        {/* MY EVENTS */}
        {tab === 'myEvents' && <MyEventsPanel events={myEvents} />}

        {/* WORLD EVENTS */}
        {tab === 'worldEvents' && <WorldPanel isPremium={isPremium} />}

      </main>
    </div>
  );
}