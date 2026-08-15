-- AlterTable
ALTER TABLE "Article" ALTER COLUMN "reviewEnabled" SET DEFAULT false;

-- AlterTable
ALTER TABLE "Event" ALTER COLUMN "reviewEnabled" SET DEFAULT false;

-- CreateTable
CREATE TABLE "AmIPregnantTrackerConfig" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "lastPeriod" TIMESTAMP(3) NOT NULL,
    "cycleLength" INTEGER NOT NULL,
    "history" JSONB NOT NULL,
    "notifyOnTestDay" BOOLEAN NOT NULL DEFAULT false,
    "shareLink" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AmIPregnantTrackerConfig_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "AmIPregnantTrackerConfig_userId_key" ON "AmIPregnantTrackerConfig"("userId");

-- AddForeignKey
ALTER TABLE "AmIPregnantTrackerConfig" ADD CONSTRAINT "AmIPregnantTrackerConfig_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
