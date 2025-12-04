# User Authentication Setup

## Overview
The AI Teacher platform now includes user authentication to track exam history and progress.

## Features Implemented

### Backend
- **Auth Service** (`server/services/authService.ts`)
  - User signup with email/password
  - Login with JWT token generation
  - Password hashing with bcrypt (10 rounds)
  - Token verification

- **Auth Middleware** (`server/middleware/auth.ts`)
  - JWT token validation
  - Optional auth for public endpoints
  - User context injection

- **API Endpoints**
  - `POST /api/auth/signup` - Create new account
  - `POST /api/auth/login` - Login with credentials
  - `GET /api/auth/me` - Get current user info
  - `POST /api/auth/logout` - Logout (client-side token removal)
  - `GET /api/exams/history` - Get user's exam history
  - `GET /api/exams/:id` - Get specific exam details
  - `GET /api/exams/stats` - Get user statistics

### Frontend
- **Auth Context** (`client/src/contexts/AuthContext.tsx`)
  - Global auth state management
  - Token storage in localStorage
  - Auto-login on page load

- **Pages**
  - `SignupPage` - User registration
  - `LoginPage` - User login
  - `HistoryPage` - Exam history with stats
  - `ExamDetailPage` - Individual exam details

- **Navigation**
  - Login/Signup buttons for guests
  - User dropdown with logout for logged-in users
  - History link for authenticated users

## Database Schema

### User Model
```prisma
model User {
  id            String   @id @default(uuid())
  name          String
  email         String   @unique
  passwordHash  String
  grade         String?
  school        String?
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
  lastLoginAt   DateTime?
  gradings      Grading[]
}
```

### Updated Grading Model
```prisma
model Grading {
  // ... existing fields ...
  userId        String?
  user          User?    @relation(fields: [userId], references: [id])
}
```

## Environment Variables

Add to `server/.env`:
```
JWT_SECRET=your-super-secret-jwt-key-change-in-production
```

## Usage Flow

### New User
1. Visit `/signup`
2. Enter name, email, password (optional: grade, school)
3. Auto-login after signup
4. Grade exams (saved to history)
5. View history at `/history`

### Returning User
1. Visit `/login`
2. Enter email and password
3. Access exam history
4. View detailed results
5. Grade new exams

### Guest User
- Can still grade exams
- Results not saved to history
- Prompted to sign up for tracking

## Security Features

- Passwords hashed with bcrypt (10 rounds)
- JWT tokens expire after 7 days
- Protected API routes require valid token
- User can only access their own data

## Testing

1. Start the server: `cd server && npm run dev`
2. Start the client: `cd client && npm run dev`
3. Visit `http://localhost:5173`
4. Click "Sign Up" and create an account
5. Grade an exam
6. Check history at `/history`

## Future Enhancements

- Google OAuth integration
- Password reset via email
- Email verification
- Profile editing
- Account deletion
- Session management
- Refresh tokens
