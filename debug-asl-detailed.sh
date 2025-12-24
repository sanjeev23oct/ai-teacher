#!/bin/bash

# Detailed ASL Debug Script
# Tests the ASL scoring endpoint with detailed error reporting

SERVER_URL="http://localhost:3001"
TASK_ID="c9-solo-1"

echo "🎤 Detailed ASL Debug Test"
echo "=========================="

# Step 1: Test basic connectivity
echo "🔗 Testing server connectivity..."
curl -s "$SERVER_URL/api/ping" | jq '.' 2>/dev/null || echo "Server ping failed"

# Step 2: Test ASL test endpoint
echo "🧪 Testing ASL test endpoint..."
curl -s "$SERVER_URL/api/asl/test" | jq '.' 2>/dev/null || echo "ASL test endpoint failed"

# Step 3: Login to get a valid token
echo "🔐 Logging in..."
LOGIN_RESPONSE=$(curl -s -X POST "$SERVER_URL/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}')

echo "Login response: $LOGIN_RESPONSE"
AUTH_TOKEN=$(echo $LOGIN_RESPONSE | jq -r '.token' 2>/dev/null)

if [ "$AUTH_TOKEN" = "null" ] || [ -z "$AUTH_TOKEN" ]; then
    echo "❌ Failed to get auth token"
    exit 1
fi

echo "✅ Got auth token"

# Step 4: Create test audio file
echo "📁 Creating test audio file..."
# Create a simple 3-second audio file with actual content (beep)
ffmpeg -f lavfi -i "sine=frequency=1000:duration=3" -acodec libmp3lame test-audio.mp3 -y 2>/dev/null

if [ ! -f "test-audio.mp3" ]; then
    echo "❌ Failed to create test audio file"
    exit 1
fi

echo "✅ Test audio file created ($(stat -f%z test-audio.mp3 2>/dev/null || stat -c%s test-audio.mp3) bytes)"

# Step 5: Test ASL scoring with detailed output
echo "🚀 Testing ASL scoring endpoint..."
echo "Request details:"
echo "  URL: $SERVER_URL/api/asl/score"
echo "  Task ID: $TASK_ID"
echo "  Audio file size: $(stat -f%z test-audio.mp3 2>/dev/null || stat -c%s test-audio.mp3) bytes"

RESPONSE=$(curl -s -w "\nHTTP_CODE:%{http_code}\nTIME_TOTAL:%{time_total}\n" \
  -X POST "$SERVER_URL/api/asl/score" \
  -H "Authorization: Bearer $AUTH_TOKEN" \
  -F "audio=@test-audio.mp3" \
  -F "taskId=$TASK_ID" \
  -F "mode=solo")

echo "Response:"
echo "$RESPONSE"

# Step 6: Cleanup
echo ""
echo "🧹 Cleaning up..."
rm -f test-audio.mp3

echo "✅ Debug test completed"