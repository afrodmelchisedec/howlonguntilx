'use client';

interface Props { name: string; slug: string }

export function ShareBar({ name, slug }: Props) {
  const url = typeof window !== 'undefined' ? window.location.href : `https://howlonguntilx.com/how-long-until-${slug}`;
  const text = `How long until ${name}? Check the live countdown!`;

  function copy() {
    navigator.clipboard.writeText(url);
    alert('Link copied!');
  }

  const pillCls = "press px-3 py-1.5 text-sm rounded-full transition-colors";
  const pillStyle = { border: '1px solid var(--border-hairline)', color: 'var(--text-secondary)' };

  return (
    <div className="flex items-center justify-center gap-3 mt-6 flex-wrap">
      <span className="text-caption">Share</span>
      <a href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`}
        target="_blank" rel="noopener" className={pillCls} style={pillStyle}>
        X / Twitter
      </a>
      <a href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`}
        target="_blank" rel="noopener" className={pillCls} style={pillStyle}>
        Facebook
      </a>
      <a href={`https://wa.me/?text=${encodeURIComponent(text + ' ' + url)}`}
        target="_blank" rel="noopener" className={pillCls} style={pillStyle}>
        WhatsApp
      </a>
      <button onClick={copy} className={pillCls} style={pillStyle}>
        Copy link
      </button>
    </div>
  );
}
