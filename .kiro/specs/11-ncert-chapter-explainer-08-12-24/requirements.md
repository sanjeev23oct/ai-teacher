# NCERT Chapter Quick Explainer - Requirements

## Introduction

A 60-second audio explanation feature that helps CBSE Class 6-10 students quickly understand NCERT chapters across all subjects (English, Science, Math, Social Studies) in simple Hinglish. Students can ask "Science Ch3 samajh nahi aaya?" and get instant chapter summaries with key concepts, important points, and exam question examples.

## Glossary

- **NCERT**: National Council of Educational Research and Training - official CBSE textbooks
- **Class 6-10**: Middle and secondary school levels (ages 11-16)
- **Subjects**: English (Honeysuckle, Pact with Sun, Beehive, Moments, First Flight, Footprints), Science, Mathematics, Social Studies (History, Geography, Civics)
- **Chapter Summary**: 60-90 second audio covering key concepts, important points, formulas/definitions, and 1-2 exam questions
- **Hinglish**: Natural Hindi-English mix for easy understanding
- **Subject-Specific Content**:
  - **English**: Plot, characters, moral/theme, literary devices
  - **Science**: Concepts, definitions, diagrams explanation, experiments
  - **Math**: Formulas, theorems, step-by-step solving approach, common mistakes
  - **Social Studies**: Events, dates, key figures, cause-effect, map references

## Requirements

### Requirement 1: Multi-Subject Chapter Explanations

**User Story:** As a Class 6-10 student, I want quick chapter explanations across all subjects in Hinglish, so that I can understand difficult chapters before exams.

#### Acceptance Criteria

1. WHEN a student asks "Science Ch3 samajh nahi aaya" THEN the system SHALL provide a 60-90 second audio explanation
2. WHEN explaining an English chapter THEN the system SHALL cover plot, main characters, moral/theme, and literary devices
3. WHEN explaining a Science chapter THEN the system SHALL cover key concepts, definitions, diagram explanations, and real-life applications
4. WHEN explaining a Math chapter THEN the system SHALL cover formulas, theorems, solving steps, and common mistakes to avoid
5. WHEN explaining a Social Studies chapter THEN the system SHALL cover events, dates, key figures, cause-effect relationships, and map references
6. WHEN the student requests THEN the system SHALL use simple Hinglish for easy understanding
7. WHEN a chapter is explained THEN the system SHALL include NCERT page references
8. WHEN the explanation ends THEN the system SHALL ask "Kuch aur doubt hai is chapter mein?"
9. WHEN a student is from Class 6-8 THEN explanations SHALL be more basic and foundational
10. WHEN a student is from Class 9-10 THEN explanations SHALL include exam-focused depth

### Requirement 2: Comprehensive Syllabus Coverage (Class 6-10)

**User Story:** As a student, I want to access all NCERT chapters across subjects and classes, so that I can get help with any chapter I'm studying.

#### Acceptance Criteria

**English:**
1. WHEN the system loads THEN it SHALL have summaries for all Honeysuckle chapters (Class 6)
2. WHEN the system loads THEN it SHALL have summaries for all Pact with the Sun chapters (Class 6)
3. WHEN the system loads THEN it SHALL have summaries for all Honeycomb chapters (Class 7)
4. WHEN the system loads THEN it SHALL have summaries for all Alien Hand chapters (Class 7)
5. WHEN the system loads THEN it SHALL have summaries for all Honeydew chapters (Class 8)
6. WHEN the system loads THEN it SHALL have summaries for all It So Happened chapters (Class 8)
7. WHEN the system loads THEN it SHALL have summaries for all Beehive chapters (Class 9)
8. WHEN the system loads THEN it SHALL have summaries for all Moments chapters (Class 9)
9. WHEN the system loads THEN it SHALL have summaries for all First Flight chapters (Class 10)
10. WHEN the system loads THEN it SHALL have summaries for all Footprints chapters (Class 10)

