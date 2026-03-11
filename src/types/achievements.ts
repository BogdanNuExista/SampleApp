import {
  SUBJECT_EXERCISE_COUNTS,
  TOTAL_LEARNING_EXERCISES,
} from '../constants/learningContent';

export type AchievementId =
  | 'first-session'
  | 'night-owl'
  | 'early-bird'
  | 'marathon-runner'
  | 'chess-beginner'
  | 'chess-master'
  | 'chess-legend'
  | 'maia-apprentice'
  | 'maia-challenger'
  | 'maia-champion'
  | 'ai-slayer'
  | 'sudoku-starter'
  | 'sudoku-novice'
  | 'sudoku-expert'
  | 'puzzle-master'
  | 'journaler'
  | 'mood-explorer'
  | 'streak-keeper'
  | 'coin-collector'
  | 'lane-apprentice'
  | 'lane-expert'
  | 'lane-master'
  | 'reaction-novice'
  | 'reaction-expert'
  | 'reaction-legend'
  | 'arcade-champion'
  | 'treasure-hunter'
  | 'arsenal-master'
  | 'completionist'
  | 'algebra-scholar'
  | 'analysis-scholar'
  | 'trig-scholar'
  | 'book-master';

export type Achievement = {
  id: AchievementId;
  title: string;
  description: string;
  icon: string;
  requirement: number;
  category: 'focus' | 'chess' | 'maia' | 'sudoku' | 'journal' | 'coins' | 'arcade' | 'inventory' | 'learning';
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
  'maia-apprentice': {
    id: 'maia-apprentice',
    title: 'AI Apprentice',
    description: 'Defeat Maia AI on Easy difficulty',
    icon: '🤖',
    requirement: 1,
    category: 'maia',
  },
  'maia-challenger': {
    id: 'maia-challenger',
    title: 'AI Challenger',
    description: 'Win 5 Maia AI matches',
    icon: '🎯',
    requirement: 5,
    category: 'maia',
  },
  'maia-champion': {
    id: 'maia-champion',
    title: 'AI Champion',
    description: 'Defeat Maia AI on Hard difficulty',
    icon: '🏆',
    requirement: 1,
    category: 'maia',
  },
  'ai-slayer': {
    id: 'ai-slayer',
    title: 'AI Slayer',
    description: 'Win 20 total Maia AI matches',
    icon: '⚔️',
    requirement: 20,
    category: 'maia',
  },
  'sudoku-starter': {
    id: 'sudoku-starter',
    title: 'Sudoku Starter',
    description: 'Complete 5 easy Sudoku puzzles',
    icon: '🌟',
    requirement: 5,
    category: 'sudoku',
  },
  'sudoku-novice': {
    id: 'sudoku-novice',
    title: 'Sudoku Novice',
    description: 'Complete your first Sudoku puzzle',
    icon: '🔢',
    requirement: 1,
    category: 'sudoku',
  },
  'sudoku-expert': {
    id: 'sudoku-expert',
    title: 'Sudoku Expert',
    description: 'Complete 10 Sudoku puzzles',
    icon: '🧩',
    requirement: 10,
    category: 'sudoku',
  },
  'puzzle-master': {
    id: 'puzzle-master',
    title: 'Puzzle Master',
    description: 'Complete 25 total Sudoku puzzles',
    icon: '🎓',
    requirement: 25,
    category: 'sudoku',
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
  'lane-apprentice': {
    id: 'lane-apprentice',
    title: 'Lane Apprentice',
    description: 'Score 100+ in Hyper Lane Defender',
    icon: '🎯',
    requirement: 100,
    category: 'arcade',
  },
  'lane-expert': {
    id: 'lane-expert',
    title: 'Lane Expert',
    description: 'Score 200+ in Hyper Lane Defender',
    icon: '🚀',
    requirement: 200,
    category: 'arcade',
  },
  'lane-master': {
    id: 'lane-master',
    title: 'Lane Master',
    description: 'Score 400+ in Hyper Lane Defender',
    icon: '👑',
    requirement: 400,
    category: 'arcade',
  },
  'reaction-novice': {
    id: 'reaction-novice',
    title: 'Reaction Novice',
    description: 'Score 360+ in Neon Reaction Pulse',
    icon: '⚡',
    requirement: 360,
    category: 'arcade',
  },
  'reaction-expert': {
    id: 'reaction-expert',
    title: 'Reaction Expert',
    description: 'Score 600+ in Neon Reaction Pulse',
    icon: '🌟',
    requirement: 600,
    category: 'arcade',
  },
  'reaction-legend': {
    id: 'reaction-legend',
    title: 'Reaction Legend',
    description: 'Score 900+ in Neon Reaction Pulse',
    icon: '💫',
    requirement: 900,
    category: 'arcade',
  },
  'arcade-champion': {
    id: 'arcade-champion',
    title: 'Arcade Champion',
    description: 'Master both arcade games (400+ lanes, 900+ reaction)',
    icon: '🏆',
    requirement: 1,
    category: 'arcade',
  },
  'treasure-hunter': {
    id: 'treasure-hunter',
    title: 'Treasure Hunter',
    description: 'Collect 10 unique loot items',
    icon: '💎',
    requirement: 10,
    category: 'inventory',
  },
  'arsenal-master': {
    id: 'arsenal-master',
    title: 'Arsenal Master',
    description: 'Collect 15 unique swords',
    icon: '⚔️',
    requirement: 15,
    category: 'inventory',
  },
  'completionist': {
    id: 'completionist',
    title: 'Completionist',
    description: 'Collect all 78 unique items (48 loot + 30 swords)',
    icon: '🌟',
    requirement: 78,
    category: 'inventory',
  },
  'algebra-scholar': {
    id: 'algebra-scholar',
    title: 'Algebra Scholar',
    description: `Solve all ${SUBJECT_EXERCISE_COUNTS.algebra} Algebra exercises`,
    icon: '📐',
    requirement: SUBJECT_EXERCISE_COUNTS.algebra,
    category: 'learning',
  },
  'analysis-scholar': {
    id: 'analysis-scholar',
    title: 'Analysis Scholar',
    description: `Solve all ${SUBJECT_EXERCISE_COUNTS.analysis} Analysis exercises`,
    icon: '📊',
    requirement: SUBJECT_EXERCISE_COUNTS.analysis,
    category: 'learning',
  },
  'trig-scholar': {
    id: 'trig-scholar',
    title: 'Trigonometry Scholar',
    description: `Solve all ${SUBJECT_EXERCISE_COUNTS.trigonometry} Trigonometry exercises`,
    icon: '📏',
    requirement: SUBJECT_EXERCISE_COUNTS.trigonometry,
    category: 'learning',
  },
  'book-master': {
    id: 'book-master',
    title: 'Book Master',
    description: `Solve all ${TOTAL_LEARNING_EXERCISES} exercises from all three subjects`,
    icon: '🎓',
    requirement: TOTAL_LEARNING_EXERCISES,
    category: 'learning',
  },
};

export type UserAchievement = {
  id: AchievementId;
  unlockedAt: number;
  progress: number;
};
