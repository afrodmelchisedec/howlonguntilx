// FILE: prisma/seed-scripts/patch-user-relations.js
const fs = require('fs');
const path = 'prisma/schema.prisma';
let content = fs.readFileSync(path, 'utf8');

const relations = `
  meetingOverlapConfig       MeetingOverlapConfig?
  recipeBatchConfig          RecipeBatchConfig?
  deadlineBufferConfig       DeadlineBufferConfig?
  savingsGoalConfig          SavingsGoalConfig?
  jetlagConfig                JetlagConfig?
  passwordRotationConfig     PasswordRotationConfig?
  focusBlockConfig            FocusBlockConfig?
  calendarSavedDays           CalendarSavedDays?
  moneyMilestonesConfig       MoneyMilestonesConfig?
  taxDeadlineConfig           TaxDeadlineConfig?
  payrollConfig                PayrollConfig?
  foodFestivalConfig           FoodFestivalConfig?
  restaurantWatchlistConfig    RestaurantWatchlistConfig?
  harvestSeasonsConfig         HarvestSeasonsConfig?
  sportsGamesConfig            SportsGamesConfig?
  entertainmentConfig          EntertainmentConfig?
  energyRhythmConfig           EnergyRhythmConfig?
  fraudResponseConfig          FraudResponseConfig?
  phishingIdentityConfig       PhishingIdentityConfig?
  darkSkyConfig                 DarkSkyConfig?
  techEventsConfig              TechEventsConfig?
`;

const userModelRegex = /(model User \{)([\s\S]*?)(\n\})/;
const match = content.match(userModelRegex);

if (!match) {
  console.error('❌ Could not find `model User { ... }` block — check schema.prisma manually.');
  process.exit(1);
}

if (match[2].includes('techEventsConfig')) {
  console.log('✅ User model already patched — skipping.');
} else {
  const patched = match[1] + match[2] + relations + match[3];
  content = content.replace(userModelRegex, patched);
  fs.writeFileSync(path, content);
  console.log('✅ User model patched with 21 missing back-relation fields.');
}
