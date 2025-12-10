# Group Study Simulator - Design Document

## Overview

The Group Study Simulator feature creates an immersive practice environment where students interact with two AI study buddies (customizable names) during study sessions. After answering questions, students face follow-up questions and counter-arguments, simulating real classroom discussions and preparing them for teacher Q&A sessions. The system evaluates the student's ability to handle challenges and defend their answers.

## Architecture

### High-Level Components

```
┌─────────────────┐
│  React Frontend │
│  GroupStudy     │
│     Page        │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Express API    │
│  /api/group-    │
│    study/*      │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  GroupStudy     │
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

1. Student selects a topic/question to practice
2. Student provides their answer (text or voice)
3. System sends answer to AI service
4. AI generates Rohan's follow-up question
5. TTS converts to audio, student responds
6. AI generates Priya's counter-argument
7. TTS converts to audio, student responds
8. System evaluates handling skill (1-5)
9. Performance saved, difficulty adjusted for next session

## Components and Interfaces

### Frontend Component: GroupStudyPage

**Location**: `client/src/pages/GroupStudyPage.tsx`

**State Management**:
```typescript
interface GroupStudySession {
  sessionId: string;
  topic: string;
  subject: string;
  studentAnswer: string;
  classmate1Name: string; // Student-provided name for first buddy
  classmate2Name: string; // Student-provided name for second buddy
  currentSpeaker: 'student' | 'classmate1' | 'classmate2' | 'evaluation';
  classmate1Question?: string;
  classmate2Counter?: string;
  studentResponses: string[];
  handlingScore?: number;
}

interface AIClassmate {
  name: string; // Student-customized name
  role: 'questioner' | 'challenger'; // First buddy asks questions, second challenges
  avatar?: string;
  personality: string; // questioning vs critical
  lastMessage?: string;
}

interface HandlingHistory {
  topic: string;
  subject: string;
  score: number; // 1-5
  date: string;
  challenges: number;
  badges?: string[];
}
```

**Key Features**:
- Topic input with subject selector
- Student answer input (text/voice)
- AI classmate avatars with speech bubbles
- Turn-based conversation flow
- Handling skill meter (1-5)
- Progress tracking and badges
- History with improvement trends

### Backend Service: groupStudyService

**Location**: `server/services/groupStudyService.ts`

**Interface**:
```typescript
interface GroupStudyService {
  startSession(request: SessionRequest): Promise<SessionResponse>;
  getRohanQuestion(sessionId: string, studentAnswer: string): Promise<AIResponse>;
  getPriyaCounter(sessionId: string, rohanResponse: string): Promise<AIResponse>;
  evaluateHandling(sessionId: string, responses: StudentResponses): Promise<EvaluationResult>;
  getHistory(userId: string): Promise<HandlingHistory[]>;
  adjustDifficulty(userId: string, recentScores: number[]): Promise<DifficultyLevel>;
}

interface SessionRequest {
  topic: string;
  subject: string;
  userId: string;
  classmate1Name: string; // e.g., "Rohan", "Alex", "Sam"
  classmate2Name: string; // e.g., "Priya", "Maya", "Jordan"
  question?: string; // optional practice question
}

interface SessionResponse {
  sessionId: string;
  topic: string;
  subject: string;
  initialPrompt: string;
}

interface AIResponse {
  speaker: 'classmate1' | 'classmate2';
  speakerName: string; // The actual name chosen by student
  message: string;
  audioUrl: string;
  challengeType: 'follow-up' | 'counter' | 'clarification' | 'example';
}

interface StudentResponses {
  initialAnswer: string;
  rohanResponse: string;
  priyaResponse: string;
}

interface EvaluationResult {
  handlingScore: number; // 1-5
  strengths: string[];
  improvements: string[];
  badge?: string;
  nextDifficulty: DifficultyLevel;
}

type DifficultyLevel = 'supportive' | 'moderate' | 'challenging';
```

### API Endpoints

**POST /api/group-study/start**
- Request: `{ topic: string, subject: string, classmate1Name: string, classmate2Name: string, question?: string }`
- Response: `{ sessionId: string, topic: string, classmate1Name: string, classmate2Name: string, initialPrompt: string }`

**POST /api/group-study/classmate1-question**
- Request: `{ sessionId: string, studentAnswer: string }`
- Response: `{ speaker: 'classmate1', speakerName: string, message: string, audioUrl: string, challengeType: string }`

**POST /api/group-study/classmate2-counter**
- Request: `{ sessionId: string, classmate1Response: string }`
- Response: `{ speaker: 'classmate2', speakerName: string, message: string, audioUrl: string, challengeType: string }`

**POST /api/group-study/evaluate**
- Request: `{ sessionId: string, responses: StudentResponses }`
- Response: `{ handlingScore: number, strengths: string[], improvements: string[], badge?: string }`

**GET /api/group-study/history**
- Response: `{ history: HandlingHistory[] }`

**POST /api/group-study/audio/stream**
- Request: `{ text: string, speakerRole: 'questioner' | 'challenger' }`
- Response: Audio stream

## Data Models

### Database Schema (Prisma)

```prisma
model GroupStudySession {
  id                String   @id @default(cuid())
  userId            String
  user              User     @relation(fields: [userId], references: [id])
  topic             String
  subject           String
  classmate1Name    String   // Student-chosen name for first buddy
  classmate2Name    String   // Student-chosen name for second buddy
  studentAnswer     String
  classmate1Question String?
  classmate2Counter String?
  classmate1Response String?
  classmate2Response String?
  handlingScore     Int?     // 1-5
  challengesCount   Int      @default(2) // Two classmates
  startedAt         DateTime @default(now())
  completedAt       DateTime?
  
  @@index([userId, completedAt])
}

