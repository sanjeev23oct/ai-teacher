// NCERT Chapter References for CBSE Class 6-10
// Quick lookup for chapter names and typical exam patterns

export interface NCERTChapter {
  number: number;
  name: string;
  typicalMarks: string; // "1-3 marks", "3-5 marks", etc.
  examFrequency: 'high' | 'medium' | 'low';
}

export const NCERT_MATHS: Record<string, NCERTChapter[]> = {
  '10': [
    { number: 1, name: 'Real Numbers', typicalMarks: '2-3 marks', examFrequency: 'high' },
    { number: 2, name: 'Polynomials', typicalMarks: '2-4 marks', examFrequency: 'high' },
    { number: 3, name: 'Pair of Linear Equations in Two Variables', typicalMarks: '3-4 marks', examFrequency: 'high' },
    { number: 4, name: 'Quadratic Equations', typicalMarks: '3-4 marks', examFrequency: 'high' },
    { number: 5, name: 'Arithmetic Progressions', typicalMarks: '3-4 marks', examFrequency: 'high' },
    { number: 6, name: 'Triangles', typicalMarks: '3-6 marks', examFrequency: 'high' },
    { number: 7, name: 'Coordinate Geometry', typicalMarks: '2-4 marks', examFrequency: 'medium' },
    { number: 8, name: 'Introduction to Trigonometry', typicalMarks: '3-4 marks', examFrequency: 'high' },
    { number: 9, name: 'Some Applications of Trigonometry', typicalMarks: '2-4 marks', examFrequency: 'medium' },
    { number: 10, name: 'Circles', typicalMarks: '2-4 marks', examFrequency: 'high' },
    { number: 11, name: 'Constructions', typicalMarks: '2-4 marks', examFrequency: 'medium' },
    { number: 12, name: 'Areas Related to Circles', typicalMarks: '3-4 marks', examFrequency: 'high' },
    { number: 13, name: 'Surface Areas and Volumes', typicalMarks: '3-6 marks', examFrequency: 'high' },
    { number: 14, name: 'Statistics', typicalMarks: '3-6 marks', examFrequency: 'high' },
    { number: 15, name: 'Probability', typicalMarks: '2-4 marks', examFrequency: 'medium' },
  ],
  '9': [
    { number: 1, name: 'Number Systems', typicalMarks: '2-3 marks', examFrequency: 'high' },
    { number: 2, name: 'Polynomials', typicalMarks: '2-4 marks', examFrequency: 'high' },
    { number: 3, name: 'Coordinate Geometry', typicalMarks: '2-3 marks', examFrequency: 'medium' },
    { number: 4, name: 'Linear Equations in Two Variables', typicalMarks: '3-4 marks', examFrequency: 'high' },
    { number: 5, name: 'Introduction to Euclid\'s Geometry', typicalMarks: '2-3 marks', examFrequency: 'low' },
    { number: 6, name: 'Lines and Angles', typicalMarks: '2-4 marks', examFrequency: 'high' },
    { number: 7, name: 'Triangles', typicalMarks: '3-6 marks', examFrequency: 'high' },
    { number: 8, name: 'Quadrilaterals', typicalMarks: '3-4 marks', examFrequency: 'high' },
    { number: 9, name: 'Areas of Parallelograms and Triangles', typicalMarks: '2-4 marks', examFrequency: 'medium' },
    { number: 10, name: 'Circles', typicalMarks: '2-4 marks', examFrequency: 'high' },
    { number: 11, name: 'Constructions', typicalMarks: '2-4 marks', examFrequency: 'medium' },
    { number: 12, name: 'Heron\'s Formula', typicalMarks: '2-3 marks', examFrequency: 'medium' },
    { number: 13, name: 'Surface Areas and Volumes', typicalMarks: '3-4 marks', examFrequency: 'high' },
    { number: 14, name: 'Statistics', typicalMarks: '3-4 marks', examFrequency: 'high' },
    { number: 15, name: 'Probability', typicalMarks: '2-3 marks', examFrequency: 'medium' },
  ],
};

