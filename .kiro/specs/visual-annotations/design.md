# Visual Annotations + Voice Q&A - Design

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                         Frontend                             │
│  ┌────────────────┐  ┌──────────────┐  ┌─────────────────┐ │
│  │ Exam Image     │  │ SVG Overlay  │  │ Voice Interface │ │
│  │ Display        │  │ Annotations  │  │ (Mic + Speaker) │ │
│  └────────────────┘  └──────────────┘  └─────────────────┘ │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                         Backend API                          │
│  ┌────────────────┐  ┌──────────────┐  ┌─────────────────┐ │
│  │ /api/grade     │  │ /api/voice   │  │ /api/practice   │ │
│  │ (enhanced)     │  │ (context)    │  │ (generate)      │ │
│  └────────────────┘  └──────────────┘  └─────────────────┘ │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                      External Services                       │
│  ┌────────────────┐  ┌──────────────┐  ┌─────────────────┐ │
│  │ Gemini 2.5     │  │ Web Speech   │  │ ElevenLabs TTS  │ │
│  │ Flash (Vision) │  │ API (STT)    │  │ (optional)      │ │
│  └────────────────┘  └──────────────┘  └─────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

## Data Models

### Grading Response (Enhanced)

```typescript
interface GradingResponse {
  // Existing fields
  subject: string;
  language: string;
  gradeLevel: string;
  totalScore: string;
  feedback: string;
  
  // New: Image dimensions (for coordinate mapping)
  imageDimensions: {
    width: number;
    height: number;
  };
  
  // New: Annotations
  annotations: Annotation[];
  
  // Enhanced: Questions with coordinates
  detailedAnalysis: QuestionAnalysis[];
}

interface Annotation {
  id: string;
  type: 'checkmark' | 'cross' | 'score' | 'comment' | 'highlight';
  position: {
    x: number;  // percentage (0-100)
    y: number;  // percentage (0-100)
  };
  size?: {
    width: number;
    height: number;
  };
  color: 'green' | 'red' | 'yellow' | 'blue';
  text?: string;  // for comments and scores
  questionId: string;  // links to detailedAnalysis
  clickable: boolean;
}

interface QuestionAnalysis {
  id: string;
  question: string;
  studentAnswer: string;
  correct: boolean;
  score: string;
  remarks: string;
  
  // New: Bounding box for the question area
  boundingBox?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  
  // New: Topic/concept for practice generation
  topic?: string;
  concept?: string;
}
```

### Voice Context

```typescript
interface VoiceContext {
  examId: string;  // temporary ID for this session
  questionId: string;  // which question is being discussed
  question: string;
  studentAnswer: string;
  feedback: string;
  topic: string;
  conversationHistory: Message[];
}

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}
```

## Component Design

### 1. AnnotatedExamViewer Component

```typescript
interface AnnotatedExamViewerProps {
  imageUrl: string;
  gradingResult: GradingResponse;
  onAnnotationClick: (annotation: Annotation) => void;
}

// Features:
// - Display exam image
// - Render SVG overlay with annotations
// - Handle click/tap on annotations
// - Zoom/pan support
// - Responsive (mobile + desktop)
```

### 2. VoiceChat Component

```typescript
interface VoiceChatProps {
  context: VoiceContext;
  onClose: () => void;
  onPracticeRequest: (topic: string) => void;
}

// Features:
// - Microphone button (push-to-talk or toggle)
// - Visual feedback (waveform, listening indicator)
// - Transcription display
// - AI response (text + audio)
// - Conversation history
// - "Generate practice" button
```

### 3. AnnotationOverlay Component

```typescript
interface AnnotationOverlayProps {
  annotations: Annotation[];
  imageDimensions: { width: number; height: number };
  onAnnotationClick: (annotation: Annotation) => void;
}

// Renders:
// - Checkmarks (✓) and crosses (✗)
// - Score circles
// - Comment bubbles with pointers
// - Highlight boxes
// - Click targets (invisible, larger than visual)
```

## API Design

### Enhanced Grading Endpoint

