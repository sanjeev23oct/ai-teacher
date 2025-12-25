#!/usr/bin/env node

/**
 * Test ASL scoring with transcription instead of audio
 */

const SERVER_URL = 'http://localhost:3001';

async function testASLWithTranscription() {
  console.log('🧪 Testing ASL scoring with transcription...');
  
  try {
    // First, login to get auth token
    console.log('🔐 Logging in...');
    const loginResponse = await fetch(`${SERVER_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'test@example.com',
        password: 'testpassword123'
      })
    });

    if (!loginResponse.ok) {
      console.log('❌ Login failed, trying to create account...');
      
      // Try to create account
      const signupResponse = await fetch(`${SERVER_URL}/api/auth/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Test User',
          email: 'test@example.com',
          password: 'testpassword123',
          grade: '10',
          school: 'Test School'
        })
      });

      if (!signupResponse.ok) {
        const signupError = await signupResponse.text();
        console.error('❌ Signup failed:', signupError);
        return;
      }
      
      console.log('✅ Account created successfully');
    } else {
      console.log('✅ Login successful');
    }

    // Get auth cookie from response
    const cookies = loginResponse.headers.get('set-cookie') || '';
    
    // Test ASL scoring with transcription
    console.log('🎤 Testing ASL scoring...');
    
    const testTranscription = "My favorite book is Harry Potter and the Philosopher's Stone by J.K. Rowling. It's about a young boy who discovers he's a wizard and goes to Hogwarts School. I love this book because it has an amazing story with interesting characters like Harry, Hermione, and Ron. The magical world is so creative and exciting. I would definitely recommend this book to others because it teaches us about friendship, courage, and believing in yourself.";
    
    const aslResponse = await fetch(`${SERVER_URL}/api/asl/score`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Cookie': cookies
      },
      body: JSON.stringify({
        transcription: testTranscription,
        taskId: 'book-recommendation-9',
        mode: 'solo',
        languageCode: 'en'
      })
    });

    if (!aslResponse.ok) {
      const errorText = await aslResponse.text();
      console.error('❌ ASL scoring failed:', errorText);
      return;
    }

    const result = await aslResponse.json();
    console.log('✅ ASL scoring successful!');
    console.log('📊 Score:', result.score + '/5');
    console.log('💡 Feedback:');
    result.fixes.forEach((fix, index) => {
      console.log(`   ${index + 1}. ${fix}`);
    });
    
    if (result.detailedFeedback) {
      console.log('📝 Detailed feedback available');
    }
    
    console.log('🎉 Test completed successfully!');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Run the test
testASLWithTranscription();