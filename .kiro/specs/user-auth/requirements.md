# User Authentication & Exam History - Requirements

## Goal
Add simple user authentication to enable exam history tracking and personalized features.

## Approach
- **Phase 1**: Simple email/password signup (MVP)
- **Phase 2**: Add Google OAuth later

## User Stories

### US-1: User Signup
**As a** student  
**I want to** create an account with email and password  
**So that** I can track my exam history

**Acceptance Criteria:**
- Simple signup form (name, email, password)
- Password validation (min 8 characters)
- Email validation
- Account created in database
- Auto-login after signup

### US-2: User Login
**As a** returning student  
**I want to** log in with my credentials  
**So that** I can access my exam history

**Acceptance Criteria:**
- Login form (email, password)
- Secure password verification
- Session/token management
- Remember me option

### US-3: Exam History
**As a** logged-in student  
**I want to** see all my past exams  
**So that** I can track my progress

**Acceptance Criteria:**
- List of all graded exams
- Show date, subject, score
- Click to view full details
- Sort by date (newest first)

### US-4: Progress Dashboard
**As a** student  
**I want to** see my progress over time  
**So that** I can understand my improvement

**Acceptance Criteria:**
- Average score by subject
- Score trend over time (chart)
- Most recent exams
- Total exams graded

## Database Schema Updates

```prisma
model User {
  id            String   @id @default(uuid())
  name          String
  email         String   @unique
  passwordHash  String
  
  // Profile
  grade         String?  // "Grade 9", "Grade 10", etc.
  school        String?
  
  // Metadata
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
  lastLoginAt   DateTime?
  
  // Relations
  gradings      Grading[]
  
  @@index([email])
}

// Update Grading model
model Grading {
  // ... existing fields ...
  
  // Add user relation
  userId        String?
  user          User?    @relation(fields: [userId], references: [id])
  
  @@index([userId])
  @@index([userId, createdAt])
}
```

## API Endpoints

### Authentication
```typescript
POST /api/auth/signup
Request: { name, email, password }
Response: { user, token }

POST /api/auth/login
Request: { email, password }
Response: { user, token }

POST /api/auth/logout
Request: { token }
Response: { success }

GET /api/auth/me
Headers: Authorization: Bearer <token>
Response: { user }
```

### Exam History
```typescript
GET /api/exams/history
Headers: Authorization: Bearer <token>
Query: ?limit=20&offset=0
Response: {
  exams: [
    {
      id, date, subject, language, totalScore,
      questionPaperId, mode
    }
  ],
  total, hasMore
}

GET /api/exams/:id
Headers: Authorization: Bearer <token>
Response: { full grading details }

GET /api/exams/stats
Headers: Authorization: Bearer <token>
Response: {
  totalExams,
  averageScore,
  bySubject: { Math: { count, avgScore }, ... },
  recentExams: [...]
}
```

## Implementation Plan

### Day 1: Database & Auth Backend
- Update Prisma schema
- Run migrations
- Install bcrypt for password hashing
- Install jsonwebtoken for JWT
- Create auth service
- Create auth endpoints

### Day 2: Frontend Auth UI
- Signup page
- Login page
- Auth context/state management
- Protected routes
- Token storage (localStorage)

### Day 3: Exam History Backend
- Update grading endpoint to save userId
- Create history endpoints
- Create stats endpoint

### Day 4: Exam History Frontend
- History page
- Exam list component
- Stats dashboard
- View exam details

### Day 5: Integration & Polish
- Connect all pieces
- Error handling
- Loading states
- Testing

## Security Considerations

1. **Password Security**
   - Hash with bcrypt (10 rounds)
   - Never store plain text
   - Validate strength

2. **JWT Tokens**
   - Sign with secret key
   - Expire after 7 days
   - Refresh token mechanism (future)

3. **API Protection**
   - Verify token on protected routes
   - Check user owns the resource
   - Rate limiting (future)

## UI Flow

### New User Flow
```
1. Land on home page
2. Click "Grade Exam"
3. See: "Sign up to track your progress"
4. Click "Sign Up"
5. Fill form (name, email, password)
6. Submit → Auto-login
7. Upload and grade exam
8. Exam saved to history
```

### Returning User Flow
```
1. Land on home page
2. Click "Login"
3. Enter credentials
4. See dashboard with history
5. Click "Grade New Exam" or view past exams
```

## Success Metrics

- ✅ Users can sign up in < 30 seconds
- ✅ Users can log in successfully
- ✅ Exam history shows all past exams
- ✅ Stats dashboard shows progress
- ✅ No security vulnerabilities

## Future Enhancements (Phase 2)

- Google OAuth
- Password reset
- Email verification
- Profile editing
- Delete account
- Export history
