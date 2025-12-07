import { ElevenLabsClient } from 'elevenlabs';

const elevenlabs = process.env.ELEVENLABS_API_KEY 
  ? new ElevenLabsClient({ apiKey: process.env.ELEVENLABS_API_KEY })
  : null;

// Configuration from environment variables
const VOICE_ID = process.env.ELEVENLABS_VOICE_ID || 'pNInz6obpgDQGcFmaJgB'; // Adam voice (default)
const MODEL_ID = process.env.ELEVENLABS_MODEL_ID || 'eleven_turbo_v2_5';

/**
 * Humanize mathematical symbols and notation for natural speech
 * This is a fallback for any symbols the AI might still include
 */
function humanizeMathText(text: string): string {
  let humanized = text;
  
  // Remove code blocks (ASCII art) - don't read them aloud
  humanized = humanized.replace(/```[\s\S]*?```/g, ' [diagram shown] ');
  
  // Remove markdown formatting
  humanized = humanized.replace(/\*\*(.*?)\*\*/g, '$1'); // Bold
  humanized = humanized.replace(/\*(.*?)\*/g, '$1'); // Italic
  humanized = humanized.replace(/__(.*?)__/g, '$1'); // Bold
  humanized = humanized.replace(/_(.*?)_/g, '$1'); // Italic
  
  // Only handle symbols that might slip through from AI
  // The AI is now instructed to write speech-friendly text
  
  // Special mathematical symbols (not common in text)
  humanized = humanized.replace(/×/g, ' times ');
  humanized = humanized.replace(/÷/g, ' divided by ');
  humanized = humanized.replace(/≠/g, ' not equals ');
  humanized = humanized.replace(/≈/g, ' approximately equals ');
  humanized = humanized.replace(/≤/g, ' less than or equal to ');
  humanized = humanized.replace(/≥/g, ' greater than or equal to ');
  
  // Superscript numbers (Unicode)
  humanized = humanized.replace(/²/g, ' squared');
  humanized = humanized.replace(/³/g, ' cubed');
  
  // Greek letters (common in math/science)
  humanized = humanized.replace(/π/g, ' pi ');
  humanized = humanized.replace(/θ/g, ' theta ');
  humanized = humanized.replace(/α/g, ' alpha ');
  humanized = humanized.replace(/β/g, ' beta ');
  humanized = humanized.replace(/γ/g, ' gamma ');
  humanized = humanized.replace(/Δ/g, ' delta ');
  humanized = humanized.replace(/λ/g, ' lambda ');
  humanized = humanized.replace(/μ/g, ' mu ');
  humanized = humanized.replace(/σ/g, ' sigma ');
  humanized = humanized.replace(/Σ/g, ' sum of ');
  humanized = humanized.replace(/∞/g, ' infinity ');
  
  // Clean up multiple spaces
  humanized = humanized.replace(/\s+/g, ' ').trim();
  
  return humanized;
}

export async function textToSpeech(text: string): Promise<Buffer | null> {
  if (!elevenlabs) {
    console.log('ElevenLabs not configured, skipping TTS');
    return null;
  }

  try {
    // Humanize mathematical notation for natural speech
    const humanizedText = humanizeMathText(text);
    console.log(`Attempting ElevenLabs TTS with voice: ${VOICE_ID}, model: ${MODEL_ID}`);
    
    // Use multilingual turbo model for Hinglish support
    const audio = await elevenlabs.generate({
      voice: VOICE_ID,
      text: humanizedText,
      model_id: MODEL_ID,
      voice_settings: {
        stability: 0.5,
        similarity_boost: 0.75,
        style: 0.4,
        use_speaker_boost: true
      }
    });

    // Convert stream to buffer
    const chunks: Buffer[] = [];
    for await (const chunk of audio) {
      chunks.push(chunk);
    }
    
    const buffer = Buffer.concat(chunks);
    console.log(`ElevenLabs TTS success: ${buffer.length} bytes`);
    return buffer;
  } catch (error: any) {
    console.error('ElevenLabs TTS error:', error);
    console.error('Error details:', error.message, error.statusCode);
    return null;
  }
}

// Streaming TTS - returns stream for immediate playback
export async function textToSpeechStream(text: string): Promise<AsyncIterable<Buffer> | null> {
  if (!elevenlabs) {
    console.log('ElevenLabs not configured, skipping TTS');
    return null;
  }

  try {
    // Humanize mathematical notation for natural speech
    const humanizedText = humanizeMathText(text);
    console.log(`Attempting ElevenLabs streaming TTS with voice: ${VOICE_ID}, model: ${MODEL_ID}`);
    
    // Use streaming for faster response
    const audioStream = await elevenlabs.generate({
      voice: VOICE_ID,
      text: humanizedText,
      model_id: MODEL_ID,
      voice_settings: {
        stability: 0.5,
        similarity_boost: 0.75,
        style: 0.4,
        use_speaker_boost: true
      },
      stream: true
    });

    console.log(`ElevenLabs streaming TTS started`);
    return audioStream;
  } catch (error: any) {
    console.error('ElevenLabs streaming TTS error:', error);
    console.error('Error details:', error.message, error.statusCode);
    return null;
  }
}

// Alternative: Use a specific Indian English voice if available
export async function textToSpeechHinglish(text: string): Promise<Buffer | null> {
  if (!elevenlabs) {
    console.log('ElevenLabs not configured, skipping TTS');
    return null;
  }

  try {
    // Humanize mathematical notation for natural speech
    const humanizedText = humanizeMathText(text);
    
    // Try using a voice that handles Indian accent and Hinglish better
    const audio = await elevenlabs.generate({
      voice: "zT03pEAEi0VHKciJODfn", // Custom voice ID
      text: humanizedText,
      model_id: "eleven_multilingual_v2", // Better for Hinglish code-switching
      voice_settings: {
        stability: 0.5,
        similarity_boost: 0.75,
        style: 0.4,
        use_speaker_boost: true
      }
    });

    const chunks: Buffer[] = [];
    for await (const chunk of audio) {
      chunks.push(chunk);
    }
    
    return Buffer.concat(chunks);
  } catch (error) {
    console.error('ElevenLabs Hinglish TTS error:', error);
    return null;
  }
}
