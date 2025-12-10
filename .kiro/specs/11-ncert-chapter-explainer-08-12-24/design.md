# NCERT Chapter Quick Explainer - Design Document

## Overview

The NCERT Chapter Quick Explainer provides CBSE Class 6-10 students with 60-90 second audio explanations of any NCERT chapter across all subjects (English, Science, Math, Social Studies). The system uses AI to generate subject-specific content, caches audio to minimize ElevenLabs costs, and tracks student progress. The feature integrates with the existing AI service and implements intelligent audio caching with visual indicators.

## Architecture

### High-Level Components

```
┌─────────────────┐
│  React Frontend │
│ NCERTExplainer  │
│     Page        │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Express API    │
│  /api/ncert-    │
│   explainer/*   │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ NCERTExplainer  │
│    Service      │
└────────┬────────┘
         │
    ┌────┴────┬──────────┐
    ▼         ▼          ▼
┌────────┐ ┌──────┐ ┌─────────┐
│   AI   │ │Audio │ │  TTS    │
│Service │ │Cache │ │ Service │
└────────┘ │Service│ └─────────┘
           └───────┘
```

### Data Flow

1. Student selects class, subject, and chapter
2. Frontend sends request to API
3. Service checks audio cache first
4. If cache hit: serve cached audio (blue indicator)
5. If cache miss: generate AI content → TTS → cache → serve (green indicator)
6. Frontend plays audio with source indicator
7. Student can ask follow-up questions
8. Service tracks progress and completion

### Audio Caching Strategy

```
┌──────────────┐
│ Request      │
│ Chapter Audio│
└──────┬───────┘
       │
       ▼
┌──────────────┐     Yes    ┌──────────────┐
│ Check Cache  │─────────────│ Serve Cached │
│ audioCacheSvc│             │ (BLUE badge) │
└──────┬───────┘             └──────────────┘
       │ No
       ▼
┌──────────────┐
│ Generate AI  │
│ Content      │
└──────┬───────┘
       │
       ▼
┌──────────────┐
│ Call TTS API │
│ (ElevenLabs) │
└──────┬───────┘
       │
       ▼
┌──────────────┐
│ Cache Audio  │
│ File         │
└──────┬───────┘
       │
       ▼
┌──────────────┐
│ Serve Fresh  │
│(GREEN badge) │
└──────────────┘
```

## Components and Interfaces

### Frontend Component: NCERTExplainerPage

**Location**: `client/src/pages/NCERTExplainerPage.tsx`

**State Management**:
```typescript
interface ExplainerSession {
  class: string; // "6" to "10"
  subject: string; // "English", "Science", "Math", "SST"
  chapterId: string;
  chapterName: string;
  phase: 'summary' | 'followup' | 'complete';
  content: string;
  audioUrl?: string;
  audioSource?: 'cache' | 'elevenlabs'; // For UI indicator
  cacheKey?: string;
}

interface ChapterHistory {
  chapterId: string;
  chapterName: string;
  subject: string;
  class: string;
  studiedAt: string;
  revised: boolean;
}

interface AudioMetadata {
  source: 'cache' | 'elevenlabs';
  cacheKey: string;
  timestamp: string;
  fileSize?: number;
}
```

**Key Features**:
- Class selector (6-10)
- Subject selector with icons
- Chapter dropdown (dynamic based on subject)
- Audio player with source indicator (blue/green badge)
- Follow-up question input
- Progress tracking with completion badges
- History display with revision status
- Developer mode for cache debugging

### Backend Service: ncertExplainerService

**Location**: `server/services/ncertExplainerService.ts`

**Interface**:
```typescript
interface NCERTExplainerService {
  getChapterSummary(request: ChapterRequest): Promise<ChapterResponse>;
  answerFollowUp(request: FollowUpRequest): Promise<FollowUpResponse>;
  getChapterList(class: string, subject: string): Promise<ChapterInfo[]>;
  getStudyHistory(userId: string): Promise<ChapterHistory[]>;
  getProgress(userId: string): Promise<ProgressStats>;
}

interface ChapterRequest {
  class: string;
  subject: string;
  chapterId: string;
  userId: string;
  languageCode?: string;
}

interface ChapterResponse {
  chapterId: string;
  chapterName: string;
  summary: string;
  audioUrl: string;
  audioMetadata: AudioMetadata;
  duration: number;
  ncertPages?: string;
}

interface FollowUpRequest {
  chapterId: string;
  question: string;
  userId: string;
  languageCode?: string;
}

interface FollowUpResponse {
  answer: string;
  audioUrl?: string;
  audioMetadata?: AudioMetadata;
  relatedTopics?: string[];
}
```

