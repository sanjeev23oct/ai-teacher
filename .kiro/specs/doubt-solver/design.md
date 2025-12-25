# AI Doubt Solver - Design

## Overview

The AI Doubt Solver transforms the educational experience by providing instant, personalized explanations for any question a student uploads. It combines visual annotations, natural conversation, and subject-specific expertise to create a Microsoft Copilot-like tutoring experience that feels human and responsive.

## Architecture

### System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         Frontend (React)                         │
│  ┌──────────────┐  ┌──────────────┐  ┌────────────────────────┐│
│  │ DoubtsPage   │  │ Explanation  │  │ DoubtsHistoryPage      ││
│  │ - Subject    │  │ View         │  │ - Search & Filter      ││
│  │ - Language   │  │ - Annotated  │  │ - Favorites            ││
│  │ - Upload     │  │ - Steps      │  │ - Re-open doubts       ││
│  │              │  │ - Chat       │  │                        ││
│  └──────────────┘  └──────────────┘  └────────────────────────┘│
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      Backend API (Express)                       │
│  ┌──────────────┐  ┌──────────────┐  ┌────────────────────────┐│
│  │ /api/doubts  │  │ /api/doubts  │  │ /api/doubts/history    ││
│  │ /explain     │  │ /chat        │  │ /api/doubts/search     ││
│  └──────────────┘  └──────────────┘  └────────────────────────┘│
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Services & External APIs                      │
│  ┌──────────────┐  ┌──────────────┐  ┌────────────────────────┐│
│  │ Gemini 2.5   │  │ Web Speech   │  │ Database (PostgreSQL)  ││
│  │ Flash        │  │ API / TTS    │  │ - Doubts               ││
│  │ (Vision+Text)│  │              │  │ - Conversations        ││
│  └──────────────┘  └──────────────┘  └────────────────────────┘│
└─────────────────────────────────────────────────────────────────┘
```

### Data Flow

```
1. Student selects subject + language
2. Student uploads question (camera/file) or types it
3. Backend: Gemini analyzes question with subject-specific prompt
4. Backend: Generates step-by-step solution with annotation coordinates
5. Frontend: Displays annotated question + explanation
6. Student: Clicks annotation or asks follow-up question
7. Backend: Provides detailed explanation with context
8. Conversation continues naturally with streaming responses
9. All interactions saved to history
```

## Components and Interfaces

### Frontend Components

#### 1. DoubtsPage Component

```typescript
interface DoubtsPageProps {}

interface DoubtsPageState {
  subject: Subject | null;
  language: Language | null;
  questionImage: string | null;
  questionText: string | null;
  explanation: ExplanationResponse | null;
  isLoading: boolean;
}

type Subject = 
  | 'Mathematics'
  | 'Physics'
  | 'Chemistry'
  | 'Biology'
  | 'English'
  | 'Social Studies';

type Language = 
  | 'English'
  | 'Hindi'
  | 'Hinglish'
  | 'Bengali'
  | 'Tamil'
  | 'Telugu'
  | 'Marathi'
  | 'Gujarati'
  | 'Kannada'
  | 'Malayalam'
  | 'Punjabi';
```

**Features:**
- Subject selector with icons
- Language selector with native script display
- Question upload (camera/file/text)
- Smooth transitions to explanation view
- Mobile-first design

#### 2. SubjectSelector Component

```typescript
interface SubjectSelectorProps {
  selectedSubject: Subject | null;
  onSelect: (subject: Subject) => void;
}

const SUBJECTS = [
  { id: 'Mathematics', icon: '🔢', color: 'blue' },
  { id: 'Physics', icon: '⚛️', color: 'purple' },
  { id: 'Chemistry', icon: '🧪', color: 'green' },
  { id: 'Biology', icon: '🧬', color: 'teal' },
  { id: 'English', icon: '📚', color: 'orange' },
  { id: 'Social Studies', icon: '🌍', color: 'yellow' },
];
```

#### 3. LanguageSelector Component

```typescript
interface LanguageSelectorProps {
  selectedLanguage: Language | null;
  onSelect: (language: Language) => void;
}

