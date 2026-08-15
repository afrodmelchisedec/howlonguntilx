-- CreateTable
CREATE TABLE "KittenGrowthTrackerConfig" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "birthDate" TIMESTAMP(3),
    "breedSize" TEXT,
    "weightEntries" JSONB,
    "milestoneLog" JSONB,
    "litterMates" JSONB,
    "shareLink" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "KittenGrowthTrackerConfig_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "KittenGrowthTrackerConfig_userId_key" ON "KittenGrowthTrackerConfig"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "KittenGrowthTrackerConfig_shareLink_key" ON "KittenGrowthTrackerConfig"("shareLink");

-- AddForeignKey
ALTER TABLE "KittenGrowthTrackerConfig" ADD CONSTRAINT "KittenGrowthTrackerConfig_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
