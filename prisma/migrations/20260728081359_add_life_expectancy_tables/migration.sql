-- CreateEnum
CREATE TYPE "Sex" AS ENUM ('MALE', 'FEMALE');

-- CreateTable
CREATE TABLE "LifeExpectancyTable" (
    "id" TEXT NOT NULL,
    "region" TEXT NOT NULL,
    "countryLabel" TEXT NOT NULL,
    "sex" "Sex" NOT NULL,
    "age" INTEGER NOT NULL,
    "remainingYears" DOUBLE PRECISION NOT NULL,
    "source" TEXT NOT NULL,
    "sourceUrl" TEXT,
    "sourceYear" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LifeExpectancyTable_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LifeExpectancyProfile" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "region" TEXT NOT NULL,
    "age" INTEGER NOT NULL,
    "sex" "Sex" NOT NULL,
    "factors" JSONB NOT NULL,
    "familyMembers" JSONB,
    "expectedAge" DOUBLE PRECISION NOT NULL,
    "targetDate" TIMESTAMP(3) NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LifeExpectancyProfile_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "LifeExpectancyTable_region_sex_sourceYear_idx" ON "LifeExpectancyTable"("region", "sex", "sourceYear");

-- CreateIndex
CREATE UNIQUE INDEX "LifeExpectancyTable_region_sex_age_sourceYear_key" ON "LifeExpectancyTable"("region", "sex", "age", "sourceYear");

-- CreateIndex
CREATE UNIQUE INDEX "LifeExpectancyProfile_userId_key" ON "LifeExpectancyProfile"("userId");

-- AddForeignKey
ALTER TABLE "LifeExpectancyProfile" ADD CONSTRAINT "LifeExpectancyProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
