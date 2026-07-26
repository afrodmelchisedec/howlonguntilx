// FILE: src/components/articles/ArticleAboutNote.tsx
// A small, honest trust signal that sits near the disclaimer/byline. It does NOT
// claim a medical-reviewer credential we don't have — instead it makes explicit
// what's actually true: the article is sourced from named authoritative references
// and actively maintained. This is a real E-E-A-T signal (research rigor,
// freshness) that doesn't require inventing a credential.
//
// Closing line is category-aware, mirroring ArticleDisclaimer.tsx's pattern —
// only health/finance/scam get a "professional" callout; everything else gets
// a neutral closing line, so this never reads as out-of-place boilerplate on
// a travel or productivity article.
//
// Swap in a real "Medically reviewed by [Name], [Credential]" line the moment
// you have one for the relevant category — see the commented block at the bottom.

interface ClosingCopy { professional: string; source: string }

const CLOSINGS: Record<string, ClosingCopy> = {
  health: {
    source: 'published clinical and authoritative sources',
    professional: 'This is general educational information, not medical advice — see a qualified healthcare provider for guidance specific to your situation.',
  },
  finance: {
    source: 'published financial and regulatory sources',
    professional: 'This is general informational content, not financial or tax advice — consult a licensed financial advisor for guidance specific to your situation.',
  },
  scam: {
    source: 'law-enforcement and consumer-protection sources',
    professional: "This is general safety information, not legal advice — contact your financial institution or local law enforcement if you believe you're a victim of fraud.",
  },
  general: {
    source: 'published, authoritative sources',
    professional: 'This is general estimate-based information — actual timelines can vary based on your individual circumstances.',
  },
};

export function ArticleAboutNote({
  authorName,
  updatedAt,
  categorySlug,
  glow,
}: {
  authorName: string;
  updatedAt?: Date | string | null;
  categorySlug?: string | null;
  glow: string;
}) {
  const copy = (categorySlug && CLOSINGS[categorySlug.toLowerCase()]) || CLOSINGS.general;
  const updated = updatedAt ? new Date(updatedAt) : null;
  const updatedLabel = updated
    ? updated.toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })
    : null;

  return (
    <div
      className="ios-card-nested anim-fade-up mb-6 p-4 flex gap-3 items-start"
      style={{ border: '1px solid var(--border-hairline)' }}
    >
      <span className="text-lg flex-shrink-0" aria-hidden="true">📚</span>
      <div className="min-w-0">
        <p className="text-caption font-bold mb-1" style={{ color: `rgb(${glow})`, letterSpacing: '0.05em' }}>
          ABOUT THIS ARTICLE
        </p>
        <p className="text-footnote" style={{ color: 'var(--text-secondary)' }}>
          Researched and written by {authorName}, drawing on {copy.source} (see Sources below).
          {' '}{copy.professional}
          {updatedLabel && <> Last reviewed for accuracy on {updatedLabel}.</>}
        </p>
      </div>
    </div>
  );
}

/*
 * Once a real reviewer is in place for a given category, replace the paragraph
 * above with something like:
 *
 * <p className="text-footnote" style={{ color: 'var(--text-secondary)' }}>
 *   Written by {authorName}. Medically reviewed by {reviewerName}, {reviewerCredential}
 *   {updatedLabel && <> on {updatedLabel}</>}. {copy.professional}
 * </p>
 *
 * At that point it's worth also adding a reviewedBy field to ArticleSchema.tsx's
 * Article JSON-LD (schema.org supports this natively), and switching the author
 * @type from Organization back to Person for the reviewer, since a named,
 * credentialed reviewer is exactly the case that field is meant for.
 */
