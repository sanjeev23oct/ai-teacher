import { ElevenLabsClient } from 'elevenlabs';

const elevenlabs = process.env.ELEVENLABS_API_KEY 
  ? new ElevenLabsClient({ apiKey: process.env.ELEVENLABS_API_KEY })
  : null;

export async function textToSpeech(text: string): Promise<Buffer | null> {
  if (!elevenlabs) {
    console.log('ElevenLabs not configured, skipping TTS');
    return null;
  }

  try {
    console.log('Attempting ElevenLabs TTS generation...');
    
    // Use multilingual turbo model for Hinglish support
    const audio = await elevenlabs.generate({
      voice: "pNInz6obpgDQGcFmaJgB", // Adam - works well with multilingual
      text: text,
      model_id: "eleven_turbo_v2_5", // Turbo model supports multilingual
      voice_settings: {
        stability: 0.5, // Slightly lower for natural code-switching
        similarity_boost: 0.75, // Good balance for mixed languages
        style: 0.4, // More expressive for teacher-like warmth
        use_speaker_boost: true // Better clarity for mixed languages
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

// Alternative: Use a specific Indian English voice if available
export async function textToSpeechHinglish(text: string): Promise<Buffer | null> {
  if (!elevenlabs) {
    console.log('ElevenLabs not configured, skipping TTS');
    return null;
  }

  try {
    // Try using a voice that handles Indian accent and Hinglish better
    const audio = await elevenlabs.generate({
      voice: "pNInz6obpgDQGcFmaJgB", // Can be replaced with Indian voice ID if available
      text: text,
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
