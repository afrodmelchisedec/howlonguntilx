-- CreateTable
CREATE TABLE "EggHatchTrackerConfig" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "species" TEXT NOT NULL,
    "incubatorType" TEXT,
    "startDate" TIMESTAMP(3),
    "turningLog" JSONB,
    "eggBatch" JSONB,
    "shareLink" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EggHatchTrackerConfig_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "EggHatchTrackerConfig_userId_key" ON "EggHatchTrackerConfig"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "EggHatchTrackerConfig_shareLink_key" ON "EggHatchTrackerConfig"("shareLink");

-- AddForeignKey
ALTER TABLE "EggHatchTrackerConfig" ADD CONSTRAINT "EggHatchTrackerConfig_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
