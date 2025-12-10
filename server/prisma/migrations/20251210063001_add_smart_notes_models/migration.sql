-- CreateTable
CREATE TABLE "SmartNote" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "sourceType" TEXT NOT NULL,
    "originalText" TEXT,
    "imageUrl" TEXT,
    "imageHash" TEXT,
    "extractedText" TEXT,
    "enhancedNote" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "summary" TEXT,
    "subject" TEXT,
    "class" TEXT,
    "chapter" TEXT,
    "tags" TEXT[],
    "cacheKey" TEXT,
    "isFavorite" BOOLEAN NOT NULL DEFAULT false,
    "viewCount" INTEGER NOT NULL DEFAULT 0,
    "lastViewedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SmartNote_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NoteCacheRegistry" (
    "id" TEXT NOT NULL,
    "cacheKey" TEXT NOT NULL,
    "contentType" TEXT NOT NULL,
    "cachedContent" TEXT NOT NULL,
    "generatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastAccessed" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "accessCount" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "NoteCacheRegistry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NoteProgress" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "totalNotes" INTEGER NOT NULL DEFAULT 0,
    "textNotes" INTEGER NOT NULL DEFAULT 0,
    "imageNotes" INTEGER NOT NULL DEFAULT 0,
    "mathNotes" INTEGER NOT NULL DEFAULT 0,
    "scienceNotes" INTEGER NOT NULL DEFAULT 0,
    "englishNotes" INTEGER NOT NULL DEFAULT 0,
    "sstNotes" INTEGER NOT NULL DEFAULT 0,
    "otherNotes" INTEGER NOT NULL DEFAULT 0,
    "currentStreak" INTEGER NOT NULL DEFAULT 0,
    "longestStreak" INTEGER NOT NULL DEFAULT 0,
    "lastNoteDate" TIMESTAMP(3),
    "badges" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "NoteProgress_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "SmartNote_cacheKey_key" ON "SmartNote"("cacheKey");

-- CreateIndex
CREATE INDEX "SmartNote_userId_subject_class_idx" ON "SmartNote"("userId", "subject", "class");

-- CreateIndex
CREATE INDEX "SmartNote_userId_createdAt_idx" ON "SmartNote"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "SmartNote_cacheKey_idx" ON "SmartNote"("cacheKey");

-- CreateIndex
CREATE INDEX "SmartNote_tags_idx" ON "SmartNote"("tags");

-- CreateIndex
CREATE UNIQUE INDEX "NoteCacheRegistry_cacheKey_key" ON "NoteCacheRegistry"("cacheKey");

-- CreateIndex
CREATE INDEX "NoteCacheRegistry_cacheKey_idx" ON "NoteCacheRegistry"("cacheKey");

-- CreateIndex
CREATE INDEX "NoteCacheRegistry_lastAccessed_idx" ON "NoteCacheRegistry"("lastAccessed");

-- CreateIndex
CREATE UNIQUE INDEX "NoteProgress_userId_key" ON "NoteProgress"("userId");

-- AddForeignKey
ALTER TABLE "SmartNote" ADD CONSTRAINT "SmartNote_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NoteProgress" ADD CONSTRAINT "NoteProgress_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
