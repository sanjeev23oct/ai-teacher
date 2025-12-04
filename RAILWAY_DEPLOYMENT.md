# Railway Deployment Guide

This project is configured to deploy as a **single unified application** on Railway, where the Express server serves both the API and the built React frontend.

## Architecture

- **Single Service**: One Railway service runs the Express server
- **Static Files**: React app is built and served by Express
- **Single URL**: Everything runs on one domain (e.g., `your-app.railway.app`)
- **API Routes**: All `/api/*` requests go to Express
- **Frontend**: All other routes serve the React SPA

## Deployment Steps

### 1. Push to GitHub

```bash
git add .
git commit -m "Configure for Railway deployment"
git push origin main
```

### 2. Create Railway Project

1. Go to [railway.app](https://railway.app)
2. Click "New Project"
3. Select "Deploy from GitHub repo"
4. Choose your repository
5. Railway will auto-detect the configuration from `nixpacks.toml`

### 3. Configure Environment Variables

In Railway dashboard, add these environment variables:

**Required:**
- `DATABASE_URL` - PostgreSQL connection string (add PostgreSQL service in Railway)
- `JWT_SECRET` - Random secret for JWT tokens (e.g., `openssl rand -base64 32`)
- `NODE_ENV` - Set to `production`

**Optional (for AI features):**
- `GEMINI_API_KEY` - Google Gemini API key for better OCR
- `GOOGLE_API_KEY` - Alternative to GEMINI_API_KEY
- `OLLAMA_URL` - If using external Ollama instance
- `ELEVENLABS_API_KEY` - For text-to-speech features

**Example:**
```
DATABASE_URL=postgresql://user:pass@host:5432/dbname
JWT_SECRET=your-super-secret-jwt-key-here
NODE_ENV=production
GEMINI_API_KEY=your-gemini-api-key
```

### 4. Add PostgreSQL Database

1. In Railway project, click "New"
2. Select "Database" → "PostgreSQL"
3. Railway will automatically set `DATABASE_URL` environment variable
4. The build process will run Prisma migrations automatically

### 5. Deploy

Railway will automatically:
1. Install dependencies for root, client, and server
2. Build the React frontend (`npm run build`)
3. Generate Prisma client
4. Start the Express server
5. Server serves both API and static React files

### 6. Access Your App

Once deployed, Railway provides a URL like:
- `https://your-app.railway.app` - Your full application

All routes work:
- `/` - React frontend (home page)
- `/grade` - Grade exam page
- `/history` - History page
- `/api/grade` - API endpoint
- `/api/auth/login` - Auth endpoint
- etc.

## Build Process

The deployment follows this sequence (defined in `nixpacks.toml`):

```
1. Install root dependencies
2. Install client dependencies (cd client && npm install)
3. Install server dependencies (cd server && npm install)
4. Build React app (cd client && npm run build) → creates client/dist/
5. Generate Prisma client (cd server && npx prisma generate)
6. Start server (cd server && npm start)
```

The Express server (in production mode):
- Serves static files from `client/dist/`
- Handles all `/api/*` routes
- Returns `index.html` for all other routes (React Router)

## Local Development

For local development, run client and server separately:

```bash
# Terminal 1 - Client (with Vite dev server)
cd client
npm run dev

# Terminal 2 - Server
cd server
npm run dev
```

The Vite dev server proxies API calls to `localhost:3001`.

## Troubleshooting

### Build Fails
- Check Railway build logs
- Ensure all dependencies are in `package.json` files
- Verify Node.js version compatibility (using Node 20)

### Database Connection Issues
- Verify `DATABASE_URL` is set correctly
- Check PostgreSQL service is running
- Ensure Prisma migrations ran successfully

### 404 on Routes
- Verify catch-all route is last in `server/index.ts`
- Check `NODE_ENV=production` is set
- Ensure React build completed successfully

### API Calls Fail
- Check CORS settings in `server/index.ts`
- Verify API routes are prefixed with `/api`
- Check browser console for errors

## Files Modified for Deployment

- `package.json` - Root build scripts
- `nixpacks.toml` - Railway build configuration
- `railway.json` - Railway deployment settings
- `server/index.ts` - Added static file serving and catch-all route
- `client/vite.config.ts` - Added proxy for development
- `client/src/config.ts` - Dynamic API URL based on environment
- `client/.env.production` - Production environment variables

## Cost Optimization

Railway offers:
- $5/month hobby plan with usage-based pricing
- Free trial credits for testing
- Sleep mode for inactive services (can be disabled)

To minimize costs:
- Use single service (already configured)
- Set appropriate resource limits
- Monitor usage in Railway dashboard
