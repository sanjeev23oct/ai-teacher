# Question Paper + Answer Sheet Matching - Design

## Architecture

```
┌─────────────────────────────────────────────────────┐
│                    Frontend                          │
│  ┌──────────────────┐  ┌──────────────────────┐   │
│  │ Upload Mode      │  │ Dual Upload          │   │
│  │ Selection        │  │ Component            │   │
│  └──────────────────┘  └──────────────────────┘   │
└─────────────────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────┐
│                  Backend API                         │
│  ┌──────────────────────────────────────────────┐  │
│  │ /api/grade (enhanced)                        │  │
│  │ - Accepts 1 or 2 images                      │  │
│  │ - Detects mode automatically                 │  │
│  │ - Processes accordingly                      │  │
│  └──────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────┐
│                 Gemini 2.5 Flash                     │
│  ┌──────────────────────────────────────────────┐  │
│  │ Enhanced Prompt:                             │  │
│  │ 1. Identify document type                    │  │
│  │ 2. Extract questions/answers with numbers    │  │
│  │ 3. Match answers to questions                │  │
│  │ 4. Grade matched pairs                       │  │
│  └──────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────┘
```

## Data Models

### Upload Mode

```typescript
type UploadMode = 'single' | 'dual';

interface UploadState {
  mode: UploadMode;
  singleImage?: File;
  questionPaper?: File;
  answerSheet?: File;
}
```

### Enhanced Grading Request

```typescript
interface GradingRequest {
  mode: 'single' | 'dual';
  
  // Single mode
  exam?: File;
  
  // Dual mode
  questionPaper?: File;
  answerSheet?: File;
}
```

### Enhanced Grading Response

```typescript
interface GradingResponse {
  // Existing fields
  subject: string;
  language: string;
  gradeLevel: string;
  totalScore: string;
  feedback: string;
  imageDimensions: { width: number; height: number };
  annotations: Annotation[];
  
  // New: Matching information
  matchingInfo?: {
    mode: 'single' | 'dual';
    totalQuestions: number;
    answeredQuestions: number;
    unansweredQuestions: string[];
    unmatchedAnswers: string[];
    matchingConfidence: 'high' | 'medium' | 'low';
  };
  
  // Enhanced detailed analysis
  detailedAnalysis: QuestionAnalysis[];
}

interface QuestionAnalysis {
  id: string;
  questionNumber: string;
  question: string;
  studentAnswer: string | null;
  correct: boolean;
  score: string;
  remarks: string;
  topic?: string;
  concept?: string;
  position?: { x: number; y: number };
  
  // New: Matching info
  matched: boolean;
  matchConfidence?: number; // 0-1
  answerLocation?: 'found' | 'not-attempted' | 'unclear';
}
```

## Component Design

### 1. UploadModeSelector Component

```typescript
interface UploadModeSelectorProps {
  onModeSelect: (mode: UploadMode) => void;
}

// Shows two cards:
// - Single Image mode
// - Dual Image mode
```

### 2. DualUploadComponent

```typescript
interface DualUploadComponentProps {
  onUpload: (questionPaper: File, answerSheet: File) => void;
  isUploading: boolean;
}

// Features:
// - Two separate upload areas
// - Clear labels
// - Preview both images
// - Validation (both required)
```

### 3. Enhanced ExamUpload Component

```typescript
interface ExamUploadProps {
  mode: UploadMode;
  onSingleUpload: (file: File) => void;
  onDualUpload: (questionPaper: File, answerSheet: File) => void;
  isUploading: boolean;
}

// Renders different UI based on mode
```

## API Design

### Enhanced Grading Endpoint

```typescript
POST /api/grade

Content-Type: multipart/form-data

// Single mode
Fields:
- mode: "single"
- exam: File

// Dual mode
Fields:
- mode: "dual"
- questionPaper: File
- answerSheet: File

Response: GradingResponse (as defined above)
```

## Gemini Prompt Design

### Single Mode Prompt (Current)
```
You are a mathematics teacher grading an exam.
Analyze this image containing both questions and answers.
[... existing prompt ...]
```

