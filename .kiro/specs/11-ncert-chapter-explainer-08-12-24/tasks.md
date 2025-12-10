# NCERT Chapter Quick Explainer - Implementation Tasks

## Phase 1: Core Infrastructure

- [ ] 1. Set up database schema and models
  - [ ] 1.1 Add NCERTChapterStudy model to Prisma schema
    - Add fields: userId, class, subject, chapterId, chapterName, studiedAt, revised, completedSummary, followUpCount
    - Add unique constraint on userId + class + subject + chapterId
    - Add indexes for userId, class, subject
    - _Requirements: 9.1, 9.2_
  
  - [ ] 1.2 Add NCERTProgress model to Prisma schema
    - Add fields: userId, totalChapters, completionBadges, lastStudied, subject counts
    - Add unique constraint on userId
    - _Requirements: 9.4, 9.6_
  
  - [ ] 1.3 Add AudioCacheRegistry model to Prisma schema (optional)
    - Add fields: cacheKey, module, subject, class, identifier, language, version, filePath, fileSize, characterCount, generatedAt, lastAccessed, accessCount
    - Add unique constraint on cacheKey
    - Add indexes for module, subject, class
    - _Requirements: 11.16, 11.17_
  
  - [ ] 1.4 Generate Prisma client and run migrations
    - Run `npx prisma migrate dev --name add_ncert_explainer_models`
    - Verify migration success
    - _Requirements: All_

- [ ] 2. Create chapter metadata structure
  - [ ] 2.1 Create chapter data JSON file
    - Create `server/data/ncert-chapters.json`
    - Define structure for all subjects (English, Science, Math, SST)
    - Add all chapters for Class 6-10
    - Include chapter ID, name, book name, chapter number, NCERT pages
    - _Requirements: 2.1-2.25, 8.1-8.7_
  
  - [ ] 2.2 Create chapter data loader service
    - Create `server/services/chapterDataService.ts`
    - Implement `getChapterList(class, subject)` method
    - Implement `getChapterInfo(chapterId)` method
    - Implement chapter search by name/number
    - _Requirements: 8.1-8.7_

## Phase 2: Audio Caching Infrastructure

- [ ] 3. Create unified audio cache service
  - [ ] 3.1 Create base cache service structure
    - Create `server/services/audioCacheService.ts`
    - Define TypeScript interfaces (AudioCacheService, CacheOptions, AudioCacheResult, CacheMetadata)
    - Set up filesystem directory structure
    - _Requirements: 7.1-7.23, 11.20-11.23_
  
  - [ ] 3.2 Implement cache key generation
    - Create `generateCacheKey()` function
    - Format: `{module}_{subject}_{class}_{identifier}_{language}_{version}.mp3`
    - Sanitize identifiers (remove special chars, normalize)
    - Add tests for uniqueness and determinism
    - _Requirements: 10.9, 10.10, 10.11, 10.12_
  
  - [ ] 3.3 Implement cache check logic
    - Create `getCached(key)` method
    - Check filesystem for cached file
    - Verify file integrity (file size > 0, readable)
    - Return cached audio URL if valid
    - _Requirements: 7.1, 7.2, 7.4, 7.5_
  
  - [ ] 3.4 Implement cache save logic
    - Create `saveToCache(key, buffer, metadata)` method
    - Create directory structure if not exists
    - Write audio buffer to file
    - Save metadata to registry (DB or JSON)
    - Handle write errors gracefully
    - _Requirements: 7.1, 7.6-7.9_
  
  - [ ] 3.5 Implement getOrGenerate method
    - Create main `getOrGenerate(key, text, options)` method
    - Flow: check cache → if hit, serve → if miss, call TTS → cache → serve
    - Return AudioCacheResult with source indicator
    - Track cache hits/misses for statistics
    - _Requirements: 7.13, 11.21, 11.22_
  
  - [ ] 3.6 Implement cache statistics tracking
    - Create `getCacheStats()` method
    - Track: totalFiles, totalSize, hitCount, missCount, hitRatio
    - Calculate cost saved (assume $0.015 per 1000 chars)
    - Store stats in memory and persist periodically
    - _Requirements: 7.17, 7.18, 7.19_
  
  - [ ] 3.7 Implement cache warming functionality
    - Create `warmCache(keys)` method
    - Pre-generate audio for provided cache keys
    - Prioritize Class 9-10 chapters
    - Run in background without blocking
    - _Requirements: 7.21, 7.22, 7.23, 11.24, 11.25, 11.26_
  
  - [ ] 3.8 Add cache management utilities
    - Implement cache invalidation by key
    - Implement LRU eviction (if cache > 500MB)
    - Add cleanup for corrupted files
    - _Requirements: 7.11, 7.12_

