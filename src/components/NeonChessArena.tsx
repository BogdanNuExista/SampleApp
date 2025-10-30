import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Chess, Move, Piece, Square } from 'chess.js';
import {
  Image,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { pieceImages, ChessPieceKey, fileLabels } from '../constants/chessAssets';
import { InventoryCatalogItem } from '../constants/inventoryCatalog';
import { palette } from '../theme/colors';
import {
  ChessDifficulty,
  ChessMatchRequest,
  ChessMatchResolution,
  ChessUnlockState,
  useGame,
} from '../context/GameContext';

const PIECE_VALUES: Record<string, number> = {
  p: 1,
  n: 3,
  b: 3,
  r: 5,
  q: 9,
  k: 0,
};

const rankLabels = [8, 7, 6, 5, 4, 3, 2, 1];
const fileLetters = fileLabels.split('');

const difficultyMeta: Record<ChessDifficulty, { label: string; blurb: string }> = {
  easy: {
    label: 'Easy',
    blurb: 'Relaxed play. The opponent picks random legal moves.',
  },
  normal: {
    label: 'Normal',
    blurb: 'Sharper tactics. The opponent looks one move ahead.',
  },
  hard: {
    label: 'Hard',
    blurb: 'Tournament focus. The opponent calculates two plies.',
  },
};

type ResultModalState = {
  outcome: 'win' | 'loss' | 'draw';
  coinsEarned: number;
  reward: { item: InventoryCatalogItem; isNew: boolean } | null;
  newlyUnlocked: ChessUnlockState;
  difficulty: ChessDifficulty;
};

export function NeonChessArena() {
  const {
    state: {
      chess: { stats, unlocked },
    },
    finishChessMatch,
  } = useGame();

  const chessRef = useRef(new Chess());
  const aiMoveTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  const snapshotBoard = (game: Chess): (Piece | null)[][] => {
    const board = game.board() as Array<Array<Piece | null>>;
    return board.map(rank => rank.slice());
  };

  const [difficulty, setDifficulty] = useState<ChessDifficulty>('easy');
  const [boardState, setBoardState] = useState<(Piece | null)[][]>(() =>
    snapshotBoard(chessRef.current),
  );
  const [selectedSquare, setSelectedSquare] = useState<string | null>(null);
  const [legalTargets, setLegalTargets] = useState<string[]>([]);
  const [isThinking, setIsThinking] = useState(false);
  const [isGameActive, setIsGameActive] = useState(true);
  const [statusLabel, setStatusLabel] = useState('You are playing white. Make the first move.');
  const [result, setResult] = useState<ResultModalState | null>(null);

  const { width: windowWidth } = useWindowDimensions();
  const horizontalPadding = 40;
  const rankLabelWidth = 30;
  const availableWidth = Math.max(280, windowWidth - horizontalPadding);
  const squareSize = Math.max(36, Math.floor((availableWidth - rankLabelWidth) / 8));
  const boardWidth = rankLabelWidth + squareSize * 8;
  const boardHeight = squareSize * 8;
  const fileLabelHeight = 28;
  const pieceSize = Math.floor(squareSize * 0.82);
  const captureRingSize = pieceSize + 6;
  const targetDotSize = Math.max(10, Math.floor(squareSize * 0.32));

  const availableDifficulty = useMemo(() => {
    if (difficulty === 'hard' && !unlocked.hard) {
      return unlocked.normal ? 'normal' : 'easy';
    }
    if (difficulty === 'normal' && !unlocked.normal) {
      return 'easy';
    }
    return difficulty;
  }, [difficulty, unlocked.hard, unlocked.normal]);

  useEffect(() => {
    if (availableDifficulty !== difficulty) {
      setDifficulty(availableDifficulty);
      resetGame(availableDifficulty);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [availableDifficulty]);

  useEffect(() => {
    return () => {
      if (aiMoveTimeout.current) {
        clearTimeout(aiMoveTimeout.current);
      }
    };
  }, []);

  const resetGame = (nextDifficulty: ChessDifficulty = difficulty) => {
    if (aiMoveTimeout.current) {
      clearTimeout(aiMoveTimeout.current);
      aiMoveTimeout.current = null;
    }
    chessRef.current = new Chess();
  setBoardState(snapshotBoard(chessRef.current));
    setSelectedSquare(null);
    setLegalTargets([]);
    setIsThinking(false);
    setIsGameActive(true);
    setResult(null);
    setStatusLabel(`You are playing white on ${difficultyMeta[nextDifficulty].label} difficulty.`);
  };

  const handleDifficultyPress = (level: ChessDifficulty) => {
    const isLocked = (level === 'normal' && !unlocked.normal) || (level === 'hard' && !unlocked.hard);
    if (isLocked) {
      return;
    }
    if (level !== difficulty) {
      setDifficulty(level);
      resetGame(level);
    } else {
      resetGame(level);
    }
  };

  const handleSquarePress = (square: string) => {
    if (!isGameActive || isThinking) {
      return;
    }

    const game = chessRef.current;
    if (game.turn() !== 'w') {
      return;
    }

    if (selectedSquare === square) {
      setSelectedSquare(null);
      setLegalTargets([]);
      return;
    }

    const piece = game.get(square as Square);
    if (piece?.color === 'w') {
  const moves = game.moves({ square: square as Square, verbose: true }) as Move[];
      setSelectedSquare(square);
      setLegalTargets(moves.map(move => move.to));
      return;
    }

    if (selectedSquare && legalTargets.includes(square)) {
      const move = game.move({ from: selectedSquare as Square, to: square as Square, promotion: 'q' });
      if (move) {
        setBoardState(snapshotBoard(game));
        setSelectedSquare(null);
        setLegalTargets([]);
        const finished = evaluateGameState('player');
        if (!finished) {
          triggerComputerMove();
        }
      }
    }
  };

  const triggerComputerMove = () => {
    if (aiMoveTimeout.current) {
      clearTimeout(aiMoveTimeout.current);
    }
    setIsThinking(true);
    setStatusLabel('Opponent is thinking…');
    const delay = difficulty === 'hard' ? 650 : difficulty === 'normal' ? 520 : 400;
    aiMoveTimeout.current = setTimeout(() => {
      const game = chessRef.current;
      const move = selectComputerMove(game, difficulty);
      if (move) {
        game.move(move);
      }
  setBoardState(snapshotBoard(game));
      setIsThinking(false);
      const finished = evaluateGameState('opponent');
      if (!finished) {
        setStatusLabel('Your move.');
      }
    }, delay);
  };

  const evaluateGameState = (lastMoveBy: 'player' | 'opponent') => {
    const game = chessRef.current;
    if (game.isCheckmate()) {
      handleMatchFinished(lastMoveBy === 'player' ? 'win' : 'loss');
      return true;
    }
    if (
      game.isStalemate() ||
      game.isDraw() ||
      game.isThreefoldRepetition() ||
      game.isInsufficientMaterial()
    ) {
      handleMatchFinished('draw');
      return true;
    }
    return false;
  };

  const handleMatchFinished = (outcome: ChessMatchRequest['outcome']) => {
    setIsGameActive(false);
    setIsThinking(false);
    setStatusLabel(
      outcome === 'win'
        ? 'Victory! The neon guardians salute you.'
        : outcome === 'loss'
        ? 'Defeat this round. Ready for a rematch?'
        : 'Balanced outcome. Call it a draw.',
    );
    const resolution: ChessMatchResolution = finishChessMatch({ difficulty, outcome });
    setResult({
      outcome,
      coinsEarned: resolution.coinsEarned,
      reward: resolution.reward
        ? { item: resolution.reward, isNew: resolution.isRewardNew }
        : null,
      newlyUnlocked: resolution.newlyUnlocked,
      difficulty,
    });
  };

  const handleCloseResult = () => {
    resetGame(difficulty);
  };

  const statsSummary = useMemo(
    () =>
      (['easy', 'normal', 'hard'] as ChessDifficulty[]).map(level => ({
        level,
        record: stats[level],
        locked: (level === 'normal' && !unlocked.normal) || (level === 'hard' && !unlocked.hard),
      })),
    [stats, unlocked.hard, unlocked.normal],
  );

  const easyWinsNeeded = Math.max(0, 3 - stats.easy.wins);
  const normalWinsNeeded = Math.max(0, 10 - stats.normal.wins);

  return (
    <View style={styles.container}>
      <View style={styles.panelHeader}>
        <Text style={styles.title}>Cosmic Chess Gauntlet</Text>
        <Text style={styles.subtitle}>
          Capture the synth throne, climb through the difficulty ladder, and stack rewards for your inventory.
        </Text>
      </View>

      <View style={styles.difficultyRow}>
        {(['easy', 'normal', 'hard'] as ChessDifficulty[]).map(level => {
          const lockedFlag =
            (level === 'normal' && !unlocked.normal) ||
            (level === 'hard' && !unlocked.hard);
          const isActive = difficulty === level;
          return (
            <Pressable
              key={level}
              style={[styles.difficultyChip, isActive && styles.difficultyChipActive, lockedFlag && styles.difficultyChipLocked]}
              onPress={() => handleDifficultyPress(level)}
              disabled={lockedFlag}
            >
              <Text style={[styles.difficultyLabel, isActive && styles.difficultyLabelActive]}>
                {difficultyMeta[level].label}
              </Text>
              <Text style={styles.difficultyBlurb}>{difficultyMeta[level].blurb}</Text>
              {lockedFlag ? <Text style={styles.lockGlyph}>🔒</Text> : null}
            </Pressable>
          );
        })}
      </View>

      {!unlocked.normal ? (
        <Text style={styles.unlockHint}>
          Win {easyWinsNeeded} more easy game{easyWinsNeeded === 1 ? '' : 's'} to unlock Normal difficulty.
        </Text>
      ) : null}
      {unlocked.normal && !unlocked.hard ? (
        <Text style={styles.unlockHint}>
          Win {normalWinsNeeded} more normal game{normalWinsNeeded === 1 ? '' : 's'} to unlock Hard difficulty.
        </Text>
      ) : null}

      <View style={styles.boardContainer}>
        <View
          style={[
            styles.boardWrapper,
            {
              width: boardWidth,
              height: boardHeight,
              borderRadius: Math.max(16, squareSize * 0.65),
            },
          ]}
        >
          {boardState.map((rank: Array<Piece | null>, rankIndex: number) => (
            <View
              key={`rank-${rankIndex}`}
              style={[styles.boardRow, { height: squareSize }]}
            >
              <View
                style={[styles.rankCell, { width: rankLabelWidth, height: squareSize }]}
              >
                <Text style={styles.rankLabel}>{rankLabels[rankIndex]}</Text>
              </View>
              {rank.map((piece: Piece | null, fileIndex: number) => {
                const square = `${fileLetters[fileIndex]}${rankLabels[rankIndex]}`;
                const isDark = (rankIndex + fileIndex) % 2 === 1;
                const isSelected = selectedSquare === square;
                const isTarget = legalTargets.includes(square);
                const pieceKey = piece
                  ? (`${piece.color === 'w' ? 'w' : 'b'}${piece.type.toUpperCase()}` as ChessPieceKey)
                  : null;
                return (
                  <Pressable
                    key={square}
                    style={[
                      styles.square,
                      {
                        width: squareSize,
                        height: squareSize,
                      },
                      isDark && styles.squareDark,
                      isSelected && styles.squareSelected,
                    ]}
                    onPress={() => handleSquarePress(square)}
                  >
                    {pieceKey ? (
                      <Image
                        source={pieceImages[pieceKey]}
                        style={{ width: pieceSize, height: pieceSize }}
                      />
                    ) : null}
                    {!pieceKey && isTarget ? (
                      <View
                        style={[
                          styles.targetDot,
                          {
                            width: targetDotSize,
                            height: targetDotSize,
                            borderRadius: targetDotSize / 2,
                          },
                        ]}
                      />
                    ) : null}
                    {pieceKey && isTarget ? (
                      <View
                        style={[
                          styles.captureRing,
                          {
                            width: captureRingSize,
                            height: captureRingSize,
                            borderRadius: captureRingSize / 2,
                          },
                        ]}
                      />
                    ) : null}
                  </Pressable>
                );
              })}
            </View>
          ))}
        </View>
        <View
          style={[
            styles.fileLabelRow,
            { width: boardWidth, height: fileLabelHeight },
          ]}
        >
          <View
            style={[styles.fileCorner, { width: rankLabelWidth, height: fileLabelHeight }]}
          />
          {fileLetters.map(letter => (
            <View
              key={letter}
              style={[styles.fileCell, { width: squareSize, height: fileLabelHeight }]}
            >
              <Text style={styles.fileLabel}>{letter.toUpperCase()}</Text>
            </View>
          ))}
        </View>
      </View>

      <View style={styles.statusBlock}>
        <Text style={styles.statusText}>{statusLabel}</Text>
        {isThinking ? <Text style={styles.statusSubtext}>AI calculating…</Text> : null}
      </View>

      <View style={styles.statsGrid}>
        {statsSummary.map(entry => (
          <View key={entry.level} style={[styles.statsCard, entry.locked && styles.statsCardLocked]}>
            <Text style={styles.statsLabel}>{difficultyMeta[entry.level].label}</Text>
            <Text style={styles.statsValue}>
              {entry.record.wins} W · {entry.record.losses} L
            </Text>
            {entry.locked ? <Text style={styles.statsLockedTag}>Locked</Text> : null}
          </View>
        ))}
      </View>

      <Modal transparent animationType="fade" visible={Boolean(result)} onRequestClose={handleCloseResult}>
        <Pressable style={styles.modalBackdrop} onPress={handleCloseResult}>
          <Pressable style={styles.modalCard} onPress={(e) => e.stopPropagation()}>
            <Text style={styles.modalTitle}>
              {result?.outcome === 'win'
                ? 'Victory!'
                : result?.outcome === 'loss'
                ? 'Defeat'
                : 'Draw'}
            </Text>
            <Text style={styles.modalSubtitle}>
              {difficultyMeta[result?.difficulty ?? 'easy'].label} difficulty cleared.
            </Text>
            {result?.coinsEarned ? (
              <Text style={styles.modalCoins}>+{result.coinsEarned} coins</Text>
            ) : (
              <Text style={styles.modalCoins}>No coins earned this round.</Text>
            )}

            {result?.reward ? (
              <View style={styles.rewardBlock}>
                <Image source={result.reward.item.image} style={styles.rewardImage} resizeMode="contain" />
                <Text style={styles.rewardName}>{result.reward.item.name}</Text>
                <Text style={styles.rewardMessage}>
                  {result.reward.isNew
                    ? 'New item added to your inventory!'
                    : 'Already owned. Inventory unchanged.'}
                </Text>
              </View>
            ) : null}

            {result?.newlyUnlocked.normal ? (
              <Text style={styles.unlockMessage}>Normal difficulty unlocked!</Text>
            ) : null}
            {result?.newlyUnlocked.hard ? (
              <Text style={styles.unlockMessage}>Hard difficulty unlocked! Prepare for elite play.</Text>
            ) : null}

            <Pressable style={styles.modalButton} onPress={handleCloseResult}>
              <Text style={styles.modalButtonText}>Start a new game</Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

function selectComputerMove(game: Chess, difficulty: ChessDifficulty): Move | null {
  const moves = game.moves({ verbose: true }) as Move[];
  if (moves.length === 0) {
    return null;
  }
  if (difficulty === 'easy') {
    const index = Math.floor(Math.random() * moves.length);
    return moves[index];
  }
  if (difficulty === 'normal') {
    return chooseDepthOneMove(game, moves);
  }
  return chooseDepthTwoMove(game, moves);
}

function chooseDepthOneMove(game: Chess, moves: Move[]): Move {
  let bestMove = moves[0];
  let bestScore = Number.POSITIVE_INFINITY;
  moves.forEach((move: Move) => {
    game.move(move);
    const score = evaluateBoard(game);
    game.undo();
    const jitter = score + Math.random() * 0.1;
    if (jitter < bestScore) {
      bestScore = jitter;
      bestMove = move;
    }
  });
  return bestMove;
}

function chooseDepthTwoMove(game: Chess, moves: Move[]): Move {
  let bestMove = moves[0];
  let bestScore = Number.POSITIVE_INFINITY;
  moves.forEach((move: Move) => {
    game.move(move);
    const opponentMoves = game.moves({ verbose: true }) as Move[];
    let worstScore = Number.NEGATIVE_INFINITY;
    if (opponentMoves.length === 0) {
      worstScore = evaluateBoard(game);
    } else {
  opponentMoves.forEach((response: Move) => {
        game.move(response);
        const score = evaluateBoard(game);
        game.undo();
        if (score > worstScore) {
          worstScore = score;
        }
      });
    }
    game.undo();
    const adjustedScore = worstScore + Math.random() * 0.05;
    if (adjustedScore < bestScore) {
      bestScore = adjustedScore;
      bestMove = move;
    }
  });
  return bestMove;
}

function evaluateBoard(game: Chess) {
  let total = 0;
  const board = game.board() as (Piece | null)[][];
  board.forEach((rank: Array<Piece | null>) => {
    rank.forEach(piece => {
      if (!piece) {
        return;
      }
      const value = PIECE_VALUES[piece.type];
      total += piece.color === 'w' ? value : -value;
    });
  });
  return total;
}

const styles = StyleSheet.create({
  container: {
    gap: 18,
    padding: 20,
    backgroundColor: '#0f172a',
    borderRadius: 24,
  },
  panelHeader: {
    gap: 6,
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
  difficultyRow: {
    flexDirection: 'column',
    gap: 10,
  },
  difficultyChip: {
    borderWidth: 1,
    borderColor: '#1e293b',
    borderRadius: 16,
    padding: 12,
    backgroundColor: '#111b34',
    gap: 6,
  },
  difficultyChipActive: {
    borderColor: palette.neonPink,
    backgroundColor: '#2a1040',
  },
  difficultyChipLocked: {
    opacity: 0.6,
  },
  difficultyLabel: {
    color: palette.softWhite,
    fontSize: 15,
    fontWeight: '700',
  },
  difficultyLabelActive: {
    color: palette.neonPink,
  },
  difficultyBlurb: {
    color: '#94a3b8',
    fontSize: 12,
  },
  lockGlyph: {
    color: '#f97316',
    fontSize: 14,
    alignSelf: 'flex-start',
  },
  unlockHint: {
    color: '#94a3b8',
    fontSize: 12,
  },
  boardContainer: {
    alignSelf: 'center',
    alignItems: 'center',
    gap: 6,
  },
  boardWrapper: {
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: '#1f2a44',
    backgroundColor: '#10172d',
  },
  boardRow: {
    flexDirection: 'row',
  },
  rankCell: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0b1225',
  },
  rankLabel: {
    color: '#64748b',
    fontSize: 12,
  },
  square: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1e293b',
    borderWidth: 0.5,
    borderColor: '#172033',
    position: 'relative',
  },
  squareDark: {
    backgroundColor: '#111b2e',
  },
  squareSelected: {
    borderColor: palette.neonPink,
    borderWidth: 2,
  },
  piece: {
  },
  targetDot: {
    backgroundColor: 'rgba(125, 211, 252, 0.8)',
  },
  captureRing: {
    position: 'absolute',
    borderWidth: 2,
    borderColor: 'rgba(244, 114, 182, 0.8)',
  },
  fileLabelRow: {
    flexDirection: 'row',
  },
  fileCorner: {
    backgroundColor: '#0b1225',
  },
  fileCell: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0b1225',
  },
  fileLabel: {
    color: '#64748b',
    fontSize: 11,
  },
  statusBlock: {
    backgroundColor: '#101a34',
    borderRadius: 14,
    padding: 14,
    gap: 4,
    borderWidth: 1,
    borderColor: '#1f2942',
  },
  statusText: {
    color: palette.softWhite,
    fontWeight: '600',
  },
  statusSubtext: {
    color: '#60a5fa',
    fontSize: 12,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  statsCard: {
    flex: 1,
    backgroundColor: '#101a34',
    borderRadius: 16,
    padding: 12,
    gap: 4,
    borderWidth: 1,
    borderColor: '#1f2d4d',
  },
  statsCardLocked: {
    opacity: 0.6,
  },
  statsLabel: {
    color: '#94a3b8',
    fontSize: 13,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  statsValue: {
    color: palette.softWhite,
    fontWeight: '700',
    fontSize: 16,
  },
  statsLockedTag: {
    color: '#fbbf24',
    fontSize: 12,
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
  modalCoins: {
    color: palette.neonGreen,
    fontWeight: '700',
  },
  rewardBlock: {
    alignItems: 'center',
    gap: 8,
    paddingVertical: 8,
    borderRadius: 14,
    backgroundColor: '#111b34',
    borderWidth: 1,
    borderColor: '#1f2d4d',
  },
  rewardImage: {
    width: 88,
    height: 88,
  },
  rewardName: {
    color: palette.softWhite,
    fontWeight: '700',
  },
  rewardMessage: {
    color: '#94a3b8',
    fontSize: 12,
    textAlign: 'center',
    paddingHorizontal: 12,
  },
  unlockMessage: {
    color: '#60a5fa',
    fontSize: 12,
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
});
