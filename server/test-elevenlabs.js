// Quick test to check if ElevenLabs API key is loaded
require('dotenv').config();

console.log('Environment variables check:');
console.log('ELEVENLABS_API_KEY:', process.env.ELEVENLABS_API_KEY ? 'SET (length: ' + process.env.ELEVENLABS_API_KEY.length + ')' : 'NOT SET');
console.log('ELEVENLABS_VOICE_ID:', process.env.ELEVENLABS_VOICE_ID || 'NOT SET');
console.log('ELEVENLABS_MODEL_ID:', process.env.ELEVENLABS_MODEL_ID || 'NOT SET');

if (process.env.ELEVENLABS_API_KEY) {
  console.log('\n✓ ElevenLabs API key is configured');
  console.log('First 10 chars:', process.env.ELEVENLABS_API_KEY.substring(0, 10) + '...');
} else {
  console.log('\n✗ ElevenLabs API key is NOT configured');
  console.log('Please set ELEVENLABS_API_KEY in your .env file');
}
