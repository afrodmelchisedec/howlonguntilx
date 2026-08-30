// FILE: src/components/articles/ArticleDisclaimer.tsx
interface DisclaimerCopy { icon: string; label: string; body: string }

const DISCLAIMERS: Record<string, DisclaimerCopy> = {
  health: {
    icon: '⚕️',
    label: 'HEALTH DISCLAIMER',
    body: 'This article is for general educational purposes only and is not medical advice, diagnosis, or treatment. Timelines and figures are typical ranges, not a prediction for your specific situation. Always consult a qualified healthcare provider for concerns about your health, and seek emergency care immediately if you have severe or worsening symptoms.',
  },
  finance: {
    icon: '💰',
    label: 'FINANCIAL DISCLAIMER',
    body: 'This article is for general informational purposes only and is not financial, investment, tax, or legal advice. Figures and timelines are estimates and can vary based on your individual circumstances. Consult a licensed financial advisor or professional before making financial decisions.',
  },
  scam: {
    icon: '🛡️',
    label: 'SAFETY DISCLAIMER',
    body: 'This article is for general awareness and educational purposes only. It does not constitute legal advice, and it is not a substitute for reporting suspected fraud to the appropriate authorities or your financial institution. If you believe you are a victim of a scam, act quickly and contact your bank or local law enforcement.',
  },
  general: {
    icon: 'ℹ️',
    label: 'DISCLAIMER',
    body: 'This article provides general, estimate-based information for educational purposes. Actual timelines can vary based on individual circumstances. It is not a substitute for professional advice specific to your situation.',
  },
};

export function ArticleDisclaimer({ categorySlug, glow }: { categorySlug?: string | null; glow: string }) {
  const copy = (categorySlug && DISCLAIMERS[categorySlug.toLowerCase()]) || DISCLAIMERS.general;
  return (
    <div
      className="ios-card-nested anim-fade-up mb-6 p-4 flex gap-3 items-start"
      style={{ border: `1px solid rgba(${glow}, 0.25)`, borderLeft: `3px solid rgb(${glow})` }}
      role="note"
      aria-label={copy.label}
    >
      <span className="text-lg flex-shrink-0" aria-hidden="true">{copy.icon}</span>
      <div className="min-w-0">
        <p className="text-caption font-bold mb-1" style={{ color: `rgb(${glow})`, letterSpacing: '0.05em' }}>{copy.label}</p>
        <p className="article-note-body">{copy.body}</p>
      </div>
    </div>
  );
}
