# Hindi-English Code Mix Coach - Requirements

## Introduction

A feature that helps students improve their English by translating their Hinglish speech to proper English, scoring improvement, and providing 30-second drills. Tracks "English purity" progress over sessions.

## Glossary

- **Code Mix**: Mixing Hindi and English in the same sentence
- **English Purity**: Percentage of proper English vs Hinglish in speech
- **Translation Drill**: 30-second exercise to say the same thing in full English
- **Progress Tracking**: Session-by-session improvement in English usage

## Requirements

### Requirement 1

**User Story:** As a student, I want my Hinglish translated to proper English, so that I can learn correct phrasing.

#### Acceptance Criteria

1. WHEN a student speaks Hinglish THEN the system SHALL translate it to proper English
2. WHEN translating THEN the system SHALL show both versions side-by-side
3. WHEN the translation is shown THEN the system SHALL score English purity (1-5)
4. WHEN scoring THEN the system SHALL explain what words were mixed
5. WHEN the student improves THEN the system SHALL celebrate the progress

### Requirement 2

**User Story:** As a student, I want 30-second drills to practice proper English, so that I can improve quickly.

#### Acceptance Criteria

1. WHEN a translation is shown THEN the system SHALL offer a "Practice in English" drill
2. WHEN the drill starts THEN the system SHALL give 30 seconds to say it in full English
3. WHEN the student speaks THEN the system SHALL check if Hindi words were removed
4. WHEN the drill ends THEN the system SHALL score the attempt
5. WHEN the student succeeds THEN the system SHALL provide positive reinforcement

### Requirement 3

**User Story:** As a student, I want to track my English purity progress, so that I can see improvement over time.

#### Acceptance Criteria

1. WHEN a student completes sessions THEN the system SHALL track English purity scores
2. WHEN viewing progress THEN the system SHALL show a graph of improvement
3. WHEN purity increases THEN the system SHALL highlight the achievement
4. WHEN purity decreases THEN the system SHALL provide encouragement and tips
5. WHEN a milestone is reached THEN the system SHALL award a badge (e.g., "50% Pure English!")
