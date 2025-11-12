import { useEffect, useRef } from "react";
import { DealerCharacter } from "@/data/dealerCharacters";
import {
  getDealerReportingThreshold,
  getDealerSuspicionComment,
} from "@/data/dialogue/dealerSuspicion";

interface UseDealerSuspicionParams {
  currentDealer: DealerCharacter | null;
  dealerSuspicion: number;
  suspicionLevel: number;
  playerSeat: number | null;
  initialized: boolean;
  setDealerSuspicion: (suspicion: number | ((prev: number) => number)) => void;
  setSuspicionLevel: (level: number | ((prev: number) => number)) => void;
  setPitBossDistance: (distance: number | ((prev: number) => number)) => void;
  addSpeechBubble: (id: string, message: string, position: number) => void;
}

/**
 * Hook to manage dealer suspicion and pit boss reporting
 * Dealers notice counting behavior first, then may alert pit boss
 */
export function useDealerSuspicion({
  currentDealer,
  dealerSuspicion,
  playerSeat,
  initialized,
  setDealerSuspicion,
  setSuspicionLevel,
  setPitBossDistance,
  addSpeechBubble,
}: UseDealerSuspicionParams) {
  const lastCommentLevel = useRef(0);
  const hasReportedRef = useRef(false);

  // Reset reported flag when dealer changes
  useEffect(() => {
    if (currentDealer) {
      hasReportedRef.current = false;
      lastCommentLevel.current = 0;
    }
  }, [currentDealer?.id]);

  // Dealer comments based on suspicion level
  useEffect(() => {
    if (!initialized || !currentDealer || playerSeat === null) return;

    // Only comment at certain thresholds (10%, 30%, 60%, 80%)
    const thresholds = [10, 30, 60, 80];
    const currentThreshold = thresholds.find(
      (t) => dealerSuspicion >= t && lastCommentLevel.current < t,
    );

    if (currentThreshold) {
      lastCommentLevel.current = currentThreshold;

      // Get appropriate comment for this suspicion level
      const comment = getDealerSuspicionComment(currentDealer, dealerSuspicion);

      if (comment) {
        // Dealer position is -1 (top center)
        addSpeechBubble(`dealer-suspicion-${Date.now()}`, comment, -1);
      }
    }
  }, [
    dealerSuspicion,
    currentDealer,
    initialized,
    playerSeat,
    addSpeechBubble,
  ]);

  // Dealer reports to pit boss when threshold reached
  useEffect(() => {
    if (
      !initialized ||
      !currentDealer ||
      playerSeat === null ||
      hasReportedRef.current
    )
      return;

    const reportingThreshold = getDealerReportingThreshold(currentDealer);

    // Check if dealer should report to pit boss
    if (dealerSuspicion >= reportingThreshold) {
      hasReportedRef.current = true;

      // Dealer calls pit boss - show final comment
      const comment = getDealerSuspicionComment(currentDealer, dealerSuspicion);
      if (comment) {
        addSpeechBubble(`dealer-report-${Date.now()}`, comment, -1);
      }

      // Transfer dealer suspicion to pit boss attention
      // Pit boss attention jumps up significantly
      const transferAmount = Math.min(30, dealerSuspicion * 0.5);
      setSuspicionLevel((prev) => Math.min(100, prev + transferAmount));

      // Pit boss starts approaching (distance increases)
      setPitBossDistance((prev) => Math.min(100, prev + 25));

      // Reset dealer suspicion since they've reported
      // Dealer continues to be watchful but suspicion resets
      setDealerSuspicion(0);
      lastCommentLevel.current = 0;
    }
  }, [
    dealerSuspicion,
    currentDealer,
    initialized,
    playerSeat,
    setSuspicionLevel,
    setPitBossDistance,
    setDealerSuspicion,
    addSpeechBubble,
  ]);

  // Gradual dealer suspicion decay over time (slower than pit boss decay)
  useEffect(() => {
    if (!initialized || !currentDealer || playerSeat === null) {
      return undefined;
    }

    // Dealers on your side don't build suspicion
    if (currentDealer.onYourSide) {
      return undefined;
    }

    const decayInterval = setInterval(() => {
      setDealerSuspicion((prev) => {
        if (prev <= 0) return 0;
        // Decay 0.5 points every 2 seconds (slower than pit boss)
        return Math.max(0, prev - 0.5);
      });
    }, 2000);

    return () => clearInterval(decayInterval);
  }, [initialized, currentDealer, playerSeat, setDealerSuspicion]);
}

/**
 * Helper to increase dealer suspicion based on player actions
 * Call this from betting/strategy deviation handlers
 */
export function increaseDealerSuspicion(
  currentDealer: DealerCharacter | null,
  amount: number,
  setDealerSuspicion: (suspicion: number | ((prev: number) => number)) => void,
): void {
  if (!currentDealer) return;

  // Dealers on your side don't build suspicion
  if (currentDealer.onYourSide) {
    return;
  }

  // Apply detection skill multiplier
  const skillMultiplier = currentDealer.detectionSkill / 100;
  const adjustedAmount = amount * skillMultiplier;

  setDealerSuspicion((prev) => Math.min(100, prev + adjustedAmount));
}
