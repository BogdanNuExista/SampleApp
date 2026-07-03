import React, { useRef, useState } from 'react';
import {
  Dimensions,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Chess } from 'chess.js';
import { useGame } from '../context/GameContext';
import { pieceImages, ChessPieceKey, fileLabels } from '../constants/chessAssets';
import { palette } from '../theme/colors';
import { soundEffects } from '../services/SoundEffects';
import PUZZLES from '../../assets/puzzles/puzzles.json';

type SolutionMove = { uci: string; san: string };
type Puzzle = {
  id: string;
  fen: string;
  sideToMove: 'white' | 'black';
  theme: string;
  mateIn: number;
  rating: number;
  source: string;
  solution: SolutionMove[];
};

const PUZZLE_LIST = PUZZLES as Puzzle[];

const BOARD_SIZE = Math.min(Dimensions.get('window').width - 32, 360);
const SQUARE = BOARD_SIZE / 8;
const LIGHT = '#3a456b';
const DARK = '#222a44';

type Status = 'playing' | 'progress' | 'solved' | 'retry';

function rewardFor(mateIn: number) {
  return 15 + Math.max(0, mateIn - 2) * 10; // 2->15, 3->25, 4->35
}

function randomIndex(exclude: number) {
  if (PUZZLE_LIST.length <= 1) return 0;
  let i = exclude;
  while (i === exclude) i = Math.floor(Math.random() * PUZZLE_LIST.length);
  return i;
}

function applyUci(game: Chess, uci: string) {
  game.move({
    from: uci.slice(0, 2) as any,
    to: uci.slice(2, 4) as any,
    promotion: (uci.slice(4) || 'q') as any,
  });
}

