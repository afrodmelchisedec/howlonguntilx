-- CreateTable
CREATE TABLE "GardenGrowthTrackerConfig" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "beds" JSONB,
    "notifyOnStage" BOOLEAN NOT NULL DEFAULT false,
    "shareLink" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GardenGrowthTrackerConfig_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "GardenGrowthTrackerConfig_userId_key" ON "GardenGrowthTrackerConfig"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "GardenGrowthTrackerConfig_shareLink_key" ON "GardenGrowthTrackerConfig"("shareLink");

-- AddForeignKey
ALTER TABLE "GardenGrowthTrackerConfig" ADD CONSTRAINT "GardenGrowthTrackerConfig_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
