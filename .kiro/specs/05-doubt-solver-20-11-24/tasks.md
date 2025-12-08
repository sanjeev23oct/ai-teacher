# AI Doubt Solver - Implementation Tasks

## Overview

This implementation plan breaks down the AI Doubt Solver feature into manageable tasks. Each task builds incrementally on previous work, with checkpoints to ensure quality.

---

## Phase 1: Core Infrastructure & Database

### 1. Database Schema Setup

- [ ] 1.1 Create Doubt model in Prisma schema
  - Add fields: id, userId, questionImage, questionText, subject, language
  - Add explanation, annotations, imageDimensions as JSON fields
  - Add conversationId, isFavorite, messageCount
  - Add timestamps and indexes
  - _Requirements: US-1, US-5_

- [ ] 1.2 Create DoubtMessage model in Prisma schema
  - Add fields: id, doubtId, role, content, audioUrl
  - Add foreign key relationship to Doubt
  - Add indexes for efficient querying
  - _Requirements: US-3, US-5_

- [ ] 1.3 Run Prisma migration
  - Generate migration files
  - Apply migration to database
  - Verify schema in database
  - _Requirements: US-1, US-5_

### 2. Subject-Specific Prompt System

- [ ] 2.1 Create prompt configuration file
  - Define Subject and Language types
  - Create prompt templates for each subject (Math, Physics, Chemistry, Biology, English, Social Studies)
  - Include language placeholders and example phrases
  - Store in `server/prompts/subjectPrompts.ts`
  - _Requirements: US-6_

- [ ] 2.2 Create prompt builder service
  - Implement `buildPrompt(subject, language)` function
  - Handle language-specific phrase injection
  - Include response format instructions
  - Add unit tests for prompt generation
  - _Requirements: US-6_

---

## Phase 2: Backend Services

### 3. Doubt Explanation Service

- [ ] 3.1 Create doubtExplanationService.ts
  - Implement `explainQuestion()` method
  - Handle image upload and processing
  - Call Gemini with subject-specific prompt
  - Parse AI response into structured format
  - Generate annotation coordinates
  - Save doubt to database
  - _Requirements: US-1, US-2, US-6_

- [ ] 3.2 Implement annotation coordinate generation
  - Extract question regions from AI response
  - Calculate percentage-based positions
  - Create annotation objects with types (step, concept, formula)
  - Handle cases with no image (text-only questions)
  - _Requirements: US-2_

- [ ] 3.3 Add image storage handling
  - Store uploaded images in server/uploads/doubts/
  - Generate unique filenames
  - Return image URLs in response
  - Handle image compression
  - _Requirements: US-1_

- [ ]* 3.4 Write unit tests for explanation service
  - Test with sample questions for each subject
  - Test with and without images
  - Test annotation generation
  - Test error handling
  - _Requirements: US-1, US-2, US-6_

### 4. Doubt Conversation Service

- [ ] 4.1 Create doubtConversationService.ts
  - Implement `sendMessage()` method
  - Load doubt context from database
  - Build conversation history for AI
  - Call Gemini with context
  - Save message to database
  - _Requirements: US-3_

- [ ] 4.2 Implement streaming response support
  - Create `streamResponse()` method
  - Use Gemini streaming API
  - Yield tokens as they arrive
  - Handle stream errors gracefully
  - _Requirements: US-3_

- [ ] 4.3 Add context management
  - Include original question in every request
  - Include last N messages for context
  - Limit context window size
  - Maintain subject and language consistency
  - _Requirements: US-3_

- [ ]* 4.4 Write unit tests for conversation service
  - Test context preservation
  - Test message history management
  - Test streaming functionality
  - Test error handling
  - _Requirements: US-3_

### 5. Doubt History Service

- [ ] 5.1 Create doubtHistoryService.ts
  - Implement `getHistory()` method with pagination
  - Implement `getDoubt()` method to retrieve single doubt
  - Implement `toggleFavorite()` method
  - Implement `searchDoubts()` method with full-text search
  - _Requirements: US-5_

- [ ] 5.2 Add filtering and sorting
  - Filter by subject
  - Filter by date range
  - Filter by favorite status
  - Sort by timestamp (newest first)
  - _Requirements: US-5_

- [ ]* 5.3 Write unit tests for history service
  - Test pagination
  - Test search functionality
  - Test filtering
  - Test favorite toggle
  - _Requirements: US-5_

### 6. API Endpoints

