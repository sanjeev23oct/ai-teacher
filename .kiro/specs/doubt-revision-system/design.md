# Design Document

## Overview

The Doubt Revision System enhances the existing doubt solver with multi-question navigation, revision management, rating capabilities, and dashboard integration. This system allows students to efficiently work through worksheets, save important doubts for later review, provide feedback on AI explanations, and access their learning history from the dashboard.

## Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        Frontend (React)                      │
├──────────────┬──────────────┬──────────────┬────────────────┤
│  Dashboard   │  Doubt Page  │ Explanation  │ Revision Area  │
│  Component   │  (Upload)    │    Page      │     Page       │
└──────┬───────┴──────┬───────┴──────┬───────┴────────┬───────┘
       │              │               │                 │
       └──────────────┴───────────────┴─────────────────┘
                              │
                    ┌─────────▼──────────┐
                    │   API Layer        │
                    │  (Express Routes)  │
                    └─────────┬──────────┘
                              │
       ┌──────────────────────┼──────────────────────┐
       │                      │                      │
┌──────▼──────┐    ┌─────────▼────────┐   ┌────────▼────────┐
│  Worksheet  │    │    Revision      │   │     Rating      │
│   Service   │    │    Service       │   │    Service      │
└──────┬──────┘    └─────────┬────────┘   └────────┬────────┘
       │                     │                      │
       └─────────────────────┴──────────────────────┘
                              │
                    ┌─────────▼──────────┐
                    │   Database Layer   │
                    │    (Prisma ORM)    │
                    └────────────────────┘
