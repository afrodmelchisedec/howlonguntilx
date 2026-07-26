-- AlterTable
ALTER TABLE "Article" ALTER COLUMN "heroImageUrl" DROP NOT NULL,
ALTER COLUMN "heroImageAlt" DROP NOT NULL;

-- AlterTable
ALTER TABLE "Category" ADD COLUMN     "featureImageUrl" TEXT;
