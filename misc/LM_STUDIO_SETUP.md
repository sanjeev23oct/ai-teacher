# LM Studio Setup Guide

## Overview

This guide will help you set up LM Studio to run AI models locally on your M5 Pro MacBook, eliminating the need for external API keys and rate limits.

## Prerequisites

- M5 Pro MacBook (or any Apple Silicon Mac)
- LM Studio installed
- At least 8GB of free RAM
- 10-20GB of free disk space for models

## Step 1: Install LM Studio

1. Download LM Studio from: https://lmstudio.ai/
2. Install the application
3. Open LM Studio

## Step 2: Download a Model

### Recommended Models for M5 Pro:

**For Text-Only (Doubt Solver without images):**
1. **Llama 3.2 3B Instruct** (Recommended - Fast & Good)
   - Size: ~2GB
   - Speed: Very fast on M5 Pro
   - Quality: Excellent for educational content
   - Search in LM Studio: `llama-3.2-3b-instruct`

2. **Mistral 7B Instruct**
   - Size: ~4GB
   - Speed: Fast
   - Quality: Excellent
   - Search: `mistral-7b-instruct`

**For Vision (Questions with images):**
1. **LLaVA 1.6 Mistral 7B** (Recommended)
   - Size: ~4GB
   - Can understand images
   - Search: `llava-v1.6-mistral-7b`

2. **LLaVA 1.5 7B**
   - Size: ~4GB
   - Good vision capabilities
   - Search: `llava-1.5-7b`

### How to Download:

1. Click the **Search** icon in LM Studio
2. Search for the model name (e.g., "llama-3.2-3b-instruct")
3. Click **Download**
4. Wait for download to complete

## Step 3: Start the Local Server

1. In LM Studio, click the **Local Server** tab (left sidebar)
2. Select your downloaded model from the dropdown
3. Click **Start Server**
4. The server will start on `http://localhost:1234`
5. Keep LM Studio running in the background

## Step 4: Configure the Application

Update your `server/.env` file:

```env
# AI Model Configuration
AI_PROVIDER=lmstudio

# LM Studio Configuration
LM_STUDIO_URL=http://localhost:1234/v1
LM_STUDIO_MODEL=llama-3.2-3b-instruct

# Optional: Fallback to Ollama if LM Studio is not running
OLLAMA_URL=http://localhost:11434/v1
```

## Step 5: Test the Setup

1. Start your backend server:
   ```bash
   cd server
   npm start
   ```

2. Start your frontend:
   ```bash
   cd client
   npm run dev
   ```

3. Navigate to `http://localhost:5173/doubts`

4. Try asking a question!

## Model Recommendations by Use Case

### Best for Speed (M5 Pro):
- **Llama 3.2 3B Instruct** - Lightning fast, great quality
- Perfect for: Quick responses, multiple students

### Best for Quality:
- **Mistral 7B Instruct** - Slower but more detailed
- Perfect for: Complex explanations, detailed answers

### Best for Images:
- **LLaVA 1.6 Mistral 7B** - Can see and understand images
- Perfect for: Questions with diagrams, handwritten problems

## Performance Tips

### For M5 Pro MacBook:

1. **Use 3B-7B models** - Perfect balance of speed and quality
2. **Enable Metal acceleration** - LM Studio does this automatically
3. **Close other apps** - Free up RAM for better performance
4. **Use SSD storage** - Faster model loading

### Expected Performance:

- **Llama 3.2 3B**: ~50-100 tokens/second
- **Mistral 7B**: ~30-50 tokens/second
- **LLaVA 7B**: ~20-40 tokens/second

## Troubleshooting

### Server Won't Start
- Check if port 1234 is already in use
- Try restarting LM Studio
- Check LM Studio logs for errors

### Slow Responses
- Try a smaller model (3B instead of 7B)
- Close other applications
- Check Activity Monitor for memory usage

### Model Not Found
- Make sure the model name in `.env` matches exactly
- Check LM Studio's model list
- Try re-downloading the model

### Connection Refused
- Ensure LM Studio server is running
- Check the URL is `http://localhost:1234/v1`
- Verify firewall settings

## Switching Between Providers

You can easily switch between AI providers by changing `AI_PROVIDER` in `.env`:

```env
# Use LM Studio (local, free, no limits)
AI_PROVIDER=lmstudio

# Use Gemini (cloud, requires API key, has limits)
AI_PROVIDER=gemini

# Use Ollama (local, alternative to LM Studio)
AI_PROVIDER=ollama
```

## Advantages of LM Studio

✅ **No API Keys Required** - Everything runs locally
✅ **No Rate Limits** - Use as much as you want
✅ **Privacy** - Student data never leaves your computer
✅ **Offline** - Works without internet
✅ **Fast on M5 Pro** - Optimized for Apple Silicon
✅ **Free** - No costs for API calls
✅ **Multiple Models** - Easy to switch between models

## Recommended Workflow

1. **Development**: Use LM Studio (fast, no limits)
2. **Production**: Use Gemini or other cloud API (more reliable)
3. **Testing**: Use smaller models (3B) for speed
4. **Demo**: Use larger models (7B) for quality

## Multi-Language Support

All models support multiple languages! The prompts are designed to work in:
- English
- Hindi
- Hinglish (Hindi + English mix)
- Bengali, Tamil, Telugu, Marathi, Gujarati, Kannada, Malayalam, Punjabi

The model will respond in the language you specify in the prompt.

## Next Steps

1. Download a model in LM Studio
2. Start the local server
3. Update your `.env` file
4. Restart your backend server
5. Test with a simple question
6. Enjoy unlimited, free AI assistance!

## Support

If you encounter issues:
1. Check LM Studio logs
2. Verify model is loaded
3. Test with curl: `curl http://localhost:1234/v1/models`
4. Check server logs for errors

## Resources

- LM Studio: https://lmstudio.ai/
- Model Hub: https://huggingface.co/models
- Documentation: https://lmstudio.ai/docs
