#!/bin/bash

# Test ElevenLabs API directly
# This will help us see if the issue is with the ElevenLabs API

echo "🎤 Testing ElevenLabs API"
echo "========================"

# Check if ELEVENLABS_API_KEY is set
if [ -z "$ELEVENLABS_API_KEY" ]; then
    echo "❌ ELEVENLABS_API_KEY not set in environment"
    echo "Please set it with: export ELEVENLABS_API_KEY=your_key_here"
    exit 1
fi

echo "✅ ElevenLabs API key found"

# Create a simple test audio file
echo "📁 Creating test audio file..."
ffmpeg -f lavfi -i "sine=frequency=1000:duration=2" -acodec libmp3lame test-elevenlabs.mp3 -y 2>/dev/null

if [ ! -f "test-elevenlabs.mp3" ]; then
    echo "❌ Failed to create test audio file"
    exit 1
fi

echo "✅ Test audio file created"

# Test ElevenLabs Speech-to-Text API directly
echo "🌐 Testing ElevenLabs STT API..."
curl -X POST "https://api.elevenlabs.io/v1/speech-to-text" \
  -H "xi-api-key: $ELEVENLABS_API_KEY" \
  -F "file=@test-elevenlabs.mp3" \
  -F "model_id=scribe_v2" \
  -F "language=en" \
  -w "\nHTTP_CODE:%{http_code}\nTIME_TOTAL:%{time_total}\n"

echo ""
echo "🧹 Cleaning up..."
rm -f test-elevenlabs.mp3

echo "✅ ElevenLabs test completed"