### Dual Mode Prompt (New)
```
You are a mathematics teacher grading an exam.

You have been provided with TWO images:
1. QUESTION PAPER: Contains the questions (printed or handwritten)
2. ANSWER SHEET: Contains the student's answers (handwritten)

Your task:
1. Extract all questions from the question paper with their numbers
2. Extract all answers from the answer sheet with their numbers
3. Match each answer to its corresponding question by number
4. Grade each matched answer against its question
5. Identify unanswered questions
6. Identify answers without matching questions

IMPORTANT: 
- Question numbers may be formatted as: "1", "Q1", "1.", "Question 1", etc.
- Answer numbers may be formatted as: "1", "Ans 1", "1)", "(1)", etc.
- Match based on the numeric value, ignoring formatting
- If an answer cannot be matched, mark it as "unmatched"
- If a question has no answer, mark it as "not attempted"

Return JSON with:
{
  "subject": "Mathematics",
  "language": "English",
  "gradeLevel": "Grade 9-10",
  "totalScore": "13/15",
  "feedback": "Overall assessment...",
  "matchingInfo": {
    "mode": "dual",
    "totalQuestions": 5,
    "answeredQuestions": 4,
    "unansweredQuestions": ["5"],
    "unmatchedAnswers": [],
    "matchingConfidence": "high"
  },
  "detailedAnalysis": [
    {
      "id": "q1",
      "questionNumber": "1",
      "question": "Prove Basic Proportionality Theorem",
      "studentAnswer": "Given: DE || BC...",
      "correct": true,
      "score": "5/5",
      "remarks": "Excellent proof!",
      "matched": true,
      "matchConfidence": 1.0,
      "answerLocation": "found"
    },
    {
      "id": "q5",
      "questionNumber": "5",
      "question": "Solve for x: 2x + 5 = 15",
      "studentAnswer": null,
      "correct": false,
      "score": "0/5",
      "remarks": "Not attempted",
      "matched": false,
      "answerLocation": "not-attempted"
    }
  ]
}
```

## Implementation Plan

### Phase 1: Backend Enhancement (Days 1-3)

**Day 1: API Enhancement**
- Modify `/api/grade` to accept `mode` parameter
- Handle both single and dual file uploads
- Add validation for dual mode (both files required)

**Day 2: Prompt Engineering**
- Create dual mode prompt
- Test with sample question paper + answer sheet
- Refine matching logic
- Handle edge cases

**Day 3: Response Processing**
- Parse matching information
- Generate annotations for answer sheet only
- Handle unmatched items
- Add confidence scores

### Phase 2: Frontend Implementation (Days 4-6)

**Day 4: Upload Mode Selection**
- Create UploadModeSelector component
- Add routing/state for mode selection
- Design UI for mode cards

**Day 5: Dual Upload Component**
- Create DualUploadComponent
- Two separate upload areas
- Preview both images
- Validation logic

**Day 6: Integration**
- Update GradeExamPage to handle both modes
- Send correct data to API based on mode
- Display results appropriately
- Handle errors

### Phase 3: Polish & Testing (Days 7-8)

**Day 7: Edge Cases**
- Handle swapped images
- Handle missing numbers
- Handle sub-questions
- Error messages

**Day 8: User Testing**
- Test with real question papers
- Test with various numbering formats
- Collect feedback
- Refine UX

## UI Mockups

### Mode Selection Screen

```
┌─────────────────────────────────────────────────────┐
│  ← Back                    AI Exam Grader           │
├─────────────────────────────────────────────────────┤
│                                                      │
│  How would you like to upload your exam?            │
│                                                      │
│  ┌──────────────────────┐  ┌──────────────────────┐│
│  │  📄                  │  │  📄📝                ││
│  │                      │  │                      ││
│  │  Single Image        │  │  Two Images          ││
│  │                      │  │                      ││
│  │  Questions + Answers │  │  Question Paper +    ││
│  │  in one image        │  │  Answer Sheet        ││
│  │                      │  │                      ││
│  │  Best for:           │  │  Best for:           ││
│  │  • Practice tests    │  │  • School exams      ││
│  │  • Homework          │  │  • Formal tests      ││
│  │  • Quick checks      │  │  • Separate sheets   ││
│  │                      │  │                      ││
│  │  [Select]            │  │  [Select]            ││
│  └──────────────────────┘  └──────────────────────┘│
│                                                      │
└─────────────────────────────────────────────────────┘
```

### Dual Upload Screen

```
┌─────────────────────────────────────────────────────┐
│  ← Back to Mode Selection    Upload Exam            │
├─────────────────────────────────────────────────────┤
│                                                      │
│  Step 1: Upload Question Paper                      │
│  ┌────────────────────────────────────────────┐    │
│  │  📄 Drag & drop or click to upload         │    │
│  │                                             │    │
│  │  Upload the printed question paper         │    │
│  │  (The paper with all the questions)        │    │
│  └────────────────────────────────────────────┘    │
│                                                      │
│  Step 2: Upload Answer Sheet                        │
│  ┌────────────────────────────────────────────┐    │
│  │  📝 Drag & drop or click to upload         │    │
│  │                                             │    │
│  │  Upload your handwritten answer sheet      │    │
│  │  (Your answers with question numbers)      │    │
│  └────────────────────────────────────────────┘    │
│                                                      │
│  💡 Tip: Make sure your answers have question       │
│     numbers (1, 2, 3... or Q1, Q2, Q3...)          │
│                                                      │
│  [Start Grading] (disabled until both uploaded)     │
│                                                      │
└─────────────────────────────────────────────────────┘
```

