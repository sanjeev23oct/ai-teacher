# Railway Deployment Guide

This guide will help you deploy your AI Teacher application to Railway.

## Prerequisites

1. GitHub account
2. Railway account (sign up at https://railway.app)
3. Your code pushed to a GitHub repository

## Deployment Steps

### 1. Prepare Your Repository

Make sure all changes are committed and pushed to GitHub:

```bash
git add .
git commit -m "Prepare for Railway deployment"
git push origin main
```

### 2. Create Railway Project

1. Go to https://railway.app
2. Click "New Project"
3. Select "Deploy from GitHub repo"
4. Choose your repository
5. Railway will detect your monorepo structure

### 3. Set Up Services

You'll need to create 3 services:

#### A. PostgreSQL Database

1. Click "New" → "Database" → "Add PostgreSQL"
2. Railway will automatically create a database
3. Note: The `DATABASE_URL` will be automatically available to your services

#### B. Backend Service (Server)

1. Click "New" → "GitHub Repo" → Select your repo
2. Configure the service:
   - **Root Directory**: `server`
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`
3. Add environment variables (see section below)

#### C. Frontend Service (Client)

1. Click "New" → "GitHub Repo" → Select your repo (again)
2. Configure the service:
   - **Root Directory**: `client`
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm run preview`
3. Add environment variables (see section below)

### 4. Environment Variables

#### Backend Service Variables:

```env
# AI Configuration
AI_PROVIDER=gemini
GEMINI_API_KEY=your-gemini-api-key-here

# LM Studio (optional fallback)
LM_STUDIO_URL=http://localhost:1234/v1
LM_STUDIO_MODEL=llama-3.2-3b-instruct

# Ollama (optional)
OLLAMA_URL=http://localhost:11434/v1
OLLAMA_MODEL=llava:13b

# Database (automatically provided by Railway)
DATABASE_URL=${{Postgres.DATABASE_URL}}

# JWT Secret
JWT_SECRET=your-super-secret-jwt-key-change-in-production

# ElevenLabs (optional)
ELEVENLABS_API_KEY=your-elevenlabs-key-if-you-have-one

# Port (Railway provides this automatically)
PORT=${{PORT}}
```

#### Frontend Service Variables:

```env
# Backend API URL (use your Railway backend URL)
VITE_API_URL=https://your-backend-service.railway.app
```

### 5. Update Frontend API Configuration

After deploying the backend, you'll get a Railway URL like:
`https://your-backend-service.railway.app`

Update your frontend to use this URL. You may need to update the API base URL in your frontend code.

### 6. Database Migration

After the backend service is deployed:

1. Go to your backend service in Railway
2. Click on "Settings" → "Deploy"
3. The build command will automatically run Prisma migrations
4. Check logs to ensure migrations completed successfully

### 7. CORS Configuration

Make sure your backend CORS is configured to allow your frontend domain:

```typescript
// In server/index.ts
const corsOptions = {
  origin: [
    'http://localhost:5173',
    'https://your-frontend-service.railway.app'
  ],
  credentials: true
};
```

## Post-Deployment

### Verify Deployment

1. **Backend Health Check**: Visit `https://your-backend-service.railway.app/health`
2. **Frontend**: Visit `https://your-frontend-service.railway.app`
3. **Database**: Check Railway dashboard for connection status

### Monitor Logs

- Click on each service to view real-time logs
- Check for any errors or warnings

### Custom Domain (Optional)

1. Go to service settings
2. Click "Settings" → "Domains"
3. Add your custom domain
4. Update DNS records as instructed

## Troubleshooting

### Build Failures

- Check build logs in Railway dashboard
- Ensure all dependencies are in package.json
- Verify Node.js version compatibility

### Database Connection Issues

- Ensure `DATABASE_URL` is properly set
- Check if Prisma migrations ran successfully
- Verify database service is running

### CORS Errors

- Add your Railway frontend URL to CORS whitelist
- Ensure credentials are enabled if using authentication

### File Upload Issues

- Railway has ephemeral storage
- Consider using cloud storage (AWS S3, Cloudinary) for production
- Current setup stores files temporarily (will be lost on restart)

## Cost Optimization

Railway free tier includes:
- $5 credit per month
- 500MB PostgreSQL storage
- 512MB RAM per service

To stay within free tier:
- Monitor usage in Railway dashboard
- Optimize database queries
- Consider implementing caching

## Updating Your App

To deploy updates:

```bash
git add .
git commit -m "Your update message"
git push origin main
```

Railway will automatically detect changes and redeploy.

## Support

- Railway Docs: https://docs.railway.app
- Railway Discord: https://discord.gg/railway
- GitHub Issues: Create issues in your repository

## Security Checklist

- [ ] All API keys are in environment variables (not in code)
- [ ] JWT_SECRET is a strong random string
- [ ] Database credentials are secure
- [ ] CORS is properly configured
- [ ] Rate limiting is implemented (consider adding)
- [ ] Input validation is in place

## Next Steps

1. Set up monitoring and alerts
2. Implement proper error tracking (Sentry, LogRocket)
3. Add analytics (Google Analytics, Plausible)
4. Set up automated backups for database
5. Consider CDN for static assets