**Science:**
11. WHEN the system loads THEN it SHALL have summaries for all Science chapters (Class 6-10, each ~16 chapters)
12. WHEN explaining science THEN it SHALL include diagrams, experiments, and scientific terminology
13. WHEN explaining science THEN it SHALL relate concepts to real-life examples

**Mathematics:**
14. WHEN the system loads THEN it SHALL have summaries for all Math chapters (Class 6-10, each ~14-15 chapters)
15. WHEN explaining math THEN it SHALL include formulas, theorems, and solving techniques
16. WHEN explaining math THEN it SHALL provide step-by-step problem-solving approaches
17. WHEN explaining math THEN it SHALL highlight common mistakes students make

**Social Studies:**
18. WHEN the system loads THEN it SHALL have summaries for all History chapters (Class 6-10)
19. WHEN the system loads THEN it SHALL have summaries for all Geography chapters (Class 6-10)
20. WHEN the system loads THEN it SHALL have summaries for all Civics chapters (Class 6-10)
21. WHEN explaining social studies THEN it SHALL include dates, events, key figures, and locations
22. WHEN explaining geography THEN it SHALL reference maps and physical features

**Recognition:**
23. WHEN a student asks for any chapter THEN the system SHALL recognize chapter names and numbers
24. WHEN a student mentions a subject THEN the system SHALL auto-detect the subject (English/Science/Math/SST)
25. WHEN a student asks "Class 7 Science Ch5" THEN the system SHALL identify class, subject, and chapter correctly

### Requirement 3: Interactive Follow-up Questions

**User Story:** As a student, I want to ask follow-up questions about the chapter, so that I can clarify specific doubts.

#### Acceptance Criteria

**General:**
1. WHEN the summary ends THEN the system SHALL allow follow-up questions
2. WHEN discussing the chapter THEN the system SHALL maintain context of the previous explanation

**English-specific:**
3. WHEN a student asks about a character THEN the system SHALL provide detailed character analysis
4. WHEN a student asks about the moral THEN the system SHALL explain the theme/lesson with examples
5. WHEN a student asks about literary devices THEN the system SHALL identify metaphors, similes, personification with examples

**Science-specific:**
6. WHEN a student asks about a diagram THEN the system SHALL explain labeled parts and their functions
7. WHEN a student asks "experiment kaise hoga" THEN the system SHALL describe procedure, observations, and conclusion
8. WHEN a student asks about a scientific term THEN the system SHALL provide definition and example

**Math-specific:**
9. WHEN a student asks "formula kya hai" THEN the system SHALL list all relevant formulas with usage
10. WHEN a student asks "solve kaise karein" THEN the system SHALL provide step-by-step solving method
11. WHEN a student asks about theorems THEN the system SHALL explain statement, proof approach, and application

**Social Studies-specific:**
12. WHEN a student asks "kab hua" THEN the system SHALL provide timeline and sequence of events
13. WHEN a student asks "kyun hua" THEN the system SHALL explain causes and effects
14. WHEN a student asks about a map THEN the system SHALL describe locations and geographical features

**Exam Preparation:**
15. WHEN a student asks "exam mein kya aayega" THEN the system SHALL list likely question types (MCQ, Short Answer, Long Answer)
16. WHEN a student asks for exam tips THEN the system SHALL provide marking scheme insights and important points to remember
17. WHEN a student asks for practice questions THEN the system SHALL generate 2-3 sample questions with answer hints

### Requirement 4: Subject-Specific Content Structure

**User Story:** As a student, I want explanations tailored to each subject's unique needs, so that I learn subject-appropriate content.

#### Acceptance Criteria

**English Chapters:**
1. WHEN explaining prose THEN structure SHALL be: Plot Summary → Characters → Theme/Moral → Literary Devices → Exam Questions
2. WHEN explaining poetry THEN structure SHALL be: Stanza-wise Summary → Poetic Devices → Central Idea → Word Meanings → Exam Questions

**Science Chapters:**
3. WHEN explaining science THEN structure SHALL be: Introduction → Key Concepts → Definitions → Diagrams → Activities/Experiments → Real-life Applications → Exam Questions
4. WHEN explaining biology THEN it SHALL include life processes, organs, functions
5. WHEN explaining chemistry THEN it SHALL include reactions, equations, symbols
6. WHEN explaining physics THEN it SHALL include laws, units, numerical problems

