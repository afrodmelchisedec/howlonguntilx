-- CreateEnum
CREATE TYPE "UserEventVisibility" AS ENUM ('PUBLIC', 'PRIVATE');

-- CreateEnum
CREATE TYPE "UserEventModerationStatus" AS ENUM ('APPROVED', 'REJECTED', 'REMOVED');

-- CreateTable
CREATE TABLE "UserEvent" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "targetDate" TIMESTAMP(3) NOT NULL,
    "images" JSONB,
    "visibility" "UserEventVisibility" NOT NULL DEFAULT 'PUBLIC',
    "moderationStatus" "UserEventModerationStatus" NOT NULL DEFAULT 'APPROVED',
    "moderatedById" TEXT,
    "moderatedAt" TIMESTAMP(3),
    "moderationNote" TEXT,
    "authorId" TEXT NOT NULL,
    "categoryId" TEXT,
    "likeCount" INTEGER NOT NULL DEFAULT 0,
    "commentCount" INTEGER NOT NULL DEFAULT 0,
    "viewCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserEventLike" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "userEventId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserEventLike_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserEventComment" (
    "id" TEXT NOT NULL,
    "userEventId" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "parentId" TEXT,
    "body" TEXT NOT NULL,
    "likeCount" INTEGER NOT NULL DEFAULT 0,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserEventComment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserEventCommentLike" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "commentId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserEventCommentLike_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "UserEvent_slug_key" ON "UserEvent"("slug");

-- CreateIndex
CREATE INDEX "UserEvent_visibility_moderationStatus_createdAt_idx" ON "UserEvent"("visibility", "moderationStatus", "createdAt");

-- CreateIndex
CREATE INDEX "UserEvent_visibility_moderationStatus_likeCount_idx" ON "UserEvent"("visibility", "moderationStatus", "likeCount");

-- CreateIndex
CREATE INDEX "UserEvent_categoryId_idx" ON "UserEvent"("categoryId");

-- CreateIndex
CREATE INDEX "UserEvent_authorId_idx" ON "UserEvent"("authorId");

-- CreateIndex
CREATE UNIQUE INDEX "UserEventLike_userId_userEventId_key" ON "UserEventLike"("userId", "userEventId");

-- CreateIndex
CREATE INDEX "UserEventComment_userEventId_parentId_idx" ON "UserEventComment"("userEventId", "parentId");

-- CreateIndex
CREATE UNIQUE INDEX "UserEventCommentLike_userId_commentId_key" ON "UserEventCommentLike"("userId", "commentId");

-- AddForeignKey
ALTER TABLE "UserEvent" ADD CONSTRAINT "UserEvent_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserEvent" ADD CONSTRAINT "UserEvent_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserEventLike" ADD CONSTRAINT "UserEventLike_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserEventLike" ADD CONSTRAINT "UserEventLike_userEventId_fkey" FOREIGN KEY ("userEventId") REFERENCES "UserEvent"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserEventComment" ADD CONSTRAINT "UserEventComment_userEventId_fkey" FOREIGN KEY ("userEventId") REFERENCES "UserEvent"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserEventComment" ADD CONSTRAINT "UserEventComment_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserEventComment" ADD CONSTRAINT "UserEventComment_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "UserEventComment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserEventCommentLike" ADD CONSTRAINT "UserEventCommentLike_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserEventCommentLike" ADD CONSTRAINT "UserEventCommentLike_commentId_fkey" FOREIGN KEY ("commentId") REFERENCES "UserEventComment"("id") ON DELETE CASCADE ON UPDATE CASCADE;
