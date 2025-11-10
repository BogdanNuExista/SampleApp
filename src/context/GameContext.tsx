import AsyncStorage from '@react-native-async-storage/async-storage';
import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useState,
} from 'react';
import {
  InventoryCatalogItem,
  getInventoryItemById,
  pickRandomInventoryItem,
} from '../constants/inventoryCatalog';
import { AchievementId, ACHIEVEMENTS, UserAchievement } from '../types/achievements';

export type FocusSession = {
  id: string;
  durationMinutes: number;
  completedAt: number;
  coinsEarned: number;
  streakAchieved: number;
};

export type JournalMood = 'reflective' | 'grateful' | 'energized' | 'curious' | 'victorious';

export type Flashcard = {
  id: string;
  title: string;
  description: string;
  imageBase64?: string;
  createdAt: number;
  lastReviewedAt?: number;
  favorite?: boolean;
  mood?: JournalMood;
};

export type ChessDifficulty = 'easy' | 'normal' | 'hard';
type ChessOutcome = 'win' | 'loss';
type ChessRecord = {
  wins: number;
  losses: number;
};

export type ChessUnlockState = {
  normal: boolean;
  hard: boolean;
};

type ChessProgress = {
  stats: Record<ChessDifficulty, ChessRecord>;
  unlocked: ChessUnlockState;
  totalGames: number;
};

// Maia Chess types
export type MaiaChessDifficulty = 'apprentice' | 'adept' | 'master';

export type MaiaChessUnlockState = {
  apprentice: boolean;
  adept: boolean;
  master: boolean;
};

type MaiaChessProgress = {
  stats: Record<MaiaChessDifficulty, ChessRecord>;
  unlocked: MaiaChessUnlockState;
  totalGames: number;
};

// Sudoku types
export type SudokuDifficulty = 'easy' | 'medium' | 'expert';

type SudokuStats = {
  played: number;
  completed: number;
  bestTime: number | null;
};

type SudokuProgress = {
  unlockedDifficulties: SudokuDifficulty[];
  totalGames: number;
  totalWins: number;
  stats: Record<SudokuDifficulty, SudokuStats>;
};

export type InventoryItem = InventoryCatalogItem & {
  obtainedAt: number;
};

export type ChessMatchRequest = {
  difficulty: ChessDifficulty;
  outcome: 'win' | 'loss' | 'draw';
};

export type ChessMatchResolution = {
  coinsEarned: number;
  reward: InventoryCatalogItem | null;
  isRewardNew: boolean;
  unlocks: ChessUnlockState;
  newlyUnlocked: ChessUnlockState;
};

// Maia Chess match types
export type MaiaChessMatchRequest = {
  difficulty: MaiaChessDifficulty;
  outcome: 'win' | 'loss' | 'draw';
};

export type MaiaChessMatchResolution = {
  coinsEarned: number;
  reward: InventoryCatalogItem | null;
  isRewardNew: boolean;
};

export type GameState = {
  profileName: string;
  coins: number;
  streak: number;
  bestSessionMinutes: number;
  totalFocusMinutes: number;
  totalCoinsEarned: number;
  lastSessionDateISO?: string;
  focusSessions: FocusSession[];
  flashcards: Flashcard[];
  arcadeHighScores: {
    lanes: number;
    reaction: number;
  };
  ownedSkins: string[];
  activeSkin: string;
  chess: ChessProgress;
  maiaChess: MaiaChessProgress;
  sudoku: SudokuProgress;
  inventory: InventoryItem[];
  achievements: UserAchievement[];
  musicEnabled: boolean;
  soundEffectsEnabled: boolean;
};

const STORAGE_KEY = 'retro-arcade-study-state-v1';
const createInitialChessState = (): ChessProgress => ({
  stats: {
    easy: { wins: 0, losses: 0 },
    normal: { wins: 0, losses: 0 },
    hard: { wins: 0, losses: 0 },
  },
  unlocked: { normal: false, hard: false },
  totalGames: 0,
});

const createInitialMaiaChessState = (): MaiaChessProgress => ({
  stats: {
    apprentice: { wins: 0, losses: 0 },
    adept: { wins: 0, losses: 0 },
    master: { wins: 0, losses: 0 },
  },
  unlocked: { apprentice: false, adept: false, master: false },
  totalGames: 0,
});

const CHESS_REWARD_COINS: Record<ChessDifficulty, number> = {
  easy: 12,
  normal: 24,
  hard: 40,
};

const MAIA_CHESS_REWARD_COINS: Record<MaiaChessDifficulty, number> = {
  apprentice: 15,
  adept: 30,
  master: 50,
};