### Results with Matching Info

```
┌─────────────────────────────────────────────────────┐
│  ← Back to Upload          Score: 13/15    🔊 Voice │
├─────────────────────────────────────────────────────┤
│                                                      │
│  ℹ️ Matching Summary                                │
│  ✅ 4 answers matched to questions                  │
│  ⚠️ 1 question not attempted (Q5)                   │
│                                                      │
│  [Your Answer Sheet with Annotations]               │
│                                                      │
└─────────────────────────────────────────────────────┘
```

## Correctness Properties

### P1: Matching Accuracy
**Property:** 95%+ of answers correctly matched to questions
**Test:** Use 20 sample exams with known question-answer pairs
**Metric:** Count correct matches / total matches

### P2: Number Format Handling
**Property:** System handles all common numbering formats
**Test:** Test with "1", "Q1", "1.", "Question 1", "Ans 1", etc.
**Metric:** All formats should match correctly

### P3: Unmatched Detection
**Property:** System correctly identifies unmatched answers and unanswered questions
**Test:** Provide answer sheet missing Q3, and extra answer for Q6 (not in question paper)
**Metric:** Both should be flagged correctly

### P4: Mode Detection
**Property:** System correctly processes single vs dual mode
**Test:** Upload in both modes
**Metric:** Correct processing in both cases

### P5: Image Swap Detection
**Property:** System detects when images are swapped
**Test:** Upload answer sheet as question paper
**Metric:** System suggests swapping or auto-corrects

## Edge Cases & Handling

### EC-1: Sub-questions
**Example:** Q1(a), Q1(b), Q1(c)
**Handling:** 
- Match to parent question Q1
- Grade as sub-parts
- Show individual scores

### EC-2: Roman Numerals
**Example:** I, II, III, IV
**Handling:**
- Convert to Arabic numerals
- Match accordingly

### EC-3: Multiple Answer Formats
**Example:** Student writes "Ans 1:", "Answer to Q2:", "3)"
**Handling:**
- Extract numeric part
- Match based on number

### EC-4: Poor Handwriting
**Example:** "1" looks like "7"
**Handling:**
- Use context (sequential order)
- Show low confidence warning
- Allow manual correction

### EC-5: Missing Question Numbers
**Example:** Answer sheet has answers but no numbers
**Handling:**
- Assume sequential order
- Show warning
- Ask user to confirm

## Testing Strategy

### Unit Tests
- Number extraction from various formats
- Matching algorithm with different inputs
- Edge case handling

### Integration Tests
- End-to-end dual upload flow
- API with both modes
- Error handling

### User Testing
- 10 students test with real exams
- Various question paper formats
- Various answer sheet formats
- Collect feedback on accuracy

## Success Metrics

**Must Achieve:**
- ✅ 95%+ matching accuracy
- ✅ Handles 10+ numbering format variations
- ✅ Processes dual upload in < 25 seconds
- ✅ Clear error messages for edge cases

**Should Achieve:**
- ✅ Detects swapped images
- ✅ Handles sub-questions
- ✅ Shows matching confidence
- ✅ User satisfaction > 8/10

## Risks & Mitigations

### Risk 1: Complex Question Numbering
**Problem:** Questions like "1(a)(i)", "1(a)(ii)"
**Mitigation:** Start with simple numbering, add complexity later

### Risk 2: AI Hallucination
**Problem:** AI might invent matches that don't exist
**Mitigation:** Require high confidence, show uncertainty

### Risk 3: Performance
**Problem:** Processing two images might be slow
**Mitigation:** Optimize prompts, use streaming, show progress

### Risk 4: User Confusion
**Problem:** Users might not understand dual mode
**Mitigation:** Clear UI, examples, tooltips, help text

## Future Enhancements

1. **Multi-page Support**: Handle question papers with multiple pages
2. **Reusable Question Papers**: Store question papers for reuse
3. **Manual Matching**: Allow users to manually match if AI fails
4. **Batch Grading**: Grade multiple answer sheets against one question paper
5. **Template Detection**: Recognize standard exam templates
6. **OCR Confidence**: Show confidence scores for each match
7. **Smart Suggestions**: Suggest likely matches for unmatched items
