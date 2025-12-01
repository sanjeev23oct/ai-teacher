# AI Doubt Solver - Requirements

## Goal
Enable students to upload any question (homework, textbook, practice problem) and get detailed, step-by-step explanations with visual annotations they can interact with - like having a personal tutor available 24/7.

## Vision
Create a Microsoft Copilot-like conversational experience where students can ask doubts in their native language, get instant explanations with clickable annotations, and have natural back-and-forth conversations - all feeling like talking to a real teacher.

## Problem Statement
Students get stuck on homework problems and have no one to ask:
- Parents may not know the subject
- Teachers not available after school
- Tuition is expensive
- YouTube explanations are generic, not for their specific question
- Need instant help in their own language

## User Stories

### US-1: Upload Question and Get Explanation
**As a** student stuck on a homework problem  
**I want** to upload a photo of the question and get a detailed explanation  
**So that** I can understand how to solve it step-by-step

**Acceptance Criteria:**
- Can upload question via camera or file
- Select subject (Math, Physics, Chemistry, Biology, etc.)
- Select language (English, Hindi, Bengali, Tamil, etc.)
- Get detailed explanation with step-by-step solution
- Explanation has visual annotations on the question image
- Can click annotations to dive deeper into specific steps
- Warm, encouraging Hinglish tone (or selected language)

### US-2: Interactive Annotations on Explanation
**As a** student reading an explanation  
**I want** to click on specific parts of the solution  
**So that** I can get more details about steps I don't understand

**Acceptance Criteria:**
- Each step in solution has a clickable annotation
- Click opens detailed explanation of that step
- Can ask follow-up questions about specific steps
- Annotations show: "💡 Click to learn more"
- Smooth, instant interaction (no lag)
- Can go back to main explanation easily

### US-3: Natural Conversation Flow
**As a** student  
**I want** to ask follow-up questions naturally  
**So that** I can clear all my doubts without friction

**Acceptance Criteria:**
- Can type or speak questions in any language
- AI responds in same language
- Conversation feels natural (like Microsoft Copilot)
- No lag between question and response
- AI remembers context of previous questions
- Can ask "Why?", "How?", "Can you explain again?" naturally
- Voice input and output work smoothly

### US-4: Multi-Language Support
**As a** student who thinks in my native language  
**I want** to ask questions in Hindi/Bengali/Tamil/etc.  
**So that** I can understand better in my own language

**Acceptance Criteria:**
- Language selector at start (English, Hindi, Bengali, Tamil, Telugu, Marathi, Gujarati, Kannada, Malayalam, Punjabi)
- AI responds in selected language
- Can switch language mid-conversation
- Hinglish support (natural code-switching)
- Voice input works in selected language
- TTS speaks in selected language with natural accent

### US-5: Doubt History
**As a** student  
**I want** to see all my previous doubts and explanations  
**So that** I can review them before exams

**Acceptance Criteria:**
- History page shows all doubts asked
- Grouped by subject and date
- Can search doubts by topic/keyword
- Can re-open any doubt and continue conversation
- Shows thumbnail of question image
- Shows summary of what was asked
- Can favorite important doubts
- Can share doubt explanation with friends

### US-6: Subject-Specific Expert Prompts
**As a** student  
**I want** explanations that match how my subject is taught  
**So that** I can relate to my textbook and class teaching

**Acceptance Criteria:**
- Math: Step-by-step logical approach, formulas explained
- Physics: Concept explanation, real-world examples, diagrams
- Chemistry: Reactions explained, molecular understanding
- Biology: Detailed descriptions, diagrams, examples
- English: Grammar rules, examples, usage
- Social Studies: Context, dates, cause-effect relationships
- Each subject has unique teaching style
- References NCERT/CBSE curriculum where relevant

## Detailed Feature Breakdown

### 1. Question Upload Flow

```
1. Student opens "Ask Doubt" page
2. Selects subject (Math, Physics, Chemistry, etc.)
3. Selects language (English, Hindi, Hinglish, etc.)
4. Uploads question:
   - Camera capture (mobile)
   - File upload (desktop)
   - Or types question directly
5. AI analyzes question
6. Shows detailed explanation with annotations
```

### 2. Explanation Format

```
┌─────────────────────────────────────┐
│  Question Image (with annotations)   │
│  💡 → Step 1                         │
│  💡 → Step 2                         │
│  💡 → Final Answer                   │
└─────────────────────────────────────┘

📝 Detailed Explanation:

🎯 What the question is asking:
[Clear explanation in student's language]

✨ Step-by-Step Solution:

Step 1: [Title] 💡 Click for details
[Brief explanation]

Step 2: [Title] 💡 Click for details
[Brief explanation]

Step 3: [Title] 💡 Click for details
[Brief explanation]

🎉 Final Answer: [Answer]

💪 Key Concepts:
- Concept 1
- Concept 2

🚀 Practice Tip:
[Helpful tip for similar problems]

❓ Still confused? Ask me anything!
```

### 3. Conversation Experience (Microsoft Copilot-like)

