# Enhanced CBSE Prompts - MVP

## Goal
Make our AI explanations 10x better than ChatGPT for CBSE students by adding context that ChatGPT doesn't have.

## The Differentiator

Not fancy features - just **better prompts** with:
- NCERT references
- Exam tips
- Memory tricks
- Common mistakes

## What Students Get

### Before (Generic ChatGPT):
```
Q: Solve x² - 5x + 6 = 0

A: Using the quadratic formula:
x = (-b ± √(b²-4ac)) / 2a
x = (5 ± √(25-24)) / 2
x = (5 ± 1) / 2
x = 3 or x = 2
```

### After (Our App):
```
Q: Solve x² - 5x + 6 = 0

A: Let me solve this step by step! 🎯

📚 NCERT Reference: Class 10, Chapter 4 (Quadratic Equations), Page 87

METHOD 1: Factorization (Easier for this one!)
x² - 5x + 6 = 0
(x - 2)(x - 3) = 0
∴ x = 2 or x = 3

METHOD 2: Quadratic Formula
x = (-b ± √(b²-4ac)) / 2a
x = (5 ± √(25-24)) / 2
x = (5 ± 1) / 2
x = 3 or x = 2

🎯 EXAM TIP: 
- This is typically a 3-mark question
- Always check: Can you factorize? It's faster!
- Show both roots clearly

💡 MEMORY TRICK:
For factorization, find two numbers that:
- MULTIPLY to give 'c' (here: 6)
- ADD to give 'b' (here: -5)
Numbers: -2 and -3 ✓

⚠️ COMMON MISTAKES:
❌ Forgetting to write both roots
❌ Sign errors in formula
✅ Always verify by substituting back!

Want me to explain factorization in more detail?
```

## Acceptance Criteria

### AC1: NCERT References
- GIVEN any CBSE question
- WHEN explanation is generated
- THEN include: Class, Chapter name, Page number (if applicable)

### AC2: Exam Tips
- GIVEN any explanation
- WHEN it's an exam-relevant topic
- THEN include:
  - Typical marks for this question
  - What examiners look for
  - How to present answer

### AC3: Memory Tricks
- GIVEN concepts that need memorization
- WHEN explanation is generated
- THEN include mnemonics, tricks, shortcuts

### AC4: Common Mistakes
- GIVEN any explanation
- WHEN there are typical student errors
- THEN highlight what NOT to do

## Implementation

### Update Existing Prompts

Modify these files:
- `server/prompts/cbsePrompts.ts`
- `server/prompts/cbseClass10Prompts.ts`
- `server/prompts/subjectPrompts.ts`

### Add to System Prompt

```typescript
const ENHANCED_PROMPT = `
${existingPrompt}

IMPORTANT: For every explanation, include:

📚 NCERT REFERENCE (if applicable):
- Class [X], Chapter [Y]: [Chapter Name]
- Page [Z] (if you know it)

🎯 EXAM TIP:
- How this appears in board exams
- Marks typically allocated
- What examiners expect

💡 MEMORY TRICK (if applicable):
- Mnemonics
- Shortcuts
- Easy ways to remember

⚠️ COMMON MISTAKES:
- What students typically get wrong
- How to avoid errors

Use emojis naturally. Keep it conversational and encouraging.
`;
```

## Subject-Specific Enhancements

### Mathematics
- Formula derivations
- Alternative methods
- Calculation shortcuts
- Graph sketching tips

### Science
- Real-world examples
- Diagram descriptions
- Experiment tips
- Observation points

### English
- Grammar rules with examples
- Writing structure tips
- Common usage errors
- Vocabulary building

## Success Metrics

Test with 10 students:
- "Felt more helpful than ChatGPT" > 80%
- "Would use this for exam prep" > 80%
- "Explanations felt CBSE-specific" > 90%

## Out of Scope

- ❌ Complex tracking systems
- ❌ Personalization algorithms
- ❌ Analytics dashboards
- ❌ New features

Just better prompts. That's it.
