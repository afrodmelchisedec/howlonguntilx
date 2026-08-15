-- CreateTable
CREATE TABLE "BirthControlEffectivenessConfig" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "method" TEXT NOT NULL,
    "startDate" TIMESTAMP(3),
    "cycleDayAtStart" INTEGER,
    "intercourseAt" TIMESTAMP(3),
    "refillReminderDays" INTEGER DEFAULT 3,
    "refillDate" TIMESTAMP(3),
    "expirationDate" TIMESTAMP(3),
    "methodHistory" JSONB,
    "notifyOnFullyEffective" BOOLEAN NOT NULL DEFAULT false,
    "shareLink" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BirthControlEffectivenessConfig_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "BirthControlEffectivenessConfig_userId_key" ON "BirthControlEffectivenessConfig"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "BirthControlEffectivenessConfig_shareLink_key" ON "BirthControlEffectivenessConfig"("shareLink");

-- AddForeignKey
ALTER TABLE "BirthControlEffectivenessConfig" ADD CONSTRAINT "BirthControlEffectivenessConfig_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
