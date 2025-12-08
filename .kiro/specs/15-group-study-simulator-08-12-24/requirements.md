# Group Study Simulator - Requirements

## Introduction

A feature that simulates 2 classmates (Rohan and Priya) during practice sessions. After a student answers, the AI classmates ask follow-up questions and provide counter-arguments, preparing students for real classroom discussions and teacher Q&A. Scores "handling questions" skill.

## Glossary

- **AI Classmates**: Simulated students (Rohan and Priya) who interact during practice
- **Follow-up Questions**: Questions asked by AI classmates after student's answer
- **Counter-Arguments**: Disagreements or alternative viewpoints from AI classmates
- **Handling Questions Skill**: Ability to respond to challenges and defend answers
- **Classroom Discussion**: Simulated group conversation about a topic

## Requirements

### Requirement 1

**User Story:** As a student, I want to practice with simulated classmates, so that I'm prepared for real classroom discussions.

#### Acceptance Criteria

1. WHEN a student answers a question THEN Rohan SHALL ask a follow-up question
2. WHEN Rohan finishes THEN Priya SHALL provide a counter-argument or different perspective
3. WHEN AI classmates speak THEN the system SHALL use natural student-like language
4. WHEN the student responds THEN the system SHALL evaluate how well they handled the challenge
5. WHEN the discussion ends THEN the system SHALL score "handling questions" skill (1-5)

### Requirement 2

**User Story:** As a student, I want AI classmates to challenge my answers, so that I learn to think critically.

#### Acceptance Criteria

1. WHEN a student gives a basic answer THEN Rohan SHALL ask "But what about [related aspect]?"
2. WHEN a student makes a claim THEN Priya SHALL say "I disagree because..."
3. WHEN the student is vague THEN AI classmates SHALL ask for specific examples
4. WHEN the student is strong THEN AI classmates SHALL provide harder challenges
5. WHEN the student struggles THEN AI classmates SHALL give supportive hints

### Requirement 3

**User Story:** As a student, I want to improve my discussion skills over time, so that I become more confident in class.

#### Acceptance Criteria

1. WHEN a student completes sessions THEN the system SHALL track "handling questions" scores
2. WHEN scores improve THEN the system SHALL increase difficulty of challenges
3. WHEN a student handles 3 challenges well THEN the system SHALL award "Discussion Pro" badge
4. WHEN a student struggles THEN the system SHALL provide tips on handling questions
5. WHEN progress is made THEN the system SHALL show "You're getting better at defending your answers!"
