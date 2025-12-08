# Database Design for Question Paper Storage

## Problem
Extracting questions from question papers every time is:
- ❌ Slow (adds 5-10 seconds per grading)
- ❌ Expensive (extra AI API calls)
- ❌ Wasteful (same question paper used by multiple students)

## Solution
Store extracted question papers in database:
- ✅ Extract once, reuse many times
- ✅ Fast grading (skip extraction step)
- ✅ Cost-effective (fewer AI calls)
- ✅ Enable batch grading (multiple students, same exam)

## Database Schema

### Tables

```prisma
model QuestionPaper {
  id            String   @id @default(uuid())
  title         String?  // Optional: "Math Final Exam 2024"
  subject       String   // "Mathematics", "Physics", etc.
  gradeLevel    String   // "Grade 9-10"
  language      String   // "English", "Hindi", etc.
  
  // Image storage
  imageUrl      String   // URL or path to stored image
  imageHash     String   @unique // SHA-256 hash for deduplication
  
  // Extracted data
  questions     Question[]
  totalQuestions Int
  
  // Metadata
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
  usageCount    Int      @default(0) // How many times used
  
  // Relations
  gradings      Grading[]
}

model Question {
  id              String   @id @default(uuid())
  questionPaperId String
  questionPaper   QuestionPaper @relation(fields: [questionPaperId], references: [id], onDelete: Cascade)
  
  // Question details
  questionNumber  String   // "1", "2", "3", etc.
  questionText    String   @db.Text
  maxScore        Float?   // Optional: points for this question
  topic           String?  // "Algebra", "Geometry", etc.
  concept         String?  // "Linear Equations", etc.
  
  // Position in image (for annotations)
  position        Json?    // { x: number, y: number }
  
  // Metadata
  createdAt       DateTime @default(now())
  
  @@unique([questionPaperId, questionNumber])
}

model Grading {
  id              String   @id @default(uuid())
  
  // Question paper (optional - null for single image mode)
  questionPaperId String?
  questionPaper   QuestionPaper? @relation(fields: [questionPaperId], references: [id])
  
  // Answer sheet
  answerSheetUrl  String   // URL or path to answer sheet image
  
  // Results
  subject         String
  language        String
  gradeLevel      String
  totalScore      String
  feedback        String   @db.Text
  
  // Matching info (for dual mode)
  matchingInfo    Json?    // { totalQuestions, answeredQuestions, etc. }
  
  // Detailed analysis
  answers         Answer[]
  
  // Metadata
  createdAt       DateTime @default(now())
  
  @@index([questionPaperId])
  @@index([createdAt])
}

model Answer {
  id              String   @id @default(uuid())
  gradingId       String
  grading         Grading  @relation(fields: [gradingId], references: [id], onDelete: Cascade)
  
  // Answer details
  questionNumber  String
  studentAnswer   String?  @db.Text
  correct         Boolean
  score           String
  remarks         String   @db.Text
  
  // Matching info
  matched         Boolean  @default(true)
  matchConfidence Float?   // 0-1
  
  // Position in answer sheet (for annotations)
  position        Json?    // { x: number, y: number }
  
  // Metadata
  createdAt       DateTime @default(now())
  
  @@index([gradingId])
}
```

## Workflows

### Workflow 1: First Time Question Paper Upload

```
1. User uploads question paper + answer sheet
2. Backend calculates image hash of question paper
3. Check database: Does this question paper exist?
   - If YES: Skip to step 7
   - If NO: Continue to step 4
4. AI extracts questions from question paper
5. Store question paper + questions in database
6. Mark as "extracted"
7. AI grades answer sheet against stored questions
8. Store grading results
9. Return results to user
```

### Workflow 2: Reusing Question Paper

```
1. User uploads question paper + answer sheet
2. Backend calculates image hash of question paper
3. Check database: Question paper exists!
4. Load questions from database (instant)
5. AI grades answer sheet against stored questions
6. Store grading results
7. Increment usageCount on question paper
8. Return results to user

Time saved: 5-10 seconds per grading
Cost saved: 1 AI API call per grading
```

### Workflow 3: Manual Question Paper Selection

```
1. User goes to "Grade Exam"
2. System shows: "Recently used question papers"
   - Math Final Exam 2024 (used 15 times)
   - Physics Quiz 3 (used 8 times)
3. User selects existing question paper
4. User uploads only answer sheet
5. AI grades against stored questions
6. Store results
7. Return results

Benefits: Even faster, no question paper upload needed
```

## API Design

### New Endpoints

```typescript
// Upload and extract question paper
POST /api/question-papers/extract
Request:
- questionPaper: File
- title?: string
- subject?: string

Response:
{
  id: "uuid",
  title: "Math Final Exam 2024",
  subject: "Mathematics",
  totalQuestions: 5,
  questions: [
    {
      questionNumber: "1",
      questionText: "Prove Basic Proportionality Theorem",
      maxScore: 5
    }
  ],
  imageHash: "sha256..."
}

// List question papers
GET /api/question-papers
Response:
{
  questionPapers: [
    {
      id: "uuid",
      title: "Math Final Exam 2024",
      subject: "Mathematics",
      totalQuestions: 5,
      usageCount: 15,
      createdAt: "2024-11-29T..."
    }
  ]
}

// Get question paper details
GET /api/question-papers/:id
Response:
{
  id: "uuid",
  title: "Math Final Exam 2024",
  questions: [...],
  usageCount: 15
}

// Grade with existing question paper
POST /api/grade/with-question-paper
Request:
- questionPaperId: string
- answerSheet: File

Response: (same as /api/grade)

// Enhanced grade endpoint (auto-detects existing)
POST /api/grade
Request:
- mode: "single" | "dual"
- exam?: File (single mode)
- questionPaper?: File (dual mode)
- answerSheet?: File (dual mode)
- questionPaperId?: string (use existing)

Response: (same as before)
```