export function PuzzleScreen() {
  const {
    state: { puzzleStats },
    completePuzzle,
  } = useGame();

  const [puzzleIndex, setPuzzleIndex] = useState(() =>
    Math.floor(Math.random() * PUZZLE_LIST.length),
  );
  const puzzle = PUZZLE_LIST[puzzleIndex];
  const attackerColor = puzzle.sideToMove === 'white' ? 'w' : 'b';

  const gameRef = useRef<Chess | null>(null);
  if (gameRef.current === null) {
    gameRef.current = new Chess(puzzle.fen);
  }

  const [, forceRender] = useState(0);
  const rerender = () => forceRender(v => v + 1);

  const [selected, setSelected] = useState<string | null>(null);
  const [status, setStatus] = useState<Status>('playing');
  const [plyIndex, setPlyIndex] = useState(0);
  const [hint, setHint] = useState<string | null>(null);

  const alreadySolved = puzzleStats.solvedIds.includes(puzzle.id);
  const game = gameRef.current;
  const board = game.board();

  const movesLeft = Math.ceil((puzzle.solution.length - plyIndex) / 2);

  const legalTargets = (() => {
    if (!selected) return new Set<string>();
    const moves = game.moves({ square: selected as any, verbose: true }) as any[];
    return new Set(moves.map(m => m.to));
  })();

  const loadPuzzle = (index: number) => {
    setPuzzleIndex(index);
    gameRef.current = new Chess(PUZZLE_LIST[index].fen);
    setSelected(null);
    setStatus('playing');
    setPlyIndex(0);
    setHint(null);
    rerender();
  };

  const resetPuzzle = () => {
    gameRef.current = new Chess(puzzle.fen);
    setSelected(null);
    setStatus('playing');
    setPlyIndex(0);
    setHint(null);
    rerender();
  };

  const squareName = (row: number, col: number) => `${fileLabels[col]}${8 - row}`;

  const solvePuzzle = () => {
    setStatus('solved');
    soundEffects.play('win');
    if (!alreadySolved) completePuzzle(puzzle.id, true, rewardFor(puzzle.mateIn));
    rerender();
  };

  const handleSquarePress = (square: string) => {
    if (status === 'solved') return;
    const piece = game.get(square as any);

    // Select one of the attacker's pieces.
    if (piece && piece.color === attackerColor && game.turn() === attackerColor) {
      setSelected(square);
      if (status === 'retry') setStatus(plyIndex === 0 ? 'playing' : 'progress');
      return;
    }
    if (!selected) return;

    const expected = puzzle.solution[plyIndex];
    const userFromTo = selected + square;
    setHint(null);

    if (expected && expected.uci.slice(0, 4) === userFromTo) {
      // Correct line move — play it exactly (preserves any promotion piece).
      applyUci(game, expected.uci);
      setSelected(null);
      const nextIndex = plyIndex + 1;

      if (game.isCheckmate() || nextIndex >= puzzle.solution.length) {
        setPlyIndex(nextIndex);
        solvePuzzle();
        return;
      }
      // Auto-play the opponent's reply from the solution line.
      const defender = puzzle.solution[nextIndex];
      if (defender) applyUci(game, defender.uci);
      setPlyIndex(nextIndex + 1);
      setStatus('progress');
      soundEffects.play('correct');
      rerender();
      return;
    }

    // Not the main line. Try the move: accept if it's an immediate mate,
    // mark wrong if it's legal but not the solution, ignore illegal taps.
    let mv: ReturnType<Chess['move']> | null = null;
    try {
      mv = game.move({ from: selected as any, to: square as any, promotion: 'q' });
    } catch {
      mv = null;
    }
    setSelected(null);
    if (mv && game.isCheckmate()) {
      setPlyIndex(puzzle.solution.length);
      solvePuzzle();
      return;
    }
    if (mv) {
      game.undo();
      setStatus('retry');
      soundEffects.play('wrong');
    }
    rerender();
  };

  const showHint = () => {
    const expected = puzzle.solution[plyIndex];
    setHint(expected ? expected.san : null);
  };

  const solvedCount = puzzleStats.solvedIds.length;

  const bannerText =
    status === 'solved'
      ? alreadySolved
        ? '✅ Solved (already claimed)'
        : `✅ Checkmate! +${rewardFor(puzzle.mateIn)} 🪙`
      : status === 'retry'
      ? '❌ Not the mating line — try again'
      : status === 'progress'
      ? `✔ Good move! Mate in ${movesLeft}`
      : `${puzzle.sideToMove === 'white' ? 'White' : 'Black'} to move · Mate in ${movesLeft}`;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.headerRow}>
        <View style={styles.headerInfo}>
          <Text style={styles.title}>
            Puzzle · Mate in {puzzle.mateIn}
          </Text>
          <Text style={styles.subtitle} numberOfLines={1}>
            {puzzle.source || `rating ${puzzle.rating}`}
          </Text>
        </View>
        <View style={styles.solvedPill}>
          <Text style={styles.solvedPillText}>{solvedCount} solved</Text>
        </View>
      </View>

      <View
        style={[
          styles.banner,
          status === 'solved'
            ? styles.bannerSolved
            : status === 'retry'
            ? styles.bannerRetry
            : status === 'progress'
            ? styles.bannerProgress
            : styles.bannerPlay,
        ]}
      >
        <Text style={styles.bannerText}>{bannerText}</Text>
      </View>

      <View style={styles.board}>
        {(attackerColor === 'w' ? [0, 1, 2, 3, 4, 5, 6, 7] : [7, 6, 5, 4, 3, 2, 1, 0]).map(row => (
          <View key={row} style={styles.boardRow}>
            {(attackerColor === 'w' ? [0, 1, 2, 3, 4, 5, 6, 7] : [7, 6, 5, 4, 3, 2, 1, 0]).map(col => {
              const cell = board[row][col];
              const name = squareName(row, col);
              const isLight = (row + col) % 2 === 0;
              const isSelected = selected === name;
              const isTarget = legalTargets.has(name);
              return (
                <Pressable
                  key={name}
                  onPress={() => handleSquarePress(name)}
                  style={[
                    styles.square,
                    { backgroundColor: isLight ? LIGHT : DARK },
                    isSelected && styles.squareSelected,
                  ]}
                >
                  {isTarget && <View style={styles.targetDot} />}
                  {cell && (
                    <Image
                      source={pieceImages[`${cell.color}${cell.type.toUpperCase()}` as ChessPieceKey]}
                      style={styles.piece}
                      resizeMode="contain"
                    />
                  )}
                </Pressable>
              );
            })}
          </View>
        ))}
      </View>

      {hint && status !== 'solved' && (
        <Text style={styles.hintText}>Hint: play {hint}</Text>
      )}

      <View style={styles.buttonRow}>
        {status === 'solved' ? (
          <Pressable
            style={[styles.btn, styles.btnPrimary]}
            onPress={() => loadPuzzle(randomIndex(puzzleIndex))}
          >
            <Text style={styles.btnPrimaryText}>Next Puzzle →</Text>
          </Pressable>
        ) : (
          <>
            <Pressable style={[styles.btn, styles.btnGhost]} onPress={resetPuzzle}>
              <Text style={styles.btnGhostText}>Reset</Text>
            </Pressable>
            <Pressable style={[styles.btn, styles.btnGhost]} onPress={showHint}>
              <Text style={styles.btnGhostText}>Hint</Text>
            </Pressable>
            <Pressable
              style={[styles.btn, styles.btnGhost]}
              onPress={() => loadPuzzle(randomIndex(puzzleIndex))}
            >
              <Text style={styles.btnGhostText}>Skip</Text>
            </Pressable>
          </>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0b1220' },
  content: { padding: 16, gap: 14, alignItems: 'center' },
  headerRow: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 10,
  },
  headerInfo: { flex: 1 },
  title: { color: palette.softWhite, fontSize: 18, fontWeight: '800' },
  subtitle: { color: palette.silver, fontSize: 12, marginTop: 2 },
  solvedPill: {
    backgroundColor: palette.neonGreen + '22',
    borderColor: palette.neonGreen,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  solvedPillText: { color: palette.neonGreen, fontWeight: '700', fontSize: 12 },
  banner: {
    width: '100%',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    borderWidth: 1,
  },
  bannerPlay: { backgroundColor: '#111827', borderColor: palette.neonBlue + '44' },
  bannerProgress: { backgroundColor: palette.neonBlue + '1a', borderColor: palette.neonBlue },
  bannerRetry: { backgroundColor: palette.danger + '1a', borderColor: palette.danger },
  bannerSolved: { backgroundColor: palette.neonGreen + '1a', borderColor: palette.neonGreen },
  bannerText: { color: palette.softWhite, fontWeight: '700', fontSize: 15 },
  board: {
    width: BOARD_SIZE,
    height: BOARD_SIZE,
    borderRadius: 8,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: '#0f152b',
  },
  boardRow: { flexDirection: 'row' },
  square: { width: SQUARE, height: SQUARE, alignItems: 'center', justifyContent: 'center' },
  squareSelected: { backgroundColor: palette.neonYellow + '99' },
  targetDot: {
    position: 'absolute',
    width: SQUARE * 0.3,
    height: SQUARE * 0.3,
    borderRadius: SQUARE * 0.15,
    backgroundColor: palette.neonGreen + 'aa',
  },
  piece: { width: SQUARE * 0.86, height: SQUARE * 0.86 },
  hintText: { color: palette.neonYellow, fontWeight: '700', fontSize: 14 },
  buttonRow: { flexDirection: 'row', gap: 10, width: '100%' },
  btn: { flex: 1, borderRadius: 12, paddingVertical: 13, alignItems: 'center' },
  btnPrimary: { backgroundColor: palette.neonGreen },
  btnPrimaryText: { color: '#06281c', fontWeight: '800', fontSize: 15 },
  btnGhost: { backgroundColor: '#1e293b' },
  btnGhostText: { color: palette.softWhite, fontWeight: '700', fontSize: 14 },
});