- [ ] 6.1 Create POST /api/doubts/explain endpoint
  - Handle multipart/form-data for image upload
  - Validate subject and language
  - Call doubtExplanationService
  - Return structured explanation response
  - Handle errors with appropriate status codes
  - _Requirements: US-1, US-2_

- [ ] 6.2 Create POST /api/doubts/chat endpoint
  - Validate conversationId and doubtId
  - Call doubtConversationService
  - Support streaming responses
  - Return message with optional audio URL
  - _Requirements: US-3_

- [ ] 6.3 Create GET /api/doubts/history endpoint
  - Support query parameters (page, limit, subject, search)
  - Call doubtHistoryService
  - Return paginated results
  - _Requirements: US-5_

- [ ] 6.4 Create GET /api/doubts/:doubtId endpoint
  - Retrieve doubt with full conversation history
  - Return 404 if not found
  - _Requirements: US-5_

- [ ] 6.5 Create POST /api/doubts/:doubtId/favorite endpoint
  - Toggle favorite status
  - Return updated status
  - _Requirements: US-5_

---

## Phase 3: Frontend Components - Doubt Creation

### 7. Subject and Language Selectors

- [ ] 7.1 Create SubjectSelector component
  - Display subjects with icons and colors
  - Handle selection state
  - Mobile-friendly grid layout
  - Add hover and active states
  - _Requirements: US-1, US-6_

- [ ] 7.2 Create LanguageSelector component
  - Display languages with native labels
  - Handle selection state
  - Support 10+ Indian languages
  - Mobile-friendly layout
  - _Requirements: US-4_

- [ ]* 7.3 Write component tests
  - Test selection interactions
  - Test visual rendering
  - Test accessibility
  - _Requirements: US-1, US-4, US-6_

### 8. Question Upload Component

- [ ] 8.1 Create QuestionUpload component
  - Support three input methods: camera, file, text
  - Show upload mode selector
  - Handle file validation
  - Show loading state during upload
  - _Requirements: US-1_

- [ ] 8.2 Integrate CameraCapture component
  - Reuse existing CameraCapture from other features
  - Configure for rear-facing camera
  - Add preview and retake flow
  - Handle camera permissions
  - _Requirements: US-1_

- [ ] 8.3 Add text input option
  - Create textarea for typing questions
  - Add character counter
  - Support multi-line input
  - Auto-resize textarea
  - _Requirements: US-1_

- [ ]* 8.4 Write component tests
  - Test file upload
  - Test camera capture
  - Test text input
  - Test validation
  - _Requirements: US-1_

### 9. DoubtsPage Component

- [ ] 9.1 Create DoubtsPage component
  - Implement multi-step flow (subject → language → upload)
  - Manage state for selections
  - Handle navigation between steps
  - Show progress indicator
  - _Requirements: US-1_

- [ ] 9.2 Implement question submission
  - Call /api/doubts/explain endpoint
  - Show loading state with encouraging messages
  - Handle errors gracefully
  - Navigate to explanation view on success
  - _Requirements: US-1_

- [ ] 9.3 Add mobile optimizations
  - Bottom sheet for selectors
  - Large touch targets
  - Smooth transitions
  - Haptic feedback
  - _Requirements: US-1_

---

## Phase 4: Frontend Components - Explanation View

### 10. Annotated Question Viewer

- [ ] 10.1 Create AnnotatedQuestionViewer component
  - Display question image or text
  - Render SVG overlay for annotations
  - Handle responsive sizing
  - Support zoom and pan
  - _Requirements: US-2_

- [ ] 10.2 Create AnnotationOverlay component
  - Render annotations at percentage-based positions
  - Create clickable regions (larger than visual)
  - Show annotation labels (💡 Step 1, etc.)
  - Handle annotation click events
  - _Requirements: US-2_

- [ ] 10.3 Add annotation interactions
  - Highlight annotation on hover (desktop)
  - Show tooltip on click
  - Smooth animations
  - Mobile-friendly tap targets (min 48px)
  - _Requirements: US-2_

- [ ]* 10.4 Write component tests
  - Test annotation rendering
  - Test click handling
  - Test responsive behavior
  - Test accessibility
  - _Requirements: US-2_

### 11. Step-by-Step Explanation

- [ ] 11.1 Create StepByStepExplanation component
  - Display "What the question asks" section
  - Render steps with titles and explanations
  - Show final answer prominently
  - Display key concepts
  - Show practice tip
  - _Requirements: US-1_

