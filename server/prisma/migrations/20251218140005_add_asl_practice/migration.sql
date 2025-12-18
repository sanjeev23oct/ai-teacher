-- CreateTable
CREATE TABLE "ASLPractice" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "taskId" TEXT NOT NULL,
    "taskTitle" TEXT NOT NULL,
    "taskPrompt" TEXT NOT NULL,
    "class" INTEGER NOT NULL,
    "mode" TEXT NOT NULL,
    "duration" INTEGER NOT NULL,
    "transcription" TEXT NOT NULL,
    "score" INTEGER NOT NULL,
    "feedback" TEXT NOT NULL,
    "keywordsUsed" TEXT,
    "fillerCount" INTEGER NOT NULL DEFAULT 0,
    "practicedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ASLPractice_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ASLPractice_userId_practicedAt_idx" ON "ASLPractice"("userId", "practicedAt");

-- CreateIndex
CREATE INDEX "ASLPractice_userId_score_idx" ON "ASLPractice"("userId", "score");

-- CreateIndex
CREATE INDEX "ASLPractice_class_mode_idx" ON "ASLPractice"("class", "mode");

-- AddForeignKey
ALTER TABLE "ASLPractice" ADD CONSTRAINT "ASLPractice_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
