// ===========================
// Audio Cache Configuration
// ===========================

export const AUDIO_CACHE_CONFIG = {
  // Pricing (ElevenLabs standard pricing)
  PRICE_PER_1000_CHARS: 0.015, // USD
  
  // Cache settings
  DEFAULT_CACHE_PATH: process.env.AUDIO_CACHE_PATH || 'audio-cache',
  MAX_CACHE_SIZE_MB: parseInt(process.env.AUDIO_CACHE_MAX_SIZE || '500'),
  
  // File versioning
  DEFAULT_VERSION: 'v1',
  DEFAULT_LANGUAGE: 'en',
  
  // Modules
  MODULES: {
    NCERT: 'ncert',
    REVISION: 'revision',
    DOUBTS: 'doubts',
    WORKSHEETS: 'worksheets',
  } as const,
};

export const BADGE_CONFIG = {
  ENGLISH_MASTER: {
    id: 'english_master',
    name: 'English Master',
    requirement: { englishCount: 10 },
  },
  SCIENCE_EXPLORER: {
    id: 'science_explorer',
    name: 'Science Explorer',
    requirement: { scienceCount: 15 },
  },
  MATH_WIZARD: {
    id: 'math_wizard',
    name: 'Math Wizard',
    requirement: { mathCount: 15 },
  },
  KNOWLEDGE_SEEKER: {
    id: 'knowledge_seeker',
    name: 'Knowledge Seeker',
    requirement: { totalChapters: 50 },
  },
} as const;

export const AUDIO_DURATION_ESTIMATES = {
  WORDS_PER_MINUTE: 150,
} as const;
