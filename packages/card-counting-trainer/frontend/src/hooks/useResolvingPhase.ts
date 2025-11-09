import { useEffect, useRef } from "react";
import { GamePhase, AIPlayer, PlayerHand, WinLossBubbleData } from "@/types/gameState";
import { GameSettings, getBlackjackPayoutMultiplier } from "@/types/gameSettings";
import { DealerCharacter } from "@/data/dealerCharacters";
import { determineHandResult, calculatePayout } from "@/lib/dealer";
import { calculateHandValue, isBusted } from "@/lib/gameActions";
import { calculateDecksRemaining, calculateTrueCount } from "@/lib/deck";
import { TABLE_POSITIONS } from "@/constants/animations";

interface UseResolvingPhaseParams {
  phase: GamePhase;
  playerHand: PlayerHand;
  dealerHand: PlayerHand;
  gameSettings: GameSettings;
  aiPlayers: AIPlayer[];
  playerSeat: number | null;
  currentDealer: DealerCharacter | null;
  previousBet: number;
  cardsDealt: number;
  runningCount: number;
  setPlayerChips: (chips: number | ((prev: number) => number)) => void;
  setPlayerHand: (hand: PlayerHand | ((prev: PlayerHand) => PlayerHand)) => void;
  setPitBossDistance: (distance: number | ((prev: number) => number)) => void;
  setSuspicionLevel: (level: number | ((prev: number) => number)) => void;
  setPreviousBet: (bet: number) => void;
  setDealerCallout: (callout: string | null) => void;
  setWinLossBubbles: (bubbles: WinLossBubbleData[]) => void;
  setPhase: (phase: GamePhase) => void;
  registerTimeout: (callback: () => void, delay: number) => void;
  showEndOfHandReactions: () => void;
  addDebugLog: (message: string) => void;
}

/**
 * Hook to handle RESOLVING phase logic
 * - Calculates player results and payouts
 * - Updates suspicion and pit boss distance based on betting patterns
 * - Creates win/loss bubbles for all players
 * - Shows end-of-hand reactions
 * - Transitions to ROUND_END phase
 */
