# Multi-Page Answer Sheet Support - Design

## Architecture Overview

### Component Structure
```
GradeExamPage
├── UploadModeSelector (existing)
├── MultiPageUpload (new)
│   ├── FileSelector
│   ├── PagePreview
│   │   ├── PageThumbnail[]
│   │   └── PageActions (reorder, remove, add)
│   └── UploadProgress
├── DualUpload (updated for multi-page)
└── GradingResult (updated)
    ├── PageNavigator (new)
    ├── AnnotatedExamViewer (updated)
    └── FeedbackDisplay
```

## Frontend Components

### 1. MultiPageUpload Component

```typescript
interface MultiPageUploadProps {
  mode: 'single' | 'dual';
  questionPaperId?: string;
  onGradingComplete: (result: MultiPageGradingResult) => void;
}

interface PageFile {
  id: string;
  file: File;
  preview: string; // Data URL for thumbnail
  order: number;
  status: 'pending' | 'uploading' | 'uploaded' | 'error';
}

const MultiPageUpload: React.FC<MultiPageUploadProps> = ({ mode, questionPaperId, onGradingComplete }) => {
  const [pages, setPages] = useState<PageFile[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);

  const handleFileSelect = (files: FileList) => {
    // Handle multiple images or PDF
    // Generate thumbnails
    // Add to pages array
  };

  const handleReorder = (fromIndex: number, toIndex: number) => {
    // Drag and drop reordering
  };

  const handleRemovePage = (pageId: string) => {
    // Remove page from array
  };

  const handleGradeAll = async () => {
    // Upload and process all pages
    // Show progress
    // Return combined results
  };

  return (
    <div className="multi-page-upload">
      {/* File selector */}
      <FileSelector 
        onFilesSelected={handleFileSelect}
        accept="image/*,.pdf"
        multiple
      />

      {/* Page previews */}
      {pages.length > 0 && (
        <PagePreviewGrid
          pages={pages}
          onReorder={handleReorder}
          onRemove={handleRemovePage}
        />
      )}

      {/* Upload progress */}
      {isProcessing && (
        <UploadProgress
          currentPage={currentPage}
          totalPages={pages.length}
        />
      )}

      {/* Grade button */}
      <button
        onClick={handleGradeAll}
        disabled={pages.length === 0 || isProcessing}
        className="btn-primary"
      >
        Grade {pages.length} Page{pages.length !== 1 ? 's' : ''}
      </button>
    </div>
  );
};
```

### 2. PageNavigator Component

```typescript
interface PageNavigatorProps {
  pages: GradedPage[];
  currentPage: number;
  onPageChange: (pageNumber: number) => void;
}

const PageNavigator: React.FC<PageNavigatorProps> = ({ pages, currentPage, onPageChange }) => {
  return (
    <div className="page-navigator">
      {/* Thumbnail sidebar */}
      <div className="thumbnail-sidebar">
        {pages.map((page, index) => (
          <PageThumbnail
            key={page.id}
            page={page}
            pageNumber={index + 1}
            isActive={currentPage === index}
            onClick={() => onPageChange(index)}
          />
        ))}
      </div>

      {/* Main page view */}
      <div className="main-page-view">
        <AnnotatedExamViewer
          imageUrl={pages[currentPage].imageUrl}
          gradingResult={pages[currentPage]}
          onAnnotationClick={handleAnnotationClick}
        />

        {/* Navigation controls */}
        <div className="page-controls">
          <button
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage === 0}
          >
            ← Previous
          </button>
          
          <span className="page-indicator">
            Page {currentPage + 1} of {pages.length}
          </span>
          
          <button
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage === pages.length - 1}
          >
            Next →
          </button>
        </div>
      </div>
    </div>
  );
};
```

### 3. Mobile Camera Multi-Capture

