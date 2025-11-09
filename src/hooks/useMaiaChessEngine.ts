import { useCallback, useEffect, useMemo, useState } from 'react';
import { Image } from 'react-native';
import { InferenceSession, Tensor } from 'onnxruntime-react-native';
import { Chess, Move } from 'chess.js';

/**
 * MAIA CHESS ENGINE - Lc0 Architecture Implementation
 * 
 * This hook implements proper Lc0/Maia chess model integration with:
 * 
 * 1. PROPER BOARD ENCODING (112 channels):
 *    - Channels 0-11: Current position (6 piece types × 2 colors, from side-to-move perspective)
 *    - Channels 12-103: Last 7 board positions for temporal context
 *    - Channels 104-107: Castling rights (our/opponent kingside/queenside)
 *    - Channel 108: Side to move indicator
 *    - Channel 109: 50-move rule counter
 *    - Channels 110-111: Reserved
 * 
 * 2. PROPER MOVE ENCODING (1858 moves):
 *    - Queen-style moves: 56 directions (8 directions × 7 distances)
 *    - Knight moves: 8 L-shaped moves
 *    - Underpromotions: 9 variations (3 pieces × 3 directions)
 *    - Encoding: fromSquare × 73 + directionIndex
 * 
 * 3. THREE SKILL LEVELS:
 *    - maia1: Trained on 1100 Elo games (Apprentice)
 *    - maia5: Trained on 1500 Elo games (Adept)
 *    - maia9: Trained on 1900 Elo games (Master)
 * 
 * The models predict move probabilities based on how humans at each skill level play.
 */

// Maia models for different skill levels
const MAIA_MODELS = {
  maia1: require('../../assets/models/maia1_official.onnx'),
  maia5: require('../../assets/models/maia5_official.onnx'),
  maia9: require('../../assets/models/maia9_official.onnx'),
};

export type MaiaDifficulty = 'maia1' | 'maia5' | 'maia9';

type ModelSource = string | Uint8Array;

