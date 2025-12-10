// ===========================
// Note OCR Service
// Extract text from images using Groq Vision with caching
// ===========================

import { aiService } from './aiService';
import noteCacheService from './noteCacheService';

export interface OCRResult {
  extractedText: string;
  source: 'cache' | 'generated';
  cacheKey: string;
}

/**
 * Extract text from image with caching
 */
export async function extractTextFromImage(
  imageBuffer: Buffer,
  imageMimeType: string = 'image/jpeg'
): Promise<OCRResult> {
  // Generate hash for caching
  const imageHash = noteCacheService.generateImageHash(imageBuffer);
  const cacheKey = `ocr_${imageHash}`;

  // Check cache first
  const cachedText = await noteCacheService.getOCRFromCache(imageHash);
  
  if (cachedText) {
    return {
      extractedText: cachedText,
      source: 'cache',
      cacheKey,
    };
  }

  // Cache miss - perform OCR using Groq Vision
  const imageBase64 = imageBuffer.toString('base64');
  
  const prompt = `You are an OCR expert. Extract ALL text from this image exactly as written.

INSTRUCTIONS:
1. Extract every word, number, and symbol visible in the image
2. Maintain original formatting (line breaks, spacing, bullet points)
3. If text is handwritten and unclear, make your best interpretation
4. If there are diagrams/formulas, describe them in [DIAGRAM: ...] or [FORMULA: ...]
5. Preserve the original language (Hindi, English, or mixed)
6. DO NOT add explanations or improvements - just extract what's there

Output the extracted text directly without any preamble.`;

  const result = await aiService.generateContent({
    prompt,
    imageBase64,
    imageMimeType,
  });

  const extractedText = result.text.trim();

  // Save to cache
  await noteCacheService.saveOCRToCache(imageHash, extractedText);

  console.log(`\x1b[32m[OCR COMPLETE] Extracted ${extractedText.length} characters from image\x1b[0m`);

  return {
    extractedText,
    source: 'generated',
    cacheKey,
  };
}

/**
 * Extract text from multiple images (batch processing with caching)
 */
export async function extractTextFromImages(
  images: Array<{ buffer: Buffer; mimeType: string }>
): Promise<OCRResult[]> {
  const results: OCRResult[] = [];

  for (const image of images) {
    const result = await extractTextFromImage(image.buffer, image.mimeType);
    results.push(result);
  }

  return results;
}

export default {
  extractTextFromImage,
  extractTextFromImages,
};
