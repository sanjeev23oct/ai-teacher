#!/bin/bash

# Test script to grade an exam paper
IMAGE_PATH="/Users/sanjeevgulati/personal-repos/ai-teacher/server/samplerequest/WhatsApp Image 2025-11-29 at 12.52.50 PM.jpeg"

echo "Testing exam grading API..."
echo "Image: $IMAGE_PATH"
echo ""

# Send the request
curl -X POST http://localhost:3001/api/grade \
  -F "exam=@$IMAGE_PATH" \
  -H "Content-Type: multipart/form-data" \
  | jq '.' 2>/dev/null || cat

echo ""
echo "Done!"