**Key Principles:**
- **Instant responses** - No loading spinners, streaming text
- **Natural language** - Understands "why?", "how?", "explain again"
- **Context aware** - Remembers what was discussed
- **Proactive** - Suggests related topics
- **Encouraging** - Always positive and supportive
- **Visual** - Uses emojis, formatting, annotations

**Example Conversation:**

```
Student: [Uploads quadratic equation question]

AI: "Arre wah! Quadratic equations! 🎯 Let me break this down for you...

[Shows annotated solution]

Samajh aa gaya? Any step confusing?"

Student: "Step 2 mein kya kiya?"

AI: "Accha! Step 2 mein humne factorization use kiya. Dekho...

[Shows detailed explanation of step 2]

Aise karte hain. Try kar ke dekho! 💪"

Student: "Why factorization?"

AI: "Great question! Factorization isliye use karte hain kyunki...

[Explains concept]

Make sense? 😊"
```

### 4. Language Support

**Supported Languages:**
1. English (Standard)
2. Hindi (Devanagari)
3. Hinglish (Natural code-switching)
4. Bengali (বাংলা)
5. Tamil (தமிழ்)
6. Telugu (తెలుగు)
7. Marathi (मराठी)
8. Gujarati (ગુજરાતી)
9. Kannada (ಕನ್ನಡ)
10. Malayalam (മലയാളം)
11. Punjabi (ਪੰਜਾਬੀ)

**Language Features:**
- Auto-detect language from text input
- Voice input in selected language
- TTS with natural accent
- Subject terminology in both English and local language
- Hinglish as default (most natural for Indian students)

### 5. Subject-Specific Prompts

**Mathematics:**
```
You are a patient mathematics teacher who loves making complex concepts simple.

Teaching Style:
- Break down into smallest possible steps
- Show working clearly
- Explain "why" behind each step
- Use real-world examples
- Encourage mental math tricks
- Reference formulas and when to use them

Example phrases:
- "Chalo, step by step karte hain"
- "Yahan pe formula apply hoga: [formula]"
- "Dekho, trick yeh hai..."
```

**Physics:**
```
You are an enthusiastic physics teacher who connects concepts to real life.

Teaching Style:
- Start with the concept, then formula
- Use everyday examples (bike, ball, electricity at home)
- Draw mental pictures
- Explain units and why they matter
- Connect to what they see around them

Example phrases:
- "Imagine karo, jab tum bike chalate ho..."
- "Real life mein yeh kaise hota hai..."
- "Concept simple hai: [explanation]"
```

**Chemistry:**
```
You are a chemistry teacher who makes reactions come alive.

Teaching Style:
- Visualize molecules and reactions
- Explain what's happening at atomic level
- Use color, smell, observations
- Connect to daily life (cooking, cleaning, etc.)
- Make equations tell a story

Example phrases:
- "Reaction mein kya ho raha hai..."
- "Atoms ko dekho, kaise move kar rahe hain..."
- "Kitchen mein bhi yeh hota hai jab..."
```

## Technical Requirements

### Performance
- Response time < 2 seconds
- Streaming text for instant feel
- Optimistic UI updates
- Preload common responses
- Cache subject prompts
- Lazy load images

### AI/ML
- Gemini 2.5 Flash for speed
- Subject-specific system prompts
- Language-specific prompts
- Context window management
- Streaming responses
- Multi-turn conversation support

### Database
- Store doubts with question image
- Store conversation history
- Store language preference
- Store subject preference
- Index by subject, date, keywords
- Full-text search on conversations

### Mobile Optimization
- Camera-first design
- Voice input prominent
- Large touch targets
- Bottom sheet for actions
- Swipe gestures
- Haptic feedback
- Works offline (cached responses)

## Success Metrics

### Engagement
- Doubts asked per student per week > 5
- Follow-up questions per doubt > 3
- Conversation length > 5 messages
- Return rate within 24 hours > 70%

### Quality
- "Understood" rating > 90%
- "Felt like talking to teacher" > 85%
- Language satisfaction > 90%
- Speed satisfaction > 95%

### Usage
- Mobile usage > 80%
- Voice input usage > 40%
- Camera upload > 70%
- Multi-language usage > 30%

## Implementation Priority

### Phase 1: Core Doubt Solver (Week 1)
- Upload question with subject selection
- Get detailed explanation
- Basic annotations
- English + Hinglish support

### Phase 2: Interactive Annotations (Week 1)
- Clickable annotations
- Deep-dive explanations
- Smooth interactions

### Phase 3: Multi-Language (Week 2)
- Language selector
- 10+ Indian languages
- Voice input/output
- Natural accent TTS

### Phase 4: Conversation Flow (Week 2)
- Natural follow-ups
- Context awareness
- Streaming responses
- Microsoft Copilot-like UX

### Phase 5: History & Search (Week 3)
- Doubt history
- Search and filter
- Favorites
- Share functionality

## Future Enhancements
- Practice problems based on doubts
- Video explanations for complex topics
- Peer learning (see how others solved)
- Teacher mode (parents can help)
- Offline mode with cached explanations
- AR mode (point camera at textbook)
- Handwriting recognition (write question)
- Group study mode (multiple students)

---

**This feature will make AI Teacher the go-to app for every student's homework!** 🚀