- [ ] 4. Integrate cache with existing TTS service
  - [ ] 4.1 Update TTS service to use cache
    - Modify `elevenLabsTtsService.ts` to check cache first
    - Use `audioCacheService.getOrGenerate()` for all TTS calls
    - Pass module identifier ('ncert', 'revision', 'doubts', 'worksheets')
    - _Requirements: 11.1-11.15_
  
  - [ ] 4.2 Add logging for cache usage
    - Log `[CACHE HIT] 📦 {cacheKey} (saved ${cost})` for cache hits
    - Log `[ELEVENLABS] 🔊 Generated {cacheKey} ({chars} chars, ${cost}) - cached ✓` for API calls
    - Use console colors: blue for cache, green for API
    - _Requirements: 7.17, 7.18, 10.13, 10.14, 10.15_
  
  - [ ] 4.3 Return audio metadata in responses
    - Add `audioMetadata` field to all audio responses
    - Include: source ('cache' | 'elevenlabs'), cacheKey, timestamp
    - Add optional fields: fileSize, characterCount
    - _Requirements: 7.21, 10.5_

## Phase 3: NCERT Explainer Backend Service

- [ ] 5. Create NCERT explainer prompts
  - [ ] 5.1 Create prompt template file
    - Create `server/prompts/ncertExplainerPrompts.ts`
    - Define interfaces for prompt parameters
    - _Requirements: 1.1-1.10, 4.1-4.13_
  
  - [ ] 5.2 Implement English chapter prompts
    - Create `getEnglishProsePrompt()` - covers plot, characters, theme, literary devices
    - Create `getEnglishPoetryPrompt()` - covers stanza summary, poetic devices, central idea
    - Include Hinglish usage, NCERT page references
    - Differentiate Class 6-8 (simpler) vs 9-10 (exam-focused)
    - _Requirements: 1.2, 4.1, 4.2, 5.1-5.4, 5.9, 5.10_
  
  - [ ] 5.3 Implement Science chapter prompts
    - Create `getSciencePrompt()` - covers concepts, definitions, diagrams, experiments, applications
    - Include subject-specific terminology
    - Add real-life examples
    - _Requirements: 1.3, 4.3, 4.4, 4.5, 4.6, 5.1-5.4_
  
  - [ ] 5.4 Implement Math chapter prompts
    - Create `getMathPrompt()` - covers formulas, theorems, solving steps, common mistakes
    - Include step-by-step approaches
    - Highlight algebra/geometry/arithmetic differences
    - _Requirements: 1.4, 4.7, 4.8, 4.9, 4.10, 5.1-5.4_
  
  - [ ] 5.5 Implement Social Studies chapter prompts
    - Create `getHistoryPrompt()` - covers events, dates, key figures, causes, effects
    - Create `getGeographyPrompt()` - covers location, physical features, resources, map work
    - Create `getCivicsPrompt()` - covers concepts, institutions, rights/duties, examples
    - _Requirements: 1.5, 4.11, 4.12, 4.13, 5.1-5.4_
  
  - [ ] 5.6 Implement follow-up question prompts
    - Create `getFollowUpPrompt()` for English (character analysis, moral, literary devices)
    - Create follow-up prompts for Science (diagrams, experiments, terms)
    - Create follow-up prompts for Math (formulas, solving methods, theorems)
    - Create follow-up prompts for SST (dates, causes, maps)
    - Add exam preparation prompts ("exam mein kya aayega")
    - _Requirements: 3.1-3.17_

