-- AlterTable
ALTER TABLE "Event" ADD COLUMN     "shareBreakdown" JSONB,
ADD COLUMN     "shareCount" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "UserEvent" ADD COLUMN     "shareBreakdown" JSONB,
ADD COLUMN     "shareCount" INTEGER NOT NULL DEFAULT 0;
