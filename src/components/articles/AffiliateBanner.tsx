// FILE: src/components/articles/AffiliateBanner.tsx
'use client';

interface Banner {
  title: string;
  description: string;
  ctaLabel: string;
  href: string;
  imageUrl: string | null;
}

export function AffiliateBanner({ banner, glow }: { banner: Banner; glow: string }) {
  return (
      <a
      href={banner.href}
      target="_blank"
      rel="noopener sponsored noreferrer"
      className="affiliate-banner-link block my-8 anim-fade-up"
      style={{
        borderRadius: 20,
        border: `1px solid rgba(${glow}, 0.3)`,
        background: `linear-gradient(135deg, rgba(${glow}, 0.14) 0%, var(--bg-elevated) 100%)`,
        overflow: 'hidden',
        textDecoration: 'none',
        color: 'inherit',
      }}
    >
      <div className="flex items-center gap-4 p-5" style={{ position: 'relative' }}>
        {banner.imageUrl && (
          <img
            src={banner.imageUrl}
            alt=""
            className="rounded-2xl flex-shrink-0"
            style={{ width: 72, height: 72, objectFit: 'cover' }}
          />
        )}
        <div className="flex-1 min-w-0">
          <p className="text-caption mb-1" style={{ color: `rgb(${glow})`, letterSpacing: '0.04em' }}>
            SPONSORED
          </p>
          <div className="text-headline mb-1" style={{ color: 'var(--text-primary)' }}>{banner.title}</div>
          <p className="text-footnote" style={{ color: 'var(--text-secondary)' }}>{banner.description}</p>
        </div>
        <div
          className="affiliate-banner-cta press flex-shrink-0 text-sm font-semibold"
          style={{
            padding: '10px 18px',
            borderRadius: 999,
            background: `rgb(${glow})`,
            color: '#0a0a0a',
            whiteSpace: 'nowrap',
          }}
        >
          {banner.ctaLabel} →
        </div>
      </div>
      <style>{`
        .affiliate-banner-link {
          transition: transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.2s ease, border-color 0.2s ease;
        }
        .affiliate-banner-link:hover {
          transform: translateY(-4px) scale(1.015);
          box-shadow: 0 0 0 1.5px rgba(${glow}, 0.5), 0 12px 32px rgba(${glow}, 0.25);
          border-color: rgba(${glow}, 0.6);
        }
        .affiliate-banner-link:active {
          transform: translateY(-1px) scale(0.995);
        }
      `}</style>
    </a>
  );
}