- [ ] 6. Create NCERT explainer service
  - [ ] 6.1 Create service structure
    - Create `server/services/ncertExplainerService.ts`
    - Define TypeScript interfaces (ChapterRequest, ChapterResponse, FollowUpRequest, FollowUpResponse)
    - Import audioCacheService, aiService, chapterDataService
    - _Requirements: 1.1_
  
  - [ ] 6.2 Implement chapter summary generation
    - Create `getChapterSummary(request)` method
    - Get chapter info from chapterDataService
    - Select subject-specific prompt based on subject
    - Generate AI content with appropriate prompt
    - Generate cache key: `ncert_{subject}_{class}_{chapterId}_{language}_v1`
    - Call `audioCacheService.getOrGenerate()` with cache key
    - Save study record to NCERTChapterStudy table
    - Return ChapterResponse with audio metadata
    - _Requirements: 1.1-1.10, 7.1-7.23_
  
  - [ ] 6.3 Implement follow-up question handling
    - Create `answerFollowUp(request)` method
    - Get chapter context from previous study
    - Generate subject-specific follow-up response
    - For unique questions: generate audio WITHOUT caching
    - For common questions: hash question and cache with key: `ncert_{chapterId}_faq_{hash}_{language}_v1`
    - Increment followUpCount in database
    - _Requirements: 3.1-3.17, 7.14, 7.15, 7.16_
  
  - [ ] 6.4 Implement chapter list retrieval
    - Create `getChapterList(class, subject)` method
    - Delegate to chapterDataService
    - Return formatted chapter list
    - _Requirements: 2.1-2.25, 8.1-8.7_
  
  - [ ] 6.5 Implement study history tracking
    - Create `getStudyHistory(userId)` method
    - Query NCERTChapterStudy table
    - Order by studiedAt DESC
    - Limit to last 50 chapters
    - Return with chapter details
    - _Requirements: 9.1, 9.2, 9.5_
  
  - [ ] 6.6 Implement progress tracking
    - Create `getProgress(userId)` method
    - Query NCERTProgress table
    - Calculate subject-wise counts
    - Check for completion badges (e.g., all chapters in a subject)
    - Return progress statistics
    - _Requirements: 9.3, 9.4, 9.6_
  
  - [ ] 6.7 Implement chapter recognition and search
    - Create `searchChapter(query, class, subject)` method
    - Support chapter number ("Ch5")
    - Support chapter name ("Photosynthesis")
    - Support partial name matching
    - Suggest matching chapters if ambiguous
    - _Requirements: 8.1-8.7_

## Phase 4: API Endpoints

- [ ] 7. Create NCERT explainer API endpoints
  - [ ] 7.1 Implement chapter summary endpoint
    - POST `/api/ncert-explainer/chapter-summary`
    - Add authMiddleware for user authentication
    - Validate request: class (6-10), subject, chapterId
    - Call `ncertExplainerService.getChapterSummary()`
    - Return chapter response with audio metadata
    - Handle errors: invalid input, AI failure, TTS failure
    - _Requirements: 1.1-1.10_
  
  - [ ] 7.2 Implement follow-up question endpoint
    - POST `/api/ncert-explainer/followup`
    - Add authMiddleware
    - Validate request: chapterId, question
    - Call `ncertExplainerService.answerFollowUp()`
    - Return answer with optional audio
    - _Requirements: 3.1-3.17_
  
  - [ ] 7.3 Implement chapter list endpoint
    - GET `/api/ncert-explainer/chapters?class={class}&subject={subject}`
    - Validate query params
    - Call `ncertExplainerService.getChapterList()`
    - Return chapter list
    - _Requirements: 2.1-2.25, 8.1-8.7_
  
  - [ ] 7.4 Implement history endpoint
    - GET `/api/ncert-explainer/history`
    - Add authMiddleware
    - Call `ncertExplainerService.getStudyHistory(userId)`
    - Return history with chapter details
    - _Requirements: 9.1, 9.2, 9.5_
  
  - [ ] 7.5 Implement progress endpoint
    - GET `/api/ncert-explainer/progress`
    - Add authMiddleware
    - Call `ncertExplainerService.getProgress(userId)`
    - Return progress statistics
    - _Requirements: 9.3, 9.4, 9.6_
  
  - [ ] 7.6 Implement cache stats endpoint (admin only)
    - GET `/api/ncert-explainer/cache/stats`
    - Add admin authentication check
    - Call `audioCacheService.getCacheStats()`
    - Return cache statistics
    - _Requirements: 7.17, 7.18, 7.19_
  
  - [ ] 7.7 Implement cache warming endpoint (admin only)
    - POST `/api/ncert-explainer/cache/warm`
    - Add admin authentication
    - Validate request: chapters array
    - Call `audioCacheService.warmCache()`
    - Return warming results
    - _Requirements: 7.21, 7.22, 7.23_
  
  - [ ] 7.8 Implement chapter search endpoint
    - GET `/api/ncert-explainer/search?q={query}&class={class}&subject={subject}`
    - Call `ncertExplainerService.searchChapter()`
    - Return matching chapters
    - _Requirements: 8.1-8.7_
  
  - [ ] 7.9 Add error handling and validation
    - Validate all inputs (class range, subject enum, non-empty strings)
    - Handle AI service failures with fallbacks
    - Handle TTS failures gracefully (return text-only)
    - Return appropriate HTTP status codes (400, 401, 500)
    - Log all errors with context
    - _Requirements: All_

