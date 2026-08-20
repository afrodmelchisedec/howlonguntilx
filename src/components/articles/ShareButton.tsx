// FILE: src/components/articles/ShareButton.tsx
'use client';

import { useEffect, useRef, useState } from 'react';
import type { CSSProperties } from 'react';

interface Props {
  glow: string;
  title?: string;
  id: string;
  type: 'article';
  shareCount?: number;
}

export function ShareButton({ glow, title, id, type, shareCount: initialShareCount }: Props) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [shareCount, setShareCount] = useState(initialShareCount ?? 0);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open]);

  function getUrl() {
    return typeof window !== 'undefined' ? window.location.href : '';
  }

  function track(platform: 'twitter' | 'facebook' | 'whatsapp' | 'linkedin' | 'copy') {
    fetch('/api/share', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, type, platform }),
    }).catch(() => {});
    setShareCount(c => c + 1);
  }

  function handleWhatsApp() {
    const text = title ? `${title} ${getUrl()}` : getUrl();
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank', 'noopener,noreferrer');
    track('whatsapp');
    setOpen(false);
  }

  function handleTwitter() {
    const params = new URLSearchParams({ url: getUrl(), ...(title ? { text: title } : {}) });
    window.open(`https://twitter.com/intent/tweet?${params.toString()}`, '_blank', 'noopener,noreferrer');
    track('twitter');
    setOpen(false);
  }

  function handleFacebook() {
    const params = new URLSearchParams({ u: getUrl() });
    window.open(`https://www.facebook.com/sharer/sharer.php?${params.toString()}`, '_blank', 'noopener,noreferrer');
    track('facebook');
    setOpen(false);
  }

  function handleLinkedIn() {
    const params = new URLSearchParams({ url: getUrl() });
    window.open(`https://www.linkedin.com/sharing/share-offsite/?${params.toString()}`, '_blank', 'noopener,noreferrer');
    track('linkedin');
    setOpen(false);
  }

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(getUrl());
      track('copy');
      setCopied(true);
      setTimeout(() => {
        setCopied(false);
        setOpen(false);
      }, 1200);
    } catch {
      setOpen(false);
    }
  }

  const pillStyle: CSSProperties = {
    color: 'var(--text-secondary)',
    background: 'transparent',
    border: '1px solid var(--border-secondary, rgba(255,255,255,0.12))',
    borderRadius: '999px',
    padding: '2px 10px',
    cursor: 'pointer',
  };

  const menuItemStyle: CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    width: '100%',
    padding: '8px 12px',
    background: 'transparent',
    border: 'none',
    textAlign: 'left',
    cursor: 'pointer',
    color: 'var(--text-primary, #fff)',
    fontSize: '13px',
  };

  return (
    <div ref={containerRef} style={{ position: 'relative', display: 'inline-block' }}>
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="text-caption inline-flex items-center gap-1"
        style={pillStyle}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="Share this article"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="18" cy="5" r="3" />
          <circle cx="6" cy="12" r="3" />
          <circle cx="18" cy="19" r="3" />
          <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
          <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
        </svg>
        Share{shareCount > 0 ? ` (${shareCount})` : ''}
      </button>

      {open && (
        <div
          role="menu"
          style={{
            position: 'absolute',
            top: 'calc(100% + 6px)',
            left: 0,
            minWidth: '170px',
            background: 'var(--surface-elevated, #1a1a1e)',
            border: '1px solid var(--border-secondary, rgba(255,255,255,0.12))',
            borderRadius: '12px',
            boxShadow: '0 8px 24px rgba(0,0,0,0.35)',
            overflow: 'hidden',
            zIndex: 20,
          }}
        >
          <button type="button" role="menuitem" onClick={handleWhatsApp} style={menuItemStyle}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.71.306 1.263.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
              <path d="M12.004 2c-5.523 0-10 4.477-10 10 0 1.77.462 3.494 1.34 5.01L2 22l5.13-1.32A9.95 9.95 0 0012.004 22c5.523 0 10-4.477 10-10s-4.477-10-10-10zm0 18.164a8.13 8.13 0 01-4.146-1.14l-.297-.176-3.05.785.813-2.968-.194-.305a8.15 8.15 0 01-1.256-4.36c0-4.507 3.667-8.174 8.174-8.174s8.174 3.667 8.174 8.174-3.667 8.164-8.174 8.164z"/>
            </svg>
            WhatsApp
          </button>
          <button type="button" role="menuitem" onClick={handleTwitter} style={menuItemStyle}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
            </svg>
            Twitter / X
          </button>
          <button type="button" role="menuitem" onClick={handleFacebook} style={menuItemStyle}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M22 12.06C22 6.505 17.523 2 12 2S2 6.505 2 12.06c0 5.02 3.657 9.184 8.438 9.94v-7.03H7.898v-2.91h2.54V9.845c0-2.522 1.492-3.916 3.777-3.916 1.094 0 2.238.196 2.238.196v2.475h-1.26c-1.243 0-1.63.775-1.63 1.57v1.89h2.773l-.443 2.91h-2.33V22c4.78-.756 8.437-4.92 8.437-9.94z"/>
            </svg>
            Facebook
          </button>
          <button type="button" role="menuitem" onClick={handleLinkedIn} style={menuItemStyle}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 1 1 0-4.124 2.062 2.062 0 0 1 0 4.124zM7.114 20.452H3.558V9h3.556v11.452z"/>
            </svg>
            LinkedIn
          </button>
          <button type="button" role="menuitem" onClick={handleCopy} style={menuItemStyle}>
            {copied ? (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={`rgb(${glow})`} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 6 9 17l-5-5" />
              </svg>
            ) : (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="9" y="9" width="13" height="13" rx="2" />
                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
              </svg>
            )}
            {copied ? 'Copied!' : 'Copy link'}
          </button>
        </div>
      )}
    </div>
  );
}
