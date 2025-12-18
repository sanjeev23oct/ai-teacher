/**
 * CBSE ASL Speaking Tasks for Class 9-10
 * Based on official CBSE ASL guidelines
 */

export interface ASLTask {
  id: string;
  class: 9 | 10;
  mode: 'solo' | 'pair';
  title: string;
  prompt: string;
  keywords: string[];
  duration: number; // seconds
  sampleAnswer?: string; // Sample answer for reference
  tips?: string[]; // Quick tips for this task
}

export const ASL_TASKS: ASLTask[] = [
  // Class 9 Solo Tasks
  {
    id: 'c9-solo-1',
    class: 9,
    mode: 'solo',
    title: 'My Favorite Book',
    prompt: 'Talk about your favorite book. What is it about? Why do you like it? Would you recommend it to others?',
    keywords: ['book', 'story', 'character', 'recommend', 'favorite'],
    duration: 60,
    sampleAnswer: "My favorite book is Harry Potter and the Philosopher's Stone by J.K. Rowling. It's about a young boy who discovers he's a wizard and goes to Hogwarts School of Witchcraft and Wizardry. I love this book because it has an amazing story with interesting characters like Harry, Hermione, and Ron. The magical world is so creative and exciting. I would definitely recommend this book to others because it teaches us about friendship, courage, and believing in yourself. The story is full of adventure and keeps you interested from beginning to end.",
    tips: [
      "Start with the book title and author",
      "Explain the main story in 2-3 sentences", 
      "Give specific reasons why you like it",
      "End with a clear recommendation"
    ]
  },
  {
    id: 'c9-solo-2',
    class: 9,
    mode: 'solo',
    title: 'A Memorable Day',
    prompt: 'Describe a memorable day in your life. What happened? Why was it special? How did you feel?',
    keywords: ['day', 'special', 'remember', 'happened', 'felt'],
    duration: 60,
    sampleAnswer: "The most memorable day of my life was when I won the inter-school debate competition last year. That morning, I was very nervous because I had to speak in front of 200 people. My topic was about environmental protection. When I started speaking, I felt confident and spoke clearly about how we can save our planet. The judges appreciated my points and examples. When they announced that I won first prize, I felt extremely happy and proud. My parents and teachers were so excited. This day was special because it boosted my confidence and showed me that hard work pays off. I will never forget this amazing experience.",
    tips: [
      "Choose a specific day, not a general experience",
      "Describe what happened step by step",
      "Explain your feelings clearly",
      "Tell why it was important to you"
    ]
  },
  {
    id: 'c9-solo-3',
    class: 9,
    mode: 'solo',
    title: 'My School',
    prompt: 'Talk about your school. What do you like about it? What subjects do you enjoy? Describe your teachers and friends.',
    keywords: ['school', 'subjects', 'teachers', 'friends', 'enjoy'],
    duration: 60
  },
  {
    id: 'c9-solo-4',
    class: 9,
    mode: 'solo',
    title: 'Importance of Sports',
    prompt: 'Why are sports important? What sports do you play? How do sports help students?',
    keywords: ['sports', 'health', 'fitness', 'teamwork', 'important'],
    duration: 60
  },
  {
    id: 'c9-solo-5',
    class: 9,
    mode: 'solo',
    title: 'My Hobby',
    prompt: 'Talk about your hobby. What do you like to do in your free time? Why do you enjoy it? How did you start?',
    keywords: ['hobby', 'free time', 'enjoy', 'interest', 'passion'],
    duration: 60
  },
  {
    id: 'c9-solo-6',
    class: 9,
    mode: 'solo',
    title: 'My Best Friend',
    prompt: 'Describe your best friend. What do you like about them? What do you do together? Why are they special?',
    keywords: ['friend', 'friendship', 'together', 'special', 'qualities'],
    duration: 60
  },
  {
    id: 'c9-solo-7',
    class: 9,
    mode: 'solo',
    title: 'A Place I Want to Visit',
    prompt: 'Talk about a place you want to visit. Where is it? Why do you want to go there? What will you do there?',
    keywords: ['place', 'visit', 'travel', 'destination', 'explore'],
    duration: 60
  },
  {
    id: 'c9-solo-8',
    class: 9,
    mode: 'solo',
    title: 'My Daily Routine',
    prompt: 'Describe your daily routine. What time do you wake up? What do you do after school? How do you spend your evenings?',
    keywords: ['routine', 'daily', 'morning', 'evening', 'schedule'],
    duration: 60
  },

  // Class 9 Pair Tasks
  {
    id: 'c9-pair-1',
    class: 9,
    mode: 'pair',
    title: 'Planning a School Event',
    prompt: 'You and your partner are planning a school cultural event. Discuss what activities to include, who will perform, and how to organize it.',
    keywords: ['event', 'cultural', 'activities', 'organize', 'plan'],
    duration: 30
  },
  {
    id: 'c9-pair-2',
    class: 9,
    mode: 'pair',
    title: 'Choosing a Gift',
    prompt: 'Your friend\'s birthday is coming. Discuss with your partner what gift to buy and why.',
    keywords: ['gift', 'birthday', 'friend', 'choose', 'buy'],
    duration: 30
  },
  {
    id: 'c9-pair-3',
    class: 9,
    mode: 'pair',
    title: 'Weekend Plans',
    prompt: 'Discuss with your partner what you want to do this weekend. Where will you go? What activities will you do?',
    keywords: ['weekend', 'plans', 'activities', 'fun', 'together'],
    duration: 30
  },
  {
    id: 'c9-pair-4',
    class: 9,
    mode: 'pair',
    title: 'Favorite Movie',
    prompt: 'Talk with your partner about your favorite movies. What type of movies do you like? Why? Recommend a movie to each other.',
    keywords: ['movie', 'film', 'favorite', 'recommend', 'entertainment'],
    duration: 30
  },
  {
    id: 'c9-pair-5',
    class: 9,
    mode: 'pair',
    title: 'School Picnic Planning',
    prompt: 'Your class is planning a picnic. Discuss with your partner where to go, what food to bring, and what games to play.',
    keywords: ['picnic', 'planning', 'food', 'games', 'outdoor'],
    duration: 30
  },
  {
    id: 'c9-pair-6',
    class: 9,
    mode: 'pair',
    title: 'Study Tips',
    prompt: 'Share study tips with your partner. How do you prepare for exams? What methods work best? Give each other advice.',
    keywords: ['study', 'exam', 'preparation', 'tips', 'learning'],
    duration: 30
  },

  // Class 10 Solo Tasks
  {
    id: 'c10-solo-1',
    class: 10,
    mode: 'solo',
    title: 'Career Goals',
    prompt: 'Talk about your career goals. What do you want to become? Why? What steps will you take to achieve your goals?',
    keywords: ['career', 'goals', 'future', 'achieve', 'become'],
    duration: 60
  },
  {
    id: 'c10-solo-2',
    class: 10,
    mode: 'solo',
    title: 'Social Media Impact',
    prompt: 'Discuss the impact of social media on teenagers. What are the advantages and disadvantages? How do you use social media?',
    keywords: ['social media', 'teenagers', 'advantages', 'disadvantages', 'impact'],
    duration: 60
  },
  {
    id: 'c10-solo-3',
    class: 10,
    mode: 'solo',
    title: 'Environmental Issues',
    prompt: 'Talk about environmental problems in your area. What can students do to help? Why is it important to protect the environment?',
    keywords: ['environment', 'pollution', 'protect', 'students', 'important'],
    duration: 60
  },
  {
    id: 'c10-solo-4',
    class: 10,
    mode: 'solo',
    title: 'A Person I Admire',
    prompt: 'Describe a person you admire. Who are they? What qualities do they have? Why do you admire them?',
    keywords: ['admire', 'person', 'qualities', 'inspire', 'respect'],
    duration: 60
  },
  {
    id: 'c10-solo-5',
    class: 10,
    mode: 'solo',
    title: 'Technology in Education',
    prompt: 'How has technology changed education? What are the benefits? Are there any disadvantages? Give examples.',
    keywords: ['technology', 'education', 'learning', 'digital', 'benefits'],
    duration: 60
  },
  {
    id: 'c10-solo-6',
    class: 10,
    mode: 'solo',
    title: 'My Future Plans',
    prompt: 'Talk about your plans after Class 10. What stream will you choose? What are your long-term goals?',
    keywords: ['future', 'plans', 'goals', 'career', 'education'],
    duration: 60
  },
  {
    id: 'c10-solo-7',
    class: 10,
    mode: 'solo',
    title: 'Importance of Reading',
    prompt: 'Why is reading important? What do you like to read? How has reading helped you? Recommend a book.',
    keywords: ['reading', 'books', 'knowledge', 'important', 'learning'],
    duration: 60
  },
  {
    id: 'c10-solo-8',
    class: 10,
    mode: 'solo',
    title: 'Youth and Social Change',
    prompt: 'What role can young people play in society? How can students contribute to social change? Give examples.',
    keywords: ['youth', 'society', 'change', 'contribution', 'responsibility'],
    duration: 60
  },

  // Class 10 Pair Tasks
  {
    id: 'c10-pair-1',
    class: 10,
    mode: 'pair',
    title: 'Debate: Online vs Offline Classes',
    prompt: 'Discuss with your partner the advantages and disadvantages of online classes versus offline classes. Which is better and why?',
    keywords: ['online', 'offline', 'classes', 'advantages', 'better'],
    duration: 30
  },
  {
    id: 'c10-pair-2',
    class: 10,
    mode: 'pair',
    title: 'Planning a Trip',
    prompt: 'You and your partner are planning a school trip. Discuss where to go, what to do, and how much it will cost.',
    keywords: ['trip', 'plan', 'destination', 'activities', 'budget'],
    duration: 30
  },
  {
    id: 'c10-pair-3',
    class: 10,
    mode: 'pair',
    title: 'Career Choices',
    prompt: 'Discuss different career options with your partner. What careers interest you? What skills are needed? Share your thoughts.',
    keywords: ['career', 'profession', 'skills', 'future', 'choice'],
    duration: 30
  },
  {
    id: 'c10-pair-4',
    class: 10,
    mode: 'pair',
    title: 'Healthy Lifestyle',
    prompt: 'Talk about maintaining a healthy lifestyle. Discuss diet, exercise, and mental health. Share tips with your partner.',
    keywords: ['health', 'lifestyle', 'exercise', 'diet', 'wellness'],
    duration: 30
  },
  {
    id: 'c10-pair-5',
    class: 10,
    mode: 'pair',
    title: 'Mobile Phones: Pros and Cons',
    prompt: 'Discuss the advantages and disadvantages of mobile phones for students. Should phones be allowed in school?',
    keywords: ['mobile', 'phone', 'technology', 'advantages', 'disadvantages'],
    duration: 30
  },
  {
    id: 'c10-pair-6',
    class: 10,
    mode: 'pair',
    title: 'Community Service',
    prompt: 'Discuss ways students can help their community. What volunteer work can you do? Plan a community service project together.',
    keywords: ['community', 'service', 'volunteer', 'help', 'society'],
    duration: 30
  },
];

export function getTasksByClass(classNum: 9 | 10): ASLTask[] {
  return ASL_TASKS.filter(task => task.class === classNum);
}

export function getTasksByMode(mode: 'solo' | 'pair'): ASLTask[] {
  return ASL_TASKS.filter(task => task.mode === mode);
}

export function getTaskById(id: string): ASLTask | undefined {
  return ASL_TASKS.find(task => task.id === id);
}
