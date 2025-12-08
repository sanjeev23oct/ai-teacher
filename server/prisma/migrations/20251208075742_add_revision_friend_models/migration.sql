-- CreateTable
CREATE TABLE "RevisionSession" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "topic" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    "score" INTEGER,
    "weakAreas" TEXT,
    "phasesCompleted" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RevisionSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WeakTopic" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "topic" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "occurrences" INTEGER NOT NULL DEFAULT 1,
    "lastSeen" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "improved" BOOLEAN NOT NULL DEFAULT false,
    "improvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WeakTopic_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "RevisionSession_userId_completedAt_idx" ON "RevisionSession"("userId", "completedAt");

-- CreateIndex
CREATE INDEX "RevisionSession_userId_createdAt_idx" ON "RevisionSession"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "RevisionSession_subject_idx" ON "RevisionSession"("subject");

-- CreateIndex
CREATE INDEX "WeakTopic_userId_improved_idx" ON "WeakTopic"("userId", "improved");

-- CreateIndex
CREATE INDEX "WeakTopic_userId_lastSeen_idx" ON "WeakTopic"("userId", "lastSeen");

-- CreateIndex
CREATE UNIQUE INDEX "WeakTopic_userId_topic_subject_key" ON "WeakTopic"("userId", "topic", "subject");

-- AddForeignKey
ALTER TABLE "RevisionSession" ADD CONSTRAINT "RevisionSession_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WeakTopic" ADD CONSTRAINT "WeakTopic_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
