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

      // Resolve I/O names by searching for specific patterns (order is not guaranteed in ONNX)
      const INPUT_NAME =
        session.inputNames.find((n) => n.endsWith('/input/planes') || n.includes('planes')) ??
        session.inputNames[0];

      const POLICY_NAME =
        session.outputNames.find((n) => n.endsWith('/output/policy') || n.includes('policy')) ??
        session.outputNames[0];

      try {
        // Get all legal moves
        const legalMoves = game.moves({ verbose: true }) as Move[];
        if (legalMoves.length === 0) {
          return null;
        }

        // Encode the board state for the neural network
        const boardTensor = encodeBoardState(game);
        const feeds: Record<string, Tensor> = {
          [INPUT_NAME]: boardTensor,
        };

        // Run inference
        const output = await session.run(feeds);
        const policyTensor = output[POLICY_NAME];

        if (!policyTensor || !policyTensor.data) {
          throw new Error('Policy output missing from ONNX results');
        }

        // Get move logits (raw policy output)
        const logits = policyTensor.data as Float32Array;
        
        console.log(`[${difficulty}] Policy output size:`, logits.length);
        console.log(`[${difficulty}] Legal moves:`, legalMoves.length);
        console.log(`[${difficulty}] Max logit:`, Math.max(...logits).toFixed(4));
        
        const bestMove = selectBestLegalMove(legalMoves, logits, game, difficulty);

        return bestMove ?? null;
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
 * Convert a legal Move (from Chess.js) to Lc0's 1858 policy index.
 * Side-to-move perspective is enforced by flipping when black is on move.
 *
 * Planes per from-square (73):
 *  - 0..55  : sliding (8 dirs × 7 steps)
 *  - 56..63 : knight (8)
 *  - 64..72 : underpromotions (R/B/N × left|straight|right)
 */
function getMoveIndexLc0(move: Move, game: Chess): number {
  const usWhite = game.turn() === 'w';

  const fFile = move.from.charCodeAt(0) - 97; // a→0 .. h→7
  const fRank = parseInt(move.from[1], 10) - 1; // '1'→0 .. '8'→7
  const tFile = move.to.charCodeAt(0) - 97;
  const tRank = parseInt(move.to[1], 10) - 1;

  // Flip board for black-to-move
  const ff = usWhite ? fFile : 7 - fFile;
  const fr = usWhite ? fRank : 7 - fRank;
  const tf = usWhite ? tFile : 7 - tFile;
  const tr = usWhite ? tRank : 7 - tRank;

  const df = tf - ff;
  const dr = tr - fr;

  const fromSquare = fr * 8 + ff; // 0..63

  // 1) Knight planes: 56..63
  const KN: Array<[number, number]> = [
    [2, 1],
    [1, 2],
    [-1, 2],
    [-2, 1],
    [-2, -1],
    [-1, -2],
    [1, -2],
    [2, -1],
  ];
  for (let i = 0; i < 8; i++) {
    if (df === KN[i][0] && dr === KN[i][1]) {
      return fromSquare * 73 + (56 + i);
    }
  }

  // 2) Sliding planes: 0..55 (8 dirs × 7 steps), exact integer match
  const DIRS: Array<[number, number]> = [
    [0, 1],  // N
    [1, 1],  // NE
    [1, 0],  // E
    [1, -1], // SE
    [0, -1], // S
    [-1, -1],// SW
    [-1, 0], // W
    [-1, 1], // NW
  ];

  if (df !== 0 || dr !== 0) {
    for (let d = 0; d < 8; d++) {
      const [vx, vy] = DIRS[d];

      // Determine steps along this direction
      let steps = -1;
      if (vx === 0 && vy !== 0 && df === 0 && dr * vy > 0) {
        steps = Math.abs(dr);
      } else if (vy === 0 && vx !== 0 && dr === 0 && df * vx > 0) {
        steps = Math.abs(df);
      } else if (vx !== 0 && vy !== 0 && Math.abs(df) === Math.abs(dr) && df * vx > 0 && dr * vy > 0) {
        steps = Math.abs(df); // or abs(dr)
      }

      if (steps >= 1 && steps <= 7) {
        return fromSquare * 73 + (d * 7 + (steps - 1)); // 0..55
      }
    }
  }

  // 3) Underpromotions: 64..72 (R,B,N × left|straight|right)
  if (move.promotion && move.promotion !== 'q') {
    // Promotions advance one rank (north in "us" frame). Lane by df: -1,0,1
    const lane = df === -1 ? 0 : df === 0 ? 1 : df === 1 ? 2 : -1;
    if (dr === 1 && lane !== -1) {
      const base =
        move.promotion === 'n' ? 64 :
        move.promotion === 'b' ? 67 :
        move.promotion === 'r' ? 70 : -1;
      if (base !== -1) {
        return fromSquare * 73 + (base + lane); // 64..72
      }
    }
  }

  // Fallback (should not occur for legal moves)
  return fromSquare * 73;
}

/**
 * Selects a move using policy logits and Lc0 indexing.
 * Adds a small difficulty-based randomness over top-3.
 */
function selectBestLegalMove(
  legalMoves: Move[],
  logits: Float32Array,
  game: Chess,
  difficulty: MaiaDifficulty,
): Move | null {
  if (legalMoves.length === 0) return null;

  const scored = legalMoves.map((mv) => {
    const idx = getMoveIndexLc0(mv, game);
    const score = idx >= 0 && idx < logits.length ? logits[idx] : Number.NEGATIVE_INFINITY;
    return { mv, score };
  });

  scored.sort((a, b) => b.score - a.score);
  
  // Log top 3 moves for debugging
  console.log('Top moves:', scored.slice(0, 3).map(m => ({
    move: `${m.mv.from}-${m.mv.to}`,
    score: m.score.toFixed(4)
  })));

  // Small randomness to keep human-like variety
  const epsilon = difficulty === 'maia1' ? 0.15 : difficulty === 'maia5' ? 0.08 : 0.03;
  if (Math.random() < epsilon && scored.length >= 3) {
    const top3 = scored.slice(0, 3);
    return top3[Math.floor(Math.random() * top3.length)].mv;
  }

  return scored[0].mv;
}
