import { useEffect, useRef } from "react";
import { DealerCharacter } from "@/data/dealerCharacters";
import { increaseDealerSuspicion } from "./useDealerSuspicion";

interface ParticipationRecord {
  handNumber: number;
  participated: boolean; // true if player bet, false if sat out
  trueCount: number;
  betAmount?: number;
}

interface UseWongingDetectionParams {
  handNumber: number;
  playerSeat: number | null;
  playerBet: number;
  trueCount: number;
  currentDealer: DealerCharacter | null;
  initialized: boolean;
  phase: string;
  setDealerSuspicion: (suspicion: number | ((prev: number) => number)) => void;
}

/**
 * Hook to detect "wonging" behavior - betting high when count is favorable,
 * sitting out when count is unfavorable
 *
 * This is a major tell for card counters and increases dealer suspicion
 */
export function useWongingDetection({
  handNumber,
  playerSeat,
  playerBet,
  trueCount,
  currentDealer,
  initialized,
  phase,
  setDealerSuspicion,
}: UseWongingDetectionParams) {
  // Track last 20 hands of participation
  const participationHistory = useRef<ParticipationRecord[]>([]);
  const lastRecordedHand = useRef<number>(-1);

  // Record participation at the start of each hand (during DEALING phase)
  useEffect(() => {
    if (
      !initialized ||
      playerSeat === null ||
      phase !== "DEALING" ||
      handNumber === lastRecordedHand.current
    ) {
      return;
    }

    // Record this hand's participation
    const record: ParticipationRecord = {
      handNumber,
      participated: playerBet > 0,
      trueCount,
      betAmount: playerBet > 0 ? playerBet : undefined,
    };

    participationHistory.current.push(record);
    lastRecordedHand.current = handNumber;

    // Keep only last 20 hands
    if (participationHistory.current.length > 20) {
      participationHistory.current.shift();
    }

    // Analyze wonging pattern after we have at least 10 hands of data
    if (participationHistory.current.length >= 10) {
      analyzeWongingPattern();
    }
  }, [phase, handNumber, playerSeat, playerBet, trueCount, initialized]);

  // Analyze participation pattern for wonging behavior
  const analyzeWongingPattern = () => {
    if (!currentDealer || participationHistory.current.length < 10) return;

    const history = participationHistory.current;

    // Calculate average true count when participating vs sitting out
    const participated = history.filter((h) => h.participated);
    const satOut = history.filter((h) => !h.participated);

    if (participated.length === 0 || satOut.length === 0) {
      // Not enough data of both types
      return;
    }

    const avgCountWhenBetting =
      participated.reduce((sum, h) => sum + h.trueCount, 0) /
      participated.length;

    const avgCountWhenSittingOut =
      satOut.reduce((sum, h) => sum + h.trueCount, 0) / satOut.length;

    // Calculate the difference - positive means betting when count is higher
    const countDifference = avgCountWhenBetting - avgCountWhenSittingOut;

    // Wonging is detected when:
    // 1. Player is betting at significantly higher counts than when sitting out
    // 2. Player has sat out at least 3+ hands in the history
    // 3. The count difference is at least +2 (meaningful spread)

    if (satOut.length >= 3 && countDifference >= 2) {
      // Calculate wonging severity (0-1 scale)
      // Based on count difference and frequency of sitting out
      const sitOutRate = satOut.length / history.length;
      const wongingSeverity = Math.min(1, (countDifference / 5) * sitOutRate);

      // Base suspicion increase: 5-15 points based on severity
      const baseSuspicion = 5 + wongingSeverity * 10;

      // Increase dealer suspicion (will be scaled by dealer detection skill)
      increaseDealerSuspicion(currentDealer, baseSuspicion, setDealerSuspicion);

      // Clear some history after detection to avoid repeated triggers
      // Keep last 5 records to maintain some context
      participationHistory.current = participationHistory.current.slice(-5);
    }
  };

  // Reset history when player leaves table or dealer changes
  useEffect(() => {
    if (playerSeat === null || !currentDealer) {
      participationHistory.current = [];
      lastRecordedHand.current = -1;
    }
  }, [playerSeat, currentDealer?.id]);
}
