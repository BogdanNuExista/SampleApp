import AsyncStorage from '@react-native-async-storage/async-storage';
import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useState,
} from 'react';

export type FocusSession = {
  id: string;
  durationMinutes: number;
  completedAt: number;
  coinsEarned: number;
  streakAchieved: number;
};

export type Flashcard = {
  id: string;
  title: string;
  description: string;
  imageBase64?: string;
  createdAt: number;
  lastReviewedAt?: number;
  favorite?: boolean;
};

export type GameState = {
  profileName: string;
  coins: number;
  streak: number;
  bestSessionMinutes: number;
  totalFocusMinutes: number;
  lastSessionDateISO?: string;
  focusSessions: FocusSession[];
  flashcards: Flashcard[];
  arcadeHighScore: number;
  ownedSkins: string[];
  activeSkin: string;
};

const STORAGE_KEY = 'retro-arcade-study-state-v1';

const initialState: GameState = {
  profileName: 'Player One',
  coins: 0,
  streak: 0,
  bestSessionMinutes: 0,
  totalFocusMinutes: 0,
  lastSessionDateISO: undefined,
  focusSessions: [],
  flashcards: [],
  arcadeHighScore: 0,
  ownedSkins: ['neon'],
  activeSkin: 'neon',
};

type Action =
  | { type: 'SET_PROFILE_NAME'; payload: string }
  | { type: 'COMPLETE_SESSION'; payload: { durationMinutes: number } }
  | {
      type: 'ADD_FLASHCARD';
      payload: { title: string; description: string; imageBase64?: string };
    }
  | {
      type: 'UPDATE_FLASHCARD';
      payload: { id: string; updates: Partial<Omit<Flashcard, 'id' | 'createdAt'>> };
    }
  | { type: 'TOGGLE_FLASHCARD_FAVORITE'; payload: { id: string } }
  | { type: 'RECORD_ARCADE_SCORE'; payload: { score: number } }
  | { type: 'SPEND_COINS'; payload: { amount: number } }
  | {
      type: 'UNLOCK_SKIN';
      payload: { skinId: string };
    }
  | {
      type: 'SET_ACTIVE_SKIN';
      payload: { skinId: string };
    }
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
      const baseReward = Math.max(10, Math.round(durationMinutes * 5));
      const streakBonus = newStreak * 2;
      const coinsEarned = baseReward + streakBonus;
      const focusSession: FocusSession = {
        id: generateId(),
        durationMinutes,
        completedAt,
        coinsEarned,
        streakAchieved: newStreak,
      };
      const focusSessions = [focusSession, ...state.focusSessions].slice(0, 50);

      return {
        ...state,
        coins: state.coins + coinsEarned,
        streak: newStreak,
        bestSessionMinutes: Math.max(state.bestSessionMinutes, durationMinutes),
        totalFocusMinutes: state.totalFocusMinutes + durationMinutes,
        lastSessionDateISO: dayKey,
        focusSessions,
      };
    }
    case 'ADD_FLASHCARD': {
      const { title, description, imageBase64 } = action.payload;
      const flashcard: Flashcard = {
        id: generateId(),
        title,
        description,
        imageBase64,
        createdAt: Date.now(),
        favorite: false,
      };
      return { ...state, flashcards: [flashcard, ...state.flashcards] };
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
      const { score } = action.payload;
      const isNewHighScore = score > state.arcadeHighScore;
      const bonusCoins = Math.max(5, Math.floor(score / 5));
      return {
        ...state,
        arcadeHighScore: isNewHighScore ? score : state.arcadeHighScore,
        coins: state.coins + bonusCoins,
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
    case 'HYDRATE':
      return { ...state, ...action.payload };
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
  }) => void;
  updateFlashcard: (
    id: string,
    updates: Partial<Omit<Flashcard, 'id' | 'createdAt'>>,
  ) => void;
  toggleFlashcardFavorite: (id: string) => void;
  recordArcadeScore: (score: number) => void;
  spendCoins: (amount: number) => void;
  unlockSkin: (skinId: string, price: number) => boolean;
  setActiveSkin: (skinId: string) => void;
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
          const parsed: GameState = JSON.parse(saved);
          dispatch({ type: 'HYDRATE', payload: { ...initialState, ...parsed } });
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

    return {
      state,
      isHydrated,
      setProfileName: name => dispatch({ type: 'SET_PROFILE_NAME', payload: name }),
      completeSession: durationMinutes =>
        dispatch({ type: 'COMPLETE_SESSION', payload: { durationMinutes } }),
      addFlashcard: input => dispatch({ type: 'ADD_FLASHCARD', payload: input }),
      updateFlashcard: (id, updates) =>
        dispatch({ type: 'UPDATE_FLASHCARD', payload: { id, updates } }),
      toggleFlashcardFavorite: id =>
        dispatch({ type: 'TOGGLE_FLASHCARD_FAVORITE', payload: { id } }),
      recordArcadeScore: score =>
        dispatch({ type: 'RECORD_ARCADE_SCORE', payload: { score } }),
      spendCoins: amount => dispatch({ type: 'SPEND_COINS', payload: { amount } }),
      unlockSkin,
      setActiveSkin: skinId =>
        dispatch({ type: 'SET_ACTIVE_SKIN', payload: { skinId } }),
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
