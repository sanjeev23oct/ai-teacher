-- AlterTable
ALTER TABLE "Grading" ADD COLUMN     "totalPages" INTEGER NOT NULL DEFAULT 1;

-- CreateTable
CREATE TABLE "GradingPage" (
    "id" TEXT NOT NULL,
    "gradingId" TEXT NOT NULL,
    "pageNumber" INTEGER NOT NULL,
    "imageUrl" TEXT NOT NULL,
    "annotations" TEXT,
    "imageDimensions" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GradingPage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PageAnswer" (
    "id" TEXT NOT NULL,
    "pageId" TEXT NOT NULL,
    "questionNumber" TEXT NOT NULL,
    "studentAnswer" TEXT,
    "correct" BOOLEAN NOT NULL,
    "score" TEXT NOT NULL,
    "remarks" TEXT NOT NULL,
    "matched" BOOLEAN NOT NULL DEFAULT true,
    "matchConfidence" DOUBLE PRECISION,
    "positionX" DOUBLE PRECISION,
    "positionY" DOUBLE PRECISION,
    "continuedFrom" INTEGER,
    "continuedTo" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PageAnswer_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "GradingPage_gradingId_idx" ON "GradingPage"("gradingId");

-- CreateIndex
CREATE UNIQUE INDEX "GradingPage_gradingId_pageNumber_key" ON "GradingPage"("gradingId", "pageNumber");

-- CreateIndex
CREATE INDEX "PageAnswer_pageId_idx" ON "PageAnswer"("pageId");

-- AddForeignKey
ALTER TABLE "GradingPage" ADD CONSTRAINT "GradingPage_gradingId_fkey" FOREIGN KEY ("gradingId") REFERENCES "Grading"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PageAnswer" ADD CONSTRAINT "PageAnswer_pageId_fkey" FOREIGN KEY ("pageId") REFERENCES "GradingPage"("id") ON DELETE CASCADE ON UPDATE CASCADE;
