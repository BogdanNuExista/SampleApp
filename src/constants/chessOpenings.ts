/**
 * Fixed Opening Book for Maia Chess AI
 * 
 * AI will randomly select ONE of these 10 openings at game start
 * and play its first 2 moves from that opening REGARDLESS of opponent's moves.
 * This creates variety while keeping the AI from reacting to unusual openings.
 */

export type FixedOpening = {
  name: string;
  move1: string; // First move in UCI format
  move2: string; // Second move in UCI format
  description: string;
};

/**
 * Fixed set of 10 openings that the AI will randomly choose from.
 * The AI commits to ONE opening at game start and plays those 2 moves
 * no matter what the opponent does.
 */
export const FIXED_OPENINGS: FixedOpening[] = [
  {
    name: 'Sicilian Defense',
    move1: 'c7c5',
    move2: 'd7d6',
    description: 'Solid and flexible Sicilian setup',
  },
  {
    name: 'French Defense',
    move1: 'e7e6',
    move2: 'd7d5',
    description: 'Solid pawn chain defense',
  },
  {
    name: 'Caro-Kann Defense',
    move1: 'c7c6',
    move2: 'd7d5',
    description: 'Very solid and reliable',
  },
  {
    name: 'Pirc Defense',
    move1: 'd7d6',
    move2: 'g7g6',
    description: 'Flexible fianchetto setup',
  },
  {
    name: 'Modern Defense',
    move1: 'g7g6',
    move2: 'd7d6',
    description: 'Hypermodern fianchetto',
  },
  {
    name: 'Alekhine Defense',
    move1: 'g8f6',
    move2: 'd7d6',
    description: 'Provocative knight move',
  },
  {
    name: 'Scandinavian Defense',
    move1: 'd7d5',
    move2: 'd8d6',
    description: 'Immediate center challenge',
  },
  {
    name: 'Nimzowitsch Defense',
    move1: 'b8c6',
    move2: 'd7d6',
    description: 'Unusual but playable',
  },
  {
    name: "King's Pawn",
    move1: 'e7e5',
    move2: 'g8f6',
    description: 'Classical open game',
  },
  {
    name: "King's Indian Setup",
    move1: 'g7g6',
    move2: 'f8g7',
    description: 'Fianchetto with bishop development',
  },
];

/**
 * Fixed White openings, used when Maia plays White (the player chose Black).
 * The second move is chosen to stay legal no matter what Black replies
 * (knight developments / central pawn pushes that can't be blocked in one move).
 */
export const WHITE_OPENINGS: FixedOpening[] = [
  { name: "King's Knight", move1: 'e2e4', move2: 'g1f3', description: 'Classical open game' },
  { name: 'Vienna Game', move1: 'e2e4', move2: 'b1c3', description: 'Flexible knight development' },
  { name: 'Center Game', move1: 'e2e4', move2: 'd2d4', description: 'Grab the full center' },
  { name: "Queen's Pawn", move1: 'd2d4', move2: 'g1f3', description: 'Solid queen-pawn setup' },
  { name: 'London System', move1: 'd2d4', move2: 'c1f4', description: 'Easy bishop development' },
  { name: "Queen's Gambit", move1: 'd2d4', move2: 'c2c4', description: 'Challenge the center' },
  { name: 'English Opening', move1: 'c2c4', move2: 'b1c3', description: 'Flank control' },
  { name: 'Réti Opening', move1: 'g1f3', move2: 'c2c4', description: 'Hypermodern flexibility' },
  { name: "King's Indian Attack", move1: 'g1f3', move2: 'g2g3', description: 'Kingside fianchetto' },
  { name: "Bird's Opening", move1: 'f2f4', move2: 'g1f3', description: 'Aggressive flank push' },
];

/**
 * Get White's move from the fixed opening book (Maia playing White).
 * Mirrors getFixedOpeningMove but for the side that moves first.
 *
 * @param moveHistory Array of UCI moves played so far
 * @param selectedOpening The opening committed at game start (or null)
 */
export function getFixedWhiteOpeningMove(
  moveHistory: string[],
  selectedOpening: FixedOpening | null,
): { move: string | null; opening: FixedOpening | null } {
  // White moves on even ply counts (0, 2). White's move count so far:
  const whiteMoveCount = Math.floor(moveHistory.length / 2);

  if (whiteMoveCount >= 2) {
    return { move: null, opening: selectedOpening };
  }
  // Must actually be White's turn (even number of moves played).
  if (moveHistory.length % 2 !== 0) {
    return { move: null, opening: selectedOpening };
  }
  if (selectedOpening === null) {
    selectedOpening = WHITE_OPENINGS[Math.floor(Math.random() * WHITE_OPENINGS.length)];
  }
  const move = whiteMoveCount === 0 ? selectedOpening.move1 : selectedOpening.move2;
  return { move, opening: selectedOpening };
}

/**
 * Get the AI's move from the fixed opening book.
 *
 * This function is called ONLY when it's Black's turn (Maia's turn).
 * The opening is selected randomly at the start and the AI commits to it
 * for exactly 2 moves, regardless of what White plays.
 * 
 * @param moveHistory Array of UCI moves played so far (e.g., ['e2e4', 'e7e5'])
 * @param selectedOpening The opening that was randomly selected at game start (or null if not selected yet)
 * @returns An object with the move and the selected opening
 */
export function getFixedOpeningMove(
  moveHistory: string[],
  selectedOpening: FixedOpening | null
): { move: string | null; opening: FixedOpening | null } {
  // Count how many moves Black (AI) has made
  const blackMoveCount = Math.floor(moveHistory.length / 2);
  
  // Only use opening book for Black's first 2 moves
  if (blackMoveCount >= 2) {
    return { move: null, opening: selectedOpening };
  }
  
  // Make sure it's actually Black's turn
  if (moveHistory.length % 2 === 0) {
    console.warn('[Fixed Opening] Called on White\'s turn');
    return { move: null, opening: selectedOpening };
  }
  
  // If no opening selected yet, pick a random one
  if (selectedOpening === null) {
    selectedOpening = FIXED_OPENINGS[Math.floor(Math.random() * FIXED_OPENINGS.length)];
  }

  // Determine which move to play (move1 or move2)
  const move = blackMoveCount === 0 ? selectedOpening.move1 : selectedOpening.move2;

  return { move, opening: selectedOpening };
}
