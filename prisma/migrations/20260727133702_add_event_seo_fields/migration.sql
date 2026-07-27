-- AlterTable
ALTER TABLE "Event" ADD COLUMN     "authorName" TEXT NOT NULL DEFAULT 'Afrod M (Msc Statistics at Makerere University)',
ADD COLUMN     "heroImageAlt" TEXT,
ADD COLUMN     "heroImageUrl" TEXT,
ADD COLUMN     "reviewerCredentials" TEXT,
ADD COLUMN     "reviewerName" TEXT;
