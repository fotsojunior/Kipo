export type UserProfile = 'eleve' | 'etudiant' | 'professeur' | 'autre';

export type SupportedLanguage = 'fr' | 'en' | 'es' | string;

export type QuestionType = 'multiple_choice' | 'true_false' | 'fill_blank' | 'match_pairs';

export interface AttachmentMeta {
  id: string;
  name: string;
  mimeType: string;
  size: number;
  data: string; // Base64 string without data:mime;base64, prefix
  type: 'image' | 'pdf' | 'text';
  previewUrl?: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  attachments?: AttachmentMeta[];
}

export interface Conversation {
  id: string;
  title: string;
  profile: UserProfile;
  messages: ChatMessage[];
  createdAt: string;
  updatedAt: string;
  tags: string[];
}

export interface PairMatchItem {
  left: string;
  right: string;
}

export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
  xpReward?: number;
  type?: QuestionType;
  pairs?: PairMatchItem[]; // For match_pairs type
  sentence?: string; // For fill_blank
  blankAnswer?: string;
}

export interface Quiz {
  id: string;
  title: string;
  subject: string;
  difficulty: 'Facile' | 'Moyen' | 'Expert' | string;
  timeLimitSeconds?: number;
  questions: QuizQuestion[];
  createdAt: string;
  timesPlayed: number;
  bestScore?: number;
  documentId?: string;
}

// Duolingo-style Learning Path & Lessons (Minimum 20 questions per document)
export interface LearningLesson {
  id: string;
  lessonNumber: number;
  title: string;
  description: string;
  questions: QuizQuestion[];
  isCompleted: boolean;
  stars: number; // 0 to 3 stars
}

export interface PathUnit {
  unitNumber: number;
  title: string;
  theme: string;
  description: string;
  startLesson: number;
  endLesson: number;
  accentColor: string;
  badgeIcon: string;
}

export interface DuolingoPath {
  id: string;
  documentId?: string;
  title: string;
  subject: string;
  userRequest?: string; // Custom demand/focus requested by the user
  totalQuestions: number; // Minimum 20 questions per document
  lessons: LearningLesson[];
  units?: PathUnit[];
  docSummary?: string;
  docKeyConcepts?: string[];
  createdAt: string;
}

export interface Flashcard {
  id: string;
  front: string;
  back: string;
  hint?: string;
  mastered?: boolean;
}

export interface FlashcardDeck {
  id: string;
  title: string;
  subject: string;
  cards: Flashcard[];
  createdAt: string;
  timesReviewed: number;
  documentId?: string;
}

export interface AnalyzedDocument {
  id: string;
  title: string;
  fileName: string;
  fileType: string;
  summary: string;
  keyConcepts: string[];
  studyTip: string;
  suggestedQuestions?: string[];
  createdAt: string;
  rawTextPreview?: string;
  generatedPathId?: string;
  questionCount?: number;
  storagePath?: string;
}

export interface Badge {
  id: string;
  title: string;
  description: string;
  icon: string;
  unlocked: boolean;
  unlockedAt?: string;
  xpRequired: number;
}

export interface UserStats {
  xp: number;
  level: number;
  levelTitle: string;
  streakDays: number;
  lastActiveDate: string;
  badges: Badge[];
  questionsAnswered: number;
  quizzesCompleted: number;
  cardsMastered: number;
  profile: UserProfile;
  language: SupportedLanguage;
  hearts: number; // Duolingo lives (default 5)
  maxHearts: number;
  gems: number; // Duolingo lingots
}

// Collaborative Learning Spaces
export type GroupRole = 'admin' | 'member';

export interface GroupMember {
  id: string;
  name: string;
  avatar: string;
  role: GroupRole;
  profile: UserProfile;
  joinedAt: string;
  xpContributed: number;
}

export interface GroupJoinRequest {
  id: string;
  userId: string;
  userName: string;
  userEmail?: string;
  requestedAt: string;
  profile: UserProfile;
}

export interface SharedDocumentItem {
  id: string;
  docId: string;
  title: string;
  fileName: string;
  fileType?: 'pdf' | 'image' | 'text' | 'document';
  fileData?: string; // Base64 data for download and instant preview
  fileSize?: number;
  sharedBy: string;
  sharedByName: string;
  sharedAt: string;
  permission: 'read_only' | 'interactive'; // configured by admin or creator
  summary: string;
  keyConcepts: string[];
  questionCount?: number;
}

export interface GroupChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  senderRole: 'admin' | 'member' | 'ai_moderator';
  content: string;
  timestamp: string;
  isAiSummary?: boolean;
  isModeration?: boolean;
  attachment?: {
    id: string;
    name: string;
    mimeType: string;
    size: number;
    data: string;
    type: 'image' | 'pdf' | 'text';
  };
}

