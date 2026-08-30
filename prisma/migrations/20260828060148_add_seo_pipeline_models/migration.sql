-- CreateEnum
CREATE TYPE "SeoOpportunityStatus" AS ENUM ('DISCOVERED', 'REVIEWED', 'APPROVED', 'REJECTED', 'PUBLISHED');

-- CreateTable
CREATE TABLE "ProgrammaticEntity" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "template" TEXT NOT NULL,
    "entityName" TEXT NOT NULL,
    "category" TEXT,
    "targetDate" TIMESTAMP(3) NOT NULL,
    "recurring" BOOLEAN NOT NULL DEFAULT false,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "primaryKeyword" TEXT NOT NULL,
    "secondaryKeywords" TEXT[],
    "searchVolume" INTEGER,
    "keywordDifficulty" INTEGER,
    "opportunityScore" DOUBLE PRECISION,
    "blurb" TEXT,
    "historicalNote" TEXT,
    "faq" JSONB,
    "relatedEntitySlugs" TEXT[],
    "images" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProgrammaticEntity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SeoRun" (
    "id" TEXT NOT NULL,
    "seed" TEXT NOT NULL,
    "country" TEXT NOT NULL,
    "language" TEXT NOT NULL,
    "minVolume" INTEGER NOT NULL,
    "maxKd" INTEGER NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "finishedAt" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'running',
    "errorMessage" TEXT,
    "triggeredBy" TEXT,

    CONSTRAINT "SeoRun_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SeoOpportunity" (
    "id" TEXT NOT NULL,
    "runId" TEXT NOT NULL,
    "keyword" TEXT NOT NULL,
    "volume" INTEGER NOT NULL,
    "kd" INTEGER,
    "trend" TEXT,
    "opportunityScore" DOUBLE PRECISION NOT NULL,
    "template" TEXT,
    "entity" TEXT,
    "clusterKey" TEXT,
    "status" "SeoOpportunityStatus" NOT NULL DEFAULT 'DISCOVERED',
    "eventSlug" TEXT,
    "reviewNotes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SeoOpportunity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ContentVoice" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL DEFAULT 'default',
    "description" TEXT,
    "systemPrompt" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ContentVoice_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ProgrammaticEntity_slug_key" ON "ProgrammaticEntity"("slug");

-- CreateIndex
CREATE INDEX "SeoOpportunity_runId_idx" ON "SeoOpportunity"("runId");

-- CreateIndex
CREATE UNIQUE INDEX "SeoOpportunity_runId_keyword_key" ON "SeoOpportunity"("runId", "keyword");

-- AddForeignKey
ALTER TABLE "SeoOpportunity" ADD CONSTRAINT "SeoOpportunity_runId_fkey" FOREIGN KEY ("runId") REFERENCES "SeoRun"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