export const NCERT_SCIENCE: Record<string, NCERTChapter[]> = {
  '10': [
    { number: 1, name: 'Chemical Reactions and Equations', typicalMarks: '2-5 marks', examFrequency: 'high' },
    { number: 2, name: 'Acids, Bases and Salts', typicalMarks: '2-5 marks', examFrequency: 'high' },
    { number: 3, name: 'Metals and Non-metals', typicalMarks: '3-5 marks', examFrequency: 'high' },
    { number: 4, name: 'Carbon and its Compounds', typicalMarks: '3-5 marks', examFrequency: 'high' },
    { number: 5, name: 'Periodic Classification of Elements', typicalMarks: '2-3 marks', examFrequency: 'medium' },
    { number: 6, name: 'Life Processes', typicalMarks: '3-5 marks', examFrequency: 'high' },
    { number: 7, name: 'Control and Coordination', typicalMarks: '3-5 marks', examFrequency: 'high' },
    { number: 8, name: 'How do Organisms Reproduce?', typicalMarks: '3-5 marks', examFrequency: 'high' },
    { number: 9, name: 'Heredity and Evolution', typicalMarks: '2-5 marks', examFrequency: 'high' },
    { number: 10, name: 'Light - Reflection and Refraction', typicalMarks: '3-5 marks', examFrequency: 'high' },
    { number: 11, name: 'Human Eye and Colourful World', typicalMarks: '2-3 marks', examFrequency: 'medium' },
    { number: 12, name: 'Electricity', typicalMarks: '3-5 marks', examFrequency: 'high' },
    { number: 13, name: 'Magnetic Effects of Electric Current', typicalMarks: '3-5 marks', examFrequency: 'high' },
    { number: 14, name: 'Sources of Energy', typicalMarks: '2-3 marks', examFrequency: 'medium' },
    { number: 15, name: 'Our Environment', typicalMarks: '2-3 marks', examFrequency: 'medium' },
    { number: 16, name: 'Sustainable Management of Natural Resources', typicalMarks: '2-3 marks', examFrequency: 'low' },
  ],
};

// Common memory tricks for Mathematics
export const MATH_MEMORY_TRICKS = {
  quadraticFormula: "Remember: x = (-b ± √(b²-4ac)) / 2a. Trick: 'Negative b, plus or minus square root, b squared minus 4ac, all over 2a'",
  trigRatios: "SOH-CAH-TOA: Sin = Opposite/Hypotenuse, Cos = Adjacent/Hypotenuse, Tan = Opposite/Adjacent",
  bodmas: "BODMAS: Brackets, Orders (powers), Division, Multiplication, Addition, Subtraction",
  perfectSquares: "Perfect squares end in: 0, 1, 4, 5, 6, 9 (never 2, 3, 7, 8)",
  divisibilityBy3: "A number is divisible by 3 if sum of its digits is divisible by 3",
  divisibilityBy9: "A number is divisible by 9 if sum of its digits is divisible by 9",
  areaCircle: "Area of circle = πr². Remember: 'Pie are squared' (but pie are round!)",
  pythagoras: "a² + b² = c². Remember: 'In a right triangle, square the sides, add them up, you get the hypotenuse squared'",
};

// Common mistakes students make
export const COMMON_MISTAKES = {
  quadraticEquations: [
    "❌ Forgetting to write both roots",
    "❌ Sign errors in the formula (especially -b)",
    "❌ Not simplifying the square root",
    "✅ Always verify by substituting back into the equation"
  ],
  linearEquations: [
    "❌ Forgetting to change signs when transposing",
    "❌ Not simplifying before solving",
    "✅ Check your answer by substituting back"
  ],
  triangles: [
    "❌ Confusing similarity with congruence",
    "❌ Not stating the correct similarity criterion (SSS, SAS, AA)",
    "✅ Always write 'corresponding sides are proportional'"
  ],
  trigonometry: [
    "❌ Confusing sin, cos, tan values",
    "❌ Using degrees instead of ratios",
    "✅ Draw a right triangle and label sides clearly"
  ],
};

// Exam tips by topic
export const EXAM_TIPS = {
  showAllSteps: "In board exams, showing all steps is crucial. Even if you know the shortcut, write the full method.",
  useFormulas: "Always write the formula first, then substitute values. This shows your understanding.",
  checkUnits: "Don't forget units in your final answer (cm, m, kg, etc.)",
  drawDiagrams: "For geometry questions, always draw a neat, labeled diagram.",
  verifyAnswers: "If time permits, verify your answer by substituting back or using an alternate method.",
};
