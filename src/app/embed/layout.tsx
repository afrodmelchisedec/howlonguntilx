// FILE: src/app/embed/layout.tsx
// Segment-scoped layout — Next.js uses this INSTEAD of inheriting your site
// chrome from the root layout's <Header>/<Nav>, as long as those live in
// src/app/layout.tsx and not in a shared top-level template all routes share.
export default function EmbedLayout({ children }: { children: React.ReactNode }) {
  return <div style={{ background: 'transparent' }}>{children}</div>;
}
