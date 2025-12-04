# AI Teacher - Educational Platform

AI-powered educational platform with exam grading and doubt-solving capabilities using Gemini AI.

## Features

- 📝 **Exam Grading**: Upload handwritten exam papers for instant AI-powered grading
- 🤔 **Doubt Solver**: Upload question images or type questions for step-by-step explanations
- 📊 **History Tracking**: View past exams and doubts
- 🔐 **User Authentication**: Secure signup and login
- 🎯 **Multi-page Support**: Grade multi-page exam papers
- 💬 **Interactive Chat**: Follow-up conversations on doubts

## Tech Stack

### Frontend
- React 19 with TypeScript
- Vite 7
- React Router DOM v7
- Tailwind CSS
- Lucide React (icons)

### Backend
- Node.js with TypeScript
- Express 5
- Prisma ORM
- PostgreSQL
- Google Gemini AI
- JWT Authentication

## Local Development

### Prerequisites

- Node.js 18+ and npm
- PostgreSQL database
- Gemini API key (get from https://makersuite.google.com/app/apikey)

### Setup

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd ai-teacher
   ```

2. **Install dependencies**
   ```bash
   # Install server dependencies
   cd server
   npm install

   # Install client dependencies
   cd ../client
   npm install
   ```

3. **Set up database**
   ```bash
   cd server
   # Copy environment file
   cp .env.example .env
   
   # Edit .env and add your database URL and API keys
   
   # Run migrations
   npx prisma migrate dev
   npx prisma generate
   ```

4. **Configure environment variables**
   
   Edit `server/.env`:
   ```env
   AI_PROVIDER=gemini
   GEMINI_API_KEY=your-gemini-api-key
   DATABASE_URL=postgresql://user:password@localhost:5432/ai_teacher_db
   JWT_SECRET=your-secret-key
   PORT=3001
   ```

5. **Start development servers**
   ```bash
   # Terminal 1 - Start backend
   cd server
   npm run dev

   # Terminal 2 - Start frontend
   cd client
   npm run dev
   ```

6. **Access the application**
   - Frontend: http://localhost:5173
   - Backend: http://localhost:3001

## Deployment to Railway

This project is configured for **single-service deployment** where both React frontend and Express backend run as one unified application on a single URL.

### Quick Deploy

1. **Push to GitHub**
   ```bash
   git add .
   git commit -m "Ready for deployment"
   git push origin main
   ```

2. **Create Railway Project**
   - Go to [railway.app](https://railway.app)
   - Click "New Project" → "Deploy from GitHub repo"
   - Select your repository
   - Add PostgreSQL database (+ New → Database → PostgreSQL)

3. **Set Environment Variables**
   ```
   NODE_ENV=production
   JWT_SECRET=<generate with: openssl rand -base64 32>
   AI_PROVIDER=gemini
   GEMINI_API_KEY=<your-gemini-api-key>
   ```

4. **Deploy!**
   - Railway auto-deploys on push
   - Access your app at the provided URL (e.g., `https://your-app.railway.app`)

### Detailed Guides

- 📖 [Complete Deployment Guide](./RAILWAY_DEPLOYMENT.md)
- ✅ [Step-by-Step Checklist](./DEPLOYMENT_CHECKLIST.md)
- 📋 [Configuration Summary](./DEPLOYMENT_SUMMARY.md)

### Test Production Build Locally

```bash
# Build and test before deploying
./test-production-build.sh

# Start in production mode
cd server
NODE_ENV=production npm start

# Visit http://localhost:3001
```

### Key Files for Deployment

- `package.json` - Root build scripts
- `nixpacks.toml` - Railway build configuration
- `railway.json` - Railway deployment settings
- `.env.example` - Environment variables template

## Project Structure

```
ai-teacher/
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/    # Reusable components
│   │   ├── pages/         # Page components
│   │   ├── contexts/      # React contexts
│   │   └── config.ts      # API configuration
│   └── package.json
├── server/                # Express backend
│   ├── services/         # Business logic
│   ├── middleware/       # Express middleware
│   ├── prisma/          # Database schema
│   ├── prompts/         # AI prompts
│   └── package.json
├── RAILWAY_DEPLOYMENT.md  # Deployment guide
└── DEPLOYMENT_CHECKLIST.md # Deployment checklist
```

## Environment Variables

### Backend (`server/.env`)

| Variable | Description | Required |
|----------|-------------|----------|
| `AI_PROVIDER` | AI provider (gemini/lmstudio/ollama) | Yes |
| `GEMINI_API_KEY` | Google Gemini API key | Yes |
| `DATABASE_URL` | PostgreSQL connection string | Yes |
| `JWT_SECRET` | Secret for JWT tokens | Yes |
| `PORT` | Server port (default: 3001) | No |
| `ELEVENLABS_API_KEY` | ElevenLabs TTS API key | No |

### Frontend (`client/.env`)

| Variable | Description | Required |
|----------|-------------|----------|
| `VITE_API_URL` | Backend API URL | Yes |

## API Endpoints

### Authentication
- `POST /api/auth/signup` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user

### Exam Grading
- `POST /api/grade` - Grade single exam
- `POST /api/grade/multi-page` - Grade multi-page exam
- `GET /api/exams/history` - Get exam history
- `GET /api/exams/stats` - Get user statistics
- `GET /api/exams/:id` - Get exam details
- `DELETE /api/exams/:id` - Delete exam

### Doubts
- `POST /api/doubts/explain` - Get explanation for question
- `GET /api/doubts/history` - Get doubts history
- `GET /api/doubts/:id` - Get doubt details
- `POST /api/doubts/:id/favorite` - Toggle favorite
- `POST /api/doubts/chat` - Chat about doubt

### Voice/TTS
- `POST /api/tts` - Text-to-speech conversion
- `POST /api/voice/chat` - Voice chat

## Database Schema

The application uses Prisma ORM with PostgreSQL. Main models:

- `User` - User accounts
- `Exam` - Graded exams
- `Doubt` - Student questions
- `Conversation` - Chat history

See `server/prisma/schema.prisma` for full schema.

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the ISC License.

## Support

For issues and questions:
- Create an issue in the GitHub repository
- Check the deployment guides for common problems

## Acknowledgments

- Google Gemini AI for vision and language capabilities
- Railway for hosting platform
- Prisma for database ORM
- React and Vite for frontend framework
