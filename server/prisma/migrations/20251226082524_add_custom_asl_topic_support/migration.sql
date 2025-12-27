-- AlterTable
ALTER TABLE "ASLPractice" ADD COLUMN     "isCustom" BOOLEAN NOT NULL DEFAULT false,
ALTER COLUMN "class" DROP NOT NULL;

-- AlterTable
ALTER TABLE "AudioCacheRegistry" ADD COLUMN     "estimatedCost" DOUBLE PRECISION,
ADD COLUMN     "modelId" TEXT,
ADD COLUMN     "provider" TEXT DEFAULT 'google',
ADD COLUMN     "voiceId" TEXT;

-- CreateIndex
CREATE INDEX "AudioCacheRegistry_provider_idx" ON "AudioCacheRegistry"("provider");
