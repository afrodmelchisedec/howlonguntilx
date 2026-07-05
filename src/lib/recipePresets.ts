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
  {
    id: 'guacamole',
    name: 'Classic Guacamole',
    emoji: '🥑',
    baseServings: 4,
    ingredients: [
      { id: 'avocado',   name: 'Ripe avocados',    baseAmount: 3,   unit: '',    color: '120, 190, 90' },
      { id: 'lime',      name: 'Limes, juiced',    baseAmount: 1,   unit: '',    color: '210, 230, 120' },
      { id: 'onion',     name: 'Red onion, diced', baseAmount: 0.25, unit: 'cup', color: '190, 110, 150' },
      { id: 'tomato2',   name: 'Roma tomato, diced', baseAmount: 1, unit: '',    color: '255, 90, 70' },
      { id: 'cilantro',  name: 'Cilantro, chopped', baseAmount: 2,  unit: 'tbsp', color: '90, 180, 90' },
      { id: 'salt3',     name: 'Salt',             baseAmount: 0.5, unit: 'tsp', color: '200, 200, 210' },
    ],
    steps: [
      'Mash avocados in a bowl to your preferred texture.',
      'Fold in lime juice, onion, tomato, and cilantro.',
      'Season with salt and serve immediately.',
    ],
  },
  {
    id: 'chicken-stirfry',
    name: 'Chicken Stir-Fry',
    emoji: '🍗',
    baseServings: 4,
    ingredients: [
      { id: 'chicken',   name: 'Chicken breast, sliced', baseAmount: 500, unit: 'g',  color: '255, 200, 150' },
      { id: 'soy',       name: 'Soy sauce',        baseAmount: 4,   unit: 'tbsp', color: '110, 70, 50' },
      { id: 'garlic2',   name: 'Garlic cloves',    baseAmount: 3,   unit: '',    color: '230, 220, 190' },
      { id: 'ginger',    name: 'Ginger, minced',   baseAmount: 1,   unit: 'tbsp', color: '235, 200, 140' },
      { id: 'peppers',   name: 'Bell peppers, sliced', baseAmount: 2, unit: '',  color: '255, 120, 90' },
      { id: 'oil2',      name: 'Vegetable oil',    baseAmount: 2,   unit: 'tbsp', color: '200, 190, 90' },
    ],
    steps: [
      'Marinate chicken in half the soy sauce for 10 minutes.',
      'Stir-fry chicken in hot oil until golden, then set aside.',
      'Stir-fry garlic, ginger, and peppers, then return chicken and remaining soy sauce.',
      'Toss everything together for 2 minutes and serve hot.',
    ],
  },
  {
    id: 'banana-bread',
    name: 'Banana Bread',
    emoji: '🍌',
    baseServings: 8,
    ingredients: [
      { id: 'banana',    name: 'Ripe bananas, mashed', baseAmount: 3, unit: '',   color: '255, 220, 100' },
      { id: 'flour3',    name: 'All-purpose flour', baseAmount: 250, unit: 'g',  color: '255, 200, 120' },
      { id: 'butter2',   name: 'Butter, melted',   baseAmount: 115, unit: 'g',  color: '255, 159, 10' },
      { id: 'sugar3',    name: 'Sugar',            baseAmount: 150, unit: 'g',  color: '196, 132, 90' },
      { id: 'egg3',      name: 'Large egg',        baseAmount: 1,   unit: '',   color: '255, 230, 150' },
      { id: 'bsoda',     name: 'Baking soda',      baseAmount: 1,   unit: 'tsp', color: '200, 200, 210' },
    ],
    steps: [
      'Mash bananas and mix with melted butter.',
      'Stir in sugar, egg, and baking soda.',
      'Fold in flour until just combined.',
      'Pour into a greased loaf pan and bake at 350°F (175°C) for 55–60 minutes.',
    ],
  },
  {
    id: 'caesar-salad',
    name: 'Chicken Caesar Salad',
    emoji: '🥗',
    baseServings: 4,
    ingredients: [
      { id: 'romaine',   name: 'Romaine lettuce, chopped', baseAmount: 2, unit: '', color: '120, 190, 90' },
      { id: 'chicken2',  name: 'Grilled chicken breast', baseAmount: 2, unit: '',  color: '255, 200, 150' },
      { id: 'parm',      name: 'Parmesan, shaved', baseAmount: 60,  unit: 'g',  color: '245, 225, 170' },
      { id: 'croutons',  name: 'Croutons',         baseAmount: 1,   unit: 'cup', color: '210, 170, 100' },
      { id: 'dressing',  name: 'Caesar dressing',  baseAmount: 4,   unit: 'tbsp', color: '235, 225, 190' },
    ],
    steps: [
      'Toss chopped romaine with Caesar dressing.',
      'Top with sliced grilled chicken, croutons, and shaved parmesan.',
      'Serve immediately while croutons are still crisp.',
    ],
  },
  {
    id: 'chili-con-carne',
    name: 'Chili Con Carne',
    emoji: '🌶️',
    baseServings: 6,
    ingredients: [
      { id: 'beef',      name: 'Ground beef',      baseAmount: 700, unit: 'g',  color: '190, 80, 60' },
      { id: 'beans',     name: 'Kidney beans, drained', baseAmount: 400, unit: 'g', color: '150, 60, 50' },
      { id: 'tomato3',   name: 'Diced tomatoes',   baseAmount: 800, unit: 'g',  color: '255, 90, 70' },
      { id: 'onion2',    name: 'Onion, diced',     baseAmount: 1,   unit: '',   color: '230, 200, 160' },
      { id: 'chilipowder', name: 'Chili powder',   baseAmount: 2,   unit: 'tbsp', color: '200, 70, 40' },
      { id: 'cumin',     name: 'Ground cumin',     baseAmount: 1,   unit: 'tbsp', color: '210, 170, 90' },
    ],
    steps: [
      'Brown the ground beef with onion until cooked through.',
      'Stir in chili powder and cumin, then add tomatoes and beans.',
      'Simmer uncovered for 30–40 minutes, stirring occasionally.',
    ],
  },
  {
    id: 'margherita-pizza',
    name: 'Margherita Pizza',
    emoji: '🍕',
    baseServings: 4,
    ingredients: [
      { id: 'dough',     name: 'Pizza dough',      baseAmount: 500, unit: 'g',  color: '235, 210, 160' },
      { id: 'tomato4',   name: 'Crushed tomatoes', baseAmount: 200, unit: 'g',  color: '255, 90, 70' },
      { id: 'mozzarella', name: 'Fresh mozzarella', baseAmount: 250, unit: 'g', color: '250, 245, 235' },
      { id: 'basil2',    name: 'Fresh basil leaves', baseAmount: 10, unit: '',  color: '90, 180, 90' },
      { id: 'oil3',      name: 'Olive oil',        baseAmount: 2,   unit: 'tbsp', color: '200, 190, 90' },
    ],
    steps: [
      'Stretch the dough into a round base on a floured surface.',
      'Spread crushed tomatoes and top with torn mozzarella.',
      'Bake at 475°F (245°C) for 10–12 minutes until the crust is golden.',
      'Finish with fresh basil and a drizzle of olive oil.',
    ],
  },
  {
    id: 'beef-tacos',
    name: 'Beef Tacos',
    emoji: '🌮',
    baseServings: 4,
    ingredients: [
      { id: 'beef2',     name: 'Ground beef',      baseAmount: 500, unit: 'g',  color: '190, 80, 60' },
      { id: 'tortillas', name: 'Small tortillas',  baseAmount: 8,   unit: '',   color: '235, 210, 160' },
      { id: 'taco-seasoning', name: 'Taco seasoning', baseAmount: 2, unit: 'tbsp', color: '200, 130, 60' },
      { id: 'lettuce',   name: 'Lettuce, shredded', baseAmount: 1,  unit: 'cup', color: '120, 190, 90' },
      { id: 'cheese',    name: 'Cheddar, shredded', baseAmount: 100, unit: 'g', color: '255, 180, 60' },
      { id: 'salsa',     name: 'Salsa',            baseAmount: 0.5, unit: 'cup', color: '255, 90, 70' },
    ],
    steps: [
      'Brown the ground beef and stir in taco seasoning with a splash of water.',
      'Warm the tortillas in a dry pan or microwave.',
      'Fill each tortilla with beef, lettuce, cheese, and salsa.',
    ],
  },
  {
    id: 'lentil-soup',
    name: 'Hearty Lentil Soup',
    emoji: '🍲',
    baseServings: 6,
    ingredients: [
      { id: 'lentils',   name: 'Dried red lentils', baseAmount: 300, unit: 'g',  color: '235, 150, 90' },
      { id: 'carrot',    name: 'Carrots, diced',   baseAmount: 3,   unit: '',   color: '255, 150, 60' },
      { id: 'celery',    name: 'Celery stalks, diced', baseAmount: 2, unit: '', color: '150, 200, 120' },
      { id: 'onion3',    name: 'Onion, diced',     baseAmount: 1,   unit: '',   color: '230, 200, 160' },
      { id: 'broth',     name: 'Vegetable broth',  baseAmount: 1.5, unit: 'l',  color: '210, 190, 140' },
      { id: 'cumin2',    name: 'Ground cumin',     baseAmount: 1,   unit: 'tsp', color: '210, 170, 90' },
    ],
    steps: [
      'Sauté onion, carrot, and celery until softened.',
      'Add lentils, broth, and cumin, then bring to a boil.',
      'Reduce heat and simmer 25–30 minutes until lentils are tender.',
      'Blend partially for a creamier texture if desired, and season to taste.',
    ],
  },
  {
    id: 'fried-rice',
    name: 'Egg Fried Rice',
    emoji: '🍚',
    baseServings: 4,
    ingredients: [
      { id: 'rice',      name: 'Cooked rice, cold', baseAmount: 600, unit: 'g',  color: '245, 240, 225' },
      { id: 'egg4',      name: 'Large eggs',       baseAmount: 3,   unit: '',   color: '255, 230, 150' },
      { id: 'peas',      name: 'Frozen peas',      baseAmount: 100, unit: 'g',  color: '120, 190, 90' },
      { id: 'scallion',  name: 'Scallions, sliced', baseAmount: 3,  unit: '',   color: '90, 180, 90' },
      { id: 'soy2',      name: 'Soy sauce',        baseAmount: 3,   unit: 'tbsp', color: '110, 70, 50' },
      { id: 'oil4',      name: 'Vegetable oil',    baseAmount: 2,   unit: 'tbsp', color: '200, 190, 90' },
    ],
    steps: [
      'Scramble the eggs in hot oil and set aside.',
      'Stir-fry cold rice and peas until heated through and slightly crisp.',
      'Return the eggs to the pan, add soy sauce and scallions, and toss to combine.',
    ],
  },
];