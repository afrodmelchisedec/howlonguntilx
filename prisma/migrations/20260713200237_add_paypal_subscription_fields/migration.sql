/*
  Warnings:

  - A unique constraint covering the columns `[paypalSubscriptionId]` on the table `User` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "User" ADD COLUMN     "paypalSubscriptionId" TEXT,
ADD COLUMN     "planRenewsAt" TIMESTAMP(3),
ADD COLUMN     "subscriptionStatus" TEXT DEFAULT 'none';

-- CreateTable
CREATE TABLE "ShoppingDealsConfig" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "wishlist" JSONB NOT NULL,
    "streak" INTEGER NOT NULL,
    "lastSpinDate" TEXT NOT NULL,
    "spinsToday" INTEGER NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ShoppingDealsConfig_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ShoppingDealsConfig_userId_key" ON "ShoppingDealsConfig"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "User_paypalSubscriptionId_key" ON "User"("paypalSubscriptionId");

-- AddForeignKey
ALTER TABLE "ShoppingDealsConfig" ADD CONSTRAINT "ShoppingDealsConfig_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
