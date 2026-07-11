// FILE: src/components/articles/ArticleStyles.tsx
'use client';

export function ArticleStyles() {
  return (
    <style jsx global>{`
      @keyframes barGrow {
        from { transform: scaleY(0); opacity: 0; }
        to { transform: scaleY(1); opacity: 1; }
      }
      @keyframes digitPulse {
        0% { transform: scale(1); }
        30% { transform: scale(1.18); }
        100% { transform: scale(1); }
      }
      @keyframes heroGlowPulse {
        0%, 100% { box-shadow: 0 0 24px var(--article-glow-a), 0 0 0 1.5px var(--article-glow-b); }
        50% { box-shadow: 0 0 44px var(--article-glow-c), 0 0 0 1.5px var(--article-glow-b); }
      }
      .article-glow-card {
        transition: box-shadow 220ms ease, transform 220ms ease, border-color 220ms ease;
      }
      .article-glow-card:hover {
        transform: translateY(-2px);
        box-shadow: 0 0 0 1.5px var(--article-glow-b), 0 10px 30px var(--article-glow-a);
      }
      .article-bar {
        transform-origin: bottom;
        animation: barGrow 700ms cubic-bezier(0.22, 1, 0.36, 1) both;
      }
      .article-digit-pulse {
        animation: digitPulse 320ms ease-out;
      }
      .article-hero-countdown {
        animation: heroGlowPulse 3.5s ease-in-out infinite;
      }
      .article-toc {
        backdrop-filter: blur(20px);
        -webkit-backdrop-filter: blur(20px);
      }
      .article-toc-link {
        position: relative;
        padding: 4px 0 4px 14px;
        transition: color 180ms ease, transform 180ms ease;
      }
      .article-toc-link::before {
        content: '';
        position: absolute;
        left: 0;
        top: 50%;
        width: 5px;
        height: 5px;
        border-radius: 999px;
        background: currentColor;
        opacity: 0.35;
        transform: translateY(-50%);
      }
      .article-toc-link:hover {
        color: var(--text-primary) !important;
        transform: translateX(3px);
      }
      .article-freshness-pill {
        display: inline-flex;
        align-items: center;
        gap: 5px;
        border-radius: 999px;
        padding: 3px 10px;
        backdrop-filter: blur(12px);
        -webkit-backdrop-filter: blur(12px);
      }
      html {
        scroll-behavior: smooth;
      }
    `}</style>
  );
}