model HandlingSkillProgress {
  id              String   @id @default(cuid())
  userId          String
  user            User     @relation(fields: [userId], references: [id])
  currentLevel    String   @default("supportive") // supportive, moderate, challenging
  avgScore        Float    @default(0)
  sessionsCount   Int      @default(0)
  badges          String[] // JSON array
  lastSession     DateTime @default(now())
  
  @@unique([userId])
}
```

### In-Memory Session State

```typescript
interface ActiveGroupSession {
  sessionId: string;
  userId: string;
  topic: string;
  subject: string;
  classmate1Name: string;
  classmate2Name: string;
  currentPhase: 'initial' | 'classmate1' | 'classmate2' | 'evaluation';
  difficulty: DifficultyLevel;
  startTime: Date;
  responses: {
    student: string;
    classmate1?: string;
    classmate2?: string;
  };
}
```

## Correctness Properties

### Property 1: Conversation Flow Consistency
*For any* group study session, the conversation flow SHALL follow: Student Answer → Classmate1 Question → Student Response → Classmate2 Counter → Student Response → Evaluation, in that exact order.
**Validates: Requirements 1.1, 1.2**

### Property 2: Challenge Adaptation
*For any* student response, if the response is basic/vague, the AI classmates SHALL ask for specifics or examples; if the response is strong, they SHALL provide harder challenges.
**Validates: Requirements 2.1, 2.2, 2.3, 2.4, 2.5**

### Property 3: Natural Language Usage
*For any* AI classmate message, the language SHALL be student-like (informal, questioning tone) and SHALL avoid teacher-like formality or lecturing.
**Validates: Requirements 1.3**

### Property 4: Handling Skill Evaluation
*For any* completed session, the system SHALL assign a handling score (1-5) based on: clarity of responses, addressing challenges, providing evidence, and maintaining composure.
**Validates: Requirements 1.4, 1.5**

### Property 5: Progress Tracking Continuity
*For any* user, when completing sessions, the system SHALL track handling scores over time and SHALL adjust difficulty based on recent performance (last 5 sessions).
**Validates: Requirements 3.1, 3.2**

### Property 6: Badge Award Consistency
*For any* user, when 3 consecutive sessions achieve handling score >= 4, the system SHALL award "Discussion Pro" badge and SHALL display achievement notification.
**Validates: Requirements 3.3**

### Property 7: Supportive Feedback
*For any* struggling student (score <= 2), the system SHALL provide specific tips on handling questions and SHALL reduce difficulty in next session.
**Validates: Requirements 3.4, 3.5**

## Error Handling

### Client-Side Error Handling

1. **Voice Input Failures**
   - Fall back to text input
   - Display clear error message
   - Offer retry option

2. **Audio Playback Issues**
   - Show text version of AI message
   - Continue conversation flow
   - Log error for debugging

3. **Network Delays**
   - Show "AI classmate is thinking..." indicator
   - Timeout after 30s with retry option
   - Save session state for recovery

### Server-Side Error Handling

1. **AI Service Failures**
   - Retry with exponential backoff (max 3 attempts)
   - Fall back to template-based responses
   - Log error with context

2. **TTS Failures**
   - Return text-only response
   - Continue session without audio
   - Mark for offline processing

3. **Session State Loss**
   - Persist state to database after each interaction
   - Allow session recovery from last saved state
   - Limit active sessions to prevent memory issues

4. **Invalid Responses**
   - Validate student input (min 10 chars)
   - Prompt for more detail if too short
   - Provide examples of good responses

## Testing Strategy

### Unit Tests

**Frontend Tests** (`GroupStudyPage.test.tsx`):
- Conversation flow state machine
- Turn tracking (student → rohan → priya → eval)
- Audio playback controls
- History display and filtering
- Badge display logic

**Backend Tests** (`groupStudyService.test.ts`):
- Session creation and state management
- AI response generation (Rohan vs Priya personalities)
- Handling score calculation
- Difficulty adjustment algorithm
- Badge award logic

### Property-Based Tests

**Test 1: Conversation Flow**
```typescript
// For any valid student answer, verify flow is always: answer → rohan → priya → eval
fc.assert(
  fc.property(
    fc.string({ minLength: 10 }), // student answer
    async (answer) => {
      const session = await startSession({ topic: 'test', subject: 'Science' });
      const rohan = await getRohanQuestion(session.sessionId, answer);
      const priya = await getPriyaCounter(session.sessionId, 'response');
      
      expect(rohan.speaker).toBe('rohan');
      expect(priya.speaker).toBe('priya');
    }
  )
);
```

**Test 2: Challenge Adaptation**
```typescript
// Verify vague answers get "clarification" challenges
fc.assert(
  fc.property(
    fc.constantFrom('yes', 'no', 'maybe', 'I think so'), // vague answers
    async (vagueAnswer) => {
      const response = await getRohanQuestion(sessionId, vagueAnswer);
      expect(response.challengeType).toBe('clarification');
    }
  )
);
```

### Integration Tests

1. **Full Session Flow**
   - Start → Answer → Rohan → Respond → Priya → Respond → Evaluate → Check History

2. **Difficulty Progression**
   - Complete 5 sessions with high scores → Verify difficulty increases

3. **Badge Awards**
   - Complete 3 sessions with score >= 4 → Verify badge awarded

### Manual Testing Checklist

- [ ] Complete full conversation with AI classmates
- [ ] Test with different subjects (English, Science, Math, SST)
- [ ] Verify Rohan asks follow-up questions
- [ ] Verify Priya provides counter-arguments
- [ ] Test handling score calculation
- [ ] Check badge award notification
- [ ] Test difficulty adjustment
- [ ] Verify audio playback for both AI classmates
- [ ] Test on mobile devices
- [ ] Check history persistence

## Implementation Notes

### AI Prompt Engineering

**Classmate 1 (Questioner)** - Curious, asks follow-ups:
```
You are {classmate1Name}, a curious CBSE Class 9-10 student in a study group.
Your friend just answered: "{studentAnswer}"
Ask a follow-up question that:
- Challenges them to think deeper
- Asks "But what about..." or "How does this work when..."
- Is friendly and conversational (use Hinglish)
- Focuses on practical application or edge cases
- Speak as if you are {classmate1Name}
Keep it short (1-2 sentences).
```

**Classmate 2 (Challenger)** - Critical, provides alternatives:
```
You are {classmate2Name}, an analytical CBSE Class 9-10 student in a study group.
Your friend said: "{studentAnswer}"
{classmate1Name} asked: "{classmate1Question}"
They responded: "{classmate1Response}"