**Math Chapters:**
7. WHEN explaining math THEN structure SHALL be: Concept Introduction → Formulas/Theorems → Solving Techniques → Common Mistakes → Practice Questions
8. WHEN teaching algebra THEN it SHALL include variable manipulation and equation solving
9. WHEN teaching geometry THEN it SHALL include shapes, angles, properties, constructions
10. WHEN teaching arithmetic THEN it SHALL include number operations and applications

**Social Studies Chapters:**
11. WHEN explaining history THEN structure SHALL be: Background → Events (chronological) → Key Figures → Impact/Result → Exam Questions
12. WHEN explaining geography THEN structure SHALL be: Location → Physical Features → Climate → Resources → Human Activities → Map Work
13. WHEN explaining civics THEN structure SHALL be: Concept → Institutions → Rights/Duties → Real Examples → Exam Questions

### Requirement 5: Grade-Appropriate Difficulty Levels

**User Story:** As a student in a specific class, I want explanations suited to my grade level, so that content is neither too simple nor too complex.

#### Acceptance Criteria

**Class 6-8 (Foundation Level):**
1. WHEN student is in Class 6-8 THEN explanations SHALL use simpler vocabulary
2. WHEN student is in Class 6-8 THEN concepts SHALL be explained with more basic examples
3. WHEN student is in Class 6-8 THEN focus SHALL be on understanding fundamentals
4. WHEN student is in Class 6-8 THEN exam questions SHALL be basic recall and understanding types

**Class 9-10 (Board Exam Level):**
5. WHEN student is in Class 9-10 THEN explanations SHALL include advanced terminology
6. WHEN student is in Class 9-10 THEN concepts SHALL connect to broader applications
7. WHEN student is in Class 9-10 THEN focus SHALL be on exam strategy and scoring
8. WHEN student is in Class 9-10 THEN exam questions SHALL include application and analysis types

**Adaptive Content:**
9. WHEN a Class 6 student asks advanced questions THEN system SHALL provide appropriate depth without overwhelming
10. WHEN a Class 10 student asks basic questions THEN system SHALL clarify fundamentals before advancing

### Requirement 6: Audio Quality and Duration Management

**User Story:** As a student, I want concise yet complete audio explanations, so that I can learn quickly without getting bored.

#### Acceptance Criteria

1. WHEN explaining any chapter THEN audio duration SHALL be 60-90 seconds for initial summary
2. WHEN answering follow-up questions THEN audio duration SHALL be 30-45 seconds per answer
3. WHEN content is complex (Math theorems, Science experiments) THEN duration MAY extend to 120 seconds
4. WHEN generating audio THEN speech SHALL be clear, paced appropriately for understanding
5. WHEN using Hinglish THEN code-switching SHALL be natural and conversational
6. WHEN explaining diagrams/maps THEN description SHALL be verbal-friendly without visual dependence

### Requirement 7: Audio Caching and Cost Optimization

**User Story:** As the system owner, I want to cache generated audio for fixed chapter summaries, so that I minimize ElevenLabs API costs and improve response time.

#### Acceptance Criteria

**Caching Strategy:**
1. WHEN a chapter summary is generated THEN audio SHALL be cached to filesystem with unique identifier
2. WHEN the same chapter is requested again THEN system SHALL serve cached audio WITHOUT calling ElevenLabs
3. WHEN audio is cached THEN filename SHALL be format: `{subject}_{class}_{chapter_number}_{language}.mp3`
4. WHEN audio cache exists THEN system SHALL verify file integrity before serving
5. WHEN cached file is corrupted THEN system SHALL regenerate and re-cache

**Storage Structure:**
6. WHEN storing audio THEN directory structure SHALL be `server/audio-cache/{subject}/{class}/`
7. WHEN deployed on Railway THEN audio cache folder SHALL persist across deployments
8. WHEN local testing THEN cache SHALL be in `server/audio-cache/` (gitignored)
9. WHEN in production THEN cache SHALL use Railway volume mount or persistent storage

