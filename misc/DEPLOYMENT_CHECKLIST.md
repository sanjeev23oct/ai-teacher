# Railway Deployment Checklist

Use this checklist to ensure a smooth deployment to Railway.

## Pre-Deployment

- [ ] All code is committed to Git
- [ ] `.env` file is NOT committed (check .gitignore)
- [ ] Database schema is finalized
- [ ] All dependencies are in package.json files
- [ ] API endpoints are tested locally
- [ ] Frontend connects to backend successfully locally

## Railway Setup

- [ ] Created Railway account at https://railway.app
- [ ] Connected GitHub account to Railway
- [ ] Repository is pushed to GitHub

## Database Setup

- [ ] Added PostgreSQL database in Railway
- [ ] Database is running (check Railway dashboard)
- [ ] Note the database connection string

## Backend Deployment

- [ ] Created new service from GitHub repo
- [ ] Set root directory to `server`
- [ ] Added all environment variables:
  - [ ] `AI_PROVIDER=gemini`
  - [ ] `GEMINI_API_KEY=your-actual-key`
  - [ ] `DATABASE_URL=${{Postgres.DATABASE_URL}}`
  - [ ] `JWT_SECRET=strong-random-string`
  - [ ] `PORT=${{PORT}}`
  - [ ] `ELEVENLABS_API_KEY=your-key` (optional)
- [ ] Build completed successfully
- [ ] Service is running (green status)
- [ ] Copied backend URL (e.g., `https://xxx.railway.app`)

## Frontend Deployment

- [ ] Created new service from GitHub repo (same repo, different service)
- [ ] Set root directory to `client`
- [ ] Added environment variable:
  - [ ] `VITE_API_URL=https://your-backend-url.railway.app`
- [ ] Build completed successfully
- [ ] Service is running (green status)
- [ ] Copied frontend URL

## CORS Configuration

- [ ] Updated backend CORS to include frontend Railway URL
- [ ] Redeployed backend after CORS update
- [ ] Tested cross-origin requests

## Database Migration

- [ ] Prisma migrations ran successfully during build
- [ ] Check backend logs for migration success
- [ ] Database tables are created

## Testing

- [ ] Frontend loads successfully
- [ ] Can sign up / log in
- [ ] Can upload exam images
- [ ] Can ask doubts
- [ ] Can view history
- [ ] All API calls work
- [ ] No CORS errors in browser console

## Post-Deployment

- [ ] Monitored logs for errors
- [ ] Tested all major features
- [ ] Checked Railway usage dashboard
- [ ] Documented deployment URLs
- [ ] Updated README with live URLs

## Optional Enhancements

- [ ] Set up custom domain
- [ ] Configure monitoring/alerts
- [ ] Set up error tracking (Sentry)
- [ ] Implement rate limiting
- [ ] Add database backups
- [ ] Set up CI/CD pipeline

## Troubleshooting

If something goes wrong:

1. **Check Logs**: Railway dashboard → Service → Logs
2. **Verify Environment Variables**: Settings → Variables
3. **Check Build Logs**: Deployments → Click on deployment → Build logs
4. **Database Connection**: Ensure DATABASE_URL is correct
5. **CORS Issues**: Add frontend URL to backend CORS whitelist

## Support Resources

- Railway Docs: https://docs.railway.app
- Railway Discord: https://discord.gg/railway
- Prisma Docs: https://www.prisma.io/docs
- Your GitHub Issues: Create issues for bugs

## Deployment URLs

After deployment, record your URLs here:

- **Frontend**: https://_____.railway.app
- **Backend**: https://_____.railway.app
- **Database**: (internal Railway URL)

## Cost Monitoring

Railway Free Tier:
- $5 credit per month
- 500MB PostgreSQL storage
- Monitor usage at: https://railway.app/account/usage

Current monthly usage: $_____ / $5.00