```typescript
interface MobileCameraMultiCaptureProps {
  onCaptureComplete: (images: Blob[]) => void;
  onCancel: () => void;
}

const MobileCameraMultiCapture: React.FC<MobileCameraMultiCaptureProps> = ({ onCaptureComplete, onCancel }) => {
  const [capturedPages, setCapturedPages] = useState<Blob[]>([]);
  const [isCapturing, setIsCapturing] = useState(true);
  const [currentCapture, setCurrentCapture] = useState<Blob | null>(null);

  const handleCapture = (imageBlob: Blob) => {
    setCurrentCapture(imageBlob);
    setIsCapturing(false);
  };

  const handleUseImage = () => {
    if (currentCapture) {
      setCapturedPages([...capturedPages, currentCapture]);
      setCurrentCapture(null);
    }
  };

  const handleCaptureAnother = () => {
    setIsCapturing(true);
  };

  const handleDone = () => {
    onCaptureComplete(capturedPages);
  };

  return (
    <div className="mobile-multi-capture">
      {isCapturing ? (
        <CameraCapture onCapture={handleCapture} />
      ) : (
        <div className="capture-preview">
          <img src={URL.createObjectURL(currentCapture!)} alt="Captured page" />
          
          <div className="capture-actions">
            <button onClick={() => setIsCapturing(true)}>Retake</button>
            <button onClick={handleUseImage}>Use This</button>
          </div>
        </div>
      )}

      {/* Captured pages thumbnails */}
      {capturedPages.length > 0 && (
        <div className="captured-pages">
          <h3>{capturedPages.length} page(s) captured</h3>
          <div className="thumbnails">
            {capturedPages.map((page, index) => (
              <img
                key={index}
                src={URL.createObjectURL(page)}
                alt={`Page ${index + 1}`}
              />
            ))}
          </div>
        </div>
      )}

      {/* Action buttons */}
      <div className="bottom-actions">
        {!isCapturing && capturedPages.length > 0 && (
          <>
            <button onClick={handleCaptureAnother}>
              Capture Another Page
            </button>
            <button onClick={handleDone} className="btn-primary">
              Done - Grade All Pages
            </button>
          </>
        )}
        <button onClick={onCancel}>Cancel</button>
      </div>
    </div>
  );
};
```

## Backend Services

### 1. PDF Processing Service

```typescript
// server/services/pdfService.ts
import { PDFDocument } from 'pdf-lib';
import sharp from 'sharp';

export async function extractPagesFromPDF(pdfBuffer: Buffer): Promise<Buffer[]> {
  const pdfDoc = await PDFDocument.load(pdfBuffer);
  const pageCount = pdfDoc.getPageCount();
  
  if (pageCount > 10) {
    throw new Error('PDF has too many pages (max 10)');
  }

  const pageImages: Buffer[] = [];

  for (let i = 0; i < pageCount; i++) {
    // Extract page as image
    const page = pdfDoc.getPage(i);
    const { width, height } = page.getSize();
    
    // Convert to image using pdf-to-image library
    const imageBuffer = await convertPDFPageToImage(pdfBuffer, i);
    
    // Optimize image
    const optimized = await sharp(imageBuffer)
      .resize(2000, null, { withoutEnlargement: true })
      .jpeg({ quality: 85 })
      .toBuffer();
    
    pageImages.push(optimized);
  }

  return pageImages;
}

async function convertPDFPageToImage(pdfBuffer: Buffer, pageIndex: number): Promise<Buffer> {
  // Use pdf-to-image or similar library
  // Return image buffer
}
```

### 2. Multi-Page Grading Service

