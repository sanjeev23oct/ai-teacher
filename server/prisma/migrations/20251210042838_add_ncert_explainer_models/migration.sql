-- CreateTable
CREATE TABLE "NCERTChapterStudy" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "class" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "chapterId" TEXT NOT NULL,
    "chapterName" TEXT NOT NULL,
    "studiedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "revised" BOOLEAN NOT NULL DEFAULT false,
    "completedSummary" BOOLEAN NOT NULL DEFAULT false,
    "followUpCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "NCERTChapterStudy_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NCERTProgress" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "totalChapters" INTEGER NOT NULL DEFAULT 0,
    "completionBadges" TEXT NOT NULL DEFAULT '[]',
    "lastStudied" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "englishCount" INTEGER NOT NULL DEFAULT 0,
    "scienceCount" INTEGER NOT NULL DEFAULT 0,
    "mathCount" INTEGER NOT NULL DEFAULT 0,
    "sstCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "NCERTProgress_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AudioCacheRegistry" (
    "id" TEXT NOT NULL,
    "cacheKey" TEXT NOT NULL,
    "module" TEXT NOT NULL,
    "subject" TEXT,
    "class" TEXT,
    "identifier" TEXT NOT NULL,
    "language" TEXT NOT NULL DEFAULT 'en',
    "version" TEXT NOT NULL DEFAULT 'v1',
    "filePath" TEXT NOT NULL,
    "fileSize" INTEGER NOT NULL,
    "characterCount" INTEGER NOT NULL,
    "generatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastAccessed" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "accessCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AudioCacheRegistry_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "NCERTChapterStudy_userId_studiedAt_idx" ON "NCERTChapterStudy"("userId", "studiedAt");

-- CreateIndex
CREATE INDEX "NCERTChapterStudy_class_subject_idx" ON "NCERTChapterStudy"("class", "subject");

-- CreateIndex
CREATE UNIQUE INDEX "NCERTChapterStudy_userId_class_subject_chapterId_key" ON "NCERTChapterStudy"("userId", "class", "subject", "chapterId");

-- CreateIndex
CREATE UNIQUE INDEX "NCERTProgress_userId_key" ON "NCERTProgress"("userId");

-- CreateIndex
CREATE INDEX "NCERTProgress_userId_idx" ON "NCERTProgress"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "AudioCacheRegistry_cacheKey_key" ON "AudioCacheRegistry"("cacheKey");

-- CreateIndex
CREATE INDEX "AudioCacheRegistry_module_subject_class_idx" ON "AudioCacheRegistry"("module", "subject", "class");

-- CreateIndex
CREATE INDEX "AudioCacheRegistry_lastAccessed_idx" ON "AudioCacheRegistry"("lastAccessed");

-- CreateIndex
CREATE INDEX "AudioCacheRegistry_cacheKey_idx" ON "AudioCacheRegistry"("cacheKey");

-- AddForeignKey
ALTER TABLE "NCERTChapterStudy" ADD CONSTRAINT "NCERTChapterStudy_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NCERTProgress" ADD CONSTRAINT "NCERTProgress_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