## Phase 5: Frontend Implementation

- [ ] 8. Create NCERT Explainer frontend page
  - [ ] 8.1 Create base component structure
    - Create `client/src/pages/NCERTExplainerPage.tsx`
    - Set up component state (session, history, progress, audioMetadata)
    - Define TypeScript interfaces
    - Import necessary utilities (authenticatedFetch, getApiUrl)
    - _Requirements: 1.1_
  
  - [ ] 8.2 Implement class and subject selectors
    - Add class dropdown (6-10)
    - Add subject selector with icons (📚 English, 🔬 Science, ➗ Math, 🌍 SST)
    - Add onChange handlers
    - Fetch chapter list when class/subject changes
    - _Requirements: 1.1, 2.1-2.25_
  
  - [ ] 8.3 Implement chapter selection
    - Add chapter dropdown (populated from API)
    - Display chapter number, name, and book name
    - Add "Get Explanation" button
    - Handle chapter selection
    - _Requirements: 1.1, 8.1-8.7_
  
  - [ ] 8.4 Implement audio player with cache indicators
    - Create audio player component
    - Add play/pause controls
    - Display audio source badge:
      - BLUE badge "📦 Cached" for cache hits
      - GREEN badge "🔊 ElevenLabs" for fresh API calls
    - Add loading state
    - Show audio duration
    - Handle playback errors (fallback to text)
    - _Requirements: 1.1, 10.1, 10.2, 10.3, 10.4_
  
  - [ ] 8.5 Implement developer mode cache details
    - Add developer mode toggle (localStorage flag or env var)
    - When enabled, show detailed cache info:
      - Cache key
      - File size
      - Generation timestamp
      - Character count
    - Add hover tooltip on badge with cache details
    - _Requirements: 10.5, 10.6, 10.7, 10.8_
  
  - [ ] 8.6 Implement console logging for cache
    - Log cache hits in blue: `[CACHE HIT] 📦 {cacheKey} (saved $X.XX)`
    - Log API calls in green: `[ELEVENLABS] 🔊 {cacheKey} ({chars} chars, $X.XX)`
    - Log session summary on page close
    - _Requirements: 10.13, 10.14, 10.15, 10.16_
  
  - [ ] 8.7 Implement chapter summary display
    - Show chapter name and NCERT pages
    - Display AI-generated summary text
    - Format based on subject (bullets for Science, numbered for SST history)
    - Add auto-scroll to summary on load
    - _Requirements: 1.1-1.10_
  
  - [ ] 8.8 Implement follow-up question input
    - Add text input for follow-up questions
    - Add subject-specific suggestion chips:
      - English: "Characters?", "Moral?", "Literary devices?"
      - Science: "Diagrams?", "Experiments?", "Applications?"
      - Math: "Formulas?", "How to solve?", "Theorems?"
      - SST: "When did this happen?", "Why?", "Map locations?"
    - Add "Ask Follow-up" button
    - Display follow-up response with optional audio
    - _Requirements: 3.1-3.17_
  
  - [ ] 8.9 Implement progress tracking display
    - Fetch and display user progress
    - Show total chapters studied
    - Show subject-wise breakdown (English: 5/50, Science: 12/80, etc.)
    - Display completion badges
    - Add progress bar for each subject
    - _Requirements: 9.3, 9.4, 9.6_
  
  - [ ] 8.10 Implement study history display
    - Fetch and display last 20 chapters studied
    - Show: chapter name, subject, date, revised status
    - Add "Revise" button for each chapter
    - Highlight recently studied chapters
    - _Requirements: 9.1, 9.2, 9.5_
  
  - [ ] 8.11 Implement chapter search
    - Add search input field
    - Search by chapter name or number
    - Show matching results as dropdown
    - Allow quick selection from search results
    - _Requirements: 8.1-8.7_
  
  - [ ] 8.12 Add responsive design and styling
    - Make layout mobile-friendly (mobile-first)
    - Use dark theme matching other pages
    - Ensure touch-friendly controls (min 44px)
    - Add loading skeletons
    - Add animations for phase transitions
    - Match overall app styling
    - _Requirements: 1.1, 6.1-6.6_
  
  - [ ] 8.13 Add error handling and loading states
    - Show loading spinner while fetching chapters
    - Show error messages for failed requests
    - Add retry buttons for failures
    - Handle audio playback failures gracefully
    - Show fallback text if audio unavailable
    - _Requirements: All_