- [ ] 11.2 Implement collapsible steps
  - Click step to expand detailed explanation
  - Smooth expand/collapse animations
  - Show loading state when fetching details
  - Remember expanded state
  - _Requirements: US-2_

- [ ] 11.3 Add visual enhancements
  - Use emojis for sections (🎯, ✨, 💪, 🚀)
  - Color-code different sections
  - Responsive typography
  - Mobile-optimized spacing
  - _Requirements: US-1_

- [ ]* 11.4 Write component tests
  - Test step rendering
  - Test expand/collapse
  - Test visual elements
  - _Requirements: US-1, US-2_

### 12. Conversation Panel

- [ ] 12.1 Create ConversationPanel component
  - Display message history
  - Show user and AI messages differently
  - Auto-scroll to latest message
  - Show typing indicator during streaming
  - _Requirements: US-3_

- [ ] 12.2 Implement text input
  - Create message input with auto-resize
  - Add send button
  - Handle Enter key to send
  - Disable during streaming
  - _Requirements: US-3_

- [ ] 12.3 Add voice input support
  - Create microphone button
  - Integrate Web Speech API
  - Show recording indicator
  - Display transcription
  - Handle voice input errors
  - _Requirements: US-3, US-4_

- [ ] 12.4 Implement streaming responses
  - Connect to streaming endpoint
  - Display tokens as they arrive
  - Show smooth typing animation
  - Handle stream interruption
  - _Requirements: US-3_

- [ ] 12.5 Add TTS support (optional)
  - Generate audio for AI responses
  - Add play button for each message
  - Support language-specific voices
  - Handle audio playback errors
  - _Requirements: US-4_

- [ ]* 12.6 Write component tests
  - Test message display
  - Test text input
  - Test voice input
  - Test streaming
  - _Requirements: US-3, US-4_

### 13. Explanation View Integration

- [ ] 13.1 Create ExplanationView component
  - Combine AnnotatedQuestionViewer, StepByStepExplanation, and ConversationPanel
  - Implement responsive layout (stack on mobile, side-by-side on desktop)
  - Handle annotation click to open conversation
  - Manage conversation state
  - _Requirements: US-1, US-2, US-3_

- [ ] 13.2 Add navigation and actions
  - Back button to return to upload
  - Share button (future)
  - Favorite button
  - New question button
  - _Requirements: US-1, US-5_

- [ ]* 13.3 Write integration tests
  - Test full explanation flow
  - Test annotation to conversation flow
  - Test responsive behavior
  - _Requirements: US-1, US-2, US-3_

---

## Phase 5: Frontend Components - History

### 14. Doubts History Page

- [ ] 14.1 Create DoubtsHistoryPage component
  - Fetch and display doubt history
  - Implement pagination
  - Show loading states
  - Handle empty state
  - _Requirements: US-5_

- [ ] 14.2 Create DoubtHistoryItem component
  - Display question thumbnail or preview
  - Show subject, language, timestamp
  - Show message count
  - Show favorite indicator
  - Make clickable to open doubt
  - _Requirements: US-5_

- [ ] 14.3 Add search functionality
  - Create search input
  - Debounce search queries
  - Call search API
  - Show search results
  - Clear search button
  - _Requirements: US-5_

- [ ] 14.4 Add filtering
  - Filter by subject dropdown
  - Filter by date range
  - Filter by favorites
  - Combine filters
  - Show active filters
  - _Requirements: US-5_

- [ ] 14.5 Implement doubt re-opening
  - Click history item to load doubt
  - Navigate to ExplanationView
  - Load conversation history
  - Allow continuing conversation
  - _Requirements: US-5_

- [ ]* 14.6 Write component tests
  - Test history display
  - Test search
  - Test filtering
  - Test pagination
  - Test doubt re-opening
  - _Requirements: US-5_

---

## Phase 6: Navigation & Integration

### 15. App Navigation Updates

- [ ] 15.1 Add Doubts route to App.tsx
  - Create route for /doubts
  - Create route for /doubts/:doubtId
  - Create route for /doubts/history
  - _Requirements: US-1, US-5_

- [ ] 15.2 Update Navigation component
  - Add "Ask Doubt" navigation item
  - Add "Doubt History" navigation item
  - Update icons and labels
  - Highlight active route
  - _Requirements: US-1, US-5_

- [ ] 15.3 Add mobile bottom navigation
  - Include Doubts in bottom nav
  - Use appropriate icon
  - Handle navigation on mobile
  - _Requirements: US-1_