## Image Storage

### Options

**Option 1: Local Filesystem**
```
server/
  uploads/
    question-papers/
      {hash}.jpg
    answer-sheets/
      {uuid}.jpg
```

**Option 2: Cloud Storage (S3, GCS)**
- Better for production
- Scalable
- CDN support

**MVP: Use local filesystem, migrate to cloud later**

## Deduplication Strategy

### Image Hashing
```typescript
import crypto from 'crypto';
import fs from 'fs';

function calculateImageHash(filePath: string): string {
  const fileBuffer = fs.readFileSync(filePath);
  const hash = crypto.createHash('sha256');
  hash.update(fileBuffer);
  return hash.digest('hex');
}

// Usage
const hash = calculateImageHash(questionPaperPath);
const existing = await prisma.questionPaper.findUnique({
  where: { imageHash: hash }
});

if (existing) {
  // Reuse existing question paper
  return existing;
} else {
  // Extract and store new question paper
  const questions = await extractQuestions(questionPaperPath);
  return await prisma.questionPaper.create({
    data: { imageHash: hash, questions, ... }
  });
}
```

## Docker Setup

### docker-compose.yml

```yaml
version: '3.8'

services:
  postgres:
    image: postgres:16-alpine
    container_name: ai-teacher-db
    environment:
      POSTGRES_USER: ai_teacher
      POSTGRES_PASSWORD: dev_password_change_in_prod
      POSTGRES_DB: ai_teacher_db
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
    restart: unless-stopped

volumes:
  postgres_data:
```

### .env (server)

```bash
DATABASE_URL="postgresql://ai_teacher:dev_password_change_in_prod@localhost:5432/ai_teacher_db"
```

## Prisma Setup

### Installation
```bash
cd server
npm install @prisma/client
npm install -D prisma
```

### Initialize
```bash
npx prisma init
```

### Migrate
```bash
npx prisma migrate dev --name init
```

### Generate Client
```bash
npx prisma generate
```

## Implementation Plan

### Phase 1: Database Setup (Day 1)
- Create docker-compose.yml
- Set up PostgreSQL
- Create Prisma schema
- Run migrations
- Test connection

### Phase 2: Question Paper Storage (Day 2)
- Implement image hashing
- Create question paper extraction endpoint
- Store questions in database
- Test deduplication

### Phase 3: Grading with Stored Questions (Day 3)
- Modify grading endpoint to check for existing question papers
- Load questions from database
- Grade against stored questions
- Store grading results

### Phase 4: UI Integration (Day 4)
- Show "Recently used question papers"
- Allow selecting existing question paper
- Upload only answer sheet
- Display results

### Phase 5: Testing & Polish (Day 5)
- Test deduplication
- Test reuse workflow
- Performance testing
- Error handling

## Benefits

### For Students
- ✅ Faster grading (5-10 seconds saved)
- ✅ Can grade multiple attempts against same exam
- ✅ See progress over time on same exam

### For Teachers
- ✅ Upload question paper once
- ✅ Grade entire class against same paper
- ✅ Batch grading support
- ✅ Analytics across students

### For System
- ✅ Reduced AI API costs (fewer extractions)
- ✅ Better performance (cached questions)
- ✅ Enable new features (analytics, comparison)

## Future Enhancements

1. **Question Bank**: Build library of common questions
2. **Template Detection**: Auto-detect standard exam formats
3. **Question Tagging**: Tag questions by difficulty, topic
4. **Analytics**: Show which questions students struggle with
5. **Sharing**: Teachers share question papers with students
6. **Versioning**: Track changes to question papers
7. **Bulk Import**: Import questions from CSV/Excel

## Migration Strategy

### For Existing Users
- Existing single-image uploads continue to work
- No breaking changes
- Gradual migration to dual-mode with storage

### Data Migration
- No existing data to migrate (new feature)
- Start fresh with new database schema

## Security Considerations

1. **Access Control**: Who can see stored question papers?
   - MVP: No auth, anyone can use any question paper
   - Future: User accounts, private/public question papers

2. **Data Privacy**: Student answers are private
   - Store answer sheets temporarily
   - Delete after grading (or after X days)
   - Question papers can be public (reusable)

3. **Image Storage**: Secure file storage
   - Validate file types
   - Scan for malware
   - Set size limits

## Cost Analysis

### Without Storage
- 100 students × same exam = 100 question extractions
- Cost: 100 × $0.01 = $1.00
- Time: 100 × 10 seconds = 1000 seconds

### With Storage
- 100 students × same exam = 1 question extraction + 100 gradings
- Cost: 1 × $0.01 + 100 × $0.005 = $0.51
- Time: 1 × 10 seconds + 100 × 5 seconds = 510 seconds

**Savings: 50% cost, 50% time**

## Success Metrics

- ✅ 90%+ of question papers are reused at least once
- ✅ Average grading time reduced by 40%
- ✅ AI API costs reduced by 30%
- ✅ Zero data loss or corruption
- ✅ Database queries < 100ms