Provide a counter-argument or alternative viewpoint that:
- Respectfully disagrees or shows another angle
- Starts with "I disagree because..." or "Actually..."
- Is thoughtful but friendly (use Hinglish)
- Makes them defend their reasoning
- Speak as if you are {classmate2Name}
Keep it short (1-2 sentences).
```

**Evaluation Criteria**:
- **Score 5**: Clear, detailed, addresses challenges, provides evidence
- **Score 4**: Good explanations, handles most challenges well
- **Score 3**: Basic answers, some vagueness, needs more depth
- **Score 2**: Struggled with challenges, unclear reasoning
- **Score 1**: Very vague, didn't address questions properly

### TTS Voice Differentiation

- **Classmate 1 (Questioner)**: Male voice by default, slightly higher pitch, enthusiastic tone (can be customized based on name)
- **Classmate 2 (Challenger)**: Female voice by default, measured pace, thoughtful tone (can be customized based on name)
- **Student**: Use user's preferred voice settings
- **Voice Selection Logic**: Analyze name to infer likely gender for voice selection, or allow user to choose voice type

### Performance Considerations

- Cache common AI responses for frequent topics
- Limit session history to last 30 sessions per user
- Clean up incomplete sessions after 24 hours
- Use streaming TTS for faster response
- Pre-load avatar images

### Badge System

- **Discussion Pro**: Handle 3 consecutive challenges well (score >= 4)
- **Critical Thinker**: Successfully counter 5 of Priya's arguments
- **Quick Responder**: Complete 10 sessions
- **Subject Expert**: Score >= 4 in same subject 5 times

### Difficulty Adjustment Algorithm

```typescript
function adjustDifficulty(recentScores: number[]): DifficultyLevel {
  const avg = recentScores.reduce((a, b) => a + b) / recentScores.length;
  
  if (avg >= 4) return 'challenging';
  if (avg >= 2.5) return 'moderate';
  return 'supportive';
}
```

**Supportive**: Rohan asks clarifying questions, Priya gently probes  
**Moderate**: Rohan challenges assumptions, Priya provides mild counter-arguments  
**Challenging**: Rohan asks edge cases, Priya strongly disagrees with solid reasoning

### Mobile Responsiveness

- Avatar bubbles stack vertically on mobile
- Text input expands to full width
- Audio controls are touch-friendly (min 44px)
- Conversation history scrolls smoothly
- Keyboard doesn't hide conversation

### Accessibility

- Screen reader support for conversation flow
- Keyboard navigation for all controls
- High contrast mode support
- Text alternatives for audio messages
- Focus indicators for active speaker
