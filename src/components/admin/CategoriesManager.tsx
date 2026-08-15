// FILE: src/components/admin/CategoriesManager.tsx
'use client';
import { useEffect, useState } from 'react';
import { useToast, ToastHost } from '@/components/ui/Toast';
import { TOOLS } from '@/app/tools/toolsData';

interface ToolMapping { slug: string; label: string; path: string }
interface CategoryCounts {
  events: number; eventsAsSubcategory: number;
  articlesAsCategory: number; articlesAsSubcategory: number;
  children: number;
}
interface SubcategoryRow {
  id: string; slug: string; name: string; emoji: string; description: string;
  parentId: string | null; tools: ToolMapping[]; _count: CategoryCounts;
}
interface CategoryTreeRow extends SubcategoryRow {
  children: SubcategoryRow[];
}

// A category is "in use" if anything still points at it — used to decide
// whether Delete needs a reassignment target first.
function refCount(c: SubcategoryRow) {
  return c._count.children + c._count.events + c._count.eventsAsSubcategory + c._count.articlesAsCategory + c._count.articlesAsSubcategory;
}

function EmptyToolRow() {
  return <p className="text-xs text-gray-400 italic">No tools mapped yet</p>;
}

export function CategoriesManager() {
  const [tree, setTree] = useState<CategoryTreeRow[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast, showToast } = useToast();

  // New top-level category form
  const [newCatOpen, setNewCatOpen] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [newCatEmoji, setNewCatEmoji] = useState('');
  const [newCatDesc, setNewCatDesc] = useState('');

  // New subcategory form — keyed by parent id
  const [newSubFor, setNewSubFor] = useState<string | null>(null);
  const [newSubName, setNewSubName] = useState('');
  const [newSubEmoji, setNewSubEmoji] = useState('');

  // Inline edit state — keyed by category id
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editEmoji, setEditEmoji] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [editSlug, setEditSlug] = useState('');

  // Tool editor — keyed by subcategory id, holds the working (unsaved) tools array
  const [toolDrafts, setToolDrafts] = useState<Record<string, ToolMapping[]>>({});
  const [toolFormFor, setToolFormFor] = useState<string | null>(null);
  const [toolPickerSlug, setToolPickerSlug] = useState('');

  // Delete-with-reassignment prompt
  const [deleteTarget, setDeleteTarget] = useState<SubcategoryRow | null>(null);
  const [reassignTo, setReassignTo] = useState('');

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/categories');
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        setError(`Failed to load (HTTP ${res.status}): ${data?.error ?? 'unknown error — check the dev server terminal for a stack trace'}`);
        return;
      }
      setTree(data.categories ?? []);
      const drafts: Record<string, ToolMapping[]> = {};
      for (const c of data.categories ?? []) {
        for (const s of c.children ?? []) drafts[s.id] = s.tools ?? [];
      }
      setToolDrafts(drafts);
    } catch (e) {
      setError(e instanceof Error ? `Network error: ${e.message}` : 'Network error');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  function startEdit(c: SubcategoryRow) {
    setEditingId(c.id);
    setEditName(c.name);
    setEditEmoji(c.emoji);
    setEditDesc(c.description ?? '');
    setEditSlug(c.slug);
  }

  async function saveEdit(id: string) {
    const res = await fetch(`/api/admin/categories/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: editName, emoji: editEmoji, description: editDesc, slug: editSlug }),
    });
    if (res.ok) {
      showToast('Saved', '💾');
      setEditingId(null);
      load();
    } else {
      const data = await res.json().catch(() => ({}));
      showToast(data.error ?? 'Could not save', '⚠️');
    }
  }

  async function createTopLevel() {
    if (!newCatName.trim() || !newCatEmoji.trim()) {
      showToast('Name and emoji are required', '⚠️');
      return;
    }
    const res = await fetch('/api/admin/categories', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: newCatName, emoji: newCatEmoji, description: newCatDesc }),
    });
    if (res.ok) {
      showToast('Category created', '✅');
      setNewCatName(''); setNewCatEmoji(''); setNewCatDesc(''); setNewCatOpen(false);
      load();
    } else {
      const data = await res.json().catch(() => ({}));
      showToast(data.error ?? 'Could not create category', '⚠️');
    }
  }

  async function createSubcategory(parentId: string) {
    if (!newSubName.trim() || !newSubEmoji.trim()) {
      showToast('Name and emoji are required', '⚠️');
      return;
    }
    const res = await fetch('/api/admin/categories', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: newSubName, emoji: newSubEmoji, parentId }),
    });
    if (res.ok) {
      showToast('Subcategory created', '✅');
      setNewSubName(''); setNewSubEmoji(''); setNewSubFor(null);
      load();
    } else {
      const data = await res.json().catch(() => ({}));
      showToast(data.error ?? 'Could not create subcategory', '⚠️');
    }
  }

  function addToolToDraft(subId: string) {
    if (!toolPickerSlug) {
      showToast('Choose a tool first', '⚠️');
      return;
    }
    const tool = TOOLS.find(t => t.slug === toolPickerSlug);
    if (!tool) {
      showToast('That tool could not be found', '⚠️');
      return;
    }
    setToolDrafts(d => ({
      ...d,
      [subId]: [...(d[subId] ?? []), { slug: tool.slug, label: tool.title, path: `/tools/${tool.slug}` }],
    }));
    setToolPickerSlug(''); setToolFormFor(null);
  }

  function removeToolFromDraft(subId: string, toolSlugToRemove: string) {
    setToolDrafts(d => ({ ...d, [subId]: (d[subId] ?? []).filter(t => t.slug !== toolSlugToRemove) }));
  }

  async function saveTools(subId: string) {
    const res = await fetch(`/api/admin/categories/${subId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tools: toolDrafts[subId] ?? [] }),
    });
    if (res.ok) {
      showToast('Tool mapping saved', '💾');
      load();
    } else {
      showToast('Could not save tools', '⚠️');
    }
  }

  async function confirmDelete(c: SubcategoryRow, reassign?: string) {
    const url = `/api/admin/categories/${c.id}` + (reassign ? `?reassignTo=${reassign}` : '');
    const res = await fetch(url, { method: 'DELETE' });
    if (res.status === 409) {
      setDeleteTarget(c);
      return;
    }
    if (res.ok) {
      showToast('Deleted', '🗑️');
      setDeleteTarget(null);
      setReassignTo('');
      load();
    } else {
      showToast('Could not delete', '⚠️');
    }
  }

  if (loading) {
    return <div className="text-sm text-gray-400 py-8 text-center">Loading categories…</div>;
  }

  if (error || !tree) {
    return (
      <div className="text-sm text-center py-8">
        <p className="text-red-500 mb-2">⚠️ {error ?? 'Could not load categories'}</p>
        <button onClick={load} className="text-xs bg-brand-500 text-white rounded-lg px-3 py-1.5 font-medium hover:bg-brand-600 transition-colors">
          Retry
        </button>
      </div>
    );
  }

  // Tools already mapped anywhere in the tree (across the current working
  // drafts, not just what's saved) — excluded from the picker so the same
  // tool can't accidentally end up mapped to two categories at once.
  const mappedToolSlugs = new Set(Object.values(toolDrafts).flat().map(t => t.slug));
  const availableTools = TOOLS.filter(t => !mappedToolSlugs.has(t.slug));

  // Flat list of all categories at the same "level" as the delete target, for the reassignment dropdown.
  const reassignOptions = deleteTarget
    ? (deleteTarget.parentId
        ? tree.find(c => c.id === deleteTarget.parentId)?.children.filter(s => s.id !== deleteTarget.id) ?? []
        : tree.filter(c => c.id !== deleteTarget.id))
    : [];

  return (
    <div>
      <ToastHost toast={toast} />
      <div className="flex items-center justify-between mb-5">
        <h1 className="text-xl font-medium">Categories & tools ({tree.length} top-level)</h1>
        <button
          onClick={() => setNewCatOpen(v => !v)}
          className="text-xs bg-brand-500 text-white rounded-lg px-3 py-1.5 font-medium hover:bg-brand-600 transition-colors">
          + New category
        </button>
      </div>

      {newCatOpen && (
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-4 mb-5 flex flex-wrap gap-2 items-end">
          <div>
            <label className="block text-[11px] text-gray-400 mb-1">Emoji</label>
            <input value={newCatEmoji} onChange={e => setNewCatEmoji(e.target.value)} placeholder="🎯" className="w-16 border border-gray-200 dark:border-gray-700 rounded-lg px-2 py-1.5 text-sm bg-white dark:bg-gray-900 focus:outline-none" />
          </div>
          <div className="flex-1 min-w-40">
            <label className="block text-[11px] text-gray-400 mb-1">Name</label>
            <input value={newCatName} onChange={e => setNewCatName(e.target.value)} placeholder="Category name" className="w-full border border-gray-200 dark:border-gray-700 rounded-lg px-2 py-1.5 text-sm bg-white dark:bg-gray-900 focus:outline-none" />
          </div>
          <div className="flex-1 min-w-48">
            <label className="block text-[11px] text-gray-400 mb-1">Description</label>
            <input value={newCatDesc} onChange={e => setNewCatDesc(e.target.value)} placeholder="Short description" className="w-full border border-gray-200 dark:border-gray-700 rounded-lg px-2 py-1.5 text-sm bg-white dark:bg-gray-900 focus:outline-none" />
          </div>
          <button onClick={createTopLevel} className="text-xs bg-brand-500 text-white rounded-lg px-3 py-1.5 font-medium hover:bg-brand-600 transition-colors">Create</button>
        </div>
      )}

      <div className="space-y-4">
        {tree.map(cat => (
          <div key={cat.id} className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden">
            {/* Top-level category header */}
            <div className="flex items-center justify-between px-4 py-3 bg-gray-50 dark:bg-gray-800/60 border-b border-gray-200 dark:border-gray-700">
              {editingId === cat.id ? (
                <div className="flex flex-wrap gap-2 items-center flex-1">
                  <input value={editEmoji} onChange={e => setEditEmoji(e.target.value)} className="w-12 border border-gray-200 dark:border-gray-700 rounded-lg px-2 py-1 text-sm bg-white dark:bg-gray-900 focus:outline-none" />
                  <input value={editName} onChange={e => setEditName(e.target.value)} className="border border-gray-200 dark:border-gray-700 rounded-lg px-2 py-1 text-sm bg-white dark:bg-gray-900 focus:outline-none" />
                  <div className="flex flex-col">
                    <input
                      value={editSlug}
                      onChange={e => setEditSlug(e.target.value)}
                      placeholder="slug"
                      className="border border-amber-300 dark:border-amber-700 rounded-lg px-2 py-1 text-sm bg-white dark:bg-gray-900 focus:outline-none w-36" />
                    <span className="text-[10px] text-amber-500 mt-0.5">changes URLs & sitemap chunk</span>
                  </div>
                  <input value={editDesc} onChange={e => setEditDesc(e.target.value)} placeholder="Description" className="flex-1 min-w-32 border border-gray-200 dark:border-gray-700 rounded-lg px-2 py-1 text-sm bg-white dark:bg-gray-900 focus:outline-none" />
                  <button onClick={() => saveEdit(cat.id)} className="text-xs text-brand-500 hover:bg-brand-50 dark:hover:bg-brand-900/20 px-2 py-1 rounded-lg">Save</button>
                  <button onClick={() => setEditingId(null)} className="text-xs text-gray-400 px-2 py-1">Cancel</button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <span className="text-lg">{cat.emoji}</span>
                  <div>
                    <p className="text-sm font-medium">{cat.name} <span className="text-[10px] text-gray-400 font-normal">/{cat.slug}</span></p>
                    <p className="text-xs text-gray-400">{cat.description}</p>
                  </div>
                </div>
              )}
              {editingId !== cat.id && (
                <div className="flex items-center gap-2">
                  <button onClick={() => setNewSubFor(v => v === cat.id ? null : cat.id)} className="text-xs text-brand-500 hover:bg-brand-50 dark:hover:bg-brand-900/20 px-2 py-1 rounded-lg">+ Subcategory</button>
                  <button onClick={() => startEdit(cat)} className="text-xs text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 px-2 py-1 rounded-lg">Edit</button>
                  <button onClick={() => confirmDelete(cat)} className="text-xs text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 px-2 py-1 rounded-lg">Delete</button>
                </div>
              )}
            </div>

            {newSubFor === cat.id && (
              <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-800 flex flex-wrap gap-2 items-end bg-gray-50/50 dark:bg-gray-800/20">
                <div>
                  <label className="block text-[11px] text-gray-400 mb-1">Emoji</label>
                  <input value={newSubEmoji} onChange={e => setNewSubEmoji(e.target.value)} placeholder="🔧" className="w-16 border border-gray-200 dark:border-gray-700 rounded-lg px-2 py-1.5 text-sm bg-white dark:bg-gray-900 focus:outline-none" />
                </div>
                <div className="flex-1 min-w-40">
                  <label className="block text-[11px] text-gray-400 mb-1">Subcategory name</label>
                  <input value={newSubName} onChange={e => setNewSubName(e.target.value)} className="w-full border border-gray-200 dark:border-gray-700 rounded-lg px-2 py-1.5 text-sm bg-white dark:bg-gray-900 focus:outline-none" />
                </div>
                <button onClick={() => createSubcategory(cat.id)} className="text-xs bg-brand-500 text-white rounded-lg px-3 py-1.5 font-medium hover:bg-brand-600 transition-colors">Create</button>
              </div>
            )}

            {/* Subcategories */}
            <div className="divide-y divide-gray-100 dark:divide-gray-800">
              {cat.children.map(sub => (
                <div key={sub.id} className="px-4 py-3 pl-8">
                  <div className="flex items-center justify-between mb-2">
                    {editingId === sub.id ? (
                      <div className="flex flex-wrap gap-2 items-center flex-1">
                        <input value={editEmoji} onChange={e => setEditEmoji(e.target.value)} className="w-12 border border-gray-200 dark:border-gray-700 rounded-lg px-2 py-1 text-sm bg-white dark:bg-gray-900 focus:outline-none" />
                        <input value={editName} onChange={e => setEditName(e.target.value)} className="border border-gray-200 dark:border-gray-700 rounded-lg px-2 py-1 text-sm bg-white dark:bg-gray-900 focus:outline-none" />
                        <input
                          value={editSlug}
                          onChange={e => setEditSlug(e.target.value)}
                          placeholder="slug"
                          className="border border-amber-300 dark:border-amber-700 rounded-lg px-2 py-1 text-sm bg-white dark:bg-gray-900 focus:outline-none w-32" />
                        <button onClick={() => saveEdit(sub.id)} className="text-xs text-brand-500 hover:bg-brand-50 dark:hover:bg-brand-900/20 px-2 py-1 rounded-lg">Save</button>
                        <button onClick={() => setEditingId(null)} className="text-xs text-gray-400 px-2 py-1">Cancel</button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <span>{sub.emoji}</span>
                        <p className="text-sm">{sub.name} <span className="text-[10px] text-gray-400">/{sub.slug}</span></p>
                        <span className="text-[10px] text-gray-400">
                          {refCount(sub) > 0 ? `${refCount(sub)} in use` : 'unused'}
                        </span>
                      </div>
                    )}
                    {editingId !== sub.id && (
                      <div className="flex items-center gap-2">
                        <button onClick={() => startEdit(sub)} className="text-xs text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 px-2 py-1 rounded-lg">Edit</button>
                        <button onClick={() => confirmDelete(sub)} className="text-xs text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 px-2 py-1 rounded-lg">Delete</button>
                      </div>
                    )}
                  </div>

                  {/* Tool mapping */}
                  <div className="ml-6 bg-gray-50 dark:bg-gray-800/40 rounded-lg p-3">
                    <div className="flex flex-wrap gap-2 mb-2">
                      {(toolDrafts[sub.id] ?? []).map(t => (
                        <span key={t.slug} className="flex items-center gap-1 text-xs bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-full pl-2.5 pr-1 py-1">
                          <a href={t.path} target="_blank" className="hover:text-brand-500">{t.label}</a>
                          <button onClick={() => removeToolFromDraft(sub.id, t.slug)} className="text-gray-400 hover:text-red-500 px-1">×</button>
                        </span>
                      ))}
                      {(toolDrafts[sub.id] ?? []).length === 0 && <EmptyToolRow />}
                    </div>

                    {toolFormFor === sub.id ? (
                      <div className="flex flex-wrap gap-2 items-end">
                        <div className="flex flex-col">
                          <select
                            value={toolPickerSlug}
                            onChange={e => setToolPickerSlug(e.target.value)}
                            className="border border-gray-200 dark:border-gray-700 rounded-lg px-2 py-1 text-xs bg-white dark:bg-gray-900 focus:outline-none w-64">
                            <option value="">— choose a tool —</option>
                            {availableTools.map(t => (
                              <option key={t.slug} value={t.slug}>{t.title}</option>
                            ))}
                          </select>
                          {availableTools.length === 0 && (
                            <span className="text-[10px] text-gray-400 mt-0.5">Every tool is already mapped somewhere</span>
                          )}
                        </div>
                        <button
                          onClick={() => addToolToDraft(sub.id)}
                          disabled={!toolPickerSlug}
                          className="text-xs bg-brand-500 text-white rounded-lg px-2 py-1 font-medium hover:bg-brand-600 transition-colors disabled:opacity-50">
                          Add
                        </button>
                        <button onClick={() => { setToolFormFor(null); setToolPickerSlug(''); }} className="text-xs text-gray-400 px-2 py-1">Cancel</button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <button onClick={() => setToolFormFor(sub.id)} className="text-xs text-brand-500 hover:bg-brand-50 dark:hover:bg-brand-900/20 px-2 py-1 rounded-lg">+ Add tool</button>
                        <button onClick={() => saveTools(sub.id)} className="text-xs text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 px-2 py-1 rounded-lg">Save mapping</button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
              {cat.children.length === 0 && (
                <p className="px-4 py-3 pl-8 text-xs text-gray-400 italic">No subcategories yet</p>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Reassignment prompt when delete is blocked */}
      {deleteTarget && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" onClick={() => setDeleteTarget(null)}>
          <div onClick={e => e.stopPropagation()} className="bg-white dark:bg-gray-900 rounded-xl p-5 max-w-sm w-full mx-4">
            <p className="text-sm font-medium mb-1">"{deleteTarget.name}" is still in use</p>
            <p className="text-xs text-gray-400 mb-3">
              {refCount(deleteTarget)} item(s) reference this category. Choose where to move them before deleting, or cancel and reassign manually first.
            </p>
            <select value={reassignTo} onChange={e => setReassignTo(e.target.value)} className="w-full border border-gray-200 dark:border-gray-700 rounded-lg px-2 py-1.5 text-sm bg-white dark:bg-gray-900 focus:outline-none mb-3">
              <option value="">— choose a replacement —</option>
              {reassignOptions.map(o => <option key={o.id} value={o.id}>{o.emoji} {o.name}</option>)}
            </select>
            <div className="flex justify-end gap-2">
              <button onClick={() => setDeleteTarget(null)} className="text-xs text-gray-400 px-3 py-1.5">Cancel</button>
              <button
                disabled={!reassignTo}
                onClick={() => confirmDelete(deleteTarget, reassignTo)}
                className="text-xs bg-red-500 text-white rounded-lg px-3 py-1.5 font-medium hover:bg-red-600 transition-colors disabled:opacity-50">
                Reassign & delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
