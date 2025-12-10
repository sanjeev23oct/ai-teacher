# Group Study Simulator - Implementation Tasks

- [ ] 1. Set up database schema and models
  - Add GroupStudySession and HandlingSkillProgress models to Prisma schema
  - Generate Prisma client
  - Run database migrations
  - _Requirements: 3.1, 3.2_

- [ ] 2. Create backend group study service
  - [ ] 2.1 Implement core service structure
    - Create `server/services/groupStudyService.ts`
    - Define TypeScript interfaces for session, classmates, and responses
    - Set up in-memory session state management
    - _Requirements: 1.1, 1.2_

  - [ ] 2.2 Implement session start logic
    - Create `startSession()` method
    - Accept student-provided names for both AI classmates
    - Initialize conversation state with custom names
    - Set difficulty level based on user's history
    - Return session data with classmate names and initial prompt
    - _Requirements: 1.1_

  - [ ] 2.3 Implement first classmate's follow-up question generation
    - Create `getClassmate1Question()` method
    - Use student-provided name in AI prompt
    - Analyze student's initial answer
    - Generate contextual follow-up question using AI
    - Adapt challenge type based on answer quality (basic/vague/strong)
    - Generate TTS audio (male voice by default)
    - _Requirements: 1.1, 2.1, 2.3, 2.4_

  - [ ] 2.4 Implement second classmate's counter-argument generation
    - Create `getClassmate2Counter()` method
    - Use student-provided name in AI prompt
    - Analyze student's response to first classmate
    - Generate counter-argument or alternative viewpoint using AI
    - Provide respectful disagreement with reasoning
    - Generate TTS audio (female voice by default)
    - _Requirements: 1.2, 2.2, 2.4_

  - [ ] 2.5 Implement handling skill evaluation
    - Create `evaluateHandling()` method
    - Analyze all student responses (initial + 2 follow-ups)
    - Calculate handling score (1-5) based on: clarity, addressing challenges, evidence, composure
    - Identify strengths and improvement areas
    - Check for badge eligibility
    - _Requirements: 1.4, 1.5, 3.3_

  - [ ] 2.6 Implement difficulty adjustment
    - Create `adjustDifficulty()` method
    - Track last 5 session scores per user
    - Calculate average and set difficulty level (supportive/moderate/challenging)
    - Apply difficulty to both classmates' challenge types
    - _Requirements: 3.1, 3.2, 2.4, 2.5_

  - [ ] 2.7 Implement history and progress tracking
    - Create `getHistory()` method
    - Fetch user's group study session history
    - Include handling scores, topics, and badges
    - Calculate trends and improvement metrics
    - _Requirements: 3.1, 3.5_

- [ ] 3. Create AI prompts for AI classmates
  - [ ] 3.1 Create first classmate (questioner) personality prompt
    - Create `server/prompts/groupStudyPrompts.ts`
    - Define questioner personality (curious, asks "what about...")
    - Create prompt template with {classmate1Name} variable
    - Add subject-specific context
    - Include Hinglish conversational tone
    - _Requirements: 1.1, 1.3, 2.1_

  - [ ] 3.2 Create second classmate (challenger) personality prompt
    - Define challenger personality (analytical, respectful disagreement)
    - Create prompt template with {classmate2Name} variable
    - Add "I disagree because..." patterns
    - Include Hinglish conversational tone
    - _Requirements: 1.2, 1.3, 2.2_

  - [ ] 3.3 Create evaluation prompt
    - Define criteria for handling skill assessment
    - Create prompt for analyzing student responses
    - Include scoring rubric (1-5 scale)
    - Generate feedback on strengths and improvements
    - _Requirements: 1.4, 1.5, 3.4_

  - [ ] 3.4 Add difficulty-based prompt variations
    - Create supportive mode prompts (gentle probing)
    - Create moderate mode prompts (assumption challenges)
    - Create challenging mode prompts (edge cases, strong counter-arguments)
    - _Requirements: 2.4, 2.5, 3.2_

- [ ] 4. Create API endpoints
  - [ ] 4.1 Implement session management endpoints
    - POST `/api/group-study/start` - Start new discussion session (accept classmate names)
    - POST `/api/group-study/classmate1-question` - Get first classmate's follow-up
    - POST `/api/group-study/classmate2-counter` - Get second classmate's counter-argument
    - POST `/api/group-study/evaluate` - Evaluate handling and complete session
    - _Requirements: 1.1, 1.2, 1.4_

  - [ ] 4.2 Implement history and progress endpoints
    - GET `/api/group-study/history` - Get user's discussion history
    - GET `/api/group-study/badges` - Get earned badges
    - _Requirements: 3.1, 3.3_

  - [ ] 4.3 Add audio streaming endpoint
    - POST `/api/group-study/audio/stream` - Stream AI classmate audio
    - Support different voices based on role (questioner vs challenger)
    - Handle voice settings and TTS failures
    - _Requirements: 1.3_

  - [ ] 4.4 Add error handling and validation
    - Validate student responses (min 10 chars)
    - Handle AI service failures with retries
    - Handle TTS failures gracefully (text fallback)
    - Return appropriate error responses
    - _Requirements: 2.3_

