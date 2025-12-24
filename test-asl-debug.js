#!/usr/bin/env node

// Simple Node.js script to test ASL functionality directly
// This will help us see exactly where the error occurs

const fs = require('fs');
const path = require('path');

async function testASLComponents() {
  console.log('🧪 Testing ASL Components Directly');
  console.log('==================================');

  try {
    // Test 1: Check if aslScoringService can be imported
    console.log('📦 Testing aslScoringService import...');
    const aslScoringService = require('./server/services/aslScoringService');
    console.log('✅ aslScoringService imported successfully');

    // Test 2: Check if aslTasks can be imported
    console.log('📋 Testing aslTasks import...');
    const aslTasks = require('./server/data/aslTasks');
    console.log('✅ aslTasks imported successfully');

    // Test 3: Test getting a task by ID
    console.log('🎯 Testing getTaskById...');
    const task = aslTasks.getTaskById('c9-solo-1');
    if (task) {
      console.log('✅ Task found:', task.title);
      console.log('   Prompt:', task.prompt.substring(0, 50) + '...');
      console.log('   Keywords:', task.keywords);
    } else {
      console.log('❌ Task not found');
      return;
    }

    // Test 4: Test transcription with a dummy buffer
    console.log('🎤 Testing transcription...');
    
    // Create a small dummy audio buffer (this will likely fail, but we'll see the error)
    const dummyBuffer = Buffer.from('dummy audio data');
    
    try {
      const transcription = await aslScoringService.transcribeAudio(dummyBuffer);
      console.log('✅ Transcription successful:', transcription);
    } catch (transcriptionError) {
      console.log('❌ Transcription failed:', transcriptionError.message);
      console.log('   This is expected with dummy data, but shows us the error path');
    }

    // Test 5: Test scoring with dummy transcription
    console.log('📊 Testing scoring with dummy transcription...');
    try {
      const result = await aslScoringService.scoreASLResponse({
        transcription: "Hello, this is a test transcription for my favorite book.",
        taskPrompt: task.prompt,
        keywords: task.keywords,
        duration: 60
      });
      console.log('✅ Scoring successful:', result);
    } catch (scoringError) {
      console.log('❌ Scoring failed:', scoringError.message);
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('Stack trace:', error.stack);
  }
}

// Run the test
testASLComponents().then(() => {
  console.log('🏁 Test completed');
}).catch(error => {
  console.error('💥 Test crashed:', error);
});