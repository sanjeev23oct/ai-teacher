# Exam Day Countdown + Last-Min Tips - Requirements

## Introduction

A daily countdown feature that shows days remaining until CBSE exams (half-yearly, pre-boards, boards) and provides 30-second voice tips tied to exam format. Creates urgency and specific prep focus for students.

## Glossary

- **Half-Yearly**: Mid-year CBSE exams (September-October)
- **Pre-Boards**: Practice board exams (January-February)
- **Boards**: Final CBSE Class 10 board exams (February-March)
- **Daily Tip**: 30-second audio advice specific to exam format
- **CBSE Calendar**: Official exam schedule synced with the system

## Requirements

### Requirement 1

**User Story:** As a student, I want to see days remaining until my exam, so that I stay aware of preparation time left.

#### Acceptance Criteria

1. WHEN a student logs in THEN the system SHALL display "CBSE English half-yearly: X days left!"
2. WHEN the exam date changes THEN the system SHALL update the countdown automatically
3. WHEN multiple exams are scheduled THEN the system SHALL show the nearest upcoming exam
4. WHEN less than 7 days remain THEN the system SHALL highlight the countdown in red
5. WHEN the exam is today THEN the system SHALL show "Exam today! All the best! 🎯"

### Requirement 2

**User Story:** As a student, I want daily exam tips, so that I know what to focus on each day.

#### Acceptance Criteria

1. WHEN a student opens the app THEN the system SHALL provide a 30-second voice tip
2. WHEN the tip is given THEN it SHALL be tied to specific exam format (ASL, writing, literature)
3. WHEN 15+ days remain THEN tips SHALL focus on chapter coverage
4. WHEN 7-14 days remain THEN tips SHALL focus on practice and revision
5. WHEN less than 7 days remain THEN tips SHALL focus on exam strategy and confidence

### Requirement 3

**User Story:** As a student, I want the system to sync with CBSE exam calendar, so that countdown is always accurate.

#### Acceptance Criteria

1. WHEN CBSE announces exam dates THEN the system SHALL update automatically
2. WHEN a student selects their class THEN the system SHALL show relevant exam dates
3. WHEN exam dates are postponed THEN the system SHALL notify students
4. WHEN a student is in Class 9 THEN the system SHALL track half-yearly and yearly exams
5. WHEN a student is in Class 10 THEN the system SHALL track pre-boards and boards
