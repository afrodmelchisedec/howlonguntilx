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
  country: string;
  baseServings: number;
  ingredients: RecipeIngredient[];
  steps: string[];
}

export interface CountryInfo {
  name: string;
  flag: string;
}

export const COUNTRIES: CountryInfo[] = [
  { name: 'US',        flag: '🇺🇸' },
  { name: 'France',    flag: '🇫🇷' },
  { name: 'Germany',   flag: '🇩🇪' },
  { name: 'Nigeria',   flag: '🇳🇬' },
  { name: 'China',     flag: '🇨🇳' },
  { name: 'Japan',     flag: '🇯🇵' },
  { name: 'India',     flag: '🇮🇳' },
  { name: 'Sweden',    flag: '🇸🇪' },
  { name: 'Australia', flag: '🇦🇺' },
  { name: 'UK',        flag: '🇬🇧' },
];

export const RECIPE_PRESETS: RecipePreset[] = [
  // ───────────── US ─────────────
  {
    id: 'us-cheeseburger', name: 'Classic Cheeseburger', emoji: '🍔', country: 'US', baseServings: 4,
    ingredients: [
      { id: 'us-cb-beef', name: 'Ground beef patties', baseAmount: 500, unit: 'g', color: '190, 80, 60' },
      { id: 'us-cb-buns', name: 'Burger buns', baseAmount: 4, unit: '', color: '235, 210, 160' },
      { id: 'us-cb-cheese', name: 'Cheddar cheese slices', baseAmount: 4, unit: '', color: '255, 180, 60' },
      { id: 'us-cb-lettuce', name: 'Lettuce, shredded', baseAmount: 1, unit: 'cup', color: '120, 190, 90' },
      { id: 'us-cb-ketchup', name: 'Ketchup', baseAmount: 3, unit: 'tbsp', color: '255, 90, 70' },
    ],
    steps: ['Grill patties to desired doneness and melt cheese on top.', 'Toast the buns.', 'Assemble with lettuce and ketchup.'],
  },
  {
    id: 'us-pulled-pork', name: 'BBQ Pulled Pork', emoji: '🍖', country: 'US', baseServings: 6,
    ingredients: [
      { id: 'us-pp-pork', name: 'Pork shoulder', baseAmount: 1.5, unit: 'kg', color: '210, 110, 80' },
      { id: 'us-pp-bbq', name: 'BBQ sauce', baseAmount: 300, unit: 'ml', color: '150, 60, 40' },
      { id: 'us-pp-sugar', name: 'Brown sugar', baseAmount: 3, unit: 'tbsp', color: '196, 132, 90' },
      { id: 'us-pp-buns', name: 'Buns', baseAmount: 6, unit: '', color: '235, 210, 160' },
      { id: 'us-pp-slaw', name: 'Coleslaw', baseAmount: 1, unit: 'cup', color: '210, 230, 150' },
    ],
    steps: ['Slow-cook pork shoulder until it shreds easily.', 'Toss shredded pork with BBQ sauce and brown sugar.', 'Pile onto buns and top with coleslaw.'],
  },
  {
    id: 'us-mac-cheese', name: 'Mac and Cheese', emoji: '🧀', country: 'US', baseServings: 4,
    ingredients: [
      { id: 'us-mc-pasta', name: 'Macaroni', baseAmount: 400, unit: 'g', color: '245, 235, 200' },
      { id: 'us-mc-cheese', name: 'Cheddar cheese', baseAmount: 300, unit: 'g', color: '255, 180, 60' },
      { id: 'us-mc-milk', name: 'Milk', baseAmount: 500, unit: 'ml', color: '240, 240, 235' },
      { id: 'us-mc-butter', name: 'Butter', baseAmount: 50, unit: 'g', color: '255, 159, 10' },
      { id: 'us-mc-flour', name: 'Flour', baseAmount: 30, unit: 'g', color: '235, 210, 160' },
    ],
    steps: ['Cook macaroni until al dente.', 'Make a roux with butter and flour, whisk in milk and cheese until smooth.', 'Combine sauce with macaroni and bake until bubbly.'],
  },
  {
    id: 'us-buffalo-wings', name: 'Buffalo Wings', emoji: '🍗', country: 'US', baseServings: 4,
    ingredients: [
      { id: 'us-bw-wings', name: 'Chicken wings', baseAmount: 1, unit: 'kg', color: '255, 200, 150' },
      { id: 'us-bw-sauce', name: 'Hot sauce', baseAmount: 150, unit: 'ml', color: '230, 70, 40' },
      { id: 'us-bw-butter', name: 'Butter', baseAmount: 60, unit: 'g', color: '255, 159, 10' },
      { id: 'us-bw-flour', name: 'Flour', baseAmount: 50, unit: 'g', color: '235, 210, 160' },
      { id: 'us-bw-celery', name: 'Celery sticks', baseAmount: 1, unit: 'cup', color: '150, 200, 120' },
    ],
    steps: ['Toss wings in flour and fry or bake until crispy.', 'Melt butter with hot sauce and toss wings to coat.', 'Serve with celery sticks.'],
  },
  {
    id: 'us-clam-chowder', name: 'New England Clam Chowder', emoji: '🥣', country: 'US', baseServings: 6,
    ingredients: [
      { id: 'us-cc-clams', name: 'Clams', baseAmount: 500, unit: 'g', color: '210, 190, 170' },
      { id: 'us-cc-potato', name: 'Potatoes', baseAmount: 3, unit: '', color: '235, 210, 160' },
      { id: 'us-cc-bacon', name: 'Bacon', baseAmount: 100, unit: 'g', color: '210, 110, 90' },
      { id: 'us-cc-cream', name: 'Heavy cream', baseAmount: 400, unit: 'ml', color: '245, 240, 225' },
      { id: 'us-cc-onion', name: 'Onion', baseAmount: 1, unit: '', color: '230, 200, 160' },
    ],
    steps: ['Render bacon and sauté onion until soft.', 'Add potatoes, clams, and broth, simmer until tender.', 'Stir in cream and heat through.'],
  },
  {
    id: 'us-apple-pie', name: 'Apple Pie', emoji: '🥧', country: 'US', baseServings: 8,
    ingredients: [
      { id: 'us-ap-apples', name: 'Apples', baseAmount: 6, unit: '', color: '210, 60, 60' },
      { id: 'us-ap-dough', name: 'Pie dough sheets', baseAmount: 2, unit: '', color: '235, 210, 160' },
      { id: 'us-ap-sugar', name: 'Sugar', baseAmount: 150, unit: 'g', color: '245, 240, 225' },
      { id: 'us-ap-cinnamon', name: 'Cinnamon', baseAmount: 1, unit: 'tsp', color: '150, 100, 60' },
      { id: 'us-ap-butter', name: 'Butter', baseAmount: 30, unit: 'g', color: '255, 159, 10' },
    ],
    steps: ['Toss sliced apples with sugar and cinnamon.', 'Fill the pie dough and dot with butter.', 'Bake at 375°F (190°C) for 45 minutes.'],
  },
  {
    id: 'us-fried-chicken', name: 'Southern Fried Chicken', emoji: '🍗', country: 'US', baseServings: 4,
    ingredients: [
      { id: 'us-fc-chicken', name: 'Chicken pieces', baseAmount: 1, unit: 'kg', color: '255, 200, 150' },
      { id: 'us-fc-buttermilk', name: 'Buttermilk', baseAmount: 500, unit: 'ml', color: '245, 240, 225' },
      { id: 'us-fc-flour', name: 'Flour', baseAmount: 300, unit: 'g', color: '235, 210, 160' },
      { id: 'us-fc-paprika', name: 'Paprika', baseAmount: 1, unit: 'tbsp', color: '200, 90, 60' },
      { id: 'us-fc-oil', name: 'Oil for frying', baseAmount: 500, unit: 'ml', color: '210, 190, 90' },
    ],
    steps: ['Marinate chicken in buttermilk for at least an hour.', 'Dredge in seasoned flour.', 'Fry until golden and cooked through.'],
  },

  // ───────────── France ─────────────
  {
    id: 'fr-coq-au-vin', name: 'Coq au Vin', emoji: '🍷', country: 'France', baseServings: 4,
    ingredients: [
      { id: 'fr-cv-chicken', name: 'Chicken thighs', baseAmount: 1, unit: 'kg', color: '255, 200, 150' },
      { id: 'fr-cv-wine', name: 'Red wine', baseAmount: 500, unit: 'ml', color: '110, 30, 50' },
      { id: 'fr-cv-bacon', name: 'Bacon lardons', baseAmount: 150, unit: 'g', color: '210, 110, 90' },
      { id: 'fr-cv-mushroom', name: 'Mushrooms', baseAmount: 250, unit: 'g', color: '200, 180, 160' },
      { id: 'fr-cv-onion', name: 'Pearl onions', baseAmount: 200, unit: 'g', color: '230, 200, 160' },
    ],
    steps: ['Brown chicken and bacon, then set aside.', 'Sauté onions and mushrooms.', 'Return chicken, add wine, and simmer until tender.'],
  },
  {
    id: 'fr-beef-bourguignon', name: 'Beef Bourguignon', emoji: '🥘', country: 'France', baseServings: 6,
    ingredients: [
      { id: 'fr-bb-beef', name: 'Beef chuck', baseAmount: 1, unit: 'kg', color: '190, 80, 60' },
      { id: 'fr-bb-wine', name: 'Red wine', baseAmount: 600, unit: 'ml', color: '110, 30, 50' },
      { id: 'fr-bb-carrot', name: 'Carrots', baseAmount: 3, unit: '', color: '255, 150, 60' },
      { id: 'fr-bb-bacon', name: 'Bacon', baseAmount: 150, unit: 'g', color: '210, 110, 90' },
      { id: 'fr-bb-onion', name: 'Pearl onions', baseAmount: 200, unit: 'g', color: '230, 200, 160' },
    ],
    steps: ['Brown beef and bacon in batches.', 'Add wine, carrots, and onions.', 'Simmer low and slow for 2–3 hours until tender.'],
  },
  {
    id: 'fr-ratatouille', name: 'Ratatouille', emoji: '🍆', country: 'France', baseServings: 4,
    ingredients: [
      { id: 'fr-rt-eggplant', name: 'Eggplant', baseAmount: 1, unit: '', color: '110, 70, 110' },
      { id: 'fr-rt-zucchini', name: 'Zucchini', baseAmount: 2, unit: '', color: '120, 190, 90' },
      { id: 'fr-rt-peppers', name: 'Bell peppers', baseAmount: 2, unit: '', color: '255, 120, 90' },
      { id: 'fr-rt-tomato', name: 'Tomatoes', baseAmount: 4, unit: '', color: '255, 90, 70' },
      { id: 'fr-rt-oil', name: 'Olive oil', baseAmount: 3, unit: 'tbsp', color: '200, 190, 90' },
    ],
    steps: ['Slice all vegetables thinly.', 'Layer or sauté with olive oil and herbs.', 'Bake or simmer until tender.'],
  },
  {
    id: 'fr-onion-soup', name: 'French Onion Soup', emoji: '🧅', country: 'France', baseServings: 4,
    ingredients: [
      { id: 'fr-os-onion', name: 'Onions, large', baseAmount: 4, unit: '', color: '230, 200, 160' },
      { id: 'fr-os-broth', name: 'Beef broth', baseAmount: 1, unit: 'l', color: '150, 100, 70' },
      { id: 'fr-os-gruyere', name: 'Gruyère cheese', baseAmount: 150, unit: 'g', color: '245, 225, 170' },
      { id: 'fr-os-baguette', name: 'Baguette slices', baseAmount: 4, unit: '', color: '235, 210, 160' },
      { id: 'fr-os-butter', name: 'Butter', baseAmount: 30, unit: 'g', color: '255, 159, 10' },
    ],
    steps: ['Caramelize onions slowly in butter.', 'Add broth and simmer.', 'Top with baguette and cheese, then broil until bubbly.'],
  },
  {
    id: 'fr-quiche-lorraine', name: 'Quiche Lorraine', emoji: '🥧', country: 'France', baseServings: 6,
    ingredients: [
      { id: 'fr-ql-crust', name: 'Pie crust', baseAmount: 1, unit: '', color: '235, 210, 160' },
      { id: 'fr-ql-eggs', name: 'Eggs', baseAmount: 4, unit: '', color: '255, 230, 150' },
      { id: 'fr-ql-cream', name: 'Heavy cream', baseAmount: 250, unit: 'ml', color: '245, 240, 225' },
      { id: 'fr-ql-bacon', name: 'Bacon lardons', baseAmount: 150, unit: 'g', color: '210, 110, 90' },
      { id: 'fr-ql-gruyere', name: 'Gruyère cheese', baseAmount: 100, unit: 'g', color: '245, 225, 170' },
    ],
    steps: ['Blind-bake the pie crust.', 'Whisk eggs with cream and season, then add bacon and cheese.', 'Pour in and bake until set.'],
  },
  {
    id: 'fr-crepes', name: 'Crêpes', emoji: '🥞', country: 'France', baseServings: 4,
    ingredients: [
      { id: 'fr-cr-flour', name: 'Flour', baseAmount: 250, unit: 'g', color: '235, 210, 160' },
      { id: 'fr-cr-milk', name: 'Milk', baseAmount: 500, unit: 'ml', color: '240, 240, 235' },
      { id: 'fr-cr-eggs', name: 'Eggs', baseAmount: 3, unit: '', color: '255, 230, 150' },
      { id: 'fr-cr-butter', name: 'Butter', baseAmount: 30, unit: 'g', color: '255, 159, 10' },
      { id: 'fr-cr-sugar', name: 'Sugar', baseAmount: 1, unit: 'tbsp', color: '245, 240, 225' },
    ],
    steps: ['Whisk all ingredients into a smooth, thin batter.', 'Rest for 30 minutes.', 'Cook thin layers in a hot buttered pan.'],
  },
  {
    id: 'fr-croque-monsieur', name: 'Croque Monsieur', emoji: '🥪', country: 'France', baseServings: 4,
    ingredients: [
      { id: 'fr-cm-bread', name: 'Bread slices', baseAmount: 8, unit: '', color: '235, 210, 160' },
      { id: 'fr-cm-ham', name: 'Ham slices', baseAmount: 4, unit: '', color: '235, 160, 150' },
      { id: 'fr-cm-gruyere', name: 'Gruyère cheese', baseAmount: 150, unit: 'g', color: '245, 225, 170' },
      { id: 'fr-cm-butter', name: 'Butter', baseAmount: 30, unit: 'g', color: '255, 159, 10' },
      { id: 'fr-cm-mustard', name: 'Dijon mustard', baseAmount: 2, unit: 'tbsp', color: '210, 180, 90' },
    ],
    steps: ['Spread mustard on bread and layer with ham and cheese.', 'Butter the outside and grill until golden.', 'Top with béchamel and broil if desired.'],
  },

  // ───────────── Germany ─────────────
  {
    id: 'de-sauerbraten', name: 'Sauerbraten', emoji: '🍖', country: 'Germany', baseServings: 6,
    ingredients: [
      { id: 'de-sb-beef', name: 'Beef roast', baseAmount: 1.5, unit: 'kg', color: '190, 80, 60' },
      { id: 'de-sb-vinegar', name: 'Red wine vinegar', baseAmount: 300, unit: 'ml', color: '150, 40, 60' },
      { id: 'de-sb-onion', name: 'Onion', baseAmount: 1, unit: '', color: '230, 200, 160' },
      { id: 'de-sb-crumbs', name: 'Gingersnap crumbs', baseAmount: 60, unit: 'g', color: '196, 132, 90' },
      { id: 'de-sb-bay', name: 'Bay leaves', baseAmount: 3, unit: '', color: '90, 140, 90' },
    ],
    steps: ['Marinate beef in vinegar and spices for 2–3 days.', 'Braise slowly until tender.', 'Thicken the sauce with gingersnap crumbs.'],
  },
  {
    id: 'de-bratwurst', name: 'Bratwurst with Sauerkraut', emoji: '🌭', country: 'Germany', baseServings: 4,
    ingredients: [
      { id: 'de-bw-sausage', name: 'Bratwurst', baseAmount: 8, unit: '', color: '230, 170, 130' },
      { id: 'de-bw-kraut', name: 'Sauerkraut', baseAmount: 400, unit: 'g', color: '220, 220, 180' },
      { id: 'de-bw-onion', name: 'Onion', baseAmount: 1, unit: '', color: '230, 200, 160' },
      { id: 'de-bw-caraway', name: 'Caraway seeds', baseAmount: 1, unit: 'tsp', color: '150, 120, 70' },
      { id: 'de-bw-mustard', name: 'Mustard', baseAmount: 2, unit: 'tbsp', color: '210, 180, 90' },
    ],
    steps: ['Grill or pan-fry the bratwurst until browned.', 'Simmer sauerkraut with onion and caraway.', 'Serve together with mustard.'],
  },
  {
    id: 'de-schnitzel', name: 'Schnitzel', emoji: '🍽️', country: 'Germany', baseServings: 4,
    ingredients: [
      { id: 'de-sc-cutlets', name: 'Pork or veal cutlets', baseAmount: 4, unit: '', color: '255, 200, 150' },
      { id: 'de-sc-flour', name: 'Flour', baseAmount: 100, unit: 'g', color: '235, 210, 160' },
      { id: 'de-sc-eggs', name: 'Eggs', baseAmount: 2, unit: '', color: '255, 230, 150' },
      { id: 'de-sc-crumbs', name: 'Breadcrumbs', baseAmount: 150, unit: 'g', color: '220, 190, 140' },
      { id: 'de-sc-lemon', name: 'Lemon', baseAmount: 1, unit: '', color: '235, 230, 100' },
    ],
    steps: ['Pound cutlets thin.', 'Coat in flour, egg, then breadcrumbs.', 'Fry until golden and serve with lemon.'],
  },
  {
    id: 'de-currywurst', name: 'Currywurst', emoji: '🌭', country: 'Germany', baseServings: 4,
    ingredients: [
      { id: 'de-cw-sausage', name: 'Bratwurst sausages', baseAmount: 4, unit: '', color: '230, 170, 130' },
      { id: 'de-cw-ketchup', name: 'Ketchup', baseAmount: 200, unit: 'ml', color: '255, 90, 70' },
      { id: 'de-cw-curry', name: 'Curry powder', baseAmount: 2, unit: 'tbsp', color: '210, 170, 60' },
      { id: 'de-cw-worcester', name: 'Worcestershire sauce', baseAmount: 1, unit: 'tbsp', color: '110, 70, 50' },
      { id: 'de-cw-fries', name: 'Fries', baseAmount: 400, unit: 'g', color: '235, 200, 100' },
    ],
    steps: ['Fry or grill the sausages and slice.', 'Simmer ketchup with curry powder and Worcestershire sauce.', 'Pour over sausage slices and serve with fries.'],
  },
  {
    id: 'de-kasespatzle', name: 'Käsespätzle', emoji: '🧀', country: 'Germany', baseServings: 4,
    ingredients: [
      { id: 'de-ks-spatzle', name: 'Spätzle noodles', baseAmount: 500, unit: 'g', color: '245, 235, 200' },
      { id: 'de-ks-gruyere', name: 'Gruyère cheese', baseAmount: 200, unit: 'g', color: '245, 225, 170' },
      { id: 'de-ks-onion', name: 'Onion', baseAmount: 2, unit: '', color: '230, 200, 160' },
      { id: 'de-ks-butter', name: 'Butter', baseAmount: 30, unit: 'g', color: '255, 159, 10' },
      { id: 'de-ks-chives', name: 'Chives', baseAmount: 2, unit: 'tbsp', color: '90, 180, 90' },
    ],
    steps: ['Boil spätzle until tender.', 'Layer with cheese and melt through.', 'Top with crispy fried onions and chives.'],
  },
  {
    id: 'de-kartoffelpuffer', name: 'Kartoffelpuffer', emoji: '🥔', country: 'Germany', baseServings: 4,
    ingredients: [
      { id: 'de-kp-potato', name: 'Potatoes, large', baseAmount: 4, unit: '', color: '235, 210, 160' },
      { id: 'de-kp-onion', name: 'Onion', baseAmount: 1, unit: '', color: '230, 200, 160' },
      { id: 'de-kp-egg', name: 'Egg', baseAmount: 1, unit: '', color: '255, 230, 150' },
      { id: 'de-kp-flour', name: 'Flour', baseAmount: 2, unit: 'tbsp', color: '235, 210, 160' },
      { id: 'de-kp-oil', name: 'Oil for frying', baseAmount: 100, unit: 'ml', color: '210, 190, 90' },
    ],
    steps: ['Grate potatoes and onion, squeeze out excess liquid.', 'Mix with egg and flour.', 'Fry spoonfuls until golden and crisp.'],
  },
  {
    id: 'de-black-forest-cake', name: 'Black Forest Cake', emoji: '🍰', country: 'Germany', baseServings: 10,
    ingredients: [
      { id: 'de-bf-sponge', name: 'Chocolate sponge', baseAmount: 1, unit: '', color: '120, 80, 60' },
      { id: 'de-bf-cherries', name: 'Cherries', baseAmount: 400, unit: 'g', color: '170, 40, 60' },
      { id: 'de-bf-cream', name: 'Whipped cream', baseAmount: 500, unit: 'ml', color: '245, 240, 225' },
      { id: 'de-bf-kirsch', name: 'Kirsch', baseAmount: 3, unit: 'tbsp', color: '150, 40, 50' },
      { id: 'de-bf-chocolate', name: 'Dark chocolate shavings', baseAmount: 60, unit: 'g', color: '90, 60, 45' },
    ],
    steps: ['Soak cake layers with kirsch.', 'Layer with whipped cream and cherries.', 'Frost and decorate with chocolate shavings.'],
  },

  // ───────────── Nigeria ─────────────
  {
    id: 'ng-jollof-rice', name: 'Jollof Rice', emoji: '🍚', country: 'Nigeria', baseServings: 6,
    ingredients: [
      { id: 'ng-jr-rice', name: 'Rice', baseAmount: 600, unit: 'g', color: '245, 235, 200' },
      { id: 'ng-jr-tomato', name: 'Tomatoes', baseAmount: 6, unit: '', color: '255, 90, 70' },
      { id: 'ng-jr-pepper', name: 'Red bell peppers', baseAmount: 2, unit: '', color: '255, 120, 90' },
      { id: 'ng-jr-onion', name: 'Onion', baseAmount: 2, unit: '', color: '230, 200, 160' },
      { id: 'ng-jr-stock', name: 'Chicken stock', baseAmount: 500, unit: 'ml', color: '235, 200, 140' },
    ],
    steps: ['Blend tomatoes, peppers, and onion into a sauce.', 'Fry the sauce down until deep red.', 'Add rice and stock, and cook until tender.'],
  },
  {
    id: 'ng-egusi-soup', name: 'Egusi Soup', emoji: '🥣', country: 'Nigeria', baseServings: 6,
    ingredients: [
      { id: 'ng-eg-melon', name: 'Ground melon seeds', baseAmount: 200, unit: 'g', color: '235, 220, 160' },
      { id: 'ng-eg-spinach', name: 'Spinach', baseAmount: 300, unit: 'g', color: '90, 160, 80' },
      { id: 'ng-eg-palmoil', name: 'Palm oil', baseAmount: 100, unit: 'ml', color: '235, 130, 40' },
      { id: 'ng-eg-beef', name: 'Beef', baseAmount: 500, unit: 'g', color: '190, 80, 60' },
      { id: 'ng-eg-stockfish', name: 'Stock fish', baseAmount: 100, unit: 'g', color: '210, 190, 170' },
    ],
    steps: ['Fry the egusi paste in palm oil until it forms lumps.', 'Add meat, stock fish, and water, and simmer.', 'Stir in spinach at the end.'],
  },
  {
    id: 'ng-suya', name: 'Suya', emoji: '🍢', country: 'Nigeria', baseServings: 4,
    ingredients: [
      { id: 'ng-su-beef', name: 'Beef strips', baseAmount: 600, unit: 'g', color: '190, 80, 60' },
      { id: 'ng-su-yaji', name: 'Suya spice (yaji)', baseAmount: 3, unit: 'tbsp', color: '200, 90, 40' },
      { id: 'ng-su-peanut', name: 'Ground peanuts', baseAmount: 100, unit: 'g', color: '210, 170, 110' },
      { id: 'ng-su-onion', name: 'Onion', baseAmount: 1, unit: '', color: '230, 200, 160' },
      { id: 'ng-su-oil', name: 'Oil', baseAmount: 2, unit: 'tbsp', color: '210, 190, 90' },
    ],
    steps: ['Thread beef onto skewers.', 'Coat generously with suya spice and peanut mix.', 'Grill over open flame, turning often.'],
  },
  {
    id: 'ng-puff-puff', name: 'Puff Puff', emoji: '🍩', country: 'Nigeria', baseServings: 8,
    ingredients: [
      { id: 'ng-pp-flour', name: 'Flour', baseAmount: 300, unit: 'g', color: '235, 210, 160' },
      { id: 'ng-pp-sugar', name: 'Sugar', baseAmount: 80, unit: 'g', color: '245, 240, 225' },
      { id: 'ng-pp-yeast', name: 'Yeast', baseAmount: 1, unit: 'tbsp', color: '235, 220, 170' },
      { id: 'ng-pp-water', name: 'Warm water', baseAmount: 250, unit: 'ml', color: '220, 235, 245' },
      { id: 'ng-pp-oil', name: 'Oil for frying', baseAmount: 500, unit: 'ml', color: '210, 190, 90' },
    ],
    steps: ['Mix flour, sugar, and yeast with warm water into a thick batter.', 'Let rise for an hour.', 'Deep-fry spoonfuls until golden.'],
  },
  {
    id: 'ng-moin-moin', name: 'Moin Moin', emoji: '🍮', country: 'Nigeria', baseServings: 6,
    ingredients: [
      { id: 'ng-mm-peas', name: 'Black-eyed peas', baseAmount: 400, unit: 'g', color: '235, 220, 170' },
      { id: 'ng-mm-pepper', name: 'Red bell pepper', baseAmount: 1, unit: '', color: '255, 120, 90' },
      { id: 'ng-mm-onion', name: 'Onion', baseAmount: 1, unit: '', color: '230, 200, 160' },
      { id: 'ng-mm-palmoil', name: 'Palm oil', baseAmount: 60, unit: 'ml', color: '235, 130, 40' },
      { id: 'ng-mm-eggs', name: 'Eggs', baseAmount: 2, unit: '', color: '255, 230, 150' },
    ],
    steps: ['Blend peas, pepper, and onion into a smooth paste.', 'Mix in palm oil and eggs.', 'Steam in wrapped portions until firm.'],
  },
  {
    id: 'ng-pepper-soup', name: 'Pepper Soup', emoji: '🍲', country: 'Nigeria', baseServings: 6,
    ingredients: [
      { id: 'ng-ps-goat', name: 'Goat meat', baseAmount: 600, unit: 'g', color: '190, 80, 60' },
      { id: 'ng-ps-spice', name: 'Pepper soup spice mix', baseAmount: 2, unit: 'tbsp', color: '200, 90, 40' },
      { id: 'ng-ps-scotch', name: 'Scotch bonnet pepper', baseAmount: 1, unit: '', color: '230, 80, 40' },
      { id: 'ng-ps-onion', name: 'Onion', baseAmount: 1, unit: '', color: '230, 200, 160' },
      { id: 'ng-ps-stock', name: 'Stock', baseAmount: 1, unit: 'l', color: '235, 200, 140' },
    ],
    steps: ['Simmer meat with onion until tender.', 'Add spice mix and scotch bonnet.', 'Cook until fragrant and well seasoned.'],
  },
  {
    id: 'ng-dodo', name: 'Dodo (Fried Plantain)', emoji: '🍌', country: 'Nigeria', baseServings: 4,
    ingredients: [
      { id: 'ng-dd-plantain', name: 'Ripe plantains', baseAmount: 4, unit: '', color: '235, 200, 90' },
      { id: 'ng-dd-oil', name: 'Oil for frying', baseAmount: 300, unit: 'ml', color: '210, 190, 90' },
      { id: 'ng-dd-salt', name: 'Salt', baseAmount: 0.5, unit: 'tsp', color: '210, 210, 215' },
    ],
    steps: ['Slice plantains diagonally.', 'Fry in hot oil until golden on both sides.', 'Season lightly with salt.'],
  },

  // ───────────── China ─────────────
  {
    id: 'cn-kung-pao', name: 'Kung Pao Chicken', emoji: '🥢', country: 'China', baseServings: 4,
    ingredients: [
      { id: 'cn-kp-chicken', name: 'Chicken breast', baseAmount: 500, unit: 'g', color: '255, 200, 150' },
      { id: 'cn-kp-peanuts', name: 'Peanuts', baseAmount: 80, unit: 'g', color: '210, 170, 110' },
      { id: 'cn-kp-chili', name: 'Dried chilies', baseAmount: 6, unit: '', color: '190, 50, 40' },
      { id: 'cn-kp-soy', name: 'Soy sauce', baseAmount: 3, unit: 'tbsp', color: '110, 70, 50' },
      { id: 'cn-kp-scallion', name: 'Scallions', baseAmount: 3, unit: '', color: '90, 180, 90' },
    ],
    steps: ['Stir-fry chicken until just cooked.', 'Add dried chilies and peanuts.', 'Toss with soy sauce and scallions.'],
  },
  {
    id: 'cn-mapo-tofu', name: 'Mapo Tofu', emoji: '🌶️', country: 'China', baseServings: 4,
    ingredients: [
      { id: 'cn-mt-tofu', name: 'Silken tofu', baseAmount: 400, unit: 'g', color: '245, 240, 230' },
      { id: 'cn-mt-pork', name: 'Ground pork', baseAmount: 150, unit: 'g', color: '210, 110, 80' },
      { id: 'cn-mt-doubanjiang', name: 'Doubanjiang', baseAmount: 2, unit: 'tbsp', color: '170, 50, 40' },
      { id: 'cn-mt-scallion', name: 'Scallions', baseAmount: 3, unit: '', color: '90, 180, 90' },
      { id: 'cn-mt-peppercorn', name: 'Sichuan peppercorns', baseAmount: 1, unit: 'tsp', color: '150, 60, 50' },
    ],
    steps: ['Brown the pork with doubanjiang.', 'Add tofu cubes and simmer gently.', 'Finish with scallions and ground sichuan peppercorn.'],
  },
  {
    id: 'cn-peking-duck', name: 'Peking Duck', emoji: '🦆', country: 'China', baseServings: 4,
    ingredients: [
      { id: 'cn-pd-duck', name: 'Whole duck', baseAmount: 1, unit: '', color: '210, 130, 80' },
      { id: 'cn-pd-fivespice', name: 'Five-spice powder', baseAmount: 1, unit: 'tbsp', color: '170, 110, 70' },
      { id: 'cn-pd-hoisin', name: 'Hoisin sauce', baseAmount: 100, unit: 'ml', color: '130, 70, 50' },
      { id: 'cn-pd-scallion', name: 'Scallions', baseAmount: 4, unit: '', color: '90, 180, 90' },
      { id: 'cn-pd-pancakes', name: 'Thin pancakes', baseAmount: 12, unit: '', color: '245, 235, 210' },
    ],
    steps: ['Season duck with five-spice and air-dry the skin.', 'Roast until the skin is crackling and golden.', 'Carve and serve with pancakes, hoisin, and scallions.'],
  },
  {
    id: 'cn-jiaozi', name: 'Jiaozi (Dumplings)', emoji: '🥟', country: 'China', baseServings: 6,
    ingredients: [
      { id: 'cn-jz-wrappers', name: 'Dumpling wrappers', baseAmount: 30, unit: '', color: '245, 235, 210' },
      { id: 'cn-jz-pork', name: 'Ground pork', baseAmount: 300, unit: 'g', color: '210, 110, 80' },
      { id: 'cn-jz-cabbage', name: 'Napa cabbage', baseAmount: 200, unit: 'g', color: '200, 220, 170' },
      { id: 'cn-jz-ginger', name: 'Ginger', baseAmount: 1, unit: 'tbsp', color: '235, 210, 140' },
      { id: 'cn-jz-soy', name: 'Soy sauce', baseAmount: 2, unit: 'tbsp', color: '110, 70, 50' },
    ],
    steps: ['Mix pork, cabbage, ginger, and soy sauce into a filling.', 'Wrap in dumpling skins.', 'Boil, steam, or pan-fry until cooked through.'],
  },
  {
    id: 'cn-sweet-sour-pork', name: 'Sweet and Sour Pork', emoji: '🍖', country: 'China', baseServings: 4,
    ingredients: [
      { id: 'cn-ssp-pork', name: 'Pork shoulder', baseAmount: 500, unit: 'g', color: '210, 110, 80' },
      { id: 'cn-ssp-pineapple', name: 'Pineapple chunks', baseAmount: 200, unit: 'g', color: '245, 220, 90' },
      { id: 'cn-ssp-pepper', name: 'Bell peppers', baseAmount: 2, unit: '', color: '255, 120, 90' },
      { id: 'cn-ssp-vinegar', name: 'Rice vinegar', baseAmount: 60, unit: 'ml', color: '235, 225, 190' },
      { id: 'cn-ssp-ketchup', name: 'Ketchup', baseAmount: 60, unit: 'ml', color: '255, 90, 70' },
    ],
    steps: ['Fry battered pork until crisp.', 'Stir-fry peppers and pineapple.', 'Toss everything in a sweet and sour sauce.'],
  },
  {
    id: 'cn-hot-sour-soup', name: 'Hot and Sour Soup', emoji: '🍜', country: 'China', baseServings: 6,
    ingredients: [
      { id: 'cn-hs-tofu', name: 'Tofu', baseAmount: 200, unit: 'g', color: '245, 240, 230' },
      { id: 'cn-hs-mushroom', name: 'Mushrooms', baseAmount: 150, unit: 'g', color: '200, 180, 160' },
      { id: 'cn-hs-egg', name: 'Egg', baseAmount: 1, unit: '', color: '255, 230, 150' },
      { id: 'cn-hs-vinegar', name: 'Rice vinegar', baseAmount: 60, unit: 'ml', color: '235, 225, 190' },
      { id: 'cn-hs-pepper', name: 'White pepper', baseAmount: 1, unit: 'tsp', color: '225, 220, 205' },
    ],
    steps: ['Simmer tofu and mushrooms in broth.', 'Season with vinegar and white pepper.', 'Swirl in beaten egg just before serving.'],
  },
  {
    id: 'cn-chow-mein', name: 'Chow Mein', emoji: '🍝', country: 'China', baseServings: 4,
    ingredients: [
      { id: 'cn-cm-noodles', name: 'Egg noodles', baseAmount: 400, unit: 'g', color: '245, 220, 140' },
      { id: 'cn-cm-cabbage', name: 'Cabbage', baseAmount: 2, unit: 'cup', color: '200, 220, 170' },
      { id: 'cn-cm-carrot', name: 'Carrot', baseAmount: 1, unit: '', color: '255, 150, 60' },
      { id: 'cn-cm-soy', name: 'Soy sauce', baseAmount: 3, unit: 'tbsp', color: '110, 70, 50' },
      { id: 'cn-cm-sprouts', name: 'Bean sprouts', baseAmount: 1, unit: 'cup', color: '235, 235, 220' },
    ],
    steps: ['Boil noodles until just tender.', 'Stir-fry vegetables in a hot wok.', 'Toss noodles through with soy sauce and bean sprouts.'],
  },

  // ───────────── Japan ─────────────
  {
    id: 'jp-sushi-rolls', name: 'Sushi Rolls', emoji: '🍣', country: 'Japan', baseServings: 4,
    ingredients: [
      { id: 'jp-sr-rice', name: 'Sushi rice', baseAmount: 400, unit: 'g', color: '245, 240, 230' },
      { id: 'jp-sr-nori', name: 'Nori sheets', baseAmount: 6, unit: '', color: '50, 70, 50' },
      { id: 'jp-sr-vinegar', name: 'Rice vinegar', baseAmount: 60, unit: 'ml', color: '235, 225, 190' },
      { id: 'jp-sr-fish', name: 'Salmon or tuna', baseAmount: 200, unit: 'g', color: '235, 130, 110' },
      { id: 'jp-sr-cucumber', name: 'Cucumber', baseAmount: 1, unit: '', color: '150, 200, 120' },
    ],
    steps: ['Season cooked rice with rice vinegar.', 'Layer rice and fillings on nori and roll tightly.', 'Slice into pieces and serve with soy sauce.'],
  },
  {
    id: 'jp-ramen', name: 'Ramen', emoji: '🍜', country: 'Japan', baseServings: 4,
    ingredients: [
      { id: 'jp-rm-noodles', name: 'Ramen noodles', baseAmount: 400, unit: 'g', color: '245, 220, 140' },
      { id: 'jp-rm-pork', name: 'Pork belly', baseAmount: 300, unit: 'g', color: '210, 110, 80' },
      { id: 'jp-rm-soy', name: 'Soy sauce', baseAmount: 60, unit: 'ml', color: '110, 70, 50' },
      { id: 'jp-rm-egg', name: 'Soft-boiled eggs', baseAmount: 4, unit: '', color: '255, 220, 130' },
      { id: 'jp-rm-scallion', name: 'Scallions', baseAmount: 3, unit: '', color: '90, 180, 90' },
    ],
    steps: ['Simmer a rich broth with soy sauce.', 'Cook noodles separately and add to bowls.', 'Top with sliced pork, egg, and scallions.'],
  },
  {
    id: 'jp-teriyaki-chicken', name: 'Teriyaki Chicken', emoji: '🍗', country: 'Japan', baseServings: 4,
    ingredients: [
      { id: 'jp-tc-chicken', name: 'Chicken thighs', baseAmount: 600, unit: 'g', color: '255, 200, 150' },
      { id: 'jp-tc-soy', name: 'Soy sauce', baseAmount: 80, unit: 'ml', color: '110, 70, 50' },
      { id: 'jp-tc-mirin', name: 'Mirin', baseAmount: 60, unit: 'ml', color: '235, 220, 170' },
      { id: 'jp-tc-sugar', name: 'Sugar', baseAmount: 2, unit: 'tbsp', color: '245, 240, 225' },
      { id: 'jp-tc-sesame', name: 'Sesame seeds', baseAmount: 1, unit: 'tbsp', color: '230, 220, 190' },
    ],
    steps: ['Pan-sear chicken skin-side down until crisp.', 'Add soy sauce, mirin, and sugar, and simmer to glaze.', 'Sprinkle with sesame seeds.'],
  },
  {
    id: 'jp-tempura', name: 'Tempura', emoji: '🍤', country: 'Japan', baseServings: 4,
    ingredients: [
      { id: 'jp-tp-shrimp', name: 'Shrimp', baseAmount: 12, unit: '', color: '245, 170, 140' },
      { id: 'jp-tp-veg', name: 'Assorted vegetables', baseAmount: 300, unit: 'g', color: '150, 200, 120' },
      { id: 'jp-tp-flour', name: 'Flour', baseAmount: 150, unit: 'g', color: '235, 210, 160' },
      { id: 'jp-tp-water', name: 'Ice-cold water', baseAmount: 250, unit: 'ml', color: '220, 235, 245' },
      { id: 'jp-tp-oil', name: 'Oil for frying', baseAmount: 500, unit: 'ml', color: '210, 190, 90' },
    ],
    steps: ['Make a light batter with flour and ice water.', 'Dip shrimp and vegetables and fry immediately.', 'Drain and serve hot with dipping sauce.'],
  },
  {
    id: 'jp-miso-soup', name: 'Miso Soup', emoji: '🍲', country: 'Japan', baseServings: 4,
    ingredients: [
      { id: 'jp-ms-dashi', name: 'Dashi stock', baseAmount: 1, unit: 'l', color: '210, 190, 140' },
      { id: 'jp-ms-miso', name: 'Miso paste', baseAmount: 4, unit: 'tbsp', color: '170, 120, 70' },
      { id: 'jp-ms-tofu', name: 'Tofu', baseAmount: 150, unit: 'g', color: '245, 240, 230' },
      { id: 'jp-ms-wakame', name: 'Wakame seaweed', baseAmount: 10, unit: 'g', color: '60, 100, 80' },
      { id: 'jp-ms-scallion', name: 'Scallions', baseAmount: 2, unit: '', color: '90, 180, 90' },
    ],
    steps: ['Heat the dashi stock gently.', 'Dissolve miso paste into the broth off the heat.', 'Add tofu, seaweed, and scallions.'],
  },
  {
    id: 'jp-okonomiyaki', name: 'Okonomiyaki', emoji: '🥞', country: 'Japan', baseServings: 4,
    ingredients: [
      { id: 'jp-ok-cabbage', name: 'Cabbage', baseAmount: 300, unit: 'g', color: '200, 220, 170' },
      { id: 'jp-ok-flour', name: 'Flour', baseAmount: 150, unit: 'g', color: '235, 210, 160' },
      { id: 'jp-ok-eggs', name: 'Eggs', baseAmount: 2, unit: '', color: '255, 230, 150' },
      { id: 'jp-ok-pork', name: 'Pork belly slices', baseAmount: 150, unit: 'g', color: '210, 110, 80' },
      { id: 'jp-ok-sauce', name: 'Okonomiyaki sauce', baseAmount: 60, unit: 'ml', color: '110, 60, 40' },
    ],
    steps: ['Mix cabbage, flour, and eggs into a batter.', 'Cook on a griddle topped with pork belly.', 'Flip and finish with sauce and toppings.'],
  },
  {
    id: 'jp-katsu-curry', name: 'Katsu Curry', emoji: '🍛', country: 'Japan', baseServings: 4,
    ingredients: [
      { id: 'jp-kc-cutlets', name: 'Pork or chicken cutlets', baseAmount: 4, unit: '', color: '255, 200, 150' },
      { id: 'jp-kc-roux', name: 'Japanese curry roux', baseAmount: 100, unit: 'g', color: '190, 130, 50' },
      { id: 'jp-kc-potato', name: 'Potato', baseAmount: 2, unit: '', color: '235, 210, 160' },
      { id: 'jp-kc-carrot', name: 'Carrot', baseAmount: 1, unit: '', color: '255, 150, 60' },
      { id: 'jp-kc-onion', name: 'Onion', baseAmount: 1, unit: '', color: '230, 200, 160' },
    ],
    steps: ['Bread and fry the cutlets until crisp.', 'Simmer curry roux with vegetables until thick.', 'Slice cutlet over rice and top with curry.'],
  },

  // ───────────── India ─────────────
  {
    id: 'in-butter-chicken', name: 'Butter Chicken', emoji: '🍛', country: 'India', baseServings: 4,
    ingredients: [
      { id: 'in-bc-chicken', name: 'Chicken thighs', baseAmount: 600, unit: 'g', color: '255, 200, 150' },
      { id: 'in-bc-tomato', name: 'Tomato purée', baseAmount: 400, unit: 'g', color: '255, 90, 70' },
      { id: 'in-bc-butter', name: 'Butter', baseAmount: 60, unit: 'g', color: '255, 159, 10' },
      { id: 'in-bc-cream', name: 'Heavy cream', baseAmount: 150, unit: 'ml', color: '245, 240, 225' },
      { id: 'in-bc-garam', name: 'Garam masala', baseAmount: 2, unit: 'tsp', color: '170, 110, 60' },
    ],
    steps: ['Marinate and grill or pan-sear the chicken.', 'Simmer tomato purée with butter and garam masala.', 'Stir in chicken and cream to finish.'],
  },
  {
    id: 'in-chana-masala', name: 'Chana Masala', emoji: '🥘', country: 'India', baseServings: 4,
    ingredients: [
      { id: 'in-cm-chickpeas', name: 'Chickpeas', baseAmount: 400, unit: 'g', color: '230, 200, 140' },
      { id: 'in-cm-tomato', name: 'Tomatoes', baseAmount: 3, unit: '', color: '255, 90, 70' },
      { id: 'in-cm-onion', name: 'Onion', baseAmount: 1, unit: '', color: '230, 200, 160' },
      { id: 'in-cm-gingergarlic', name: 'Ginger-garlic paste', baseAmount: 1, unit: 'tbsp', color: '230, 220, 190' },
      { id: 'in-cm-garam', name: 'Garam masala', baseAmount: 1, unit: 'tsp', color: '170, 110, 60' },
    ],
    steps: ['Sauté onion and ginger-garlic paste until golden.', 'Add tomatoes and spices, cooking down into a thick sauce.', 'Stir in chickpeas and simmer.'],
  },
  {
    id: 'in-biryani', name: 'Chicken Biryani', emoji: '🍚', country: 'India', baseServings: 6,
    ingredients: [
      { id: 'in-br-rice', name: 'Basmati rice', baseAmount: 500, unit: 'g', color: '245, 240, 225' },
      { id: 'in-br-chicken', name: 'Chicken', baseAmount: 700, unit: 'g', color: '255, 200, 150' },
      { id: 'in-br-yogurt', name: 'Yogurt', baseAmount: 200, unit: 'g', color: '245, 245, 235' },
      { id: 'in-br-onion', name: 'Fried onions', baseAmount: 100, unit: 'g', color: '210, 150, 80' },
      { id: 'in-br-spice', name: 'Biryani spice mix', baseAmount: 2, unit: 'tbsp', color: '170, 100, 60' },
    ],
    steps: ['Marinate chicken in yogurt and spices.', 'Partially cook rice separately.', 'Layer chicken and rice, then steam together until fully cooked.'],
  },
  {
    id: 'in-palak-paneer', name: 'Palak Paneer', emoji: '🥬', country: 'India', baseServings: 4,
    ingredients: [
      { id: 'in-pp-spinach', name: 'Spinach', baseAmount: 500, unit: 'g', color: '90, 160, 80' },
      { id: 'in-pp-paneer', name: 'Paneer', baseAmount: 250, unit: 'g', color: '245, 240, 225' },
      { id: 'in-pp-onion', name: 'Onion', baseAmount: 1, unit: '', color: '230, 200, 160' },
      { id: 'in-pp-garlic', name: 'Garlic', baseAmount: 3, unit: '', color: '230, 220, 190' },
      { id: 'in-pp-cream', name: 'Cream', baseAmount: 60, unit: 'ml', color: '245, 240, 225' },
    ],
    steps: ['Blanch and blend spinach into a smooth purée.', 'Sauté onion and garlic, then add spinach purée.', 'Add paneer cubes and finish with cream.'],
  },
  {
    id: 'in-samosas', name: 'Samosas', emoji: '🥟', country: 'India', baseServings: 8,
    ingredients: [
      { id: 'in-sm-pastry', name: 'Pastry sheets', baseAmount: 16, unit: '', color: '235, 210, 160' },
      { id: 'in-sm-potato', name: 'Potatoes', baseAmount: 3, unit: '', color: '235, 210, 160' },
      { id: 'in-sm-peas', name: 'Peas', baseAmount: 100, unit: 'g', color: '120, 190, 90' },
      { id: 'in-sm-cumin', name: 'Cumin seeds', baseAmount: 1, unit: 'tsp', color: '150, 110, 60' },
      { id: 'in-sm-oil', name: 'Oil for frying', baseAmount: 500, unit: 'ml', color: '210, 190, 90' },
    ],
    steps: ['Mash spiced potatoes and peas for the filling.', 'Wrap in pastry into triangles.', 'Deep-fry until golden and crisp.'],
  },
  {
    id: 'in-tandoori-chicken', name: 'Tandoori Chicken', emoji: '🍗', country: 'India', baseServings: 4,
    ingredients: [
      { id: 'in-tk-chicken', name: 'Chicken legs', baseAmount: 8, unit: '', color: '255, 200, 150' },
      { id: 'in-tk-yogurt', name: 'Yogurt', baseAmount: 200, unit: 'g', color: '245, 245, 235' },
      { id: 'in-tk-masala', name: 'Tandoori masala', baseAmount: 3, unit: 'tbsp', color: '210, 90, 60' },
      { id: 'in-tk-lemon', name: 'Lemon', baseAmount: 1, unit: '', color: '235, 230, 100' },
      { id: 'in-tk-gingergarlic', name: 'Ginger-garlic paste', baseAmount: 1, unit: 'tbsp', color: '230, 220, 190' },
    ],
    steps: ['Marinate chicken in yogurt, spices, and lemon for several hours.', 'Roast or grill at high heat until charred and cooked through.', 'Serve with extra lemon.'],
  },
  {
    id: 'in-dal-tadka', name: 'Dal Tadka', emoji: '🍲', country: 'India', baseServings: 4,
    ingredients: [
      { id: 'in-dt-lentils', name: 'Yellow lentils', baseAmount: 300, unit: 'g', color: '235, 210, 130' },
      { id: 'in-dt-cumin', name: 'Cumin seeds', baseAmount: 1, unit: 'tsp', color: '150, 110, 60' },
      { id: 'in-dt-garlic', name: 'Garlic', baseAmount: 3, unit: '', color: '230, 220, 190' },
      { id: 'in-dt-tomato', name: 'Tomato', baseAmount: 1, unit: '', color: '255, 90, 70' },
      { id: 'in-dt-ghee', name: 'Ghee', baseAmount: 2, unit: 'tbsp', color: '255, 200, 90' },
    ],
    steps: ['Boil lentils until soft.', 'Prepare a tempering of ghee, cumin, and garlic.', 'Pour the tempering over the dal and stir through.'],
  },

  // ───────────── Sweden ─────────────
  {
    id: 'se-meatballs', name: 'Swedish Meatballs', emoji: '🍡', country: 'Sweden', baseServings: 4,
    ingredients: [
      { id: 'se-mb-meat', name: 'Ground beef and pork', baseAmount: 500, unit: 'g', color: '200, 100, 80' },
      { id: 'se-mb-crumbs', name: 'Breadcrumbs', baseAmount: 60, unit: 'g', color: '220, 190, 140' },
      { id: 'se-mb-egg', name: 'Egg', baseAmount: 1, unit: '', color: '255, 230, 150' },
      { id: 'se-mb-cream', name: 'Cream sauce', baseAmount: 300, unit: 'ml', color: '245, 240, 225' },
      { id: 'se-mb-jam', name: 'Lingonberry jam', baseAmount: 100, unit: 'g', color: '190, 50, 60' },
    ],
    steps: ['Mix meat with breadcrumbs and egg, then roll into balls.', 'Pan-fry until browned and cooked through.', 'Serve with cream sauce and lingonberry jam.'],
  },
  {
    id: 'se-gravlax', name: 'Gravlax', emoji: '🐟', country: 'Sweden', baseServings: 6,
    ingredients: [
      { id: 'se-gl-salmon', name: 'Salmon fillet', baseAmount: 600, unit: 'g', color: '235, 130, 110' },
      { id: 'se-gl-salt', name: 'Salt', baseAmount: 100, unit: 'g', color: '225, 225, 225' },
      { id: 'se-gl-sugar', name: 'Sugar', baseAmount: 80, unit: 'g', color: '245, 240, 225' },
      { id: 'se-gl-dill', name: 'Fresh dill', baseAmount: 1, unit: '', color: '90, 160, 80' },
      { id: 'se-gl-mustard', name: 'Mustard sauce', baseAmount: 100, unit: 'ml', color: '210, 180, 90' },
    ],
    steps: ['Cure the salmon in a salt, sugar, and dill mixture for 48 hours.', 'Rinse and slice thinly.', 'Serve with mustard sauce.'],
  },
  {
    id: 'se-artsoppa', name: 'Ärtsoppa (Pea Soup)', emoji: '🍲', country: 'Sweden', baseServings: 6,
    ingredients: [
      { id: 'se-as-peas', name: 'Yellow split peas', baseAmount: 400, unit: 'g', color: '235, 220, 140' },
      { id: 'se-as-pork', name: 'Pork knuckle or bacon', baseAmount: 300, unit: 'g', color: '210, 110, 90' },
      { id: 'se-as-onion', name: 'Onion', baseAmount: 1, unit: '', color: '230, 200, 160' },
      { id: 'se-as-thyme', name: 'Thyme', baseAmount: 1, unit: 'tsp', color: '110, 150, 100' },
      { id: 'se-as-mustard', name: 'Mustard', baseAmount: 2, unit: 'tbsp', color: '210, 180, 90' },
    ],
    steps: ['Soak peas and simmer with pork until tender.', 'Add onion and thyme.', 'Serve hot with a side of mustard.'],
  },
  {
    id: 'se-toast-skagen', name: 'Toast Skagen', emoji: '🍤', country: 'Sweden', baseServings: 4,
    ingredients: [
      { id: 'se-ts-shrimp', name: 'Shrimp, peeled', baseAmount: 300, unit: 'g', color: '245, 170, 140' },
      { id: 'se-ts-mayo', name: 'Mayonnaise', baseAmount: 100, unit: 'g', color: '245, 240, 220' },
      { id: 'se-ts-dill', name: 'Dill', baseAmount: 2, unit: 'tbsp', color: '90, 160, 80' },
      { id: 'se-ts-lemon', name: 'Lemon', baseAmount: 1, unit: '', color: '235, 230, 100' },
      { id: 'se-ts-bread', name: 'Bread slices', baseAmount: 4, unit: '', color: '235, 210, 160' },
    ],
    steps: ['Mix shrimp with mayonnaise, dill, and a squeeze of lemon.', 'Toast the bread slices.', 'Pile the shrimp mixture on top and serve.'],
  },
  {
    id: 'se-kanelbullar', name: 'Kanelbullar (Cinnamon Buns)', emoji: '🥐', country: 'Sweden', baseServings: 12,
    ingredients: [
      { id: 'se-kb-flour', name: 'Flour', baseAmount: 500, unit: 'g', color: '235, 210, 160' },
      { id: 'se-kb-milk', name: 'Milk', baseAmount: 250, unit: 'ml', color: '240, 240, 235' },
      { id: 'se-kb-butter', name: 'Butter', baseAmount: 100, unit: 'g', color: '255, 159, 10' },
      { id: 'se-kb-cinnamon', name: 'Cinnamon', baseAmount: 2, unit: 'tbsp', color: '150, 100, 60' },
      { id: 'se-kb-sugar', name: 'Sugar', baseAmount: 100, unit: 'g', color: '245, 240, 225' },
    ],
    steps: ['Make a soft yeasted dough and let it rise.', 'Roll out and spread with butter, cinnamon, and sugar, then roll up and slice.', 'Bake until golden.'],
  },
  {
    id: 'se-janssons-frestelse', name: "Jansson's Frestelse", emoji: '🥔', country: 'Sweden', baseServings: 6,
    ingredients: [
      { id: 'se-jf-potato', name: 'Potatoes', baseAmount: 6, unit: '', color: '235, 210, 160' },
      { id: 'se-jf-sprats', name: 'Pickled sprats', baseAmount: 100, unit: 'g', color: '190, 170, 150' },
      { id: 'se-jf-onion', name: 'Onion', baseAmount: 1, unit: '', color: '230, 200, 160' },
      { id: 'se-jf-cream', name: 'Cream', baseAmount: 300, unit: 'ml', color: '245, 240, 225' },
      { id: 'se-jf-crumbs', name: 'Breadcrumbs', baseAmount: 30, unit: 'g', color: '220, 190, 140' },
    ],
    steps: ['Layer sliced potatoes, onion, and sprats in a dish.', 'Pour cream over the top.', 'Bake until the potatoes are tender and the top is golden.'],
  },
  {
    id: 'se-kladdkaka', name: 'Kladdkaka (Sticky Chocolate Cake)', emoji: '🍫', country: 'Sweden', baseServings: 8,
    ingredients: [
      { id: 'se-kk-butter', name: 'Butter', baseAmount: 100, unit: 'g', color: '255, 159, 10' },
      { id: 'se-kk-sugar', name: 'Sugar', baseAmount: 200, unit: 'g', color: '245, 240, 225' },
      { id: 'se-kk-cocoa', name: 'Cocoa powder', baseAmount: 50, unit: 'g', color: '90, 60, 45' },
      { id: 'se-kk-flour', name: 'Flour', baseAmount: 100, unit: 'g', color: '235, 210, 160' },
      { id: 'se-kk-eggs', name: 'Eggs', baseAmount: 2, unit: '', color: '255, 230, 150' },
    ],
    steps: ['Melt butter and mix with sugar and cocoa.', 'Stir in eggs and flour until just combined.', 'Bake briefly so the center stays gooey.'],
  },

  // ───────────── Australia ─────────────
  {
    id: 'au-meat-pie', name: 'Meat Pie', emoji: '🥧', country: 'Australia', baseServings: 6,
    ingredients: [
      { id: 'au-mp-beef', name: 'Ground beef', baseAmount: 500, unit: 'g', color: '190, 80, 60' },
      { id: 'au-mp-stock', name: 'Beef stock', baseAmount: 250, unit: 'ml', color: '150, 100, 70' },
      { id: 'au-mp-pastry', name: 'Puff pastry sheets', baseAmount: 2, unit: '', color: '245, 235, 210' },
      { id: 'au-mp-onion', name: 'Onion', baseAmount: 1, unit: '', color: '230, 200, 160' },
      { id: 'au-mp-sauce', name: 'Tomato sauce', baseAmount: 2, unit: 'tbsp', color: '255, 90, 70' },
    ],
    steps: ['Brown beef and onion, then simmer with stock and tomato sauce until thick.', 'Fill pastry cases with the mixture.', 'Bake until golden and flaky.'],
  },
  {
    id: 'au-lamington', name: 'Lamington', emoji: '🍰', country: 'Australia', baseServings: 12,
    ingredients: [
      { id: 'au-lm-sponge', name: 'Sponge cake', baseAmount: 1, unit: '', color: '245, 230, 180' },
      { id: 'au-lm-icing', name: 'Chocolate icing', baseAmount: 300, unit: 'g', color: '110, 70, 50' },
      { id: 'au-lm-coconut', name: 'Desiccated coconut', baseAmount: 200, unit: 'g', color: '245, 245, 235' },
      { id: 'au-lm-jam', name: 'Raspberry jam', baseAmount: 100, unit: 'g', color: '190, 50, 60' },
    ],
    steps: ['Cut sponge cake into squares.', 'Dip each piece in chocolate icing, then roll in coconut.', 'Chill until set.'],
  },
  {
    id: 'au-barramundi-salad', name: 'Barramundi with Salad', emoji: '🐟', country: 'Australia', baseServings: 4,
    ingredients: [
      { id: 'au-bs-fish', name: 'Barramundi fillets', baseAmount: 4, unit: '', color: '235, 210, 190' },
      { id: 'au-bs-greens', name: 'Mixed salad greens', baseAmount: 200, unit: 'g', color: '120, 190, 90' },
      { id: 'au-bs-lemon', name: 'Lemon', baseAmount: 1, unit: '', color: '235, 230, 100' },
      { id: 'au-bs-oil', name: 'Olive oil', baseAmount: 3, unit: 'tbsp', color: '200, 190, 90' },
      { id: 'au-bs-tomato', name: 'Cherry tomatoes', baseAmount: 150, unit: 'g', color: '255, 90, 70' },
    ],
    steps: ['Pan-sear the barramundi skin-side down until crisp.', 'Toss salad greens with tomatoes, olive oil, and lemon.', 'Serve the fish over the salad.'],
  },
  {
    id: 'au-vegemite-toast', name: 'Vegemite Toast', emoji: '🍞', country: 'Australia', baseServings: 4,
    ingredients: [
      { id: 'au-vt-bread', name: 'Bread slices', baseAmount: 8, unit: '', color: '235, 210, 160' },
      { id: 'au-vt-vegemite', name: 'Vegemite', baseAmount: 2, unit: 'tbsp', color: '60, 40, 30' },
      { id: 'au-vt-butter', name: 'Butter', baseAmount: 30, unit: 'g', color: '255, 159, 10' },
    ],
    steps: ['Toast the bread until golden.', 'Spread a thin layer of butter.', 'Add a thin layer of vegemite over the top.'],
  },
  {
    id: 'au-pavlova', name: 'Pavlova', emoji: '🍓', country: 'Australia', baseServings: 8,
    ingredients: [
      { id: 'au-pv-eggwhite', name: 'Egg whites', baseAmount: 6, unit: '', color: '245, 245, 235' },
      { id: 'au-pv-sugar', name: 'Sugar', baseAmount: 300, unit: 'g', color: '245, 240, 225' },
      { id: 'au-pv-cream', name: 'Whipped cream', baseAmount: 300, unit: 'ml', color: '245, 240, 225' },
      { id: 'au-pv-strawberry', name: 'Strawberries', baseAmount: 300, unit: 'g', color: '220, 60, 70' },
      { id: 'au-pv-kiwi', name: 'Kiwi', baseAmount: 2, unit: '', color: '150, 190, 90' },
    ],
    steps: ['Whisk egg whites and sugar into a stiff, glossy meringue.', 'Bake low and slow until crisp outside and soft inside.', 'Top with cream and fresh fruit.'],
  },
  {
    id: 'au-anzac-biscuits', name: 'ANZAC Biscuits', emoji: '🍪', country: 'Australia', baseServings: 12,
    ingredients: [
      { id: 'au-ab-oats', name: 'Rolled oats', baseAmount: 150, unit: 'g', color: '220, 195, 150' },
      { id: 'au-ab-coconut', name: 'Desiccated coconut', baseAmount: 100, unit: 'g', color: '245, 245, 235' },
      { id: 'au-ab-flour', name: 'Flour', baseAmount: 150, unit: 'g', color: '235, 210, 160' },
      { id: 'au-ab-butter', name: 'Butter', baseAmount: 125, unit: 'g', color: '255, 159, 10' },
      { id: 'au-ab-syrup', name: 'Golden syrup', baseAmount: 60, unit: 'g', color: '210, 150, 40' },
    ],
    steps: ['Mix dry ingredients together.', 'Melt butter with golden syrup and stir through.', 'Shape into rounds and bake until golden.'],
  },
  {
    id: 'au-sausage-sizzle', name: 'Sausage Sizzle', emoji: '🌭', country: 'Australia', baseServings: 6,
    ingredients: [
      { id: 'au-ss-sausage', name: 'Sausages', baseAmount: 6, unit: '', color: '230, 170, 130' },
      { id: 'au-ss-bread', name: 'Sliced white bread', baseAmount: 6, unit: '', color: '235, 210, 160' },
      { id: 'au-ss-onion', name: 'Fried onions', baseAmount: 1, unit: 'cup', color: '210, 150, 80' },
      { id: 'au-ss-sauce', name: 'Tomato sauce', baseAmount: 60, unit: 'ml', color: '255, 90, 70' },
      { id: 'au-ss-butter', name: 'Butter', baseAmount: 20, unit: 'g', color: '255, 159, 10' },
    ],
    steps: ['Grill the sausages until cooked through.', 'Fry onions until soft and golden.', 'Wrap sausage in bread with onions and tomato sauce.'],
  },

  // ───────────── UK ─────────────
  {
    id: 'uk-fish-chips', name: 'Fish and Chips', emoji: '🐟', country: 'UK', baseServings: 4,
    ingredients: [
      { id: 'uk-fc-fish', name: 'White fish fillets', baseAmount: 4, unit: '', color: '235, 220, 200' },
      { id: 'uk-fc-potato', name: 'Potatoes, large', baseAmount: 4, unit: '', color: '235, 210, 160' },
      { id: 'uk-fc-flour', name: 'Flour', baseAmount: 150, unit: 'g', color: '235, 210, 160' },
      { id: 'uk-fc-beer', name: 'Beer', baseAmount: 250, unit: 'ml', color: '210, 170, 70' },
      { id: 'uk-fc-oil', name: 'Oil for frying', baseAmount: 1, unit: 'l', color: '210, 190, 90' },
    ],
    steps: ['Cut potatoes into chips and fry until golden.', 'Dip fish in a beer batter.', 'Fry the fish until crisp and serve together.'],
  },
  {
    id: 'uk-shepherds-pie', name: "Shepherd's Pie", emoji: '🥧', country: 'UK', baseServings: 6,
    ingredients: [
      { id: 'uk-sp-lamb', name: 'Ground lamb', baseAmount: 600, unit: 'g', color: '190, 80, 60' },
      { id: 'uk-sp-mash', name: 'Mashed potatoes', baseAmount: 800, unit: 'g', color: '245, 235, 220' },
      { id: 'uk-sp-carrot', name: 'Carrots', baseAmount: 2, unit: '', color: '255, 150, 60' },
      { id: 'uk-sp-peas', name: 'Peas', baseAmount: 100, unit: 'g', color: '120, 190, 90' },
      { id: 'uk-sp-stock', name: 'Beef stock', baseAmount: 200, unit: 'ml', color: '150, 100, 70' },
    ],
    steps: ['Brown the lamb with carrots and stock until thickened.', 'Transfer to a baking dish and top with mashed potatoes.', 'Bake until golden on top.'],
  },
  {
    id: 'uk-full-english', name: 'Full English Breakfast', emoji: '🍳', country: 'UK', baseServings: 4,
    ingredients: [
      { id: 'uk-fe-bacon', name: 'Bacon rashers', baseAmount: 8, unit: '', color: '220, 130, 110' },
      { id: 'uk-fe-sausage', name: 'Sausages', baseAmount: 8, unit: '', color: '230, 170, 130' },
      { id: 'uk-fe-eggs', name: 'Eggs', baseAmount: 4, unit: '', color: '255, 230, 150' },
      { id: 'uk-fe-beans', name: 'Baked beans', baseAmount: 400, unit: 'g', color: '210, 90, 60' },
      { id: 'uk-fe-tomato', name: 'Grilled tomatoes', baseAmount: 4, unit: '', color: '255, 90, 70' },
    ],
    steps: ['Fry or grill the bacon and sausages until cooked through.', 'Fry the eggs to your liking.', 'Heat the beans and grill the tomatoes, then serve together.'],
  },
  {
    id: 'uk-bangers-mash', name: 'Bangers and Mash', emoji: '🌭', country: 'UK', baseServings: 4,
    ingredients: [
      { id: 'uk-bm-sausage', name: 'Sausages', baseAmount: 8, unit: '', color: '230, 170, 130' },
      { id: 'uk-bm-potato', name: 'Potatoes', baseAmount: 6, unit: '', color: '235, 210, 160' },
      { id: 'uk-bm-butter', name: 'Butter', baseAmount: 40, unit: 'g', color: '255, 159, 10' },
      { id: 'uk-bm-milk', name: 'Milk', baseAmount: 100, unit: 'ml', color: '240, 240, 235' },
      { id: 'uk-bm-gravy', name: 'Onion gravy', baseAmount: 300, unit: 'ml', color: '150, 100, 70' },
    ],
    steps: ['Grill or fry the sausages until browned.', 'Boil and mash the potatoes with butter and milk.', 'Serve the sausages over mash with onion gravy.'],
  },
  {
    id: 'uk-beef-wellington', name: 'Beef Wellington', emoji: '🥩', country: 'UK', baseServings: 6,
    ingredients: [
      { id: 'uk-bw-beef', name: 'Beef fillet', baseAmount: 1, unit: 'kg', color: '190, 80, 60' },
      { id: 'uk-bw-pastry', name: 'Puff pastry sheet', baseAmount: 1, unit: '', color: '245, 235, 210' },
      { id: 'uk-bw-mushroom', name: 'Mushrooms', baseAmount: 300, unit: 'g', color: '200, 180, 160' },
      { id: 'uk-bw-prosciutto', name: 'Prosciutto slices', baseAmount: 8, unit: '', color: '220, 130, 120' },
      { id: 'uk-bw-mustard', name: 'Dijon mustard', baseAmount: 2, unit: 'tbsp', color: '210, 180, 90' },
    ],
    steps: ['Sear the beef fillet and brush with mustard.', 'Wrap in a mushroom duxelles and prosciutto, then encase in puff pastry.', 'Bake until the pastry is golden and the beef is cooked to your liking.'],
  },
  {
    id: 'uk-sticky-toffee', name: 'Sticky Toffee Pudding', emoji: '🍮', country: 'UK', baseServings: 8,
    ingredients: [
      { id: 'uk-st-dates', name: 'Dates, chopped', baseAmount: 200, unit: 'g', color: '150, 90, 60' },
      { id: 'uk-st-flour', name: 'Flour', baseAmount: 200, unit: 'g', color: '235, 210, 160' },
      { id: 'uk-st-butter', name: 'Butter', baseAmount: 100, unit: 'g', color: '255, 159, 10' },
      { id: 'uk-st-sugar', name: 'Sugar', baseAmount: 150, unit: 'g', color: '245, 240, 225' },
      { id: 'uk-st-toffee', name: 'Toffee sauce', baseAmount: 250, unit: 'ml', color: '170, 110, 60' },
    ],
    steps: ['Soak dates in hot water and blend into the batter.', 'Bake the sponge until risen and set.', 'Serve warm, soaked in toffee sauce.'],
  },
  {
    id: 'uk-sunday-roast', name: 'Sunday Roast', emoji: '🍗', country: 'UK', baseServings: 6,
    ingredients: [
      { id: 'uk-sr-beef', name: 'Roast beef joint', baseAmount: 1.5, unit: 'kg', color: '190, 80, 60' },
      { id: 'uk-sr-yorkshire', name: 'Yorkshire pudding batter', baseAmount: 1, unit: '', color: '245, 235, 210' },
      { id: 'uk-sr-potato', name: 'Roast potatoes', baseAmount: 800, unit: 'g', color: '235, 190, 110' },
      { id: 'uk-sr-carrot', name: 'Carrots', baseAmount: 3, unit: '', color: '255, 150, 60' },
      { id: 'uk-sr-gravy', name: 'Gravy', baseAmount: 400, unit: 'ml', color: '150, 100, 70' },
    ],
    steps: ['Roast the beef to your desired doneness and rest.', 'Roast potatoes and carrots alongside.', 'Bake the Yorkshire puddings hot and fast, then serve everything with gravy.'],
  },
];