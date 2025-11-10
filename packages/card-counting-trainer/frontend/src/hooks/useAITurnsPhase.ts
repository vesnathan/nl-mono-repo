import { useEffect, useRef } from "react";
import {
  GamePhase,
  AIPlayer,
  PlayerHand,
  FlyingCardData,
} from "@/types/gameState";
import { Card } from "@/types/game";
import { calculateHandValue, isBusted, isSoftHand } from "@/lib/gameActions";
import {
  CHARACTER_DIALOGUE,
  pick,
  getRandomSayingForTotal,
  getRandomSoftHandSaying,
  getRandomDistraction,
} from "@/data/dialogue";
import { shouldHitBasicStrategy } from "@/utils/aiStrategy";
import { CARD_ANIMATION_DURATION } from "@/constants/animations";
import { generateBustReaction } from "@/utils/reactions";

interface UseAITurnsPhaseParams {
  phase: GamePhase;
  aiPlayers: AIPlayer[];
  dealerHand: PlayerHand;
  activePlayerIndex: number | null;
  playersFinished: Set<number>;
  setActivePlayerIndex: (index: number | null) => void;
  setPlayersFinished: (
    finished: Set<number> | ((prev: Set<number>) => Set<number>),
  ) => void;
  setPlayerActions: (
    actions:
      | Map<number, "HIT" | "STAND" | "DOUBLE" | "SPLIT" | "BUST" | "BLACKJACK">
      | ((
          prev: Map<
            number,
            "HIT" | "STAND" | "DOUBLE" | "SPLIT" | "BUST" | "BLACKJACK"
          >,
        ) => Map<
          number,
          "HIT" | "STAND" | "DOUBLE" | "SPLIT" | "BUST" | "BLACKJACK"
        >),
  ) => void;
  setAIPlayers: (
    players: AIPlayer[] | ((prev: AIPlayer[]) => AIPlayer[]),
  ) => void;
  setFlyingCards: (
    cards: FlyingCardData[] | ((prev: FlyingCardData[]) => FlyingCardData[]),
  ) => void;
  setPhase: (phase: GamePhase) => void;
  dealCardFromShoe: () => Card;
  registerTimeout: (callback: () => void, delay: number) => void;
  getCardPositionForAnimation: (
    type: "shoe" | "ai",
    aiIndex?: number,
    cardIndex?: number,
  ) => { left: string; top: string };
  addSpeechBubble: (id: string, message: string, position: number) => void;
  addDebugLog: (message: string) => void;
}

/**
 * Hook to handle AI_TURNS phase logic
 * - Processes AI players one at a time in table order (first base to third base)
 * - Implements basic strategy decision making with skill level variation
 * - Handles card dealing with flying card animations
 * - Manages player actions (HIT, STAND, BUST) with timing
 * - Transitions to DEALER_TURN when all players finished
 */
