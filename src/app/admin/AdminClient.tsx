// FILE: src/app/admin/AdminClient.tsx
'use client';
import { useState, Fragment } from 'react';
import { useToast, ToastHost } from '@/components/ui/Toast';
import { useTheme } from '@/components/ui/ThemeProvider';
import { CategoriesManager } from '@/components/admin/CategoriesManager';

interface User {
  id: string; name: string | null; email: string | null;
  emailVerified: Date | null; plan: string; role: string;
  createdAt: Date; lastSeen: Date | null;
  _count: { timers: number; sessions: number };
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
}
interface Stats {
  totalUsers: number; verifiedUsers: number; unverifiedUsers: number;
  proUsers: number; freeUsers: number; totalTimers: number; totalEvents: number; totalViews: number;
}
type Tab = 'overview' | 'users' | 'events' | 'articles' | 'categories';

const STAT_COLORS: Record<string, string> = {
  totalUsers: '#534AB7', verifiedUsers: '#1D9E75', unverifiedUsers: '#D85A30',
  proUsers: '#BA7517', freeUsers: '#378ADD', totalTimers: '#D4537E',
  totalEvents: '#639922', totalViews: '#534AB7',
};

const TAB_ICONS: Record<Tab, string> = {
  overview: '📊', users: '👥', events: '📅', articles: '📝', categories: '🗂️',
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
      weight: 10,
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
      weight: 15,
    },
    {
      label: 'FAQ coverage (≥3 questions)',
      passed: faqs.length >= 3,
      detail: faqs.length === 0
        ? 'No FAQ block — add at least 3 FAQs to help long-tail search coverage and FAQPage rich results.'
        : 'Only ' + faqs.length + ' FAQ' + (faqs.length === 1 ? '' : 's') + ' — add more to reach at least 3.',
      weight: 15,
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
      weight: 15,
    },
    {
      label: 'Visual content (chart/graph)',
      passed: hasChart(a),
      detail: hasChart(a) ? 'Chart block present.' : 'No chart block — a supporting chart improves comprehension and dwell time.',
      weight: 10,
    },
    {
      label: 'Content depth (≥600 words)',
      passed: words >= 600,
      detail: words === 0
        ? 'No body content detected.'
        : words < 600
          ? '~' + words + ' words — thin for a competitive query; aim for 600+ across paragraphs/headings.'
          : '~' + words + ' words — solid depth.',
      weight: 15,
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
  users, events, articles, categories, stats,
}: {
  users: User[]; events: EventRow[]; articles: ArticleRow[]; categories: CategoryRow[]; stats: Stats;
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
  const [articleRows, setArticleRows] = useState(articles);
  const [eventRows, setEventRows] = useState(events);
  const [savingRow, setSavingRow] = useState<string | null>(null);
  const [savingEventRow, setSavingEventRow] = useState<string | null>(null);
  const [articleSearch, setArticleSearch] = useState('');
  const [articleCategoryFilter, setArticleCategoryFilter] = useState<string | null>(null);
  const [eventSearch, setEventSearch] = useState('');
  const [pageSize, setPageSize] = useState(10);
  const [userPage, setUserPage] = useState(1);
  const [eventPage, setEventPage] = useState(1);
  const [articlePage, setArticlePage] = useState(1);
  const resetPages = () => { setUserPage(1); setEventPage(1); setArticlePage(1); };

  const [userSort, setUserSort] = useState<SortState | null>(null);
  const [eventSort, setEventSort] = useState<SortState | null>(null);
  const [articleSort, setArticleSort] = useState<SortState | null>(null);
  const onUserSort = (key: string) => { setUserSort(s => toggleSort(s, key)); setUserPage(1); };
  const onEventSort = (key: string) => { setEventSort(s => toggleSort(s, key)); setEventPage(1); };
  const onArticleSort = (key: string) => { setArticleSort(s => toggleSort(s, key)); setArticlePage(1); };
  const [expandedSeoId, setExpandedSeoId] = useState<string | null>(null);

  const topLevelCategories = categories.filter(c => !c.parentId);
  const subcategoriesFor = (parentId: string | null) =>
    parentId ? categories.filter(c => c.parentId === parentId) : [];

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

  async function saveEventCategory(eventId: string, categoryId: string | null, subcategoryId: string | null) {
    setSavingEventRow(eventId);
    try {
      const res = await fetch('/api/admin/events/' + eventId, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ categoryId, subcategoryId }),
      });
      if (res.ok) {
        showToast('Category saved', '💾');
      } else {
        showToast('Could not save category', '⚠️');
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
    try {
      const res = await fetch('/api/admin/events/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(parsed),
      });
      const data = await res.json();
      if (!res.ok) {
        showToast(data.error ?? 'Import failed', '⚠️');
      } else {
        const { updated, failed } = data;
        if (failed && failed.length > 0) {
          showToast(`${updated} updated, ${failed.length} failed`, '⚠️');
          console.error('Import errors:', failed);
        } else {
          showToast(`${updated} updated`, '✅');
          setEventJsonInput('');
        }
        window.location.reload();
      }
    } catch {
      showToast('Network error during import', '⚠️');
    } finally {
      setImportingEvents(false);
    }
  }

  async function saveArticleCategory(articleId: string, categoryId: string | null, subcategoryId: string | null) {
    setSavingRow(articleId);
    try {
      const res = await fetch('/api/admin/articles/' + articleId, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ categoryId, subcategoryId }),
      });
      if (res.ok) {
        showToast('Category saved', '💾');
      } else {
        showToast('Could not save category', '⚠️');
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

  const maxViews = Math.max(...eventRows.map(e => e.views), 1);

  const filteredArticles = articleRows.filter(a => {
    const s = articleSearch.toLowerCase();
    const matchSearch = !s || a.title.toLowerCase().includes(s) || a.slug.toLowerCase().includes(s);
    const matchCategory = !articleCategoryFilter || a.categoryId === articleCategoryFilter;
    return matchSearch && matchCategory;
  });

  const filteredEvents = eventRows.filter(ev => {
    const s = eventSearch.toLowerCase();
    return !s
      || ev.name.toLowerCase().includes(s)
      || ev.slug.toLowerCase().includes(s)
      || (ev.category?.name ?? '').toLowerCase().includes(s)
      || (ev.subcategory?.name ?? '').toLowerCase().includes(s);
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
          <p className="text-xs font-bold uppercase tracking-widest text-amber-600 dark:text-amber-400">Admin Panel</p>
          <p className="text-xs text-gray-400 mt-0.5">{stats.totalUsers} users</p>
        </div>
        {(['overview','users','events','articles','categories'] as Tab[]).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={'w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm mb-0.5 capitalize transition-colors ' + (
              tab === t ? 'bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 font-medium' : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800'
            )}>
            {TAB_ICONS[t]} {t}
          </button>
        ))}
        <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-800">
          <a href="/dashboard" className="block text-xs text-gray-400 hover:text-brand-500 px-2 py-1">← Dashboard</a>
          <a href="/" className="block text-xs text-gray-400 hover:text-brand-500 px-2 py-1">← Home</a>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 p-6 bg-gray-50 dark:bg-gray-950 overflow-auto">

        {/* OVERVIEW */}
        {tab === 'overview' && (
          <div>
            <h1 className="text-xl font-medium mb-6">Platform overview</h1>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
              {(Object.entries(stats) as [string, number][]).map(([key, val]) => (
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
        )}

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
                            <button onClick={() => deleteUser(u.id, u.email ?? '')}
                              className="text-xs text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 px-2 py-1 rounded-lg transition-colors">
                              Delete
                            </button>
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
            <h1 className="text-xl font-medium mb-5">Top event pages by views ({filteredEvents.length}{eventSearch ? ' of ' + events.length : ''})</h1>
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
            </div>
            <div className="flex gap-3 mb-4">
              <input
                placeholder="Search event name, slug, or category..."
                value={eventSearch}
                onChange={e => { setEventSearch(e.target.value); setEventPage(1); }}
                className="flex-1 min-w-48 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-2 text-sm bg-white dark:bg-gray-900 focus:outline-none focus:border-brand-500"
              />
            </div>
            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
                  <tr>
                    <SortableTh label="#" sortKey={null} sort={eventSort} onSort={onEventSort} />
                    <SortableTh label="Event" sortKey="event" sort={eventSort} onSort={onEventSort} />
                    <SortableTh label="Category" sortKey="category" sort={eventSort} onSort={onEventSort} />
                    <SortableTh label="Subcategory" sortKey="subcategory" sort={eventSort} onSort={onEventSort} />
                    <SortableTh label="Target date" sortKey="targetDate" sort={eventSort} onSort={onEventSort} />
                    <SortableTh label="Views" sortKey="views" sort={eventSort} onSort={onEventSort} />
                    <SortableTh label="SEO" sortKey="seoScore" sort={eventSort} onSort={onEventSort} />
                    <SortableTh label="Actions" sortKey={null} sort={eventSort} onSort={onEventSort} />
                  </tr>
                </thead>
                <tbody>
                  {pagedEvents.map((ev, i) => (
                    <tr key={ev.id} className="border-b border-gray-100 dark:border-gray-800 last:border-0 hover:bg-gray-50 dark:hover:bg-gray-800/30">
                      <td className="px-4 py-3 text-gray-400 text-xs font-medium w-8">{i + 1}</td>
                      <td className="px-4 py-3">
                        <a href={'/how-long-until-' + ev.slug} target="_blank" className="font-medium hover:text-brand-500 transition-colors">{ev.name}</a>
                        <p className="text-xs text-gray-400 mt-0.5">/how-long-until-{ev.slug}</p>
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
                      <td className="px-4 py-3 text-xs text-gray-400">{new Date(ev.targetDate).toLocaleDateString()}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="h-1.5 w-24 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                            <div className="h-full bg-brand-500 rounded-full" style={{ width: Math.min(100, (ev.views / maxViews) * 100) + '%' }} />
                          </div>
                          <span className="text-xs font-medium text-brand-500">{ev.views.toLocaleString()}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        {(() => { const seo = computeEventSeoScore(ev); return (
                          <span className="text-xs font-bold px-2 py-1 rounded-lg"
                            style={{ color: seoScoreColor(seo.score), background: seoScoreColor(seo.score) + '1a', border: '1px solid ' + seoScoreColor(seo.score) + '40' }}>
                            {seo.score}%
                          </span>
                        ); })()}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => saveEventCategory(ev.id, ev.categoryId, ev.subcategoryId)}
                            disabled={savingEventRow === ev.id}
                            className="text-xs text-brand-500 hover:bg-brand-50 dark:hover:bg-brand-900/20 px-2 py-1 rounded-lg transition-colors disabled:opacity-50">
                            {savingEventRow === ev.id ? 'Saving…' : 'Save'}
                          </button>
                          <button onClick={() => deleteEvent(ev.id, ev.name)}
                            className="text-xs text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 px-2 py-1 rounded-lg transition-colors">
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
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
                        <a href={'/tools/questions/' + a.slug} target="_blank" className="font-medium hover:text-brand-500 transition-colors">{a.title}</a>
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
                            onClick={() => saveArticleCategory(a.id, a.categoryId, a.subcategoryId)}
                            disabled={savingRow === a.id}
                            className="text-xs text-brand-500 hover:bg-brand-50 dark:hover:bg-brand-900/20 px-2 py-1 rounded-lg transition-colors disabled:opacity-50">
                            {savingRow === a.id ? 'Saving…' : 'Save'}
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
                        <td colSpan={6} className="px-4 py-4">
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

        {/* CATEGORIES */}
        {tab === 'categories' && <CategoriesManager />}

      </main>
    </div>
  );
}