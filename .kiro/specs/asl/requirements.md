# CBSE ASL Voice Tutor - Ultra-MVP Requirements

## Goal
Build a single-screen ASL (Assessment of Speaking and Listening) practice tool where Class 9-10 students practice speaking tasks from NCERT syllabus, get instant CBSE-style scores, and receive actionable feedback - all without any database storage.

## The Problem
CBSE students need to practice speaking skills for ASL exams but have no way to:
- Get random syllabus-aligned speaking tasks
- Record themselves with visual feedback
- Get instant CBSE-style scoring (out of 5)
- Receive simple, actionable improvement tips
- Practice pair discussions with realistic AI responses

## The Solution
Ultra-MVP single-screen app with:
1. **Solo Mode**: Random task → Record 60s → Get score + 3 fixes
2. **Pair Mode**: AI starts discussion → Student responds 30s → AI counters → Score interaction
3. **History**: Last 5 sessions (localStorage only, erases on refresh)

## Core Features

### Feature 1: Solo Speaking Practice
**User Flow:**
1. Student opens app → Sees random NCERT task (e.g., "What will schools be like in 2157?")
2. Taps mic button → Records for 60 seconds
3. Sees live visual feedback: waveform + countdown timer
4. Recording stops → AI analyzes speech
5. Gets instant score (X/5) + 3 simple fixes

**Example Output:**
```
Score: 3/5

✅ Good: You spoke clearly and used examples

Fixes:
1. Too many "um"s - breathe instead
2. Add examples from the chapter
3. Speak a bit louder
```

### Feature 2: Pair Discussion Mode
**User Flow:**
1. Student selects "Pair Mode"
2. AI presents opinion: "I think homework is important because..."
3. Student has 30s to respond/counter
4. AI responds naturally with counterpoint
5. Student gets interaction score (X/5)

**Example:**
```
AI: "I think homework is very important because it helps us practice. 
     Without practice, we might forget lessons."

[Student records 30s response]

AI: "That's a good point about needing play time! But don't you think 
     even 30 minutes of homework helps us remember what we learned?"

Score: 4/5
Good: You gave a clear opinion and reason
Fix: Try to give an example next time
```

### Feature 3: Simple History
- Shows last 5 sessions only
- Stored in localStorage (no database)
- Displays: Task, Score, Date
- Erases on browser refresh
- Purpose: Quick reference during same session

## Acceptance Criteria

### AC1: Random Task Selection
- GIVEN student opens the app
- WHEN they start solo mode
- THEN they see a random task from 50 NCERT-aligned prompts
- AND task shows: prompt text, duration (60s), chapter citation

### AC2: Recording with Visual Feedback
- GIVEN student taps record button
- WHEN recording starts
- THEN they see:
  - Live audio waveform (visual feedback)
  - Countdown timer (60s → 0s)
  - Pulsing red record indicator
- AND recording auto-stops at 60 seconds

### AC3: Instant CBSE-Style Scoring
- GIVEN student completes recording
- WHEN AI analyzes the speech
- THEN response arrives in < 8 seconds
- AND shows score out of 5 (e.g., "3/5")
- AND provides exactly 3 simple fixes
- AND fixes are Class 9-appropriate language

### AC4: Hinglish Understanding
- GIVEN student speaks in Hinglish
- WHEN AI transcribes and scores
- THEN it correctly understands mixed Hindi-English
- AND doesn't penalize for code-switching
- AND feedback is in simple English/Hinglish

### AC5: Pair Mode Realism
- GIVEN student selects pair mode
- WHEN AI presents initial opinion
- THEN it sounds like a real classmate (not robotic)
- AND uses simple, natural language
- AND waits for student's 30s response
- AND provides polite counterpoint
- AND scores interaction skills (not just content)

### AC6: Consistent Grading
- GIVEN same quality response
- WHEN scored multiple times
- THEN score variation is ≤ 1 point
- AND feedback themes are consistent

### AC7: No Storage Requirement
- GIVEN any user interaction
- WHEN data is saved
- THEN it goes to localStorage only
- AND no database calls are made
- AND data erases on page refresh

## Success Metrics

### Performance
- ✅ Score delivery < 8 seconds
- ✅ Recording starts instantly (< 500ms)
- ✅ Waveform updates in real-time (< 100ms lag)

### Quality
- ✅ Grading consistency: ±1 point for same response
- ✅ Hinglish recognition: 90%+ accuracy
- ✅ Feedback actionability: Students understand all 3 fixes

### User Experience
- ✅ Students find AI peer "realistic"
- ✅ Feedback feels "helpful for actual ASL exam"
- ✅ Interface is "simple and clear"

## Out of Scope (Not in Ultra-MVP)

- ❌ User accounts / authentication
- ❌ Database storage
- ❌ Progress tracking over time
- ❌ Detailed analytics
- ❌ Multiple language support (English/Hinglish only)
- ❌ Sharing recordings
- ❌ Teacher dashboard
- ❌ Offline mode
- ❌ Custom task creation

## Technical Constraints

### Must Use
- Existing voice recording infrastructure
- Web Speech API or similar for transcription
- Gemini AI for scoring and feedback
- localStorage for temporary history

### Must NOT Use
- Database (Prisma/PostgreSQL)
- User authentication
- File storage (S3/uploads folder)
- Complex state management

## CBSE ASL Scoring Rubric (Reference)

Based on official CBSE guidelines:

**5/5 - Excellent**
- Fluent, clear pronunciation
- Good vocabulary and grammar
- Confident delivery
- Relevant content with examples

**4/5 - Very Good**
- Mostly fluent with minor hesitations
- Adequate vocabulary
- Clear enough to understand
- Relevant content

**3/5 - Good**
- Some hesitations and pauses
- Basic vocabulary
- Understandable despite errors
- Stays on topic

**2/5 - Satisfactory**
- Frequent pauses and hesitations
- Limited vocabulary
- Some communication breakdown
- Partially relevant

**1/5 - Needs Improvement**
- Very hesitant, many long pauses
- Very limited vocabulary
- Difficult to understand
- Off-topic or too brief

## Example Feedback Templates

### Good Performance (4-5/5)
```
Score: 4/5

✅ Excellent: Clear voice and good examples

Tiny improvements:
1. Reduce filler words ("like", "um")
2. Add one more example from the chapter
3. Speak with more confidence
```

### Average Performance (3/5)
```
Score: 3/5

✅ Good: You stayed on topic

Improvements:
1. Too many "um"s - breathe instead
2. Use more specific words (not just "good", "bad")
3. Give at least one example
```

### Needs Work (1-2/5)
```
Score: 2/5

Keep practicing! Here's how:
1. Speak louder and clearer
2. Think before speaking - reduce long pauses
3. Use simple sentences if complex ones are hard
```

## References
- CBSE ASL Guidelines: https://cbseacademic.nic.in/web_material/ASL/2013/4.%20Speaking_Sample_IX.pdf
- MyCBSE Guide: https://mycbseguide.com/blog/assessment-of-listening-and-speaking-skills/
- NCERT Textbooks 2025-26: Beehive, Moments, First Flight, Footprints Without Feet
