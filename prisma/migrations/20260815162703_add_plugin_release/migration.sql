-- CreateTable
CREATE TABLE "PluginRelease" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "version" TEXT NOT NULL,
    "changelogNote" TEXT,
    "isLatest" BOOLEAN NOT NULL DEFAULT false,
    "downloadCount" INTEGER NOT NULL DEFAULT 0,
    "filePath" TEXT NOT NULL,
    "fileSize" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PluginRelease_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PluginRelease_slug_isLatest_idx" ON "PluginRelease"("slug", "isLatest");

-- CreateIndex
CREATE UNIQUE INDEX "PluginRelease_slug_version_key" ON "PluginRelease"("slug", "version");
