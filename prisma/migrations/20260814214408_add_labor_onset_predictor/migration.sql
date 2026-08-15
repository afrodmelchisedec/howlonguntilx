-- CreateTable
CREATE TABLE "LaborOnsetPredictorConfig" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "mucusPlugDate" TIMESTAMP(3),
    "babyDropped" BOOLEAN NOT NULL DEFAULT false,
    "babyDroppedDate" TIMESTAMP(3),
    "waterBroke" BOOLEAN NOT NULL DEFAULT false,
    "waterBrokeDate" TIMESTAMP(3),
    "contractionLog" JSONB,
    "notifyOnThreshold" BOOLEAN NOT NULL DEFAULT false,
    "shareLink" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LaborOnsetPredictorConfig_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "LaborOnsetPredictorConfig_userId_key" ON "LaborOnsetPredictorConfig"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "LaborOnsetPredictorConfig_shareLink_key" ON "LaborOnsetPredictorConfig"("shareLink");

-- AddForeignKey
ALTER TABLE "LaborOnsetPredictorConfig" ADD CONSTRAINT "LaborOnsetPredictorConfig_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
