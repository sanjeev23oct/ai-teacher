-- DropIndex
DROP INDEX "ASLPractice_class_mode_idx";

-- DropIndex
DROP INDEX "ASLPractice_userId_score_idx";

-- AlterTable
ALTER TABLE "ASLPractice" ADD COLUMN     "detailedFeedback" TEXT;
