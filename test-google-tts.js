#!/usr/bin/env node

/**
 * Test script for Google TTS implementation
 * Tests both basic TTS and streaming functionality
 */

const path = require('path');
const fs = require('fs');

// Load environment variables
require('dotenv').config({ path: path.join(__dirname, 'server', '.env') });

// Import TTS service
const { textToSpeech, textToSpeechStream, getTTSStats, getTTSConfiguration, isProviderAvailable } = require('./server/services/ttsService');

async function testGoogleTTS() {
  console.log('🧪 Testing Google TTS Implementation\n');
  
  // Test 1: Check configuration
  console.log('1️⃣ Checking TTS Configuration...');
  const config = getTTSConfiguration();
  console.log('   Primary Provider:', config.primaryProvider);
  console.log('   Fallback Enabled:', config.fallbackEnabled);
  console.log('   Google API Key:', process.env.GOOGLE_API_KEY ? '✅ Set' : '❌ Missing');
  console.log();
  
  // Test 2: Check provider availability
  console.log('2️⃣ Checking Provider Availability...');
  const googleAvailable = await isProviderAvailable('google');
  const elevenLabsAvailable = await isProviderAvailable('elevenlabs');
  console.log('   Google TTS:', googleAvailable ? '✅ Available' : '❌ Unavailable');
  console.log('   ElevenLabs:', elevenLabsAvailable ? '✅ Available' : '❌ Unavailable');
  console.log();
  
  // Test 3: Basic TTS test
  console.log('3️⃣ Testing Basic TTS...');
  const testText = 'Hello! This is a test of Google Text-to-Speech in Indian English.';
  console.log('   Text:', testText);
  
  try {
    const startTime = Date.now();
    const audioBuffer = await textToSpeech(testText);
    const duration = Date.now() - startTime;
    
    if (audioBuffer) {
      console.log('   ✅ Success!');
      console.log('   Audio Size:', audioBuffer.length, 'bytes');
      console.log('   Generation Time:', duration, 'ms');
      
      // Save test audio file
      const testFile = 'test-google-tts-output.mp3';
      fs.writeFileSync(testFile, audioBuffer);
      console.log('   Saved to:', testFile);
    } else {
      console.log('   ❌ Failed: No audio buffer returned');
    }
  } catch (error) {
    console.log('   ❌ Error:', error.message);
  }
  console.log();
  
  // Test 4: Streaming TTS test
  console.log('4️⃣ Testing Streaming TTS...');
  const streamText = 'This is a streaming test for Google Text-to-Speech service.';
  console.log('   Text:', streamText);
  
  try {
    const startTime = Date.now();
    const audioStream = await textToSpeechStream(streamText);
    
    if (audioStream) {
      console.log('   ✅ Stream created successfully!');
      
      // Collect stream chunks
      const chunks = [];
      for await (const chunk of audioStream) {
        chunks.push(chunk);
      }
      
      const totalBuffer = Buffer.concat(chunks);
      const duration = Date.now() - startTime;
      
      console.log('   Stream Size:', totalBuffer.length, 'bytes');
      console.log('   Stream Time:', duration, 'ms');
      console.log('   Chunks Received:', chunks.length);
      
      // Save streaming test file
      const streamFile = 'test-google-tts-stream.mp3';
      fs.writeFileSync(streamFile, totalBuffer);
      console.log('   Saved to:', streamFile);
    } else {
      console.log('   ❌ Failed: No audio stream returned');
    }
  } catch (error) {
    console.log('   ❌ Error:', error.message);
  }
  console.log();
  
  // Test 5: Multi-language test
  console.log('5️⃣ Testing Multi-language Support...');
  const hindiText = 'नमस्ते! यह हिंदी में एक परीक्षण है।';
  console.log('   Hindi Text:', hindiText);
  
  try {
    const { textToSpeechWithOptions } = require('./server/services/ttsService');
    const startTime = Date.now();
    const hindiAudio = await textToSpeechWithOptions(hindiText, { 
      languageCode: 'hi',
      voiceId: 'hi-IN-Wavenet-A'
    });
    const duration = Date.now() - startTime;
    
    if (hindiAudio) {
      console.log('   ✅ Hindi TTS Success!');
      console.log('   Audio Size:', hindiAudio.length, 'bytes');
      console.log('   Generation Time:', duration, 'ms');
      
      // Save Hindi test file
      const hindiFile = 'test-google-tts-hindi.mp3';
      fs.writeFileSync(hindiFile, hindiAudio);
      console.log('   Saved to:', hindiFile);
    } else {
      console.log('   ❌ Failed: No Hindi audio returned');
    }
  } catch (error) {
    console.log('   ❌ Error:', error.message);
  }
  console.log();
  
  // Test 6: Usage statistics
  console.log('6️⃣ Usage Statistics...');
  const stats = getTTSStats();
  console.log('   Total Requests:', stats.totalRequests);
  console.log('   Successful Requests:', stats.successfulRequests);
  console.log('   Failed Requests:', stats.failedRequests);
  console.log('   Google Requests:', stats.providerStats?.google?.requests || 0);
  console.log('   ElevenLabs Requests:', stats.providerStats?.elevenlabs?.requests || 0);
  console.log('   Success Rate:', ((stats.successfulRequests / stats.totalRequests) * 100).toFixed(1) + '%');
  console.log();
  
  console.log('🎉 Google TTS Test Complete!');
  console.log('\n📁 Generated Files:');
  console.log('   - test-google-tts-output.mp3 (Basic TTS)');
  console.log('   - test-google-tts-stream.mp3 (Streaming TTS)');
  console.log('   - test-google-tts-hindi.mp3 (Hindi TTS)');
  console.log('\n🎵 You can play these files to verify audio quality.');
}

// Run the test
testGoogleTTS().catch(console.error);