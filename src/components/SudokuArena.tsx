import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Modal,
  Dimensions,
  Alert,
  Pressable,
} from 'react-native';
import { useGame } from '../context/GameContext';
import { palette } from '../theme/colors';
import { SudokuDifficulty } from '../context/GameContext';
import { EASY_PUZZLES, MEDIUM_PUZZLES, EXPERT_PUZZLES } from '../constants/sudokuPuzzles';

interface SudokuPuzzle {
  puzzle: string;
  solution: string;
}

const { width } = Dimensions.get('window');
const cellSize = (width - 80) / 9;

export const SudokuArena: React.FC = () => {
  const { state, completeSudokuGame, unlockSudokuDifficulty } = useGame();
  const [selectedDifficulty, setSelectedDifficulty] = useState<SudokuDifficulty | null>(null);
  const [currentPuzzle, setCurrentPuzzle] = useState<SudokuPuzzle | null>(null);
  const [board, setBoard] = useState<(number | null)[][]>([]);
  const [initialBoard, setInitialBoard] = useState<(number | null)[][]>([]);
  const [selectedCell, setSelectedCell] = useState<{ row: number; col: number } | null>(null);
  const [mistakes, setMistakes] = useState(0);
  const [showUnlockModal, setShowUnlockModal] = useState(false);
  const [difficultyToUnlock, setDifficultyToUnlock] = useState<SudokuDifficulty | null>(null);
  const [highlightedNumber, setHighlightedNumber] = useState<number | null>(null);
  const [wrongCells, setWrongCells] = useState<Set<string>>(new Set());

  const difficulties: Array<{
    id: SudokuDifficulty;
    name: string;
    cost: number;
    reward: number;
    description: string;
  }> = [
    {
      id: 'easy',
      name: 'Easy',
      cost: 0, // Free to play
      reward: 10,
      description: 'Beginner puzzles',
    },
    {
      id: 'medium',
      name: 'Medium',
      cost: 0, // Free to play
      reward: 20,
      description: 'Intermediate puzzles',
    },
    {
      id: 'expert',
      name: 'Expert',
      cost: 7,
      reward: 40,
      description: 'Expert-level challenges',
    },
  ];

  const sudokuProgress = state.sudoku;

  // Use pre-loaded puzzle data
  const puzzles = useMemo(() => ({
    easy: EASY_PUZZLES.map(puzzle => ({ puzzle, solution: '' })),
    medium: MEDIUM_PUZZLES.map(puzzle => ({ puzzle, solution: '' })),
    expert: EXPERT_PUZZLES.map(puzzle => ({ puzzle, solution: '' })),
  }), []);

  // Convert puzzle string to 2D array
  const parsePuzzleString = (puzzleStr: string): (number | null)[][] => {
    const grid: (number | null)[][] = [];
    for (let i = 0; i < 9; i++) {
      const row: (number | null)[] = [];
      for (let j = 0; j < 9; j++) {
        const char = puzzleStr[i * 9 + j];
        row.push(char === '.' ? null : parseInt(char, 10));
      }
      grid.push(row);
    }
    return grid;
  };

  // Solve sudoku puzzle (backtracking algorithm)
  const solveSudoku = (grid: (number | null)[][]): boolean => {
    const findEmpty = (): [number, number] | null => {
      for (let row = 0; row < 9; row++) {
        for (let col = 0; col < 9; col++) {
          if (grid[row][col] === null) return [row, col];
        }
      }
      return null;
    };

    const isValid = (num: number, row: number, col: number): boolean => {
      // Check row
      for (let x = 0; x < 9; x++) {
        if (grid[row][x] === num) return false;
      }
      // Check column
      for (let x = 0; x < 9; x++) {
        if (grid[x][col] === num) return false;
      }
      // Check 3x3 box
      const startRow = Math.floor(row / 3) * 3;
      const startCol = Math.floor(col / 3) * 3;
      for (let i = 0; i < 3; i++) {
        for (let j = 0; j < 3; j++) {
          if (grid[startRow + i][startCol + j] === num) return false;
        }
      }
      return true;
    };

    const empty = findEmpty();
    if (!empty) return true; // Solved

    const [row, col] = empty;
    for (let num = 1; num <= 9; num++) {
      if (isValid(num, row, col)) {
        grid[row][col] = num;
        if (solveSudoku(grid)) return true;
        grid[row][col] = null;
      }
    }
    return false;
  };

  const startGame = (difficulty: SudokuDifficulty) => {
    const availablePuzzles = puzzles[difficulty];
    if (availablePuzzles.length === 0) return;

    const randomPuzzle = availablePuzzles[Math.floor(Math.random() * availablePuzzles.length)];
    setCurrentPuzzle(randomPuzzle);

    const initialGrid = parsePuzzleString(randomPuzzle.puzzle);
    setInitialBoard(initialGrid.map(row => [...row]));
    setBoard(initialGrid.map(row => [...row]));
    setSelectedDifficulty(difficulty);
    setSelectedCell(null);
    setMistakes(0);
    setWrongCells(new Set());
  };

  const handleCellPress = (row: number, col: number) => {
    // Can only select empty cells, but can click any cell to highlight that number
    if (initialBoard[row][col] === null) {
      setSelectedCell({ row, col });
      const cellValue = board[row][col];
      setHighlightedNumber(cellValue);
    } else {
      // If clicking an initial cell, just highlight that number
      const cellValue = board[row][col];
      setHighlightedNumber(cellValue);
      setSelectedCell(null);
    }
  };

  const handleNumberPress = (num: number) => {
    if (!selectedCell || !currentPuzzle) return;

    const { row, col } = selectedCell;
    if (initialBoard[row][col] !== null) return; // Can't change initial cells

    // Create solution grid to check
    const solutionGrid = parsePuzzleString(currentPuzzle.puzzle);
    solveSudoku(solutionGrid);
    const correctNumber = solutionGrid[row][col];

    const newBoard = board.map(r => [...r]);
    newBoard[row][col] = num;
    setBoard(newBoard);

    const cellKey = `${row}-${col}`;
    
    // Check if correct
    if (num !== correctNumber) {
      // Mark cell as wrong
      setWrongCells(prev => new Set(prev).add(cellKey));
      setMistakes(prev => prev + 1);
      if (mistakes + 1 >= 3) {
        Alert.alert('Game Over', 'Too many mistakes! Try again.', [
          { text: 'OK', onPress: () => setSelectedDifficulty(null) },
        ]);
      }
    } else {
      // Remove from wrong cells if correct
      setWrongCells(prev => {
        const newSet = new Set(prev);
        newSet.delete(cellKey);
        return newSet;
      });
    }

    // Check if puzzle is complete
    if (newBoard.every(row => row.every(cell => cell !== null))) {
      checkCompletion(newBoard, solutionGrid);
    }
  };

  const handleClear = () => {
    if (!selectedCell) return;
    const { row, col } = selectedCell;
    if (initialBoard[row][col] !== null) return;

    const newBoard = board.map(r => [...r]);
    newBoard[row][col] = null;
    setBoard(newBoard);
    
    // Remove from wrong cells
    const cellKey = `${row}-${col}`;
    setWrongCells(prev => {
      const newSet = new Set(prev);
      newSet.delete(cellKey);
      return newSet;
    });
  };

  const checkCompletion = (currentBoard: (number | null)[][], solution: (number | null)[][]) => {
    const isCorrect = currentBoard.every((row, i) =>
      row.every((cell, j) => cell === solution[i][j])
    );

    if (isCorrect) {
      const difficulty = selectedDifficulty!;
      const reward = difficulties.find(d => d.id === difficulty)?.reward || 20;

      completeSudokuGame(difficulty, true, reward);

      Alert.alert(
        '🎉 Puzzle Complete!',
        `Well done! You earned ${reward} coins!`,
        [{ text: 'Play Again', onPress: () => startGame(difficulty) }]
      );
    }
  };

  const handleUnlock = (difficulty: SudokuDifficulty) => {
    const difficultyInfo = difficulties.find(d => d.id === difficulty);
    if (!difficultyInfo) return;

    setDifficultyToUnlock(difficulty);
    setShowUnlockModal(true);
  };

  const confirmUnlock = () => {
    if (!difficultyToUnlock) return;

    const difficultyInfo = difficulties.find(d => d.id === difficultyToUnlock);
    if (!difficultyInfo) return;

    if (state.coins >= difficultyInfo.cost) {
      const success = unlockSudokuDifficulty(difficultyToUnlock, difficultyInfo.cost);
      if (success) {
        setShowUnlockModal(false);
        setDifficultyToUnlock(null);
      }
    } else {
      Alert.alert('Not Enough Coins', `You need ${difficultyInfo.cost} coins to unlock this difficulty.`);
    }
  };

  // Difficulty Selection Screen
  if (!selectedDifficulty) {
    return (
      <View style={styles.container}>
        <View style={styles.panelHeader}>
          <Text style={styles.title}>🧩 Sudoku Challenge</Text>
          <Text style={styles.subtitle}>Test your logic skills with number puzzles</Text>
        </View>

        <View style={styles.difficultiesContainer}>
          {difficulties.map(difficulty => {
            const isUnlocked = sudokuProgress.unlockedDifficulties.includes(difficulty.id);
            const stats = sudokuProgress.stats[difficulty.id];

            return (
              <TouchableOpacity
                key={difficulty.id}
                style={[
                  styles.difficultyChip,
                  !isUnlocked && styles.difficultyChipLocked
                ]}
                onPress={() => (isUnlocked ? startGame(difficulty.id) : handleUnlock(difficulty.id))}
              >
                <View style={styles.difficultyHeader}>
                  <Text style={styles.difficultyName}>{difficulty.name}</Text>
                  {!isUnlocked && <Text style={styles.lockIcon}>🔒</Text>}
                </View>
                <Text style={styles.difficultyDescription}>{difficulty.description}</Text>

                {isUnlocked ? (
                  <>
                    <View style={styles.statsRow}>
                      <Text style={styles.statLabel}>Played: {stats.played}</Text>
                      <Text style={styles.statLabel}>Completed: {stats.completed}</Text>
                    </View>
                    <View style={styles.rewardBadge}>
                      <Text style={styles.rewardText}>🪙 {difficulty.reward} coins</Text>
                    </View>
                  </>
                ) : (
                  <View style={styles.unlockBadge}>
                    <Text style={styles.unlockText}>
                      {difficulty.cost > 0 ? `🔒 ${difficulty.cost} coins` : 'Free to play'}
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </View>

        <View style={styles.statsPanel}>
          <Text style={styles.statsPanelTitle}>Career Stats</Text>
          <View style={styles.statsPanelRow}>
            <Text style={styles.statsPanelLabel}>Total Games</Text>
            <Text style={styles.statsPanelValue}>{sudokuProgress.totalGames}</Text>
          </View>
          <View style={styles.statsPanelRow}>
            <Text style={styles.statsPanelLabel}>Completed</Text>
            <Text style={styles.statsPanelValue}>{sudokuProgress.totalWins}</Text>
          </View>
        </View>

        {/* Unlock Modal */}
        <Modal visible={showUnlockModal} transparent animationType="fade">
          <Pressable style={styles.modalBackdrop} onPress={() => setShowUnlockModal(false)}>
            <Pressable style={styles.modalCard} onPress={(e) => e.stopPropagation()}>
              <Text style={styles.modalTitle}>Unlock Difficulty</Text>
              {difficultyToUnlock && (() => {
                const diff = difficulties.find(d => d.id === difficultyToUnlock);
                if (!diff) return null;
                const canAfford = state.coins >= diff.cost;
                return (
                  <>
                    <Text style={styles.modalSubtitle}>{diff.name}</Text>
                    <Text style={styles.unlockDescription}>{diff.description}</Text>
                    <View style={styles.costRow}>
                      <Text style={styles.costLabel}>Cost</Text>
                      <Text style={styles.costValue}>{diff.cost} 💰</Text>
                    </View>
                    <View style={styles.costRow}>
                      <Text style={styles.costLabel}>Your Coins</Text>
                      <Text style={[styles.costValue, !canAfford && styles.costInsufficient]}>
                        {state.coins} 💰
                      </Text>
                    </View>
                    {canAfford ? (
                      <Pressable style={styles.modalButton} onPress={confirmUnlock}>
                        <Text style={styles.modalButtonText}>Unlock Now</Text>
                      </Pressable>
                    ) : (
                      <Text style={styles.insufficientText}>Not enough coins!</Text>
                    )}
                    <Pressable style={styles.modalCancelButton} onPress={() => setShowUnlockModal(false)}>
                      <Text style={styles.modalCancelText}>Cancel</Text>
                    </Pressable>
                  </>
                );
              })()}
            </Pressable>
          </Pressable>
        </Modal>
      </View>
    );
  }

  // Game Screen
  return (
    <View style={styles.container}>
      <View style={styles.gameHeader}>
        <TouchableOpacity onPress={() => setSelectedDifficulty(null)} style={styles.backButton}>
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.gameTitle}>{selectedDifficulty.toUpperCase()}</Text>
        <Text style={styles.mistakesText}>Mistakes: {mistakes}/3</Text>
      </View>

      <View style={styles.boardContainer}>
        {board.map((row, rowIndex) => (
          <View key={rowIndex} style={styles.row}>
            {row.map((cell, colIndex) => {
              const isInitial = initialBoard[rowIndex][colIndex] !== null;
              const isSelected = selectedCell?.row === rowIndex && selectedCell?.col === colIndex;
              const isHighlighted = cell !== null && cell === highlightedNumber;
              const cellKey = `${rowIndex}-${colIndex}`;
              const isWrong = wrongCells.has(cellKey);
              const isInThickBorder =
                (rowIndex + 1) % 3 === 0 && rowIndex !== 8
                  ? 'bottom'
                  : (colIndex + 1) % 3 === 0 && colIndex !== 8
                  ? 'right'
                  : null;

              return (
                <TouchableOpacity
                  key={`${rowIndex}-${colIndex}`}
                  style={[
                    styles.cell,
                    isSelected && styles.selectedCell,
                    isInitial && styles.initialCell,
                    isHighlighted && styles.highlightedCell,
                    isWrong && styles.wrongCell,
                    isInThickBorder === 'bottom' && styles.thickBorderBottom,
                    isInThickBorder === 'right' && styles.thickBorderRight,
                  ]}
                  onPress={() => handleCellPress(rowIndex, colIndex)}
                >
                  <Text style={[
                    styles.cellText,
                    isInitial && styles.initialCellText,
                    isHighlighted && styles.highlightedCellText,
                    isWrong && styles.wrongCellText
                  ]}>
                    {cell || ''}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        ))}
      </View>

      <View style={styles.controlsContainer}>
        <View style={styles.numbersContainer}>
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
            <TouchableOpacity
              key={num}
              style={[
                styles.numberButton,
                highlightedNumber === num && styles.numberButtonHighlighted
              ]}
              onPress={() => handleNumberPress(num)}
            >
              <Text style={[
                styles.numberButtonText,
                highlightedNumber === num && styles.numberButtonTextHighlighted
              ]}>
                {num}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        <TouchableOpacity style={styles.clearButton} onPress={handleClear}>
          <Text style={styles.clearButtonText}>Clear</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: 18,
    padding: 20,
    backgroundColor: '#0f172a',
    borderRadius: 24,
  },
  panelHeader: {
    gap: 6,
    marginBottom: 12,
  },
  title: {
    color: palette.neonYellow,
    fontSize: 22,
    fontWeight: '700',
  },
  subtitle: {
    color: palette.silver,
    fontSize: 13,
    lineHeight: 18,
  },
  difficultiesContainer: {
    gap: 10,
  },
  difficultyChip: {
    borderWidth: 1,
    borderColor: '#1e293b',
    borderRadius: 16,
    padding: 14,
    backgroundColor: '#111b34',
    gap: 8,
  },
  difficultyChipLocked: {
    opacity: 0.65,
    borderColor: '#1e293b',
  },
  difficultyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  lockIcon: {
    fontSize: 18,
    opacity: 0.7,
  },
  difficultyName: {
    fontSize: 18,
    fontWeight: '700',
    color: palette.neonBlue,
  },
  difficultyDescription: {
    fontSize: 13,
    color: palette.silver,
    marginBottom: 4,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 16,
    marginTop: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#94a3b8',
  },
  rewardBadge: {
    marginTop: 8,
    backgroundColor: palette.midnight,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: palette.neonGreen + '80',
  },
  rewardText: {
    color: palette.neonGreen,
    fontWeight: '700',
    fontSize: 13,
  },
  unlockBadge: {
    marginTop: 8,
    backgroundColor: palette.midnight,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: '#fbbf24',
  },
  unlockText: {
    color: '#fbbf24',
    fontWeight: '700',
    fontSize: 13,
  },
  statsPanel: {
    padding: 14,
    backgroundColor: '#101a34',
    borderRadius: 16,
    gap: 8,
    borderWidth: 1,
    borderColor: '#1f2d4d',
  },
  statsPanelTitle: {
    color: palette.neonBlue,
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 4,
  },
  statsPanelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statsPanelLabel: {
    color: '#94a3b8',
    fontSize: 13,
  },
  statsPanelValue: {
    color: palette.softWhite,
    fontSize: 16,
    fontWeight: '700',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalCard: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: '#0f172a',
    borderRadius: 20,
    padding: 20,
    gap: 12,
    borderWidth: 1,
    borderColor: '#1f2d4d',
  },
  modalTitle: {
    color: palette.neonYellow,
    fontSize: 20,
    fontWeight: '700',
  },
  modalSubtitle: {
    color: palette.silver,
  },
  unlockDescription: {
    color: '#94a3b8',
    fontSize: 13,
    lineHeight: 18,
  },
  costRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
  },
  costLabel: {
    color: '#94a3b8',
    fontSize: 14,
  },
  costValue: {
    color: palette.softWhite,
    fontSize: 14,
    fontWeight: '700',
  },
  costInsufficient: {
    color: palette.danger,
  },
  insufficientText: {
    color: palette.danger,
    fontSize: 13,
    textAlign: 'center',
    paddingVertical: 8,
  },
  modalButton: {
    marginTop: 4,
    backgroundColor: palette.neonPink,
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: 'center',
  },
  modalButtonText: {
    color: palette.midnight,
    fontWeight: '700',
  },
  modalCancelButton: {
    marginTop: 4,
    backgroundColor: 'transparent',
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#475569',
  },
  modalCancelText: {
    color: '#94a3b8',
    fontWeight: '600',
  },
  gameHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#1e293b',
  },
  backButton: {
    padding: 6,
  },
  backButtonText: {
    color: palette.neonYellow,
    fontSize: 15,
    fontWeight: '700',
  },
  gameTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: palette.neonBlue,
  },
  mistakesText: {
    fontSize: 16,
    color: palette.neonPink,
    fontWeight: '700',
  },
  boardContainer: {
    alignSelf: 'center',
    backgroundColor: '#111b34',
    padding: 6,
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#1e293b',
  },
  row: {
    flexDirection: 'row',
  },
  cell: {
    width: cellSize,
    height: cellSize,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 0.5,
    borderColor: '#334155',
    backgroundColor: '#0f172a',
  },
  selectedCell: {
    backgroundColor: palette.neonBlue + '25',
    borderWidth: 1.5,
    borderColor: palette.neonBlue,
  },
  initialCell: {
    backgroundColor: '#1a2642',
  },
  thickBorderBottom: {
    borderBottomWidth: 1.5,
    borderBottomColor: '#475569',
  },
  thickBorderRight: {
    borderRightWidth: 1.5,
    borderRightColor: '#475569',
  },
  cellText: {
    fontSize: 20,
    fontWeight: '700',
    color: palette.neonGreen,
  },
  initialCellText: {
    fontWeight: '700',
    color: palette.softWhite,
  },
  highlightedCell: {
    backgroundColor: palette.neonYellow + '20',
    borderWidth: 2,
    borderColor: palette.neonYellow + '60',
  },
  highlightedCellText: {
    color: palette.neonYellow,
    fontWeight: '900',
  },
  wrongCell: {
    backgroundColor: palette.neonPink + '25',
    borderWidth: 2,
    borderColor: palette.neonPink + '80',
  },
  wrongCellText: {
    color: palette.neonPink,
    fontWeight: '900',
    textShadowColor: palette.neonPink + '60',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 6,
  },
  controlsContainer: {
    alignItems: 'center',
    gap: 12,
  },
  numbersContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 8,
  },
  numberButton: {
    width: (width - 100) / 9,
    height: (width - 100) / 9,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#111b34',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#1e293b',
  },
  numberButtonText: {
    fontSize: 20,
    fontWeight: '700',
    color: palette.neonBlue,
  },
  numberButtonHighlighted: {
    backgroundColor: palette.neonYellow + '30',
    borderColor: palette.neonYellow,
    borderWidth: 2,
  },
  numberButtonTextHighlighted: {
    color: palette.neonYellow,
  },
  clearButton: {
    backgroundColor: '#111b34',
    paddingVertical: 10,
    paddingHorizontal: 28,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: palette.neonPink + '60',
  },
  clearButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: palette.neonPink,
  },
});
