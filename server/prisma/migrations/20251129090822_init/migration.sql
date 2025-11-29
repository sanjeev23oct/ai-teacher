-- CreateTable
CREATE TABLE "QuestionPaper" (
    "id" TEXT NOT NULL,
    "title" TEXT,
    "subject" TEXT NOT NULL,
    "gradeLevel" TEXT NOT NULL,
    "language" TEXT NOT NULL,
    "imageUrl" TEXT NOT NULL,
    "imageHash" TEXT NOT NULL,
    "totalQuestions" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "usageCount" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "QuestionPaper_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Question" (
    "id" TEXT NOT NULL,
    "questionPaperId" TEXT NOT NULL,
    "questionNumber" TEXT NOT NULL,
    "questionText" TEXT NOT NULL,
    "maxScore" DOUBLE PRECISION,
    "topic" TEXT,
    "concept" TEXT,
    "positionX" DOUBLE PRECISION,
    "positionY" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Question_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Grading" (
    "id" TEXT NOT NULL,
    "questionPaperId" TEXT,
    "answerSheetUrl" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "language" TEXT NOT NULL,
    "gradeLevel" TEXT NOT NULL,
    "totalScore" TEXT NOT NULL,
    "feedback" TEXT NOT NULL,
    "matchingMode" TEXT,
    "totalQuestions" INTEGER,
    "answeredQuestions" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Grading_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Answer" (
    "id" TEXT NOT NULL,
    "gradingId" TEXT NOT NULL,
    "questionNumber" TEXT NOT NULL,
    "studentAnswer" TEXT,
    "correct" BOOLEAN NOT NULL,
    "score" TEXT NOT NULL,
    "remarks" TEXT NOT NULL,
    "matched" BOOLEAN NOT NULL DEFAULT true,
    "matchConfidence" DOUBLE PRECISION,
    "positionX" DOUBLE PRECISION,
    "positionY" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Answer_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "QuestionPaper_imageHash_key" ON "QuestionPaper"("imageHash");

-- CreateIndex
CREATE INDEX "QuestionPaper_imageHash_idx" ON "QuestionPaper"("imageHash");

-- CreateIndex
CREATE INDEX "QuestionPaper_createdAt_idx" ON "QuestionPaper"("createdAt");

-- CreateIndex
CREATE INDEX "Question_questionPaperId_idx" ON "Question"("questionPaperId");

-- CreateIndex
CREATE UNIQUE INDEX "Question_questionPaperId_questionNumber_key" ON "Question"("questionPaperId", "questionNumber");

-- CreateIndex
CREATE INDEX "Grading_questionPaperId_idx" ON "Grading"("questionPaperId");

-- CreateIndex
CREATE INDEX "Grading_createdAt_idx" ON "Grading"("createdAt");

-- CreateIndex
CREATE INDEX "Answer_gradingId_idx" ON "Answer"("gradingId");

-- AddForeignKey
ALTER TABLE "Question" ADD CONSTRAINT "Question_questionPaperId_fkey" FOREIGN KEY ("questionPaperId") REFERENCES "QuestionPaper"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Grading" ADD CONSTRAINT "Grading_questionPaperId_fkey" FOREIGN KEY ("questionPaperId") REFERENCES "QuestionPaper"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Answer" ADD CONSTRAINT "Answer_gradingId_fkey" FOREIGN KEY ("gradingId") REFERENCES "Grading"("id") ON DELETE CASCADE ON UPDATE CASCADE;
