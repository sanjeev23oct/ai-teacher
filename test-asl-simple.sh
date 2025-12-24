#!/bin/bash

# Simple ASL Test Script with Login
# Tests the ASL scoring endpoint with fresh authentication

SERVER_URL="http://localhost:3001"
TASK_ID="c9-solo-1"

echo "🎤 Testing ASL Scoring Endpoint"
echo "================================"

# Step 1: Login to get a valid token
echo "🔐 Logging in to get auth token..."
LOGIN_RESPONSE=$(curl -s -X POST "$SERVER_URL/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}')

echo "Login response: $LOGIN_RESPONSE"

# Extract token from response (assuming it's in JSON format)
AUTH_TOKEN=$(echo $LOGIN_RESPONSE | grep -o '"token":"[^"]*' | cut -d'"' -f4)

if [ -z "$AUTH_TOKEN" ]; then
    echo "❌ Failed to get auth token. Please check login credentials."
    echo "You may need to create a test user first:"
    echo "curl -X POST $SERVER_URL/api/auth/signup -H 'Content-Type: application/json' -d '{\"name\":\"Test User\",\"email\":\"test@example.com\",\"password\":\"password123\"}'"
    exit 1
fi

echo "✅ Got auth token: ${AUTH_TOKEN:0:20}..."

# Step 2: Create test audio file
echo "📁 Creating test audio file..."
# Create a simple 5-second silence audio file
ffmpeg -f lavfi -i anullsrc=r=44100:cl=mono -t 5 -q:a 9 -acodec libmp3lame test-audio.mp3 -y 2>/dev/null

if [ ! -f "test-audio.mp3" ]; then
    echo "❌ Failed to create test audio file. Install ffmpeg or create a test audio file manually."
    exit 1
fi

echo "✅ Test audio file created"

# Step 3: Test ASL scoring endpoint
echo "🚀 Testing ASL scoring..."
curl -X POST "$SERVER_URL/api/asl/score" \
  -H "Authorization: Bearer $AUTH_TOKEN" \
  -F "audio=@test-audio.mp3" \
  -F "taskId=$TASK_ID" \
  -F "mode=solo"

echo ""
echo "🧹 Cleaning up..."
rm -f test-audio.mp3

echo "✅ Test completed"