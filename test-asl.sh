#!/bin/bash

# Simple ASL Test Script
# Tests the ASL scoring endpoint with authentication

# Configuration
SERVER_URL="http://localhost:3001"
AUTH_TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJjbTU0cGNqZGcwMDAwMTNmcWZkZGZkZGZkIiwiaWF0IjoxNzM0OTQ4NjI3LCJleHAiOjE3MzU1NTM0Mjd9.example"
TASK_ID="c9-solo-1"

echo "🎤 Testing ASL Scoring Endpoint"
echo "================================"

# Create a simple test audio file (silence for testing)
echo "📁 Creating test audio file..."
ffmpeg -f lavfi -i anullsrc=r=44100:cl=mono -t 5 -q:a 9 -acodec libmp3lame test-audio.mp3 -y 2>/dev/null

if [ ! -f "test-audio.mp3" ]; then
    echo "❌ Failed to create test audio file. Install ffmpeg or create a test audio file manually."
    exit 1
fi

echo "✅ Test audio file created"

# Test ASL scoring endpoint
echo "🚀 Testing ASL scoring..."
curl -X POST "$SERVER_URL/api/asl/score" \
  -H "Authorization: Bearer $AUTH_TOKEN" \
  -F "audio=@test-audio.mp3" \
  -F "taskId=$TASK_ID" \
  -F "mode=solo" \
  -v

echo ""
echo "🧹 Cleaning up..."
rm -f test-audio.mp3

echo "✅ Test completed"