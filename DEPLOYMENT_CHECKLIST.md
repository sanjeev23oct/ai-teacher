# Railway Deployment Checklist

## Pre-Deployment

- [ ] Code is committed to GitHub
- [ ] All dependencies are in package.json files
- [ ] Database schema is finalized in `server/prisma/schema.prisma`

## Railway Setup

### 1. Create New Project
- [ ] Go to [railway.app](https://railway.app) and sign in
- [ ] Click "New Project"
- [ ] Select "Deploy from GitHub repo"
- [ ] Choose your repository
- [ ] Railway will detect `nixpacks.toml` automatically

### 2. Add PostgreSQL Database
- [ ] In your Railway project, click "+ New"
- [ ] Select "Database" → "PostgreSQL"
- [ ] Railway automatically sets `DATABASE_URL` variable
- [ ] Wait for database to provision

### 3. Configure Environment Variables

Click on your service → "Variables" tab and add:

**Required Variables:**
```
NODE_ENV=production
JWT_SECRET=<generate with: openssl rand -base64 32>
AI_PROVIDER=gemini
GEMINI_API_KEY=<your-gemini-api-key>
```

**Optional Variables:**
```
ELEVENLABS_API_KEY=<for text-to-speech>
GROQ_API_KEY=<if using Groq instead>
```

**Auto-Provided by Railway:**
- `DATABASE_URL` - Set automatically when you add PostgreSQL
- `PORT` - Set automatically by Railway

### 4. Deploy
- [ ] Click "Deploy" or push to GitHub (auto-deploys)
- [ ] Monitor build logs for errors
- [ ] Wait for deployment to complete (~3-5 minutes)

### 5. Verify Deployment

- [ ] Open the Railway-provided URL (e.g., `https://your-app.railway.app`)
- [ ] Check homepage loads
- [ ] Test signup/login
- [ ] Upload a test exam
- [ ] Check database has data

## Post-Deployment

### Test All Features
- [ ] User authentication (signup/login)
- [ ] Exam grading (single mode)
- [ ] Exam grading (dual mode with question paper)
- [ ] Exam history
- [ ] Doubt solver
- [ ] Revision system
- [ ] Voice chat (if configured)

### Monitor
- [ ] Check Railway logs for errors
- [ ] Monitor database usage
- [ ] Check API response times
- [ ] Verify file uploads work

### Optional: Custom Domain
- [ ] Go to service settings → "Domains"
- [ ] Click "Custom Domain"
- [ ] Add your domain and configure DNS

## Troubleshooting

### Build Fails
1. Check Railway build logs
2. Verify all package.json files are correct
3. Ensure Prisma schema is valid
4. Check Node.js version (should be 20)

### Database Connection Errors
1. Verify PostgreSQL service is running
2. Check `DATABASE_URL` is set correctly
3. Ensure migrations ran successfully
4. Check Railway logs for Prisma errors

### App Loads but API Fails
1. Check environment variables are set
2. Verify `NODE_ENV=production`
3. Check CORS settings in server code
4. Look for errors in Railway logs

### 404 on Routes
1. Verify catch-all route is in `server/index.ts`
2. Check React build completed successfully
3. Ensure static files are being served

## Cost Estimate

Railway Pricing:
- **Hobby Plan**: $5/month + usage
- **Database**: ~$5-10/month for PostgreSQL
- **Compute**: Based on usage (sleep after inactivity)

**Total**: ~$10-15/month for low-medium traffic

## Useful Commands

Generate JWT secret:
```bash
openssl rand -base64 32
```

Test locally with production build:
```bash
npm run build
cd server
NODE_ENV=production npm start
```

Check Railway logs:
```bash
railway logs
```

## Support

- Railway Docs: https://docs.railway.app
- Railway Discord: https://discord.gg/railway
- Prisma Docs: https://www.prisma.io/docs
