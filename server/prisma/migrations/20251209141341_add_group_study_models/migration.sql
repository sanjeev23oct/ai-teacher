-- CreateTable
CREATE TABLE "GroupStudySession" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "topic" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "question" TEXT,
    "classmate1Name" TEXT NOT NULL,
    "classmate2Name" TEXT NOT NULL,
    "studentAnswer" TEXT NOT NULL,
    "classmate1Question" TEXT,
    "classmate2Counter" TEXT,
    "classmate1Response" TEXT,
    "classmate2Response" TEXT,
    "handlingScore" INTEGER,
    "strengths" TEXT,
    "improvements" TEXT,
    "challengesCount" INTEGER NOT NULL DEFAULT 2,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GroupStudySession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HandlingSkillProgress" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "currentLevel" TEXT NOT NULL DEFAULT 'supportive',
    "avgScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "sessionsCount" INTEGER NOT NULL DEFAULT 0,
    "badges" TEXT NOT NULL DEFAULT '[]',
    "lastSession" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HandlingSkillProgress_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "GroupStudySession_userId_completedAt_idx" ON "GroupStudySession"("userId", "completedAt");

-- CreateIndex
CREATE INDEX "GroupStudySession_userId_createdAt_idx" ON "GroupStudySession"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "GroupStudySession_subject_idx" ON "GroupStudySession"("subject");

-- CreateIndex
CREATE UNIQUE INDEX "HandlingSkillProgress_userId_key" ON "HandlingSkillProgress"("userId");

-- CreateIndex
CREATE INDEX "HandlingSkillProgress_userId_idx" ON "HandlingSkillProgress"("userId");

-- AddForeignKey
ALTER TABLE "GroupStudySession" ADD CONSTRAINT "GroupStudySession_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HandlingSkillProgress" ADD CONSTRAINT "HandlingSkillProgress_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