```

### Component Interaction Flow

1. **Worksheet Upload**: Student uploads image → System detects questions → Creates worksheet session
2. **Navigation**: Student clicks Next/Skip → System generates/retrieves explanation → Updates UI
3. **Revision**: Student clicks "Add to Revision" → System updates DB → Button state changes
4. **Rating**: Student selects stars → System saves rating → Confirmation shown
5. **Dashboard**: Page loads → System fetches recent doubts → Displays with ratings

## Components and Interfaces

### Frontend Components

#### 1. WorksheetNavigator Component
```typescript
interface WorksheetNavigatorProps {
  worksheetId: string;
  currentQuestionNumber: number;
  totalQuestions: number;
  onNext: () => void;
  onSkip: () => void;
  onComplete: () => void;
}
```

**Responsibilities:**
- Display current question number and total
- Provide Next and Skip buttons
- Handle navigation logic
- Show completion message when done

#### 2. RevisionButton Component
```typescript
interface RevisionButtonProps {
  doubtId: string;
  isInRevision: boolean;
  onToggle: (doubtId: string) => Promise<void>;
}
```

**Responsibilities:**
- Display "Add to Revision" or "Added ✓" state
- Handle toggle action
- Show loading state during API call
- Update UI optimistically

#### 3. RatingWidget Component
```typescript
interface RatingWidgetProps {
  doubtId: string;
  currentRating?: number;
  onRate: (rating: number) => Promise<void>;
}
```

**Responsibilities:**
- Display 1-5 star interface
- Highlight current rating
- Handle rating submission
- Show confirmation message

#### 4. DashboardDoubtCard Component
```typescript
interface DashboardDoubtCardProps {
  doubt: {
    id: string;
    questionText: string;
    subject: string;
    createdAt: Date;
    rating?: number;
    isInRevision: boolean;
  };
  onClick: (doubtId: string) => void;
}
```

**Responsibilities:**
- Display doubt summary
- Show rating stars
- Show revision badge
- Handle click navigation

#### 5. RevisionAreaPage Component
```typescript
interface RevisionAreaPageProps {
  userId: string;
}
```

**Responsibilities:**
- Fetch and display revision doubts
- Group by subject
- Provide search/filter
- Handle removal from revision

### Backend Services

#### 1. WorksheetService
```typescript
interface WorksheetService {
  createWorksheet(imageBuffer: Buffer, userId: string): Promise<Worksheet>;
  detectQuestions(imageBuffer: Buffer): Promise<number>;
  getNextQuestion(worksheetId: string, currentNumber: number): Promise<Question>;
  cacheExplanation(worksheetId: string, questionNumber: number, explanation: any): Promise<void>;
  getWorksheetProgress(worksheetId: string): Promise<WorksheetProgress>;
}
```

#### 2. RevisionService
```typescript
interface RevisionService {
  addToRevision(userId: string, doubtId: string): Promise<void>;
  removeFromRevision(userId: string, doubtId: string): Promise<void>;
  getRevisionDoubts(userId: string, filters?: RevisionFilters): Promise<Doubt[]>;
  isInRevision(userId: string, doubtId: string): Promise<boolean>;
}
```

#### 3. RatingService
```typescript
interface RatingService {
  rateDoubt(userId: string, doubtId: string, rating: number): Promise<void>;
  getRating(userId: string, doubtId: string): Promise<number | null>;
  getAverageRatingBySubject(userId: string): Promise<SubjectRatings>;
  getRatingAnalytics(userId: string): Promise<RatingAnalytics>;
}
```

#### 4. DashboardService
```typescript
interface DashboardService {
  getRecentDoubts(userId: string, limit: number): Promise<Doubt[]>;
  getRevisionCount(userId: string): Promise<number>;
  getDoubtStats(userId: string): Promise<DoubtStats>;
}
```

## Data Models

### Database Schema Updates

#### New Table: Worksheet
```prisma
model Worksheet {
  id              String   @id @default(uuid())
  userId          String?
  user            User?    @relation(fields: [userId], references: [id])
  
  // Image
  imageUrl        String
  imageHash       String   @unique
  
  // Questions
  totalQuestions  Int
  currentQuestion Int      @default(1)
  
  // Session
  sessionId       String   @unique
  expiresAt       DateTime
  
  // Relations
  questions       WorksheetQuestion[]
  
  // Metadata
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  
  @@index([userId])
  @@index([sessionId])
  @@index([imageHash])
}
```

#### New Table: WorksheetQuestion
```prisma
model WorksheetQuestion {
  id              String    @id @default(uuid())
  worksheetId     String
  worksheet       Worksheet @relation(fields: [worksheetId], references: [id], onDelete: Cascade)
  
  questionNumber  Int
  doubtId         String?   // Linked to Doubt if explanation generated
  doubt           Doubt?    @relation(fields: [doubtId], references: [id])
  
  // Status
  status          String    // 'pending' | 'explained' | 'skipped'
  
  // Cached explanation (JSON)
  cachedExplanation String? @db.Text
  
  createdAt       DateTime  @default(now())
  
  @@unique([worksheetId, questionNumber])
  @@index([worksheetId])
}
```

#### Updated Table: Doubt (add revision and rating)
```prisma
model Doubt {
  // ... existing fields ...
  
  // NEW: Revision
  isInRevision    Boolean  @default(false)
  addedToRevisionAt DateTime?
  
  // NEW: Worksheet relation
  worksheetQuestions WorksheetQuestion[]
  
  // NEW: Rating relation
  rating          DoubtRating?
  
  // ... existing indexes ...
  @@index([userId, isInRevision])
}
```

#### New Table: DoubtRating
```prisma
model DoubtRating {
  id              String   @id @default(uuid())
  doubtId         String   @unique
  doubt           Doubt    @relation(fields: [doubtId], references: [id], onDelete: Cascade)
  userId          String
  user            User     @relation(fields: [userId], references: [id])
  
  // Rating
  rating          Int      // 1-5
  
  // Metadata
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  
  @@unique([userId, doubtId])
  @@index([userId])
  @@index([rating])
}
```

### API Endpoints

#### Worksheet Endpoints
```
POST   /api/worksheets/create
  Body: { image: File, userId: string }
  Response: { worksheetId, sessionId, totalQuestions }

GET    /api/worksheets/:worksheetId/question/:number
  Response: { question, explanation, hasNext, hasPrevious }

POST   /api/worksheets/:worksheetId/skip/:number
  Response: { success, nextQuestion }

GET    /api/worksheets/:worksheetId/progress
  Response: { current, total, completed, skipped }
```

#### Revision Endpoints
```
POST   /api/revision/add
  Body: { userId, doubtId }
  Response: { success }

DELETE /api/revision/remove/:doubtId
  Response: { success }

GET    /api/revision/list
  Query: { userId, subject?, search? }
  Response: { doubts: Doubt[] }

GET    /api/revision/check/:doubtId
  Response: { isInRevision: boolean }
```

#### Rating Endpoints
```
POST   /api/ratings/rate
  Body: { userId, doubtId, rating: 1-5 }
  Response: { success }

GET    /api/ratings/:doubtId
  Response: { rating: number | null }

GET    /api/ratings/analytics
  Query: { userId }
  Response: { averageBySubject, distribution, trends }
```

#### Dashboard Endpoints
```
GET    /api/dashboard/recent-doubts
  Query: { userId, limit }
  Response: { doubts: Doubt[] }

