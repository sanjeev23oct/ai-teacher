# Requirements Document

## Introduction

This feature adds a conversational follow-up chat interface to the ASL Practice page, allowing students to ask questions about their feedback, request clarification, get examples, and have a coaching-style dialogue with the AI teacher after receiving their score.

## Glossary

- **ASL**: Assessment of Speaking and Listening - CBSE English exam component
- **Follow-up Chat**: Text-based conversation interface that appears after scoring
- **AI Teacher**: Conversational AI that responds in Hinglish with teacher-like personality
- **Session Context**: The student's recording, transcription, score, and feedback from current attempt
- **Hinglish**: Natural mix of Hindi and English as spoken by Indian students

## Requirements

### Requirement 1

**User Story:** As a student, I want to ask questions about my ASL feedback, so that I can understand how to improve my speaking skills.

#### Acceptance Criteria

1. WHEN a student receives their ASL score THEN the system SHALL display a chat interface below the results
2. WHEN a student types a question THEN the system SHALL maintain context of their score, feedback, and transcription
3. WHEN the AI responds THEN the system SHALL use conversational Hinglish like a real teacher
4. WHEN referencing the student's performance THEN the system SHALL quote specific parts from their transcription
5. WHEN the student asks "why" THEN the system SHALL explain the reasoning behind their score and feedback

### Requirement 2

**User Story:** As a student, I want to get specific examples of how to improve, so that I know exactly what to say differently next time.

#### Acceptance Criteria

1. WHEN a student asks for examples THEN the system SHALL provide concrete phrases they can use
2. WHEN showing improvements THEN the system SHALL contrast what they said with better alternatives
3. WHEN giving examples THEN the system SHALL relate them to the specific ASL task topic
4. WHEN the student asks "how to say it better" THEN the system SHALL provide 2-3 example sentences
5. WHEN examples are given THEN the system SHALL use vocabulary appropriate for Class 9-10 students

### Requirement 3

**User Story:** As a student, I want to discuss my mistakes in a friendly way, so that I feel encouraged to keep practicing.

#### Acceptance Criteria

1. WHEN a student asks about mistakes THEN the system SHALL respond warmly and encouragingly
2. WHEN explaining errors THEN the system SHALL avoid harsh or discouraging language
3. WHEN the student feels confused THEN the system SHALL simplify explanations using Hinglish
4. WHEN the student asks multiple questions THEN the system SHALL maintain a supportive coaching tone
5. WHEN the conversation continues THEN the system SHALL remember previous messages in the chat

### Requirement 4

**User Story:** As a student, I want to compare my attempts, so that I can see if I'm improving over time.

#### Acceptance Criteria

1. WHEN a student asks about improvement THEN the system SHALL reference their current score
2. WHEN discussing progress THEN the system SHALL highlight specific areas that improved or need work
3. WHEN the student tries again THEN the system SHALL remember the previous attempt's feedback
4. WHEN comparing attempts THEN the system SHALL point out concrete differences in performance
5. WHEN the student asks "did I improve" THEN the system SHALL provide specific evidence from both attempts

### Requirement 5

**User Story:** As a student, I want quick access to common questions, so that I can get help faster.

#### Acceptance Criteria

1. WHEN the chat interface loads THEN the system SHALL display 3-4 suggested questions
2. WHEN a student clicks a suggestion THEN the system SHALL send that question automatically
3. WHEN suggestions are shown THEN the system SHALL include questions like "Why this score?", "Give me an example", "How to improve?"
4. WHEN the student sends a message THEN the system SHALL show new relevant suggestions
5. WHEN suggestions appear THEN the system SHALL be contextual to their score (different for 2/5 vs 4/5)

### Requirement 6

**User Story:** As a student, I want to hear the AI's responses, so that I can practice listening while learning.

#### Acceptance Criteria

1. WHEN the AI responds THEN the system SHALL provide a "play audio" button for each message
2. WHEN the student clicks play THEN the system SHALL use TTS to read the response in natural voice
3. WHEN audio is playing THEN the system SHALL show a visual indicator
4. WHEN the student navigates away THEN the system SHALL stop any playing audio
5. WHEN TTS fails THEN the system SHALL still show the text response without blocking the chat

### Requirement 7

**User Story:** As a student practicing in pair mode, I want the chat to understand which student I'm asking about, so that feedback is relevant to the right person.

#### Acceptance Criteria

1. WHEN in pair mode THEN the system SHALL track which student (S1 or S2) is currently active
2. WHEN a student asks questions THEN the system SHALL reference the correct student's performance
3. WHEN switching students THEN the system SHALL maintain separate chat histories
4. WHEN comparing students THEN the system SHALL clearly distinguish between S1 and S2 feedback
5. WHEN both students have scores THEN the system SHALL allow questions about either student's performance

### Requirement 8

**User Story:** As a student, I want the chat to be mobile-friendly, so that I can use it on my phone easily.

#### Acceptance Criteria

1. WHEN viewing on mobile THEN the system SHALL display the chat interface in a compact, scrollable format
2. WHEN typing on mobile THEN the system SHALL show a mobile-optimized input field
3. WHEN messages are long THEN the system SHALL wrap text appropriately for small screens
4. WHEN the keyboard appears THEN the system SHALL scroll to keep the input visible
5. WHEN on mobile THEN the system SHALL use touch-friendly button sizes for suggestions and audio controls
