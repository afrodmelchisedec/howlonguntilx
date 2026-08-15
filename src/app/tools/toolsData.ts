// FILE: src/app/tools/toolsData.ts
// Shared static data for the /tools page — split out so both the server
// page (metadata, banner fetch) and the client grid (search/filter/pagination)
// can import it without duplicating anything.

export const CATEGORY_META: Record<string, { label: string; emoji: string }> = {
  biology: { label: 'Biology', emoji: '🧬' },
  family:  { label: 'Family', emoji: '👨‍👩‍👧' },
  finance: { label: 'Finance', emoji: '💰' },
  food:    { label: 'Food', emoji: '🍽️' },
  culture: { label: 'Culture', emoji: '🎭' },
  health:  { label: 'Health', emoji: '❤️' },
  science: { label: 'Science', emoji: '🔬' },
  time:    { label: 'Time', emoji: '⏳' },
};

export interface Tool {
  slug: string;
  title: string;
  description: string;
  category: keyof typeof CATEGORY_META;
}

// Titles/descriptions copied verbatim from each tool's own page metadata —
// single source of truth stays those files; update there, then mirror here.
//
// Category assignments marked "GUESS" have no mapping in Category.tools yet
// (checked via the DB directly) — verify these in /admin → Categories and
// correct this list if any are wrong. Everything else is DB-confirmed.
export const TOOLS: Tool[] = [
  { slug: 'payroll-runway', category: 'finance',
    title: 'Payday Runway',
    description: 'A live countdown to your next payday paired with a draggable bill timeline and a real cash-flow projection that flags when you\u2019d go negative before payday.' },
  { slug: 'tax-budget-deadlines', category: 'finance',
    title: 'Safe-Harbor Planner',
    description: 'Drag your tax deadline targets, track saved-so-far, and watch your Safe-Harbor Score update live.' },
  { slug: 'savings-goal-slider', category: 'finance',
    title: 'Goal Stack Planner',
    description: 'Drag your monthly savings across multiple goals and watch months-to-goal recalculate live.' },
  { slug: 'runway-lab', category: 'finance',
    title: 'Payday Budget Simulator',
    description: 'Drag your income, expenses, and spending split to see your budget runway update in real time.' },
  { slug: 'subscription-density', category: 'finance',
    title: 'Subscription Renewal Density Map',
    description: 'Drag your subscriptions onto a calendar to see which weeks hit your card hardest — and catch duplicate charges.' },
  { slug: 'fraud-response-clock', category: 'finance',
    title: 'Fraud Response Clock',
    description: 'Track fraud incidents with real dispute-deadline countdowns, an action checklist, a 5-axis Risk Radar, and quick-copy emergency contacts.' },

  { slug: 'food-festival-passport', category: 'food',
    title: 'Festival Passport',
    description: 'Swipe to discover food festivals, watch a real ticket-stub countdown to your next one, and stamp your passport when you go.' },
  { slug: 'restaurant-launches', category: 'food',
    title: 'Grand Opening Tracker',
    description: 'Live countdowns to upcoming restaurant openings, with hype meters and a draggable personal watchlist.' },
  { slug: 'recipe-batch-dial', category: 'food',
    title: 'Recipe Batch-Scale Dial',
    description: 'Drag a dial to scale any recipe up or down and watch every ingredient stretch in real time.' },
  { slug: 'harvest-seasons', category: 'food',
    title: 'Season Basket',
    description: 'Build a basket of produce and watch a live season timeline, freshness meters, and peak alerts tell you exactly what to buy this week.' },

  { slug: 'energy-rhythm-mapper', category: 'health',
    title: 'Energy Rhythm Mapper',
    description: 'Draw your energy across the day, find your Flow Window, and build a daily streak tracking your rhythm.' },
  { slug: 'life-expectancy-calculator', category: 'health',
    title: 'Life Expectancy Calculator',
    description: 'Enter your age, region, and lifestyle factors to see a live, personalized countdown built on real actuarial life tables.' },

  { slug: 'sports-games-tracker', category: 'culture',
    title: 'Game Day Tracker',
    description: 'Track upcoming games with a scoreboard countdown, a game-density heatmap, prediction tug-of-war sliders, and a running prediction accuracy score.' },
  { slug: 'entertainment-watchlist', category: 'culture',
    title: 'Release Queue',
    description: 'Track movies, shows, games, and albums with a drag-to-reorder priority queue, a marquee countdown hero, a release calendar, and binge pace tracking.' },
  { slug: 'jetlag-adjustment-dragger', category: 'culture',
    title: 'Jet-Lag Adjustment Dragger',
    description: 'Drag your home and destination bedtimes on a dual 24-hour ring and get a personalized pre-flight sleep-shift schedule.' },
  { slug: 'shopping-deals-radar', category: 'culture',
    title: 'Deal Radar',
    description: 'Spin the daily deal wheel, track discounts you care about, and never miss one before it expires.' },

  { slug: 'meeting-overlap', category: 'time',
    title: 'Time Zone Radar',
    description: 'Drag teammate work-hour arcs around a live radar to find your best meeting time across time zones.' },
  { slug: 'deadline-buffer-slider', category: 'time',
    title: 'Launch Countdown Planner',
    description: 'Drag your launch date and see real working days, split across design/dev/QA, recalculate live.' },
  { slug: 'focus-block-builder', category: 'time',
    title: 'Day Timeline Builder',
    description: 'Drag task blocks onto a single-day timeline and watch hours allocated, free time, and overlaps update live.' },

  { slug: 'tech-events', category: 'science',
    title: 'Tech Events Calendar',
    description: 'Every major keynote, product launch, and conference on one calendar — CES, WWDC, Google I/O, and more, with countdowns and a saveable watchlist.' },
  { slug: 'dark-sky-explorer', category: 'science',
    title: 'Dark Sky Explorer',
    description: 'Drag a light-pollution slider to reveal a live starfield, browse a 30-night stargazing forecast, and track real meteor shower dates.' },
  { slug: 'password-rotation-board', category: 'science',
    title: 'Password Rotation Priority Board',
    description: 'Drag your accounts onto a risk-priority line and see live urgency-coded rotation reminders based on real dates.' },
  { slug: 'phishing-identity-watch', category: 'science',
    title: 'Phishing Radar & Identity Watch',
    description: 'A live Threat Gauge for suspicious messages, a Spot the Phish quiz, and an Identity Watch monitoring list with real check-cadence countdowns.' },
  { slug: 'am-i-pregnant-probability-tracker', category: 'family',
    title: 'Am I Pregnant? Probability Tracker',
    description: 'Track your statistical odds of a positive pregnancy test day by day, log symptoms, and see exactly when a test becomes reliable — grounded in hCG detection research, not guesswork.' },
  { slug: 'labor-onset-predictor', category: 'family',
    title: 'Labor Onset Predictor',
    description: 'Log mucus plug loss, baby dropping, or water breaking to see a statistical likelihood status for the week ahead, time contractions against the 5-1-1 rule, and share a read-only Labor Watch link with family.' },
  { slug: 'birth-control-effectiveness-countdown', category: 'family',
    title: 'Birth Control Effectiveness Countdown',
    description: 'Pick your method and start date to see a live coverage meter counting up to typical full effectiveness — or, for emergency contraception, a closing window counting down — plus refill reminders and method history.' },
  { slug: 'newborn-milestone-tracker', category: 'family',
    title: 'Newborn Milestone Tracker',
    description: 'Enter your baby\'s birth date to see an auto-generated milestone timeline you can scrub through, log growth check-ins, add notes to any milestone, and share a read-only Milestone Watch link with family.' },
  { slug: 'baby-animal-nest-watch', category: 'family',
    title: 'Baby Animal Nest-Watch',
    description: 'Pick a baby bird, bunny, kitten, or puppy and its arrival date to scrub through a real milestone timeline, then test yourself with the Guess the Stage quiz and share your score.' },

  { slug: 'kitten-growth-tracker', category: 'biology',
    title: 'Kitten Growth Tracker',
    description: 'Enter your kitten\'s birth date to get a live countdown to every milestone — eyes opening, first steps, weaning, full growth — drag a scrubber to preview any age, and (Pro) log real weight, actual dates, and compare littermates.' },

  { slug: 'egg-hatch-calculator', category: 'biology',
    title: 'Egg Hatch Countdown Calculator',
    description: 'Pick a species — chicken, duck, goose, bluebird, dove, eagle, house finch, or a general wild bird — and get a live countdown to hatch, with a turning schedule and incubator gauge for backyard species, and (Pro) a full clutch tracker with candling notes.' },
    
  { slug: 'pet-growth-gestation-calculator', category: 'biology',
    title: 'Pet Fully Grown & Gestation Calculator',
    description: 'See when your kitten or puppy will be fully grown by breed size, or count down to a litter\'s due date with a week-by-week development wheel — for cats and dogs.' },
  { slug: 'garden-growth-bloom-tracker', category: 'biology',
    title: 'Garden Growth & Bloom Tracker',
    description: 'Count down from planting to sprout and on to bloom or harvest — for dahlia tubers, carrots, onions, and grass seed — with a growing stem visual and a stage-by-stage timeline.' },
];