## Phase 6: Navigation and Integration

- [ ] 9. Add navigation and routing
  - [ ] 9.1 Update navigation component
    - Add "NCERT Explainer" link to Navigation component
    - Add appropriate icon (BookOpen or GraduationCap)
    - Update both desktop and mobile navigation
    - _Requirements: 1.1_
  
  - [ ] 9.2 Add route to App.tsx
    - Import NCERTExplainerPage component
    - Add route `/ncert-explainer`
    - Add to Layout wrapper
    - _Requirements: 1.1_
  
  - [ ] 9.3 Update homepage card (if exists)
    - Add NCERT Explainer feature card to homepage
    - Include description and benefits
    - Link to /ncert-explainer
    - _Requirements: 1.1_

## Phase 7: Multi-Module Cache Integration

- [ ] 10. Extend caching to Revision Friend module
  - [ ] 10.1 Update Revision Friend service
    - Import audioCacheService
    - Generate cache keys for explanation/repeat phases
    - Format: `revision_{subject}_{topic_slug}_{phase}_{language}_v1`
    - Use `audioCacheService.getOrGenerate()` for fixed content
    - Do NOT cache quiz/drill phases (dynamic)
    - _Requirements: 11.1-11.5_
  
  - [ ] 10.2 Update Revision Friend API responses
    - Add audioMetadata to all audio responses
    - Include source indicator in responses
    - _Requirements: 11.1-11.5_
  
  - [ ] 10.3 Update Revision Friend frontend
    - Add cache badge to audio player
    - Log cache usage to console
    - _Requirements: 11.1-11.5_

- [ ] 11. Extend caching to other modules (optional - future task)
  - [ ] 11.1 Doubts module integration
    - Cache frequent questions (asked 5+ times)
    - Use question hash for cache key
    - _Requirements: 11.6-11.9_
  
  - [ ] 11.2 Worksheets module integration
    - Cache static instructions
    - Cache common question explanations
    - _Requirements: 11.10-11.12_

## Phase 8: Deployment and Optimization

- [ ] 12. Prepare for Railway deployment
  - [ ] 12.1 Set up audio cache directory structure
    - Create `server/audio-cache/` directory
    - Add subdirectories: ncert/, revision/, doubts/, worksheets/
    - Add `.gitkeep` files in base directories
    - Add `server/audio-cache/*` to `.gitignore` (except .gitkeep)
    - _Requirements: 7.6, 7.7, 7.8, 7.9_
  
  - [ ] 12.2 Configure Railway volume mount
    - Update Railway config to mount persistent volume at `/app/server/audio-cache`
    - Set environment variable: `AUDIO_CACHE_PATH=/app/server/audio-cache`
    - Test volume persistence across deployments
    - _Requirements: 7.7, 7.9_
  
  - [ ] 12.3 Add environment variables
    - `AUDIO_CACHE_PATH` - Path to cache directory
    - `AUDIO_CACHE_MAX_SIZE` - Max cache size (default: 500MB)
    - `ENABLE_CACHE_WARMING` - Enable pre-warming (default: true)
    - `CACHE_WARMING_PRIORITY` - Classes to prioritize (default: "9,10")
    - _Requirements: 7.9, 7.21-7.23_
  
  - [ ] 12.4 Implement cache pre-warming script
    - Create script to pre-warm popular chapters
    - Prioritize Class 9-10 English, Science, Math
    - Run during deployment initialization (optional)
    - _Requirements: 7.21, 7.22, 7.23, 11.24-11.26_