```typescript
// server/services/multiPageGradingService.ts
import { gradeWithStoredQuestions } from './gradingService';
import { storeMultiPageGrading } from './questionPaperService';

interface PageGradingResult {
  pageNumber: number;
  imageUrl: string;
  annotations: any[];
  answers: any[];
}

export async function gradeMultiplePages(
  questionPaperId: string,
  answerSheetPages: string[], // Array of file paths
  userId?: string
): Promise<{
  gradingId: string;
  pages: PageGradingResult[];
  overallFeedback: string;
  totalScore: string;
}> {
  const pageResults: PageGradingResult[] = [];
  let allAnswers: any[] = [];
  let totalCorrect = 0;
  let totalQuestions = 0;

  // Process each page
  for (let i = 0; i < answerSheetPages.length; i++) {
    const pagePath = answerSheetPages[i];
    
    // Grade this page
    const result = await gradeWithStoredQuestions(pagePath, questionPaperId, userId);
    
    pageResults.push({
      pageNumber: i + 1,
      imageUrl: pagePath,
      annotations: result.annotations || [],
      answers: result.detailedAnalysis
    });

    // Accumulate results
    allAnswers = [...allAnswers, ...result.detailedAnalysis];
    totalQuestions += result.detailedAnalysis.length;
    totalCorrect += result.detailedAnalysis.filter((a: any) => a.correct).length;
  }

  // Detect question continuity
  const mergedAnswers = detectAndMergeQuestionContinuity(allAnswers);

  // Generate overall feedback
  const overallFeedback = await generateOverallFeedback(mergedAnswers, totalCorrect, totalQuestions);
  const totalScore = `${totalCorrect}/${totalQuestions}`;

  // Store in database
  const gradingId = await storeMultiPageGrading({
    userId,
    questionPaperId,
    pages: pageResults,
    overallFeedback,
    totalScore,
    totalPages: answerSheetPages.length
  });

  return {
    gradingId,
    pages: pageResults,
    overallFeedback,
    totalScore
  };
}

function detectAndMergeQuestionContinuity(answers: any[]): any[] {
  // Logic to detect questions spanning multiple pages
  // Look for patterns like "continued..." or incomplete answers
  // Merge answers for the same question number across pages
  
  const merged: any[] = [];
  const questionMap = new Map<string, any[]>();

  // Group by question number
  answers.forEach(answer => {
    const qNum = answer.questionNumber;
    if (!questionMap.has(qNum)) {
      questionMap.set(qNum, []);
    }
    questionMap.get(qNum)!.push(answer);
  });

  // Merge answers for same question
  questionMap.forEach((answerParts, qNum) => {
    if (answerParts.length === 1) {
      merged.push(answerParts[0]);
    } else {
      // Merge multiple parts
      const mergedAnswer = {
        ...answerParts[0],
        studentAnswer: answerParts.map(a => a.studentAnswer).join(' '),
        remarks: answerParts[0].remarks, // Use first part's remarks
        spanPages: answerParts.map(a => a.pageNumber)
      };
      merged.push(mergedAnswer);
    }
  });

  return merged;
}

async function generateOverallFeedback(answers: any[], correct: number, total: number): Promise<string> {
  // Generate Hinglish feedback for overall performance
  const percentage = (correct / total) * 100;
  
  if (percentage >= 80) {
    return `🎯 Bahut badhiya! You scored ${correct}/${total}! Excellent work across all pages! ✨`;
  } else if (percentage >= 60) {
    return `💪 Good effort! You got ${correct}/${total}. Kuch questions mein improvement ki zaroorat hai. Keep practicing!`;
  } else {
    return `📚 You scored ${correct}/${total}. Chalo, let's work together to improve. Practice more and you'll do great! 🚀`;
  }
}
```

### 3. API Endpoints