const createInitialSudokuState = (): SudokuProgress => ({
  unlockedDifficulties: ['easy'], // Easy is unlocked by default
  totalGames: 0,
  totalWins: 0,
  stats: {
    easy: { played: 0, completed: 0, bestTime: null },
    medium: { played: 0, completed: 0, bestTime: null },
    expert: { played: 0, completed: 0, bestTime: null },
  },
});

const initialState: GameState = {
  profileName: 'Player One',
  coins: 0,
  streak: 0,
  bestSessionMinutes: 0,
  totalFocusMinutes: 0,
  totalCoinsEarned: 0,
  lastSessionDateISO: undefined,
  focusSessions: [],
  flashcards: [],
  arcadeHighScores: {
    lanes: 0,
    reaction: 0,
  },
  ownedSkins: ['neon'],
  activeSkin: 'neon',
  chess: createInitialChessState(),
  maiaChess: createInitialMaiaChessState(),
  sudoku: createInitialSudokuState(),
  inventory: [],
  achievements: [],
  musicEnabled: true,
  soundEffectsEnabled: true,
};

type Action =
  | { type: 'SET_PROFILE_NAME'; payload: string }
  | { type: 'COMPLETE_SESSION'; payload: { durationMinutes: number } }
  | { type: 'DELETE_FLASHCARD'; payload: { id: string } }
  | {
      type: 'ADD_FLASHCARD';
      payload: {
        title: string;
        description: string;
        imageBase64?: string;
        mood?: JournalMood;
      };
    }
  | {
      type: 'UPDATE_FLASHCARD';
      payload: {
        id: string;
        updates: Partial<Omit<Flashcard, 'id' | 'createdAt'>>;
      };
    }
  | { type: 'TOGGLE_FLASHCARD_FAVORITE'; payload: { id: string } }
  | { type: 'RECORD_ARCADE_SCORE'; payload: { game: 'lanes' | 'reaction'; score: number } }
  | { type: 'SPEND_COINS'; payload: { amount: number } }
  | {
      type: 'UNLOCK_SKIN';
      payload: { skinId: string };
    }
  | {
      type: 'SET_ACTIVE_SKIN';
      payload: { skinId: string };
    }
  | {
      type: 'COMPLETE_CHESS_GAME';
      payload: {
        coinsEarned: number;
        nextStats: Record<ChessDifficulty, ChessRecord>;
        nextUnlocked: ChessUnlockState;
        rewardItem?: InventoryItem | null;
      };
    }
  | {
      type: 'COMPLETE_MAIA_CHESS_GAME';
      payload: {
        coinsEarned: number;
        nextStats: Record<MaiaChessDifficulty, ChessRecord>;
        rewardItem?: InventoryItem | null;
      };
    }
  | {
      type: 'UNLOCK_MAIA_DIFFICULTY';
      payload: { difficulty: MaiaChessDifficulty };
    }
  | {
      type: 'COMPLETE_SUDOKU_GAME';
      payload: { difficulty: SudokuDifficulty; completed: boolean; coinsEarned: number };
    }
  | {
      type: 'UNLOCK_SUDOKU_DIFFICULTY';
      payload: { difficulty: SudokuDifficulty; cost: number };
    }
  | { type: 'UNLOCK_ACHIEVEMENT'; payload: { achievementId: AchievementId } }
  | { type: 'TOGGLE_MUSIC'; payload?: { enabled: boolean } }
  | { type: 'TOGGLE_SOUND_EFFECTS'; payload?: { enabled: boolean } }
  | { type: 'HYDRATE'; payload: GameState };

function generateId() {
  return `${Date.now()}-${Math.random().toString(16).slice(2, 8)}`;
}

function dayKeyFromTimestamp(timestamp: number) {
  return new Date(timestamp).toISOString().split('T')[0];
}

function differenceInDays(from: string | undefined, to: string) {
  if (!from) {
    return Number.POSITIVE_INFINITY;
  }

  const fromDate = new Date(from);
  const toDate = new Date(to);
  const diff =
    (toDate.setHours(0, 0, 0, 0) - fromDate.setHours(0, 0, 0, 0)) /
    (1000 * 60 * 60 * 24);
  return diff;
}

