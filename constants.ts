
import { LevelInfo } from './types';

export const APP_ID = 'studygram-v3-max';

export const LEVELS: LevelInfo[] = [
  { min: 0, title: "Mầm Non", icon: "🌱", color: "text-green-500" },
  { min: 100, title: "Tập Sự", icon: "🐣", color: "text-yellow-500" },
  { min: 300, title: "Học Giả", icon: "🦉", color: "text-blue-500" },
  { min: 600, title: "Giáo Sư", icon: "👓", color: "text-purple-500" },
  { min: 1000, title: "Thần Đồng", icon: "👑", color: "text-red-500" }
];

export const STUDY_CATEGORIES = [
  "Toán học", "Ngữ văn", "Ngoại ngữ", "Vật lý", "Hóa học", "Lịch sử", "Địa lý", "Tin học", "Khác"
];

export const getLevelInfo = (exp: number): LevelInfo => {
  return [...LEVELS].reverse().find(l => exp >= l.min) || LEVELS[0];
};
