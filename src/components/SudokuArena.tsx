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
} from 'react-native';
import { useGame } from '../context/GameContext';
import { palette } from '../theme/colors';
import { SudokuDifficulty } from '../context/GameContext';
import { MEDIUM_PUZZLES, EXPERT_PUZZLES } from '../constants/sudokuPuzzles';

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

  console.log('SudokuArena render - selectedDifficulty:', selectedDifficulty, 'coins:', state.coins);
  console.log('Sudoku progress:', state.sudoku);

  const difficulties: Array<{
    id: SudokuDifficulty;
    name: string;
    cost: number;
    reward: number;
    description: string;
  }> = [
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
  };

  const handleCellPress = (row: number, col: number) => {
    // Can only select empty cells
    if (initialBoard[row][col] === null) {
      setSelectedCell({ row, col });
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

    // Check if correct
    if (num !== correctNumber) {
      setMistakes(prev => prev + 1);
      if (mistakes + 1 >= 3) {
        Alert.alert('Game Over', 'Too many mistakes! Try again.', [
          { text: 'OK', onPress: () => setSelectedDifficulty(null) },
        ]);
      }
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
    console.log('handleUnlock called for:', difficulty);
    const difficultyInfo = difficulties.find(d => d.id === difficulty);
    if (!difficultyInfo) {
      console.log('difficultyInfo not found!');
      return;
    }

    console.log('Setting modal visible, current coins:', state.coins, 'required:', difficultyInfo.cost);
    setDifficultyToUnlock(difficulty);
    setShowUnlockModal(true);
  };

  const confirmUnlock = () => {
    console.log('confirmUnlock called');
    if (!difficultyToUnlock) {
      console.log('No difficulty to unlock!');
      return;
    }

    const difficultyInfo = difficulties.find(d => d.id === difficultyToUnlock);
    if (!difficultyInfo) {
      console.log('difficultyInfo not found in confirm!');
      return;
    }

    console.log('Checking coins:', state.coins, 'vs required:', difficultyInfo.cost);
    if (state.coins >= difficultyInfo.cost) {
      console.log('Attempting to unlock...');
      const success = unlockSudokuDifficulty(difficultyToUnlock, difficultyInfo.cost);
      console.log('Unlock result:', success);
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
        <Text style={styles.title}>🧩 Sudoku Challenge</Text>
        <Text style={styles.subtitle}>Test your logic skills</Text>

        <ScrollView contentContainerStyle={styles.difficultiesContainer}>
          {difficulties.map(difficulty => {
            const isUnlocked = sudokuProgress.unlockedDifficulties.includes(difficulty.id);
            const stats = sudokuProgress.stats[difficulty.id];

            return (
              <TouchableOpacity
                key={difficulty.id}
                style={[styles.difficultyCard, !isUnlocked && styles.lockedCard]}
                onPress={() => {
                  console.log('Difficulty card pressed:', difficulty.id, 'isUnlocked:', isUnlocked);
                  if (isUnlocked) {
                    startGame(difficulty.id);
                  } else {
                    handleUnlock(difficulty.id);
                  }
                }}
              >
                {!isUnlocked && <Text style={styles.lockIcon}>🔒</Text>}
                <Text style={styles.difficultyName}>{difficulty.name}</Text>
                <Text style={styles.difficultyDescription}>{difficulty.description}</Text>

                {isUnlocked ? (
                  <>
                    <View style={styles.statsContainer}>
                      <Text style={styles.statText}>Played: {stats.played}</Text>
                      <Text style={styles.statText}>Completed: {stats.completed}</Text>
                    </View>
                    <View style={styles.rewardBadge}>
                      <Text style={styles.rewardText}>🪙 {difficulty.reward} coins</Text>
                    </View>
                  </>
                ) : (
                  <View style={styles.unlockBadge}>
                    <Text style={styles.unlockText}>Unlock: {difficulty.cost} coins</Text>
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        <View style={styles.statsPanel}>
          <Text style={styles.statsPanelText}>
            Total Games: {sudokuProgress.totalGames} | Wins: {sudokuProgress.totalWins}
          </Text>
        </View>

        {/* Unlock Modal */}
        <Modal visible={showUnlockModal} transparent animationType="fade">
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Unlock Difficulty?</Text>
              {difficultyToUnlock && (
                <>
                  <Text style={styles.modalText}>
                    Unlock {difficulties.find(d => d.id === difficultyToUnlock)?.name} difficulty for{' '}
                    {difficulties.find(d => d.id === difficultyToUnlock)?.cost} coins?
                  </Text>
                  <Text style={styles.modalSubtext}>Your coins: {state.coins}</Text>
                </>
              )}
              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={[styles.modalButton, styles.cancelButton]}
                  onPress={() => setShowUnlockModal(false)}
                >
                  <Text style={styles.modalButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.modalButton, styles.confirmButton]}
                  onPress={confirmUnlock}
                >
                  <Text style={styles.modalButtonText}>Unlock</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
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
                    isInThickBorder === 'bottom' && styles.thickBorderBottom,
                    isInThickBorder === 'right' && styles.thickBorderRight,
                  ]}
                  onPress={() => handleCellPress(rowIndex, colIndex)}
                >
                  <Text style={[styles.cellText, isInitial && styles.initialCellText]}>
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
              style={styles.numberButton}
              onPress={() => handleNumberPress(num)}
            >
              <Text style={styles.numberButtonText}>{num}</Text>
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
    flex: 1,
    backgroundColor: palette.midnight,
    padding: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: palette.neonBlue,
    textAlign: 'center',
    marginTop: 20,
  },
  subtitle: {
    fontSize: 16,
    color: palette.silver,
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 30,
  },
  difficultiesContainer: {
    paddingVertical: 20,
  },
  difficultyCard: {
    marginBottom: 16,
    borderRadius: 16,
    backgroundColor: palette.slate,
    padding: 24,
    borderWidth: 2,
    borderColor: palette.electricPurple + '60',
    shadowColor: palette.electricPurple,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  lockedCard: {
    opacity: 0.6,
    borderColor: palette.slateLight + '60',
    shadowOpacity: 0.1,
  },
  lockIcon: {
    position: 'absolute',
    top: 16,
    right: 16,
    fontSize: 28,
  },
  difficultyName: {
    fontSize: 28,
    fontWeight: 'bold',
    color: palette.neonBlue,
    marginBottom: 6,
    textShadowColor: palette.neonBlue + '60',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
  difficultyDescription: {
    fontSize: 15,
    color: palette.silver,
    marginBottom: 16,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  statText: {
    fontSize: 12,
    color: palette.silver,
  },
  rewardBadge: {
    marginTop: 12,
    backgroundColor: palette.midnight,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 10,
    alignSelf: 'flex-start',
    borderWidth: 2,
    borderColor: palette.neonGreen + '80',
    shadowColor: palette.neonGreen,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 6,
    elevation: 3,
  },
  rewardText: {
    color: palette.neonGreen,
    fontWeight: 'bold',
    fontSize: 15,
  },
  unlockBadge: {
    marginTop: 12,
    backgroundColor: palette.midnight,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 10,
    alignSelf: 'flex-start',
    borderWidth: 2,
    borderColor: palette.electricPurple + '80',
    shadowColor: palette.electricPurple,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 6,
    elevation: 3,
  },
  unlockText: {
    color: palette.electricPurple,
    fontWeight: 'bold',
    fontSize: 15,
  },
  statsPanel: {
    marginTop: 20,
    padding: 16,
    backgroundColor: palette.slate,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: palette.neonBlue + '40',
    shadowColor: palette.neonBlue,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 3,
  },
  statsPanelText: {
    color: palette.neonBlue,
    textAlign: 'center',
    fontSize: 15,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: palette.slate,
    borderRadius: 20,
    padding: 28,
    width: '80%',
    borderWidth: 3,
    borderColor: palette.electricPurple,
    shadowColor: palette.electricPurple,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 20,
    elevation: 10,
  },
  modalTitle: {
    fontSize: 26,
    fontWeight: 'bold',
    color: palette.neonBlue,
    marginBottom: 16,
    textAlign: 'center',
    textShadowColor: palette.neonBlue + '60',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
  modalText: {
    fontSize: 16,
    color: palette.softWhite,
    marginBottom: 8,
    textAlign: 'center',
  },
  modalSubtext: {
    fontSize: 14,
    color: palette.silver,
    marginBottom: 24,
    textAlign: 'center',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  modalButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 10,
    marginHorizontal: 6,
    borderWidth: 2,
  },
  cancelButton: {
    backgroundColor: palette.midnight,
    borderColor: palette.slateLight,
  },
  confirmButton: {
    backgroundColor: palette.electricPurple,
    borderColor: palette.electricPurple,
    shadowColor: palette.electricPurple,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 8,
    elevation: 5,
  },
  modalButtonText: {
    color: palette.softWhite,
    textAlign: 'center',
    fontWeight: 'bold',
    fontSize: 16,
  },
  gameHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  backButton: {
    padding: 8,
  },
  backButtonText: {
    color: palette.neonBlue,
    fontSize: 16,
    fontWeight: 'bold',
  },
  gameTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: palette.neonBlue,
    textShadowColor: palette.neonBlue + '40',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 8,
  },
  mistakesText: {
    fontSize: 18,
    color: palette.neonPink,
    fontWeight: 'bold',
    textShadowColor: palette.neonPink + '40',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 6,
  },
  boardContainer: {
    alignSelf: 'center',
    backgroundColor: palette.slate,
    padding: 8,
    borderRadius: 12,
    marginBottom: 20,
    borderWidth: 2,
    borderColor: palette.neonBlue + '60',
    shadowColor: palette.neonBlue,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 5,
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
    borderColor: palette.slateLight,
    backgroundColor: palette.midnight,
  },
  selectedCell: {
    backgroundColor: palette.neonBlue + '20',
    borderWidth: 2,
    borderColor: palette.neonBlue,
  },
  initialCell: {
    backgroundColor: palette.slate,
  },
  thickBorderBottom: {
    borderBottomWidth: 2,
    borderBottomColor: palette.neonBlue + '60',
  },
  thickBorderRight: {
    borderRightWidth: 2,
    borderRightColor: palette.neonBlue + '60',
  },
  cellText: {
    fontSize: 22,
    fontWeight: '600',
    color: palette.neonGreen,
  },
  initialCellText: {
    fontWeight: 'bold',
    color: palette.softWhite,
  },
  controlsContainer: {
    alignItems: 'center',
  },
  numbersContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    marginBottom: 16,
  },
  numberButton: {
    width: (width - 80) / 9,
    height: (width - 80) / 9,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: palette.slate,
    margin: 4,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: palette.electricPurple + '80',
    shadowColor: palette.electricPurple,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 4,
    elevation: 3,
  },
  numberButtonText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: palette.electricPurple,
  },
  clearButton: {
    backgroundColor: palette.slate,
    paddingVertical: 12,
    paddingHorizontal: 32,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: palette.neonPink + '80',
    shadowColor: palette.neonPink,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 4,
    elevation: 3,
  },
  clearButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: palette.neonPink,
  },
});
