-- CreateTable
CREATE TABLE "MeetingOverlapConfig" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "participants" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MeetingOverlapConfig_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RecipeBatchConfig" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "recipeId" TEXT NOT NULL,
    "servings" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RecipeBatchConfig_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DeadlineBufferConfig" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "daysOut" INTEGER NOT NULL,
    "phases" JSONB NOT NULL,
    "holidays" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DeadlineBufferConfig_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SavingsGoalConfig" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "monthlyTotal" INTEGER NOT NULL,
    "goals" JSONB NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SavingsGoalConfig_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "JetlagConfig" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "homeBedtime" INTEGER NOT NULL,
    "destBedtime" INTEGER NOT NULL,
    "prepDays" INTEGER NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "JetlagConfig_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PasswordRotationConfig" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "accounts" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PasswordRotationConfig_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FocusBlockConfig" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "blocks" JSONB NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FocusBlockConfig_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CalendarSavedDays" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "days" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CalendarSavedDays_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MoneyMilestonesConfig" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "startingBalance" INTEGER NOT NULL,
    "monthlyContribution" INTEGER NOT NULL,
    "growthRatePct" DOUBLE PRECISION NOT NULL,
    "horizonMonths" INTEGER NOT NULL,
    "milestones" JSONB NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MoneyMilestonesConfig_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TaxDeadlineConfig" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "deadlines" JSONB NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TaxDeadlineConfig_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PayrollConfig" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "frequency" TEXT NOT NULL,
    "lastPayDate" TIMESTAMP(3) NOT NULL,
    "grossPerPeriod" DOUBLE PRECISION NOT NULL,
    "startingBalance" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "deductions" JSONB NOT NULL,
    "bills" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PayrollConfig_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FoodFestivalConfig" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "festivals" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FoodFestivalConfig_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RestaurantWatchlistConfig" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "watchlist" JSONB NOT NULL,
    "customRestaurants" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RestaurantWatchlistConfig_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HarvestSeasonsConfig" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "items" JSONB NOT NULL,
    "hemisphere" TEXT NOT NULL DEFAULT 'northern',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HarvestSeasonsConfig_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SportsGamesConfig" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "events" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SportsGamesConfig_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EntertainmentConfig" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "items" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EntertainmentConfig_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EnergyRhythmConfig" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "points" JSONB NOT NULL,
    "history" JSONB NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EnergyRhythmConfig_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FraudResponseConfig" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "incidents" JSONB NOT NULL,
    "radarOverrides" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FraudResponseConfig_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PhishingIdentityConfig" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "watchCategories" JSONB NOT NULL,
    "flagWeightOverrides" JSONB NOT NULL DEFAULT '{}',
    "quizStats" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PhishingIdentityConfig_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DarkSkyConfig" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "spots" JSONB NOT NULL,
    "activeSpotId" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DarkSkyConfig_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TechEventsConfig" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "watchlist" JSONB NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TechEventsConfig_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Article" (
    "id" TEXT NOT NULL,
    "toolSlug" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "dek" TEXT NOT NULL,
    "heroImageUrl" TEXT NOT NULL,
    "heroImageAlt" TEXT NOT NULL,
    "authorName" TEXT NOT NULL DEFAULT 'Editorial Team',
    "blocks" JSONB NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "contentType" TEXT NOT NULL DEFAULT 'evergreen',
    "publishedAt" TIMESTAMP(3),
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Article_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "MeetingOverlapConfig_userId_key" ON "MeetingOverlapConfig"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "RecipeBatchConfig_userId_key" ON "RecipeBatchConfig"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "DeadlineBufferConfig_userId_key" ON "DeadlineBufferConfig"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "SavingsGoalConfig_userId_key" ON "SavingsGoalConfig"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "JetlagConfig_userId_key" ON "JetlagConfig"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "PasswordRotationConfig_userId_key" ON "PasswordRotationConfig"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "FocusBlockConfig_userId_key" ON "FocusBlockConfig"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "CalendarSavedDays_userId_key" ON "CalendarSavedDays"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "MoneyMilestonesConfig_userId_key" ON "MoneyMilestonesConfig"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "TaxDeadlineConfig_userId_key" ON "TaxDeadlineConfig"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "PayrollConfig_userId_key" ON "PayrollConfig"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "FoodFestivalConfig_userId_key" ON "FoodFestivalConfig"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "RestaurantWatchlistConfig_userId_key" ON "RestaurantWatchlistConfig"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "HarvestSeasonsConfig_userId_key" ON "HarvestSeasonsConfig"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "SportsGamesConfig_userId_key" ON "SportsGamesConfig"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "EntertainmentConfig_userId_key" ON "EntertainmentConfig"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "EnergyRhythmConfig_userId_key" ON "EnergyRhythmConfig"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "FraudResponseConfig_userId_key" ON "FraudResponseConfig"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "PhishingIdentityConfig_userId_key" ON "PhishingIdentityConfig"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "DarkSkyConfig_userId_key" ON "DarkSkyConfig"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "TechEventsConfig_userId_key" ON "TechEventsConfig"("userId");

-- CreateIndex
CREATE INDEX "Article_toolSlug_status_publishedAt_idx" ON "Article"("toolSlug", "status", "publishedAt");

-- CreateIndex
CREATE UNIQUE INDEX "Article_toolSlug_slug_key" ON "Article"("toolSlug", "slug");

-- AddForeignKey
ALTER TABLE "MeetingOverlapConfig" ADD CONSTRAINT "MeetingOverlapConfig_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecipeBatchConfig" ADD CONSTRAINT "RecipeBatchConfig_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DeadlineBufferConfig" ADD CONSTRAINT "DeadlineBufferConfig_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SavingsGoalConfig" ADD CONSTRAINT "SavingsGoalConfig_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JetlagConfig" ADD CONSTRAINT "JetlagConfig_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PasswordRotationConfig" ADD CONSTRAINT "PasswordRotationConfig_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FocusBlockConfig" ADD CONSTRAINT "FocusBlockConfig_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CalendarSavedDays" ADD CONSTRAINT "CalendarSavedDays_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MoneyMilestonesConfig" ADD CONSTRAINT "MoneyMilestonesConfig_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaxDeadlineConfig" ADD CONSTRAINT "TaxDeadlineConfig_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PayrollConfig" ADD CONSTRAINT "PayrollConfig_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FoodFestivalConfig" ADD CONSTRAINT "FoodFestivalConfig_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RestaurantWatchlistConfig" ADD CONSTRAINT "RestaurantWatchlistConfig_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HarvestSeasonsConfig" ADD CONSTRAINT "HarvestSeasonsConfig_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SportsGamesConfig" ADD CONSTRAINT "SportsGamesConfig_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EntertainmentConfig" ADD CONSTRAINT "EntertainmentConfig_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EnergyRhythmConfig" ADD CONSTRAINT "EnergyRhythmConfig_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FraudResponseConfig" ADD CONSTRAINT "FraudResponseConfig_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PhishingIdentityConfig" ADD CONSTRAINT "PhishingIdentityConfig_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DarkSkyConfig" ADD CONSTRAINT "DarkSkyConfig_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TechEventsConfig" ADD CONSTRAINT "TechEventsConfig_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
