// FILE: src/lib/recipePresets.ts
// Client-safe recipe data for the Batch-Scale Dial. No fs/path — safe to
// import from 'use client' components.

export interface RecipeIngredient {
  id: string;
  name: string;
  baseAmount: number;
  unit: string;
  color: string;
}

export interface RecipePreset {
  id: string;
  name: string;
  emoji: string;
  baseServings: number;
  ingredients: RecipeIngredient[];
  steps: string[];
}

export const RECIPE_PRESETS: RecipePreset[] = [
  {
    id: 'cookies',
    name: 'Chocolate Chip Cookies',
    emoji: '🍪',
    baseServings: 12,
    ingredients: [
      { id: 'flour',    name: 'All-purpose flour', baseAmount: 280, unit: 'g',  color: '255, 200, 120' },
      { id: 'butter',   name: 'Butter, softened',  baseAmount: 170, unit: 'g',  color: '255, 159, 10' },
      { id: 'sugar',    name: 'Brown sugar',       baseAmount: 150, unit: 'g',  color: '196, 132, 90' },
      { id: 'egg',      name: 'Large eggs',        baseAmount: 2,   unit: '',   color: '255, 230, 150' },
      { id: 'choc',     name: 'Chocolate chips',   baseAmount: 200, unit: 'g',  color: '120, 80, 60' },
      { id: 'salt',     name: 'Salt',              baseAmount: 1,   unit: 'tsp', color: '200, 200, 210' },
    ],
    steps: [
      'Cream butter and sugar until fluffy.',
      'Beat in eggs one at a time.',
      'Fold in flour and salt, then chocolate chips.',
      'Scoop onto a tray and bake at 350°F (175°C) for 10–12 minutes.',
    ],
  },
  {
    id: 'pasta-sauce',
    name: 'Tomato Pasta Sauce',
    emoji: '🍝',
    baseServings: 4,
    ingredients: [
      { id: 'tomato',  name: 'Crushed tomatoes', baseAmount: 800, unit: 'g',   color: '255, 90, 70' },
      { id: 'garlic',  name: 'Garlic cloves',    baseAmount: 3,   unit: '',    color: '230, 220, 190' },
      { id: 'oil',     name: 'Olive oil',        baseAmount: 3,   unit: 'tbsp', color: '200, 190, 90' },
      { id: 'basil',   name: 'Fresh basil',      baseAmount: 6,   unit: '',    color: '90, 180, 90' },
      { id: 'salt2',   name: 'Salt',             baseAmount: 1,   unit: 'tsp', color: '200, 200, 210' },
    ],
    steps: [
      'Sauté garlic in olive oil until fragrant.',
      'Add crushed tomatoes and simmer 20 minutes.',
      'Stir in basil and salt to taste.',
    ],
  },
  {
    id: 'pancakes',
    name: 'Fluffy Pancakes',
    emoji: '🥞',
    baseServings: 4,
    ingredients: [
      { id: 'flour2',  name: 'All-purpose flour', baseAmount: 190, unit: 'g',  color: '255, 200, 120' },
      { id: 'milk',    name: 'Milk',              baseAmount: 300, unit: 'ml', color: '240, 240, 235' },
      { id: 'egg2',    name: 'Large eggs',        baseAmount: 1,   unit: '',   color: '255, 230, 150' },
      { id: 'sugar2',  name: 'Sugar',             baseAmount: 2,   unit: 'tbsp', color: '196, 132, 90' },
      { id: 'bpowder', name: 'Baking powder',     baseAmount: 2,   unit: 'tsp', color: '200, 200, 210' },
    ],
    steps: [
      'Whisk dry ingredients together.',
      'Whisk in milk and egg until just combined — a few lumps are fine.',
      'Cook on a hot griddle, 2–3 minutes per side.',
    ],
  },
];