---

## Phase 7: Performance & Polish

### 16. Performance Optimization

- [ ] 16.1 Implement image optimization
  - Compress images before upload
  - Use WebP format where supported
  - Lazy load images in history
  - Add image loading placeholders
  - _Requirements: US-1, US-5_

- [ ] 16.2 Optimize API responses
  - Enable response compression
  - Implement caching headers
  - Add database query indexes
  - Use connection pooling
  - _Requirements: US-1, US-3, US-5_

- [ ] 16.3 Add loading states and optimistic UI
  - Show skeleton loaders
  - Optimistic message sending
  - Preload common data
  - Cache subject/language selections
  - _Requirements: US-1, US-3_

### 17. Mobile Experience Polish

- [ ] 17.1 Add haptic feedback
  - Vibrate on button press
  - Vibrate on message sent
  - Vibrate on annotation click
  - _Requirements: US-1, US-2, US-3_

- [ ] 17.2 Implement swipe gestures
  - Swipe to go back
  - Pull to refresh history
  - Swipe to delete (future)
  - _Requirements: US-5_

- [ ] 17.3 Add offline support (basic)
  - Show offline indicator
  - Queue messages when offline
  - Retry failed requests
  - Cache recent doubts
  - _Requirements: US-1, US-3_

### 18. Error Handling & Edge Cases

- [ ] 18.1 Implement comprehensive error handling
  - Handle AI service failures
  - Handle network errors
  - Handle invalid inputs
  - Show user-friendly error messages
  - Add retry mechanisms
  - _Requirements: US-1, US-3_

- [ ] 18.2 Handle edge cases
  - No image provided (text-only)
  - Poor quality images
  - Very long questions
  - Empty conversation history
  - Rate limiting
  - _Requirements: US-1, US-3_

---

## Phase 8: Testing & Quality Assurance

### 19. Checkpoint - Ensure All Tests Pass

- [ ] 19.1 Run all unit tests
  - Ensure all tests pass
  - Fix any failing tests
  - Ask user if questions arise
  - _Requirements: All_

- [ ] 19.2 Run integration tests
  - Test end-to-end flows
  - Test API endpoints
  - Test database operations
  - _Requirements: All_

### 20. Manual Testing

- [ ] 20.1 Test with real questions
  - Test each subject with sample questions
  - Test in multiple languages
  - Test with images and text
  - Verify explanations are helpful
  - _Requirements: US-1, US-4, US-6_

- [ ] 20.2 Test conversation flow
  - Ask follow-up questions
  - Test context preservation
  - Test streaming responses
  - Test voice input
  - _Requirements: US-3, US-4_

- [ ] 20.3 Test on multiple devices
  - Test on iOS Safari
  - Test on Chrome Android
  - Test on desktop browsers
  - Test camera on mobile
  - Test voice on mobile
  - _Requirements: US-1, US-3, US-4_

- [ ] 20.4 Test history and search
  - Create multiple doubts
  - Test search functionality
  - Test filtering
  - Test favorites
  - Test re-opening doubts
  - _Requirements: US-5_

---

## Phase 9: Documentation & Deployment

### 21. Documentation

- [ ] 21.1 Update API documentation
  - Document all new endpoints
  - Add request/response examples
  - Document error codes
  - _Requirements: All_

- [ ] 21.2 Create user guide
  - How to ask a doubt
  - How to use annotations
  - How to have conversations
  - How to access history
  - _Requirements: US-1, US-2, US-3, US-5_

### 22. Final Checkpoint

- [ ] 22.1 Final testing and verification
  - Ensure all features work end-to-end
  - Verify performance targets met
  - Check mobile experience
  - Verify all tests pass
  - Ask user if questions arise
  - _Requirements: All_

---

## Success Criteria

After implementation, the feature should achieve:

- ✅ Students can upload questions and get detailed explanations
- ✅ Explanations have clickable annotations for deeper exploration
- ✅ Natural conversation flow with context preservation
- ✅ Subject-specific prompts for high-quality explanations
- ✅ Multi-language support (10+ languages)
- ✅ History tracking with search and favorites
- ✅ Microsoft Copilot-like smooth experience
- ✅ Mobile-first design with camera and voice support
- ✅ Response time < 3 seconds for explanations
- ✅ Response time < 2 seconds for conversations

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each phase builds on the previous one
- Checkpoints ensure quality before moving forward
- Focus on core functionality first, polish later
- Test on real devices throughout development
