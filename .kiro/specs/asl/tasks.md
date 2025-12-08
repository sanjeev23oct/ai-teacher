# CBSE ASL Voice Tutor - Implementation Tasks

## Overview
Build ultra-MVP in 3-4 days with no database, just localStorage.

---

## Day 1: Solo Mode Foundation

### Task 1.1: ASL Practice Page
- [ ] Create `client/src/pages/ASLPracticePage.tsx`
- [ ] Single-screen layout with mode toggle (Solo/Pair)
- [ ] Random task display from `syllabusTasks.js`
- [ ] Show: prompt, duration, chapter citation
- [ ] "New Task" button to get another random task

### Task 1.2: Recording UI with Visual Feedback
- [ ] Create `client/src/components/ASLRecorder.tsx`
- [ ] Large mic button (tap to start/stop)
- [ ] Live audio waveform visualization
- [ ] Countdown timer (60s → 0s)
- [ ] Pulsing red indicator when recording
- [ ] Auto-stop at 60 seconds

### Task 1.3: Audio Waveform Component
- [ ] Use Web Audio API for waveform
- [ ] Real-time visualization (canvas or SVG)
- [ ] Smooth animation (60fps)
- [ ] Mobile-optimized (low CPU usage)

### Task 1.4: Speech Recording Service
- [ ] Create `server/services/aslRecordingService.ts`
- [ ] Accept audio blob from frontend
- [ ] Transcribe using Web Speech API or Gemini
- [ ] Return transcription text
- [ ] Handle Hinglish (mixed Hindi-English)

---

## Day 2: AI Scoring & Feedback

### Task 2.1: ASL Scoring Service
- [ ] Create `server/services/aslScoringService.ts`
- [ ] Implement CBSE rubric scoring (1-5)
- [ ] Analyze: fluency, vocabulary, relevance, confidence
- [ ] Generate exactly 3 simple fixes
- [ ] Return score + feedback in < 8 seconds

### Task 2.2: Scoring Prompt Engineering
- [ ] Create `server/prompts/aslScoringPrompt.ts`
- [ ] CBSE rubric as system prompt
- [ ] Keyword matching from task
- [ ] Detect filler words ("um", "like", "uh")
- [ ] Detect pauses and hesitations
- [ ] Generate Class 9-appropriate feedback

### Task 2.3: API Endpoint
- [ ] `POST /api/asl/score`
- [ ] Accept: audio blob, task ID, duration
- [ ] Return: score (1-5), 3 fixes, transcription
- [ ] Timeout: 8 seconds max

### Task 2.4: Results Display
- [ ] Create `client/src/components/ASLResults.tsx`
- [ ] Show score prominently (X/5)
- [ ] Display 3 fixes as numbered list
- [ ] "Try Again" button
- [ ] "New Task" button

---

## Day 3: Pair Mode

### Task 3.1: Pair Mode UI
- [ ] Toggle between Solo/Pair mode
- [ ] Display AI's initial opinion
- [ ] 30-second timer (not 60s)
- [ ] Show AI's counterpoint after student responds
- [ ] Score interaction skills

### Task 3.2: Pair Discussion Service
- [ ] Create `server/services/aslPairDiscussionService.ts`
- [ ] Load random topic from `pairTopics.js`
- [ ] Generate AI's initial opinion (natural, classmate-like)
- [ ] Generate AI's counterpoint based on student response
- [ ] Score interaction: opinion clarity, reasoning, politeness

### Task 3.3: Pair Scoring Prompt
- [ ] Create `server/prompts/aslPairScoringPrompt.ts`
- [ ] Score interaction skills (not just content)
- [ ] Check: Did student give opinion? Reason? Example?
- [ ] Check: Was response polite and relevant?
- [ ] Generate feedback for discussion skills

### Task 3.4: Pair Mode API
- [ ] `POST /api/asl/pair/start` - Get random topic + AI opinion
- [ ] `POST /api/asl/pair/respond` - Submit student response, get AI counter + score

---

## Day 4: History & Polish

### Task 4.1: localStorage History
- [ ] Create `client/src/utils/aslHistory.ts`
- [ ] Save last 5 sessions to localStorage
- [ ] Structure: { task, score, date, mode }
- [ ] Auto-delete oldest when > 5
- [ ] Clear on page refresh (no persistence)