```typescript
// server/index.ts

// Multi-page grading endpoint
app.post('/api/grade/multi-page', upload.array('answerSheetPages', 10), async (req: Request, res: Response) => {
  try {
    const files = req.files as Express.Multer.File[];
    const { questionPaperId, mode } = req.body;
    const userId = req.user?.id;

    if (!files || files.length === 0) {
      return res.status(400).json({ error: 'No files uploaded' });
    }

    if (files.length > 10) {
      return res.status(400).json({ error: 'Maximum 10 pages allowed' });
    }

    const filePaths = files.map(f => f.path);

    // Grade all pages
    const result = await gradeMultiplePages(questionPaperId, filePaths, userId);

    res.json(result);
  } catch (error) {
    console.error('Multi-page grading error:', error);
    res.status(500).json({ error: 'Failed to grade multi-page exam' });
  }
});

// PDF upload endpoint
app.post('/api/grade/pdf', upload.single('pdfFile'), async (req: Request, res: Response) => {
  try {
    const file = req.file;
    const { questionPaperId } = req.body;
    const userId = req.user?.id;

    if (!file) {
      return res.status(400).json({ error: 'No PDF file uploaded' });
    }

    // Extract pages from PDF
    const pdfBuffer = fs.readFileSync(file.path);
    const pageImages = await extractPagesFromPDF(pdfBuffer);

    // Save page images
    const pagePaths: string[] = [];
    for (let i = 0; i < pageImages.length; i++) {
      const pagePath = `${file.path}_page_${i + 1}.jpg`;
      fs.writeFileSync(pagePath, pageImages[i]);
      pagePaths.push(pagePath);
    }

    // Grade all pages
    const result = await gradeMultiplePages(questionPaperId, pagePaths, userId);

    // Cleanup original PDF
    fs.unlinkSync(file.path);

    res.json(result);
  } catch (error) {
    console.error('PDF grading error:', error);
    res.status(500).json({ error: 'Failed to grade PDF' });
  }
});
```

## Database Schema

```prisma
model Grading {
  id              String        @id @default(cuid())
  userId          String?
  user            User?         @relation(fields: [userId], references: [id])
  questionPaperId String
  questionPaper   QuestionPaper @relation(fields: [questionPaperId], references: [id])
  
  // Multi-page support
  pages           GradingPage[]
  totalPages      Int           @default(1)
  
  // Overall results
  subject         String
  language        String
  gradeLevel      String
  totalScore      String
  overallFeedback String        @db.Text
  
  matchingMode    String        @default("single")
  totalQuestions  Int?
  answeredQuestions Int?
  
  createdAt       DateTime      @default(now())
  updatedAt       DateTime      @updatedAt
}

model GradingPage {
  id              String   @id @default(cuid())
  gradingId       String
  grading         Grading  @relation(fields: [gradingId], references: [id], onDelete: Cascade)
  
  pageNumber      Int
  imageUrl        String
  annotations     Json?
  
  answers         Answer[]
  
  createdAt       DateTime @default(now())
  
  @@unique([gradingId, pageNumber])
  @@index([gradingId])
}

model Answer {
  id              String      @id @default(cuid())
  pageId          String
  page            GradingPage @relation(fields: [pageId], references: [id], onDelete: Cascade)
  
  questionNumber  String
  studentAnswer   String?     @db.Text
  correct         Boolean
  score           String
  remarks         String      @db.Text
  
  // Question continuity
  continuedFrom   Int?        // Page number if continued from previous page
  continuedTo     Int?        // Page number if continues to next page
  spanPages       Int[]       // All pages this question spans
  
  matched         Boolean     @default(true)
  matchConfidence Float       @default(1.0)
  positionX       Float?
  positionY       Float?
  
  createdAt       DateTime    @default(now())
  
  @@index([pageId])
}
```

## Implementation Priority

### Phase 1: Core Multi-Image (Week 1)
1. Update upload component for multiple files
2. Add thumbnail preview grid
3. Process multiple images sequentially
4. Store pages in database
5. Basic page navigation in results

### Phase 2: PDF Support (Week 1)
1. Add PDF file handling
2. Extract pages from PDF
3. Convert to images
4. Integrate with multi-page flow

### Phase 3: Enhanced UI (Week 2)
1. Thumbnail sidebar navigation
2. Smooth page transitions
3. Mobile-optimized controls
4. Drag-and-drop reordering

### Phase 4: Question Continuity (Week 2)
1. Detect continued questions
2. Merge answers across pages
3. Smart annotation placement
4. Unified feedback

This design provides a comprehensive solution for multi-page answer sheets with excellent UX!
