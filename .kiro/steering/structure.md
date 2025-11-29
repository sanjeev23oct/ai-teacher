# Project Structure

Monorepo with separate client and server directories.

## Client (`client/`)
```
client/
├── src/
│   ├── components/      # Reusable React components
│   │   ├── ExamUpload.tsx
│   │   ├── GradingResult.tsx
│   │   ├── Layout.tsx
│   │   ├── Navigation.tsx
│   │   └── VoiceChat.tsx
│   ├── pages/           # Route-level page components
│   │   ├── GradeExamPage.tsx
│   │   └── VoiceTutorPage.tsx
│   ├── assets/          # Static assets (images, icons)
│   ├── App.tsx          # Main app with routing
│   ├── main.tsx         # Entry point
│   ├── App.css          # Component styles
│   └── index.css        # Global styles + Tailwind directives
├── public/              # Public static files
├── index.html           # HTML template
├── vite.config.ts       # Vite configuration
├── tailwind.config.js   # Tailwind theme customization
├── tsconfig.json        # TypeScript configuration
└── eslint.config.js     # ESLint configuration
```

## Server (`server/`)
```
server/
├── index.ts             # Express server with API routes
├── uploads/             # Temporary file storage for exam uploads
├── .env                 # Environment variables (Ollama URL, port)
├── package.json         # Dependencies and scripts
└── tsconfig.json        # TypeScript configuration
```

## Key Patterns

### Component Organization
- **Pages**: Top-level route components in `pages/`
- **Components**: Reusable UI components in `components/`
- **Layout**: Shared layout wrapper with navigation

### Styling Conventions
- Tailwind utility classes for all styling
- Custom color palette defined in `tailwind.config.js`:
  - `background`: #0f0f13 (dark base)
  - `surface`: #1a1a23 (elevated surfaces)
  - `primary`: #2563eb (blue accent)
- Custom `.btn-primary` class for consistent button styling
- Dark theme throughout

### API Routes
- `POST /api/grade`: Upload and grade exam papers
- `POST /api/chat`: Chat with AI tutor

### TypeScript
- Strict typing enabled
- Interface definitions for component props
- Type safety for API responses