export interface GroupQuizItem {
  id: string;
  title: string;
  quizId: string;
  creatorName: string;
  questionCount: number;
  createdAt: string;
  playedCount: number;
}

export interface StudyGroup {
  id: string;
  name: string;
  description: string;
  subject: string; // Custom subject entered freely by the user
  privacy: 'public' | 'private'; // public = 1-click join, private = approval required
  inviteCode: string;
  createdBy: string;
  createdByName: string;
  createdAt: string;
  permissions: {
    whoCanShareDocs: 'all' | 'admins_only';
    whoCanCreateQuizzes: 'all' | 'admins_only';
    defaultDocAccess: 'read_only' | 'interactive';
  };
  members: GroupMember[];
  pendingRequests?: GroupJoinRequest[];
  sharedDocuments: SharedDocumentItem[];
  messages: GroupChatMessage[];
  groupQuizzes: GroupQuizItem[];
}

// Educational Audio Podcasts (Multimodal: problem text, photos, PDFs, docs)
export type PodcastFormat = 'dialogue' | 'solo_teacher' | 'express_3min' | 'storytelling';

export interface PodcastSpeaker {
  id: string;
  name: string;
  role: string;
  gender: 'female' | 'male';
  avatar?: string;
}

export interface PodcastDialogueLine {
  id: string;
  speaker: string;
  speakerId: string;
  text: string;
  tone?: string;
  durationSeconds?: number;
}

export interface PodcastChapter {
  id: string;
  timestamp: string; // e.g. "00:00"
  seconds: number;
  title: string;
}

export interface EducationalPodcast {
  id: string;
  title: string;
  subtitle: string;
  subject: string;
  durationEstimateMinutes: number;
  summary: string;
  topicsCovered: string[];
  hosts: PodcastSpeaker[];
  chapters: PodcastChapter[];
  script: PodcastDialogueLine[];
  takeaways: string[];
  quizQuestions?: Array<{
    question: string;
    options: string[];
    correctIndex: number;
    explanation: string;
  }>;
  format: PodcastFormat;
  sourcePrompt?: string;
  sourceDocName?: string;
  createdAt: string;
  listenedCount?: number;
}

// ==========================================
// KIPO ANIMAL ADVENTURE GAMES (LUDIQUES & MISSIONS)
// ==========================================
export type AnimalCharacterId = 'hibou' | 'chat' | 'chien' | 'souris' | 'renard';

export interface AnimalHero {
  id: AnimalCharacterId;
  name: string;
  species: string;
  emoji: string;
  role: string;
  title: string;
  avatarColor: string;
  bgGradient: string;
  personality: string;
  catchphrase: string;
  specialPower: {
    id: string;
    name: string;
    description: string;
    emoji: string;
    effect: 'hint' | 'fifty_fifty' | 'shield' | 'freeze_time' | 'double_xp';
  };
  baseStats: {
    speed: number;
    wisdom: number;
    bravery: number;
  };
}

export type GameMissionType = 'boss_fight' | 'speed_trivia' | 'concept_sorting' | 'puzzle_vault' | 'mystery_riddle';

export interface GameMissionTask {
  id: string;
  type: 'question' | 'sort' | 'vault';
  prompt: string;
  options: string[];
  correctIndex: number;
  explanation: string;
  animalCommentary?: Partial<Record<AnimalCharacterId, string>>;
  points: number;
  difficulty?: 'facile' | 'difficile';
  timeLimitSeconds?: number;
  // For sorting mini-game
  categories?: string[];
  sortItems?: Array<{ item: string; correctCategory: string }>;
}

export interface GameMissionBoss {
  id: string;
  name: string;
  title: string;
  emoji: string;
  avatarBg: string;
  maxHp: number;
  tauntPhrase: string;
  defeatPhrase: string;
  weaknessDescription: string;
}

export interface GameMission {
  id: string;
  order: number;
  title: string;
  storyIntro: string;
  locationName: string;
  environmentEmoji: string;
  type: GameMissionType;
  heroCompanionId: AnimalCharacterId;
  boss?: GameMissionBoss;
  tasks: GameMissionTask[];
  completed?: boolean;
  score?: number;
  stars?: number; // 0 to 3
}

export interface AnimalAdventureGame {
  id: string;
  title: string;
  universeName: string;
  subject: string;
  conceptSummary: string;
  targetLevel: string;
  storyline: string;
  leadAnimalId: AnimalCharacterId;
  missions: GameMission[];
  rewards: {
    badgeName: string;
    badgeEmoji: string;
    totalXp: number;
    trophyDescription: string;
  };
  sourcePrompt?: string;
  sourceDocName?: string;
  createdAt: string;
}