GET    /api/dashboard/stats
  Query: { userId }
  Response: { totalDoubts, revisionCount, averageRating }
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Worksheet Question Sequence Integrity
*For any* worksheet with N questions, navigating through all questions using Next/Skip should visit exactly N questions without duplicates or skips.
**Validates: Requirements 1.1, 1.3, 1.4**

### Property 2: Revision State Consistency
*For any* doubt marked for revision, querying the revision status should return true, and the doubt should appear in the revision list.
**Validates: Requirements 2.2, 2.3, 2.4**

### Property 3: Rating Idempotence
*For any* doubt, submitting multiple ratings should result in only the most recent rating being stored (update, not insert).
**Validates: Requirements 3.5**

### Property 4: Dashboard Recent Doubts Ordering
*For any* user's doubt history, the dashboard should display doubts in descending chronological order (most recent first).
**Validates: Requirements 4.1, 4.2**

### Property 5: Worksheet Session Expiry
*For any* worksheet session, accessing it after expiry time should either restore from cache or require re-upload.
**Validates: Requirements 6.5**

### Property 6: Revision Removal Consistency
*For any* doubt removed from revision, the revision status should be false and it should not appear in the revision list.
**Validates: Requirements 2.5, 7.5**

### Property 7: Rating Range Validation
*For any* rating submission, the system should only accept values between 1 and 5 inclusive.
**Validates: Requirements 3.1**

### Property 8: Question Context Preservation
*For any* worksheet, navigating to a previously visited question should return the cached explanation without regenerating.
**Validates: Requirements 6.3**

## Error Handling

### Worksheet Errors
- **Question Detection Failure**: Return error with message "Unable to detect questions in image"
- **Invalid Question Number**: Return 404 with "Question not found"
- **Session Expired**: Return 410 with "Worksheet session expired"
- **Image Processing Error**: Return 500 with "Failed to process image"

### Revision Errors
- **Doubt Not Found**: Return 404 with "Doubt not found"
- **Already in Revision**: Return 200 (idempotent operation)
- **Database Error**: Return 500 with "Failed to update revision status"

### Rating Errors
- **Invalid Rating Value**: Return 400 with "Rating must be between 1 and 5"
- **Doubt Not Found**: Return 404 with "Doubt not found"
- **Unauthorized**: Return 401 with "User not authorized"

### Dashboard Errors
- **No Doubts Found**: Return empty array (not an error)
- **Database Error**: Return 500 with "Failed to fetch dashboard data"

## Testing Strategy

### Unit Tests
- Test worksheet question detection logic
- Test revision toggle functionality
- Test rating validation (1-5 range)
- Test dashboard data aggregation
- Test session expiry logic

### Integration Tests
- Test complete worksheet navigation flow
- Test revision add/remove/list cycle
- Test rating submission and retrieval
- Test dashboard with various data states

### Property-Based Tests
- Property 1: Generate random worksheets, verify sequence integrity
- Property 2: Generate random revision operations, verify consistency
- Property 3: Generate multiple ratings for same doubt, verify only one exists
- Property 4: Generate random doubts with timestamps, verify ordering
- Property 7: Generate random numbers, verify only 1-5 accepted

### UI Tests
- Test Next/Skip button states
- Test revision button toggle animation
- Test star rating interaction
- Test dashboard card navigation

## Performance Considerations

### Caching Strategy
- Cache worksheet explanations in database
- Cache revision status in memory (Redis optional)
- Cache dashboard stats for 5 minutes
- Use optimistic UI updates for better UX

### Database Optimization
- Index on (userId, isInRevision) for fast revision queries
- Index on (userId, createdAt) for dashboard queries
- Index on worksheetId for question lookups
- Use database connection pooling

### Image Processing
- Reuse existing image from worksheet for all questions
- Store image hash to prevent duplicate uploads
- Compress images before storage
- Use CDN for image delivery (future)

## Security Considerations

- Validate user ownership before allowing revision/rating operations
- Sanitize all user inputs (question text, ratings)
- Rate limit API endpoints (max 100 requests/minute per user)
- Validate image file types and sizes
- Use parameterized queries to prevent SQL injection
- Implement CSRF protection for state-changing operations

## Future Enhancements

1. **Spaced Repetition**: Schedule revision reminders based on forgetting curve
2. **Collaborative Revision**: Share revision collections with classmates
3. **Export to PDF**: Export revision doubts as study material
4. **Voice Notes**: Add voice notes to revision doubts
5. **Tags**: Allow custom tags for better organization
6. **Analytics Dashboard**: Detailed insights into learning patterns
