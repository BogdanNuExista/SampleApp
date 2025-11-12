/**
 * Fixed Opening Book for Maia Chess AI
 * 
 * AI will randomly select ONE of these 10 openings at game start
 * and play its first 2 moves from that opening REGARDLESS of opponent's moves.
 * This creates variety while keeping the AI from reacting to unusual openings.
 */

export type FixedOpening = {
  name: string;
  move1: string; // Black's first move in UCI format
  move2: string; // Black's second move in UCI format
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
    console.log('[Fixed Opening] Completed 2 moves, switching to neural network');
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
    console.log(`[Fixed Opening] Selected: ${selectedOpening.name}`);
  }
  
  // Determine which move to play (move1 or move2)
  const move = blackMoveCount === 0 ? selectedOpening.move1 : selectedOpening.move2;
  
  console.log(`[Fixed Opening] ${selectedOpening.name} - Playing move ${blackMoveCount + 1}/2: ${move}`);
  
  return { move, opening: selectedOpening };
}
