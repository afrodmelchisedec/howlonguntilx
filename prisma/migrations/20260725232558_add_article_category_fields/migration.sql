-- CreateEnum
CREATE TYPE "QuestionType" AS ENUM ('DURATION', 'DATED');

-- AlterTable
ALTER TABLE "Article" ADD COLUMN     "categoryId" TEXT,
ADD COLUMN     "heroData" JSONB,
ADD COLUMN     "questionType" "QuestionType",
ADD COLUMN     "subcategoryId" TEXT;

-- CreateIndex
CREATE INDEX "Article_categoryId_idx" ON "Article"("categoryId");

-- CreateIndex
CREATE INDEX "Article_subcategoryId_idx" ON "Article"("subcategoryId");

-- AddForeignKey
ALTER TABLE "Article" ADD CONSTRAINT "Article_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Article" ADD CONSTRAINT "Article_subcategoryId_fkey" FOREIGN KEY ("subcategoryId") REFERENCES "Category"("id") ON DELETE SET NULL ON UPDATE CASCADE;
