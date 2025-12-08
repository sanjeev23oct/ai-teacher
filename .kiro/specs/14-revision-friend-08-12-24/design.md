# Revision Friend Helper - Design Document

## Overview

The Revision Friend feature provides students with quick, structured 3-minute revision sessions for any CBSE topic. The system uses AI to generate personalized content, tracks weak areas, and suggests re-revision of topics that need more practice. The feature integrates with the existing AI service and TTS capabilities to deliver an engaging, voice-enabled learning experience.

## Architecture

### High-Level Components

```
┌─────────────────┐
│  React Frontend │
│  RevisionFriend │
│     Page        │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Express API    │
│  /api/revision- │
│    friend/*     │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ RevisionFriend  │
│    Service      │
└────────┬────────┘
         │
    ┌────┴────┐
    ▼         ▼
┌────────┐ ┌────────┐
│   AI   │ │  TTS   │
│Service │ │Service │
└────────┘ └────────┘
```

### Data Flow

1. Student requests revision for a topic
2. Frontend sends request to API with topic and subject
3. Service generates phase-specific content using AI
4. TTS converts content to audio
5. Frontend plays audio and manages timer
6. After each phase, service generates next phase content
7. On completion, service tracks performance and updates weak areas

## Components and Interfaces

### Frontend Component: RevisionFriendPage

**Location**: `client/src/pages/RevisionFriendPage.tsx`

**State Management**:
```typescript
interface RevisionSession {
  topic: string;
  subject: string;
  phase: 'explanation' | 'repeat' | 'quiz' | 'drill' | 'complete';
  timeLeft: number;
  content: string;
  audioUrl?: string;
}

interface RevisionHistory {
  topic: string;
  subject: string;
  score: number;
  date: string;
  weakAreas: string[];
}
```

**Key Features**:
- Topic input with subject selector
- Timer display with phase indicator
- Audio playback controls
- Pause/resume functionality
- History display with weak area highlighting
- Suggestion chips for quick access

### Backend Service: revisionFriendService

**Location**: `server/services/revisionFriendService.ts`

**Interface**:
```typescript
interface RevisionFriendService {
  startRevision(request: RevisionRequest): Promise<RevisionPhaseResponse>;
  getNextPhase(sessionId: string, currentPhase: string): Promise<RevisionPhaseResponse>;
  completeRevision(sessionId: string, performance: PerformanceData): Promise<void>;
  getRevisionHistory(userId: string): Promise<RevisionHistory[]>;
  getSuggestions(userId: string): Promise<string[]>;
}

interface RevisionRequest {
  topic: string;
  subject: string;
  userId: string;
}

interface RevisionPhaseResponse {
  sessionId: string;
  phase: string;
  content: string;
  audioUrl: string;
  duration: number;
}

interface PerformanceData {
  quizScore: number;
  weakAreas: string[];
  completedPhases: string[];
}
```

### API Endpoints

**POST /api/revision-friend/start**
- Request: `{ topic: string, subject: string }`
- Response: `{ sessionId: string, content: string, audioUrl: string, duration: number }`

**POST /api/revision-friend/next-phase**
- Request: `{ sessionId: string, currentPhase: string }`
- Response: `{ phase: string, content: string, audioUrl: string, duration: number }`

**POST /api/revision-friend/complete**
- Request: `{ sessionId: string, performance: PerformanceData }`
- Response: `{ success: boolean, weakAreas: string[] }`

**GET /api/revision-friend/history**
- Response: `{ history: RevisionHistory[] }`

**GET /api/revision-friend/suggestions**
- Response: `{ suggestions: string[] }`

## Data Models

### Database Schema (Prisma)