```typescript
POST /api/grade

Request:
- multipart/form-data
- exam: File (image)

Response:
{
  subject: "Mathematics",
  language: "English",
  gradeLevel: "Grade 9-10",
  totalScore: "13/15",
  feedback: "Overall assessment...",
  imageDimensions: {
    width: 1200,
    height: 1600
  },
  annotations: [
    {
      id: "ann-1",
      type: "checkmark",
      position: { x: 15, y: 30 },  // 15% from left, 30% from top
      color: "green",
      questionId: "q1",
      clickable: true
    },
    {
      id: "ann-2",
      type: "cross",
      position: { x: 15, y: 50 },
      color: "red",
      questionId: "q2",
      clickable: true
    },
    {
      id: "ann-3",
      type: "score",
      position: { x: 5, y: 30 },
      text: "5/5",
      color: "green",
      questionId: "q1",
      clickable: true
    },
    {
      id: "ann-4",
      type: "comment",
      position: { x: 40, y: 52 },
      text: "Sign error in step 2",
      color: "red",
      questionId: "q2",
      clickable: true
    }
  ],
  detailedAnalysis: [
    {
      id: "q1",
      question: "Problem 33: Prove Basic Proportionality Theorem",
      studentAnswer: "Given: DE || BC...",
      correct: true,
      score: "5/5",
      remarks: "Excellent proof!",
      topic: "Geometry",
      concept: "Basic Proportionality Theorem"
    },
    {
      id: "q2",
      question: "Problem 32: Speed-distance problem",
      studentAnswer: "Speed = x, Time = y...",
      correct: false,
      score: "3/5",
      remarks: "Sign error in algebraic manipulation",
      topic: "Algebra",
      concept: "Linear Equations"
    }
  ]
}
```

### Voice Chat Endpoint

```typescript
POST /api/voice/chat

Request:
{
  context: {
    examId: "temp-123",
    questionId: "q2",
    question: "Problem 32: Speed-distance problem",
    studentAnswer: "Speed = x...",
    feedback: "Sign error in step 2",
    topic: "Algebra"
  },
  message: "Why did I get this wrong?",
  conversationHistory: []
}

Response:
{
  text: "You made a sign error in step 2. When you moved -5 to the other side...",
  audioUrl: "https://tts-service/audio/response-123.mp3"  // optional
}
```

### Practice Generation Endpoint

```typescript
POST /api/practice/generate

Request:
{
  topic: "Algebra",
  concept: "Linear Equations",
  difficulty: "medium",
  count: 1
}

Response:
{
  problems: [
    {
      id: "practice-1",
      question: "A train travels 80 km at speed x km/h...",
      solution: "Step 1: ...",
      hints: ["Start by setting up the equation", "Remember: distance = speed × time"]
    }
  ]
}
```

## UI/UX Design

### Annotated Exam View

```
┌─────────────────────────────────────────────────────┐
│  ← Back to Upload          Score: 13/15    🔊 Voice │
├─────────────────────────────────────────────────────┤
│                                                      │
│  ┌────────────────────────────────────────────┐    │
│  │                                             │    │
│  │   [Exam Image]                              │    │
│  │                                             │    │
│  │   ✓ (green)  ← Question 1                  │    │
│  │   5/5                                       │    │
│  │                                             │    │
│  │   ✗ (red)    ← Question 2                  │    │
│  │   3/5        💬 "Sign error in step 2"     │    │
│  │                                             │    │
│  │   ✓ (green)  ← Question 3                  │    │
│  │   5/5                                       │    │
│  │                                             │    │
│  └────────────────────────────────────────────┘    │
│                                                      │
│  💡 Tap any mark to ask questions                   │
│                                                      │
└─────────────────────────────────────────────────────┘
```

### Voice Chat Modal (after clicking annotation)

```
┌─────────────────────────────────────────────────────┐
│  Question 2: Speed-distance problem          ✕ Close│
├─────────────────────────────────────────────────────┤
│                                                      │
│  📝 Your Answer:                                     │
│  "Speed = x, Time = y..."                           │
│                                                      │
│  ❌ Feedback:                                        │
│  "Sign error in step 2"                             │
│                                                      │
│  ┌────────────────────────────────────────────┐    │
│  │ 🎤 You: "Why did I get this wrong?"        │    │
│  │                                             │    │
│  │ 🤖 AI: "You made a sign error in step 2.   │    │
│  │     When you moved -5 to the other side,   │    │
│  │     it should become +5, not stay negative"│    │
│  │                                             │    │
│  │ 🎤 You: "Can you show me the correct way?" │    │
│  │                                             │    │
│  │ 🤖 AI: "Sure! Here's the correct approach: │    │
│  │     Step 1: 63/x = 72/(x+6)..."           │    │
│  └────────────────────────────────────────────┘    │
│                                                      │
│  ┌──────────────────────────────────────────┐      │
│  │  🎤  Hold to speak                        │      │
│  └──────────────────────────────────────────┘      │
│                                                      │
│  [📝 Generate Practice Problem]                     │
│                                                      │
└─────────────────────────────────────────────────────┘
```

## Implementation Details

### Annotation Positioning Strategy

**Challenge:** AI needs to identify where to place annotations