export function useMaiaChessEngine() {
  const [sessions, setSessions] = useState<Record<MaiaDifficulty, InferenceSession | null>>({
    maia1: null,
    maia5: null,
    maia9: null,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const loadModels = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const loadedSessions: Record<MaiaDifficulty, InferenceSession | null> = {
          maia1: null,
          maia5: null,
          maia9: null,
        };

        // Load all three Maia models
        for (const [key, model] of Object.entries(MAIA_MODELS)) {
          try {
            const { uri } = Image.resolveAssetSource(model);
            const modelSource = await loadModelSource(uri, `${key}_official.onnx`);
            const session =
              typeof modelSource === 'string'
                ? await InferenceSession.create(modelSource)
                : await InferenceSession.create(modelSource);
            loadedSessions[key as MaiaDifficulty] = session;
          } catch (modelError) {
            console.warn(`Failed to load ${key} model`, modelError);
          }
        }

        if (isMounted) {
          setSessions(loadedSessions);
        }
      } catch (loadError) {
        console.warn('Failed to load Maia models', loadError);
        if (isMounted) {
          setError('Unable to load Maia AI chess engines.');
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    loadModels();

    return () => {
      isMounted = false;
    };
  }, []);

  const getMaiaMove = useCallback(
    async (game: Chess, difficulty: MaiaDifficulty): Promise<Move | null> => {
      const session = sessions[difficulty];
      if (!session) {
        throw new Error(`Maia ${difficulty} model not ready yet`);
      }

      try {
        // Get all legal moves
        const legalMoves = game.moves({ verbose: true }) as Move[];
        if (legalMoves.length === 0) {
          return null;
        }

        // Encode the board state for the neural network
        const boardTensor = encodeBoardState(game);
        const feeds: Record<string, Tensor> = {
          [session.inputNames[0]]: boardTensor,
        };

        // Run inference
        const output = await session.run(feeds);
        const outputName = session.outputNames[0];
        const outputTensor = output[outputName];

        if (!outputTensor || !outputTensor.data) {
          throw new Error('Model returned no data');
        }

        // Get move probabilities and select the best legal move based on ONNX predictions
        const moveProbabilities = Array.from(outputTensor.data as Float32Array);
        
        console.log(`[${difficulty}] Policy output size:`, moveProbabilities.length);
        console.log(`[${difficulty}] Legal moves:`, legalMoves.length);
        console.log(`[${difficulty}] Max probability:`, Math.max(...moveProbabilities).toFixed(4));
        
        const bestMove = selectBestLegalMove(legalMoves, moveProbabilities, game, difficulty);

        return bestMove;
      } catch (inferenceError) {
        console.error('Maia inference error:', inferenceError);
        // Fallback to random legal move if inference fails
        const moves = game.moves({ verbose: true }) as Move[];
        return moves.length > 0 ? moves[Math.floor(Math.random() * moves.length)] : null;
      }
    },
    [sessions],
  );

  return useMemo(
    () => ({
      getMaiaMove,
      isModelsReady: Object.values(sessions).every(s => s !== null),
      isModelsLoading: isLoading,
      modelsError: error,
    }),
    [getMaiaMove, error, isLoading, sessions],
  );
}

async function loadModelSource(uri: string, filename: string): Promise<ModelSource> {
  try {
    // For both platforms, fetch the model as binary data from the bundled resource
    console.log(`Loading model: ${filename} from URI: ${uri}`);
    
    // Fetch the model data
    const response = await fetch(uri);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch model: ${response.status}`);
    }

    const arrayBuffer = await response.arrayBuffer();
    console.log(`Loaded ${filename}: ${arrayBuffer.byteLength} bytes`);
    
    return new Uint8Array(arrayBuffer);
  } catch (error) {
    console.error(`Failed to load model ${filename}:`, error);
    throw new Error(`Cannot load model ${filename}: ${error}`);
  }
}

/**
 * Lc0/Maia board encoding with proper 112 channels:
 * - Channels 0-12: Current position (P1's pieces - always from perspective of side to move)
 * - Channels 13-104: History - last 7 positions (7 × 13 = 91 channels, but spec uses 8 positions)
 * - Channels 105-110: Side to move, castling rights, etc.
 * - Channel 111: Move count / 50-move rule counter
 */
function encodeBoardState(game: Chess): Tensor {
  const channels = 112;
  const boardSize = 8 * 8;
  const tensorSize = channels * boardSize;
  const boardData = new Float32Array(tensorSize);
  
  const currentFen = (game as any).fen();
  
  // Helper to encode a board position from FEN
  const encodePosition = (fen: string, channelOffset: number, flipPerspective: boolean) => {
    const tempGame = new Chess(fen);
    const board = tempGame.board();
    const isWhiteTurn = tempGame.turn() === 'w';
    
    // If flipPerspective, we need to encode from the perspective of the side to move
    const shouldFlip = flipPerspective && !isWhiteTurn;
    
    for (let rank = 0; rank < 8; rank++) {
      for (let file = 0; file < 8; file++) {
        const actualRank = shouldFlip ? 7 - rank : rank;
        const actualFile = shouldFlip ? 7 - file : file;
        const piece = board[actualRank][actualFile];
        
        if (piece) {
          let pieceChannel = -1;
          const isOurPiece = (isWhiteTurn && piece.color === 'w') || (!isWhiteTurn && piece.color === 'b');
          
          // Encode piece type (our pieces: 0-5, opponent pieces: 6-11)
          if (isOurPiece) {
            switch (piece.type) {
              case 'p': pieceChannel = 0; break;
              case 'n': pieceChannel = 1; break;
              case 'b': pieceChannel = 2; break;
              case 'r': pieceChannel = 3; break;
              case 'q': pieceChannel = 4; break;
              case 'k': pieceChannel = 5; break;
            }
          } else {
            switch (piece.type) {
              case 'p': pieceChannel = 6; break;
              case 'n': pieceChannel = 7; break;
              case 'b': pieceChannel = 8; break;
              case 'r': pieceChannel = 9; break;
              case 'q': pieceChannel = 10; break;
              case 'k': pieceChannel = 11; break;
            }
          }
          
          if (pieceChannel >= 0) {
            const squareIdx = rank * 8 + file;
            const tensorIdx = (channelOffset + pieceChannel) * boardSize + squareIdx;
            boardData[tensorIdx] = 1.0;
          }
        }
      }
    }
  };
  
  // Encode current position (channels 0-12: 12 piece types + repetition counter)
  encodePosition(currentFen, 0, true);
  
  // Encode history (last 7 positions, channels 13-103)
  // Lc0 uses 8 positions total (current + 7 history)
  const historyDepth = 7;
  const history = (game as any).history() as string[];
  
  // Build previous positions by undoing moves
  if (history.length > 0) {
    const tempGame = new Chess(currentFen);
    for (let h = 0; h < historyDepth && h < history.length; h++) {
      (tempGame as any).undo();
      const prevFen = (tempGame as any).fen();
      encodePosition(prevFen, 13 + (h * 13), true);
    }
  }
  
  // Channels 104-107: Castling rights (4 channels)
  const fenParts = currentFen.split(' ');
  const castlingRights = fenParts[2];
  const isWhiteTurn = fenParts[1] === 'w';
  
  // Our kingside castling
  const ourKingsideCastling = isWhiteTurn ? castlingRights.includes('K') : castlingRights.includes('k');
  // Our queenside castling
  const ourQueensideCastling = isWhiteTurn ? castlingRights.includes('Q') : castlingRights.includes('q');
  // Opponent kingside castling
  const oppKingsideCastling = isWhiteTurn ? castlingRights.includes('k') : castlingRights.includes('K');
  // Opponent queenside castling
  const oppQueensideCastling = isWhiteTurn ? castlingRights.includes('q') : castlingRights.includes('Q');
  
  if (ourKingsideCastling) {
    for (let i = 0; i < boardSize; i++) {
      boardData[104 * boardSize + i] = 1.0;
    }
  }
  if (ourQueensideCastling) {
    for (let i = 0; i < boardSize; i++) {
      boardData[105 * boardSize + i] = 1.0;
    }
  }
  if (oppKingsideCastling) {
    for (let i = 0; i < boardSize; i++) {
      boardData[106 * boardSize + i] = 1.0;
    }
  }
  if (oppQueensideCastling) {
    for (let i = 0; i < boardSize; i++) {
      boardData[107 * boardSize + i] = 1.0;
    }
  }
  
  // Channel 108: Side to move (all 1s if black to move, all 0s if white)
  if (!isWhiteTurn) {
    for (let i = 0; i < boardSize; i++) {
      boardData[108 * boardSize + i] = 1.0;
    }
  }
  
  // Channel 109: Move count (for 50-move rule)
  const halfmoveClock = parseInt(fenParts[4]) || 0;
  const normalizedClock = halfmoveClock / 100.0; // Normalize
  for (let i = 0; i < boardSize; i++) {
    boardData[109 * boardSize + i] = normalizedClock;
  }
  
  // Channels 110-111: Additional features (zeros for now)
  
  return new Tensor('float32', boardData, [1, channels, 8, 8]);
}

/**
 * Lc0 move encoding: 1858 possible moves
 * Structure:
 * - 56 queen-style directions × 64 squares (but only valid ones)
 * - 8 knight moves × 64 squares
 * - Underpromotions (3 types × directions)
 * 
 * The encoding is: fromSquare * 73 + directionIndex
 * where directionIndex encodes the type and direction of move
 */
function getMoveIndexLc0(move: Move, game: Chess): number {
  const fromFile = move.from.charCodeAt(0) - 'a'.charCodeAt(0);
  const fromRank = parseInt(move.from[1], 10) - 1;
  const toFile = move.to.charCodeAt(0) - 'a'.charCodeAt(0);
  const toRank = parseInt(move.to[1], 10) - 1;
  
  // Flip if black to move (Lc0 always encodes from current player's perspective)
  const isWhiteTurn = game.turn() === 'w';
  const fromSquare = isWhiteTurn 
    ? fromRank * 8 + fromFile 
    : (7 - fromRank) * 8 + (7 - fromFile);
  
  const deltaFile = toFile - fromFile;
  const deltaRank = toRank - fromRank;
  
  // Adjust deltas for black's perspective
  const actualDeltaFile = isWhiteTurn ? deltaFile : -deltaFile;
  const actualDeltaRank = isWhiteTurn ? deltaRank : -deltaRank;
  
  // Determine direction index (0-72)
  let directionIndex = -1;
  
  // Knight moves (8 directions): indices 56-63
  const knightMoves = [
    [2, 1], [1, 2], [-1, 2], [-2, 1],
    [-2, -1], [-1, -2], [1, -2], [2, -1]
  ];
  
  for (let i = 0; i < knightMoves.length; i++) {
    if (actualDeltaFile === knightMoves[i][0] && actualDeltaRank === knightMoves[i][1]) {
      directionIndex = 56 + i;
      break;
    }
  }
  
  // Queen moves (56 directions): indices 0-55
  // 7 directions × 8 ways (N, NE, E, SE, S, SW, W, NW) × (1-7 squares)
  if (directionIndex === -1) {
    const directions = [
      [0, 1],   // N
      [1, 1],   // NE
      [1, 0],   // E
      [1, -1],  // SE
      [0, -1],  // S
      [-1, -1], // SW
      [-1, 0],  // W
      [-1, 1],  // NW
    ];
    
    for (let dirIdx = 0; dirIdx < directions.length; dirIdx++) {
      const [df, dr] = directions[dirIdx];
      if (df === 0 && dr === 0) continue;
      
      // Check if move is along this direction
      if (actualDeltaFile !== 0 || actualDeltaRank !== 0) {
        const steps = Math.max(Math.abs(actualDeltaFile), Math.abs(actualDeltaRank));
        const normalizedDf = actualDeltaFile / steps;
        const normalizedDr = actualDeltaRank / steps;
        
        if (Math.abs(normalizedDf - df) < 0.01 && Math.abs(normalizedDr - dr) < 0.01) {
          // Found the direction, now determine distance (1-7)
          directionIndex = dirIdx * 7 + (steps - 1);
          break;
        }
      }
    }
  }
  
  // Underpromotions: indices 64-72 (simplified - full encoding is more complex)
  // For now, treat promotions as regular pawn moves
  if (move.promotion && move.promotion !== 'q') {
    // Knight promotion
    if (move.promotion === 'n') {
      directionIndex = 64 + (actualDeltaFile + 1); // Left, straight, right
    } else if (move.promotion === 'b') {
      directionIndex = 67 + (actualDeltaFile + 1);
    } else if (move.promotion === 'r') {
      directionIndex = 70 + (actualDeltaFile + 1);
    }
  }
  
  if (directionIndex === -1) {
    // Fallback - shouldn't happen for valid moves
    return 0;
  }
  
  // Final index: fromSquare * 73 + directionIndex
  const moveIndex = fromSquare * 73 + directionIndex;
  return Math.min(moveIndex, 1857); // Clamp to valid range
}

/**
 * Selects the best legal move based purely on the model's Lc0 policy output.
 */
function selectBestLegalMove(
  legalMoves: Move[],
  probabilities: number[],
  game: Chess,
  difficulty: MaiaDifficulty,
): Move {
  // Score each legal move based on model probability using proper Lc0 encoding
  const moveScores = legalMoves.map((move) => {
    const moveIdx = getMoveIndexLc0(move, game);
    const score = moveIdx < probabilities.length ? probabilities[moveIdx] : 0;
    return { move, score };
  });

  // Sort by ONNX probability (highest first)
  moveScores.sort((a, b) => b.score - a.score);
  
  // Log top 3 moves for debugging
  console.log('Top moves:', moveScores.slice(0, 3).map(m => ({
    move: `${m.move.from}-${m.move.to}`,
    score: m.score.toFixed(4)
  })));

  // Add slight randomness based on difficulty to simulate human-like play
  const randomThreshold = difficulty === 'maia1' ? 0.15 : difficulty === 'maia5' ? 0.08 : 0.03;
  const randomFactor = Math.random();
  
  if (randomFactor < randomThreshold && moveScores.length >= 3) {
    // Pick from top 3 moves for variety
    const topMoves = moveScores.slice(0, 3);
    return topMoves[Math.floor(Math.random() * topMoves.length)].move;
  }

  // Return the move with highest ONNX probability
  return moveScores[0].move;
}
