#!/bin/bash

# Simple ASL Test Script - No ElevenLabs
# Tests the ASL scoring endpoint structure without actual transcription

SERVER_URL="http://localhost:3001"
TASK_ID="c9-solo-1"

echo "🎤 Testing ASL Endpoint Structure (No ElevenLabs)"
echo "================================================"

# Step 1: Login to get a valid token
echo "🔐 Logging in..."
LOGIN_RESPONSE=$(curl -s -X POST "$SERVER_URL/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}')

AUTH_TOKEN=$(echo $LOGIN_RESPONSE | grep -o '"token":"[^"]*' | cut -d'"' -f4)

if [ -z "$AUTH_TOKEN" ]; then
    echo "❌ Failed to get auth token"
    exit 1
fi

echo "✅ Got auth token"

# Step 2: Create a tiny test audio file
echo "📁 Creating minimal test audio..."
echo "fake audio data" > test-audio.txt

# Step 3: Test ASL endpoint
echo "🚀 Testing ASL endpoint..."
curl -X POST "$SERVER_URL/api/asl/score" \
  -H "Authorization: Bearer $AUTH_TOKEN" \
  -F "audio=@test-audio.txt" \
  -F "taskId=$TASK_ID" \
  -F "mode=solo" \
  -w "\nHTTP Status: %{http_code}\n"

echo ""
echo "🧹 Cleaning up..."
rm -f test-audio.txt

echo "✅ Test completed"