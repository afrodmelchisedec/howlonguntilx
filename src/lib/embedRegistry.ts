// FILE: src/lib/embedRegistry.ts
import dynamic from 'next/dynamic';
import type { ComponentType } from 'react';

// Add one line per tool as you build its Embed component.
// Keep these dynamic() so the embed bundle only loads the one widget needed.
export const EMBED_REGISTRY: Record<string, () => ComponentType<any>> = {
  'labor-onset-predictor': () => dynamic(() => import('@/components/embeds/LaborOnsetPredictorEmbed').then(m => m.LaborOnsetPredictorEmbed), { ssr: false }),
  'am-i-pregnant-probability-tracker': () => dynamic(() => import('@/components/embeds/AmIPregnantTrackerEmbed').then(m => m.AmIPregnantTrackerEmbed), { ssr: false }),
  'birth-control-effectiveness-countdown': () => dynamic(() => import('@/components/embeds/BirthControlEffectivenessCountdownEmbed').then(m => m.BirthControlEffectivenessCountdownEmbed), { ssr: false }),
  'newborn-milestone-tracker': () => dynamic(() => import('@/components/embeds/NewbornMilestoneTrackerEmbed').then(m => m.NewbornMilestoneTrackerEmbed), { ssr: false }),
  'baby-animal-nest-watch': () => dynamic(() => import('@/components/embeds/BabyAnimalNestWatchEmbed').then(m => m.BabyAnimalNestWatchEmbed), { ssr: false }),
  'kitten-growth-tracker': () => dynamic(() => import('@/components/embeds/KittenGrowthTrackerEmbed').then(m => m.KittenGrowthTrackerEmbed), { ssr: false }),
  'egg-hatch-calculator': () => dynamic(() => import('@/components/embeds/EggHatchCalculatorEmbed').then(m => m.EggHatchCalculatorEmbed), { ssr: false }),
  'pet-growth-gestation-calculator': () => dynamic(() => import('@/components/embeds/PetGrowthGestationTrackerEmbed').then(m => m.PetGrowthGestationTrackerEmbed), { ssr: false }),
  'garden-growth-bloom-tracker': () => dynamic(() => import('@/components/embeds/GardenGrowthTrackerEmbed').then(m => m.GardenGrowthTrackerEmbed), { ssr: false }),
  'payroll-runway': () => dynamic(() => import('@/components/embeds/PayrollRunwayEmbed').then(m => m.PayrollRunwayEmbed), { ssr: false }),
  'tax-budget-deadlines': () => dynamic(() => import('@/components/embeds/TaxBudgetDeadlinesEmbed').then(m => m.TaxBudgetDeadlinesEmbed), { ssr: false }),
  'savings-goal-slider': () => dynamic(() => import('@/components/embeds/SavingsGoalSliderEmbed').then(m => m.SavingsGoalSliderEmbed), { ssr: false }),
  'runway-lab': () => dynamic(() => import('@/components/embeds/RunwayLabEmbed').then(m => m.RunwayLabEmbed), { ssr: false }),
  'fraud-response-clock': () => dynamic(() => import('@/components/embeds/FraudResponseClockEmbed').then(m => m.FraudResponseClockEmbed), { ssr: false }),
  'subscription-density': () => dynamic(() => import('@/components/embeds/SubscriptionDensityEmbed').then(m => m.SubscriptionDensityEmbed), { ssr: false }),
  'recipe-batch-dial': () => dynamic(() => import('@/components/embeds/RecipeBatchDialEmbed').then(m => m.RecipeBatchDialEmbed), { ssr: false }),
  'harvest-seasons': () => dynamic(() => import('@/components/embeds/HarvestSeasonsEmbed').then(m => m.HarvestSeasonsEmbed), { ssr: false }),
  'food-festival-passport': () => dynamic(() => import('@/components/embeds/FoodFestivalPassportEmbed').then(m => m.FoodFestivalPassportEmbed), { ssr: false }),
  'restaurant-launches': () => dynamic(() => import('@/components/embeds/RestaurantLaunchesEmbed').then(m => m.RestaurantLaunchesEmbed), { ssr: false }),
  'sports-games-tracker': () => dynamic(() => import('@/components/embeds/GameDayTrackerEmbed').then(m => m.GameDayTrackerEmbed), { ssr: false }),
  'entertainment-watchlist': () => dynamic(() => import('@/components/embeds/ReleaseQueueEmbed').then(m => m.ReleaseQueueEmbed), { ssr: false }),
  'jetlag-adjustment-dragger': () => dynamic(() => import('@/components/embeds/JetLagAdjustmentDraggerEmbed').then(m => m.JetLagAdjustmentDraggerEmbed), { ssr: false }),
  'shopping-deals-radar': () => dynamic(() => import('@/components/embeds/DealRadarEmbed').then(m => m.DealRadarEmbed), { ssr: false }),
  'meeting-overlap': () => dynamic(() => import('@/components/embeds/TimeZoneRadarEmbed').then(m => m.TimeZoneRadarEmbed), { ssr: false }),
  'deadline-buffer-slider': () => dynamic(() => import('@/components/embeds/LaunchCountdownPlannerEmbed').then(m => m.LaunchCountdownPlannerEmbed), { ssr: false }),
  'focus-block-builder': () => dynamic(() => import('@/components/embeds/DayTimelineBuilderEmbed').then(m => m.DayTimelineBuilderEmbed), { ssr: false }),
  'tech-events': () => dynamic(() => import('@/components/embeds/TechEventsCalendarEmbed').then(m => m.TechEventsCalendarEmbed), { ssr: false }),
  'dark-sky-explorer': () => dynamic(() => import('@/components/embeds/DarkSkyExplorerEmbed').then(m => m.DarkSkyExplorerEmbed), { ssr: false }),
  'password-rotation-board': () => dynamic(() => import('@/components/embeds/PasswordRotationBoardEmbed').then(m => m.PasswordRotationBoardEmbed), { ssr: false }),
  'phishing-identity-watch': () => dynamic(() => import('@/components/embeds/PhishingIdentityWatchEmbed').then(m => m.PhishingIdentityWatchEmbed), { ssr: false }),
  'energy-rhythm-mapper': () => dynamic(() => import('@/components/embeds/EnergyRhythmMapperEmbed').then(m => m.EnergyRhythmMapperEmbed), { ssr: false }),
  'life-expectancy-calculator': () => dynamic(() => import('@/components/embeds/LifeExpectancyCalculatorEmbed').then(m => m.LifeExpectancyCalculatorEmbed), { ssr: false }),
  // ...add each remaining tool here as you convert it
};
