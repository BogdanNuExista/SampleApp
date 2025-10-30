export type AchievementId =
  | 'first-session'
  | 'night-owl'
  | 'early-bird'
  | 'marathon-runner'
  | 'chess-beginner'
  | 'chess-master'
  | 'chess-legend'
  | 'journaler'
  | 'mood-explorer'
  | 'streak-keeper'
  | 'coin-collector';

export type Achievement = {
  id: AchievementId;
  title: string;
  description: string;
  icon: string;
  requirement: number;
  category: 'focus' | 'chess' | 'journal' | 'coins';
};

export const ACHIEVEMENTS: Record<AchievementId, Achievement> = {
  'first-session': {
    id: 'first-session',
    title: 'First Focus',
    description: 'Complete your first focus session',
    icon: '⚡',
    requirement: 1,
    category: 'focus',
  },
  'night-owl': {
    id: 'night-owl',
    title: 'Night Owl',
    description: 'Complete 10 sessions after 10 PM',
    icon: '🦉',
    requirement: 10,
    category: 'focus',
  },
  'early-bird': {
    id: 'early-bird',
    title: 'Early Bird',
    description: 'Complete 10 sessions before 8 AM',
    icon: '🌅',
    requirement: 10,
    category: 'focus',
  },
  'marathon-runner': {
    id: 'marathon-runner',
    title: 'Marathon Runner',
    description: 'Complete a 90+ minute session',
    icon: '🏃',
    requirement: 90,
    category: 'focus',
  },
  'chess-beginner': {
    id: 'chess-beginner',
    title: 'Chess Beginner',
    description: 'Win 5 chess matches',
    icon: '♟️',
    requirement: 5,
    category: 'chess',
  },
  'chess-master': {
    id: 'chess-master',
    title: 'Chess Master',
    description: 'Win 10 hard difficulty matches',
    icon: '♞',
    requirement: 10,
    category: 'chess',
  },
  'chess-legend': {
    id: 'chess-legend',
    title: 'Chess Legend',
    description: 'Win 50 total chess matches',
    icon: '👑',
    requirement: 50,
    category: 'chess',
  },
  'journaler': {
    id: 'journaler',
    title: 'Journaler',
    description: 'Create 30 journal entries',
    icon: '📔',
    requirement: 30,
    category: 'journal',
  },
  'mood-explorer': {
    id: 'mood-explorer',
    title: 'Mood Explorer',
    description: 'Use all 5 different moods',
    icon: '🌈',
    requirement: 5,
    category: 'journal',
  },
  'streak-keeper': {
    id: 'streak-keeper',
    title: 'Streak Keeper',
    description: 'Maintain a 7-day focus streak',
    icon: '🔥',
    requirement: 7,
    category: 'focus',
  },
  'coin-collector': {
    id: 'coin-collector',
    title: 'Coin Collector',
    description: 'Earn 1,000 total coins',
    icon: '🪙',
    requirement: 1000,
    category: 'coins',
  },
};

export type UserAchievement = {
  id: AchievementId;
  unlockedAt: number;
  progress: number;
};
