import { useCallback } from "react";
import {
  AIPlayer,
  PlayerHand,
  GamePhase,
  FlyingCardData,
} from "@/types/gameState";
import { Card as GameCard } from "@/types/game";
import { DealerCharacter } from "@/data/dealerCharacters";
import { dealCard, calculateHandValue, isBlackjack } from "@/lib/gameActions";
import { CARD_ANIMATION_DURATION } from "@/constants/animations";
import { GameSettings } from "@/types/gameSettings";
import { getInitialHandReaction } from "@/data/dialogue";

// Module-level counter for unique card IDs
let cardIdCounter = 0;

interface UseGameActionsParams {
  // State
  phase: GamePhase;
  playerSeat: number | null;
  playerHand: PlayerHand;
  dealerHand: PlayerHand;
  aiPlayers: AIPlayer[];
  shoe: GameCard[];
  cardsDealt: number;
  runningCount: number;
  shoesDealt: number;
  gameSettings: GameSettings;
  currentDealer: DealerCharacter | null;

  // Setters
  setPhase: (phase: GamePhase) => void;
  setCurrentBet: (bet: number) => void;
  setDealerRevealed: (revealed: boolean) => void;
  setDealerCallout: (callout: string | null) => void;
  setPlayerHand: (
    hand: PlayerHand | ((prev: PlayerHand) => PlayerHand),
  ) => void;
  setDealerHand: (
    hand: PlayerHand | ((prev: PlayerHand) => PlayerHand),
  ) => void;
  setSpeechBubbles: (bubbles: any[]) => void;
  setAIPlayers: (
    players: AIPlayer[] | ((prev: AIPlayer[]) => AIPlayer[]),
  ) => void;
  setFlyingCards: (
    cards: FlyingCardData[] | ((prev: FlyingCardData[]) => FlyingCardData[]),
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
  setShoe: (shoe: GameCard[]) => void;
  setCardsDealt: (cards: number) => void;
  setRunningCount: (count: number) => void;
  setShoesDealt: (shoes: number) => void;

  // Functions
  dealCardFromShoe: () => GameCard;
  registerTimeout: (callback: () => void, delay: number) => void;
  getCardPosition: (
    type: "ai" | "player" | "dealer" | "shoe",
    aiPlayers: AIPlayer[],
    playerSeat: number | null,
    index?: number,
    cardIndex?: number,
  ) => { left: string; top: string };
  addSpeechBubble: (playerId: string, message: string, position: number) => void;
  addDebugLog: (message: string) => void;
}

export function useGameActions({
  phase,
  playerSeat,
  playerHand,
  dealerHand,
  aiPlayers,
  shoe,
  cardsDealt,
  runningCount,
  shoesDealt,
  gameSettings,
  currentDealer,
  setPhase,
  setCurrentBet,
  setDealerRevealed,
  setDealerCallout,
  setPlayerHand,
  setDealerHand,
  setSpeechBubbles,
  setAIPlayers,
  setFlyingCards,
  setPlayerActions,
  setShoe,
  setCardsDealt,
  setRunningCount,
  setShoesDealt,
  dealCardFromShoe,
  registerTimeout,
  getCardPosition,
  addSpeechBubble,
  addDebugLog,
}: UseGameActionsParams) {
  const startNewRound = useCallback(() => {
    setPhase("BETTING");
    setCurrentBet(0); // Reset bet for new round
    setDealerRevealed(false);
    setPlayerHand({ cards: [], bet: 0 });
    setDealerHand({ cards: [], bet: 0 });
    setSpeechBubbles([]); // Clear any lingering speech bubbles

    // Reset AI hands (they'll bet when player confirms)
    const updatedAI = aiPlayers.map((ai) => ({
      ...ai,
      hand: { cards: [], bet: 0 },
    }));
    setAIPlayers(updatedAI);
  }, [
    aiPlayers,
    setPhase,
    setCurrentBet,
    setDealerRevealed,
    setPlayerHand,
    setDealerHand,
    setSpeechBubbles,
    setAIPlayers,
  ]);

  const dealInitialCards = useCallback(() => {
    addDebugLog("=== DEALING PHASE START ===");
    addDebugLog(`Shoe cards remaining: ${shoe.length}`);
    addDebugLog(`Cards dealt this shoe: ${cardsDealt}`);
    addDebugLog(`Running count: ${runningCount}`);
    addDebugLog(`Number of AI players: ${aiPlayers.length}`);
    addDebugLog(
      `Player seated: ${playerSeat !== null ? `Yes (Seat ${playerSeat})` : "No (observing)"}`,
    );

    // Pre-deal all cards BEFORE animations to ensure uniqueness
    // We need to manually track the shoe state because React batches state updates
    const dealtCards: { type: string; index: number; card: GameCard; cardIndex: number }[] = [];
    let currentShoe = [...shoe];
    let currentCardsDealt = cardsDealt;
    let currentRunningCount = runningCount;
    let currentShoesDealt = shoesDealt;

    // Helper to deal from the current shoe state
    const dealFromCurrentShoe = () => {
      const { card, remainingShoe, reshuffled } = dealCard(
        currentShoe,
        gameSettings.numberOfDecks,
        gameSettings.countingSystem,
      );

      if (reshuffled) {
        currentShoe = remainingShoe;
        currentCardsDealt = 1;
        currentRunningCount = card.count;
        currentShoesDealt += 1;
      } else {
        currentShoe = remainingShoe;
        currentCardsDealt += 1;
        currentRunningCount += card.count;
      }

      return card;
    };

    // Sort AI players by position (first base to third base = ascending, since seat 0=first base)
    const sortedAIPlayers = [...aiPlayers].sort(
      (a, b) => a.position - b.position,
    );

    addDebugLog("--- First card round (right to left) ---");
    // Deal first card to everyone (right to left, dealer last)
    sortedAIPlayers.forEach((ai) => {
      const idx = aiPlayers.indexOf(ai);
      const card = dealFromCurrentShoe();
      addDebugLog(
        `AI Player ${idx} (${ai.character.name}, Seat ${ai.position}): ${card.rank}${card.suit} (value: ${card.value}, count: ${card.count}) | Running count: ${currentRunningCount}`,
      );
      dealtCards.push({ type: "ai", index: idx, card, cardIndex: 0 });
    });
    if (playerSeat !== null) {
      const card = dealFromCurrentShoe();
      addDebugLog(
        `Player (Seat ${playerSeat}): ${card.rank}${card.suit} (value: ${card.value}, count: ${card.count}) | Running count: ${currentRunningCount}`,
      );
      dealtCards.push({ type: "player", index: 0, card, cardIndex: 0 });
    }
    const dealerCard1 = dealFromCurrentShoe();
    addDebugLog(
      `Dealer card 1: ${dealerCard1.rank}${dealerCard1.suit} (value: ${dealerCard1.value}, count: ${dealerCard1.count}) [FACE UP] | Running count: ${currentRunningCount}`,
    );
    dealtCards.push({ type: "dealer", index: 0, card: dealerCard1, cardIndex: 0 });

    addDebugLog("--- Second card round (right to left) ---");
    // Deal second card to everyone (right to left, dealer last)
    sortedAIPlayers.forEach((ai) => {
      const idx = aiPlayers.indexOf(ai);
      const card = dealFromCurrentShoe();
      addDebugLog(
        `AI Player ${idx} (${ai.character.name}): ${card.rank}${card.suit} (value: ${card.value}, count: ${card.count}) | Running count: ${currentRunningCount}`,
      );
      dealtCards.push({ type: "ai", index: idx, card, cardIndex: 1 });
    });
    if (playerSeat !== null) {
      const card = dealFromCurrentShoe();
      addDebugLog(
        `Player: ${card.rank}${card.suit} (value: ${card.value}, count: ${card.count}) | Running count: ${currentRunningCount}`,
      );
      dealtCards.push({ type: "player", index: 0, card, cardIndex: 1 });
    }
    const dealerCard2 = dealFromCurrentShoe();
    addDebugLog(
      `Dealer card 2: ${dealerCard2.rank}${dealerCard2.suit} (value: ${dealerCard2.value}, count: ${dealerCard2.count}) [FACE DOWN - not counting] | Running count: ${currentRunningCount}`,
    );
    dealtCards.push({ type: "dealer", index: 1, card: dealerCard2, cardIndex: 1 });

    // Update state with all pre-dealt cards
    setShoe(currentShoe);
    setCardsDealt(currentCardsDealt);
    setRunningCount(currentRunningCount);
    setShoesDealt(currentShoesDealt);

    // Animate cards one by one
    let delay = 0;
    dealtCards.forEach((dealData) => {
      registerTimeout(() => {
        const shoePosition = getCardPosition("shoe", aiPlayers, playerSeat);

        let targetPosition: { left: string; top: string };
        if (dealData.type === "dealer") {
          targetPosition = getCardPosition(
            "dealer",
            aiPlayers,
            playerSeat,
            undefined,
            dealData.cardIndex,
          );
        } else if (dealData.type === "player") {
          targetPosition = getCardPosition(
            "player",
            aiPlayers,
            playerSeat,
            undefined,
            dealData.cardIndex,
          );
        } else {
          targetPosition = getCardPosition(
            "ai",
            aiPlayers,
            playerSeat,
            dealData.index,
            dealData.cardIndex,
          );
        }

        const flyingCard: FlyingCardData = {
          id: `deal-${dealData.type}-${dealData.index}-${Date.now()}-${cardIdCounter++}`,
          card: dealData.card,
          fromPosition: shoePosition,
          toPosition: targetPosition,
        };

        setFlyingCards((prev) => [...prev, flyingCard]);

        // Remove flying card and update hand after animation
        registerTimeout(() => {
          setFlyingCards((prev) =>
            prev.filter((fc) => fc.id !== flyingCard.id),
          );

          if (dealData.type === "dealer") {
            setDealerHand((prev) => ({
              ...prev,
              cards: [...prev.cards, dealData.card],
            }));
          } else if (dealData.type === "player") {
            setPlayerHand((prev) => ({
              ...prev,
              cards: [...prev.cards, dealData.card],
            }));
          } else {
            setAIPlayers((prev) => {
              const updated = [...prev];
              updated[dealData.index] = {
                ...updated[dealData.index],
                hand: {
                  ...updated[dealData.index].hand,
                  cards: [...updated[dealData.index].hand.cards, dealData.card],
                },
              };
              return updated;
            });

            // Show initial reaction after AI receives their second card
            if (dealData.cardIndex === 1) {
              registerTimeout(() => {
                const ai = aiPlayers[dealData.index];
                // Get the two cards this AI has now
                const firstCard = dealtCards.find(
                  (d) => d.type === "ai" && d.index === dealData.index && d.cardIndex === 0
                )?.card;

                if (firstCard) {
                  const twoCards = [firstCard, dealData.card];
                  const handValue = calculateHandValue(twoCards);
                  const hasBlackjack = isBlackjack(twoCards);
                  const dealerUpCard = dealerCard1;

                  const reaction = getInitialHandReaction(
                    ai.character,
                    handValue,
                    hasBlackjack,
                    dealerUpCard
                  );

                  if (reaction) {
                    addSpeechBubble(ai.character.id, reaction, ai.position);
                  }
                }
              }, 800); // Short delay after card arrives
            }
          }
        }, CARD_ANIMATION_DURATION);
      }, delay);

      delay += CARD_ANIMATION_DURATION + 200; // Stagger cards with 200ms gap
    });

    // After all cards are dealt, check for dealer blackjack and transition phase
    registerTimeout(
      () => {
        addDebugLog("All cards dealt and animations complete");

        // Check if dealer should peek for blackjack (American rules)
        const shouldPeek = gameSettings.dealerPeekRule === "AMERICAN_PEEK";
        const dealerUpCard = dealerCard1;
        const canHaveBlackjack = dealerUpCard.rank === "A" || dealerUpCard.value === 10;

        if (shouldPeek && canHaveBlackjack) {
          // Show "Peeking..." callout
          setDealerCallout("Peeking...");

          registerTimeout(() => {
            setDealerCallout(null);

            // Check for dealer blackjack (natural 21 with 2 cards)
            const dealerCards = [dealerCard1, dealerCard2];
            const dealerValue = calculateHandValue(dealerCards);
            if (dealerValue === 21) {
              addDebugLog(
                "DEALER BLACKJACK! Revealing hole card and moving to RESOLVING",
              );
              setDealerRevealed(true);
              setDealerCallout("Blackjack!");

              // Skip player turn and AI turns, go straight to resolving
              registerTimeout(() => {
                setDealerCallout(null);
                setPhase("RESOLVING");
              }, 2000);
            } else {
              addDebugLog(`Dealer showing: ${dealerCard1.rank}${dealerCard1.suit}`);
              addDebugLog(
                `Dealer hole card: ${dealerCard2.rank}${dealerCard2.suit} [hidden]`,
              );

              // Move to next phase after peek
              proceedAfterPeek();
            }
          }, 1500); // Peek delay
          return; // Exit early, will continue after peek
        }

        // No peek needed
        proceedAfterPeek();

        function proceedAfterPeek() {
          addDebugLog(`Running count after dealing: ${currentRunningCount}`);
          addDebugLog(`Shoe cards remaining: ${currentShoe.length}`);
          addDebugLog("=== DEALING PHASE END ===");

          // If player is not seated, skip PLAYER_TURN and go straight to AI_TURNS
          if (playerSeat === null) {
            addDebugLog("Player not seated, moving to AI_TURNS");
            setPhase("AI_TURNS");
          } else {
            addDebugLog("Moving to PLAYER_TURN");
            setPhase("PLAYER_TURN");
          }
        }
      },
      delay + CARD_ANIMATION_DURATION + 500,
    );
  }, [
    aiPlayers,
    shoe,
    cardsDealt,
    runningCount,
    shoesDealt,
    gameSettings.numberOfDecks,
    gameSettings.countingSystem,
    registerTimeout,
    playerSeat,
    getCardPosition,
    currentDealer,
    addDebugLog,
    setShoe,
    setCardsDealt,
    setRunningCount,
    setShoesDealt,
    setFlyingCards,
    setDealerHand,
    setPlayerHand,
    setAIPlayers,
    setDealerRevealed,
    setPhase,
  ]);

  const hit = useCallback(() => {
    addDebugLog("=== PLAYER ACTION: HIT ===");
    addDebugLog(
      `Current hand: ${playerHand.cards.map((c) => `${c.rank}${c.suit}`).join(", ")}`,
    );
    addDebugLog(`Current hand value: ${calculateHandValue(playerHand.cards)}`);

    const card = dealCardFromShoe();
    addDebugLog(
      `Dealt card: ${card.rank}${card.suit} (value: ${card.value}, count: ${card.count}) | Running count: ${runningCount + card.count}`,
    );

    // Add flying card animation
    const shoePosition = getCardPosition("shoe", aiPlayers, playerSeat);
    const playerPosition = getCardPosition(
      "player",
      aiPlayers,
      playerSeat,
      undefined,
      playerHand.cards.length,
    );

    const flyingCard: FlyingCardData = {
      id: `hit-player-${Date.now()}-${cardIdCounter++}`,
      card,
      fromPosition: shoePosition,
      toPosition: playerPosition,
    };

    setFlyingCards((prev) => [...prev, flyingCard]);

    // Add card to hand after animation completes
    setTimeout(() => {
      // Calculate new hand with the new card
      const newCards = [...playerHand.cards, card];
      const newHandValue = calculateHandValue(newCards);

      addDebugLog(
        `New hand: ${newCards.map((c) => `${c.rank}${c.suit}`).join(", ")}`,
      );
      addDebugLog(`New hand value: ${newHandValue}`);

      setPlayerHand((prev) => ({ ...prev, cards: newCards }));
      setFlyingCards((prev) => prev.filter((fc) => fc.id !== flyingCard.id));

      if (newHandValue > 21) {
        addDebugLog("PLAYER BUSTED!");
        // Show BUST indicator
        setPlayerActions((prev) => new Map(prev).set(-1, "BUST"));

        // Muck (clear) the cards after showing bust indicator
        setTimeout(() => {
          setPlayerHand((prev) => ({ ...prev, cards: [] }));
          setPlayerActions((prev) => {
            const newMap = new Map(prev);
            newMap.delete(-1);
            return newMap;
          });
          addDebugLog("Moving to AI_TURNS phase");
          setPhase("AI_TURNS");
        }, 1500); // Show BUST for 1.5s then muck cards
      }
    }, CARD_ANIMATION_DURATION); // Match FlyingCard animation duration
  }, [
    playerHand,
    dealCardFromShoe,
    getCardPosition,
    addDebugLog,
    runningCount,
    aiPlayers,
    playerSeat,
    setFlyingCards,
    setPlayerHand,
    setPlayerActions,
    setPhase,
  ]);

  const stand = useCallback(() => {
    addDebugLog("=== PLAYER ACTION: STAND ===");
    addDebugLog(
      `Final hand: ${playerHand.cards.map((c) => `${c.rank}${c.suit}`).join(", ")}`,
    );
    addDebugLog(`Final hand value: ${calculateHandValue(playerHand.cards)}`);
    addDebugLog("Moving to AI_TURNS phase");
    setPhase("AI_TURNS");
  }, [playerHand, addDebugLog, setPhase]);

  return {
    startNewRound,
    dealInitialCards,
    hit,
    stand,
  };
}
