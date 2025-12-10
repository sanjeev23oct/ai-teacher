/*
  Warnings:

  - Added the required column `school` to the `SmartNote` table without a default value. This is not possible if the table is not empty.
  - Made the column `subject` on table `SmartNote` required. This step will fail if there are existing NULL values in that column.
  - Made the column `class` on table `SmartNote` required. This step will fail if there are existing NULL values in that column.
  - Made the column `school` on table `User` required. This step will fail if there are existing NULL values in that column.

*/
-- Step 1: Update existing User records to have a default school if NULL
UPDATE "User" SET "school" = 'Not Specified' WHERE "school" IS NULL;

-- Step 2: Make User.school NOT NULL
ALTER TABLE "User" ALTER COLUMN "school" SET NOT NULL;

-- Step 3: Add new columns to SmartNote
ALTER TABLE "SmartNote" ADD COLUMN     "bookmarkCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "likeCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "school" TEXT,
ADD COLUMN     "shareCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "visibility" TEXT NOT NULL DEFAULT 'private';

-- Step 4: Update existing SmartNote records with values from User
UPDATE "SmartNote" SET "subject" = 'Other' WHERE "subject" IS NULL;
UPDATE "SmartNote" SET "class" = COALESCE((SELECT "grade" FROM "User" WHERE "User"."id" = "SmartNote"."userId"), '10') WHERE "class" IS NULL;
UPDATE "SmartNote" SET "school" = (SELECT "school" FROM "User" WHERE "User"."id" = "SmartNote"."userId");

-- Step 5: Make SmartNote columns NOT NULL
ALTER TABLE "SmartNote" 
  ALTER COLUMN "school" SET NOT NULL,
  ALTER COLUMN "subject" SET NOT NULL,
  ALTER COLUMN "class" SET NOT NULL;

-- CreateTable
CREATE TABLE "UserConnection" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "friendId" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserConnection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NoteLike" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "noteId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "NoteLike_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NoteBookmark" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "noteId" TEXT NOT NULL,
    "collection" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "NoteBookmark_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "UserConnection_userId_status_idx" ON "UserConnection"("userId", "status");

-- CreateIndex
CREATE INDEX "UserConnection_friendId_status_idx" ON "UserConnection"("friendId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "UserConnection_userId_friendId_key" ON "UserConnection"("userId", "friendId");

-- CreateIndex
CREATE INDEX "NoteLike_noteId_idx" ON "NoteLike"("noteId");

-- CreateIndex
CREATE INDEX "NoteLike_userId_idx" ON "NoteLike"("userId");

-- CreateIndex
CREATE INDEX "NoteLike_createdAt_idx" ON "NoteLike"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "NoteLike_userId_noteId_key" ON "NoteLike"("userId", "noteId");

-- CreateIndex
CREATE INDEX "NoteBookmark_userId_collection_idx" ON "NoteBookmark"("userId", "collection");

-- CreateIndex
CREATE INDEX "NoteBookmark_noteId_idx" ON "NoteBookmark"("noteId");

-- CreateIndex
CREATE UNIQUE INDEX "NoteBookmark_userId_noteId_key" ON "NoteBookmark"("userId", "noteId");

-- CreateIndex
CREATE INDEX "SmartNote_visibility_class_subject_idx" ON "SmartNote"("visibility", "class", "subject");

-- CreateIndex
CREATE INDEX "SmartNote_visibility_school_idx" ON "SmartNote"("visibility", "school");

-- CreateIndex
CREATE INDEX "SmartNote_likeCount_idx" ON "SmartNote"("likeCount");

-- AddForeignKey
ALTER TABLE "UserConnection" ADD CONSTRAINT "UserConnection_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserConnection" ADD CONSTRAINT "UserConnection_friendId_fkey" FOREIGN KEY ("friendId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NoteLike" ADD CONSTRAINT "NoteLike_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NoteLike" ADD CONSTRAINT "NoteLike_noteId_fkey" FOREIGN KEY ("noteId") REFERENCES "SmartNote"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NoteBookmark" ADD CONSTRAINT "NoteBookmark_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NoteBookmark" ADD CONSTRAINT "NoteBookmark_noteId_fkey" FOREIGN KEY ("noteId") REFERENCES "SmartNote"("id") ON DELETE CASCADE ON UPDATE CASCADE;
