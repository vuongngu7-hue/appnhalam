
export interface Comment {
  id: string;
  userName: string;
  avatar: string;
  content: string;
  createdAt: number;
  likes?: number;
  isAuthor?: boolean;
}

export type LoginMethod = 'google' | 'facebook' | 'guest';

export enum Modality {
  TEXT = 'TEXT',
  IMAGE = 'IMAGE',
  AUDIO = 'AUDIO',
  VIDEO = 'VIDEO'
}

export type Grade = '10' | '11' | '12';
export type ExamDifficulty = 'theory' | 'practice' | 'hardcore';

export interface RoadmapNode {
  id: string;
  title: string;
  status: 'locked' | 'current' | 'completed';
  topics: string[];
  difficulty: ExamDifficulty;
}

export interface StudyMission {
  goal: 'HK' | 'THPTQG' | 'IELTS' | 'OTHER';
  grade: Grade;
  targetDate: number;
  subject: string;
  roadmap: RoadmapNode[];
}

export interface DailyQuest {
  id: string;
  text: string;
  target: number;
  current: number;
  reward: number;
  isClaimed: boolean;
}

export interface UserSkills {
  criticalThinking: number;
  focus: number;
  creativity: number;
  knowledge: number;
  discipline: number;
}

export interface UserProfile {
  uid: string;
  name: string;
  avatar: string;
  exp: number;
  coins: number;
  bio: string;
  joinedAt: number;
  streak: number;
  lives: number;
  streakShields: number;
  lastLogin?: number;
  completedQuizzes: number;
  isAdmin?: boolean;
  isVerified?: boolean;
  isStudentOfWeek?: boolean;
  loginMethod?: LoginMethod;
  dailyQuests: DailyQuest[];
  skills: UserSkills;
  currentMission?: StudyMission;
  weakPoints: { topic: string; score: number }[];
  inventory: { id: string; type: 'powerup' | 'shield' | 'cosmetic'; count: number }[];
}

export type PostType = 'knowledge' | 'story' | 'meme' | 'event';

export interface Post {
  id: string;
  uid: string;
  userName: string;
  avatar: string;
  content: string;
  category: string;
  type: PostType;
  mood?: string;
  createdAt: number;
  likes: string[];
  comments: Comment[];
  aiAnalysis?: string;
  hashtags?: string[];
  isPinned?: boolean;
  image?: string;
}

export interface Message {
  role: 'ai' | 'user';
  text: string;
  timestamp: number;
}

export enum AppTab {
  FEED = 'feed',
  TUTOR = 'tutor',
  FOCUS = 'focus',
  TOOLS = 'tools',
  QUIZ = 'quiz',
  RANK = 'rank',
  PROFILE = 'profile',
  MISSION = 'mission'
}

export interface LevelInfo {
  min: number;
  title: string;
  icon: string;
  color: string;
}
