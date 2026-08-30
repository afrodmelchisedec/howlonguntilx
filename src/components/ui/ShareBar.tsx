'use client';
import { useState, useEffect } from 'react';
import { EmbedCountdownButton } from '@/components/embeds/EmbedCountdownButton';

interface Props {
  name: string;
  slug: string;
  id: string;
  type: 'event' | 'userEvent';
  shareCount?: number;
}

function trackShare(id: string, type: 'event' | 'userEvent', platform: 'twitter' | 'facebook' | 'whatsapp' | 'copy' | 'embed') {
  fetch('/api/share', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id, type, platform }),
  }).catch(() => {});
}

export function ShareBar({ name, slug, id, type, shareCount: initialShareCount }: Props) {
  const [shareCount, setShareCount] = useState(initialShareCount ?? 0);
  const fallbackUrl = `https://howlonguntilx.com/questions/how-long-until-${slug}`;
  const [url, setUrl] = useState(fallbackUrl);
  useEffect(() => { setUrl(window.location.href); }, []);
  const text = `How long until ${name}? Check the live countdown!`;

  function track(platform: 'twitter' | 'facebook' | 'whatsapp' | 'copy' | 'embed') {
    trackShare(id, type, platform);
    setShareCount(c => c + 1);
  }

  function copy() {
    navigator.clipboard.writeText(url);
    track('copy');
    alert('Link copied!');
  }
  const pillCls = "press px-3 py-1.5 text-sm rounded-full transition-colors";
  const pillStyle = { border: '1px solid var(--border-hairline)', color: 'var(--text-secondary)' };
  return (
    <div className="flex flex-col items-center mt-6">
      <div className="flex items-center justify-center gap-3 flex-wrap">
        <span className="text-caption">Share</span>
        <a href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`}
          target="_blank" rel="noopener" className={pillCls} style={pillStyle}
          onClick={() => track('twitter')}>
          X / Twitter
        </a>
        <a href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`}
          target="_blank" rel="noopener" className={pillCls} style={pillStyle}
          onClick={() => track('facebook')}>
          Facebook
        </a>
        <a href={`https://wa.me/?text=${encodeURIComponent(text + ' ' + url)}`}
          target="_blank" rel="noopener" className={pillCls} style={pillStyle}
          onClick={() => track('whatsapp')}>
          WhatsApp
        </a>
        <button onClick={copy} className={pillCls} style={pillStyle}>
          Copy link
        </button>
        <EmbedCountdownButton slug={slug} name={name} id={id} type={type} onEmbedCopy={() => setShareCount(c => c + 1)} />
      </div>
      {shareCount > 0 && (
        <p className="text-caption mt-2" style={{ color: 'var(--text-tertiary, var(--text-secondary))' }}>
          {shareCount} share{shareCount === 1 ? '' : 's'}
        </p>
      )}
    </div>
  );
}
