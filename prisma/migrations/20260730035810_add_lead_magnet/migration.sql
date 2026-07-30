-- CreateEnum
CREATE TYPE "LeadRegion" AS ENUM ('AMERICAS', 'EUROPE', 'ASIA', 'AFRICA', 'MIDDLE_EAST', 'AUSTRALIA');

-- CreateTable
CREATE TABLE "LeadMagnetConfig" (
    "id" TEXT NOT NULL,
    "headline" TEXT NOT NULL DEFAULT 'Get the free 2026–2027 Event Calendar',
    "description" TEXT NOT NULL DEFAULT '50+ dates worth planning around — holidays, sports finals, tax deadlines, eclipses and more — delivered to your inbox.',
    "ctaLabel" TEXT NOT NULL DEFAULT 'Send me the calendar',
    "fileUrl" TEXT NOT NULL DEFAULT '',
    "active" BOOLEAN NOT NULL DEFAULT false,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LeadMagnetConfig_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LeadMagnetSubscriber" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "region" "LeadRegion" NOT NULL,
    "source" TEXT NOT NULL DEFAULT 'global_banner',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LeadMagnetSubscriber_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "LeadMagnetSubscriber_region_idx" ON "LeadMagnetSubscriber"("region");

-- CreateIndex
CREATE INDEX "LeadMagnetSubscriber_createdAt_idx" ON "LeadMagnetSubscriber"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "LeadMagnetSubscriber_email_source_key" ON "LeadMagnetSubscriber"("email", "source");
