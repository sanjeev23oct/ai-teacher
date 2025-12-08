# Multi-Page Answer Sheet Support - Requirements

## Goal
Enable students to upload and grade multi-page answer sheets (common in real exams) with seamless experience for both images and PDFs.

## Problem Statement
Current system only supports single-page uploads. Real exams often have:
- Multiple answer sheets (2-4 pages typical)
- Questions spanning across pages
- Students using phone cameras (multiple photos) or scanners (PDF)

## User Stories

### US-1: Upload Multiple Images
**As a** student  
**I want** to upload multiple photos of my answer sheet  
**So that** I can grade my entire exam at once

**Acceptance Criteria:**
- Can select multiple images (2-10 pages)
- See thumbnail preview of all pages before uploading
- Can reorder pages by drag-and-drop
- Can remove individual pages
- Can add more pages after initial selection
- Clear indication of page count (e.g., "3 pages selected")
- Mobile: Capture multiple pages with camera sequentially

### US-2: Upload PDF Answer Sheet
**As a** student who scanned my exam  
**I want** to upload a PDF file  
**So that** I don't need to convert to images

**Acceptance Criteria:**
- Accept PDF files (max 10 pages, 20MB)
- Show page count after selection
- Preview PDF pages as thumbnails
- Extract and process all pages automatically
- Support both single-page and multi-page PDFs

### US-3: View Multi-Page Results
**As a** student  
**I want** to navigate through my graded pages  
**So that** I can see feedback for each page

**Acceptance Criteria:**
- Page navigation (Previous/Next buttons)
- Page indicator (e.g., "Page 2 of 3")
- Thumbnail sidebar for quick navigation
- Each page shows its annotations
- Overall feedback shown once (not per page)
- Can zoom into specific pages

### US-4: Question Continuity Detection
**As a** student with questions spanning multiple pages  
**I want** the AI to understand question continuity  
**So that** my answer is graded as a whole, not split

**Acceptance Criteria:**
- Detect when a question continues to next page
- Combine answer text across pages
- Show single annotation/feedback for continued questions
- Handle partial answers gracefully

### US-5: Mobile Multi-Capture
**As a** mobile user  
**I want** to capture multiple pages easily  
**So that** I can grade my full exam on my phone

**Acceptance Criteria:**
- "Capture Another Page" button after each photo
- Show captured pages as thumbnails
- Can retake individual pages
- Clear "Done Capturing" action
- Works in both portrait and landscape

## Upload Flow Options

### Option A: Batch Upload (Recommended)
```
1. Click "Upload Answer Sheet"
2. Select multiple files OR capture multiple photos
3. Preview all pages with thumbnails
4. Reorder/remove pages if needed
5. Click "Grade All Pages"
6. Processing indicator shows progress
7. View results with page navigation
```

### Option B: Sequential Upload
```
1. Upload first page
2. "Add Another Page" button appears
3. Upload additional pages one by one
4. Grade when all pages uploaded
```

### Option C: Hybrid (Best UX)
```
- Support both batch and sequential
- Smart detection: if PDF → batch, if images → allow both
- Mobile: Sequential capture with batch review
```

## Technical Requirements

### File Support
- **Images**: JPG, PNG, HEIC (max 5MB per image)
- **PDF**: Multi-page PDF (max 20MB total, 10 pages)
- **Total Limit**: 10 pages per submission

### Processing
- Extract pages from PDF using pdf-lib or pdf.js
- Process each page through Gemini Vision API
- Combine results intelligently
- Detect question continuity across pages

### Storage
- Store each page separately in database
- Link pages to single grading session
- Store page order
- Store combined annotations

### Performance
- Show progress indicator (e.g., "Processing page 2 of 3...")
- Process pages in parallel where possible
- Optimize image compression before upload
- Lazy load page previews in results

## UI/UX Design

### Upload Component
```
┌─────────────────────────────────────┐
│  Upload Answer Sheet (Multi-Page)   │
├─────────────────────────────────────┤
│                                     │
│  [📄 Select Files] [📷 Use Camera]  │
│                                     │
│  ┌───┐ ┌───┐ ┌───┐                │
│  │ 1 │ │ 2 │ │ 3 │  [+ Add More]  │
│  └───┘ └───┘ └───┘                │
│                                     │
│  3 pages selected                   │
│  [Reorder] [Remove]                 │
│                                     │
│  [Grade All Pages →]                │
└─────────────────────────────────────┘
```