### Audio Cache Service: audioCacheService

**Location**: `server/services/audioCacheService.ts`

**Interface**:
```typescript
interface AudioCacheService {
  getOrGenerate(
    key: string,
    textContent: string,
    options: CacheOptions
  ): Promise<AudioCacheResult>;
  
  getCached(key: string): Promise<AudioCacheResult | null>;
  
  saveToCache(
    key: string,
    audioBuffer: Buffer,
    metadata: CacheMetadata
  ): Promise<void>;
  
  invalidateCache(key: string): Promise<void>;
  
  getCacheStats(): Promise<CacheStats>;
  
  warmCache(keys: string[]): Promise<void>;
}

interface CacheOptions {
  module: string; // 'ncert', 'revision', 'doubts', 'worksheets'
  voiceId?: string;
  languageCode?: string;
  version?: string;
}

interface AudioCacheResult {
  audioUrl: string;
  source: 'cache' | 'elevenlabs';
  cacheKey: string;
  metadata: CacheMetadata;
}

interface CacheMetadata {
  generatedAt: string;
  fileSize: number;
  characterCount: number;
  voiceId: string;
  languageCode: string;
  version: string;
}

interface CacheStats {
  totalFiles: number;
  totalSize: number;
  hitCount: number;
  missCount: number;
  hitRatio: number;
  costSaved: number;
}
```

### Cache Key Generation

**Format**: `{module}_{subject}_{class}_{identifier}_{language}_{version}`

**Examples**:
- `ncert_science_7_ch3_en_v1.mp3`
- `ncert_english_9_beehive_ch1_en_v1.mp3`
- `ncert_math_10_quadrilaterals_en_v1.mp3`
- `ncert_sst_history_8_ch2_hi_v1.mp3`
- `revision_math_9_quadrilaterals_explanation_en_v1.mp3`

**Key Generation Function**:
```typescript
function generateCacheKey(params: CacheKeyParams): string {
  const {
    module,
    subject,
    class: className,
    identifier,
    language = 'en',
    version = 'v1'
  } = params;
  
  const sanitized = identifier
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '_')
    .replace(/_+/g, '_');
  
  return `${module}_${subject}_${className}_${sanitized}_${language}_${version}.mp3`;
}
```

### API Endpoints

**POST /api/ncert-explainer/chapter-summary**
- Request: `{ class: string, subject: string, chapterId: string }`
- Response: `{ chapterId, chapterName, summary, audioUrl, audioMetadata, duration, ncertPages }`

**POST /api/ncert-explainer/followup**
- Request: `{ chapterId: string, question: string }`
- Response: `{ answer: string, audioUrl?, audioMetadata?, relatedTopics? }`

**GET /api/ncert-explainer/chapters?class=7&subject=Science**
- Response: `{ chapters: ChapterInfo[] }`

**GET /api/ncert-explainer/history**
- Response: `{ history: ChapterHistory[] }`

**GET /api/ncert-explainer/progress**
- Response: `{ totalStudied: number, bySubject: {}, completionBadges: [] }`

**GET /api/ncert-explainer/cache/stats** (Admin only)
- Response: `{ totalFiles, totalSize, hitRatio, costSaved }`

**POST /api/ncert-explainer/cache/warm** (Admin only)
- Request: `{ chapters: string[] }`
- Response: `{ warmed: number, failed: number }`

## Data Models

### Database Schema (Prisma)

```prisma
model NCERTChapterStudy {
  id            String   @id @default(cuid())
  userId        String
  user          User     @relation(fields: [userId], references: [id])
  
  // Chapter identification
  class         String   // "6" to "10"
  subject       String   // "English", "Science", "Math", "SST"
  chapterId     String
  chapterName   String
  
  // Study tracking
  studiedAt     DateTime @default(now())
  revised       Boolean  @default(false)
  completedSummary Boolean @default(false)
  followUpCount Int      @default(0)
  
  @@unique([userId, class, subject, chapterId])
  @@index([userId, studiedAt])
  @@index([class, subject])
}

model NCERTProgress {
  id                String   @id @default(cuid())
  userId            String   @unique
  user              User     @relation(fields: [userId], references: [id])
  
  totalChapters     Int      @default(0)
  completionBadges  String   @default("[]") @db.Text // JSON array
  lastStudied       DateTime @default(now())
  
  // Subject-wise counts (JSON)
  englishCount      Int      @default(0)
  scienceCount      Int      @default(0)
  mathCount         Int      @default(0)
  sstCount          Int      @default(0)
  
  @@index([userId])
}

// Audio cache registry (optional - can use filesystem only)
model AudioCacheRegistry {
  id            String   @id @default(cuid())
  cacheKey      String   @unique
  
  module        String
  subject       String?
  class         String?
  identifier    String
  language      String   @default("en")
  version       String   @default("v1")
  
  filePath      String
  fileSize      Int
  characterCount Int
  
  generatedAt   DateTime @default(now())
  lastAccessed  DateTime @default(now())
  accessCount   Int      @default(0)
  
  @@index([module, subject, class])
  @@index([lastAccessed])
}
```