function reducer(state: GameState, action: Action): GameState {
  switch (action.type) {
    case 'SET_PROFILE_NAME':
      return { ...state, profileName: action.payload.trim() || 'Player One' };
    case 'COMPLETE_SESSION': {
      const { durationMinutes } = action.payload;
      const completedAt = Date.now();
      const dayKey = dayKeyFromTimestamp(completedAt);
      const daysDiff = differenceInDays(state.lastSessionDateISO, dayKey);
      const newStreak =
        daysDiff === 0
          ? state.streak
          : daysDiff === 1
          ? state.streak + 1
          : 1;
  const baseReward = Math.max(3, Math.round(durationMinutes * 1.5));
  const streakBonus = newStreak > 0 ? Math.floor(newStreak / 3) : 0;
      const coinsEarned = baseReward + streakBonus;
      const focusSession: FocusSession = {
        id: generateId(),
        durationMinutes,
        completedAt,
        coinsEarned,
        streakAchieved: newStreak,
      };
      const focusSessions = [focusSession, ...state.focusSessions].slice(0, 5);

      return {
        ...state,
        coins: state.coins + coinsEarned,
        totalCoinsEarned: state.totalCoinsEarned + coinsEarned,
        streak: newStreak,
        bestSessionMinutes: Math.max(state.bestSessionMinutes, durationMinutes),
        totalFocusMinutes: state.totalFocusMinutes + durationMinutes,
        lastSessionDateISO: dayKey,
        focusSessions,
      };
    }
    case 'ADD_FLASHCARD': {
      const { title, description, imageBase64, mood } = action.payload;
      const flashcard: Flashcard = {
        id: generateId(),
        title,
        description,
        imageBase64,
        createdAt: Date.now(),
        favorite: false,
        mood,
      };
      return { ...state, flashcards: [flashcard, ...state.flashcards] };
    }
    case 'DELETE_FLASHCARD': {
      const { id } = action.payload;
      return {
        ...state,
        flashcards: state.flashcards.filter(card => card.id !== id),
      };
    }
    case 'UPDATE_FLASHCARD': {
      const { id, updates } = action.payload;
      const flashcards = state.flashcards.map(card =>
        card.id === id
          ? {
              ...card,
              ...updates,
              lastReviewedAt: updates.lastReviewedAt ?? card.lastReviewedAt,
            }
          : card,
      );
      return { ...state, flashcards };
    }
    case 'TOGGLE_FLASHCARD_FAVORITE': {
      const { id } = action.payload;
      const flashcards = state.flashcards.map(card =>
        card.id === id ? { ...card, favorite: !card.favorite } : card,
      );
      return { ...state, flashcards };
    }
    case 'RECORD_ARCADE_SCORE': {
      const { game, score } = action.payload;
      const currentHighScore = state.arcadeHighScores[game];
      const isNewHighScore = score > currentHighScore;
      const bonusCoins = Math.max(0, Math.floor(score / 15));
      return {
        ...state,
        arcadeHighScores: {
          ...state.arcadeHighScores,
          [game]: isNewHighScore ? score : currentHighScore,
        },
        coins: state.coins + bonusCoins,
        totalCoinsEarned: state.totalCoinsEarned + bonusCoins,
      };
    }
    case 'SPEND_COINS': {
      const { amount } = action.payload;
      if (amount > state.coins) {
        return state;
      }
      return { ...state, coins: state.coins - amount };
    }
    case 'UNLOCK_SKIN': {
      const { skinId } = action.payload;
      if (state.ownedSkins.includes(skinId)) {
        return state;
      }
      return {
        ...state,
        ownedSkins: [...state.ownedSkins, skinId],
      };
    }
    case 'SET_ACTIVE_SKIN': {
      const { skinId } = action.payload;
      if (!state.ownedSkins.includes(skinId)) {
        return state;
      }
      return { ...state, activeSkin: skinId };
    }
    case 'COMPLETE_CHESS_GAME': {
      const { coinsEarned, nextStats, nextUnlocked, rewardItem } = action.payload;
      const inventory = rewardItem
        ? [...state.inventory, rewardItem]
        : state.inventory;
      return {
        ...state,
        coins: state.coins + coinsEarned,
        totalCoinsEarned: state.totalCoinsEarned + coinsEarned,
        chess: {
          stats: {
            easy: { ...nextStats.easy },
            normal: { ...nextStats.normal },
            hard: { ...nextStats.hard },
          },
          unlocked: { ...nextUnlocked },
          totalGames: state.chess.totalGames + 1,
        },
        inventory,
      };
    }
    case 'COMPLETE_MAIA_CHESS_GAME': {
      const { coinsEarned, nextStats, rewardItem } = action.payload;
      const inventory = rewardItem
        ? [...state.inventory, rewardItem]
        : state.inventory;
      return {
        ...state,
        coins: state.coins + coinsEarned,
        totalCoinsEarned: state.totalCoinsEarned + coinsEarned,
        maiaChess: {
          stats: {
            apprentice: { ...nextStats.apprentice },
            adept: { ...nextStats.adept },
            master: { ...nextStats.master },
          },
          unlocked: { ...state.maiaChess.unlocked },
          totalGames: state.maiaChess.totalGames + 1,
        },
        inventory,
      };
    }
    case 'UNLOCK_MAIA_DIFFICULTY': {
      const { difficulty } = action.payload;
      return {
        ...state,
        maiaChess: {
          ...state.maiaChess,
          unlocked: {
            ...state.maiaChess.unlocked,
            [difficulty]: true,
          },
        },
      };
    }
    case 'COMPLETE_SUDOKU_GAME': {
      const { difficulty, completed, coinsEarned } = action.payload;
      return {
        ...state,
        coins: state.coins + coinsEarned,
        totalCoinsEarned: state.totalCoinsEarned + coinsEarned,
        sudoku: {
          ...state.sudoku,
          totalGames: state.sudoku.totalGames + 1,
          totalWins: completed ? state.sudoku.totalWins + 1 : state.sudoku.totalWins,
          stats: {
            ...state.sudoku.stats,
            [difficulty]: {
              ...state.sudoku.stats[difficulty],
              played: state.sudoku.stats[difficulty].played + 1,
              completed: completed 
                ? state.sudoku.stats[difficulty].completed + 1 
                : state.sudoku.stats[difficulty].completed,
            },
          },
        },
      };
    }
    case 'UNLOCK_SUDOKU_DIFFICULTY': {
      const { difficulty, cost } = action.payload;
      if (state.coins < cost) return state;
      
      return {
        ...state,
        coins: state.coins - cost,
        sudoku: {
          ...state.sudoku,
          unlockedDifficulties: [...state.sudoku.unlockedDifficulties, difficulty],
        },
      };
    }
    case 'HYDRATE': {
      const persisted = action.payload;
      const focusSessions = persisted.focusSessions
        ? persisted.focusSessions.slice(0, 5)
        : [];
      const persistedChess = persisted.chess;
      const stats: Record<ChessDifficulty, ChessRecord> = {
        easy: {
          wins:
            persistedChess?.stats?.easy?.wins ??
            initialState.chess.stats.easy.wins,
          losses:
            persistedChess?.stats?.easy?.losses ??
            initialState.chess.stats.easy.losses,
        },
        normal: {
          wins:
            persistedChess?.stats?.normal?.wins ??
            initialState.chess.stats.normal.wins,
          losses:
            persistedChess?.stats?.normal?.losses ??
            initialState.chess.stats.normal.losses,
        },
        hard: {
          wins:
            persistedChess?.stats?.hard?.wins ??
            initialState.chess.stats.hard.wins,
          losses:
            persistedChess?.stats?.hard?.losses ??
            initialState.chess.stats.hard.losses,
        },
      };
      const unlocked: ChessUnlockState = {
        normal:
          Boolean(persistedChess?.unlocked?.normal) || stats.easy.wins >= 3,
        hard:
          Boolean(persistedChess?.unlocked?.hard) || stats.normal.wins >= 10,
      };

      // Maia Chess hydration
      const persistedMaiaChess = persisted.maiaChess;
      const maiaStats: Record<MaiaChessDifficulty, ChessRecord> = {
        apprentice: {
          wins:
            persistedMaiaChess?.stats?.apprentice?.wins ??
            initialState.maiaChess.stats.apprentice.wins,
          losses:
            persistedMaiaChess?.stats?.apprentice?.losses ??
            initialState.maiaChess.stats.apprentice.losses,
        },
        adept: {
          wins:
            persistedMaiaChess?.stats?.adept?.wins ??
            initialState.maiaChess.stats.adept.wins,
          losses:
            persistedMaiaChess?.stats?.adept?.losses ??
            initialState.maiaChess.stats.adept.losses,
        },
        master: {
          wins:
            persistedMaiaChess?.stats?.master?.wins ??
            initialState.maiaChess.stats.master.wins,
          losses:
            persistedMaiaChess?.stats?.master?.losses ??
            initialState.maiaChess.stats.master.losses,
        },
      };
      const maiaUnlocked: MaiaChessUnlockState = {
        apprentice: Boolean(persistedMaiaChess?.unlocked?.apprentice),
        adept: Boolean(persistedMaiaChess?.unlocked?.adept),
        master: Boolean(persistedMaiaChess?.unlocked?.master),
      };

      const inventory: InventoryItem[] = Array.isArray(persisted.inventory)
        ? persisted.inventory
            .map(item => {
              if (!item || typeof item !== 'object') {
                return null;
              }

              const catalogItem = getInventoryItemById((item as InventoryItem).id);
              if (!catalogItem) {
                return null;
              }

              return {
                ...catalogItem,
                obtainedAt:
                  typeof (item as InventoryItem).obtainedAt === 'number'
                    ? (item as InventoryItem).obtainedAt
                    : Date.now(),
              } satisfies InventoryItem;
            })
            .filter(Boolean) as InventoryItem[]
        : [];

      const persistedSudoku = persisted.sudoku;
      const sudoku: SudokuProgress = persistedSudoku ? {
        unlockedDifficulties: Array.isArray(persistedSudoku.unlockedDifficulties) 
          ? persistedSudoku.unlockedDifficulties 
          : [],
        totalGames: persistedSudoku.totalGames ?? 0,
        totalWins: persistedSudoku.totalWins ?? 0,
        stats: {
          easy: persistedSudoku.stats?.easy ?? { played: 0, completed: 0, bestTime: null },
          medium: persistedSudoku.stats?.medium ?? { played: 0, completed: 0, bestTime: null },
          expert: persistedSudoku.stats?.expert ?? { played: 0, completed: 0, bestTime: null },
        },
      } : createInitialSudokuState();

      return {
        ...state,
        ...persisted,
        focusSessions,
        chess: {
          stats,
          unlocked,
          totalGames:
            persistedChess?.totalGames ?? initialState.chess.totalGames,
        },
        maiaChess: {
          stats: maiaStats,
          unlocked: maiaUnlocked,
          totalGames:
            persistedMaiaChess?.totalGames ?? initialState.maiaChess.totalGames,
        },
        sudoku,
        inventory,
      };
    }
    case 'UNLOCK_ACHIEVEMENT': {
      const { achievementId } = action.payload;
      if (state.achievements.some(a => a.id === achievementId)) {
        return state;
      }
      const newAchievement: UserAchievement = {
        id: achievementId,
        unlockedAt: Date.now(),
        progress: ACHIEVEMENTS[achievementId].requirement,
      };
      return {
        ...state,
        achievements: [...state.achievements, newAchievement],
      };
    }
    case 'TOGGLE_MUSIC': {
      return {
        ...state,
        musicEnabled: action.payload?.enabled ?? !state.musicEnabled,
      };
    }
    case 'TOGGLE_SOUND_EFFECTS': {
      return {
        ...state,
        soundEffectsEnabled: action.payload?.enabled ?? !state.soundEffectsEnabled,
      };
    }
    default:
      return state;
  }
}

