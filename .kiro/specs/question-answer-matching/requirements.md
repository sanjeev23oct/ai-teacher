# Question Paper + Answer Sheet Matching - Requirements

## Problem Statement

Currently, students upload a single image that contains both questions and answers. However, in real exams:
- **Question paper** is separate (printed, standard)
- **Answer sheet** only has answers (student's handwriting)

The AI needs to match answers to questions by looking at both documents.

## User Stories

### US-1: Upload Answer Sheet with Question Paper
**As a** student  
**I want to** upload my answer sheet along with the question paper  
**So that** the AI can grade my answers against the actual questions

**Acceptance Criteria:**
- Can upload two images: question paper + answer sheet
- AI extracts questions from question paper
- AI extracts answers from answer sheet
- AI matches answers to questions (by question number)
- Grading considers both documents
- Visual annotations appear on answer sheet

### US-2: Upload Standalone Exam (Current Behavior)
**As a** student  
**I want to** upload a single image with both questions and answers  
**So that** I can quickly get it graded (for practice tests, homework)

**Acceptance Criteria:**
- Can upload single image (current behavior)
- AI extracts both questions and answers from same image
- Works as it does today

### US-3: Question Number Detection
**As a** student  
**I want** the AI to automatically match my answers to questions  
**So that** I don't have to manually specify which answer goes with which question

**Acceptance Criteria:**
- AI detects question numbers in question paper (Q1, Q2, 1., 2., etc.)
- AI detects answer numbers in answer sheet (Ans 1, 1., Q1, etc.)
- AI matches based on numbers
- Handles missing answers (student skipped a question)
- Handles out-of-order answers

### US-4: Upload Mode Selection
**As a** student  
**I want to** choose between uploading modes  
**So that** I can use the right mode for my situation

**Acceptance Criteria:**
- UI shows two options:
  - "Upload exam with questions & answers" (single image)
  - "Upload question paper + answer sheet" (two images)
- Clear explanation of each mode
- Easy to switch between modes

## Functional Requirements

### FR-1: Dual Upload Interface
- Upload area accepts two images
- Clear labels: "Question Paper" and "Answer Sheet"
- Drag & drop for both
- Preview both images before grading
- Can remove/replace either image

### FR-2: Question Extraction
- AI reads question paper
- Extracts all questions with numbers
- Identifies question text
- Stores question structure

### FR-3: Answer Extraction
- AI reads answer sheet
- Extracts all answers with numbers
- Identifies answer text and work shown
- Stores answer structure

### FR-4: Matching Algorithm
- Match answers to questions by number
- Handle variations:
  - "Q1" vs "1" vs "1." vs "Question 1"
  - "Ans 1" vs "1)" vs "(1)"
- Flag unmatched answers
- Flag unanswered questions

### FR-5: Grading with Context
- Grade each answer against its question
- Consider question requirements
- Evaluate correctness
- Provide feedback specific to the question

### FR-6: Visual Annotations on Answer Sheet
- Show annotations on answer sheet (not question paper)
- Checkmarks/crosses for each answer
- Comments pointing to specific mistakes
- Score for each answer

## Non-Functional Requirements

### Performance
- Process two images in < 20 seconds
- No significant slowdown vs single image

### Usability
- Clear UI for dual upload
- Progress indicator shows which image is being processed
- Error messages if images are swapped

### Accuracy
- 95%+ accuracy in matching answers to questions
- Handle common numbering variations
- Detect when images are swapped (question paper in answer slot)

## Edge Cases

### EC-1: Images Swapped
**Scenario:** User uploads answer sheet as question paper and vice versa  
**Handling:** AI detects and suggests swapping, or auto-swaps

### EC-2: Missing Question Numbers
**Scenario:** Answer sheet has answers but no question numbers  
**Handling:** AI tries to infer based on order, or asks user to confirm

### EC-3: Multiple Pages
**Scenario:** Question paper or answer sheet spans multiple pages  
**Handling:** For MVP, accept only single page each. Future: multi-page support

### EC-4: Partial Answers
**Scenario:** Student answered only some questions  
**Handling:** Grade available answers, mark others as "Not Attempted"

### EC-5: Extra Answers
**Scenario:** Answer sheet has more answers than questions  
**Handling:** Flag as "Extra Answer - No Matching Question"

## User Flow

### Flow 1: Dual Upload
```
1. Student clicks "Grade Exam"
2. Sees two upload options
3. Selects "Upload Question Paper + Answer Sheet"
4. Uploads question paper image
5. Uploads answer sheet image
6. Clicks "Start Grading"
7. Progress: "Reading question paper..."
8. Progress: "Reading answer sheet..."
9. Progress: "Matching answers to questions..."
10. Progress: "Grading answers..."
11. See annotated answer sheet with results
```

### Flow 2: Single Upload (Current)
```
1. Student clicks "Grade Exam"
2. Sees two upload options
3. Selects "Upload Exam (Questions + Answers)"
4. Uploads single image
5. Clicks "Start Grading"
6. See annotated exam with results
```

## API Design

### Enhanced Grading Endpoint

```typescript
POST /api/grade

Request (multipart/form-data):
- exam: File (single image - current behavior)
OR
- questionPaper: File (question paper image)
- answerSheet: File (answer sheet image)

Response:
{
  subject: "Mathematics",
  language: "English",
  gradeLevel: "Grade 9-10",
  totalScore: "13/15",
  feedback: "Overall assessment...",
  
  // New: Question-Answer matching info
  matchingInfo: {
    totalQuestions: 5,
    answeredQuestions: 4,
    unansweredQuestions: ["Q5"],
    unmatchedAnswers: []
  },
  
  // Existing fields
  imageDimensions: { width: 1200, height: 1600 },
  annotations: [...],
  detailedAnalysis: [
    {
      id: "q1",
      questionNumber: "1",
      question: "Prove Basic Proportionality Theorem",
      studentAnswer: "Given: DE || BC...",
      correct: true,
      score: "5/5",
      remarks: "Excellent proof!",
      matched: true
    },
    {
      id: "q5",
      questionNumber: "5",
      question: "Solve for x: 2x + 5 = 15",
      studentAnswer: null,
      correct: false,
      score: "0/5",
      remarks: "Not attempted",
      matched: false
    }
  ]
}
```

## UI Design

### Upload Mode Selection
```
┌─────────────────────────────────────────────────────┐
│  How would you like to upload your exam?            │
├─────────────────────────────────────────────────────┤
│                                                      │
│  ┌──────────────────────┐  ┌──────────────────────┐│
│  │  📄 Single Image     │  │  📄📝 Two Images     ││
│  │                      │  │                      ││
│  │  Questions + Answers │  │  Question Paper +    ││
│  │  in one image        │  │  Answer Sheet        ││
│  │                      │  │                      ││
│  │  [Select]            │  │  [Select]            ││
│  └──────────────────────┘  └──────────────────────┘│
│                                                      │
└─────────────────────────────────────────────────────┘
```

### Dual Upload Interface
```
┌─────────────────────────────────────────────────────┐
│  Upload Question Paper + Answer Sheet                │
├─────────────────────────────────────────────────────┤
│                                                      │
│  Question Paper                                      │
│  ┌────────────────────────────────────────────┐    │
│  │  📄 Drag & drop or click to upload         │    │
│  │     (The printed question paper)           │    │
│  └────────────────────────────────────────────┘    │
│                                                      │
│  Answer Sheet                                        │
│  ┌────────────────────────────────────────────┐    │
│  │  📝 Drag & drop or click to upload         │    │
│  │     (Your handwritten answers)             │    │
│  └────────────────────────────────────────────┘    │
│                                                      │
│  [Start Grading]                                     │
│                                                      │
└─────────────────────────────────────────────────────┘
```

## Technical Approach

### Phase 1: Enhanced Prompt (Week 1)
Update Gemini prompt to:
1. Detect if image is question paper or answer sheet
2. Extract questions with numbers
3. Extract answers with numbers
4. Match based on numbers
5. Grade matched pairs

### Phase 2: Dual Upload UI (Week 2)
1. Add upload mode selection
2. Create dual upload component
3. Handle two file uploads
4. Send both to API

### Phase 3: Matching Logic (Week 3)
1. Implement robust number matching
2. Handle edge cases
3. Provide matching feedback
4. Show unmatched items

## Success Criteria

### Must Have
- ✅ Can upload two images (question paper + answer sheet)
- ✅ AI correctly matches 90%+ of answers to questions
- ✅ Grading considers question context
- ✅ Visual annotations on answer sheet
- ✅ Single image mode still works

### Should Have
- ✅ Handles common numbering variations
- ✅ Detects swapped images
- ✅ Shows unmatched answers/questions
- ✅ Clear error messages

### Nice to Have
- Multi-page support
- Auto-rotation of images
- OCR confidence scores
- Manual matching override

## Risks & Mitigations

### Risk 1: Matching Accuracy
**Problem:** AI might mismatch answers to questions  
**Mitigation:** 
- Use multiple signals (number, position, context)
- Show matching confidence
- Allow manual correction

### Risk 2: Complex Numbering
**Problem:** Questions numbered as "1(a)", "1(b)", etc.  
**Mitigation:**
- Handle sub-questions
- Match parent question first
- Group sub-answers

### Risk 3: Poor Image Quality
**Problem:** Blurry images make number detection hard  
**Mitigation:**
- Require minimum image quality
- Show preview before upload
- Suggest retaking photo

## Next Steps

1. **Validate with users**: Show mockups to 5-10 students
2. **Prioritize**: Decide if this is more important than other features
3. **Design detailed spec**: If validated, create detailed design doc
4. **Prototype**: Build quick prototype to test matching accuracy
5. **Implement**: Full implementation if prototype succeeds

## Open Questions

1. Should we support multi-page question papers?
2. How to handle sub-questions (1a, 1b, 1c)?
3. Should we allow manual matching override?
4. What if question paper is typed but answer sheet is handwritten?
5. Should we store question papers for reuse (same exam, multiple students)?
