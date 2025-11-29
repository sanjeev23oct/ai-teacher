import crypto from 'crypto';
import fs from 'fs';

/**
 * Calculate SHA-256 hash of an image file
 * Used for deduplication of question papers
 */
export function calculateImageHash(filePath: string): string {
  const fileBuffer = fs.readFileSync(filePath);
  const hash = crypto.createHash('sha256');
  hash.update(fileBuffer);
  return hash.digest('hex');
}

/**
 * Calculate hash from buffer (for in-memory files)
 */
export function calculateBufferHash(buffer: Buffer): string {
  const hash = crypto.createHash('sha256');
  hash.update(buffer);
  return hash.digest('hex');
}
