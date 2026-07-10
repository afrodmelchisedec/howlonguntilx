-- CreateTable
CREATE TABLE "FeaturedPiece" (
    "id" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "sourceLabel" TEXT,
    "sourceUrl" TEXT,
    "imageUrl" TEXT,
    "weekOf" TIMESTAMP(3),
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FeaturedPiece_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "FeaturedPiece_active_weekOf_idx" ON "FeaturedPiece"("active", "weekOf");
