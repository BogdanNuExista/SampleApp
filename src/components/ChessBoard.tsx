import React from 'react';
import { Image, Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { Piece } from 'chess.js';
import { pieceImages, ChessPieceKey, fileLabels } from '../constants/chessAssets';
import { palette } from '../theme/colors';

const rankLabels = [8, 7, 6, 5, 4, 3, 2, 1];
const fileLetters = fileLabels.split('');

type Props = {
  boardState: (Piece | null)[][];
  selectedSquare: string | null;
  legalTargets: string[];
  onSquarePress: (square: string) => void;
  /** Whose pieces sit at the bottom. 'white' (default) or 'black' to flip. */
  orientation?: 'white' | 'black';
};

/**
 * Shared 8x8 chess board with rank/file labels, selection highlight, and
 * legal-move indicators. Used by NeonChessArena and MaiaChessArena. The
 * `orientation` prop flips the view so the player can play either color.
 */
export function ChessBoard({
  boardState,
  selectedSquare,
  legalTargets,
  onSquarePress,
  orientation = 'white',
}: Props) {
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

  // board() always yields rank 8..1 (index 0 = rank 8) and files a..h. For a
  // black-oriented view we walk ranks and files in reverse display order while
  // keeping the underlying board indices (so square identity stays correct).
  const rankOrder = orientation === 'black' ? [7, 6, 5, 4, 3, 2, 1, 0] : [0, 1, 2, 3, 4, 5, 6, 7];
  const fileOrder = orientation === 'black' ? [7, 6, 5, 4, 3, 2, 1, 0] : [0, 1, 2, 3, 4, 5, 6, 7];

  return (
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
        {rankOrder.map(rankIndex => (
          <View key={`rank-${rankIndex}`} style={[styles.boardRow, { height: squareSize }]}>
            <View style={[styles.rankCell, { width: rankLabelWidth, height: squareSize }]}>
              <Text style={styles.rankLabel}>{rankLabels[rankIndex]}</Text>
            </View>
            {fileOrder.map(fileIndex => {
              const piece = boardState[rankIndex][fileIndex];
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
                    { width: squareSize, height: squareSize },
                    isDark && styles.squareDark,
                    isSelected && styles.squareSelected,
                  ]}
                  onPress={() => onSquarePress(square)}
                >
                  {pieceKey ? (
                    <Image source={pieceImages[pieceKey]} style={{ width: pieceSize, height: pieceSize }} />
                  ) : null}
                  {!pieceKey && isTarget ? (
                    <View
                      style={[
                        styles.targetDot,
                        { width: targetDotSize, height: targetDotSize, borderRadius: targetDotSize / 2 },
                      ]}
                    />
                  ) : null}
                  {pieceKey && isTarget ? (
                    <View
                      style={[
                        styles.captureRing,
                        { width: captureRingSize, height: captureRingSize, borderRadius: captureRingSize / 2 },
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
        {fileOrder.map(fileIndex => (
          <View key={fileIndex} style={[styles.fileCell, { width: squareSize, height: fileLabelHeight }]}>
            <Text style={styles.fileLabel}>{fileLetters[fileIndex].toUpperCase()}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
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
});
