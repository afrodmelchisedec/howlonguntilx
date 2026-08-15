-- CreateTable
CREATE TABLE "NewbornMilestoneTrackerConfig" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "birthDate" TIMESTAMP(3),
    "weightEntries" JSONB,
    "lengthEntries" JSONB,
    "milestoneNotes" JSONB,
    "notifyOnMilestone" BOOLEAN NOT NULL DEFAULT false,
    "shareLink" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "NewbornMilestoneTrackerConfig_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "NewbornMilestoneTrackerConfig_userId_key" ON "NewbornMilestoneTrackerConfig"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "NewbornMilestoneTrackerConfig_shareLink_key" ON "NewbornMilestoneTrackerConfig"("shareLink");

-- AddForeignKey
ALTER TABLE "NewbornMilestoneTrackerConfig" ADD CONSTRAINT "NewbornMilestoneTrackerConfig_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