### Chapter Data Structure

Store chapter metadata in JSON or database:

```typescript
interface ChapterData {
  chapters: {
    [subject: string]: {
      [class: string]: ChapterInfo[];
    };
  };
}

interface ChapterInfo {
  id: string;
  name: string;
  bookName?: string; // e.g., "Beehive", "First Flight"
  chapterNumber: number;
  type?: 'prose' | 'poetry' | 'theory' | 'exercise';
  ncertPages?: string; // e.g., "12-18"
  summary?: string; // Pre-written summary template
}
```

**Example**:
```json
{
  "English": {
    "9": [
      {
        "id": "beehive_ch1",
        "name": "The Fun They Had",
        "bookName": "Beehive",
        "chapterNumber": 1,
        "type": "prose",
        "ncertPages": "4-7"
      }
    ]
  },
  "Science": {
    "7": [
      {
        "id": "science_7_ch3",
        "name": "Fibre to Fabric",
        "chapterNumber": 3,
        "ncertPages": "28-35"
      }
    ]
  }
}
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do.*

### Property 1: Audio Cache Consistency
*For any* chapter summary request, when the cache key exists and file is valid, the system SHALL serve cached audio WITHOUT calling ElevenLabs API.
**Validates: Requirements 7.1, 7.2, 7.13**

### Property 2: Cache Source Transparency
*For any* audio served, the response SHALL include metadata indicating source ('cache' or 'elevenlabs') and SHALL display appropriate UI indicator (blue for cache, green for ElevenLabs).
**Validates: Requirements 10.1, 10.2, 10.3, 10.14, 10.15**

### Property 3: Multi-Subject Content Appropriateness
*For any* chapter explanation, when subject is English, content SHALL include plot/characters/theme; when Science, SHALL include concepts/definitions; when Math, SHALL include formulas/theorems; when SST, SHALL include events/dates.
**Validates: Requirements 1.2, 1.3, 1.4, 1.5, 4.1-4.13**

### Property 4: Grade-Appropriate Difficulty
*For any* chapter explanation, when class is 6-8, content SHALL use simpler vocabulary; when class is 9-10, content SHALL include advanced terminology and exam focus.
**Validates: Requirements 5.1, 5.2, 5.3, 5.4, 5.5, 5.6**

### Property 5: Cache Key Uniqueness
*For any* cached audio, the cache key SHALL uniquely identify the module, subject, class, chapter, and language, ensuring no collisions between different content.
**Validates: Requirements 10.9, 10.10, 10.11**

### Property 6: Follow-up Dynamic Content
*For any* follow-up question, when content is unique, audio SHALL NOT be cached; when question matches common pattern, audio MAY be cached with question hash.
**Validates: Requirements 7.14, 7.15, 7.16**

### Property 7: Progress Tracking Persistence
*For any* completed chapter study, the system SHALL record the chapter in user's history and SHALL mark as "studied" for progress tracking.
**Validates: Requirements 9.1, 9.2, 9.5**

### Property 8: Multi-Module Cache Reusability
*For any* module (NCERT, Revision, Doubts, Worksheets), when using audio cache service, cache keys SHALL follow standard format and SHALL be accessible across modules.
**Validates: Requirements 11.16, 11.17, 11.20, 11.21**

## Error Handling

### Client-Side Error Handling

1. **Network Failures**
   - Display user-friendly error message
   - Offer retry option
   - Cache last request for recovery

2. **Audio Playback Failures**
   - Fall back to text display
   - Show error icon instead of source badge
   - Allow manual retry

3. **Chapter Loading Failures**
   - Show skeleton loader
   - Retry with exponential backoff
   - Suggest cached chapters as alternatives

### Server-Side Error Handling

1. **AI Service Failures**
   - Retry with exponential backoff (max 3 attempts)
   - Fall back to pre-written chapter summaries
   - Log error with context

2. **TTS Service Failures**
   - Check cache first before TTS call
   - If TTS fails, return text-only response
   - Log error and increment miss count

3. **Cache Service Failures**
   - If cache read fails, proceed to TTS generation
   - If cache write fails, still serve audio (just won't be cached)
   - Log cache errors separately for monitoring

4. **Invalid Input**
   - Validate class (6-10)
   - Validate subject (English, Science, Math, SST)
   - Validate chapter exists
   - Return 400 with suggestions

### Error Response Format

```typescript
interface ErrorResponse {
  error: string;
  code: string;
  details?: any;
  suggestions?: string[];
  fallbackContent?: string; // For text-only fallback
}
```

## Testing Strategy

### Unit Tests

**Frontend Tests** (`NCERTExplainerPage.test.tsx`):
- Class and subject selection
- Chapter loading and display
- Audio playback with source indicator
- Follow-up question submission
- History and progress display
- Cache badge color coding

**Backend Tests** (`ncertExplainerService.test.ts`):
- Chapter summary generation
- Subject-specific content validation
- Follow-up question handling
- Progress tracking logic
- Chapter list retrieval

**Cache Tests** (`audioCacheService.test.ts`):
- Cache key generation uniqueness
- Cache hit/miss logic
- File integrity verification
- Cache stats calculation
- LRU eviction (if implemented)

### Property-Based Tests

Use **fast-check** library:

**Test 1: Cache Key Uniqueness**
```typescript
fc.assert(
  fc.property(
    fc.constantFrom('ncert', 'revision', 'doubts'),
    fc.constantFrom('Science', 'Math', 'English', 'SST'),
    fc.integer({ min: 6, max: 10 }).map(String),
    fc.string(),
    fc.constantFrom('en', 'hi'),
    (module, subject, cls, id, lang) => {
      const key1 = generateCacheKey({ module, subject, class: cls, identifier: id, language: lang });
      const key2 = generateCacheKey({ module, subject, class: cls, identifier: id, language: lang });
      expect(key1).toBe(key2); // Deterministic
      
      const key3 = generateCacheKey({ module, subject, class: cls, identifier: id + 'x', language: lang });
      expect(key1).not.toBe(key3); // Different inputs = different keys
    }
  )
);
```

**Test 2: Cache Source Indicator**
```typescript
fc.assert(
  fc.property(
    fc.string(), // chapterId
    fc.boolean(), // cache exists
    async (chapterId, cacheExists) => {
      const response = await getChapterSummary({ chapterId, ... });
      if (cacheExists) {
        expect(response.audioMetadata.source).toBe('cache');
      } else {
        expect(response.audioMetadata.source).toBe('elevenlabs');
      }
    }
  )
);
```

**Test 3: Subject-Specific Content**
```typescript
fc.assert(
  fc.property(
    fc.constantFrom('English', 'Science', 'Math', 'SST'),
    async (subject) => {
      const response = await getChapterSummary({ subject, ... });
      
      if (subject === 'English') {
        expect(response.summary).toMatch(/plot|character|theme/i);
      } else if (subject === 'Science') {
        expect(response.summary).toMatch(/concept|definition|experiment/i);
      } else if (subject === 'Math') {
        expect(response.summary).toMatch(/formula|theorem|equation/i);
      } else if (subject === 'SST') {
        expect(response.summary).toMatch(/event|date|cause|effect/i);
      }
    }
  )
);
```

### Integration Tests

1. **End-to-End Chapter Study Flow**
   - Select chapter → Get summary → Play audio → Mark complete → Check history

2. **Cache Workflow**
   - Request chapter (cache miss) → Verify green badge → Request again (cache hit) → Verify blue badge

3. **Multi-Subject Coverage**
   - Test all 4 subjects with different chapters
   - Verify subject-specific content structure

4. **Follow-up Question Flow**
   - Complete summary → Ask follow-up → Verify dynamic response

### Manual Testing Checklist

- [ ] Test all class levels (6-10)
- [ ] Test all 4 subjects
- [ ] Verify blue badge for cached audio
- [ ] Verify green badge for fresh ElevenLabs audio
- [ ] Check console logs for cache hits/misses
- [ ] Test follow-up questions
- [ ] Verify progress tracking
- [ ] Test on mobile devices
- [ ] Check audio quality
- [ ] Verify NCERT page references

## Implementation Notes

### AI Prompt Engineering

#### English Chapter Summary (Prose)
```
You are explaining the NCERT Class {class} English chapter "{chapterName}" from {bookName}.