**Cache Management:**
10. WHEN system starts THEN it SHALL create audio-cache directory if not exists
11. WHEN a chapter summary changes THEN old cached audio SHALL be invalidated by version/hash
12. WHEN cache size exceeds limit (e.g., 500MB) THEN system SHALL implement LRU eviction
13. WHEN generating audio THEN system SHALL first check cache, only call ElevenLabs if cache miss

**Follow-up Questions (Dynamic Content):**
14. WHEN answering follow-up questions THEN audio SHALL NOT be cached (dynamic content)
15. WHEN student asks common follow-up (e.g., "exam mein kya aayega") THEN response MAY be cached with question hash
16. WHEN caching follow-ups THEN cache key SHALL include question text hash + chapter identifier

**Cost Tracking:**
17. WHEN audio is served from cache THEN system SHALL log "[CACHE HIT] {subject} Class {class} Ch{number} - served from cache"
18. WHEN ElevenLabs is called THEN system SHALL log "[ELEVENLABS API] {subject} Class {class} Ch{number} - {character_count} chars - cached for future"
19. WHEN admin requests THEN system SHALL provide cache hit ratio statistics
20. WHEN generating audio THEN system SHALL prefer cached content over API calls in 100% of fixed summary cases
21. WHEN audio is served THEN response SHALL include metadata: `{ source: 'cache' | 'elevenlabs', timestamp: string, cacheKey: string }`

**Pre-warming Strategy:**
21. WHEN system is deployed THEN commonly requested chapters MAY be pre-cached
22. WHEN pre-caching THEN priority SHALL be given to Class 9-10 exam-critical chapters
23. WHEN pre-caching THEN it SHALL happen during low-traffic periods to avoid deployment delays

### Requirement 8: Chapter Recognition and Search

**User Story:** As a student, I want to easily find chapters by name or number, so that I don't waste time searching.

#### Acceptance Criteria

1. WHEN student types "Ch5" THEN system SHALL ask for subject and class if not specified
2. WHEN student types "Photosynthesis" THEN system SHALL recognize it as Science Class 7 Chapter
3. WHEN student types "The Fun They Had" THEN system SHALL recognize it as English Class 9 Beehive
4. WHEN student types "Quadrilaterals" THEN system SHALL recognize it as Math Class 8/9
5. WHEN student types partial chapter name THEN system SHALL suggest matching chapters
6. WHEN student asks "Class 7 Science last chapter" THEN system SHALL identify the final chapter
7. WHEN student is unsure of chapter THEN system SHALL provide chapter list for selected subject/class

### Requirement 10: UI Cache Indicators and Transparency

**User Story:** As a developer/admin, I want to see visual indicators showing audio source (cache vs API), so that I can verify caching is working and monitor costs.

#### Acceptance Criteria

**Visual Indicators:**
1. WHEN audio is playing THEN UI SHALL show a colored badge indicating source
2. WHEN audio is from cache THEN badge SHALL be BLUE with text "📦 Cached"
3. WHEN audio is from ElevenLabs THEN badge SHALL be GREEN with text "🔊 ElevenLabs"
4. WHEN audio is loading THEN badge SHALL show loading state
5. WHEN hovering over badge THEN tooltip SHALL show cache key and timestamp

**Developer Mode:**
6. WHEN developer mode is enabled THEN UI SHALL show detailed cache info (cache key, file size, generation date)
7. WHEN in production THEN cache indicators MAY be hidden from students (optional admin-only view)
8. WHEN testing locally THEN cache indicators SHALL always be visible

**Cache Key Format:**
9. WHEN generating cache key THEN format SHALL be: `{module}_{subject}_{class}_{identifier}_{language}_{version}`
10. WHEN module is ncert-explainer THEN key example: `ncert_science_7_ch3_en_v1.mp3`
11. WHEN module is revision-friend THEN key example: `revision_math_9_quadrilaterals_en_v1.mp3`
12. WHEN content version changes THEN version number SHALL increment (v1 → v2)

