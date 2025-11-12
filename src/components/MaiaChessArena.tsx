import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Chess, Move, Piece, Square } from 'chess.js';
import {
  ActivityIndicator,
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
import { getFixedOpeningMove, FixedOpening } from '../constants/chessOpenings';
import {
  MaiaChessDifficulty,
  MaiaChessMatchRequest,
  MaiaChessMatchResolution,
  MaiaChessUnlockState,
  useGame,
} from '../context/GameContext';
import { useMaiaChessEngine, MaiaDifficulty, MaiaElo } from '../hooks/useMaiaChessEngine';

const rankLabels = [8, 7, 6, 5, 4, 3, 2, 1];
const fileLetters = fileLabels.split('');

const difficultyMeta: Record<
  MaiaChessDifficulty,
  { label: string; blurb: string; elo: MaiaElo; model: MaiaDifficulty; cost: number }
> = {
  apprentice: {
    label: 'Easy (~1100 Elo)',
    blurb: 'Maia plays at beginner level. Perfect for learning chess fundamentals.',
    elo: 1100,
    model: 'rapid',
    cost: 0, // Free to play
  },
  adept: {
    label: 'Medium (~1300 Elo)',
    blurb: 'Maia plays at intermediate level. A solid challenge for improving players.',
    elo: 1300,
    model: 'rapid',
    cost: 50, // Unlock cost
  },
  master: {
    label: 'Hard (~1500 Elo)',
    blurb: 'Maia plays at advanced level. Test your skills against stronger moves.',
    elo: 1500,
    model: 'rapid',
    cost: 100, // Unlock cost
  },
};

type ResultModalState = {
  outcome: 'win' | 'loss' | 'draw';
  coinsEarned: number;
  reward: { item: InventoryCatalogItem; isNew: boolean } | null;
  difficulty: MaiaChessDifficulty;
};

export function MaiaChessArena() {
  const {
    state: {
      coins,
      maiaChess: { stats, unlocked },
    },
    finishMaiaChessMatch,
    unlockMaiaDifficulty,
  } = useGame();

  const [difficulty, setDifficulty] = useState<MaiaChessDifficulty>('apprentice');
  
  // Get Elo based on selected difficulty
  const maiaElo = difficultyMeta[difficulty].elo;
  const { getMaiaMove, isModelsReady, isModelsLoading, modelsError } = useMaiaChessEngine(maiaElo, 1600);

  const chessRef = useRef(new Chess());
  const aiMoveTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  const snapshotBoard = (game: Chess): (Piece | null)[][] => {
    const board = game.board() as Array<Array<Piece | null>>;
    return board.map(rank => rank.slice());
  };

  const [boardState, setBoardState] = useState<(Piece | null)[][]>(() =>
    snapshotBoard(chessRef.current),
  );
  const [selectedSquare, setSelectedSquare] = useState<string | null>(null);
  const [legalTargets, setLegalTargets] = useState<string[]>([]);
  const [isThinking, setIsThinking] = useState(false);
  const [isGameActive, setIsGameActive] = useState(true);
  const [statusLabel, setStatusLabel] = useState(
    'Welcome to Maia AI Chess! Unlock difficulties to play.',
  );
  const [result, setResult] = useState<ResultModalState | null>(null);
  const [showUnlockModal, setShowUnlockModal] = useState(false);
  const [unlockTarget, setUnlockTarget] = useState<MaiaChessDifficulty | null>(null);
  const [moveHistory, setMoveHistory] = useState<string[]>([]); // Track UCI move history for opening book
  const [selectedOpening, setSelectedOpening] = useState<FixedOpening | null>(null); // AI's chosen opening for this game

  console.log('MaiaChessArena render - result state:', result);

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

  useEffect(() => {
    return () => {
      if (aiMoveTimeout.current) {
        clearTimeout(aiMoveTimeout.current);
      }
    };
  }, []);

  const resetGame = (nextDifficulty: MaiaChessDifficulty = difficulty) => {
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
    setMoveHistory([]); // Reset move history for opening book
    setSelectedOpening(null); // Reset selected opening (will be chosen on first AI move)

    if (unlocked[nextDifficulty]) {
      setStatusLabel(
        `You are playing white vs Maia AI (${difficultyMeta[nextDifficulty].elo} Elo).`,
      );
    } else {
      setStatusLabel('Unlock this difficulty to play!');
      setIsGameActive(false);
    }
  };

  const handleDifficultyPress = (level: MaiaChessDifficulty) => {
    if (!unlocked[level]) {
      setUnlockTarget(level);
      setShowUnlockModal(true);
      return;
    }
    if (level !== difficulty) {
      setDifficulty(level);
      resetGame(level);
    } else {
      resetGame(level);
    }
  };

  const handleUnlock = () => {
    if (!unlockTarget) {
      return;
    }
    const cost = difficultyMeta[unlockTarget].cost;
    const success = unlockMaiaDifficulty(unlockTarget, cost);
    if (success) {
      setShowUnlockModal(false);
      setDifficulty(unlockTarget);
      resetGame(unlockTarget);
      setUnlockTarget(null);
    }
  };

  const handleSquarePress = (square: string) => {
    if (!isGameActive || isThinking || !isModelsReady) {
      return;
    }

    if (!unlocked[difficulty]) {
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
      const move = game.move({
        from: selectedSquare as Square,
        to: square as Square,
        promotion: 'q',
      });
      if (move) {
        // Track move history in UCI format for opening book
        const uciMove = `${move.from}${move.to}${move.promotion || ''}`;
        const newHistory = [...moveHistory, uciMove];
        setMoveHistory(newHistory);
        
        setBoardState(snapshotBoard(game));
        setSelectedSquare(null);
        setLegalTargets([]);
        const finished = evaluateGameState('player');
        if (!finished) {
          triggerMaiaMove(newHistory); // Pass updated history
        }
      }
    }
  };

  const triggerMaiaMove = (currentHistory: string[] = moveHistory) => {
    if (aiMoveTimeout.current) {
      clearTimeout(aiMoveTimeout.current);
    }
    setIsThinking(true);
    setStatusLabel('Maia is thinking…');

    const delay = 750 + Math.random() * 400; // Simulate thinking time
    aiMoveTimeout.current = setTimeout(async () => {
      const game = chessRef.current;
      try {
        // First, try to use fixed opening book for first 2 moves (regardless of opponent's moves)
        const { move: openingMove, opening: newOpening } = getFixedOpeningMove(currentHistory, selectedOpening);
        
        if (openingMove) {
          console.log('[Maia] Using fixed opening move:', openingMove);
          
          // Update selected opening if this is the first move
          if (newOpening && !selectedOpening) {
            setSelectedOpening(newOpening);
          }
          
          const move = game.move(openingMove);
          if (move) {
            // Track AI move in history
            const uciMove = `${move.from}${move.to}${move.promotion || ''}`;
            setMoveHistory(prev => [...prev, uciMove]);
          }
        } else {
          // Use Maia neural network for move selection
          const move = await getMaiaMove(game);
          if (move) {
            const madeMove = game.move(move);
            if (madeMove) {
              // Track AI move in history
              const uciMove = `${madeMove.from}${madeMove.to}${madeMove.promotion || ''}`;
              setMoveHistory(prev => [...prev, uciMove]);
            }
          }
        }
      } catch (error) {
        console.warn('Maia move error', error);
        // Fallback to random move
        const moves = game.moves({ verbose: true }) as Move[];
        if (moves.length > 0) {
          const move = game.move(moves[Math.floor(Math.random() * moves.length)]);
          if (move) {
            const uciMove = `${move.from}${move.to}${move.promotion || ''}`;
            setMoveHistory(prev => [...prev, uciMove]);
          }
        }
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

  const handleMatchFinished = (outcome: MaiaChessMatchRequest['outcome']) => {
    setIsGameActive(false);
    setIsThinking(false);
    setStatusLabel(
      outcome === 'win'
        ? 'Victory against Maia AI! Excellent game.'
        : outcome === 'loss'
        ? 'Maia wins this round. Ready for a rematch?'
        : 'Balanced outcome. Call it a draw.',
    );
    const resolution: MaiaChessMatchResolution = finishMaiaChessMatch({ difficulty, outcome });
    console.log('Maia chess game finished!', { outcome, resolution });
    const resultData = {
      outcome,
      coinsEarned: resolution.coinsEarned,
      reward: resolution.reward ? { item: resolution.reward, isNew: resolution.isRewardNew } : null,
      difficulty,
    };
    console.log('Setting Maia result state:', resultData);
    setResult(resultData);
  };

  const handleCloseResult = () => {
    resetGame(difficulty);
  };

  const statsSummary = useMemo(
    () =>
      (['apprentice', 'adept', 'master'] as MaiaChessDifficulty[]).map(level => ({
        level,
        record: stats[level],
        locked: !unlocked[level],
        cost: difficultyMeta[level].cost,
      })),
    [stats, unlocked],
  );

  if (isModelsLoading) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <ActivityIndicator size="large" color={palette.neonPink} />
        <Text style={styles.loadingText}>Loading Maia AI models...</Text>
      </View>
    );
  }

  if (modelsError) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <Text style={styles.errorText}>⚠️ {modelsError}</Text>
        <Text style={styles.errorSubtext}>Please restart the app.</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.panelHeader}>
        <Text style={styles.title}>Maia AI Chess Challenge</Text>
        <Text style={styles.subtitle}>
          Face the Maia neural network trained on human play. Unlock difficulties with coins to test your skills
          against human-like opponents at different Elo ratings.
        </Text>
        <View style={styles.coinBadge}>
          <Text style={styles.coinText}>💰 {coins} coins</Text>
        </View>
      </View>

      <View style={styles.difficultyRow}>
        {(['apprentice', 'adept', 'master'] as MaiaChessDifficulty[]).map(level => {
          const lockedFlag = !unlocked[level];
          const isActive = difficulty === level;
          return (
            <Pressable
              key={level}
              style={[
                styles.difficultyChip,
                isActive && styles.difficultyChipActive,
                lockedFlag && styles.difficultyChipLocked,
              ]}
              onPress={() => handleDifficultyPress(level)}
            >
              <View style={styles.difficultyHeader}>
                <Text style={[styles.difficultyLabel, isActive && styles.difficultyLabelActive]}>
                  {difficultyMeta[level].label}
                </Text>
                <Text style={styles.eloLabel}>{difficultyMeta[level].elo} Elo</Text>
              </View>
              <Text style={styles.difficultyBlurb}>{difficultyMeta[level].blurb}</Text>
              {lockedFlag ? (
                <View style={styles.lockRow}>
                  <Text style={styles.lockGlyph}>🔒</Text>
                  <Text style={styles.lockText}>Unlock for {difficultyMeta[level].cost} coins</Text>
                </View>
              ) : null}
            </Pressable>
          );
        })}
      </View>

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
            <View key={`rank-${rankIndex}`} style={[styles.boardRow, { height: squareSize }]}>
              <View style={[styles.rankCell, { width: rankLabelWidth, height: squareSize }]}>
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
        <View style={[styles.fileLabelRow, { width: boardWidth, height: fileLabelHeight }]}>
          <View style={[styles.fileCorner, { width: rankLabelWidth, height: fileLabelHeight }]} />
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
        {isThinking ? <Text style={styles.statusSubtext}>Neural network processing…</Text> : null}
      </View>

      <View style={styles.statsGrid}>
        {statsSummary.map(entry => (
          <View key={entry.level} style={[styles.statsCard, entry.locked && styles.statsCardLocked]}>
            <Text style={styles.statsLabel}>{difficultyMeta[entry.level].label}</Text>
            <Text style={styles.statsValue}>
              {entry.record.wins} W · {entry.record.losses} L
            </Text>
            {entry.locked ? (
              <Text style={styles.statsLockedTag}>🔒 {entry.cost} coins</Text>
            ) : null}
          </View>
        ))}
      </View>

      {/* Result Modal */}
      <Modal
        transparent
        animationType="fade"
        visible={Boolean(result)}
        onRequestClose={handleCloseResult}
      >
        <Pressable style={styles.modalBackdrop} onPress={handleCloseResult}>
          <Pressable style={styles.modalCard} onPress={e => e.stopPropagation()}>
            <Text style={styles.modalTitle}>
              {result?.outcome === 'win'
                ? 'Victory!'
                : result?.outcome === 'loss'
                ? 'Defeat'
                : 'Draw'}
            </Text>
            <Text style={styles.modalSubtitle}>
              vs Maia AI {difficultyMeta[result?.difficulty ?? 'apprentice'].label} (
              {difficultyMeta[result?.difficulty ?? 'apprentice'].elo} Elo)
            </Text>
            {result?.coinsEarned ? (
              <Text style={styles.modalCoins}>+{result.coinsEarned} coins</Text>
            ) : (
              <Text style={styles.modalCoins}>No coins earned this round.</Text>
            )}

            {result?.reward ? (
              <View style={styles.rewardBlock}>
                <Image
                  source={result.reward.item.image}
                  style={styles.rewardImage}
                  resizeMode="contain"
                />
                <Text style={styles.rewardName}>{result.reward.item.name}</Text>
                <Text style={styles.rewardMessage}>
                  {result.reward.isNew
                    ? 'New item added to your inventory!'
                    : 'Already owned. Inventory unchanged.'}
                </Text>
              </View>
            ) : null}

            <Pressable style={styles.modalButton} onPress={handleCloseResult}>
              <Text style={styles.modalButtonText}>Play again</Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>

      {/* Unlock Modal */}
      <Modal
        transparent
        animationType="fade"
        visible={showUnlockModal}
        onRequestClose={() => setShowUnlockModal(false)}
      >
        <Pressable style={styles.modalBackdrop} onPress={() => setShowUnlockModal(false)}>
          <Pressable style={styles.modalCard} onPress={e => e.stopPropagation()}>
            <Text style={styles.modalTitle}>Unlock Difficulty</Text>
            {unlockTarget ? (
              <>
                <Text style={styles.modalSubtitle}>
                  {difficultyMeta[unlockTarget].label} - {difficultyMeta[unlockTarget].elo} Elo
                </Text>
                <Text style={styles.unlockDescription}>
                  {difficultyMeta[unlockTarget].blurb}
                </Text>
                <View style={styles.costRow}>
                  <Text style={styles.costLabel}>Cost:</Text>
                  <Text style={styles.costValue}>💰 {difficultyMeta[unlockTarget].cost} coins</Text>
                </View>
                <View style={styles.costRow}>
                  <Text style={styles.costLabel}>Your coins:</Text>
                  <Text style={[styles.costValue, coins < difficultyMeta[unlockTarget].cost && styles.costInsufficient]}>
                    💰 {coins} coins
                  </Text>
                </View>
                {coins >= difficultyMeta[unlockTarget].cost ? (
                  <Pressable style={styles.modalButton} onPress={handleUnlock}>
                    <Text style={styles.modalButtonText}>Unlock Now</Text>
                  </Pressable>
                ) : (
                  <Text style={styles.insufficientText}>
                    Not enough coins. Play more games to earn coins!
                  </Text>
                )}
                <Pressable
                  style={styles.modalCancelButton}
                  onPress={() => setShowUnlockModal(false)}
                >
                  <Text style={styles.modalCancelText}>Cancel</Text>
                </Pressable>
              </>
            ) : null}
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 18,
    padding: 20,
    backgroundColor: '#0f172a',
    borderRadius: 24,
  },
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 300,
  },
  loadingText: {
    color: palette.softWhite,
    marginTop: 16,
    fontSize: 14,
  },
  errorText: {
    color: palette.danger,
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'center',
  },
  errorSubtext: {
    color: palette.silver,
    fontSize: 13,
    marginTop: 8,
    textAlign: 'center',
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
  coinBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#1a2942',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#fbbf24',
  },
  coinText: {
    color: palette.neonYellow,
    fontSize: 14,
    fontWeight: '700',
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
    opacity: 0.7,
  },
  difficultyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  difficultyLabel: {
    color: palette.softWhite,
    fontSize: 15,
    fontWeight: '700',
  },
  difficultyLabelActive: {
    color: palette.neonPink,
  },
  eloLabel: {
    color: palette.neonGreen,
    fontSize: 12,
    fontWeight: '600',
  },
  difficultyBlurb: {
    color: '#94a3b8',
    fontSize: 12,
  },
  lockRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
  },
  lockGlyph: {
    fontSize: 14,
  },
  lockText: {
    color: '#fbbf24',
    fontSize: 12,
    fontWeight: '600',
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
    fontSize: 11,
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
    marginTop: 8,
  },
});