export type GameContextValue = {
  state: GameState;
  isHydrated: boolean;
  setProfileName: (name: string) => void;
  completeSession: (durationMinutes: number) => void;
  addFlashcard: (input: {
    title: string;
    description: string;
    imageBase64?: string;
    mood?: JournalMood;
  }) => void;
  deleteFlashcard: (id: string) => void;
  updateFlashcard: (
    id: string,
    updates: Partial<Omit<Flashcard, 'id' | 'createdAt'>>,
  ) => void;
  toggleFlashcardFavorite: (id: string) => void;
  recordArcadeScore: (game: 'lanes' | 'reaction', score: number) => void;
  spendCoins: (amount: number) => void;
  unlockSkin: (skinId: string, price: number) => boolean;
  setActiveSkin: (skinId: string) => void;
  finishChessMatch: (match: ChessMatchRequest) => ChessMatchResolution;
  finishMaiaChessMatch: (match: MaiaChessMatchRequest) => MaiaChessMatchResolution;
  unlockMaiaDifficulty: (difficulty: MaiaChessDifficulty, cost: number) => boolean;
  completeSudokuGame: (difficulty: SudokuDifficulty, completed: boolean, coinsEarned: number) => void;
  unlockSudokuDifficulty: (difficulty: SudokuDifficulty, cost: number) => boolean;
  checkAndUnlockAchievements: () => AchievementId[];
  toggleMusic: (enabled?: boolean) => void;
  toggleSoundEffects: (enabled?: boolean) => void;
};

