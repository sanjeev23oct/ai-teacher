/**
 * Language Configuration for Multi-Language Support
 * Supports 7 Indian regional languages with English mix
 */

export interface LanguageConfig {
  code: string;           // ISO language code
  name: string;           // English name
  nativeName: string;     // Name in native script
  mixName: string;        // Mixed language name (e.g., Hinglish)
  flag: string;           // Flag emoji
  // ElevenLabs TTS configuration
  ttsVoiceId: string;     // ElevenLabs voice ID
  ttsModel: string;       // ElevenLabs model ID
  // Google TTS configuration
  googleVoiceId: string;  // Google TTS voice ID
  googleLanguageCode: string; // Google TTS language code
  promptInstruction: string; // AI prompt instruction for this language
}

export const SUPPORTED_LANGUAGES: LanguageConfig[] = [
  {
    code: 'en',
    name: 'English',
    nativeName: 'English',
    mixName: 'English',
    flag: '🇬🇧',
    ttsVoiceId: process.env.ELEVENLABS_ENGLISH_VOICE_ID || process.env.ELEVENLABS_VOICE_ID || 'pNInz6obpgDQGcFmaJgB',
    ttsModel: process.env.ELEVENLABS_ENGLISH_MODEL_ID || process.env.ELEVENLABS_MODEL_ID || 'eleven_turbo_v2_5',
    googleVoiceId: process.env.GOOGLE_ENGLISH_VOICE || 'en-IN-Wavenet-A',
    googleLanguageCode: 'en-IN',
    promptInstruction: 'IMPORTANT: You MUST respond ONLY in English. Do NOT use any Hindi, Hinglish, or any other Indian language words. Use clear, simple English throughout your entire response. No "dekho", "yaar", "karo", "hai" or any Hindi words. Keep it conversational but 100% in English.'
  },
  {
    code: 'hi',
    name: 'Hindi',
    nativeName: 'हिंदी',
    mixName: 'Hinglish',
    flag: '🇮🇳',
    ttsVoiceId: process.env.ELEVENLABS_HINDI_VOICE_ID || process.env.ELEVENLABS_VOICE_ID || 'pNInz6obpgDQGcFmaJgB',
    ttsModel: process.env.ELEVENLABS_HINDI_MODEL_ID || process.env.ELEVENLABS_MULTILINGUAL_MODEL_ID || 'eleven_multilingual_v2',
    googleVoiceId: process.env.GOOGLE_HINDI_VOICE || 'hi-IN-Wavenet-A',
    googleLanguageCode: 'hi-IN',
    promptInstruction: 'IMPORTANT: Respond in Hinglish (Hindi-English mix). Use Hindi words naturally mixed with English technical terms. Example: "Dekho yaar, photosynthesis basically ye hai ki plants sunlight use karte hain..." Make it sound like a friendly Indian friend explaining.'
  },
  {
    code: 'ta',
    name: 'Tamil',
    nativeName: 'தமிழ்',
    mixName: 'Tanglish',
    flag: '🇮🇳',
    ttsVoiceId: process.env.ELEVENLABS_TAMIL_VOICE_ID || process.env.ELEVENLABS_VOICE_ID || 'pNInz6obpgDQGcFmaJgB',
    ttsModel: process.env.ELEVENLABS_TAMIL_MODEL_ID || process.env.ELEVENLABS_MULTILINGUAL_MODEL_ID || 'eleven_multilingual_v2',
    googleVoiceId: process.env.GOOGLE_TAMIL_VOICE || 'ta-IN-Wavenet-A',
    googleLanguageCode: 'ta-IN',
    promptInstruction: 'IMPORTANT: Respond in Tanglish (Tamil-English mix). Use Tamil words naturally mixed with English technical terms. Example: "Paaru, photosynthesis-nu enna-na, plants sunlight use pannudhu..." Make it sound like a friendly Tamil friend explaining. Do NOT use Hindi words.'
  },
  {
    code: 'te',
    name: 'Telugu',
    nativeName: 'తెలుగు',
    mixName: 'Tenglish',
    flag: '🇮🇳',
    ttsVoiceId: process.env.ELEVENLABS_TELUGU_VOICE_ID || process.env.ELEVENLABS_VOICE_ID || 'pNInz6obpgDQGcFmaJgB',
    ttsModel: process.env.ELEVENLABS_TELUGU_MODEL_ID || process.env.ELEVENLABS_MULTILINGUAL_MODEL_ID || 'eleven_multilingual_v2',
    googleVoiceId: process.env.GOOGLE_TELUGU_VOICE || 'te-IN-Standard-A',
    googleLanguageCode: 'te-IN',
    promptInstruction: 'IMPORTANT: Respond in Tenglish (Telugu-English mix). Use Telugu words naturally mixed with English technical terms. Example: "Choodandi, photosynthesis ante enti ante, plants sunlight vadathayi..." Make it sound like a friendly Telugu friend explaining. Do NOT use Hindi words.'
  },
  {
    code: 'kn',
    name: 'Kannada',
    nativeName: 'ಕನ್ನಡ',
    mixName: 'Kanglish',
    flag: '🇮🇳',
    ttsVoiceId: process.env.ELEVENLABS_KANNADA_VOICE_ID || process.env.ELEVENLABS_VOICE_ID || 'pNInz6obpgDQGcFmaJgB',
    ttsModel: process.env.ELEVENLABS_KANNADA_MODEL_ID || process.env.ELEVENLABS_MULTILINGUAL_MODEL_ID || 'eleven_multilingual_v2',
    googleVoiceId: process.env.GOOGLE_KANNADA_VOICE || 'kn-IN-Wavenet-A',
    googleLanguageCode: 'kn-IN',
    promptInstruction: 'IMPORTANT: Respond in Kanglish (Kannada-English mix). Use Kannada words naturally mixed with English technical terms. Example: "Nodi, photosynthesis andre enu andre, plants sunlight use madtave..." Make it sound like a friendly Kannada friend explaining. Do NOT use Hindi words.'
  },
  {
    code: 'ml',
    name: 'Malayalam',
    nativeName: 'മലയാളം',
    mixName: 'Manglish',
    flag: '🇮🇳',
    ttsVoiceId: process.env.ELEVENLABS_MALAYALAM_VOICE_ID || process.env.ELEVENLABS_VOICE_ID || 'pNInz6obpgDQGcFmaJgB',
    ttsModel: process.env.ELEVENLABS_MALAYALAM_MODEL_ID || process.env.ELEVENLABS_MULTILINGUAL_MODEL_ID || 'eleven_multilingual_v2',
    googleVoiceId: process.env.GOOGLE_MALAYALAM_VOICE || 'ml-IN-Wavenet-A',
    googleLanguageCode: 'ml-IN',
    promptInstruction: 'IMPORTANT: Respond in Manglish (Malayalam-English mix). Use Malayalam words naturally mixed with English technical terms. Example: "Nokku, photosynthesis ennu parayunnathu, plants sunlight use cheyyunnu..." Make it sound like a friendly Malayalam friend explaining. Do NOT use Hindi words.'
  },
  {
    code: 'bn',
    name: 'Bengali',
    nativeName: 'বাংলা',
    mixName: 'Benglish',
    flag: '🇮🇳',
    ttsVoiceId: process.env.ELEVENLABS_BENGALI_VOICE_ID || process.env.ELEVENLABS_VOICE_ID || 'pNInz6obpgDQGcFmaJgB',
    ttsModel: process.env.ELEVENLABS_BENGALI_MODEL_ID || process.env.ELEVENLABS_MULTILINGUAL_MODEL_ID || 'eleven_multilingual_v2',
    googleVoiceId: process.env.GOOGLE_BENGALI_VOICE || 'bn-IN-Wavenet-A',
    googleLanguageCode: 'bn-IN',
    promptInstruction: 'IMPORTANT: Respond in Benglish (Bengali-English mix). Use Bengali words naturally mixed with English technical terms. Example: "Dekho, photosynthesis mane ki, plants sunlight use kore..." Make it sound like a friendly Bengali friend explaining. Do NOT use Hindi words.'
  },
  {
    code: 'pa',
    name: 'Punjabi',
    nativeName: 'ਪੰਜਾਬੀ',
    mixName: 'Punglish',
    flag: '🇮🇳',
    ttsVoiceId: process.env.ELEVENLABS_PUNJABI_VOICE_ID || process.env.ELEVENLABS_VOICE_ID || 'pNInz6obpgDQGcFmaJgB',
    ttsModel: process.env.ELEVENLABS_PUNJABI_MODEL_ID || process.env.ELEVENLABS_MULTILINGUAL_MODEL_ID || 'eleven_multilingual_v2',
    googleVoiceId: process.env.GOOGLE_PUNJABI_VOICE || 'pa-IN-Wavenet-A',
    googleLanguageCode: 'pa-IN',
    promptInstruction: 'IMPORTANT: Respond in Punglish (Punjabi-English mix). Use Punjabi words naturally mixed with English technical terms. Example: "Vekho ji, photosynthesis ki hai, plants sunlight use karde ne..." Make it sound like a friendly Punjabi friend explaining.'
  }
];

export const DEFAULT_LANGUAGE = 'en';

/**
 * Get language configuration by code
 */
export function getLanguageConfig(code: string): LanguageConfig | undefined {
  return SUPPORTED_LANGUAGES.find(lang => lang.code === code);
}

/**
 * Get language configuration or default
 */
export function getLanguageConfigOrDefault(code: string): LanguageConfig {
  return getLanguageConfig(code) || getLanguageConfig(DEFAULT_LANGUAGE)!;
}

/**
 * Check if language code is valid
 */
export function isValidLanguage(code: string): boolean {
  return SUPPORTED_LANGUAGES.some(lang => lang.code === code);
}

/**
 * Get all language codes
 */
export function getAllLanguageCodes(): string[] {
  return SUPPORTED_LANGUAGES.map(lang => lang.code);
}
