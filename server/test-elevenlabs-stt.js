const fs = require('fs');
const FormData = require('form-data');

async function testElevenLabsSTT() {
  const elevenlabsApiKey = process.env.ELEVENLABS_API_KEY || 'sk_11eaaa0a6c885042f480430747982277f367970337b17b42';
  
  console.log('Testing ElevenLabs Speech-to-Text API...');
  console.log('API Key:', elevenlabsApiKey ? `${elevenlabsApiKey.substring(0, 10)}...` : 'NOT SET');
  
  // Create a simple test audio buffer (this won't work for real transcription, but will test API connectivity)
  const testBuffer = Buffer.from('test audio data');
  
  try {
    const form = new FormData();
    form.append('audio', testBuffer, {
      filename: 'test.webm',
      contentType: 'audio/webm',
      knownLength: testBuffer.length
    });
    
    console.log('Making API request to ElevenLabs...');
    
    const response = await fetch('https://api.elevenlabs.io/v1/speech-to-text', {
      method: 'POST',
      headers: {
        'xi-api-key': elevenlabsApiKey,
        ...form.getHeaders()
      },
      bod