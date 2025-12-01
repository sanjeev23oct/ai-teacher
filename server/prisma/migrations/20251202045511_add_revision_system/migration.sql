-- AlterTable
ALTER TABLE "Doubt" ADD COLUMN     "addedToRevisionAt" TIMESTAMP(3),
ADD COLUMN     "isInRevision" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "questionNumber" INTEGER,
ADD COLUMN     "worksheetId" TEXT;

-- CreateTable
CREATE TABLE "Worksheet" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "imageUrl" TEXT NOT NULL,
    "imageHash" TEXT NOT NULL,
    "totalQuestions" INTEGER NOT NULL,
    "currentQuestion" INTEGER NOT NULL DEFAULT 1,
    "sessionId" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "title" TEXT,
    "subject" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Worksheet_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WorksheetQuestion" (
    "id" TEXT NOT NULL,
    "worksheetId" TEXT NOT NULL,
    "questionNumber" INTEGER NOT NULL,
    "doubtId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "cachedExplanation" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WorksheetQuestion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DoubtRating" (
    "id" TEXT NOT NULL,
    "doubtId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "rating" INTEGER NOT NULL,
    "feedback" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DoubtRating_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Worksheet_imageHash_key" ON "Worksheet"("imageHash");

-- CreateIndex
CREATE UNIQUE INDEX "Worksheet_sessionId_key" ON "Worksheet"("sessionId");

-- CreateIndex
CREATE INDEX "Worksheet_userId_idx" ON "Worksheet"("userId");

-- CreateIndex
CREATE INDEX "Worksheet_sessionId_idx" ON "Worksheet"("sessionId");

-- CreateIndex
CREATE INDEX "Worksheet_imageHash_idx" ON "Worksheet"("imageHash");

-- CreateIndex
CREATE INDEX "Worksheet_createdAt_idx" ON "Worksheet"("createdAt");

-- CreateIndex
CREATE INDEX "WorksheetQuestion_worksheetId_idx" ON "WorksheetQuestion"("worksheetId");

-- CreateIndex
CREATE INDEX "WorksheetQuestion_doubtId_idx" ON "WorksheetQuestion"("doubtId");

-- CreateIndex
CREATE UNIQUE INDEX "WorksheetQuestion_worksheetId_questionNumber_key" ON "WorksheetQuestion"("worksheetId", "questionNumber");

-- CreateIndex
CREATE UNIQUE INDEX "DoubtRating_doubtId_key" ON "DoubtRating"("doubtId");

-- CreateIndex
CREATE INDEX "DoubtRating_userId_idx" ON "DoubtRating"("userId");

-- CreateIndex
CREATE INDEX "DoubtRating_rating_idx" ON "DoubtRating"("rating");

-- CreateIndex
CREATE INDEX "DoubtRating_createdAt_idx" ON "DoubtRating"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "DoubtRating_userId_doubtId_key" ON "DoubtRating"("userId", "doubtId");

-- CreateIndex
CREATE INDEX "Doubt_worksheetId_idx" ON "Doubt"("worksheetId");

-- CreateIndex
CREATE INDEX "Doubt_userId_isInRevision_idx" ON "Doubt"("userId", "isInRevision");

-- AddForeignKey
ALTER TABLE "Doubt" ADD CONSTRAINT "Doubt_worksheetId_fkey" FOREIGN KEY ("worksheetId") REFERENCES "Worksheet"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Worksheet" ADD CONSTRAINT "Worksheet_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorksheetQuestion" ADD CONSTRAINT "WorksheetQuestion_worksheetId_fkey" FOREIGN KEY ("worksheetId") REFERENCES "Worksheet"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorksheetQuestion" ADD CONSTRAINT "WorksheetQuestion_doubtId_fkey" FOREIGN KEY ("doubtId") REFERENCES "Doubt"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DoubtRating" ADD CONSTRAINT "DoubtRating_doubtId_fkey" FOREIGN KEY ("doubtId") REFERENCES "Doubt"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DoubtRating" ADD CONSTRAINT "DoubtRating_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