export function useResolvingPhase({
  phase,
  playerHand,
  dealerHand,
  gameSettings,
  aiPlayers,
  playerSeat,
  currentDealer,
  previousBet,
  cardsDealt,
  runningCount,
  setPlayerChips,
  setPlayerHand,
  setPitBossDistance,
  setSuspicionLevel,
  setPreviousBet,
  setDealerCallout,
  setWinLossBubbles,
  setPhase,
  registerTimeout,
  showEndOfHandReactions,
  addDebugLog,
}: UseResolvingPhaseParams) {
  const hasResolvedRef = useRef(false);

  useEffect(() => {
    if (phase === "RESOLVING" && !hasResolvedRef.current) {
      hasResolvedRef.current = true;

      const playerResult = determineHandResult(playerHand, dealerHand);
      const bjPayoutMultiplier = getBlackjackPayoutMultiplier(
        gameSettings.blackjackPayout,
      );
      const playerPayout = calculatePayout(
        playerHand,
        playerResult,
        bjPayoutMultiplier,
      );

      setPlayerChips((prev) => prev + playerPayout);
      setPlayerHand((prev) => ({ ...prev, result: playerResult }));

      // Update pit boss distance and suspicion based on player behavior
      if (playerSeat !== null && playerHand.bet > 0) {
        const betVariation =
          Math.abs(playerHand.bet - previousBet) / previousBet;
        const netGain = playerPayout - playerHand.bet;
        const isBigWin = netGain > playerHand.bet * 1.5; // Win more than 1.5x bet

        // Calculate true count for bet correlation detection
        const decksRemaining = calculateDecksRemaining(
          gameSettings.numberOfDecks * 52,
          cardsDealt,
        );
        const trueCount = calculateTrueCount(runningCount, decksRemaining);

        // Determine if bet change correlates with count (sign of counting)
        const betIncreased = playerHand.bet > previousBet;
        const countIsFavorable = trueCount >= 2; // Count of +2 or higher favors player
        const countIsUnfavorable = trueCount <= -1;
        const suspiciousBetting =
          (betIncreased && countIsFavorable) ||
          (!betIncreased && countIsUnfavorable);

        // Calculate suspicion from bet variation
        let suspicionIncrease = 0;
        if (betVariation > 0.3 && currentDealer) {
          // 30%+ bet change
          // Base suspicion from bet size change
          const baseSuspicion = betVariation * 15; // Max ~15 for 100% change

          // Multiply by dealer detection skill
          const detectionMultiplier = currentDealer.detectionSkill / 100;

          // If betting correlates with count, it's MORE suspicious
          // If betting goes against count (camouflage), it's LESS suspicious
          const correlationMultiplier = suspiciousBetting ? 1.5 : 0.5;

          // Count extremity multiplier - more extreme counts = more suspicious to vary bet
          const countMultiplier = 1 + Math.abs(trueCount) * 0.2; // +20% per count point

          suspicionIncrease =
            baseSuspicion *
            detectionMultiplier *
            correlationMultiplier *
            countMultiplier;
          suspicionIncrease = Math.min(suspicionIncrease, 25); // Cap at 25 points
        }

        // Calculate proximity change
        let proximityChange = 0;

        // Big wins attract attention
        if (isBigWin) {
          proximityChange -= 15; // Pit boss moves closer
        }

        // Large bet variations attract attention
        if (betVariation > 0.5) {
          // 50%+ bet change
          const variationPenalty = Math.min(betVariation * 20, 20);
          proximityChange -= variationPenalty;
        }

        // Small random drift (pit boss walking around)
        const drift = Math.random() * 10 - 3; // -3 to +7, slightly tends to move away
        proximityChange += drift;

        // Distance affects suspicion multiplier
        setPitBossDistance((prev) => {
          const newDistance = Math.max(
            0,
            Math.min(100, prev + proximityChange),
          );

          // If pit boss is very close, increase suspicion more
          if (newDistance < 30 && (isBigWin || betVariation > 0.5)) {
            const proximityBonus = isBigWin ? 5 : Math.floor(betVariation * 10);
            suspicionIncrease += proximityBonus;
          }

          return newDistance;
        });

        // Apply suspicion increase
        if (suspicionIncrease > 0) {
          setSuspicionLevel((s) => Math.min(100, s + suspicionIncrease));
        }

        // Update previous bet for next hand
        setPreviousBet(playerHand.bet);
      }

      // Dealer announces payouts for winning hands
      const dealerValue = calculateHandValue(dealerHand.cards);
      const dealerBusted = isBusted(dealerHand.cards);

      // Determine what to announce - dealer announces minimum winning hand value
      let callout = "";
      if (dealerBusted) {
        callout = "Paying all hands";
      } else {
        // Dealer pays hands that beat their total (dealer value + 1)
        const minWinningValue = dealerValue + 1;
        if (minWinningValue <= 21) {
          callout = `Paying ${minWinningValue}`;
        } else {
          // Dealer has 21, no non-blackjack hands can beat it
          callout = "Dealer wins";
        }
      }

      setDealerCallout(callout);

      // Create win/loss bubbles for all players
      addDebugLog("=== CREATING WIN/LOSS BUBBLES ===");
      const newWinLossBubbles: WinLossBubbleData[] = [];

      // Add bubble for human player if they have cards
      if (playerSeat !== null && playerHand.cards.length > 0) {
        addDebugLog(`Player has cards, creating bubble for seat ${playerSeat}`);

        const [x, y] = TABLE_POSITIONS[playerSeat];
        let result: "win" | "lose" | "push" | "blackjack" = "lose";

        if (playerResult === "BLACKJACK") {
          result = "blackjack";
        } else if (playerResult === "WIN") {
          result = "win";
        } else if (playerResult === "PUSH") {
          result = "push";
        } else {
          result = "lose";
        }

        newWinLossBubbles.push({
          id: `player-result-${Date.now()}`,
          result,
          position: { left: `${x}%`, top: `${y - 5}%` }, // Slightly above player position
        });
      }

      // Add bubbles for AI players
      addDebugLog(`Checking ${aiPlayers.length} AI players for bubbles`);
      aiPlayers.forEach((ai) => {
        if (ai.hand.cards.length > 0) {
          addDebugLog(
            `AI Player ${ai.character.name} has ${ai.hand.cards.length} cards`,
          );

          const [x, y] = TABLE_POSITIONS[ai.position];
          const aiResult = determineHandResult(ai.hand, dealerHand);
          let result: "win" | "lose" | "push" | "blackjack" = "lose";

          if (aiResult === "BLACKJACK") {
            result = "blackjack";
          } else if (aiResult === "WIN") {
            result = "win";
          } else if (aiResult === "PUSH") {
            result = "push";
          } else {
            result = "lose";
          }

          newWinLossBubbles.push({
            id: `ai-${ai.character.id}-result-${Date.now()}`,
            result,
            position: { left: `${x}%`, top: `${y - 5}%` }, // Slightly above AI position
          });
          addDebugLog(
            `Added ${result} bubble for ${ai.character.name} at seat ${ai.position}`,
          );
        }
      });

      addDebugLog(`Created ${newWinLossBubbles.length} total win/loss bubbles`);
      setWinLossBubbles(newWinLossBubbles);

      // Show end-of-hand reactions
      showEndOfHandReactions();

      registerTimeout(() => {
        setDealerCallout(null);
        setPhase("ROUND_END");
      }, 11000); // Increased to 11 seconds - dealer callouts stay visible longer
    } else if (phase !== "RESOLVING") {
      // Reset the flag when we leave RESOLVING phase
      hasResolvedRef.current = false;
    }
  }, [
    phase,
    playerHand,
    dealerHand,
    gameSettings,
    aiPlayers,
    playerSeat,
    registerTimeout,
    showEndOfHandReactions,
    currentDealer,
    previousBet,
    cardsDealt,
    runningCount,
    setPlayerChips,
    setPlayerHand,
    setPitBossDistance,
    setSuspicionLevel,
    setPreviousBet,
    setDealerCallout,
    setWinLossBubbles,
    setPhase,
    addDebugLog,
  ]);
}