**Console Logging:**
13. WHEN audio is served THEN console SHALL log with color coding (blue for cache, green for API)
14. WHEN logging cache hit THEN format SHALL be: `[CACHE HIT] 📦 ncert_science_7_ch3_en_v1.mp3 (saved $0.015)`
15. WHEN logging API call THEN format SHALL be: `[ELEVENLABS] 🔊 Generated ncert_science_7_ch3_en_v1.mp3 (850 chars, $0.015) - cached ✓`
16. WHEN session ends THEN log summary: "Session stats: 5 cache hits, 1 API call, $0.015 spent, $0.075 saved"

### Requirement 11: Multi-Module Cache Extension

**User Story:** As a system owner, I want audio caching across all modules (Revision Friend, Doubts, Worksheets), so that I minimize ElevenLabs costs platform-wide.

#### Acceptance Criteria

**Revision Friend Module:**
1. WHEN generating topic explanations THEN fixed content SHALL be cached with key: `revision_{subject}_{topic_slug}_{phase}_{language}_v1`
2. WHEN phase is explanation/repeat THEN audio SHALL be cached (fixed content)
3. WHEN phase is quiz/drill THEN audio SHALL NOT be cached (dynamic content)
4. WHEN topic is requested again THEN cached audio SHALL be served
5. WHEN language changes THEN separate cache entry SHALL be created

**Doubts Module:**
6. WHEN explaining common NCERT questions THEN solutions MAY be cached with question hash
7. WHEN question text matches 80%+ similarity THEN cached answer MAY be served
8. WHEN question is unique THEN ElevenLabs SHALL be called and NOT cached
9. WHEN doubt is marked as "frequent" (asked 5+ times) THEN audio SHALL be cached

**Worksheets Module:**
10. WHEN generating worksheet instructions THEN static instructions SHALL be cached
11. WHEN providing question explanations THEN common explanations SHALL be cached by question ID
12. WHEN questions are dynamic/random THEN audio SHALL NOT be cached

**NCERT Explainer Module:**
13. WHEN explaining chapters THEN summaries SHALL be cached with chapter identifier
14. WHEN answering common follow-ups THEN responses SHALL be cached with question pattern hash
15. WHEN follow-up is unique THEN ElevenLabs SHALL be called without caching

**Cache Key Registry:**
16. WHEN any module caches audio THEN cache key SHALL follow standard format
17. WHEN cache key is generated THEN it SHALL be stored in cache registry (JSON/DB)
18. WHEN querying cache THEN system SHALL check registry first for key existence
19. WHEN cache is cleared THEN registry SHALL be updated accordingly

**Unified Cache Service:**
20. WHEN implementing caching THEN a shared `audioCacheService` SHALL be created
21. WHEN any module needs audio THEN it SHALL use `audioCacheService.getOrGenerate(key, textContent, options)`
22. WHEN cache service is called THEN it SHALL handle: check cache → serve if exists → else call ElevenLabs → cache → serve
23. WHEN caching THEN service SHALL automatically log and track statistics

**Cache Warming Priorities:**
24. WHEN pre-warming cache THEN priority order SHALL be: NCERT Explainer > Revision Friend > Worksheets > Doubts
25. WHEN pre-warming THEN Class 9-10 content SHALL have higher priority than Class 6-8
26. WHEN pre-warming THEN English medium SHALL be generated before Hindi/other languages

### Requirement 9: Progress Tracking and History

**User Story:** As a student, I want to see which chapters I've studied, so that I can track my revision progress.

#### Acceptance Criteria

1. WHEN a student completes a chapter explanation THEN it SHALL be marked as "studied"
2. WHEN a student views history THEN it SHALL show last 20 chapters studied with timestamps
3. WHEN a student revisits a chapter THEN system SHALL note it as "revised"
4. WHEN a student completes all chapters in a subject THEN system SHALL show completion badge
5. WHEN a student asks "what did I study today" THEN system SHALL list today's chapters
6. WHEN a student asks for recommendations THEN system SHALL suggest unstudied chapters from current syllabus
