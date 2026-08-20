/*
  Warnings:

  - You are about to drop the `UserEventComment` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `UserEventCommentLike` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "UserEventComment" DROP CONSTRAINT "UserEventComment_authorId_fkey";

-- DropForeignKey
ALTER TABLE "UserEventComment" DROP CONSTRAINT "UserEventComment_parentId_fkey";

-- DropForeignKey
ALTER TABLE "UserEventComment" DROP CONSTRAINT "UserEventComment_userEventId_fkey";

-- DropForeignKey
ALTER TABLE "UserEventCommentLike" DROP CONSTRAINT "UserEventCommentLike_commentId_fkey";

-- DropForeignKey
ALTER TABLE "UserEventCommentLike" DROP CONSTRAINT "UserEventCommentLike_userId_fkey";

-- DropTable
DROP TABLE "UserEventComment";

-- DropTable
DROP TABLE "UserEventCommentLike";

-- CreateTable
CREATE TABLE "Comment" (
    "id" TEXT NOT NULL,
    "subjectType" TEXT NOT NULL,
    "subjectId" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "parentId" TEXT,
    "body" TEXT NOT NULL,
    "likeCount" INTEGER NOT NULL DEFAULT 0,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Comment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CommentLike" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "commentId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CommentLike_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Comment_subjectType_subjectId_parentId_idx" ON "Comment"("subjectType", "subjectId", "parentId");

-- CreateIndex
CREATE UNIQUE INDEX "CommentLike_userId_commentId_key" ON "CommentLike"("userId", "commentId");

-- AddForeignKey
ALTER TABLE "Comment" ADD CONSTRAINT "Comment_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Comment" ADD CONSTRAINT "Comment_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "Comment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommentLike" ADD CONSTRAINT "CommentLike_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommentLike" ADD CONSTRAINT "CommentLike_commentId_fkey" FOREIGN KEY ("commentId") REFERENCES "Comment"("id") ON DELETE CASCADE ON UPDATE CASCADE;
