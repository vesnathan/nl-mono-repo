import { useState, useCallback, useEffect } from "react";
import { PlayerHand } from "@/types/gameState";
import { calculateStreakPoints } from "@/utils/scoreCalculation";

/**
 * Custom hook for managing player hand, chips, betting, and scoring state
 *
 * @returns Player state and scoring functions
 */
export function usePlayerHand() {
  // Chip and betting state
  const [playerChips, setPlayerChips] = useState(1000);
  const [playerHand, setPlayerHand] = useState<PlayerHand>({
    cards: [],
    bet: 0,
  });
  const [currentBet, setCurrentBet] = useState(0); // Temporary bet being placed
  const [previousBet, setPreviousBet] = useState(10); // Track previous bet for bet spread detection
  const [minBet] = useState(5);
  const [maxBet] = useState(500);

  // Scoring state
  const [currentScore, setCurrentScore] = useState(0);
  const [currentStreak, setCurrentStreak] = useState(0); // Consecutive correct decisions
  const [longestStreak, setLongestStreak] = useState(0);
  const [peakChips, setPeakChips] = useState(1000);
  const [scoreMultiplier] = useState(1.0); // 1.0x - 2.0x based on counting accuracy

  /**
   * Award points for a correct decision and update streak
   * Uses exponential scoring: 10 * 2^(streak-1)
   */
  const awardCorrectDecisionPoints = useCallback(() => {
    const newStreak = currentStreak + 1;
    const basePoints = calculateStreakPoints(newStreak);
    const pointsWithMultiplier = Math.floor(basePoints * scoreMultiplier);

    setCurrentStreak(newStreak);
    setCurrentScore((prev) => prev + pointsWithMultiplier);

    // Update longest streak
    if (newStreak > longestStreak) {
      setLongestStreak(newStreak);
    }
  }, [currentStreak, scoreMultiplier, longestStreak]);

  /**
   * Reset streak on incorrect decision
   */
  const resetStreak = useCallback(() => {
    setCurrentStreak(0);
  }, []);

  /**
   * Reset player hand and betting state for new round
   */
  const resetHand = useCallback(() => {
    setPlayerHand({ cards: [], bet: 0 });
    setCurrentBet(0);
  }, []);

  // Update peak chips whenever chips change
  useEffect(() => {
    if (playerChips > peakChips) {
      setPeakChips(playerChips);
    }
  }, [playerChips, peakChips]);

  return {
    // Chip and betting
    playerChips,
    setPlayerChips,
    playerHand,
    setPlayerHand,
    currentBet,
    setCurrentBet,
    previousBet,
    setPreviousBet,
    minBet,
    maxBet,

    // Scoring
    currentScore,
    setCurrentScore,
    currentStreak,
    setCurrentStreak,
    longestStreak,
    setLongestStreak,
    peakChips,
    setPeakChips,
    scoreMultiplier,

    // Functions
    awardCorrectDecisionPoints,
    resetStreak,
    resetHand,
  };
}
