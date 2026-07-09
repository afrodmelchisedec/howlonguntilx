// FILE: src/lib/widgetRegistry.ts
import dynamic from 'next/dynamic';

// Each tool slug maps to the ONLY widget(s) admins may embed in that tool's articles.
// This is what guarantees "tech-events" articles always get the tech-events tool, never a mismatched one.
export const WIDGET_REGISTRY: Record<string, Record<string, ReturnType<typeof dynamic>>> = {
  'tech-events': {
    countdown: dynamic(() => import('@/components/widgets/CountdownWidget'), { ssr: false }),
  },
  'dark-sky-explorer': {
    bortle_preview: dynamic(() => import('@/components/widgets/BortlePreviewWidget'), { ssr: false }),
  },
  // TODO: add one entry per existing tool as you wire up its articles
};

export function widgetsForTool(toolSlug: string) {
  return WIDGET_REGISTRY[toolSlug] ?? {};
}
