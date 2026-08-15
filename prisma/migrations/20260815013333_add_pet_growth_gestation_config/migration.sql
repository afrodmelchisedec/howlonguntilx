-- CreateTable
CREATE TABLE "PetGrowthGestationConfig" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "pets" JSONB NOT NULL,
    "notifyOnMilestone" BOOLEAN NOT NULL DEFAULT false,
    "shareLink" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PetGrowthGestationConfig_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PetGrowthGestationConfig_userId_key" ON "PetGrowthGestationConfig"("userId");

-- AddForeignKey
ALTER TABLE "PetGrowthGestationConfig" ADD CONSTRAINT "PetGrowthGestationConfig_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
