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
    duration: 60
  },
  {
    id: 'c9-solo-2',
    class: 9,
    mode: 'solo',
    title: 'A Memorable Day',
    prompt: 'Describe a memorable day in your life. What happened? Why was it special? How did you feel?',
    keywords: ['day', 'special', 'remember', 'happened', 'felt'],
    duration: 60
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
