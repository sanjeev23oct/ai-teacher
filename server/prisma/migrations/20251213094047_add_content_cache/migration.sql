-- CreateTable
CREATE TABLE "ContentCache" (
    "id" TEXT NOT NULL,
    "module" TEXT NOT NULL,
    "contentType" TEXT NOT NULL,
    "subject" TEXT,
    "class" TEXT,
    "identifier" TEXT NOT NULL,
    "language" TEXT NOT NULL DEFAULT 'en',
    "content" TEXT NOT NULL,
    "title" TEXT,
    "source" TEXT NOT NULL,
    "accessCount" INTEGER NOT NULL DEFAULT 0,
    "lastAccessedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT,

    CONSTRAINT "ContentCache_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ContentCache_module_subject_class_idx" ON "ContentCache"("module", "subject", "class");

-- CreateIndex
CREATE INDEX "ContentCache_lastAccessedAt_idx" ON "ContentCache"("lastAccessedAt");

-- CreateIndex
CREATE UNIQUE INDEX "ContentCache_module_contentType_identifier_language_key" ON "ContentCache"("module", "contentType", "identifier", "language");
