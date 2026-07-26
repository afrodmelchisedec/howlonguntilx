-- CreateTable
CREATE TABLE "SymptomTrackerConfig" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "history" JSONB NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SymptomTrackerConfig_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "SymptomTrackerConfig_userId_key" ON "SymptomTrackerConfig"("userId");

-- AddForeignKey
ALTER TABLE "SymptomTrackerConfig" ADD CONSTRAINT "SymptomTrackerConfig_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
