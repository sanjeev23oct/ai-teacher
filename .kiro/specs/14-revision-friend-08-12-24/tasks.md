# Revision Friend Helper - Implementation Tasks

- [x] 1. Set up database schema and models
  - Add RevisionSession and WeakTopic models to Prisma schema
  - Generate Prisma client
  - Run database migrations
  - _Requirements: 2.1, 2.2_

- [x] 2. Create backend revision friend service
  - [x] 2.1 Implement core service structure
    - Create `server/services/revisionFriendService.ts`
    - Define TypeScript interfaces for session, history, and performance data
    - Set up in-memory session state management
    - _Requirements: 1.1, 2.1_

  - [x] 2.2 Implement session start logic
    - Create `startRevision()` method
    - Generate explanation phase content using AI service
    - Generate TTS audio for explanation
    - Return session data with audio URL
    - _Requirements: 1.1, 1.2_

  - [x] 2.3 Implement phase transition logic
    - Create `getNextPhase()` method
    - Generate phase-specific content (repeat, quiz, drill)
    - Handle phase progression: explanation → repeat → quiz → drill
    - Generate TTS for each phase
    - _Requirements: 1.3, 1.4, 1.5_

  - [x] 2.4 Implement weak area tracking
    - Create `completeRevision()` method
    - Calculate quiz performance score
    - Update WeakTopic table based on score
    - Mark topics as improved when score >= 4/5
    - _Requirements: 2.1, 2.2, 2.4, 2.5_

  - [x] 2.5 Implement history and suggestions
    - Create `getRevisionHistory()` method
    - Create `getSuggestions()` method
    - Prioritize weak topics in suggestions
    - Include NCERT references when available
    - _Requirements: 2.3, 3.2_

- [x] 3. Create AI prompts for revision phases
  - [x] 3.1 Create phase-specific prompt templates
    - Create `server/prompts/revisionPrompts.ts`
    - Define explanation prompt (60s content)
    - Define repeat prompt (30s content)
    - Define quiz prompt (60s content with 3 questions)
    - Define drill prompt (30s rapid review)
    - _Requirements: 1.2, 1.3, 1.4, 1.5_

  - [x] 3.2 Add subject-specific customization
    - Add subject context to prompts (English, Science, Math, SST)
    - Include NCERT chapter references
    - Use Hinglish for conversational tone
    - _Requirements: 3.1, 3.2, 3.4_

- [x] 4. Create API endpoints
  - [x] 4.1 Implement session management endpoints
    - POST `/api/revision-friend/start` - Start new session
    - POST `/api/revision-friend/next-phase` - Get next phase content
    - POST `/api/revision-friend/complete` - Complete session and save performance
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5_

  - [x] 4.2 Implement history and suggestion endpoints
    - GET `/api/revision-friend/history` - Get user's revision history
    - GET `/api/revision-friend/suggestions` - Get personalized suggestions
    - _Requirements: 2.3, 3.5_

  - [x] 4.3 Add error handling and validation
    - Validate topic and subject inputs
    - Handle AI service failures with fallbacks
    - Handle TTS failures gracefully
    - Return appropriate error responses
    - _Requirements: 3.4_

- [x] 5. Create frontend Revision Friend page
  - [x] 5.1 Create base component structure
    - Create `client/src/pages/RevisionFriendPage.tsx`
    - Set up component state (session, history, suggestions)
    - Define TypeScript interfaces
    - _Requirements: 1.1_

  - [x] 5.2 Implement topic input and session start
    - Add subject selector (English, Science, Math, SST)
    - Add topic input field
    - Add "Start Revision" button
    - Handle session start API call
    - _Requirements: 1.1, 3.1_

  - [x] 5.3 Implement timer and phase display
    - Create countdown timer (180s total)
    - Display current phase indicator
    - Show phase-specific icons and descriptions
    - Handle phase transitions automatically
    - _Requirements: 1.2, 1.3, 1.4, 1.5_

  - [x] 5.4 Implement audio playback controls
    - Add audio player component
    - Add play/pause button
    - Handle audio loading and errors
    - Show audio playback status
    - _Requirements: 1.2_

  - [x] 5.5 Implement session controls
    - Add pause/resume button for timer
    - Add "Next Phase" button
    - Add "End Session" button
    - Handle session completion
    - _Requirements: 1.1_

  - [x] 5.6 Implement history display
    - Fetch and display revision history
    - Show topic, subject, score, and date
    - Highlight weak areas
    - Add "Retry" button for each history item
    - _Requirements: 2.3_

  - [x] 5.7 Implement suggestions display
    - Fetch and display personalized suggestions
    - Show weak area suggestions prominently
    - Add click handlers to start revision from suggestion
    - _Requirements: 2.3, 3.5_

  - [x] 5.8 Add responsive design and styling
    - Make layout mobile-friendly
    - Ensure timer is always visible
    - Make touch targets large enough (44px minimum)
    - Add loading states and animations
    - _Requirements: 1.1_

- [x] 6. Add navigation and routing
  - [x] 6.1 Update navigation component
    - Add "Revision Friend" link to Navigation component
    - Add appropriate icon (BookmarkCheck)
    - Update both desktop and mobile navigation
    - _Requirements: 1.1_

  - [x] 6.2 Add route to App.tsx
    - Import RevisionFriendPage component
    - Add route `/revision-friend`
    - _Requirements: 1.1_

- [x] 7. Testing and validation
  - [ ]* 7.1 Write unit tests for backend service
    - Test session creation
    - Test phase transitions
    - Test weak area tracking logic
    - Test suggestion algorithm
    - _Requirements: 1.1, 2.1, 2.2_

  - [ ]* 7.2 Write unit tests for frontend component
    - Test timer countdown
    - Test phase transitions
    - Test audio controls
    - Test history and suggestions display
    - _Requirements: 1.1, 1.2_

  - [ ]* 7.3 Write integration tests
    - Test complete session flow end-to-end
    - Test weak area workflow
    - Test multi-user isolation
    - _Requirements: 1.1, 2.1, 2.2_

- [x] 8. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