```prisma
model RevisionSession {
  id            String   @id @default(cuid())
  userId        String
  user          User     @relation(fields: [userId], references: [id])
  topic         String
  subject       String
  startedAt     DateTime @default(now())
  completedAt   DateTime?
  score         Int?
  weakAreas     String[] // JSON array
  phasesCompleted String[] // JSON array
  
  @@index([userId, completedAt])
}

model WeakTopic {
  id            String   @id @default(cuid())
  userId        String
  user          User     @relation(fields: [userId], references: [id])
  topic         String
  subject       String
  occurrences   Int      @default(1)
  lastSeen      DateTime @default(now())
  improved      Boolean  @default(false)
  
  @@unique([userId, topic, subject])
  @@index([userId, improved])
}
```

### In-Memory Session State

For active sessions, maintain state in memory:
```typescript
interface ActiveSession {
  sessionId: string;
  userId: string;
  topic: string;
  subject: string;
  currentPhase: string;
  startTime: Date;
  phaseHistory: string[];
}
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Session Structure Completeness
*For any* revision session, when all phases complete successfully, the session SHALL contain exactly 4 phases in order: explanation (60s), repeat (30s), quiz (60s), drill (30s), totaling 180 seconds.
**Validates: Requirements 1.1, 1.2, 1.3, 1.4, 1.5**

### Property 2: Weak Area Tracking Persistence
*For any* completed revision session where quiz score < 3/5, the topic SHALL be added to the user's weak areas list and SHALL appear in suggestions on next visit.
**Validates: Requirements 2.1, 2.2, 2.3**

### Property 3: Weak Area Improvement Recognition
*For any* weak topic, when a student completes a revision with score >= 4/5, the topic SHALL be removed from weak areas and SHALL not appear in weak area suggestions.
**Validates: Requirements 2.4, 2.5**

### Property 4: Multi-Subject Support
*For any* subject in [English, Science, Math, SST], the system SHALL generate appropriate revision content with subject-specific terminology and examples.
**Validates: Requirements 3.1**

### Property 5: NCERT Reference Inclusion
*For any* topic that matches NCERT curriculum, the generated content SHALL include chapter name and relevant page numbers when available.
**Validates: Requirements 3.2**

### Property 6: Phase Transition Consistency
*For any* active session, transitioning from phase N to phase N+1 SHALL preserve session context (topic, subject, userId) and SHALL generate content relevant to previous phases.
**Validates: Requirements 1.2, 1.3, 1.4, 1.5**

### Property 7: Audio Generation Completeness
*For any* phase content generated, the system SHALL produce a corresponding audio file and SHALL return a valid audio URL.
**Validates: Requirements 1.1 (implicit audio requirement)**

## Error Handling

### Client-Side Error Handling

1. **Network Failures**
   - Display user-friendly error message
   - Offer retry option
   - Save session state for recovery

2. **Audio Playback Failures**
   - Fall back to text display
   - Log error for debugging
   - Continue session without audio

3. **Timer Issues**
   - Validate timer state on phase transitions
   - Prevent negative time values
   - Handle browser tab visibility changes

### Server-Side Error Handling

1. **AI Service Failures**
   - Retry with exponential backoff (max 3 attempts)
   - Fall back to template-based content
   - Log error with context

2. **TTS Service Failures**
   - Continue without audio
   - Return text-only response
   - Log error for monitoring

3. **Database Failures**
   - Use in-memory fallback for session state
   - Queue writes for retry
   - Return cached suggestions

4. **Invalid Input**
   - Validate topic and subject
   - Return 400 with clear error message
   - Suggest valid alternatives

### Error Response Format

```typescript
interface ErrorResponse {
  error: string;
  code: string;
  details?: any;
  suggestions?: string[];
}
```

## Testing Strategy

### Unit Tests

**Frontend Tests** (`RevisionFriendPage.test.tsx`):
- Timer countdown functionality
- Phase transitions
- Audio playback controls
- History display
- Suggestion click handling

**Backend Tests** (`revisionFriendService.test.ts`):
- Session creation
- Phase content generation
- Weak area tracking logic
- Suggestion algorithm
- Performance calculation

### Property-Based Tests

Use **fast-check** library for property-based testing:

**Test 1: Session Structure Completeness**
```typescript
// Generate random topics and subjects
// Verify all sessions have 4 phases totaling 180s
fc.assert(
  fc.property(
    fc.string(), // topic
    fc.constantFrom('English', 'Science', 'Math', 'SST'), // subject
    async (topic, subject) => {
      const session = await startRevision({ topic, subject });
      const phases = await completeAllPhases(session.sessionId);
      expect(phases).toHaveLength(4);
      expect(phases.map(p => p.duration).reduce((a, b) => a + b)).toBe(180);
    }
  )
);
```

**Test 2: Weak Area Tracking**
```typescript
// Generate random sessions with low scores
// Verify topics appear in weak areas
fc.assert(
  fc.property(
    fc.string(), // topic
    fc.integer({ min: 0, max: 2 }), // low score
    async (topic, score) => {
      await completeRevision(sessionId, { quizScore: score });
      const suggestions = await getSuggestions(userId);
      expect(suggestions.some(s => s.includes(topic))).toBe(true);
    }
  )
);
```

**Test 3: Multi-Subject Content Generation**
```typescript
// Generate random subjects
// Verify content is subject-appropriate
fc.assert(
  fc.property(
    fc.constantFrom('English', 'Science', 'Math', 'SST'),
    async (subject) => {
      const response = await startRevision({ topic: 'test', subject });
      expect(response.content).toBeTruthy();
      expect(response.audioUrl).toMatch(/^https?:\/\//);
    }
  )
);
```

### Integration Tests

1. **End-to-End Session Flow**
   - Start session → Complete all phases → Verify history
   - Test with real AI and TTS services

2. **Weak Area Workflow**
   - Complete low-score session → Check suggestions → Retry topic → Verify improvement

3. **Multi-User Isolation**
   - Create sessions for multiple users
   - Verify history and suggestions are user-specific

### Manual Testing Checklist

- [ ] Complete full 3-minute session
- [ ] Test pause/resume functionality
- [ ] Verify audio playback
- [ ] Check weak area suggestions
- [ ] Test with all 4 subjects
- [ ] Verify NCERT references appear
- [ ] Test on mobile devices
- [ ] Check timer accuracy
- [ ] Verify history persistence

## Implementation Notes

### AI Prompt Engineering

Each phase requires specific prompts:

**Explanation Phase (60s)**:
```
You are a friendly tutor helping a CBSE Class 9-10 student revise [topic] in [subject].
Provide a 60-second explanation covering:
- Main concept in simple Hinglish
- 2-3 key points to remember
- One practical example
- Why it's important for exams

Keep it conversational and engaging.
```

**Repeat Phase (30s)**:
```
Create a 30-second repetition exercise for [topic].
List 3 key points the student should repeat aloud.
Format: "Now repeat after me: 1. [point], 2. [point], 3. [point]"
```

**Quiz Phase (60s)**:
```
Create 3 quick questions about [topic] for CBSE Class 9-10.
Format each as: Question → Pause → Answer with brief explanation.
Make questions exam-relevant but not too difficult.
```

**Drill Phase (30s)**:
```
Create a 30-second rapid drill focusing on [weak areas] in [topic].
Format: "Quick revision: Remember [point 1], Don't forget [point 2], Exam tip: [tip]"
End with encouragement.
```

### TTS Optimization

- Use streaming TTS for faster response
- Cache common phrases
- Adjust speech rate for clarity (0.9x speed)
- Use Indian English voice if available

### Performance Considerations

- Pre-generate content for common topics
- Cache NCERT references
- Use CDN for audio files
- Implement session cleanup (delete after 24 hours)
- Limit history to last 20 sessions per user

### Mobile Responsiveness

- Ensure timer is visible without scrolling
- Make audio controls touch-friendly (min 44px)
- Support background audio playback
- Handle screen lock gracefully
- Optimize for slow networks

