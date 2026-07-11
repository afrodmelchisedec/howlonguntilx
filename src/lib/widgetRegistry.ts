// FILE: src/lib/widgetRegistry.ts
import type { ComponentType } from 'react';
import dynamic from 'next/dynamic';

// Lite widgets: free, no-auth, no-save — safe to sprinkle mid-article.
// Typed loosely (config: any) to match Block's `tool_embed.config: Record<string, any>` —
// each widget narrows/validates its own config shape internally.
export const WIDGET_REGISTRY: Record<string, Record<string, ComponentType<{ config: any }>>> = {
  'tech-events': {
    countdown: dynamic(() => import('@/components/widgets/CountdownWidget'), { ssr: false }) as ComponentType<{ config: any }>,
  },
  'dark-sky-explorer': {
    bortle_preview: dynamic(() => import('@/components/widgets/BortlePreviewWidget'), { ssr: false }) as ComponentType<{ config: any }>,
  },
};

// Full tools: the actual Pro-tool component (free tier works without auth), embedded directly
// in an article so readers can play with the real thing, not just a teaser.
export const FULL_TOOL_REGISTRY: Record<string, ReturnType<typeof dynamic>> = {
  'tech-events': dynamic(() => import('@/components/pro-tools/TechEventsCalendar').then(m => m.TechEventsCalendar), { ssr: false }),
  'dark-sky-explorer': dynamic(() => import('@/components/pro-tools/DarkSkyExplorer').then(m => m.DarkSkyExplorer), { ssr: false }),
};

export function widgetsForTool(toolSlug: string) {
  return WIDGET_REGISTRY[toolSlug] ?? {};
}
export function fullToolForTool(toolSlug: string) {
  return FULL_TOOL_REGISTRY[toolSlug];
}
