// FILE: src/components/embeds/EmbedResizeReporter.tsx
'use client';
import { useEffect } from 'react';

// Reports this embed's content height to the parent page via postMessage
// so the host's iframe can auto-resize (paired with the snippet's listener script).
export function EmbedResizeReporter() {
  useEffect(() => {
    function report() {
      const height = document.documentElement.scrollHeight;
      window.parent.postMessage({ type: 'hlux-embed-resize', height }, '*');
    }
    report();
    const ro = new ResizeObserver(report);
    ro.observe(document.body);
    window.addEventListener('load', report);
    return () => { ro.disconnect(); window.removeEventListener('load', report); };
  }, []);
  return null;
}