Provide a 60-second summary in simple Hinglish covering:
1. Plot Summary - What happens in the story
2. Main Characters - Who are the key people and their roles
3. Theme/Moral - What lesson or message does it teach
4. Literary Devices - One or two devices used (metaphor, simile, etc.)
5. Exam Tip - One important point for exams

Keep it conversational and engaging. Use Hinglish phrases naturally.
NCERT Pages: {ncertPages}
```

#### English Chapter Summary (Poetry)
```
You are explaining the NCERT Class {class} poem "{chapterName}" from {bookName}.

Provide a 60-second summary in simple Hinglish covering:
1. Stanza-wise Summary - Brief meaning of each stanza
2. Poetic Devices - Rhyme, rhythm, metaphor, personification used
3. Central Idea - Main message or feeling
4. Word Meanings - 3-4 important difficult words
5. Exam Tip - What questions usually come from this poem

Keep it simple and musical in tone.
```

#### Science Chapter Summary
```
You are explaining the NCERT Class {class} Science chapter "{chapterName}".

Provide a 70-second summary in simple Hinglish covering:
1. Introduction - What is this chapter about
2. Key Concepts - Main scientific ideas (3-4 points)
3. Definitions - Important terms defined simply
4. Diagrams - Brief description of important diagrams (verbal explanation)
5. Real-life Application - Where do we see this in daily life
6. Exam Tip - Common question types