**Solution 1: Question-Level (Easier, MVP)**
- AI identifies each question's region
- Place annotations at top-left of each question
- Use percentage-based coordinates (responsive)

**Solution 2: Word-Level (Advanced, Future)**
- Use OCR to get word bounding boxes
- AI specifies which word/line has error
- More precise but complex

**MVP Approach:**
```typescript
// Gemini prompt addition:
"For each question, estimate the position as percentage from top-left:
- Question 1 is approximately at x: 10%, y: 25%
- Question 2 is approximately at x: 10%, y: 50%
- Question 3 is approximately at x: 10%, y: 75%"
```

### Voice Implementation

**Option 1: Web Speech API (Free, Browser-based)**
```typescript
// Speech-to-Text
const recognition = new webkitSpeechRecognition();
recognition.continuous = false;
recognition.interimResults = true;
recognition.lang = 'en-US';

recognition.onresult = (event) => {
  const transcript = event.results[0][0].transcript;
  sendToAI(transcript);
};

// Text-to-Speech
const utterance = new SpeechSynthesisUtterance(text);
utterance.lang = 'en-US';
speechSynthesis.speak(utterance);
```

**Option 2: Deepgram + ElevenLabs (Better quality, Paid)**
- Deepgram for STT (real-time, accurate)
- ElevenLabs for TTS (natural voice)
- More reliable but costs money

**MVP: Use Web Speech API, upgrade later if needed**

### Context Management

```typescript
// Store exam context in component state
const [examContext, setExamContext] = useState<GradingResponse | null>(null);
const [activeQuestion, setActiveQuestion] = useState<string | null>(null);

// When annotation clicked
const handleAnnotationClick = (annotation: Annotation) => {
  const question = examContext.detailedAnalysis.find(
    q => q.id === annotation.questionId
  );
  
  setActiveQuestion(annotation.questionId);
  openVoiceChat({
    examId: examContext.id,
    questionId: question.id,
    question: question.question,
    studentAnswer: question.studentAnswer,
    feedback: question.remarks,
    topic: question.topic
  });
};

// Voice chat sends context with each message
const sendVoiceMessage = async (message: string) => {
  const response = await fetch('/api/voice/chat', {
    method: 'POST',
    body: JSON.stringify({
      context: voiceContext,
      message,
      conversationHistory
    })
  });
};
```

## Correctness Properties

### P1: Annotation Accuracy
**Property:** Annotations must be positioned within the correct question region
**Test:** Visual inspection + user feedback
**Metric:** > 95% of annotations are in correct region

### P2: Voice Context Preservation
**Property:** AI must reference the specific question in its responses
**Test:** Check if AI mentions question number or specific mistake
**Metric:** 100% of responses should reference the context

### P3: Click Target Accuracy
**Property:** Users can easily click/tap annotations on mobile
**Test:** Touch target size >= 44x44px
**Metric:** < 5% mis-clicks

### P4: Voice Recognition Accuracy
**Property:** Student's speech is transcribed correctly
**Test:** Compare transcription to actual speech
**Metric:** > 90% word accuracy

### P5: Response Latency
**Property:** Voice responses feel conversational (not laggy)
**Test:** Measure time from speech end to response start
**Metric:** < 2 seconds for 95% of requests

## Edge Cases

### E1: No annotations returned by AI
**Handling:** Show text-only feedback, allow voice chat on overall exam

### E2: Voice recognition fails
**Handling:** Show text input fallback, display error message

### E3: Image too large/small
**Handling:** Scale image to fit viewport, maintain aspect ratio

### E4: Multiple annotations overlap
**Handling:** Offset slightly, show on hover/click

### E5: Student asks unrelated question
**Handling:** AI gently redirects to exam topic, offers general help

## Testing Strategy

### Unit Tests
- Annotation positioning calculations
- Coordinate percentage conversion
- Click target hit detection

### Integration Tests
- Full grading flow with annotations
- Voice chat with context
- Practice problem generation

### Manual Testing
- Test on real exam images
- Test voice on different devices
- Test with different accents
- Test on slow networks

### User Testing
- 5-10 students test the feature
- Observe natural behavior
- Collect feedback
- Measure satisfaction

## Success Criteria

**Must achieve:**
- ✅ Annotations render correctly on 95%+ of exams
- ✅ Voice chat works on mobile and desktop
- ✅ Students understand how to use it (< 30 sec to figure out)
- ✅ Students rate it 8+/10 for usefulness
- ✅ Students say "this is better than ChatGPT"

**If achieved, proceed with:**
- User accounts + exam history
- More annotation types
- Multi-language support
- Social sharing

**If not achieved:**
- Analyze failure points
- Iterate on UX
- Consider alternative approaches