### Task 4.2: History Display
- [ ] Create `client/src/components/ASLHistory.tsx`
- [ ] Show last 5 sessions in compact list
- [ ] Display: task preview, score, date, mode
- [ ] "Clear History" button
- [ ] Collapsible section (doesn't take much space)

### Task 4.3: Mobile Optimization
- [ ] Test on mobile devices
- [ ] Ensure mic permissions work
- [ ] Optimize waveform for mobile CPU
- [ ] Large touch targets (min 48px)
- [ ] Responsive layout

### Task 4.4: Error Handling
- [ ] Handle mic permission denied
- [ ] Handle network errors
- [ ] Handle AI timeout (> 8s)
- [ ] Show friendly error messages
- [ ] Retry mechanism

---

## Testing Tasks

### Test 5.1: Scoring Consistency
- [ ] Record same response 5 times
- [ ] Verify score variation ≤ 1 point
- [ ] Check feedback themes are consistent

### Test 5.2: Hinglish Recognition
- [ ] Test with pure English
- [ ] Test with pure Hindi
- [ ] Test with mixed Hinglish
- [ ] Verify 90%+ transcription accuracy

### Test 5.3: Performance
- [ ] Measure score delivery time (target < 8s)
- [ ] Measure recording start latency (target < 500ms)
- [ ] Measure waveform update lag (target < 100ms)

### Test 5.4: User Experience
- [ ] Test with 5 Class 9-10 students
- [ ] Ask: "Is AI peer realistic?"
- [ ] Ask: "Is feedback helpful for ASL exam?"
- [ ] Ask: "Is interface simple and clear?"

---

## File Structure

```
client/src/
├── pages/
│   └── ASLPracticePage.tsx          # Main single-screen app
├── components/
│   ├── ASLRecorder.tsx              # Recording UI with waveform
│   ├── ASLResults.tsx               # Score + feedback display
│   ├── ASLHistory.tsx               # Last 5 sessions
│   └── ASLWaveform.tsx              # Audio visualization
└── utils/
    └── aslHistory.ts                # localStorage management

server/
├── services/
│   ├── aslRecordingService.ts       # Transcription
│   ├── aslScoringService.ts         # Solo mode scoring
│   └── aslPairDiscussionService.ts  # Pair mode logic
├── prompts/
│   ├── aslScoringPrompt.ts          # CBSE rubric prompt
│   └── aslPairScoringPrompt.ts      # Interaction scoring
└── data/
    ├── syllabusTasks.js             # 50 NCERT tasks (already exists)
    └── pairTopics.js                # 12 discussion topics (already exists)
```

---

## API Endpoints

```typescript
// Solo Mode
POST /api/asl/score
Request: { audio: Blob, taskId: number, duration: number }
Response: { score: number, fixes: string[], transcription: string }

// Pair Mode
POST /api/asl/pair/start
Response: { topicId: number, topic: string, aiOpinion: string }

POST /api/asl/pair/respond
Request: { topicId: number, audio: Blob, duration: number }
Response: { score: number, aiCounter: string, fixes: string[], transcription: string }
```

---

## Priority Order

**Must Have (Days 1-2):**
- Task 1.1-1.4: Solo mode with recording
- Task 2.1-2.4: Scoring and feedback

**Should Have (Day 3):**
- Task 3.1-3.4: Pair mode

**Nice to Have (Day 4):**
- Task 4.1-4.4: History and polish

---

## Success Criteria

- [ ] Student can record 60s speech with visual feedback
- [ ] Score arrives in < 8 seconds
- [ ] Feedback is simple and actionable
- [ ] Hinglish is understood correctly
- [ ] Pair mode AI sounds like a real classmate
- [ ] Last 5 sessions are saved (localStorage)
- [ ] No database is used
- [ ] Works on mobile devices

---

## Estimated Time

| Day | Tasks | Hours |
|-----|-------|-------|
| 1 | Solo mode foundation | 6-8h |
| 2 | AI scoring & feedback | 6-8h |
| 3 | Pair mode | 6-8h |
| 4 | History & polish | 4-6h |

**Total: 22-30 hours (3-4 days of focused work)**