- [ ] 5. Create frontend Group Study page
  - [ ] 5.1 Create base component structure
    - Create `client/src/pages/GroupStudyPage.tsx`
    - Set up component state (session, classmates, responses)
    - Define TypeScript interfaces
    - _Requirements: 1.1_

  - [ ] 5.2 Implement classmate name input and session start
    - Add subject selector (English, Science, Math, SST)
    - Add topic/question input field
    - Add input fields for two classmate names (with default suggestions)
    - Add "Start Discussion" button
    - Handle session start API call with custom names
    - _Requirements: 1.1_

  - [ ] 5.3 Implement AI classmate UI components
    - Create avatar components for both classmates (use student-chosen names)
    - Create speech bubble components for messages
    - Add active speaker indicator
    - Add "thinking..." loading state
    - Display classmate names dynamically
    - _Requirements: 1.1, 1.2, 1.3_

  - [ ] 5.4 Implement conversation flow
    - Display student answer input
    - Show first classmate's question with audio playback
    - Display student response to first classmate
    - Show second classmate's counter-argument with audio playback
    - Display student response to second classmate
    - Handle turn-based progression with custom names
    - _Requirements: 1.1, 1.2_

  - [ ] 5.5 Implement audio playback for AI classmates
    - Add audio player for first classmate (questioner voice)
    - Add audio player for second classmate (challenger voice)
    - Add play/pause/replay controls
    - Handle audio loading and errors
    - Show text fallback if audio fails
    - _Requirements: 1.3_

  - [ ] 5.6 Implement handling skill display
    - Create skill meter component (1-5 scale)
    - Display score after evaluation
    - Show strengths and improvements feedback
    - Animate score reveal
    - _Requirements: 1.4, 1.5, 3.4, 3.5_

  - [ ] 5.7 Implement history and progress display
    - Fetch and display discussion history
    - Show handling scores over time (trend chart)
    - Display earned badges
    - Highlight improvement messages
    - Add "Retry Topic" option
    - _Requirements: 3.1, 3.3, 3.5_

  - [ ] 5.8 Add responsive design and styling
    - Make conversation layout mobile-friendly
    - Stack avatars vertically on small screens
    - Ensure speech bubbles are readable
    - Make touch targets large enough (44px minimum)
    - Add animations for message appearance
    - _Requirements: 1.1_

- [ ] 6. Add navigation and routing
  - [ ] 6.1 Update navigation component
    - Add "Group Study" link to Navigation component
    - Add appropriate icon (Users or MessageSquare)
    - Mark as "Coming Soon" badge initially
    - Update both desktop and mobile navigation
    - _Requirements: 1.1_

  - [ ] 6.2 Add route to App.tsx
    - Import GroupStudyPage component
    - Add route `/group-study`
    - _Requirements: 1.1_

- [ ] 7. Implement badge system
  - [ ] 7.1 Create badge award logic
    - Define badge criteria ("Discussion Pro", "Critical Thinker", etc.)
    - Check criteria after each session completion
    - Award new badges and notify user
    - Store badges in HandlingSkillProgress table
    - _Requirements: 3.3_

  - [ ] 7.2 Create badge display component
    - Create badge icon/card components
    - Display earned badges on history page
    - Show badge award animation
    - Add badge descriptions on hover/click
    - _Requirements: 3.3_

- [ ] 8. Testing and validation
  - [ ] 8.1 Write unit tests for backend service
    - Test session creation with custom classmate names
    - Test first classmate's question generation (different answer types)
    - Test second classmate's counter-argument generation
    - Test handling score calculation algorithm
    - Test difficulty adjustment logic
    - Test badge award logic
    - _Requirements: 1.1, 1.4, 2.4, 3.2, 3.3_

  - [ ] 8.2 Write unit tests for frontend component
    - Test conversation flow state machine
    - Test turn tracking (student → classmate1 → classmate2 → eval)
    - Test dynamic name rendering
    - Test audio playback controls
    - Test history display and filtering
    - Test badge display logic
    - _Requirements: 1.1, 1.2_

  - [ ] 8.3 Write property-based tests
    - Test conversation flow consistency (always same order)
    - Test challenge adaptation (vague answers get clarification)
    - Test natural language (no teacher-like formality)
    - Test handling score range (always 1-5)
    - _Requirements: 1.1, 1.3, 1.4, 2.1, 2.2_

  - [ ] 8.4 Write integration tests
    - Test complete session flow end-to-end
    - Test difficulty progression (5 sessions → increase difficulty)
    - Test badge award workflow (3 good sessions → badge)
    - Test multi-user isolation
    - _Requirements: 1.1, 3.1, 3.2, 3.3_

- [ ] 9. Manual testing and refinement
  - [ ] 9.1 Test AI classmate personalities with custom names
    - Verify first classmate asks curious, probing questions
    - Verify second classmate provides thoughtful counter-arguments
    - Check conversational tone uses student-provided names correctly
    - Test with different subjects and topics
    - Test with various name combinations
    - _Requirements: 1.1, 1.2, 1.3_

  - [ ] 9.2 Test difficulty progression
    - Complete sessions with high scores → verify difficulty increases
    - Complete sessions with low scores → verify supportive mode
    - Check challenge types match difficulty level
    - _Requirements: 2.4, 2.5, 3.2_

  - [ ] 9.3 Test badge system
    - Complete sessions to earn each badge
    - Verify award notifications appear
    - Check badge display on history page
    - _Requirements: 3.3_

  - [ ] 9.4 Test on mobile devices
    - Check conversation UI on small screens
    - Verify audio playback works
    - Test touch interactions
    - Check keyboard doesn't hide conversation
    - _Requirements: 1.1_

- [ ] 10. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.
