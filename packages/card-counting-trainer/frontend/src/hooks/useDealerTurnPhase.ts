import { useEffect, useRef } from "react";
import {
  GamePhase,
  AIPlayer,
  PlayerHand,
  FlyingCardData,
} from "@/types/gameState";
import { GameSettings } from "@/types/gameSettings";
import { DealerCharacter } from "@/data/dealerCharacters";
import { Card } from "@/types/game";
import { calculateHandValue, isBusted } from "@/lib/gameActions";
import { CHARACTER_DIALOGUE, pick } from "@/data/dialogue";
import { CARD_ANIMATION_DURATION } from "@/constants/animations";
import { AudioQueueHook, AudioPriority } from "@/hooks/useAudioQueue";
import { getDealerAudioPath } from "@/utils/audioHelpers";
import { debugLog } from "@/utils/debug";

interface UseDealerTurnPhaseParams {
  phase: GamePhase;
  dealerHand: PlayerHand;
  aiPlayers: AIPlayer[];
  gameSettings: GameSettings;
  currentDealer: DealerCharacter | null;
  setDealerRevealed: (revealed: boolean) => void;
  setDealerHand: (
    hand: PlayerHand | ((prev: PlayerHand) => PlayerHand),
  ) => void;
  setDealerCallout: (callout: string | null) => void;
  setFlyingCards: (
    cards: FlyingCardData[] | ((prev: FlyingCardData[]) => FlyingCardData[]),
  ) => void;
  setPhase: (phase: GamePhase) => void;
  dealCardFromShoe: () => Card;
  registerTimeout: (callback: () => void, delay: number) => void;
  getCardPositionForAnimation: (
    type: "shoe" | "dealer",
    aiIndex?: number,
    cardIndex?: number,
  ) => { left: string; top: string };
  addSpeechBubble: (id: string, message: string, position: number) => void;
  audioQueue: AudioQueueHook;
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
  currentDealer,
  setDealerRevealed,
  setDealerHand,
  setDealerCallout,
  setFlyingCards,
  setPhase,
  dealCardFromShoe,
  registerTimeout,
  getCardPositionForAnimation,
  addSpeechBubble,
  audioQueue,
}: UseDealerTurnPhaseParams) {
  const dealerTurnProcessingRef = useRef(false);
  const dealerFinishedRef = useRef(false);
  const cardCounterRef = useRef(0);
  const dealingCardRef = useRef(false);
  const currentDealerHandRef = useRef<Card[]>([]);
  const prevPhaseRef = useRef<GamePhase | null>(null);
  const hasStartedRef = useRef(false);
  const audioQueuedRef = useRef(false); // Track if we've queued audio for this dealer turn

  useEffect(() => {
    // Detect phase entry
    const isEnteringDealerTurn = phase === "DEALER_TURN" && prevPhaseRef.current !== "DEALER_TURN";

    if (isEnteringDealerTurn) {
      // Reset flags when entering dealer turn phase
      debugLog('dealCards', `🔄 ENTERING DEALER_TURN - Resetting all flags`);
      dealerTurnProcessingRef.current = false;
      dealerFinishedRef.current = false;
      hasStartedRef.current = false;
      audioQueuedRef.current = false; // Reset audio flag
      debugLog('dealCards', `   dealerFinishedRef: ${dealerFinishedRef.current}`);
      debugLog('dealCards', `   audioQueuedRef: ${audioQueuedRef.current}`);
      prevPhaseRef.current = phase;
    }

    if (phase !== "DEALER_TURN") {
      // Phase has changed away from DEALER_TURN
      prevPhaseRef.current = phase;
      return;
    }

    // Guard against re-entry while processing or already started
    if (dealerTurnProcessingRef.current || hasStartedRef.current) {
      debugLog('dealCards', `⛔ DEALER_TURN re-entry blocked (processing: ${dealerTurnProcessingRef.current}, started: ${hasStartedRef.current})`);
      return;
    }

    debugLog('dealCards', `✅ DEALER_TURN effect starting (processing: false → true, started: false → true)`);
    dealerTurnProcessingRef.current = true;
    hasStartedRef.current = true;

    if (phase === "DEALER_TURN") {
      debugLog('dealCards', "=== PHASE: DEALER_TURN START ===");
      debugLog('dealCards', 
        `Dealer hand: ${dealerHand.cards.map((c) => `${c.rank}${c.suit}`).join(", ")}`,
      );
      debugLog('dealCards', `Dealer hand value: ${calculateHandValue(dealerHand.cards)}`);
      setDealerRevealed(true);
      dealerFinishedRef.current = false; // Reset flag when entering dealer turn

      // 10% chance to show dealer-directed banter when dealer reveals
      if (Math.random() < 0.1 && aiPlayers.length > 0) {
        const randomAI =
          aiPlayers[Math.floor(Math.random() * aiPlayers.length)];
        const characterDialogue = CHARACTER_DIALOGUE[randomAI.character.id];
        const banterLines = characterDialogue?.banterWithDealer;

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

      // Initialize ref with current dealer hand
      currentDealerHandRef.current = dealerHand.cards;

      registerTimeout(() => {
        // Dealer plays according to rules - deal one card at a time with delays
        const dealNextCard = () => {
          // Guard against re-entry
          if (dealingCardRef.current) {
            return;
          }

          const currentHand = currentDealerHandRef.current;
          const handValue = calculateHandValue(currentHand);

          // Check if should hit
          const shouldHit = () => {
            // Always hit on 16 or less
            if (handValue < 17) return true;

            // Always stand on 18 or more
            if (handValue >= 18) return false;

            // On 17: depends on soft 17 rule
            if (handValue === 17) {
              // Check if it's a soft 17 (has an Ace counted as 11)
              const hasAce = currentHand.some((card) => card.rank === "A");
              const hasMultipleCards = currentHand.length > 2;
              const isSoft = hasAce && hasMultipleCards;

              if (gameSettings.dealerHitsSoft17 && isSoft) {
                return true; // Hit soft 17
              }
              return false; // Stand on hard 17 or stand on all 17s
            }

            return false;
          };

          // Check if dealer should hit and hasn't busted
          if (shouldHit() && !isBusted(currentHand)) {
            dealingCardRef.current = true;

            const card = dealCardFromShoe();
            debugLog('dealCards', 
              `Dealer HIT: ${card.rank}${card.suit} (value: ${card.value}, count: ${card.count})`,
            );

            // Update ref with new hand
            const newHand = [...currentHand, card];
            currentDealerHandRef.current = newHand;

            // Add flying card animation
            const shoePosition = getCardPositionForAnimation("shoe");
            const dealerPosition = getCardPositionForAnimation(
              "dealer",
              undefined,
              currentHand.length,
            );

            const flyingCard: FlyingCardData = {
              id: `hit-dealer-${Date.now()}-${cardCounterRef.current++}`,
              card,
              fromPosition: shoePosition,
              toPosition: dealerPosition,
            };

            setFlyingCards((prev) => [...prev, flyingCard]);

            // Apply dealer speed to animation duration
            const dealerSpeedMultiplier = currentDealer?.dealSpeed || 1.0;
            const adjustedAnimationDuration = CARD_ANIMATION_DURATION / dealerSpeedMultiplier;

            // Add card to hand after animation completes
            registerTimeout(() => {
              setFlyingCards((prev) =>
                prev.filter((fc) => fc.id !== flyingCard.id),
              );

              // Update dealer hand state after animation
              setDealerHand((prev) => ({
                ...prev,
                cards: newHand,
              }));
            }, adjustedAnimationDuration);

            const newValue = calculateHandValue(newHand);
            debugLog('dealCards', `Dealer hand value: ${newValue}`);

            // Wait for card animation to complete, then add fixed pause before next card
            registerTimeout(() => {
              // Card has landed, now pause before dealing next card (fixed pause regardless of dealer speed)
              const pauseBetweenCards = 800; // Fixed 800ms pause between dealer hit cards

              registerTimeout(() => {
                dealingCardRef.current = false; // Reset flag before next card
                dealNextCard();
              }, pauseBetweenCards);
            }, adjustedAnimationDuration); // Wait for speed-adjusted animation to complete first

            return;
          }

          // Dealer is done, announce final hand (only once)
          if (!dealerFinishedRef.current) {
            dealerFinishedRef.current = true;

            const finalValue = calculateHandValue(currentHand);
            const isBust = isBusted(currentHand);

            debugLog('dealCards', `=== DEALER FINAL HAND ===`);
            debugLog('dealCards', 
              `Dealer cards: ${currentHand.map((c) => `${c.rank}${c.suit}`).join(", ")}`,
            );
            debugLog('dealCards', `Dealer hand value: ${finalValue}`);
            debugLog('dealCards', `Dealer busted: ${isBust}`);

            // Only announce and queue audio once
            if (!audioQueuedRef.current) {
              audioQueuedRef.current = true;
              debugLog('dealerSpeech', `🔊 Queueing dealer audio (guard passed)`);
              debugLog('dealCards', `🔊 Queueing dealer audio (guard passed)`);

              // Play dealer result audio (audio queue will handle speech bubble)
              if (currentDealer) {
                if (isBust) {
                  const audioPath = getDealerAudioPath(currentDealer.id, "dealer_busts");
                  debugLog('dealerSpeech', `🎵 Queueing: ${audioPath}`);
                  debugLog('dealCards', `🎵 Queueing: ${audioPath}`);
                  audioQueue.queueAudio({
                    id: `dealer-busts-${Date.now()}`,
                    audioPath,
                    priority: AudioPriority.HIGH,
                    playerId: "dealer",
                    message: "Dealer busts",
                  });
                } else {
                  let voiceLine: "dealer_has_17" | "dealer_has_18" | "dealer_has_19" | "dealer_has_20" | "dealer_has_21";
                  if (finalValue === 17) voiceLine = "dealer_has_17";
                  else if (finalValue === 18) voiceLine = "dealer_has_18";
                  else if (finalValue === 19) voiceLine = "dealer_has_19";
                  else if (finalValue === 20) voiceLine = "dealer_has_20";
                  else voiceLine = "dealer_has_21";

                  const audioPath = getDealerAudioPath(currentDealer.id, voiceLine);
                  debugLog('dealerSpeech', `🎵 Queueing: ${audioPath} - "Dealer has ${finalValue}"`);
                  debugLog('dealCards', `🎵 Queueing: ${audioPath} - "Dealer has ${finalValue}"`);
                  audioQueue.queueAudio({
                    id: `dealer-result-${Date.now()}`,
                    audioPath,
                    priority: AudioPriority.HIGH,
                    playerId: "dealer",
                    message: `Dealer has ${finalValue}`,
                  });
                }
              }
            } else {
              debugLog('dealerSpeech', `⛔ Audio queue BLOCKED by guard (already queued)`);
              debugLog('dealCards', `⛔ Audio queue BLOCKED by guard (already queued)`);
            }

            // Move to resolving after brief delay
            registerTimeout(() => {
              dealerTurnProcessingRef.current = false; // Unlock before moving to next phase
              debugLog('dealCards', "🔓 Dealer turn processing unlocked (finished)");
              setPhase("RESOLVING");
            }, 1500); // Brief delay to show final dealer result
          }
        };

        // Start dealing cards
        dealNextCard();
      }, 1500);
    }
  }, [
    phase,
    // Removed unstable dependencies to prevent duplicate card dealing:
    // dealCardFromShoe, registerTimeout, setDealerRevealed,
    // addSpeechBubble, setDealerHand, getCardPositionForAnimation,
    // setFlyingCards, setDealerCallout, setPhase, aiPlayers, dealerHand, gameSettings
  ]);
}