const GameContext = createContext<GameContextValue | undefined>(undefined);

export const GameProvider: React.FC<React.PropsWithChildren> = ({ children }) => {
  const [state, dispatch] = useReducer(reducer, initialState);
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    const loadState = async () => {
      try {
        const saved = await AsyncStorage.getItem(STORAGE_KEY);
        if (saved) {
          const parsed = JSON.parse(saved) as Partial<GameState>;
          const baseline: GameState = {
            ...initialState,
            chess: createInitialChessState(),
            inventory: [],
          };
          dispatch({ type: 'HYDRATE', payload: { ...baseline, ...parsed } });
        }
      } catch (error) {
        console.warn('Failed to load saved state', error);
      } finally {
        setIsHydrated(true);
      }
    };

    loadState();
  }, []);

  useEffect(() => {
    if (!isHydrated) {
      return;
    }

    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(state)).catch(error =>
      console.warn('Failed to persist state', error),
    );
  }, [state, isHydrated]);

  // Check achievements when relevant state changes (after hydration)
  useEffect(() => {
    if (!isHydrated) {
      return;
    }

    // Auto-check achievements whenever state changes that might unlock them
    const checkAchievements = () => {
      const now = Date.now();

      Object.values(ACHIEVEMENTS).forEach(achievement => {
        if (state.achievements.some(a => a.id === achievement.id)) {
          return; // Already unlocked
        }

        let shouldUnlock = false;

        switch (achievement.id) {
          case 'first-session':
            shouldUnlock = state.focusSessions.length >= 1;
            break;
          case 'night-owl':
            shouldUnlock = state.focusSessions.filter(s => new Date(s.completedAt).getHours() >= 22).length >= 10;
            break;
          case 'early-bird':
            shouldUnlock = state.focusSessions.filter(s => new Date(s.completedAt).getHours() < 8).length >= 10;
            break;
          case 'marathon-runner':
            shouldUnlock = state.bestSessionMinutes >= 90;
            break;
          case 'chess-beginner':
            shouldUnlock = (state.chess.stats.easy.wins + state.chess.stats.normal.wins + state.chess.stats.hard.wins) >= 5;
            break;
          case 'chess-master':
            shouldUnlock = state.chess.stats.hard.wins >= 10;
            break;
          case 'chess-legend':
            shouldUnlock = (state.chess.stats.easy.wins + state.chess.stats.normal.wins + state.chess.stats.hard.wins) >= 50;
            break;
          case 'maia-apprentice':
            shouldUnlock = state.maiaChess.stats.apprentice.wins >= 1;
            break;
          case 'maia-challenger':
            shouldUnlock = (state.maiaChess.stats.apprentice.wins + state.maiaChess.stats.adept.wins + state.maiaChess.stats.master.wins) >= 5;
            break;
          case 'maia-champion':
            shouldUnlock = state.maiaChess.stats.master.wins >= 1;
            break;
          case 'ai-slayer':
            shouldUnlock = (state.maiaChess.stats.apprentice.wins + state.maiaChess.stats.adept.wins + state.maiaChess.stats.master.wins) >= 20;
            break;
          case 'sudoku-starter':
            shouldUnlock = state.sudoku.stats.easy.completed >= 5;
            break;
          case 'sudoku-novice':
            shouldUnlock = state.sudoku.totalWins >= 1;
            break;
          case 'sudoku-expert':
            shouldUnlock = state.sudoku.totalWins >= 10;
            break;
          case 'sudoku-speed-demon':
            shouldUnlock = 
              (state.sudoku.stats.medium.bestTime !== null && state.sudoku.stats.medium.bestTime <= 300) ||
              (state.sudoku.stats.expert.bestTime !== null && state.sudoku.stats.expert.bestTime <= 300);
            break;
          case 'puzzle-master':
            shouldUnlock = state.sudoku.totalWins >= 25;
            break;
          case 'journaler':
            shouldUnlock = state.flashcards.length >= 30;
            break;
          case 'mood-explorer':
            shouldUnlock = new Set(state.flashcards.filter(f => f.mood).map(f => f.mood)).size >= 5;
            break;
          case 'streak-keeper':
            shouldUnlock = state.streak >= 7;
            break;
          case 'coin-collector':
            shouldUnlock = state.totalCoinsEarned >= 1000;
            break;
          case 'lane-apprentice':
            shouldUnlock = state.arcadeHighScores.lanes >= 100;
            break;
          case 'lane-expert':
            shouldUnlock = state.arcadeHighScores.lanes >= 200;
            break;
          case 'lane-master':
            shouldUnlock = state.arcadeHighScores.lanes >= 400;
            break;
          case 'reaction-novice':
            shouldUnlock = state.arcadeHighScores.reaction >= 360;
            break;
          case 'reaction-expert':
            shouldUnlock = state.arcadeHighScores.reaction >= 600;
            break;
          case 'reaction-legend':
            shouldUnlock = state.arcadeHighScores.reaction >= 900;
            break;
          case 'arcade-champion':
            shouldUnlock = state.arcadeHighScores.lanes >= 400 && state.arcadeHighScores.reaction >= 900;
            break;
        }

        if (shouldUnlock) {
          dispatch({ type: 'UNLOCK_ACHIEVEMENT', payload: { achievementId: achievement.id } });
        }
      });
    };

    // Debounce the check to avoid multiple rapid checks
    const timeoutId = setTimeout(checkAchievements, 500);
    return () => clearTimeout(timeoutId);
  }, [
    isHydrated,
    state.focusSessions.length,
    state.bestSessionMinutes,
    state.chess.stats.easy.wins,
    state.chess.stats.normal.wins,
    state.chess.stats.hard.wins,
    state.maiaChess.stats.apprentice.wins,
    state.maiaChess.stats.adept.wins,
    state.maiaChess.stats.master.wins,
    state.sudoku.totalWins,
    state.sudoku.stats.medium.bestTime,
    state.sudoku.stats.expert.bestTime,
    state.arcadeHighScores.lanes,
    state.arcadeHighScores.reaction,
    state.flashcards.length,
    state.streak,
    state.totalCoinsEarned,
    state.achievements.length,
  ]);

  const value = useMemo<GameContextValue>(() => {
    const unlockSkin = (skinId: string, price: number) => {
      if (state.ownedSkins.includes(skinId)) {
        dispatch({ type: 'SET_ACTIVE_SKIN', payload: { skinId } });
        return true;
      }

      if (state.coins < price) {
        return false;
      }

      dispatch({ type: 'SPEND_COINS', payload: { amount: price } });
      dispatch({ type: 'UNLOCK_SKIN', payload: { skinId } });
      dispatch({ type: 'SET_ACTIVE_SKIN', payload: { skinId } });
      return true;
    };

  const finishChessMatch = ({ difficulty, outcome }: ChessMatchRequest): ChessMatchResolution => {
      const normalizedOutcome: ChessOutcome = outcome === 'win' ? 'win' : 'loss';
      const coinsEarned =
        normalizedOutcome === 'win' ? CHESS_REWARD_COINS[difficulty] : 0;

      const nextStats: Record<ChessDifficulty, ChessRecord> = {
        easy: { ...state.chess.stats.easy },
        normal: { ...state.chess.stats.normal },
        hard: { ...state.chess.stats.hard },
      };

      if (normalizedOutcome === 'win') {
        nextStats[difficulty] = {
          ...nextStats[difficulty],
          wins: nextStats[difficulty].wins + 1,
        };
      } else {
        nextStats[difficulty] = {
          ...nextStats[difficulty],
          losses: nextStats[difficulty].losses + 1,
        };
      }

      const rewardEligible =
        normalizedOutcome === 'win' && (difficulty === 'normal' || difficulty === 'hard');
      const catalogReward: InventoryCatalogItem | null = rewardEligible
        ? pickRandomInventoryItem()
        : null;

      const alreadyOwned = catalogReward
        ? state.inventory.some(item => item.id === catalogReward.id)
        : false;
      const rewardItem: InventoryItem | null =
        catalogReward && !alreadyOwned
          ? { ...catalogReward, obtainedAt: Date.now() }
          : null;

      const nextUnlocked: ChessUnlockState = {
        normal:
          state.chess.unlocked.normal || nextStats.easy.wins >= 3,
        hard: state.chess.unlocked.hard || nextStats.normal.wins >= 10,
      };

      dispatch({
        type: 'COMPLETE_CHESS_GAME',
        payload: {
          coinsEarned,
          nextStats,
          nextUnlocked,
          rewardItem,
        },
      });

      const newlyUnlocked: ChessUnlockState = {
        normal: !state.chess.unlocked.normal && nextUnlocked.normal,
        hard: !state.chess.unlocked.hard && nextUnlocked.hard,
      };

      return {
        coinsEarned,
        reward: catalogReward,
        isRewardNew: Boolean(rewardItem),
        unlocks: nextUnlocked,
        newlyUnlocked,
      };
    };

    const finishMaiaChessMatch = ({
      difficulty,
      outcome,
    }: MaiaChessMatchRequest): MaiaChessMatchResolution => {
      const normalizedOutcome: ChessOutcome = outcome === 'win' ? 'win' : 'loss';
      const coinsEarned =
        normalizedOutcome === 'win' ? MAIA_CHESS_REWARD_COINS[difficulty] : 0;

      const nextStats: Record<MaiaChessDifficulty, ChessRecord> = {
        apprentice: { ...state.maiaChess.stats.apprentice },
        adept: { ...state.maiaChess.stats.adept },
        master: { ...state.maiaChess.stats.master },
      };

      if (normalizedOutcome === 'win') {
        nextStats[difficulty] = {
          ...nextStats[difficulty],
          wins: nextStats[difficulty].wins + 1,
        };
      } else {
        nextStats[difficulty] = {
          ...nextStats[difficulty],
          losses: nextStats[difficulty].losses + 1,
        };
      }

      const rewardEligible =
        normalizedOutcome === 'win' && (difficulty === 'adept' || difficulty === 'master');
      const catalogReward: InventoryCatalogItem | null = rewardEligible
        ? pickRandomInventoryItem()
        : null;

      const alreadyOwned = catalogReward
        ? state.inventory.some(item => item.id === catalogReward.id)
        : false;
      const rewardItem: InventoryItem | null =
        catalogReward && !alreadyOwned
          ? { ...catalogReward, obtainedAt: Date.now() }
          : null;

      dispatch({
        type: 'COMPLETE_MAIA_CHESS_GAME',
        payload: {
          coinsEarned,
          nextStats,
          rewardItem,
        },
      });

      return {
        coinsEarned,
        reward: catalogReward,
        isRewardNew: Boolean(rewardItem),
      };
    };

    const unlockMaiaDifficulty = (difficulty: MaiaChessDifficulty, cost: number): boolean => {
      if (state.maiaChess.unlocked[difficulty]) {
        return true; // Already unlocked
      }

      if (state.coins < cost) {
        return false; // Not enough coins
      }

      dispatch({ type: 'SPEND_COINS', payload: { amount: cost } });
      dispatch({ type: 'UNLOCK_MAIA_DIFFICULTY', payload: { difficulty } });
      return true;
    };

    const completeSudokuGame = (difficulty: SudokuDifficulty, completed: boolean, coinsEarned: number) => {
      dispatch({ 
        type: 'COMPLETE_SUDOKU_GAME', 
        payload: { difficulty, completed, coinsEarned } 
      });
    };

    const unlockSudokuDifficulty = (difficulty: SudokuDifficulty, cost: number): boolean => {
      if (state.sudoku.unlockedDifficulties.includes(difficulty)) {
        return true; // Already unlocked
      }

      if (state.coins < cost) {
        return false; // Not enough coins
      }

      dispatch({ type: 'UNLOCK_SUDOKU_DIFFICULTY', payload: { difficulty, cost } });
      return true;
    };

    // Returns list of currently unlocked achievement IDs
    // Note: Auto-checking happens via useEffect, this is for manual triggers
    const checkAndUnlockAchievements = (): AchievementId[] => {
      return state.achievements.map(a => a.id);
    };

    return {
      state,
      isHydrated,
      setProfileName: name => dispatch({ type: 'SET_PROFILE_NAME', payload: name }),
      completeSession: durationMinutes =>
        dispatch({ type: 'COMPLETE_SESSION', payload: { durationMinutes } }),
      addFlashcard: input => dispatch({ type: 'ADD_FLASHCARD', payload: input }),
      deleteFlashcard: id => dispatch({ type: 'DELETE_FLASHCARD', payload: { id } }),
      updateFlashcard: (id, updates) =>
        dispatch({ type: 'UPDATE_FLASHCARD', payload: { id, updates } }),
      toggleFlashcardFavorite: id =>
        dispatch({ type: 'TOGGLE_FLASHCARD_FAVORITE', payload: { id } }),
      recordArcadeScore: (game, score) =>
        dispatch({ type: 'RECORD_ARCADE_SCORE', payload: { game, score } }),
      spendCoins: amount => dispatch({ type: 'SPEND_COINS', payload: { amount } }),
      unlockSkin,
      setActiveSkin: skinId =>
        dispatch({ type: 'SET_ACTIVE_SKIN', payload: { skinId } }),
      finishChessMatch,
      finishMaiaChessMatch,
      unlockMaiaDifficulty,
      completeSudokuGame,
      unlockSudokuDifficulty,
      checkAndUnlockAchievements,
      toggleMusic: (enabled?: boolean) =>
        dispatch({ type: 'TOGGLE_MUSIC', payload: enabled !== undefined ? { enabled } : undefined }),
      toggleSoundEffects: (enabled?: boolean) =>
        dispatch({ type: 'TOGGLE_SOUND_EFFECTS', payload: enabled !== undefined ? { enabled } : undefined }),
    };
  }, [state, isHydrated]);

  return <GameContext.Provider value={value}>{children}</GameContext.Provider>;
};

export function useGame() {
  const context = useContext(GameContext);
  if (!context) {
    throw new Error('useGame must be used within a GameProvider');
  }
  return context;
}