## Phase 9: Testing and Validation

- [ ] 13. Write backend tests
  - [ ] 13.1 Test audio cache service
    - Test cache key generation (uniqueness, determinism)
    - Test cache hit/miss logic
    - Test file integrity verification
    - Test cache stats calculation
    - Test LRU eviction (if implemented)
    - _Requirements: 7.1-7.23_
  
  - [ ] 13.2 Test NCERT explainer service
    - Test chapter summary generation
    - Test subject-specific content structure
    - Test follow-up question handling
    - Test progress tracking
    - Test chapter search
    - _Requirements: 1.1-1.10, 3.1-3.17_
  
  - [ ] 13.3 Test API endpoints
    - Test all endpoints with valid inputs
    - Test error handling (invalid class, subject, chapter)
    - Test authentication requirements
    - Test response formats
    - _Requirements: All_

- [ ] 14. Write frontend tests
  - [ ] 14.1 Test component rendering
    - Test class/subject/chapter selection
    - Test audio player controls
    - Test cache badge display
    - Test follow-up question input
    - _Requirements: 10.1-10.16_
  
  - [ ] 14.2 Test user interactions
    - Test chapter selection flow
    - Test audio playback
    - Test follow-up question submission
    - Test history and progress display
    - _Requirements: 1.1-1.10_

- [ ] 15. Property-based testing
  - [ ] 15.1 Test cache key uniqueness
    - Use fast-check to generate random inputs
    - Verify deterministic cache keys
    - Verify no collisions
    - _Requirements: 10.9-10.12_
  
  - [ ] 15.2 Test cache source indicator
    - Verify cache hits return source='cache'
    - Verify cache misses return source='elevenlabs'
    - _Requirements: 10.1-10.3_
  
  - [ ] 15.3 Test subject-specific content
    - Generate random subjects
    - Verify content structure matches subject type
    - _Requirements: 4.1-4.13_

- [ ] 16. Integration testing
  - [ ] 16.1 Test end-to-end chapter study flow
    - Select chapter → Get summary → Play audio → Check history
    - _Requirements: 1.1-1.10, 9.1-9.6_
  
  - [ ] 16.2 Test cache workflow
    - Request chapter (cache miss) → Verify green badge
    - Request same chapter (cache hit) → Verify blue badge
    - _Requirements: 7.1-7.23, 10.1-10.16_
  
  - [ ] 16.3 Test multi-subject coverage
    - Test all 4 subjects with different chapters
    - Verify subject-specific content
    - _Requirements: 1.2-1.5, 4.1-4.13_

- [ ] 17. Manual testing checklist
  - [ ] Test all class levels (6-10)
  - [ ] Test all 4 subjects
  - [ ] Verify blue badge for cached audio
  - [ ] Verify green badge for fresh audio
  - [ ] Check console logs for cache hits/misses
  - [ ] Test follow-up questions for all subjects
  - [ ] Verify progress tracking accuracy
  - [ ] Test on mobile devices
  - [ ] Check audio quality
  - [ ] Verify NCERT page references
  - [ ] Test cache warming functionality
  - [ ] Verify Railway deployment persistence
  - _Requirements: All_

- [ ] 18. Checkpoint - Ensure all tests pass
  - Verify all unit tests pass
  - Verify all integration tests pass
  - Verify manual testing checklist complete
  - Ask user if questions arise

## Phase 10: Final Polish and Documentation

- [ ] 19. Performance optimization
  - [ ] Add lazy loading for chapter lists
  - [ ] Optimize audio file sizes
  - [ ] Add CDN support for cached audio (optional)
  - [ ] Implement pagination for history
  - _Requirements: 6.1-6.6_

- [ ] 20. Monitoring and analytics
  - [ ] Add cache hit ratio logging
  - [ ] Track cost savings
  - [ ] Monitor cache size growth
  - [ ] Add admin dashboard for cache stats (optional)
  - _Requirements: 7.17-7.19_

- [ ] 21. Final review and cleanup
  - [ ] Remove debug logs
  - [ ] Update .gitignore
  - [ ] Verify all environment variables documented
  - [ ] Test Railway deployment
  - [ ] User acceptance testing