const LANGUAGES = [
  { id: 'English', label: 'English', nativeLabel: 'English' },
  { id: 'Hindi', label: 'Hindi', nativeLabel: 'हिंदी' },
  { id: 'Hinglish', label: 'Hinglish', nativeLabel: 'Hinglish' },
  { id: 'Bengali', label: 'Bengali', nativeLabel: 'বাংলা' },
  { id: 'Tamil', label: 'Tamil', nativeLabel: 'தமிழ்' },
  { id: 'Telugu', label: 'Telugu', nativeLabel: 'తెలుగు' },
  { id: 'Marathi', label: 'Marathi', nativeLabel: 'मराठी' },
  { id: 'Gujarati', label: 'Gujarati', nativeLabel: 'ગુજરાતી' },
  { id: 'Kannada', label: 'Kannada', nativeLabel: 'ಕನ್ನಡ' },
  { id: 'Malayalam', label: 'Malayalam', nativeLabel: 'മലയാളം' },
  { id: 'Punjabi', label: 'Punjabi', nativeLabel: 'ਪੰਜਾਬੀ' },
];
```

#### 4. QuestionUpload Component

```typescript
interface QuestionUploadProps {
  onImageUpload: (image: File) => void;
  onTextInput: (text: string) => void;
  isLoading: boolean;
}

// Supports three input methods:
// 1. Camera capture (mobile-first)
// 2. File upload (desktop)
// 3. Text input (typing question)
```

#### 5. ExplanationView Component

```typescript
interface ExplanationViewProps {
  explanation: ExplanationResponse;
  onAnnotationClick: (annotationId: string) => void;
  onFollowUpQuestion: (question: string) => void;
}

interface ExplanationResponse {
  doubtId: string;
  questionImage?: string;
  questionText: string;
  subject: Subject;
  language: Language;
  
  // Main explanation
  whatQuestionAsks: string;
  steps: ExplanationStep[];
  finalAnswer: string;
  keyConcepts: string[];
  practiceTip: string;
  
  // Annotations
  annotations: Annotation[];
  imageDimensions?: { width: number; height: number };
  
  // Conversation
  conversationId: string;
}

interface ExplanationStep {
  id: string;
  number: number;
  title: string;
  explanation: string;
  detailedExplanation?: string; // Loaded on click
  annotationId?: string;
}

interface Annotation {
  id: string;
  type: 'step' | 'concept' | 'formula' | 'highlight';
  position: { x: number; y: number }; // percentage
  label: string;
  clickable: boolean;
}
```

#### 6. AnnotatedQuestionViewer Component

```typescript
interface AnnotatedQuestionViewerProps {
  imageUrl?: string;
  questionText: string;
  annotations: Annotation[];
  imageDimensions?: { width: number; height: number };
  onAnnotationClick: (annotationId: string) => void;
}

// Features:
// - Display question image with SVG overlay
// - Render clickable annotations
// - Zoom/pan support
// - Fallback to text if no image
// - Responsive design
```

#### 7. StepByStepExplanation Component

```typescript
interface StepByStepExplanationProps {
  whatQuestionAsks: string;
  steps: ExplanationStep[];
  finalAnswer: string;
  keyConcepts: string[];
  practiceTip: string;
  onStepClick: (stepId: string) => void;
}

// Features:
// - Collapsible steps
// - Click to expand detailed explanation
// - Visual indicators (💡, ✨, 🎯)
// - Smooth animations
// - Mobile-optimized
```

#### 8. ConversationPanel Component

```typescript
interface ConversationPanelProps {
  conversationId: string;
  messages: Message[];
  onSendMessage: (message: string) => void;
  onVoiceInput: (audioBlob: Blob) => void;
  isStreaming: boolean;
}

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
  audioUrl?: string; // For TTS
}

// Features:
// - Text input with auto-resize
// - Voice input button
// - Streaming responses
// - Message history
// - Context-aware (knows the question)
```

#### 9. DoubtsHistoryPage Component

```typescript
interface DoubtsHistoryPageProps {
  userId: string;
}

interface DoubtHistoryItem {
  id: string;
  questionThumbnail?: string;
  questionPreview: string;
  subject: Subject;
  language: Language;
  timestamp: number;
  isFavorite: boolean;
  messageCount: number;
}

