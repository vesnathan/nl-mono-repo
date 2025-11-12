import { useEffect, useRef } from "react";
import {
  GamePhase,
  AIPlayer,
  PlayerHand,
  FlyingCardData,
} from "@/types/gameState";
import { Card } from "@/types/game";
import {
  calculateHandValue,
  isBusted,
  isSoftHand,
  canSplit as canSplitCards,
} from "@/lib/gameActions";
import {
  CHARACTER_DIALOGUE,
  pick,
  getRandomSayingForTotal,
  getRandomSoftHandSaying,
  getRandomDistraction,
  getDecisionCommentary,
} from "@/data/dialogue";
import { getBasicStrategyAction } from "@/lib/basicStrategy";
import { CARD_ANIMATION_DURATION } from "@/constants/animations";
import { DEFAULT_GAME_SETTINGS } from "@/types/gameSettings";
import { generateBustReaction } from "@/utils/reactions";
import { debugLog } from "@/utils/debug";

interface UseAITurnsPhaseParams {
  phase: GamePhase;
  aiPlayers: AIPlayer[];
  dealerHand: PlayerHand;
  activePlayerIndex: number | null;
  playersFinished: Set<number>;
  playerSeat: number | null;
  playerHand: PlayerHand;
  playerFinished: boolean;
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
  addSpeechBubble: (
    id: string,
    message: string,
    position: number,
    reactionType?:
      | "bust"
      | "hit21"
      | "goodHit"
      | "badStart"
      | "win"
      | "loss"
      | "dealer_blackjack"
      | "distraction",
    priority?: number,
  ) => void;
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
  playerSeat,
  playerHand,
  playerFinished,
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
}: UseAITurnsPhaseParams) {
  const aiTurnProcessingRef = useRef<boolean>(false);
  const cardCounterRef = useRef(0);
  const isTransitioningRef = useRef<boolean>(false);
  const prevPhaseRef = useRef<GamePhase | null>(null);
  const hasResetRef = useRef<boolean>(false);

  // eslint-disable-next-line sonarjs/cognitive-complexity
  useEffect(() => {
    // Reset playersFinished when entering AI_TURNS phase for the first time
    if (
      phase === "AI_TURNS" &&
      prevPhaseRef.current !== "AI_TURNS" &&
      !hasResetRef.current
    ) {
      debugLog(
        "aiTurns",
        "[AI_TURNS] Resetting playersFinished on phase entry",
      );
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
      debugLog(
        "aiTurns",
        `[AI_TURNS Effect] Skipping - activePlayerIndex is ${activePlayerIndex}`,
      );
      return;
    }

    if (aiTurnProcessingRef.current || isTransitioningRef.current) {
      debugLog(
        "aiTurns",
        `[AI_TURNS Effect] Skipping - processing=${aiTurnProcessingRef.current}, transitioning=${isTransitioningRef.current}`,
      );
      return;
    }

    debugLog("aiTurns", `[AI_TURNS Effect] Starting turn logic`);
    debugLog(
      "aiTurns",
      `[AI_TURNS Effect] playersFinished size: ${playersFinished.size}, contents: [${Array.from(playersFinished).join(", ")}]`,
    );

    aiTurnProcessingRef.current = true;

    if (phase === "AI_TURNS" && activePlayerIndex === null) {
      const playersByPosition = aiPlayers
        .map((ai, idx) => ({ ai, idx, position: ai.position }))
        .sort((a, b) => a.position - b.position);

      const turnOrderStr = playersByPosition
        .map((p) => `${p.ai.character.name} (idx:${p.idx}, seat:${p.position})`)
        .join(", ");
      debugLog("aiTurns", `Turn order (sorted by position): ${turnOrderStr}`);
      debugLog(
        "aiTurns",
        `Players finished: [${Array.from(playersFinished).join(", ")}]`,
      );
      const dealerCardsStr = dealerHand.cards
        .map((c) => `${c.rank}${c.suit}`)
        .join(", ");
      debugLog(
        "aiTurns",
        `Dealer hand cards: ${dealerCardsStr} (${dealerHand.cards.length} cards)`,
      );

      const nextPlayer = playersByPosition.find(({ ai, idx }) => {
        if (playersFinished.has(idx)) {
          debugLog(
            "aiTurns",
            `  ${ai.character.name} (idx:${idx}) - SKIPPED (already finished)`,
          );
          return false;
        }

        const handValue = calculateHandValue(ai.hand.cards);
        const isBust = isBusted(ai.hand.cards);

        const aiHandStr = ai.hand.cards
          .map((c) => `${c.rank}${c.suit}`)
          .join(", ");
        debugLog(
          "aiTurns",
          `  ${ai.character.name} (idx:${idx}) - Hand: ${aiHandStr} (value: ${handValue}, busted: ${isBust})`,
        );

        if (isBust) {
          debugLog(
            "aiTurns",
            `  ${ai.character.name} (idx:${idx}) - SKIPPED (busted)`,
          );
          return false;
        }
        if (handValue < 21) {
          debugLog(
            "aiTurns",
            `  ${ai.character.name} (idx:${idx}) - SELECTED (hand < 21)`,
          );
          return true;
        }
        if (handValue === 21) {
          debugLog(
            "aiTurns",
            `  ${ai.character.name} (idx:${idx}) - SELECTED (hand = 21)`,
          );
          return true;
        }

        return false;
      });

      if (!nextPlayer) {
        debugLog("aiTurns", "=== ALL AI PLAYERS FINISHED ===");
        debugLog(
          "aiTurns",
          `Players finished: ${Array.from(playersFinished).join(", ")}`,
        );

        // Check if human player needs to act
        if (
          playerSeat !== null &&
          !playerFinished &&
          playerHand.cards.length > 0
        ) {
          debugLog(
            "aiTurns",
            `Player in seat ${playerSeat} has not finished yet - transitioning to PLAYER_TURN`,
          );
          isTransitioningRef.current = true;
          registerTimeout(() => setPhase("PLAYER_TURN"), 1000);
          return;
        }

        debugLog("aiTurns", "Moving to DEALER_TURN phase");
        isTransitioningRef.current = true;
        registerTimeout(() => setPhase("DEALER_TURN"), 1000);
        return;
      }

      const { ai, idx } = nextPlayer;

      // Check if human player's turn comes before this AI player
      debugLog(
        "aiTurns",
        `=== CHECKING IF PLAYER SHOULD GO BEFORE AI ${idx} ===`,
      );
      debugLog("aiTurns", `  Player seat: ${playerSeat}`);
      debugLog("aiTurns", `  Player finished: ${playerFinished}`);
      debugLog("aiTurns", `  Player has cards: ${playerHand.cards.length > 0}`);
      debugLog("aiTurns", `  AI player seat: ${ai.position}`);
      debugLog(
        "aiTurns",
        `  Player seat < AI seat: ${playerSeat !== null && ai.position > playerSeat}`,
      );

      if (
        playerSeat !== null &&
        !playerFinished &&
        playerHand.cards.length > 0 &&
        ai.position > playerSeat
      ) {
        debugLog(
          "aiTurns",
          `✓ Player in seat ${playerSeat} should act BEFORE AI player in seat ${ai.position}`,
        );
        debugLog("aiTurns", "→ Transitioning to PLAYER_TURN");
        isTransitioningRef.current = true;
        aiTurnProcessingRef.current = false;
        registerTimeout(() => setPhase("PLAYER_TURN"), 1000);
        return;
      }
      debugLog("aiTurns", `✗ Player does NOT need to act before AI ${idx}`);

      debugLog(
        "aiTurns",
        `=== AI PLAYER ${idx} TURN (${ai.character.name}, Seat ${ai.position}) ===`,
      );
      const currentHandStr = ai.hand.cards
        .map((c) => `${c.rank}${c.suit}`)
        .join(", ");
      debugLog("aiTurns", `Current hand: ${currentHandStr}`);

      const handValue = calculateHandValue(ai.hand.cards);
      const isBust = isBusted(ai.hand.cards);

      debugLog("aiTurns", `Hand value: ${handValue}, Busted: ${isBust}`);

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

      // Check for blackjack - don't highlight player if they have blackjack (automatic stand)
      const hasBlackjack = ai.hand.cards.length === 2 && handValue === 21;

      // Only set active player if not blackjack
      if (!hasBlackjack) {
        setActivePlayerIndex(idx);
      }

      const dealerUpCard = dealerHand.cards[0];

      // Check if AI can split (AI has unlimited chips, but we skip double since bet size doesn't matter)
      const canSplitHand =
        ai.hand.cards.length === 2 && canSplitCards(ai.hand.cards);

      // Get basic strategy action (considers split, hit, stand - skip double for AI)
      const basicStrategyAction = getBasicStrategyAction(
        ai.hand.cards,
        dealerUpCard,
        DEFAULT_GAME_SETTINGS,
        canSplitHand,
        false, // Don't suggest double for AI - bet size doesn't matter
      );

      // Determine if AI follows basic strategy based on skill level
      const followsBasicStrategy =
        Math.random() * 100 < ai.character.skillLevel;

      // If not following basic strategy, fall back to simple rule
      let action = basicStrategyAction;
      if (!followsBasicStrategy) {
        // Simple fallback: hit if < 17, stand otherwise
        action = handValue < 17 ? "H" : "S";
      }

      // Convert double to hit for AI (in case basic strategy still suggests it)
      if (action === "D") {
        action = "H";
      }

      debugLog(
        "aiTurns",
        `Dealer up card: ${dealerUpCard.rank}${dealerUpCard.suit}`,
      );
      debugLog("aiTurns", `Can split: ${canSplitHand}`);
      debugLog(
        "aiTurns",
        `Basic strategy says: ${basicStrategyAction} (converted D to H for AI)`,
      );
      debugLog(
        "aiTurns",
        `Follows basic strategy: ${followsBasicStrategy}, Final decision: ${action}`,
      );

      // Show strategy-aware decision commentary BEFORE the action (30% chance)
      if (Math.random() < 0.3) {
        const isCorrectPlay = action === basicStrategyAction;
        let decisionText: "hit" | "stand" | "double" | "split" = "hit";
        if (action === "S") decisionText = "stand";
        else if (action === "SP") decisionText = "split";

        const commentary = getDecisionCommentary(
          ai.character.id,
          decisionText,
          ai.character.skillLevel,
          handValue,
          isCorrectPlay,
        );

        if (commentary) {
          // Show commentary early in decision time (before action displays)
          registerTimeout(() => {
            addSpeechBubble(
              `decision-commentary-${idx}-${Date.now()}`,
              commentary,
              ai.position,
              "distraction", // Audio type for commentary
              0, // LOW priority
            );
          }, decisionTime / 3); // Show 1/3 into decision time
        }
      }

      // Handle SPLIT action
      if (action === "SP" && canSplitHand) {
        debugLog("aiTurns", `AI Player ${idx} decision: SPLIT`);

        // Show SPLIT action indicator
        registerTimeout(() => {
          setPlayerActions((prev) => new Map(prev).set(idx, "SPLIT"));
        }, decisionTime);

        // Execute split after short delay
        registerTimeout(() => {
          const [card1, card2] = ai.hand.cards;
          debugLog(
            "aiTurns",
            `Splitting ${card1.rank}${card1.suit} and ${card2.rank}${card2.suit}`,
          );

          // Create two hands
          const hand1: PlayerHand = { cards: [card1], bet: ai.hand.bet };
          const hand2: PlayerHand = { cards: [card2], bet: ai.hand.bet };

          // Deal card to first hand
          registerTimeout(() => {
            const newCard1 = dealCardFromShoe();
            hand1.cards.push(newCard1);
            debugLog(
              "aiTurns",
              `Dealt to first hand: ${newCard1.rank}${newCard1.suit}`,
            );

            // Deal card to second hand
            registerTimeout(() => {
              const newCard2 = dealCardFromShoe();
              hand2.cards.push(newCard2);
              debugLog(
                "aiTurns",
                `Dealt to second hand: ${newCard2.rank}${newCard2.suit}`,
              );

              // Update AI player with split hands
              setAIPlayers((prev) => {
                const updated = [...prev];
                updated[idx] = {
                  ...updated[idx],
                  hand: {
                    cards: [],
                    bet: ai.hand.bet,
                    isSplit: true,
                    splitHands: [hand1, hand2],
                    activeSplitHandIndex: 0,
                  },
                };
                return updated;
              });

              debugLog("aiTurns", "AI split complete - will play both hands");

              // Clear action indicator and continue
              registerTimeout(() => {
                setPlayerActions((prev) => {
                  const newMap = new Map(prev);
                  newMap.delete(idx);
                  return newMap;
                });
                aiTurnProcessingRef.current = false;
                setActivePlayerIndex(null);
              }, 1000);
            }, CARD_ANIMATION_DURATION + 200);
          }, 500);
        }, decisionTime + 50);

        return; // Exit early for split
      }

      // Handle HIT action
      if (action === "H" && !isBust) {
        // Show hand-based dialogue with higher frequency (25%)
        if (Math.random() < 0.25) {
          let dialogue: string | null = null;

          // Try to get hand-specific dialogue
          const isSoft = isSoftHand(ai.hand.cards);

          if (isSoft && ai.hand.cards.length === 2) {
            // Get soft hand saying (A,2 through A,9)
            const aceCard = ai.hand.cards.find((c) => c.rank === "A");
            const otherCard = ai.hand.cards.find((c) => c.rank !== "A");
            if (
              aceCard &&
              otherCard &&
              otherCard.rank !== "A" &&
              otherCard.rank !== "10" &&
              otherCard.rank !== "J" &&
              otherCard.rank !== "Q" &&
              otherCard.rank !== "K"
            ) {
              dialogue = getRandomSoftHandSaying(
                ai.character.id,
                otherCard.rank,
              );
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
                ai.character.id, // Use actual character ID for audio lookup
                dialogue!,
                ai.position,
                "distraction", // Audio type for banter
                0, // LOW priority
              );
            }, decisionTime / 2);
          }
        }

        registerTimeout(() => {
          setPlayerActions((prev) => new Map(prev).set(idx, "HIT"));
        }, decisionTime);

        registerTimeout(() => {
          const card = dealCardFromShoe();
          debugLog(
            "aiTurns",
            `Dealt card: ${card.rank}${card.suit} (value: ${card.value}, count: ${card.count})`,
          );

          const shoePosition = getCardPositionForAnimation("shoe");
          const aiPosition = getCardPositionForAnimation(
            "ai",
            idx,
            ai.hand.cards.length,
          );

          const flyingCard: FlyingCardData = {
            id: `hit-ai-${idx}-${Date.now()}-${(cardCounterRef.current += 1)}`,
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

            debugLog(
              "aiTurns",
              `New hand value: ${newHandValue}, Busted: ${busted}`,
            );

            if (busted) {
              debugLog("aiTurns", `AI Player ${idx} BUSTED!`);
              debugLog(
                "aiTurns",
                `Marking AI Player ${idx} as FINISHED (busted)`,
              );

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
                debugLog(
                  "aiTurns",
                  `Showing bust reaction: ${bustReaction.message}`,
                );
                registerTimeout(() => {
                  addSpeechBubble(
                    updatedAI.character.id, // Use actual character ID for audio generation
                    bustReaction.message,
                    bustReaction.position,
                    "bust", // Audio type for bust reaction
                    3, // IMMEDIATE priority - interrupts everything
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
                debugLog("aiTurns", "🔓 AI turn processing unlocked (bust)");
                setActivePlayerIndex(null);
              }, CARD_ANIMATION_DURATION);
            } else if (newHandValue >= 21) {
              debugLog("aiTurns", `AI Player ${idx} reached 21!`);
              debugLog("aiTurns", `Marking AI Player ${idx} as FINISHED (21)`);

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
                debugLog("aiTurns", "🔓 AI turn processing unlocked (21)");
                setActivePlayerIndex(null);
              }, 600);
            } else {
              // Player continues - unlock to allow next decision
              debugLog(
                "aiTurns",
                `AI Player ${idx} continues with ${newHandValue}`,
              );

              registerTimeout(
                () => {
                  aiTurnProcessingRef.current = false;
                  debugLog(
                    "aiTurns",
                    "🔓 AI turn processing unlocked (continue)",
                  );
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
        debugLog("aiTurns", `AI Player ${idx} decision: STAND`);
        debugLog("aiTurns", `Marking AI Player ${idx} as FINISHED (stand)`);

        setPlayersFinished((prev) => new Set(prev).add(idx));

        // Show hand-based dialogue when standing (50% chance)
        if (Math.random() < 0.5) {
          let dialogue: string | null = null;

          // Try to get hand-specific dialogue
          const isSoft = isSoftHand(ai.hand.cards);

          if (isSoft && ai.hand.cards.length === 2) {
            // Get soft hand saying (A,7 through A,9 typically stand)
            const aceCard = ai.hand.cards.find((c) => c.rank === "A");
            const otherCard = ai.hand.cards.find((c) => c.rank !== "A");
            if (
              aceCard &&
              otherCard &&
              otherCard.rank !== "A" &&
              otherCard.rank !== "10" &&
              otherCard.rank !== "J" &&
              otherCard.rank !== "Q" &&
              otherCard.rank !== "K"
            ) {
              dialogue = getRandomSoftHandSaying(
                ai.character.id,
                otherCard.rank,
              );
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
                ai.character.id, // Use actual character ID for audio lookup
                dialogue!,
                ai.position,
                "distraction", // Audio type for stand dialogue
                0, // LOW priority
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
    // getCardPositionForAnimation, addSpeechBubble
  ]);
}
