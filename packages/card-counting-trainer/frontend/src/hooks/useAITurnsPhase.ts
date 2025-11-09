import { useEffect, useRef } from "react";
import {
  GamePhase,
  AIPlayer,
  PlayerHand,
  FlyingCardData,
} from "@/types/gameState";
import { Card } from "@/types/game";
import { calculateHandValue, isBusted } from "@/lib/gameActions";
import { AI_DIALOGUE_ADDONS, pick } from "@/data/ai-dialogue-addons";
import { shouldHitBasicStrategy } from "@/utils/aiStrategy";
import { CARD_ANIMATION_DURATION } from "@/constants/animations";

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

  useEffect(() => {
    if (phase !== "AI_TURNS") {
      aiTurnProcessingRef.current = false;
      return;
    }

    if (activePlayerIndex !== null) {
      return;
    }

    if (aiTurnProcessingRef.current) {
      return;
    }

    aiTurnProcessingRef.current = true;

    if (phase === "AI_TURNS" && activePlayerIndex === null) {
      const playersByPosition = aiPlayers
        .map((ai, idx) => ({ ai, idx, position: ai.position }))
        .sort((a, b) => b.position - a.position);

      addDebugLog(
        `Turn order (sorted by position): ${playersByPosition.map((p) => `${p.ai.character.name} (idx:${p.idx}, seat:${p.position})`).join(", ")}`,
      );
      addDebugLog(
        `Players finished: [${Array.from(playersFinished).join(", ")}]`,
      );

      const nextPlayer = playersByPosition.find(({ ai, idx }) => {
        if (playersFinished.has(idx)) return false;

        const handValue = calculateHandValue(ai.hand.cards);
        const isBust = isBusted(ai.hand.cards);

        if (isBust) return false;
        if (handValue < 21) return true;
        if (handValue === 21) return true;

        return false;
      });

      if (!nextPlayer) {
        addDebugLog("=== ALL AI PLAYERS FINISHED ===");
        addDebugLog(
          `Players finished: ${Array.from(playersFinished).join(", ")}`,
        );
        addDebugLog("Moving to DEALER_TURN phase");
        aiTurnProcessingRef.current = false;
        addDebugLog("🔓 AI turn processing unlocked (all finished)");
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

      const baseDecisionTime = 800;
      const baseActionDisplay = 600;
      const baseTurnClear = 100;

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
        if (Math.random() < 0.15) {
          const banterLines = AI_DIALOGUE_ADDONS.find(
            (addon) => addon.id === ai.character.id,
          )?.banterWithPlayer;

          if (banterLines && banterLines.length > 0) {
            const randomBanter = pick(banterLines);
            registerTimeout(() => {
              addSpeechBubble(
                `ai-turn-banter-${idx}-${Date.now()}`,
                randomBanter.text,
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

          setTimeout(() => {
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

              setPlayersFinished((prev) => new Set(prev).add(idx));

              setPlayerActions((prev) => {
                const newMap = new Map(prev);
                newMap.delete(idx);
                return newMap;
              });

              setTimeout(() => {
                setPlayerActions((prev) => new Map(prev).set(idx, "BUST"));
              }, 100);

              setTimeout(() => {
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

              setTimeout(() => {
                setPlayerActions((prev) => new Map(prev).set(idx, "STAND"));
              }, 100);

              setTimeout(() => {
                setPlayerActions((prev) => {
                  const newMap = new Map(prev);
                  newMap.delete(idx);
                  return newMap;
                });
                aiTurnProcessingRef.current = false;
                addDebugLog("🔓 AI turn processing unlocked (21)");
                setActivePlayerIndex(null);
              }, 600);
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

        registerTimeout(
          () => {
            aiTurnProcessingRef.current = false;
            addDebugLog("🔓 AI turn processing unlocked (hit, continuing)");
            setActivePlayerIndex(null);
          },
          decisionTime + 50 + 800 + actionDisplay + turnClear + decisionTime,
        );
      } else {
        addDebugLog(`AI Player ${idx} decision: STAND`);
        addDebugLog(`Marking AI Player ${idx} as FINISHED (stand)`);

        setPlayersFinished((prev) => new Set(prev).add(idx));

        if (Math.random() < 0.15) {
          const banterLines = AI_DIALOGUE_ADDONS.find(
            (addon) => addon.id === ai.character.id,
          )?.banterWithPlayer;

          if (banterLines && banterLines.length > 0) {
            const randomBanter = pick(banterLines);
            registerTimeout(() => {
              addSpeechBubble(
                `ai-turn-banter-${idx}-${Date.now()}`,
                randomBanter.text,
                ai.position,
              );
            }, decisionTime / 2);
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
            addDebugLog("🔓 AI turn processing unlocked (stand)");
            setActivePlayerIndex(null);
          },
          decisionTime + actionDisplay + turnClear,
        );
      }
    }
  }, [
    phase,
    aiPlayers,
    dealCardFromShoe,
    registerTimeout,
    activePlayerIndex,
    playersFinished,
    dealerHand,
    getCardPositionForAnimation,
    addDebugLog,
    setActivePlayerIndex,
    setPlayersFinished,
    setPlayerActions,
    setAIPlayers,
    setFlyingCards,
    setPhase,
    addSpeechBubble,
  ]);
}
