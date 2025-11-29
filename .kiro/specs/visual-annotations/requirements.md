# Visual Annotations + Voice Q&A - Requirements

## Goal
Prove the core value proposition: AI that grades exams visually like a teacher and answers questions via voice.

## Success Criteria
After 2 weeks, we should be able to:
1. ✅ Show an exam with visual annotations (checkmarks, crosses, comments)
2. ✅ Let students tap/click any annotation to ask questions
3. ✅ Have voice conversation about specific mistakes
4. ✅ Demo this to 5-10 students and get "wow" reactions

## User Stories

### US-1: Visual Grading Display
**As a** student  
**I want to** see my graded exam with visual marks (like a teacher's red pen)  
**So that** I can quickly understand what's right and wrong

**Acceptance Criteria:**
- Exam image is displayed clearly
- Correct answers have green checkmarks ✓
- Incorrect answers have red crosses ✗
- Each question shows score in a circle (e.g., "3/5")
- Comments appear as red text bubbles pointing to specific areas
- Annotations don't obscure the original handwriting

### US-2: Interactive Annotations
**As a** student  
**I want to** click/tap on any mark or comment  
**So that** I can get more details about that specific mistake

**Acceptance Criteria:**
- All annotations are clickable/tappable
- Clicking shows a tooltip or highlights the annotation
- Mobile: tap works smoothly
- Desktop: hover shows preview, click for details

### US-3: Voice Question on Specific Mistake
**As a** student  
**I want to** ask questions about a specific mistake using my voice  
**So that** I can understand what I did wrong without typing

**Acceptance Criteria:**
- Clicking annotation opens voice chat interface
- Microphone button is prominent and easy to use
- Student can speak naturally: "Why is this wrong?"
- AI responds with voice, explaining that specific mistake
- AI has context of the question and student's answer
- Conversation can continue (follow-up questions)

### US-4: Context-Aware Voice Responses
**As a** student  
**I want** the AI to know which question I'm asking about  
**So that** I don't have to explain the context every time

**Acceptance Criteria:**
- AI knows which question/annotation was clicked
- AI references the specific mistake in its response
- AI can see the student's work for that question
- AI provides targeted explanation, not generic help

### US-5: Practice Problem Generation
**As a** student  
**I want to** ask for practice problems on topics I got wrong  
**So that** I can improve my understanding

**Acceptance Criteria:**
- Student can say: "Give me a similar problem"
- AI generates a new problem of similar difficulty
- Student can solve it and get instant feedback
- Can request multiple practice problems

## Non-Functional Requirements

### Performance
- Annotation rendering: < 1 second
- Voice response latency: < 2 seconds
- Image loading: < 3 seconds on 4G

### Usability
- Works on mobile (iOS/Android) and desktop
- Touch-friendly annotation targets (min 44x44px)
- Clear visual hierarchy
- Accessible (screen reader support for annotations)

### Reliability
- Voice recognition accuracy: > 90%
- Annotation positioning accuracy: > 95%
- Graceful fallback if voice fails (text input)

## Technical Requirements

### Frontend
- Display exam image with SVG overlay for annotations
- Clickable annotation regions
- Voice input/output interface
- Real-time audio streaming
- Responsive design (mobile-first)

### Backend
- Enhanced grading API returns annotation coordinates
- Voice chat endpoint with exam context
- Text-to-speech for AI responses
- Speech-to-text for student questions

### AI/ML
- Gemini 2.5 Flash for grading + annotation positioning
- Speech recognition (Web Speech API or Deepgram)
- Text-to-speech (ElevenLabs or Google TTS)
- Context-aware conversation (maintain exam state)

## Out of Scope (for MVP)
- ❌ User accounts / authentication
- ❌ Exam history / progress tracking
- ❌ Server-side image generation
- ❌ Handwriting-style annotations
- ❌ Multiple language support (English only for now)
- ❌ Offline mode
- ❌ Sharing annotated exams

## Dependencies
- Gemini API key (already have)
- Voice API (Web Speech API - free, or Deepgram)
- TTS API (ElevenLabs or Google TTS)

## Risks & Mitigations

### Risk 1: Annotation positioning inaccurate
**Mitigation:** Start with question-level annotations (not word-level), use generous click targets

### Risk 2: Voice recognition fails in noisy environments
**Mitigation:** Provide text input fallback, show transcription for confirmation

### Risk 3: AI doesn't understand context
**Mitigation:** Pass full exam data + specific question in each request, test thoroughly

### Risk 4: Latency too high for voice
**Mitigation:** Use streaming responses, show "thinking" indicator, optimize API calls

## Timeline

### Week 1: Visual Annotations
- Day 1-2: Enhanced grading API (return annotation data)
- Day 3-4: Frontend annotation rendering (SVG overlay)
- Day 5: Interactive annotations (click handlers)
- Day 6-7: Polish and mobile testing

### Week 2: Voice Q&A
- Day 8-9: Voice input/output interface
- Day 10-11: Context-aware chat integration
- Day 12: Practice problem generation
- Day 13-14: Testing, refinement, demo prep

## Testing Plan

### Unit Tests
- Annotation positioning calculations
- Click target detection
- Voice API integration

### Integration Tests
- End-to-end grading flow
- Voice conversation flow
- Context preservation across turns

### User Testing
- 5-10 students test the feature
- Observe: Do they understand the annotations?
- Observe: Do they naturally click and ask questions?
- Measure: Time to understand a mistake
- Measure: Satisfaction rating (1-10)

## Success Metrics

### Quantitative
- 80%+ of students click on annotations
- 60%+ of students use voice to ask questions
- Average 3+ questions per exam
- Voice recognition accuracy > 90%
- Student satisfaction > 8/10

### Qualitative
- "Wow, this feels like a real teacher!"
- "I understand my mistakes better now"
- "This is way better than ChatGPT"
- Students share annotated exams with friends

## Next Steps After MVP

If successful (students love it):
1. Add user accounts + exam history
2. Improve annotation accuracy (word-level)
3. Add more annotation types (highlights, corrections)
4. Multi-language support
5. Server-side annotated image generation
6. Social sharing features

If not successful (students don't engage):
1. Analyze why (confusing? not useful? technical issues?)
2. Iterate on UX
3. Consider alternative approaches
4. Potentially pivot to different features
