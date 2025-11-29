# Tech Stack

## Frontend
- **Framework**: React 19 with TypeScript
- **Build Tool**: Vite 7
- **Routing**: React Router DOM v7
- **Styling**: Tailwind CSS with custom dark theme
- **Icons**: Lucide React
- **Linting**: ESLint 9 with TypeScript ESLint

## Backend
- **Runtime**: Node.js with TypeScript
- **Framework**: Express 5
- **AI Integration**: OpenAI SDK (configured for Ollama)
- **File Uploads**: Multer
- **Environment**: dotenv

## AI/ML
- **Model Server**: Ollama (local)
- **Model**: llava:13b (vision + language)
- **API**: OpenAI-compatible endpoint

## Common Commands

### Client (from `client/` directory)
```bash
npm run dev        # Start development server
npm run build      # Build for production (TypeScript + Vite)
npm run lint       # Run ESLint
npm run preview    # Preview production build
```

### Server (from `server/` directory)
```bash
npm start          # Start server (ts-node)
npm run dev        # Start with auto-reload (nodemon)
```

### Prerequisites
- Ollama must be running locally at `http://localhost:11434`
- Pull the llava:13b model: `ollama pull llava:13b`
- Server runs on port 3001 by default