Use scientific terms but explain them simply.
NCERT Pages: {ncertPages}
```

#### Math Chapter Summary
```
You are explaining the NCERT Class {class} Math chapter "{chapterName}".

Provide a 70-second summary in simple Hinglish covering:
1. Concept Introduction - What new math topic is this
2. Formulas - List all important formulas with meaning
3. Theorems - Any key theorems (statement only, not proof)
4. Solving Steps - General approach to solve problems
5. Common Mistakes - What students often get wrong
6. Exam Tip - Which types of sums are important

Be clear and methodical.
```

#### Social Studies Chapter Summary
```
You are explaining the NCERT Class {class} {subSubject} chapter "{chapterName}".
(subSubject: History/Geography/Civics)

For History:
1. Background - What was happening before
2. Events - Main events in chronological order
3. Key Figures - Important people and their roles
4. Causes - Why did this happen
5. Effects/Impact - What were the results
6. Exam Tip - Dates and connections to remember

For Geography:
1. Location - Where is this place/feature
2. Physical Features - Mountains, rivers, climate
3. Resources - Natural resources available
4. Human Activities - How people use this region
5. Map Work - Important locations to mark
6. Exam Tip - Map-based questions

For Civics:
1. Concept - What is the main idea
2. Institutions - Government bodies/organizations involved
3. Rights/Duties - Relevant rights or responsibilities
4. Real Examples - Current affairs or examples
5. Exam Tip - Application questions

Keep it factual and clear.
```

### TTS Optimization with Caching

1. **Cache Strategy**:
   - Always check cache before calling ElevenLabs
   - Cache all chapter summaries (fixed content)
   - Cache common follow-ups with question hash
   - Never cache unique/dynamic follow-ups

2. **Voice Configuration**:
   - Use Indian English voice (from languages.ts config)
   - Adjust speech rate for clarity (0.9x)
   - Use proper SSML pauses for better listening

3. **Cost Tracking**:
   - Log every cache hit with cost saved
   - Log every API call with character count
   - Track monthly savings in cache stats

### Performance Considerations

- **Pre-warming**: Cache popular Class 9-10 chapters before exams
- **CDN**: Serve cached audio files via CDN for faster delivery
- **Lazy Loading**: Load chapter lists on-demand by subject
- **Pagination**: Limit history to last 50 chapters
- **Cleanup**: Archive audio cache older than 6 months (but keep registry)

### Mobile Responsiveness

- Ensure audio player controls are touch-friendly (min 44px)
- Make class/subject/chapter selectors mobile-optimized
- Show cache badge prominently on mobile
- Support background audio playback
- Handle screen lock gracefully
- Optimize for slow networks (show loading states)

### Railway Deployment

**Audio Cache Directory Structure**:
```
server/audio-cache/
├── ncert/
│   ├── science/
│   │   ├── 6/
│   │   ├── 7/
│   │   └── ...
│   ├── english/
│   ├── math/
│   └── sst/
├── revision/
├── doubts/
└── worksheets/
```

**Railway Volume Mount**:
- Mount persistent volume at `/app/server/audio-cache`
- Ensure directory permissions (read/write)
- Add to `.gitignore`: `server/audio-cache/*`
- Keep `.gitkeep` file in base directory

**Environment Variables**:
```
AUDIO_CACHE_PATH=/app/server/audio-cache
AUDIO_CACHE_MAX_SIZE=500MB
ENABLE_CACHE_WARMING=true
```

