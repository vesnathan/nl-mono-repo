import { useEffect, useRef } from "react";
import { GamePhase, AIPlayer, PlayerHand, FlyingCardData } from "@/types/gameState";
import { GameSettings } from "@/types/gameSettings";
import { Card } from "@/types/game";
import { calculateHandValue, isBusted } from "@/lib/gameActions";
import { AI_DIALOGUE_ADDONS, pick } from "@/data/ai-dialogue-addons";
import { CARD_ANIMATION_DURATION } from "@/constants/animations";

interface UseDealerTurnPhaseParams {
  phase: GamePhase;
  dealerHand: PlayerHand;
  aiPlayers: AIPlayer[];
  gameSettings: GameSettings;
  setDealerRevealed: (revealed: boolean) => void;
  setDealerHand: (hand: PlayerHand | ((prev: PlayerHand) => PlayerHand)) => void;
  setDealerCallout: (callout: string | null) => void;
  setFlyingCards: (cards: FlyingCardData[] | ((prev: FlyingCardData[]) => FlyingCardData[])) => void;
  setPhase: (phase: GamePhase) => void;
  dealCardFromShoe: () => Card;
  registerTimeout: (callback: () => void, delay: number) => void;
  getCardPositionForAnimation: (type: "shoe" | "dealer", aiIndex?: number, cardIndex?: number) => { left: string; top: string };
  addSpeechBubble: (id: string, message: string, position: number) => void;
  addDebugLog: (message: string) => void;
}

/**
 * Hook to handle DEALER_TURN phase logic
 * - Reveals dealer's hole card
 * - Dealer draws cards according to house rules
 * - Handles dealer bust/stand
 * - Transitions to RESOLVING phase
 */
export function useDealerTurnPhase({
  phase,
  dealerHand,
  aiPlayers,
  gameSettings,
  setDealerRevealed,
  setDealerHand,
  setDealerCallout,
  setFlyingCards,
  setPhase,
  dealCardFromShoe,
  registerTimeout,
  getCardPositionForAnimation,
  addSpeechBubble,
  addDebugLog,
}: UseDealerTurnPhaseParams) {
  const dealerTurnProcessingRef = useRef(false);
  const dealerFinishedRef = useRef(false);

  useEffect(() => {
    if (phase !== "DEALER_TURN") {
      // Phase has changed away from DEALER_TURN, do nothing
      return;
    }

    // Guard against re-entry while processing
    if (dealerTurnProcessingRef.current) {
      addDebugLog("⚠️ Dealer turn already processing, skipping re-entry");
      return;
    }

    dealerTurnProcessingRef.current = true;
    addDebugLog("🔒 Dealer turn processing locked");

    if (phase === "DEALER_TURN") {
      addDebugLog("=== PHASE: DEALER_TURN START ===");
      addDebugLog(
        `Dealer hand: ${dealerHand.cards.map((c) => `${c.rank}${c.suit}`).join(", ")}`,
      );
      addDebugLog(`Dealer hand value: ${calculateHandValue(dealerHand.cards)}`);
      setDealerRevealed(true);
      dealerFinishedRef.current = false; // Reset flag when entering dealer turn

      // 10% chance to show dealer-directed banter when dealer reveals
      if (Math.random() < 0.1 && aiPlayers.length > 0) {
        const randomAI =
          aiPlayers[Math.floor(Math.random() * aiPlayers.length)];
        const banterLines = AI_DIALOGUE_ADDONS.find(
          (addon) => addon.id === randomAI.character.id,
        )?.banterWithDealer;

        if (banterLines && banterLines.length > 0) {
          const randomBanter = pick(banterLines);
          registerTimeout(() => {
            addSpeechBubble(
              `dealer-banter-${Date.now()}`,
              randomBanter,
              randomAI.position,
            );
          }, 500); // Show shortly after dealer reveals
        }
      }

      registerTimeout(() => {
        // Dealer plays according to rules - deal one card at a time with delays
        const dealNextCard = () => {
          setDealerHand((prevHand) => {
            const handValue = calculateHandValue(prevHand.cards);

            // Check if should hit
            const shouldHit = () => {
              // Always hit on 16 or less
              if (handValue < 17) return true;

              // Always stand on 18 or more
              if (handValue >= 18) return false;

              // On 17: depends on soft 17 rule
              if (handValue === 17) {
                // Check if it's a soft 17 (has an Ace counted as 11)
                const hasAce = prevHand.cards.some((card) => card.rank === "A");
                const hasMultipleCards = prevHand.cards.length > 2;
                const isSoft = hasAce && hasMultipleCards;

                if (gameSettings.dealerHitsSoft17 && isSoft) {
                  return true; // Hit soft 17
                }
                return false; // Stand on hard 17 or stand on all 17s
              }

              return false;
            };

            // Check if dealer should hit and hasn't busted
            if (shouldHit() && !isBusted(prevHand.cards)) {
              const card = dealCardFromShoe();
              addDebugLog(
                `Dealer HIT: ${card.rank}${card.suit} (value: ${card.value}, count: ${card.count})`,
              );

              // Add flying card animation
              const shoePosition = getCardPositionForAnimation("shoe");
              const dealerPosition = getCardPositionForAnimation(
                "dealer",
                undefined,
                prevHand.cards.length,
              );

              const flyingCard: FlyingCardData = {
                id: `hit-dealer-${Date.now()}`,
                card,
                fromPosition: shoePosition,
                toPosition: dealerPosition,
              };

              setFlyingCards((prev) => [...prev, flyingCard]);

              // Add card to hand after animation
              setTimeout(() => {
                setFlyingCards((prev) =>
                  prev.filter((fc) => fc.id !== flyingCard.id),
                );
              }, CARD_ANIMATION_DURATION);

              const newHand = { ...prevHand, cards: [...prevHand.cards, card] };
              const newValue = calculateHandValue(newHand.cards);
              addDebugLog(`Dealer hand value: ${newValue}`);

              // Schedule next card after animation + delay
              registerTimeout(() => dealNextCard(), 1000);

              return newHand;
            }
            // Dealer is done, announce final hand (only once)
            if (!dealerFinishedRef.current) {
              dealerFinishedRef.current = true;

              const finalValue = calculateHandValue(prevHand.cards);
              const isBust = isBusted(prevHand.cards);

              addDebugLog(`=== DEALER FINAL HAND ===`);
              addDebugLog(
                `Dealer cards: ${prevHand.cards.map((c) => `${c.rank}${c.suit}`).join(", ")}`,
              );
              addDebugLog(`Dealer hand value: ${finalValue}`);
              addDebugLog(`Dealer busted: ${isBust}`);

              if (isBust) {
                setDealerCallout("Dealer busts");
              } else {
                setDealerCallout(`Dealer has ${finalValue}`);
              }

              // Clear callout and move to resolving
              registerTimeout(() => {
                setDealerCallout(null);
                dealerTurnProcessingRef.current = false; // Unlock before moving to next phase
                addDebugLog("🔓 Dealer turn processing unlocked (finished)");
                setPhase("RESOLVING");
              }, 10000); // Increased to 10 seconds - dealer callouts stay visible longer
            }

            return prevHand;
          });
        };

        // Start dealing cards
        dealNextCard();
      }, 1500);
    }
  }, [phase, dealerHand, dealCardFromShoe, gameSettings, registerTimeout, addDebugLog, setDealerRevealed, aiPlayers, addSpeechBubble, setDealerHand, getCardPositionForAnimation, setFlyingCards, setDealerCallout, setPhase]);
}
