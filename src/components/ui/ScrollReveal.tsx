// FILE: src/components/ui/ScrollReveal.tsx
'use client';
import { useEffect } from 'react';

// Mounted once in RootLayout. Renders nothing — its only job is to watch
// every `.anim-fade-up` element on the page and add `.is-revealed` the
// moment it enters the viewport, which is what actually starts the
// (already-defined, already-paused) fadeUp animation in globals.css.
//
// Why a MutationObserver in addition to the initial querySelectorAll: a
// one-time scan on mount would miss anything that renders in later —
// comments loading async, a modal opening, client-side navigation swapping
// the page content. Watching the DOM means any `.anim-fade-up` element,
// from any component, at any point, gets picked up automatically — no
// per-component wiring needed, and nothing added later slips through.
export function ScrollReveal() {
  useEffect(() => {
    const prefersReduced =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // Reduced-motion users: skip the observer entirely, reveal everything
    // immediately. globals.css already does this via @media for anyone
    // whose OS setting changes after this ran, but doing it here too means
    // we never even attach the paused-animation class dance for them.
    if (prefersReduced) {
      document.querySelectorAll('.anim-fade-up').forEach(el => el.classList.add('is-revealed'));
      return;
    }

    const io = new IntersectionObserver(
      entries => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-revealed');
            // Reveal-once: an element that's already played its entrance
            // doesn't need watching anymore, on this page or scrolling
            // back past it later. Keeps the observer's working set small
            // on long pages instead of growing unbounded.
            io.unobserve(entry.target);
          }
        }
      },
      // Slightly before the element is fully in view, so the animation
      // finishes roughly as it crosses into the comfortable reading zone
      // rather than starting exactly at the viewport edge.
      { threshold: 0.12, rootMargin: '0px 0px -8% 0px' }
    );

    function observeWithin(root: ParentNode) {
      root.querySelectorAll('.anim-fade-up:not(.is-revealed)').forEach(el => io.observe(el));
    }

    observeWithin(document);

    const mo = new MutationObserver(mutations => {
      for (const m of mutations) {
        m.addedNodes.forEach(node => {
          if (!(node instanceof Element)) return;
          if (node.matches('.anim-fade-up:not(.is-revealed)')) io.observe(node);
          observeWithin(node);
        });
      }
    });
    mo.observe(document.body, { childList: true, subtree: true });

    return () => {
      io.disconnect();
      mo.disconnect();
    };
  }, []);

  return null;
}
