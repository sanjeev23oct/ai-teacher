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
    const audio = await elevenlabs.generate({
      voice: "1qEiC6qsybMkmnNdVMbK", // Natural, warm Indian-accented female voice
      text: text,
      model_id: "eleven_multilingual_v2",
      voice_settings: {
        stability: 0.5,
        similarity_boost: 0.75
      }
    });

    // Convert stream to buffer
    const chunks: Buffer[] = [];
    for await (const chunk of audio) {
      chunks.push(chunk);
    }
    
    return Buffer.concat(chunks);
  } catch (error) {
    console.error('ElevenLabs TTS error:', error);
    return null;
  }
}
