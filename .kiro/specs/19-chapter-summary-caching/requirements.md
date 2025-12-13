# Requirements Document

## Introduction

This feature addresses the inefficiency of making expensive LLM calls every time a user requests an NCERT chapter summary. Currently, the system generates summaries on-the-fly using AI, even for the same chapter requested multiple times. This feature introduces database-backed summary caching with an admin interface for manual summary management, reducing API costs and improving response times.

## Glossary

- **Chapter_Summary_Cache**: A database table storing pre-generated or manually added chapter summaries
- **Admin_Panel**: A separate screen/page where administrators can manually add, edit, or delete chapter summaries
- **LLM_Call**: An expensive API call to the AI service (Gemini/OpenAI) to generate content
- **Cache_Hit**: When a requested summary is found in the database and returned without an LLM call
- **Cache_Miss**: When a requested summary is not found in the database, requiring an LLM call

## Requirements

### Requirement 1

**User Story:** As a system administrator, I want to manually add chapter summaries through an admin interface, so that I can pre-populate summaries from external sources like ChatGPT without incurring LLM costs.

#### Acceptance Criteria

1. WHEN an admin navigates to the summary management page THEN the System SHALL display a list of all chapters organized by class and subject
2. WHEN an admin selects a chapter to add/edit a summary THEN the System SHALL display a form with fields for summary text and metadata
3. WHEN an admin submits a new summary THEN the System SHALL store the summary in the database with the chapter identifier
4. WHEN an admin edits an existing summary THEN the System SHALL update the stored summary and timestamp
5. WHEN an admin deletes a summary THEN the System SHALL remove the summary from the database

### Requirement 2

**User Story:** As a student, I want chapter summaries to load quickly from cached data, so that I can start learning without waiting for AI generation.

#### Acceptance Criteria

1. WHEN a user requests a chapter summary THEN the System SHALL first check the database for a cached summary
2. WHEN a cached summary exists THEN the System SHALL return the cached summary without making an LLM call
3. WHEN no cached summary exists THEN the System SHALL generate a summary via LLM and store it in the database for future requests
4. WHEN returning a cached summary THEN the System SHALL include metadata indicating the source (cached vs generated)

### Requirement 3

**User Story:** As a developer, I want the caching pattern to be reusable across other features, so that I can apply the same optimization to similar expensive operations.

#### Acceptance Criteria

1. WHEN implementing the caching layer THEN the System SHALL use a consistent database schema pattern that can be extended to other modules
2. WHEN a cache entry is accessed THEN the System SHALL update the access timestamp and count for analytics
3. WHEN the cache is queried THEN the System SHALL support filtering by module, subject, class, and identifier

### Requirement 4

**User Story:** As a system administrator, I want to see which chapters have cached summaries and which do not, so that I can prioritize content creation.

#### Acceptance Criteria

1. WHEN viewing the admin panel THEN the System SHALL display cache status (cached/not cached) for each chapter
2. WHEN viewing cache statistics THEN the System SHALL show total cached summaries, cache hit rate, and LLM calls saved
3. WHEN filtering chapters THEN the System SHALL allow filtering by subject, class, and cache status

### Requirement 5

**User Story:** As a student, I want the system to work seamlessly whether summaries are cached or generated, so that my learning experience is consistent.

#### Acceptance Criteria

1. WHEN a summary is returned THEN the System SHALL provide the same response structure regardless of source
2. WHEN audio is requested for a summary THEN the System SHALL use the existing audio caching mechanism
3. WHEN an error occurs during LLM generation THEN the System SHALL return a user-friendly error message without exposing technical details
