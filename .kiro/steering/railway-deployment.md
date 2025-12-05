# Railway Deployment Configuration

## Deployment Architecture

This project deploys as a **single unified service** on Railway:
- Express server serves both API endpoints and static React files
- Single URL for the entire application
- PostgreSQL database as a separate Railway service
- Automatic deployments on git push

## Configuration Files

### Primary Files
- **`Dockerfile`** - Multi-stage Docker build (RECOMMENDED)
- **`railway.json`** - Railway project configuration
- **`railway.toml`** - Service deployment settings
- **`nixpacks.toml`** - Alternative Nixpacks build config
- **`.dockerignore`** - Files excluded from Docker build

### Build Strategy
Railway uses **Dockerfile** by default (specified in railway.json):
1. Install dependencies for client and server
2. Build React frontend → `client/dist/`
3. Generate Prisma client
4. Copy built files to production image
5. Start Express server with `npm start`

## Required Environment Variables

Set these in Railway dashboard under "Variables":

### Essential
```bash
NODE_ENV=production
DATABASE_URL=<auto-set-by-railway-postgres>
JWT_SECRET=<generate-with-openssl-rand-base64-32>
AI_PROVIDER=gemini
GEMINI_API_KEY=<your-gemini-api-key>
```

### Optional
```bash
PORT=3001  # Auto-set by Railway
ELEVENLABS_API_KEY=<for-text-to-speech>
GROQ_API_KEY=<alternative-ai-provider>
```

## Railway CLI Quick Commands

### Setup
```bash
railway login                    # Login to Railway
railway init                     # Initialize project
railway add --database postgresql # Add PostgreSQL
railway variables set KEY=value  # Set environment variable
railway up                       # Deploy
railway domain --generate        # Generate public URL
```

### Monitoring
```bash
railway logs                     # View logs
railway logs --follow            # Stream logs
railway status                   # Check deployment status
railway open                     # Open dashboard
```

### Management
```bash
railway variables                # List all variables
railway domain                   # View current domain
railway connect postgres         # Connect to database
railway down                     # Stop service
```

## Deployment Workflow

### Initial Setup
1. Create Railway project from GitHub repo
2. Add PostgreSQL database (auto-links DATABASE_URL)
3. Set required environment variables
4. Railway auto-deploys on detection

### Continuous Deployment
```bash
git add .
git commit -m "Your changes"
git push origin main
# Railway automatically rebuilds and deploys
```

## Build Process Details

### Dockerfile Stages
1. **base** - Node 20 Alpine with OpenSSL
2. **dependencies** - Install all npm packages
3. **build-client** - Build React app with Vite
4. **build-server** - Generate Prisma client
5. **production** - Final lightweight image

### Build Time
- First build: 3-5 minutes
- Subsequent builds: 2-3 minutes (with caching)

## Database Migrations

Migrations run automatically during build:
- Prisma generates client
- Migrations applied on container start
- Schema defined in `server/prisma/schema.prisma`

## Health Checks

Railway monitors:
- **Path**: `/` (homepage)
- **Timeout**: 300 seconds
- **Restart Policy**: ON_FAILURE (max 10 retries)

## Port Configuration

- Railway auto-assigns PORT environment variable
- Server listens on `process.env.PORT || 3001`
- No manual port configuration needed

## Static File Serving

In production (`NODE_ENV=production`):
- Express serves `client/dist/` as static files
- API routes: `/api/*` and `/uploads/*`
- All other routes: Return `index.html` (React Router)

## Troubleshooting

### Build Fails
- Check Railway logs for specific errors
- Verify Dockerfile syntax
- Ensure all dependencies in package.json

### Database Connection Issues
- Verify DATABASE_URL is set
- Check PostgreSQL service is running
- Ensure migrations completed successfully

### Container Won't Start
- Check environment variables are set
- Verify PORT is not hardcoded
- Review startup logs for errors

### 404 Errors
- Ensure NODE_ENV=production is set
- Verify React build completed
- Check catch-all route in server/index.ts

## Cost Optimization

### Hobby Plan (~$10-15/month)
- Single service deployment (not separate frontend/backend)
- PostgreSQL database on hobby tier
- Automatic sleep after inactivity (can disable)
- Pay for actual usage

### Tips
- Use Dockerfile for faster builds (better caching)
- Monitor usage in Railway dashboard
- Set resource limits if needed

## Security

### Best Practices
- Never commit secrets to git
- Use Railway environment variables
- Rotate JWT_SECRET periodically
- Keep dependencies updated
- Use strong API keys

### Automatic Features
- HTTPS enabled by default
- DDoS protection included
- Automatic SSL certificates
- Secure environment variable storage

## Custom Domain

```bash
# Add custom domain
railway domain add yourdomain.com

# DNS Configuration
# Add CNAME record:
# CNAME @ your-app.railway.app
```

## Monitoring & Logs

### View Logs
```bash
railway logs --tail 100          # Last 100 lines
railway logs --follow            # Stream logs
railway logs --deployment <id>  # Specific deployment
```

### Metrics
- CPU usage
- Memory usage
- Network traffic
- Request count
- Response times

Access via Railway dashboard → Metrics tab

## Rollback

```bash
# View deployments
railway status

# Rollback to previous deployment
railway rollback <deployment-id>
```

## Multiple Environments

```bash
# Create staging environment
railway environment create staging

# Switch environments
railway environment use staging

# Deploy to specific environment
railway up --environment staging
```

## Automation Scripts

### `railway-setup.sh`
One-click setup script that:
- Installs Railway CLI
- Logs in to Railway
- Initializes project
- Adds PostgreSQL
- Sets environment variables
- Deploys application

Usage:
```bash
chmod +x railway-setup.sh
./railway-setup.sh
```

## Template Deployment

Use `railway-template.json` for one-click deploys:
- Pre-configured services
- Auto-linked database
- Required environment variables defined
- Instant deployment

## Support Resources

- Railway Docs: https://docs.railway.app
- Railway CLI: https://docs.railway.app/develop/cli
- Railway Discord: https://discord.gg/railway
- Project Issues: GitHub repository

## Quick Reference

### First Time Deploy
```bash
railway login
railway init
railway add --database postgresql
railway variables set JWT_SECRET=$(openssl rand -base64 32)
railway variables set AI_PROVIDER=gemini
railway variables set GEMINI_API_KEY=your-key
railway variables set NODE_ENV=production
railway up
railway domain --generate
```

### Update Deployment
```bash
git push origin main
railway logs --follow
```

### Check Status
```bash
railway status
railway domain
railway variables
```
