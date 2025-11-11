import { StrategyAction } from "@/types/game";

/**
 * Exponential Scoring System
 *
 * Formula: Points = BasePoints × 2^(N-1) × Multiplier
 *
 * Where:
 * - BasePoints = 10
 * - N = Position in streak (1, 2, 3, ...)
 * - Multiplier = 1.0 - 2.0 (resets to 1.0 on count peek)
 *
 * Examples:
 * - 1st correct decision: 10 × 2^0 = 10 points
 * - 2nd correct decision: 10 × 2^1 = 20 points
 * - 3rd correct decision: 10 × 2^2 = 40 points
 * - 4th correct decision: 10 × 2^3 = 80 points
 * - 5th correct decision: 10 × 2^4 = 160 points
 *
 * With 2.0x multiplier:
 * - 5th correct decision: 10 × 2^4 × 2.0 = 320 points
 */

const BASE_POINTS = 10;
const MIN_MULTIPLIER = 1.0;
const MAX_MULTIPLIER = 2.0;
const MULTIPLIER_INCREMENT = 0.1; // Increase per correct action without peeking

/**
 * Calculate points for a correct action
 * @param streakPosition Current position in streak (1-based)
 * @param multiplier Current score multiplier
 * @returns Points earned
 */
export function calculatePoints(
  streakPosition: number,
  multiplier: number,
): number {
  if (streakPosition < 1) return 0;

  const exponentialBonus = 2 ** (streakPosition - 1);
  const points = BASE_POINTS * exponentialBonus * multiplier;

  return Math.round(points);
}

/**
 * Calculate points for an incorrect action (negative)
 * @param streakPosition Position where streak was broken
 * @returns Negative points
 */
export function calculateIncorrectPenalty(streakPosition: number): number {
  // Penalty is half the points they would have earned
  const wouldHaveEarned = calculatePoints(streakPosition, 1.0);
  return -Math.floor(wouldHaveEarned / 2);
}

/**
 * Increase score multiplier (for consecutive correct actions without peeking)
 * @param currentMultiplier Current multiplier value
 * @returns New multiplier value
 */
export function increaseMultiplier(currentMultiplier: number): number {
  return Math.min(MAX_MULTIPLIER, currentMultiplier + MULTIPLIER_INCREMENT);
}

/**
 * Reset score multiplier (when user peeks at count)
 * @returns Reset multiplier value
 */
export function resetMultiplier(): number {
  return MIN_MULTIPLIER;
}

/**
 * Compare player action with optimal strategy
 * @param playerAction Action taken by player
 * @param optimalAction Optimal action from basic strategy
 * @returns True if actions match
 */
export function isCorrectAction(
  playerAction: StrategyAction,
  optimalAction: StrategyAction,
): boolean {
  // Direct match
  if (playerAction === optimalAction) return true;

  // Double is optimal but player can hit instead (acceptable)
  if (optimalAction === "D" && playerAction === "H") return true;

  // Surrender is optimal but player can hit instead (acceptable)
  if (optimalAction === "SU" && playerAction === "H") return true;

  return false;
}

/**
 * Calculate score update after player action
 * @param playerAction Action taken by player
 * @param optimalAction Optimal action from basic strategy
 * @param currentStreak Current streak count
 * @param currentMultiplier Current score multiplier
 * @returns Score delta and new streak/multiplier values
 */
export function calculateScoreUpdate(
  playerAction: StrategyAction,
  optimalAction: StrategyAction,
  currentStreak: number,
  currentMultiplier: number,
): {
  scoreDelta: number;
  newStreak: number;
  newMultiplier: number;
  isCorrect: boolean;
} {
  const correct = isCorrectAction(playerAction, optimalAction);

  if (correct) {
    const newStreak = currentStreak + 1;
    const newMultiplier = increaseMultiplier(currentMultiplier);
    const scoreDelta = calculatePoints(newStreak, currentMultiplier);

    return {
      scoreDelta,
      newStreak,
      newMultiplier,
      isCorrect: true,
    };
  }
  const scoreDelta = calculateIncorrectPenalty(currentStreak + 1);

  return {
    scoreDelta,
    newStreak: 0, // Reset streak
    newMultiplier: currentMultiplier, // Keep multiplier (only resets on peek)
    isCorrect: false,
  };
}

/**
 * Calculate chips change for count peek
 * According to MULTIPLAYER-SCORING.md:
 * - Count peek costs 10 chips
 * - Resets score multiplier to 1.0
 */
export const COUNT_PEEK_COST = 10;

/**
 * Calculate chips change for strategy peek
 * According to MULTIPLAYER-SCORING.md:
 * - Strategy peek costs 10 chips
 * - Does NOT reset multiplier
 */
export const STRATEGY_PEEK_COST = 10;

/**
 * Get streak milestone message
 * @param streak Current streak count
 * @returns Message to display (or null)
 */
export function getStreakMilestone(streak: number): string | null {
  const milestones: Record<number, string> = {
    5: "5-Hand Streak! +50 Bonus",
    10: "10-Hand Streak! +100 Bonus",
    15: "15-Hand Streak! +200 Bonus",
    20: "20-Hand Streak! +400 Bonus",
    25: "25-Hand Streak! +800 Bonus",
  };

  return milestones[streak] || null;
}

/**
 * Calculate bonus points for streak milestones
 * @param streak Current streak count
 * @returns Bonus points (or 0)
 */
export function getStreakBonus(streak: number): number {
  const bonuses: Record<number, number> = {
    5: 50,
    10: 100,
    15: 200,
    20: 400,
    25: 800,
  };

  return bonuses[streak] || 0;
}

/**
 * Format score for display
 * @param score Current score
 * @returns Formatted score string
 */
export function formatScore(score: number): string {
  if (score >= 0) {
    return `+${score.toLocaleString()}`;
  }
  return score.toLocaleString();
}

/**
 * Format multiplier for display
 * @param multiplier Current multiplier
 * @returns Formatted multiplier string (e.g., "1.5x")
 */
export function formatMultiplier(multiplier: number): string {
  return `${multiplier.toFixed(1)}x`;
}

/**
 * Calculate expected value (EV) for a hand
 * This is for educational purposes - showing why basic strategy works
 * @param playerAction Action taken
 * @param optimalAction Optimal action
 * @returns EV estimate in chips
 */
export function calculateExpectedValue(
  playerAction: StrategyAction,
  optimalAction: StrategyAction,
): number {
  // Simplified EV calculation
  // Optimal action has EV of 0 (break-even or slight advantage)
  // Wrong action has negative EV

  if (isCorrectAction(playerAction, optimalAction)) {
    return 0; // Optimal play = 0 EV (long-term break-even)
  }

  // Wrong action = estimated -5% EV penalty
  return -0.05;
}