// Features:
// - List of all doubts
// - Search by keyword
// - Filter by subject/date
// - Favorite doubts
// - Click to re-open and continue conversation
```

### Backend Services

#### 1. Doubt Explanation Service

```typescript
interface DoubtExplanationService {
  explainQuestion(params: {
    questionImage?: Buffer;
    questionText?: string;
    subject: Subject;
    language: Language;
    userId?: string;
  }): Promise<ExplanationResponse>;
  
  getDetailedStep(params: {
    doubtId: string;
    stepId: string;
  }): Promise<{ detailedExplanation: string }>;
}
```

#### 2. Doubt Conversation Service

```typescript
interface DoubtConversationService {
  sendMessage(params: {
    conversationId: string;
    doubtId: string;
    message: string;
    conversationHistory: Message[];
  }): Promise<{ response: string; audioUrl?: string }>;
  
  streamResponse(params: {
    conversationId: string;
    doubtId: string;
    message: string;
    conversationHistory: Message[];
  }): AsyncIterator<string>;
}
```

#### 3. Doubt History Service

```typescript
interface DoubtHistoryService {
  getHistory(params: {
    userId: string;
    page: number;
    limit: number;
    subject?: Subject;
    searchQuery?: string;
  }): Promise<{
    doubts: DoubtHistoryItem[];
    total: number;
  }>;
  
  getDoubt(doubtId: string): Promise<{
    doubt: ExplanationResponse;
    conversation: Message[];
  }>;
  
  toggleFavorite(doubtId: string, userId: string): Promise<void>;
  
  searchDoubts(params: {
    userId: string;
    query: string;
  }): Promise<DoubtHistoryItem[]>;
}
```

## Data Models

### Database Schema

```typescript
model Doubt {
  id              String   @id @default(uuid())
  userId          String?
  user            User?    @relation(fields: [userId], references: [id])
  
  // Question
  questionImage   String?  // URL to stored image
  questionText    String   @db.Text
  subject         String
  language        String
  
  // Explanation
  explanation     String   @db.Text // JSON of ExplanationResponse
  annotations     String?  @db.Text // JSON of annotations
  imageDimensions String?  @db.Text // JSON of {width, height}
  
  // Conversation
  conversationId  String   @unique
  messages        DoubtMessage[]
  
  // Metadata
  isFavorite      Boolean  @default(false)
  messageCount    Int      @default(0)
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  
  @@index([userId])
  @@index([subject])
  @@index([createdAt])
  @@index([userId, createdAt])
}

