# Implementation Plan

- [x] 1. Database schema updates and migrations
  - Create Worksheet model with image storage and question tracking
  - Create WorksheetQuestion model for individual question state
  - Add revision fields to Doubt model (isInRevision, addedToRevisionAt)
  - Create DoubtRating model with user-doubt relationship
  - Add necessary indexes for performance optimization
  - _Requirements: 5.1, 5.2, 5.3, 6.1_

- [x] 2. Worksheet service implementation
  - [x] 2.1 Implement worksheet creation and question detection
    - Create worksheetService.ts with createWorksheet function
    - Integrate AI service for question count detection
    - Store worksheet metadata and generate session ID
    - _Requirements: 1.1, 6.1_
  
  - [x] 2.2 Implement question navigation logic
    - Create getNextQuestion function with caching
    - Implement skip functionality
    - Add progress tracking (current/total/completed/skipped)
    - _Requirements: 1.3, 1.4, 6.2, 6.3_
  
  - [x] 2.3 Implement session management
    - Add session expiry handling
    - Create session restoration logic
    - Implement context preservation between questions
    - _Requirements: 6.4, 6.5_

- [x] 3. Revision service implementation
  - [x] 3.1 Create revision management functions
    - Implement addToRevision function
    - Implement removeFromRevision function
    - Create isInRevision check function
    - _Requirements: 2.2, 2.3, 2.5_
  
  - [x] 3.2 Implement revision retrieval and filtering
    - Create getRevisionDoubts with subject grouping
    - Add search functionality for question text
    - Implement subject-based filtering
    - _Requirements: 2.4, 7.1, 7.2, 7.3, 7.4_

- [x] 4. Rating service implementation
  - [x] 4.1 Create rating management functions
    - Implement rateDoubt function with validation (1-5 range)
    - Add upsert logic for rating updates
    - Create getRating function
    - _Requirements: 3.2, 3.5_
  
  - [ ]* 4.2 Implement rating analytics (optional)
    - Create getAverageRatingBySubject function
    - Implement rating distribution calculation
    - Add trends over time analysis
    - _Requirements: 8.1, 8.2, 8.4_

- [x] 5. Dashboard service implementation
  - [x] 5.1 Create dashboard data aggregation
    - Implement getRecentDoubts with limit parameter
    - Add getRevisionCount function
    - Create getDoubtStats for overview metrics
    - _Requirements: 4.1, 4.2, 4.5_

- [x] 6. Backend API routes
  - [x] 6.1 Create worksheet endpoints
    - POST /api/worksheets/create - upload and detect questions
    - GET /api/worksheets/:id/question/:number - get question explanation
    - POST /api/worksheets/:id/skip/:number - skip question
    - GET /api/worksheets/:id/progress - get navigation progress
    - _Requirements: 1.1, 1.3, 1.4_
  
  - [x] 6.2 Create revision endpoints
    - POST /api/revision/add - add doubt to revision
    - DELETE /api/revision/remove/:doubtId - remove from revision
    - GET /api/revision/list - get all revision doubts with filters
    - GET /api/revision/check/:doubtId - check revision status
    - _Requirements: 2.2, 2.4, 2.5_
  
  - [x] 6.3 Create rating endpoints
    - POST /api/ratings/rate - submit or update rating
    - GET /api/ratings/:doubtId - get user's rating for doubt
    - GET /api/ratings/analytics - get rating analytics (optional)
    - _Requirements: 3.2, 3.4, 3.5_
  
  - [x] 6.4 Create dashboard endpoints
    - GET /api/dashboard/recent-doubts - get recent doubts with ratings
    - GET /api/dashboard/stats - get overview statistics
    - _Requirements: 4.1, 4.2, 4.5_

- [x] 7. Frontend: WorksheetNavigator component
  - [x] 7.1 Create navigation UI component
    - Build WorksheetNavigator component with Next/Skip buttons
    - Add progress indicator (current/total)
    - Implement completion message display
    - Add loading states for navigation actions
    - _Requirements: 1.2, 1.3, 1.4, 1.5_

- [x] 8. Frontend: RevisionButton component
  - [x] 8.1 Create revision toggle component
    - Build RevisionButton with state management
    - Implement optimistic UI updates
    - Add visual feedback (checkmark, loading spinner)
    - Handle toggle API calls with error handling
    - _Requirements: 2.1, 2.3_

- [x] 9. Frontend: RatingWidget component
  - [x] 9.1 Create star rating interface
    - Build RatingWidget with 1-5 star display
    - Add hover effects and click handling
    - Implement rating submission with confirmation
    - Display current rating state
    - _Requirements: 3.1, 3.2, 3.3_

- [x] 10. Frontend: Update DoubtExplanationPage
  - [x] 10.1 Integrate new components into explanation page
    - Add WorksheetNavigator when viewing worksheet questions
    - Add RevisionButton to all doubt explanations
    - Add RatingWidget below explanations
    - Update page state management for worksheet context
    - _Requirements: 1.2, 2.1, 3.1_

- [x] 11. Frontend: Dashboard integration
  - [x] 11.1 Create DashboardDoubtCard component
    - Build card component showing doubt summary
    - Display rating stars and revision badge
    - Add click navigation to full explanation
    - _Requirements: 4.2, 4.3_
  
  - [x] 11.2 Update Dashboard page
    - Fetch and display recent doubts (limit 5)
    - Add revision count display with link
    - Show empty state for new users
    - Implement click navigation to doubt pages
    - _Requirements: 4.1, 4.4, 4.5_

- [x] 12. Frontend: RevisionAreaPage
  - [x] 12.1 Create revision area page
    - Build full page component for revision management
    - Implement subject-based grouping display
    - Add search and filter controls
    - Create doubt list with remove functionality
    - Add empty state messaging
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5_

- [x] 13. Frontend: Navigation updates
  - [x] 13.1 Add revision area to navigation
    - Add "Revision" link to main navigation
    - Update routing configuration
    - Add revision count badge (optional)
    - _Requirements: 7.1_

- [x] 14. Error handling and validation
  - [x] 14.1 Implement comprehensive error handling
    - Add error handling for worksheet operations
    - Implement validation for rating range (1-5)
    - Add user authorization checks
    - Create user-friendly error messages
    - _Requirements: 3.1, 5.4_

- [ ] 15. Testing and quality assurance
  - [ ]* 15.1 Write unit tests for services
    - Test worksheet service functions
    - Test revision service operations
    - Test rating validation and upsert logic
    - Test dashboard data aggregation
  
  - [ ]* 15.2 Write integration tests
    - Test complete worksheet navigation flow
    - Test revision add/remove/list cycle
    - Test rating submission and retrieval
    - Test dashboard data fetching
  
  - [ ]* 15.3 Write property-based tests
    - **Property 1: Worksheet Question Sequence Integrity** - Validates: Requirements 1.1, 1.3, 1.4
    - **Property 2: Revision State Consistency** - Validates: Requirements 2.2, 2.3, 2.4
    - **Property 3: Rating Idempotence** - Validates: Requirements 3.5
    - **Property 4: Dashboard Recent Doubts Ordering** - Validates: Requirements 4.1, 4.2
    - **Property 7: Rating Range Validation** - Validates: Requirements 3.1

- [x] 16. Performance optimization
  - [x] 16.1 Implement caching strategies
    - Add database caching for worksheet explanations
    - Implement optimistic UI updates
    - Add indexes for common queries
    - _Requirements: 6.3_

- [ ] 17. Final checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

