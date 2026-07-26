-- AlterTable
ALTER TABLE "Event" ADD COLUMN     "subcategoryId" TEXT;

-- CreateIndex
CREATE INDEX "Event_categoryId_idx" ON "Event"("categoryId");

-- CreateIndex
CREATE INDEX "Event_subcategoryId_idx" ON "Event"("subcategoryId");

-- AddForeignKey
ALTER TABLE "Event" ADD CONSTRAINT "Event_subcategoryId_fkey" FOREIGN KEY ("subcategoryId") REFERENCES "Category"("id") ON DELETE SET NULL ON UPDATE CASCADE;