### Results Navigation
```
┌─────────────────────────────────────┐
│  Exam Results - 7/10                │
├─────────────────────────────────────┤
│  ┌───┐                              │
│  │ 1 │  ← Thumbnail                 │
│  ├───┤     Sidebar                  │
│  │ 2 │                              │
│  ├───┤                              │
│  │ 3 │                              │
│  └───┘                              │
│                                     │
│  ┌─────────────────────────────┐   │
│  │                             │   │
│  │   [Annotated Page 2]        │   │
│  │                             │   │
│  │   ✓ ✗ ✓ ✗                  │   │
│  │                             │   │
│  └─────────────────────────────┘   │
│                                     │
│  [← Previous]  Page 2 of 3  [Next →]│
│                                     │
│  Overall Feedback:                  │
│  Bahut accha! You scored 7/10...    │
└─────────────────────────────────────┘
```

### Mobile Camera Flow
```
1. Open camera
2. Capture page 1
3. Preview → "Use This" or "Retake"
4. "Capture Another Page" button
5. Repeat for all pages
6. "Done - Grade All Pages"
```

## Database Schema Changes

```prisma
model Grading {
  id              String   @id @default(cuid())
  userId          String?
  pages           GradingPage[]  // New: Multiple pages
  totalPages      Int      @default(1)
  // ... existing fields
}

model GradingPage {
  id              String   @id @default(cuid())
  gradingId       String
  grading         Grading  @relation(fields: [gradingId], references: [id])
  pageNumber      Int
  imageUrl        String
  annotations     Json?
  answers         Answer[]
  createdAt       DateTime @default(now())
  
  @@unique([gradingId, pageNumber])
}

model Answer {
  id              String   @id @default(cuid())
  pageId          String
  page            GradingPage @relation(fields: [pageId], references: [id])
  questionNumber  String
  continuedFrom   String?  // If question spans pages
  continuedTo     String?  // If question continues to next page
  // ... existing fields
}
```

## API Changes

### Upload Endpoint
```typescript
POST /api/grade/multi-page
Body: {
  mode: 'dual' | 'single',
  questionPaperId?: string,
  answerSheetPages: File[], // Array of images
  // OR
  answerSheetPdf: File
}

Response: {
  gradingId: string,
  totalPages: number,
  pages: [{
    pageNumber: number,
    imageUrl: string,
    annotations: [...],
    answers: [...]
  }],
  overallFeedback: string,
  totalScore: string
}
```

## Implementation Phases

### Phase 1: Multi-Image Upload (Week 1)
- [ ] Update upload component to accept multiple files
- [ ] Add thumbnail preview with reorder/remove
- [ ] Process multiple images sequentially
- [ ] Store pages in database
- [ ] Basic page navigation in results

### Phase 2: PDF Support (Week 1)
- [ ] Add PDF file type support
- [ ] Extract pages from PDF (pdf-lib)
- [ ] Convert PDF pages to images
- [ ] Process like multi-image upload

### Phase 3: Enhanced Results UI (Week 2)
- [ ] Thumbnail sidebar navigation
- [ ] Smooth page transitions
- [ ] Zoom functionality
- [ ] Mobile-optimized navigation

### Phase 4: Question Continuity (Week 2)
- [ ] Detect question continuation markers
- [ ] Combine answers across pages
- [ ] Smart annotation placement
- [ ] Unified feedback for continued questions

### Phase 5: Mobile Multi-Capture (Week 3)
- [ ] Sequential camera capture flow
- [ ] Page preview and retake
- [ ] Batch review before grading
- [ ] Optimized for thumb navigation

## Success Metrics
- 80%+ of users upload 2+ pages
- PDF upload success rate > 95%
- Page navigation engagement > 70%
- Mobile multi-capture completion rate > 85%
- Processing time < 5 seconds per page

## Edge Cases to Handle
1. **Mixed orientations** - Portrait and landscape pages
2. **Different sizes** - Pages from different sources
3. **Blank pages** - Skip or warn user
4. **Duplicate pages** - Detect and warn
5. **Out of order** - Easy reordering
6. **Large files** - Compression and optimization
7. **Network interruption** - Resume upload
8. **Partial processing** - Show completed pages if some fail

## Future Enhancements
- Auto-detect page order from question numbers
- Batch grading (multiple students, same question paper)
- Compare answers across pages for consistency
- Generate combined PDF report with annotations
- Share graded multi-page exam as link