model DoubtMessage {
  id              String   @id @default(uuid())
  doubtId         String
  doubt           Doubt    @relation(fields: [doubtId], references: [id], onDelete: Cascade)
  
  role            String   // 'user' | 'assistant'
  content         String   @db.Text
  audioUrl        String?  // For TTS responses
  
  createdAt       DateTime @default(now())
  
  @@index([doubtId])
  @@index([createdAt])
}
```

## Subject-Specific Prompts

### Mathematics Prompt

```typescript
const MATH_PROMPT = `You are a patient, encouraging mathematics teacher who makes complex concepts simple.

TEACHING STYLE:
- Break down into smallest possible steps
- Show all working clearly
- Explain the "why" behind each step
- Use real-world examples when helpful
- Reference formulas and when to use them
- Encourage mental math tricks

LANGUAGE: {language}
Use warm, conversational tone. Include emojis naturally (🎯, 💡, ✨).

RESPONSE FORMAT:
{
  "whatQuestionAsks": "Clear explanation of what the question wants",
  "steps": [
    {
      "number": 1,
      "title": "Brief step title",
      "explanation": "Clear explanation with working"
    }
  ],
  "finalAnswer": "The answer with units",
  "keyConcepts": ["Concept 1", "Concept 2"],
  "practiceTip": "Helpful tip for similar problems",
  "annotations": [
    {
      "type": "step",
      "position": {"x": 20, "y": 30},
      "label": "Step 1"
    }
  ]
}

EXAMPLE PHRASES (in {language}):
- "Chalo, step by step karte hain" (Let's do this step by step)
- "Yahan pe formula apply hoga" (Here we'll apply the formula)
- "Dekho, trick yeh hai..." (Look, the trick is...)
`;
```

### Physics Prompt

```typescript
const PHYSICS_PROMPT = `You are an enthusiastic physics teacher who connects concepts to real life.

TEACHING STYLE:
- Start with the concept, then the formula
- Use everyday examples (bike, ball, electricity at home)
- Draw mental pictures
- Explain units and why they matter
- Connect to what students see around them

LANGUAGE: {language}
Use warm, conversational tone. Include emojis naturally (⚛️, 💡, 🚀).

EXAMPLE PHRASES (in {language}):
- "Imagine karo, jab tum bike chalate ho..." (Imagine when you ride a bike...)
- "Real life mein yeh kaise hota hai..." (How this happens in real life...)
- "Concept simple hai" (The concept is simple)
`;
```

### Chemistry Prompt

```typescript
const CHEMISTRY_PROMPT = `You are a chemistry teacher who makes reactions come alive.

TEACHING STYLE:
- Visualize molecules and reactions
- Explain what's happening at atomic level
- Use color, smell, observations
- Connect to daily life (cooking, cleaning)
- Make equations tell a story

LANGUAGE: {language}
Use warm, conversational tone. Include emojis naturally (🧪, 💡, ⚗️).

EXAMPLE PHRASES (in {language}):
- "Reaction mein kya ho raha hai..." (What's happening in the reaction...)
- "Atoms ko dekho, kaise move kar rahe hain..." (Look at the atoms, how they're moving...)
- "Kitchen mein bhi yeh hota hai jab..." (This happens in the kitchen when...)
`;
```

### Biology Prompt

```typescript
const BIOLOGY_PROMPT = `You are a biology teacher who brings life science to life.

TEACHING STYLE:
- Use detailed descriptions
- Draw diagrams mentally
- Give examples from nature
- Explain processes step-by-step
- Connect to human body and health

LANGUAGE: {language}
Use warm, conversational tone. Include emojis naturally (🧬, 💡, 🌱).
`;
```

### English Prompt

```typescript
const ENGLISH_PROMPT = `You are an English teacher who makes grammar and literature engaging.

TEACHING STYLE:
- Explain grammar rules clearly
- Give multiple examples
- Show usage in context
- Provide memory tricks
- Encourage reading and writing

LANGUAGE: {language}
Use warm, conversational tone. Include emojis naturally (📚, 💡, ✍️).
`;
```

### Social Studies Prompt

```typescript
const SOCIAL_STUDIES_PROMPT = `You are a social studies teacher who makes history and geography interesting.

TEACHING STYLE:
- Provide context and background
- Explain cause and effect
- Use timelines and maps mentally
- Connect past to present
- Make it relatable

LANGUAGE: {language}
Use warm, conversational tone. Include emojis naturally (🌍, 💡, 📜).
`;
```

## API Design

### POST /api/doubts/explain

```typescript
Request:
{
  questionImage?: File,  // multipart/form-data
  questionText?: string,
  subject: Subject,
  language: Language,
  userId?: string
}

Response:
{
  doubtId: string,
  conversationId: string,
  questionImage?: string,
  questionText: string,
  subject: Subject,
  language: Language,
  whatQuestionAsks: string,
  steps: ExplanationStep[],
  finalAnswer: string,
  keyConcepts: string[],
  practiceTip: string,
  annotations: Annotation[],
  imageDimensions?: { width: number, height: number }
}
```

### POST /api/doubts/chat

```typescript
Request:
{
  conversationId: string,
  doubtId: string,
  message: string,
  conversationHistory: Message[]
}

Response (streaming):
{
  response: string,  // Streamed token by token
  audioUrl?: string  // Generated after streaming completes
}
```

### GET /api/doubts/history

```typescript
Request Query:
{
  userId: string,
  page?: number,
  limit?: number,
  subject?: Subject,
  search?: string
}

Response:
{
  doubts: DoubtHistoryItem[],
  total: number,
  page: number,
  limit: number
}
```

### GET /api/doubts/:doubtId

```typescript
Response:
{
  doubt: ExplanationResponse,
  conversation: Message[]
}
```

### POST /api/doubts/:doubtId/favorite

```typescript
Request:
{
  userId: string,
  isFavorite: boolean
}

