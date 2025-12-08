# Revision Friend Helper - Requirements

## Introduction

A quick revision feature where students can say "Please revise kara do Science photosynthesis" and get a structured 3-minute revision session with explanation, repetition, quiz, and weak area drill. Remembers last topics and suggests re-revision.

## Glossary

- **Revision Session**: 3-minute structured review (60s explanation + 30s repeat + 60s quiz + 30s drill)
- **Weak Area**: Topics where student scored low in previous sessions
- **Topic Memory**: System remembers last 3 revision topics per student
- **Re-Revision**: Suggesting practice of previously weak topics

## Requirements

### Requirement 1

**User Story:** As a student, I want quick 3-minute revision sessions, so that I can review topics before exams.

#### Acceptance Criteria

1. WHEN a student says "revise kara do [topic]" THEN the system SHALL create a 3-minute session
2. WHEN the session starts THEN it SHALL have 60s explanation in simple language
3. WHEN explanation ends THEN it SHALL have 30s student repetition exercise
4. WHEN repetition ends THEN it SHALL have 60s Q&A quiz
5. WHEN quiz ends THEN it SHALL have 30s drill on weak areas identified

### Requirement 2

**User Story:** As a student, I want the system to remember my weak topics, so that I can practice them again.

#### Acceptance Criteria

1. WHEN a student completes a revision THEN the system SHALL track performance
2. WHEN a topic is weak THEN the system SHALL mark it for re-revision
3. WHEN a student returns THEN the system SHALL suggest "Last time [topic] weak—practice again?"
4. WHEN the student agrees THEN the system SHALL start a focused revision on that topic
5. WHEN a topic improves THEN the system SHALL celebrate and remove from weak list

### Requirement 3

**User Story:** As a student, I want revision for any subject, so that I can prepare comprehensively.

#### Acceptance Criteria

1. WHEN a student requests revision THEN the system SHALL support English, Science, Math, SST
2. WHEN the topic is from NCERT THEN the system SHALL reference chapter and page numbers
3. WHEN the topic is complex THEN the system SHALL break it into sub-topics
4. WHEN the student is confused THEN the system SHALL simplify the explanation
5. WHEN revision is complete THEN the system SHALL ask "Aur koi topic revise karein?"
