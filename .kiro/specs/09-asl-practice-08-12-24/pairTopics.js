/**
 * PAIR DISCUSSION TOPICS - AI-DRIVEN CONVERSATIONS
 * For voice tutor app: Student practices debating with AI
 * 
 * Format: AI presents an opinion, student must respond/counter
 * Based on CBSE Syllabus 2025-26 discussion themes
 */

export const pairTopics = [
  {
    id: 1,
    topic: "Homework - Good or Bad?",
    aiOpinion: "I think homework is very important because it helps us practice what we learn in class. Without practice, we might forget the lessons.",
    counter: "But too much homework makes students tired and they don't get time to play. What do you think - should teachers give less homework?",
    keywords: ["homework", "practice", "tired", "time", "study", "balance"],
    class: "9-10",
    difficulty: "easy"
  },
  {
    id: 2,
    topic: "Mobile Phones in School",
    aiOpinion: "I believe students should be allowed to bring mobile phones to school because they can use them for learning and emergencies.",
    counter: "However, mobiles can distract students during class and they might waste time on games or social media. Do you agree with me or not?",
    keywords: ["mobile", "phone", "school", "distraction", "learning", "emergency"],
    class: "9-10",
    difficulty: "medium"
  },
  {
    id: 3,
    topic: "Online vs Offline Classes",
    aiOpinion: "Online classes are better because students can study from home comfortably and save travel time. They can also watch recorded lectures again.",
    counter: "But in offline classes, we can interact with friends and teachers directly. Online classes can cause eye strain and internet problems. Which do you prefer?",
    keywords: ["online", "offline", "class", "comfort", "interaction", "internet"],
    class: "9-10",
    difficulty: "medium"
  },
  {
    id: 4,
    topic: "School Uniform - Necessary?",
    aiOpinion: "School uniform is important because it creates equality among students. Rich or poor, everyone looks the same in uniform.",
    counter: "Some students feel that uniform restricts their personal style and freedom. They want to wear what they like. What's your opinion on this?",
    keywords: ["uniform", "equality", "freedom", "style", "school", "identity"],
    class: "9-10",
    difficulty: "easy"
  },
  {
    id: 5,
    topic: "Competitive Exams - Stress or Motivation?",
    aiOpinion: "Competitive exams motivate students to work hard and achieve their goals. They prepare us for future challenges.",
    counter: "But these exams create a lot of stress and pressure on young students. Many students feel anxious and depressed. Should we reduce the number of exams?",
    keywords: ["exam", "stress", "motivation", "pressure", "competition", "anxiety"],
    class: "10",
    difficulty: "medium"
  },
  {
    id: 6,
    topic: "Books vs Movies",
    aiOpinion: "Reading books is better than watching movies because books improve our imagination and vocabulary. We learn more from reading.",
    counter: "Movies are more entertaining and we can understand stories faster. They have music and visuals that books don't have. Which do you enjoy more?",
    keywords: ["books", "movies", "reading", "imagination", "entertainment", "visual"],
    class: "9-10",
    difficulty: "easy"
  },
  {
    id: 7,
    topic: "Social Media - Connecting or Dividing?",
    aiOpinion: "Social media connects people across the world. We can stay in touch with friends and family easily, and learn new things.",
    counter: "But social media also spreads fake news and makes people compare their lives with others. It can make students feel lonely. What are your thoughts?",
    keywords: ["social", "media", "connect", "fake", "news", "lonely", "compare"],
    class: "9-10",
    difficulty: "hard"
  },
  {
    id: 8,
    topic: "Sports vs Studies - What's More Important?",
    aiOpinion: "Studies should be the first priority because education helps us get good jobs and build a career. Sports are just for fun and fitness.",
    counter: "Sports teach teamwork, discipline, and keep us healthy. Many sports persons have successful careers. Can't we balance both equally?",
    keywords: ["sports", "studies", "career", "health", "teamwork", "balance"],
    class: "9-10",
    difficulty: "medium"
  },
  {
    id: 9,
    topic: "Junk Food in School Canteens",
    aiOpinion: "Schools should ban junk food from canteens because it's unhealthy. Students should eat nutritious food like fruits and vegetables.",
    counter: "Students enjoy eating pizza, burgers, and chips. It's their choice what to eat. Banning junk food might make them unhappy. What do you think?",
    keywords: ["junk", "food", "health", "canteen", "choice", "nutrition"],
    class: "9-10",
    difficulty: "easy"
  },
  {
    id: 10,
    topic: "Learning Foreign Languages",
    aiOpinion: "Students should learn foreign languages like French or German because it opens up job opportunities abroad and helps in communication.",
    counter: "We should focus more on Indian languages first. Many students struggle with Hindi and English already. Should we add more language burden?",
    keywords: ["language", "foreign", "communication", "opportunity", "burden", "Indian"],
    class: "9-10",
    difficulty: "hard"
  },
  {
    id: 11,
    topic: "Climate Change - Individual vs Government Responsibility",
    aiOpinion: "Individuals should take responsibility for climate change by reducing waste, recycling, and saving water and electricity.",
    counter: "But governments and big companies cause most pollution. One person's effort won't make much difference. Should we wait for government action?",
    keywords: ["climate", "change", "responsibility", "pollution", "individual", "government"],
    class: "10",
    difficulty: "hard"
  },
  {
    id: 12,
    topic: "Science Stream vs Commerce Stream",
    aiOpinion: "Science stream is better because it has more career options. You can become a doctor, engineer, or scientist.",
    counter: "Commerce stream is also important for business and economics. Not everyone is good at science subjects. Both streams are equally valuable, right?",
    keywords: ["science", "commerce", "career", "stream", "engineer", "business"],
    class: "10",
    difficulty: "medium"
  }
];

/**
 * Get a random pair discussion topic
 */
export function getRandomPairTopic() {
  const randomIndex = Math.floor(Math.random() * pairTopics.length);
  return pairTopics[randomIndex];
}

/**
 * Get topics by difficulty level
 * @param {string} difficulty - "easy", "medium", or "hard"
 */
export function getPairTopicsByDifficulty(difficulty) {
  return pairTopics.filter(topic => topic.difficulty === difficulty);
}

/**
 * Get topics suitable for a specific class
 * @param {number} classNumber - 9 or 10 (returns topics marked "9-10" or specific class)
 */
export function getPairTopicsByClass(classNumber) {
  return pairTopics.filter(topic => 
    topic.class === `${classNumber}` || topic.class === "9-10"
  );
}

export default pairTopics;