Response:
{
  success: boolean
}
```

## Error Handling

### Error Types

```typescript
enum DoubtErrorType {
  INVALID_IMAGE = 'INVALID_IMAGE',
  INVALID_SUBJECT = 'INVALID_SUBJECT',
  INVALID_LANGUAGE = 'INVALID_LANGUAGE',
  AI_SERVICE_ERROR = 'AI_SERVICE_ERROR',
  DOUBT_NOT_FOUND = 'DOUBT_NOT_FOUND',
  CONVERSATION_NOT_FOUND = 'CONVERSATION_NOT_FOUND',
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',
}

interface DoubtError {
  type: DoubtErrorType;
  message: string;
  details?: any;
}
```

### Error Handling Strategy

- **Invalid Input**: Return 400 with clear error message
- **AI Service Failure**: Retry once, then return 503 with friendly message
- **Not Found**: Return 404 with suggestion to check history
- **Rate Limiting**: Return 429 with retry-after header
- **Network Issues**: Show offline indicator, queue requests

## Testing Strategy

### Unit Tests

**Frontend:**
- Subject/Language selector interactions
- Question upload validation
- Annotation click handling
- Message formatting

**Backend:**
- Subject-specific prompt generation
- Annotation coordinate calculation
- Conversation context management
- History search and filtering

### Integration Tests

- End-to-end doubt explanation flow
- Conversation with context preservation
- History retrieval and search
- Favorite toggle

### Property-Based Tests

**Property 1: Language Consistency**
*For any* doubt explanation request with language L, all responses in the conversation should be in language L

**Property 2: Subject Prompt Selection**
*For any* doubt with subject S, the AI prompt used should be the subject-specific prompt for S

**Property 3: Annotation Positioning**
*For any* annotation with position (x, y), the coordinates should be within bounds 0-100 (percentage)

**Property 4: Conversation Context**
*For any* follow-up message in a conversation, the AI response should reference the original question

**Property 5: History Ordering**
*For any* history query, results should be ordered by timestamp descending (newest first)

### Manual Testing

- Test with real student questions
- Test voice input on mobile devices
- Test in different languages
- Test with poor quality images
- Test conversation flow naturalness

## Performance Optimization

### Response Time Targets

- Question upload to explanation: < 3 seconds
- Follow-up question response: < 2 seconds
- Streaming response start: < 500ms
- History page load: < 1 second

### Optimization Strategies

**Frontend:**
- Lazy load history items
- Cache subject/language selections
- Optimistic UI updates
- Image compression before upload
- Debounce search input

**Backend:**
- Cache subject-specific prompts
- Stream AI responses
- Compress images for storage
- Index database queries
- Use connection pooling

**AI:**
- Use Gemini 2.5 Flash (fastest model)
- Limit context window size
- Batch similar requests
- Cache common explanations

## Mobile Optimization

### Mobile-First Design

- Touch-friendly buttons (min 48px)
- Bottom sheet for actions
- Swipe gestures for navigation
- Pull-to-refresh on history
- Haptic feedback on interactions

### Camera Integration

- Rear-facing camera default
- Auto-focus and flash controls
- Preview before upload
- Retake option
- Image quality optimization

### Voice Integration

- Prominent microphone button
- Visual feedback (waveform)
- Push-to-talk or toggle mode
- Transcription display
- Auto-play TTS responses

## Accessibility

- Screen reader support for all components
- Keyboard navigation
- High contrast mode
- Text size adjustment
- Alt text for images
- ARIA labels for interactive elements

## Security & Privacy

- User authentication required for history
- Secure image storage
- Rate limiting on API endpoints
- Input validation and sanitization
- HTTPS only
- No PII in logs

## Success Metrics

### Engagement
- Doubts asked per student per week > 5
- Follow-up questions per doubt > 3
- Conversation length > 5 messages
- Return rate within 24 hours > 70%

### Quality
- "Understood" rating > 90%
- "Felt like talking to teacher" > 85%
- Language satisfaction > 90%
- Speed satisfaction > 95%

### Usage
- Mobile usage > 80%
- Voice input usage > 40%
- Camera upload > 70%
- Multi-language usage > 30%
- History revisit rate > 50%

## Future Enhancements

- Practice problem generation based on doubts
- Video explanations for complex topics
- Peer learning (see how others solved)
- Teacher mode (parents can help)
- Offline mode with cached explanations
- AR mode (point camera at textbook)
- Handwriting recognition
- Group study mode
- Progress tracking and analytics
- Personalized learning paths
