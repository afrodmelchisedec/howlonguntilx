// FILE: src/components/community/EventSubmitForm.tsx
'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useToast, ToastHost } from '@/components/ui/Toast';

interface SubCategory { id: string; name: string; emoji: string }
interface CategoryWithChildren { id: string; name: string; emoji: string; children: SubCategory[] }

interface Props {
  categories: CategoryWithChildren[];
  plan: string;
  eventId?: string;
  initialValues?: {
    title: string;
    description: string;
    targetDate: string;
    visibility: 'PUBLIC' | 'PRIVATE';
    categoryId: string;
  };
}

const DESCRIPTION_MAX = 300;

export function EventSubmitForm({ categories, plan, eventId, initialValues }: Props) {
  const isEdit = Boolean(eventId);
  const router = useRouter();
  const { toast, showToast } = useToast();

  const [title, setTitle] = useState(initialValues?.title ?? '');
  const [description, setDescription] = useState(initialValues?.description ?? '');
  const [targetDate, setTargetDate] = useState(initialValues?.targetDate ?? '');
  const [visibility, setVisibility] = useState<'PUBLIC' | 'PRIVATE'>(initialValues?.visibility ?? 'PUBLIC');
  const [categoryId, setCategoryId] = useState(initialValues?.categoryId ?? '');
  const [submitting, setSubmitting] = useState(false);

  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const imageCap = plan === 'PRO' ? 4 : 1;

  function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    const incoming = Array.from(files).slice(0, imageCap);
    if (files.length > imageCap) {
      showToast(
        plan === 'PRO' ? `You can add up to ${imageCap} photos` : 'You need Pro to add more photos',
        plan === 'PRO' ? '📷' : 'star'
      );
    }
    setImageFiles(incoming);
    setImagePreviews(incoming.map(f => URL.createObjectURL(f)));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return showToast('Title is required', '⚠️');
    if (!targetDate) return showToast('Pick a target date', '⚠️');

    setSubmitting(true);
    try {
      const res = await fetch(isEdit ? `/api/user-events/${eventId}` : '/api/user-events', {
        method: isEdit ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim(),
          targetDate: new Date(targetDate).toISOString(),
          visibility,
          categoryId: categoryId || undefined,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        showToast(typeof data.error === 'string' ? data.error : `Could not ${isEdit ? 'update' : 'create'} event`, '⚠️');
        return;
      }

      // Event created — now upload any selected images against the real
      // event id. A failed upload here shouldn't block the redirect; the
      // event already exists and is valid without images, so we surface
      // a toast and continue rather than stranding the user on the form.
      const targetId = isEdit ? eventId! : data.id;
      let uploadFailedMessage: string | null = null;
      if (imageFiles.length > 0) {
        const uploadForm = new FormData();
        for (const file of imageFiles) uploadForm.append('images', file);
        const uploadRes = await fetch(`/api/user-events/${targetId}/upload`, {
          method: 'POST',
          body: uploadForm,
        });
        if (!uploadRes.ok) {
          const uploadData = await uploadRes.json().catch(() => ({}));
          uploadFailedMessage = typeof uploadData.error === 'string' ? uploadData.error : `Event ${isEdit ? 'updated' : 'created'}, but image upload failed`;
        }
      }

      showToast(uploadFailedMessage ?? (isEdit ? 'Event updated' : 'Event created'), uploadFailedMessage ? '⚠️' : '✅');
      if (isEdit) {
        router.push('/dashboard/events');
      } else {
        router.push(`/community/how-long-until-${data.slug}`);
      }
    } catch {
      showToast('Network error — please try again', '⚠️');
    } finally {
      setSubmitting(false);
    }
  }

  const descCount = description.length;
  const descOver = descCount > DESCRIPTION_MAX;

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <ToastHost toast={toast} />

      <div>
        <label className="block text-[11px] text-gray-400 mb-1">Title</label>
        <input
          value={title}
          onChange={e => setTitle(e.target.value)}
          placeholder="Sarah's Wedding"
          maxLength={100}
          className="w-full border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-900 focus:outline-none"
        />
        {title.trim() && (
          <p className="text-[11px] text-gray-400 mt-1">Will show as "How long until {title.trim()}?"</p>
        )}
      </div>

      <div>
        <label className="block text-[11px] text-gray-400 mb-1">Description</label>
        <textarea
          value={description}
          onChange={e => setDescription(e.target.value)}
          rows={3}
          className={`w-full border rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-900 focus:outline-none ${descOver ? 'border-red-400' : 'border-gray-200 dark:border-gray-700'}`}
        />
        <p className={`text-[11px] mt-1 ${descOver ? 'text-red-500' : 'text-gray-400'}`}>
          {descCount}/{DESCRIPTION_MAX}
        </p>
      </div>

      <div className="flex gap-4">
        <div className="flex-1">
          <label className="block text-[11px] text-gray-400 mb-1">Target date</label>
          <input
            type="datetime-local"
            value={targetDate}
            onChange={e => setTargetDate(e.target.value)}
            className="w-full border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-900 focus:outline-none"
          />
        </div>
        <div className="flex-1">
          <label className="block text-[11px] text-gray-400 mb-1">Visibility</label>
          <select
            value={visibility}
            onChange={e => setVisibility(e.target.value as 'PUBLIC' | 'PRIVATE')}
            className="w-full border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-900 focus:outline-none"
          >
            <option value="PUBLIC">Public — shows in the community feed</option>
            <option value="PRIVATE">Private — only visible to you</option>
          </select>
        </div>
      </div>

      <div>
        <label className="block text-[11px] text-gray-400 mb-1">Category</label>
        <select
          value={categoryId}
          onChange={e => setCategoryId(e.target.value)}
          className="w-full border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-900 focus:outline-none"
        >
          <option value="">— none —</option>
          {categories.map(cat => (
            <optgroup key={cat.id} label={`${cat.emoji} ${cat.name}`}>
              <option value={cat.id}>{cat.emoji} {cat.name} (general)</option>
              {cat.children.map(sub => (
                <option key={sub.id} value={sub.id}>{sub.emoji} {sub.name}</option>
              ))}
            </optgroup>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-[11px] text-gray-400 mb-1">
          Photos ({imageCap} max on your plan)
        </label>
        <div className="border border-dashed border-gray-300 dark:border-gray-700 rounded-lg p-4 text-center">
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            multiple={imageCap > 1}
            onChange={e => handleFiles(e.target.files)}
            className="text-xs"
          />
          {imagePreviews.length > 0 && (
            <div className="flex gap-2 mt-3 justify-center flex-wrap">
              {imagePreviews.map((src, i) => (
                <img key={i} src={src} alt="" className="w-16 h-16 object-cover rounded-lg" />
              ))}
            </div>
          )}
          <p className="text-[10px] text-gray-400 mt-2">
            JPEG, PNG, WebP, or GIF — 5MB max per image.
          </p>
        </div>
      </div>

      <button
        type="submit"
        disabled={submitting}
        className="w-full bg-brand-500 text-white rounded-lg px-4 py-2.5 text-sm font-medium hover:bg-brand-600 transition-colors disabled:opacity-50"
      >
        {submitting ? 'Creating…' : 'Create event'}
      </button>
    </form>
  );
}
