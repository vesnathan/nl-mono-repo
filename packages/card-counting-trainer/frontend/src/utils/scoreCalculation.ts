/**
 * Calculate points awarded for a correct decision based on current streak
 * Uses exponential growth: 10 * 2^(streak - 1)
 * Streak 1 = 10 points, Streak 2 = 20 points, Streak 3 = 40 points, etc.
 *
 * @param streakNumber - Current streak count (1-indexed)
 * @returns Points awarded for this streak level
 */
export function calculateStreakPoints(streakNumber: number): number {
  return 10 * 2 ** (streakNumber - 1);
}

/**
 * Calculate points with multiplier applied
 *
 * @param streakNumber - Current streak count
 * @param scoreMultiplier - Multiplier based on counting accuracy (1.0 - 2.0)
 * @returns Final points awarded
 */
export function calculatePointsWithMultiplier(
  streakNumber: number,
  scoreMultiplier: number,
): number {
  const basePoints = calculateStreakPoints(streakNumber);
  return Math.floor(basePoints * scoreMultiplier);
}
