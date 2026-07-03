// XP / level progression curve.
//
// XP required to advance FROM level L TO level L+1 is `XP_STEP * L`, so:
//   L1->L2 = 100, L2->L3 = 200, L3->L4 = 300, ...
// Cumulative XP required to REACH level L is therefore:
//   totalXpForLevel(L) = XP_STEP * (L - 1) * L / 2
// Level 1 starts at 0 XP.

export const XP_STEP = 100;

/** Total cumulative XP required to reach the start of a given level (level >= 1). */
export function totalXpForLevel(level: number): number {
  const L = Math.max(1, Math.floor(level));
  return (XP_STEP * (L - 1) * L) / 2;
}

/** The current level for a given amount of total XP. */
export function levelForXp(xp: number): number {
  const safeXp = Math.max(0, xp);
  // Solve XP_STEP*(L-1)*L/2 <= xp  ->  L = floor((1 + sqrt(1 + 8*xp/XP_STEP)) / 2)
  const level = Math.floor((1 + Math.sqrt(1 + (8 * safeXp) / XP_STEP)) / 2);
  return Math.max(1, level);
}

export type LevelProgress = {
  level: number;
  /** XP accumulated within the current level. */
  xpIntoLevel: number;
  /** XP needed to span the current level (from this level to the next). */
  xpForThisLevel: number;
  /** Fraction in [0, 1] of progress toward the next level. */
  progress: number;
  /** Total XP still required to reach the next level. */
  xpToNextLevel: number;
};

/** Full breakdown of where a given XP total sits within the level curve. */
export function levelProgress(xp: number): LevelProgress {
  const safeXp = Math.max(0, xp);
  const level = levelForXp(safeXp);
  const floorXp = totalXpForLevel(level);
  const nextXp = totalXpForLevel(level + 1);
  const xpForThisLevel = nextXp - floorXp;
  const xpIntoLevel = safeXp - floorXp;
  return {
    level,
    xpIntoLevel,
    xpForThisLevel,
    progress: xpForThisLevel > 0 ? Math.min(1, xpIntoLevel / xpForThisLevel) : 0,
    xpToNextLevel: Math.max(0, nextXp - safeXp),
  };
}