export function useAITurnsPhase({
  phase,
  aiPlayers,
  dealerHand,
  activePlayerIndex,
  playersFinished,
  setActivePlayerIndex,
  setPlayersFinished,
  setPlayerActions,
  setAIPlayers,
  setFlyingCards,
  setPhase,
  dealCardFromShoe,
  registerTimeout,
  getCardPositionForAnimation,
  addSpeechBubble,
  addDebugLog,
}: UseAITurnsPhaseParams) {
  const aiTurnProcessingRef = useRef<boolean>(false);
  const cardCounterRef = useRef(0);
  const isTransitioningRef = useRef<boolean>(false);
  const prevPhaseRef = useRef<GamePhase | null>(null);
  const hasResetRef = useRef<boolean>(false);

  useEffect(() => {
    // Reset playersFinished when entering AI_TURNS phase for the first time
    if (phase === "AI_TURNS" && prevPhaseRef.current !== "AI_TURNS" && !hasResetRef.current) {
      addDebugLog("[AI_TURNS] Resetting playersFinished on phase entry");
      setPlayersFinished(new Set());
      setActivePlayerIndex(null);
      hasResetRef.current = true;
      prevPhaseRef.current = phase;
      return; // Exit early, let next render handle the logic
    }

    if (phase !== "AI_TURNS") {
      aiTurnProcessingRef.current = false;
      isTransitioningRef.current = false;
      hasResetRef.current = false;
      prevPhaseRef.current = phase;
      return;
    }

    prevPhaseRef.current = phase;

    if (activePlayerIndex !== null) {
      addDebugLog(`[AI_TURNS Effect] Skipping - activePlayerIndex is ${activePlayerIndex}`);
      return;
    }

    if (aiTurnProcessingRef.current || isTransitioningRef.current) {
      addDebugLog(`[AI_TURNS Effect] Skipping - processing=${aiTurnProcessingRef.current}, transitioning=${isTransitioningRef.current}`);
      return;
    }

    addDebugLog(`[AI_TURNS Effect] Starting turn logic`);
    addDebugLog(`[AI_TURNS Effect] playersFinished size: ${playersFinished.size}, contents: [${Array.from(playersFinished).join(", ")}]`);

    aiTurnProcessingRef.current = true;

    if (phase === "AI_TURNS" && activePlayerIndex === null) {
      const playersByPosition = aiPlayers
        .map((ai, idx) => ({ ai, idx, position: ai.position }))
        .sort((a, b) => a.position - b.position);

      addDebugLog(
        `Turn order (sorted by position): ${playersByPosition.map((p) => `${p.ai.character.name} (idx:${p.idx}, seat:${p.position})`).join(", ")}`,
      );
      addDebugLog(
        `Players finished: [${Array.from(playersFinished).join(", ")}]`,
      );
      addDebugLog(
        `Dealer hand cards: ${dealerHand.cards.map((c) => `${c.rank}${c.suit}`).join(", ")} (${dealerHand.cards.length} cards)`,
      );

      const nextPlayer = playersByPosition.find(({ ai, idx }) => {
        if (playersFinished.has(idx)) {
          addDebugLog(
            `  ${ai.character.name} (idx:${idx}) - SKIPPED (already finished)`,
          );
          return false;
        }

        const handValue = calculateHandValue(ai.hand.cards);
        const isBust = isBusted(ai.hand.cards);

        addDebugLog(
          `  ${ai.character.name} (idx:${idx}) - Hand: ${ai.hand.cards.map((c) => `${c.rank}${c.suit}`).join(", ")} (value: ${handValue}, busted: ${isBust})`,
        );

        if (isBust) {
          addDebugLog(`  ${ai.character.name} (idx:${idx}) - SKIPPED (busted)`);
          return false;
        }
        if (handValue < 21) {
          addDebugLog(
            `  ${ai.character.name} (idx:${idx}) - SELECTED (hand < 21)`,
          );
          return true;
        }
        if (handValue === 21) {
          addDebugLog(
            `  ${ai.character.name} (idx:${idx}) - SELECTED (hand = 21)`,
          );
          return true;
        }

        return false;
      });

      if (!nextPlayer) {
        addDebugLog("=== ALL AI PLAYERS FINISHED ===");
        addDebugLog(
          `Players finished: ${Array.from(playersFinished).join(", ")}`,
        );
        addDebugLog("Moving to DEALER_TURN phase");
        isTransitioningRef.current = true;
        registerTimeout(() => setPhase("DEALER_TURN"), 1000);
        return;
      }

      const { ai, idx } = nextPlayer;

      addDebugLog(
        `=== AI PLAYER ${idx} TURN (${ai.character.name}, Seat ${ai.position}) ===`,
      );
      addDebugLog(
        `Current hand: ${ai.hand.cards.map((c) => `${c.rank}${c.suit}`).join(", ")}`,
      );

      const handValue = calculateHandValue(ai.hand.cards);
      const isBust = isBusted(ai.hand.cards);

      addDebugLog(`Hand value: ${handValue}, Busted: ${isBust}`);

      let handDifficultyMultiplier = 1.0;
      if (isBust || handValue >= 20) {
        handDifficultyMultiplier = 0.5;
      } else if (handValue >= 17) {
        handDifficultyMultiplier = 0.8;
      } else if (handValue >= 12 && handValue <= 16) {
        handDifficultyMultiplier = 1.5;
      } else {
        handDifficultyMultiplier = 0.7;
      }

      const baseDecisionTime = 1200;
      const baseActionDisplay = 1000;
      const baseTurnClear = 300;

      const { playSpeed } = ai.character;
      const combinedSpeed = playSpeed / handDifficultyMultiplier;
      const decisionTime = Math.round(baseDecisionTime / combinedSpeed);
      const actionDisplay = Math.round(baseActionDisplay / combinedSpeed);
      const turnClear = Math.round(baseTurnClear / combinedSpeed);

      setActivePlayerIndex(idx);

      const dealerUpCard = dealerHand.cards[0];
      const basicStrategyDecision = shouldHitBasicStrategy(
        ai.hand.cards,
        dealerUpCard,
      );

      const followsBasicStrategy =
        Math.random() * 100 < ai.character.skillLevel;
      const shouldHit = followsBasicStrategy
        ? basicStrategyDecision
        : handValue < 17;

      addDebugLog(`Dealer up card: ${dealerUpCard.rank}${dealerUpCard.suit}`);
      addDebugLog(
        `Basic strategy says: ${basicStrategyDecision ? "HIT" : "STAND"}`,
      );
      addDebugLog(
        `Follows basic strategy: ${followsBasicStrategy}, Decision: ${shouldHit ? "HIT" : "STAND"}`,
      );

      if (shouldHit && !isBust) {
        // Show hand-based dialogue with higher frequency (25%)
        if (Math.random() < 0.25) {
          let dialogue: string | null = null;

          // Try to get hand-specific dialogue
          const isSoft = isSoftHand(ai.hand.cards);

          if (isSoft && ai.hand.cards.length === 2) {
            // Get soft hand saying (A,2 through A,9)
            const aceCard = ai.hand.cards.find(c => c.rank === 'A');
            const otherCard = ai.hand.cards.find(c => c.rank !== 'A');
            if (aceCard && otherCard && otherCard.rank !== 'A' && otherCard.rank !== '10' && otherCard.rank !== 'J' && otherCard.rank !== 'Q' && otherCard.rank !== 'K') {
              dialogue = getRandomSoftHandSaying(ai.character.id, otherCard.rank);
            }
          }

          // If no soft hand saying, try regular hand total saying
          if (!dialogue && handValue >= 12 && handValue <= 21) {
            dialogue = getRandomSayingForTotal(ai.character.id, handValue);
          }

          // Fallback to distraction (5% chance) or banter
          if (!dialogue) {
            if (Math.random() < 0.2) {
              dialogue = getRandomDistraction(ai.character.id);
            } else {
              const characterDialogue = CHARACTER_DIALOGUE[ai.character.id];
              const banterLines = characterDialogue?.banterWithPlayer;
              if (banterLines && banterLines.length > 0) {
                dialogue = pick(banterLines).text;
              }
            }
          }

          if (dialogue) {
            registerTimeout(() => {
              addSpeechBubble(
                `ai-turn-dialogue-${idx}-${Date.now()}`,
                dialogue!,
                ai.position,
              );
            }, decisionTime / 2);
          }
        }

        registerTimeout(() => {
          setPlayerActions((prev) => new Map(prev).set(idx, "HIT"));
        }, decisionTime);

        registerTimeout(() => {
          const card = dealCardFromShoe();
          addDebugLog(
            `Dealt card: ${card.rank}${card.suit} (value: ${card.value}, count: ${card.count})`,
          );

          const shoePosition = getCardPositionForAnimation("shoe");
          const aiPosition = getCardPositionForAnimation(
            "ai",
            idx,
            ai.hand.cards.length,
          );

          const flyingCard: FlyingCardData = {
            id: `hit-ai-${idx}-${Date.now()}-${cardCounterRef.current++}`,
            card,
            fromPosition: shoePosition,
            toPosition: aiPosition,
          };

          setFlyingCards((prev) => [...prev, flyingCard]);

          registerTimeout(() => {
            setAIPlayers((prev) => {
              const updated = [...prev];
              updated[idx] = {
                ...updated[idx],
                hand: {
                  ...updated[idx].hand,
                  cards: [...updated[idx].hand.cards, card],
                },
              };
              return updated;
            });
            setFlyingCards((prev) =>
              prev.filter((fc) => fc.id !== flyingCard.id),
            );

            const newHandValue = calculateHandValue([...ai.hand.cards, card]);
            const busted = isBusted([...ai.hand.cards, card]);

            addDebugLog(`New hand value: ${newHandValue}, Busted: ${busted}`);

            if (busted) {
              addDebugLog(`AI Player ${idx} BUSTED!`);
              addDebugLog(`Marking AI Player ${idx} as FINISHED (busted)`);

              // Generate and show bust reaction with delay (after card lands)
              const updatedAI = {
                ...ai,
                hand: {
                  ...ai.hand,
                  cards: [...ai.hand.cards, card],
                },
              };
              const bustReaction = generateBustReaction(updatedAI);
              if (bustReaction) {
                addDebugLog(`Showing bust reaction: ${bustReaction.message}`);
                registerTimeout(() => {
                  addSpeechBubble(
                    `bust-reaction-${idx}-${Date.now()}`,
                    bustReaction.message,
                    bustReaction.position,
                  );
                }, 800); // Delay 800ms after card lands
              }

              setPlayersFinished((prev) => new Set(prev).add(idx));

              setPlayerActions((prev) => {
                const newMap = new Map(prev);
                newMap.delete(idx);
                return newMap;
              });

              registerTimeout(() => {
                setPlayerActions((prev) => new Map(prev).set(idx, "BUST"));
              }, 100);

              registerTimeout(() => {
                setAIPlayers((prev) => {
                  const updated = [...prev];
                  updated[idx] = {
                    ...updated[idx],
                    hand: {
                      ...updated[idx].hand,
                      cards: [],
                    },
                  };
                  return updated;
                });
                setPlayerActions((prev) => {
                  const newMap = new Map(prev);
                  newMap.delete(idx);
                  return newMap;
                });
                aiTurnProcessingRef.current = false;
                addDebugLog("🔓 AI turn processing unlocked (bust)");
                setActivePlayerIndex(null);
              }, CARD_ANIMATION_DURATION);
            } else if (newHandValue >= 21) {
              addDebugLog(`AI Player ${idx} reached 21!`);
              addDebugLog(`Marking AI Player ${idx} as FINISHED (21)`);

              setPlayersFinished((prev) => new Set(prev).add(idx));

              setPlayerActions((prev) => {
                const newMap = new Map(prev);
                newMap.delete(idx);
                return newMap;
              });

              registerTimeout(() => {
                setPlayerActions((prev) => new Map(prev).set(idx, "STAND"));
              }, 100);

              registerTimeout(() => {
                setPlayerActions((prev) => {
                  const newMap = new Map(prev);
                  newMap.delete(idx);
                  return newMap;
                });
                aiTurnProcessingRef.current = false;
                addDebugLog("🔓 AI turn processing unlocked (21)");
                setActivePlayerIndex(null);
              }, 600);
            } else {
              // Player continues - unlock to allow next decision
              addDebugLog(`AI Player ${idx} continues with ${newHandValue}`);

              registerTimeout(
                () => {
                  aiTurnProcessingRef.current = false;
                  addDebugLog("🔓 AI turn processing unlocked (continue)");
                  setActivePlayerIndex(null);
                },
                800 + actionDisplay + turnClear,
              );
            }
          }, CARD_ANIMATION_DURATION);
        }, decisionTime + 50);

        registerTimeout(
          () => {
            setPlayerActions((prev) => {
              const newMap = new Map(prev);
              if (newMap.get(idx) === "HIT") {
                newMap.delete(idx);
              }
              return newMap;
            });
          },
          decisionTime + 50 + 800 + actionDisplay,
        );
      } else {
        addDebugLog(`AI Player ${idx} decision: STAND`);
        addDebugLog(`Marking AI Player ${idx} as FINISHED (stand)`);

        setPlayersFinished((prev) => new Set(prev).add(idx));

        // Show hand-based dialogue when standing (20% chance)
        if (Math.random() < 0.20) {
          let dialogue: string | null = null;

          // Try to get hand-specific dialogue
          const isSoft = isSoftHand(ai.hand.cards);

          if (isSoft && ai.hand.cards.length === 2) {
            // Get soft hand saying (A,7 through A,9 typically stand)
            const aceCard = ai.hand.cards.find(c => c.rank === 'A');
            const otherCard = ai.hand.cards.find(c => c.rank !== 'A');
            if (aceCard && otherCard && otherCard.rank !== 'A' && otherCard.rank !== '10' && otherCard.rank !== 'J' && otherCard.rank !== 'Q' && otherCard.rank !== 'K') {
              dialogue = getRandomSoftHandSaying(ai.character.id, otherCard.rank);
            }
          }

          // If no soft hand saying, try regular hand total saying
          if (!dialogue && handValue >= 12 && handValue <= 21) {
            dialogue = getRandomSayingForTotal(ai.character.id, handValue);
          }

          // Fallback to banter
          if (!dialogue) {
            const characterDialogue = CHARACTER_DIALOGUE[ai.character.id];
            const banterLines = characterDialogue?.banterWithPlayer;
            if (banterLines && banterLines.length > 0) {
              dialogue = pick(banterLines).text;
            }
          }

          if (dialogue) {
            registerTimeout(() => {
              addSpeechBubble(
                `ai-stand-dialogue-${idx}-${Date.now()}`,
                dialogue!,
                ai.position,
              );
            }, decisionTime + 800); // Delay 800ms after stand decision shows
          }
        }

        registerTimeout(() => {
          setPlayerActions((prev) => new Map(prev).set(idx, "STAND"));
        }, decisionTime);

        registerTimeout(() => {
          setPlayerActions((prev) => {
            const newMap = new Map(prev);
            newMap.delete(idx);
            return newMap;
          });
        }, decisionTime + actionDisplay);

        registerTimeout(
          () => {
            aiTurnProcessingRef.current = false;
            setActivePlayerIndex(null);
          },
          decisionTime + actionDisplay + turnClear,
        );
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    phase,
    activePlayerIndex,
    playersFinished,
    // Functions and complex objects intentionally omitted - they change on every render:
    // aiPlayers, dealerHand, dealCardFromShoe, registerTimeout,
    // getCardPositionForAnimation, addDebugLog, addSpeechBubble
  ]);
}
