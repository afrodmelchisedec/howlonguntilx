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
//
// LEGACY PATH — keyed by the ARTICLE'S OWN toolSlug (Article.toolSlug), e.g. 'tech-events',
// 'dark-sky-explorer'. This only works because those two tools coincidentally share their name
// with the content-collection they belong to. Do not extend this map for new tools — use
// SUBCATEGORY_TOOL_REGISTRY below instead, which is keyed by individual tool slug and resolved
// via the article's Category.tools mapping (see ArticleBlocks.tsx / ArticleLayout.tsx).
export const FULL_TOOL_REGISTRY: Record<string, ReturnType<typeof dynamic>> = {
  'tech-events': dynamic(() => import('@/components/pro-tools/TechEventsCalendar').then(m => m.TechEventsCalendar), { ssr: false }),
  'dark-sky-explorer': dynamic(() => import('@/components/pro-tools/DarkSkyExplorer').then(m => m.DarkSkyExplorer), { ssr: false }),
};

// NEW — keyed by individual pro-tool slug (matches Category.tools[].slug, set via the
// admin Categories tab). This is what `questions`-type articles resolve against, since
// their embedded tool depends on the article's subcategory, not its own toolSlug.
// Uses the `*Tabs` wrapper for every entry (Tool + How to use guide), matching the
// established convention across all 21 tools.
export const SUBCATEGORY_TOOL_REGISTRY: Record<string, ReturnType<typeof dynamic>> = {
  'payroll-runway': dynamic(() => import('@/components/pro-tools/PayrollRunwayTabs').then(m => m.PayrollRunwayTabs), { ssr: false }),
  'tax-budget-deadlines': dynamic(() => import('@/components/pro-tools/TaxBudgetDeadlinesTabs').then(m => m.TaxBudgetDeadlinesTabs), { ssr: false }),
  'savings-goal-slider': dynamic(() => import('@/components/pro-tools/SavingsGoalSliderTabs').then(m => m.SavingsGoalSliderTabs), { ssr: false }),
  'runway-lab': dynamic(() => import('@/components/pro-tools/RunwayLabTabs').then(m => m.RunwayLabTabs), { ssr: false }),
  'food-festival-passport': dynamic(() => import('@/components/pro-tools/FoodFestivalPassportTabs').then(m => m.FoodFestivalPassportTabs), { ssr: false }),
  'restaurant-launches': dynamic(() => import('@/components/pro-tools/RestaurantLaunchesTabs').then(m => m.RestaurantLaunchesTabs), { ssr: false }),
  'recipe-batch-dial': dynamic(() => import('@/components/pro-tools/RecipeBatchDialTabs').then(m => m.RecipeBatchDialTabs), { ssr: false }),
  'harvest-seasons': dynamic(() => import('@/components/pro-tools/HarvestSeasonsTabs').then(m => m.HarvestSeasonsTabs), { ssr: false }),
  'egg-hatch-calculator': dynamic(() => import('@/components/pro-tools/EggHatchCalculatorTabs').then(m => m.EggHatchCalculatorTabs), { ssr: false }),
  'life-expectancy-calculator': dynamic(() => import('@/components/pro-tools/LifeExpectancyCalculatorTabs').then(m => m.LifeExpectancyCalculatorTabs), { ssr: false }),
  'am-i-pregnant-probability-tracker': dynamic(() => import('@/components/pro-tools/AmIPregnantTrackerTabs').then(m => m.AmIPregnantTrackerTabs), { ssr: false }),
  'labor-onset-predictor': dynamic(() => import('@/components/pro-tools/LaborOnsetPredictorTabs').then(m => m.LaborOnsetPredictorTabs), { ssr: false }),
  'birth-control-effectiveness-countdown': dynamic(() => import('@/components/pro-tools/BirthControlEffectivenessCountdownTabs').then(m => m.BirthControlEffectivenessCountdownTabs), { ssr: false }),
  'newborn-milestone-tracker': dynamic(() => import('@/components/pro-tools/NewbornMilestoneTrackerTabs').then(m => m.NewbornMilestoneTrackerTabs), { ssr: false }),
  'baby-animal-nest-watch': dynamic(() => import('@/components/pro-tools/BabyAnimalNestWatchTabs').then(m => m.BabyAnimalNestWatchTabs), { ssr: false }),
  'kitten-growth-tracker': dynamic(() => import('@/components/pro-tools/KittenGrowthTrackerTabs').then(m => m.KittenGrowthTrackerTabs), { ssr: false }),
  'pet-growth-gestation-calculator': dynamic(() => import('@/components/pro-tools/PetGrowthGestationTrackerTabs').then(m => m.PetGrowthGestationTrackerTabs), { ssr: false }),
  'garden-growth-bloom-tracker': dynamic(() => import('@/components/pro-tools/GardenGrowthTrackerTabs').then(m => m.GardenGrowthTrackerTabs), { ssr: false }),
  'energy-rhythm-mapper': dynamic(() => import('@/components/pro-tools/EnergyRhythmMapperTabs').then(m => m.EnergyRhythmMapperTabs), { ssr: false }),
  'symptom-escalation-tracker': dynamic(() => import('@/components/pro-tools/SymptomEscalationTrackerTabs').then(m => m.SymptomEscalationTrackerTabs), { ssr: false }),
  'sports-games-tracker': dynamic(() => import('@/components/pro-tools/SportsGamesTrackerTabs').then(m => m.SportsGamesTrackerTabs), { ssr: false }),
  'entertainment-watchlist': dynamic(() => import('@/components/pro-tools/EntertainmentWatchlistTabs').then(m => m.EntertainmentWatchlistTabs), { ssr: false }),
  'jetlag-adjustment-dragger': dynamic(() => import('@/components/pro-tools/JetLagAdjustmentDraggerTabs').then(m => m.JetLagAdjustmentDraggerTabs), { ssr: false }),
  'shopping-deals-radar': dynamic(() => import('@/components/pro-tools/ShoppingDealsRadarTabs').then(m => m.ShoppingDealsRadarTabs), { ssr: false }),
  'meeting-overlap': dynamic(() => import('@/components/pro-tools/MeetingOverlapTabs').then(m => m.MeetingOverlapTabs), { ssr: false }),
  'deadline-buffer-slider': dynamic(() => import('@/components/pro-tools/DeadlineBufferSliderTabs').then(m => m.DeadlineBufferSliderTabs), { ssr: false }),
  'focus-block-builder': dynamic(() => import('@/components/pro-tools/FocusBlockBuilderTabs').then(m => m.FocusBlockBuilderTabs), { ssr: false }),
  'subscription-density': dynamic(() => import('@/components/pro-tools/SubscriptionDensityTabs').then(m => m.SubscriptionDensityTabs), { ssr: false }),
  'password-rotation-board': dynamic(() => import('@/components/pro-tools/PasswordRotationBoardTabs').then(m => m.PasswordRotationBoardTabs), { ssr: false }),
  'fraud-response-clock': dynamic(() => import('@/components/pro-tools/FraudResponseClockTabs').then(m => m.FraudResponseClockTabs), { ssr: false }),
  'phishing-identity-watch': dynamic(() => import('@/components/pro-tools/PhishingIdentityWatchTabs').then(m => m.PhishingIdentityWatchTabs), { ssr: false }),
  'tech-events': dynamic(() => import('@/components/pro-tools/TechEventsCalendarTabs').then(m => m.TechEventsCalendarTabs), { ssr: false }),
  'dark-sky-explorer': dynamic(() => import('@/components/pro-tools/DarkSkyExplorerTabs').then(m => m.DarkSkyExplorerTabs), { ssr: false }),
};

export function widgetsForTool(toolSlug: string) {
  return WIDGET_REGISTRY[toolSlug] ?? {};
}
export function fullToolForTool(toolSlug: string) {
  return FULL_TOOL_REGISTRY[toolSlug];
}
// Resolve an individual pro-tool by its own slug (e.g. from Category.tools[].slug).
export function toolComponentForSlug(slug: string | undefined | null) {
  if (!slug) return undefined;
  return SUBCATEGORY_TOOL_REGISTRY[slug];
}
