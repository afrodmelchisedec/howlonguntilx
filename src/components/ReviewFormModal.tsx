// FILE: src/components/ReviewFormModal.tsx
'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export function ReviewFormModal({
  open,
  onClose,
  onSubmitSuccess
}: {
  open: boolean;
  onClose: () => void;
  onSubmitSuccess: (reviewId: string, rating: number) => void
}) {
  const [formData, setFormData] = useState({
    rating: 5,
    title: '',
    comment: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    setSuccess(null);

    try {
      const res = await fetch('/api/review', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to submit review');
      }

      const data = await res.json();
      setSuccess(data.message || 'Thank you for your review!');
      setIsSubmitting(false);

      // Call the success callback
      onSubmitSuccess(data.reviewId, formData.rating);

      // Close modal after a brief delay
      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (err: any) {
      setError(err.message || 'An error occurred');
      setIsSubmitting(false);
    }
  };

  const handleRatingChange = (rating: number) => {
    setFormData(prev => ({ ...prev, rating }));
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="ios-card w-full max-w-md p-6 mx-4">
        <div className="flex justify-between items-start mb-4">
          <h2 className="text-xl font-bold">Leave a Review</h2>
          <button
            onClick={onClose}
            className="text-text-tertiary hover:text-text-secondary transition-colors"
            aria-label="Close"
          >
            ×
          </button>
        </div>

        {success && (
          <div className="mb-4 p-3 bg-green-50 border-l-4 border-green-400">
            <p className="text-sm text-green-800">{success}</p>
          </div>
        )}

        {error && (
          <div className="mb-4 p-3 bg-red-50 border-l-4 border-red-400">
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label className="block text-sm font-medium text-text-secondary">
              How would you rate your experience?
            </label>
            <div className="flex flex-row-reverse space-x-1">
              {[5, 4, 3, 2, 1].map((star) => (
                <label key={star} className="flex items-center cursor-pointer">
                  <input
                    type="radio"
                    name="rating"
                    value={star}
                    checked={formData.rating === star}
                    onChange={() => handleRatingChange(star)}
                    className="sr-only peer"
                  />
                  <span className="h-5 w-5 text-yellow-400 hover:text-yellow-300">
                    {formData.rating >= star ? '★' : '☆'}
                  </span>
                </label>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-text-secondary">
              Title (optional)
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="e.g., Great experience!"
              className="w-full px-3 py-2 rounded-border border-input bg-white text-gray-900 placeholder:text-gray-500 focus:border-accent-brand focus:ring-accent-brand/20"
            />
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-text-secondary">
              Comment (optional)
            </label>
            <textarea
              value={formData.comment}
              onChange={(e) => setFormData({ ...formData, comment: e.target.value })}
              rows={4}
              placeholder="Share your thoughts about How Long Until X..."
              className="w-full px-3 py-2 rounded-border border-input bg-white text-gray-900 placeholder:text-gray-500 focus:border-accent-brand focus:ring-accent-brand/20 resize-none"
            />
          </div>

          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-border border border-transparent bg-text-tertiary/20 text-text-tertiary hover:bg-text-tertiary/30 transition-colors"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 rounded-border border-transparent bg-accent-brand text-white hover:bg-accent-brand/90 transition-colors"
            >
              {isSubmitting ? 'Submitting...' : 'Submit Review'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}