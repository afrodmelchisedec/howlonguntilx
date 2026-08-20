-- AlterTable
ALTER TABLE "Article" ADD COLUMN     "shareBreakdown" JSONB,
ADD COLUMN     "shareCount" INTEGER NOT NULL DEFAULT 0;
