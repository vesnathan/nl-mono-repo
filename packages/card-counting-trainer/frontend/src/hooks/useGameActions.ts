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
import { debugLog } from "@/utils/debug";

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
  playerChips: number;

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
  setInsuranceOffered: (offered: boolean) => void;
  setActivePlayerIndex: (index: number | null) => void;
  setPlayerFinished: (finished: boolean) => void;
  setPlayerChips: (chips: number | ((prev: number) => number)) => void;

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
  addSpeechBubble: (
    playerId: string,
    message: string,
    position: number,
  ) => void;
  showEndOfHandReactions: () => void;
}

// Return type for useGameActions
export interface GameActionsReturn {
  startNewRound: () => void;
  dealInitialCards: (playerBetAmount?: number) => void;
  hit: () => void;
  stand: () => void;
  doubleDown: () => void;
  split: () => void;
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
  playerChips,
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
  setInsuranceOffered,
  setActivePlayerIndex,
  setPlayerFinished,
  setPlayerChips,
  dealCardFromShoe,
  registerTimeout,
  getCardPosition,
  addSpeechBubble,
  showEndOfHandReactions,
}: UseGameActionsParams) {
  const startNewRound = useCallback(() => {
    setPhase("BETTING");
    setCurrentBet(0); // Reset bet for new round
    setDealerRevealed(false);
    setPlayerHand({ cards: [], bet: 0 });
    setDealerHand({ cards: [], bet: 0 });
    setSpeechBubbles([]); // Clear any lingering speech bubbles
    setPlayerFinished(false); // Reset player finished status for new hand

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
    setPlayerFinished,
  ]);

  const dealInitialCards = useCallback(
    (playerBetAmount?: number) => {
      // Use parameter if provided, otherwise fall back to playerHand.bet
      const effectivePlayerBet = playerBetAmount ?? playerHand.bet;

      debugLog("gamePhases", "=== DEALING PHASE START ===");
      debugLog("dealCards", `Shoe cards remaining: ${shoe.length}`);
      debugLog("dealCards", `Cards dealt this shoe: ${cardsDealt}`);
      debugLog("dealCards", `Running count: ${runningCount}`);
      debugLog("dealCards", `Number of AI players: ${aiPlayers.length}`);
      debugLog(
        "dealCards",
        `Player seated: ${playerSeat !== null ? `Yes (Seat ${playerSeat})` : "No (observing)"}`,
      );
      debugLog("dealCards", `Player bet: $${effectivePlayerBet}`);

      // Pre-deal all cards BEFORE animations to ensure uniqueness
      // We need to manually track the shoe state because React batches state updates
      const dealtCards: {
        type: string;
        index: number;
        card: GameCard;
        cardIndex: number;
      }[] = [];
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

      debugLog("dealCards", "--- First card round (right to left) ---");
      // Deal first card to everyone (right to left, dealer last)
      sortedAIPlayers.forEach((ai) => {
        const idx = aiPlayers.indexOf(ai);
        const card = dealFromCurrentShoe();
        debugLog(
          "dealCards",
          `AI Player ${idx} (${ai.character.name}, Seat ${ai.position}): ${card.rank}${card.suit} (value: ${card.value}, count: ${card.count}) | Running count: ${currentRunningCount}`,
        );
        dealtCards.push({ type: "ai", index: idx, card, cardIndex: 0 });
      });
      // Only deal to player if they're seated AND have placed a bet
      if (playerSeat !== null && effectivePlayerBet > 0) {
        const card = dealFromCurrentShoe();
        debugLog(
          "dealCards",
          `Player (Seat ${playerSeat}): ${card.rank}${card.suit} (value: ${card.value}, count: ${card.count}) | Running count: ${currentRunningCount}`,
        );
        dealtCards.push({ type: "player", index: 0, card, cardIndex: 0 });
      }
      const dealerCard1 = dealFromCurrentShoe();
      debugLog(
        "dealCards",
        `Dealer card 1: ${dealerCard1.rank}${dealerCard1.suit} (value: ${dealerCard1.value}, count: ${dealerCard1.count}) [FACE UP] | Running count: ${currentRunningCount}`,
      );
      dealtCards.push({
        type: "dealer",
        index: 0,
        card: dealerCard1,
        cardIndex: 0,
      });

      debugLog("dealCards", "--- Second card round (right to left) ---");
      // Deal second card to everyone (right to left, dealer last)
      sortedAIPlayers.forEach((ai) => {
        const idx = aiPlayers.indexOf(ai);
        const card = dealFromCurrentShoe();
        debugLog(
          "dealCards",
          `AI Player ${idx} (${ai.character.name}): ${card.rank}${card.suit} (value: ${card.value}, count: ${card.count}) | Running count: ${currentRunningCount}`,
        );
        dealtCards.push({ type: "ai", index: idx, card, cardIndex: 1 });
      });
      // Only deal second card to player if they're seated AND have placed a bet
      if (playerSeat !== null && effectivePlayerBet > 0) {
        const card = dealFromCurrentShoe();
        debugLog(
          "dealCards",
          `Player: ${card.rank}${card.suit} (value: ${card.value}, count: ${card.count}) | Running count: ${currentRunningCount}`,
        );
        dealtCards.push({ type: "player", index: 0, card, cardIndex: 1 });
      }
      const dealerCard2 = dealFromCurrentShoe();
      debugLog(
        "dealCards",
        `Dealer card 2: ${dealerCard2.rank}${dealerCard2.suit} (value: ${dealerCard2.value}, count: ${dealerCard2.count}) [FACE DOWN - not counting] | Running count: ${currentRunningCount}`,
      );
      dealtCards.push({
        type: "dealer",
        index: 1,
        card: dealerCard2,
        cardIndex: 1,
      });

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
                    cards: [
                      ...updated[dealData.index].hand.cards,
                      dealData.card,
                    ],
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
                    (d) =>
                      d.type === "ai" &&
                      d.index === dealData.index &&
                      d.cardIndex === 0,
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
                      dealerUpCard,
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

      // After all cards are dealt, check for insurance and dealer blackjack
      registerTimeout(
        () => {
          debugLog("dealCards", "All cards dealt and animations complete");

          // Check if dealer should peek for blackjack (American rules)
          const shouldPeek = gameSettings.dealerPeekRule === "AMERICAN_PEEK";
          const dealerUpCard = dealerCard1;
          const canHaveBlackjack =
            dealerUpCard.rank === "A" || dealerUpCard.value === 10;

          // Offer insurance if enabled and dealer shows Ace
          const shouldOfferInsurance =
            gameSettings.insuranceAvailable && dealerUpCard.rank === "A";

          if (shouldOfferInsurance) {
            debugLog("insurance", "Dealer showing Ace - OFFERING INSURANCE");
            setInsuranceOffered(true);
            setPhase("INSURANCE");
            // Insurance phase hook will handle the flow
            return;
          }

          if (shouldPeek && canHaveBlackjack) {
            // Show "Peeking..." in speech bubble
            debugLog(
              "dealCards",
              `Dealer showing ${dealerUpCard.rank} - checking for blackjack...`,
            );
            addSpeechBubble("dealer", "Peeking...", -1);

            registerTimeout(() => {
              // Check for dealer blackjack (natural 21 with 2 cards)
              const dealerCards = [dealerCard1, dealerCard2];
              const dealerValue = calculateHandValue(dealerCards);
              if (dealerValue === 21) {
                debugLog(
                  "dealCards",
                  "DEALER BLACKJACK! Revealing hole card and moving to RESOLVING",
                );
                setDealerRevealed(true);
                addSpeechBubble("dealer", "Blackjack!", -1);

                // Trigger AI player reactions to dealer blackjack
                registerTimeout(() => {
                  showEndOfHandReactions();
                }, 500);

                // Skip player turn and AI turns, go straight to resolving
                registerTimeout(() => {
                  setPhase("RESOLVING");
                }, 2000);
              } else {
                debugLog(
                  "dealCards",
                  `Dealer showing: ${dealerCard1.rank}${dealerCard1.suit}`,
                );
                debugLog(
                  "dealCards",
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
            debugLog(
              "dealCards",
              `Running count after dealing: ${currentRunningCount}`,
            );
            debugLog(
              "dealCards",
              `Shoe cards remaining: ${currentShoe.length}`,
            );
            debugLog("gamePhases", "=== DEALING PHASE END ===");

            // Determine turn order based on seat positions (first base to third base)
            debugLog("gamePhases", "=== DETERMINING TURN ORDER ===");

            // Collect all occupied seats
            const occupiedSeats: number[] = [];

            // Add AI player seats
            debugLog("gamePhases", `AI Players seated:`);
            aiPlayers.forEach((ai, idx) => {
              occupiedSeats.push(ai.position);
              debugLog(
                "gamePhases",
                `  AI ${idx} (${ai.character.name}) - Seat ${ai.position}`,
              );
            });

            // Add human player seat if seated
            if (playerSeat !== null) {
              occupiedSeats.push(playerSeat);
              debugLog("gamePhases", `Human player - Seat ${playerSeat}`);
            } else {
              debugLog("gamePhases", `Human player - NOT SEATED`);
            }

            // Sort seats in ascending order (seat 0 = first base goes first)
            occupiedSeats.sort((a, b) => a - b);

            debugLog(
              "gamePhases",
              `Turn order (by seat): ${occupiedSeats.join(" → ")}`,
            );

            if (occupiedSeats.length === 0) {
              debugLog(
                "gamePhases",
                "❌ No players seated, moving to DEALER_TURN",
              );
              setPhase("DEALER_TURN");
              return;
            }

            // Check if human player goes first
            const firstSeat = occupiedSeats[0];
            debugLog("gamePhases", `First seat to act: ${firstSeat}`);

            if (playerSeat !== null && firstSeat === playerSeat) {
              debugLog(
                "gamePhases",
                `✓ Player is in seat ${playerSeat} (FIRST TO ACT)`,
              );
              debugLog("gamePhases", "→ Transitioning to PLAYER_TURN");
              setPhase("PLAYER_TURN");
            } else {
              const firstAI = aiPlayers.find((ai) => ai.position === firstSeat);
              debugLog(
                "gamePhases",
                `✓ AI player "${firstAI?.character.name}" in seat ${firstSeat} acts first`,
              );
              if (playerSeat !== null) {
                debugLog(
                  "gamePhases",
                  `  Player in seat ${playerSeat} will act when their turn comes`,
                );
              }
              debugLog("gamePhases", "→ Transitioning to AI_TURNS");
              setPhase("AI_TURNS");
              setActivePlayerIndex(0); // Start with first AI player
            }
          }
        },
        delay + CARD_ANIMATION_DURATION + 500,
      );
    },
    [
      aiPlayers,
      shoe,
      cardsDealt,
      runningCount,
      shoesDealt,
      gameSettings.numberOfDecks,
      gameSettings.countingSystem,
      gameSettings.insuranceAvailable,
      gameSettings.dealerPeekRule,
      registerTimeout,
      playerSeat,
      playerHand,
      getCardPosition,
      currentDealer,
      setShoe,
      setCardsDealt,
      setRunningCount,
      setShoesDealt,
      setInsuranceOffered,
      setFlyingCards,
      setDealerHand,
      setPlayerHand,
      setAIPlayers,
      setDealerRevealed,
      setPhase,
      setDealerCallout,
      showEndOfHandReactions,
    ],
  );

  const hit = useCallback(() => {
    debugLog("playerActions", "=== PLAYER ACTION: HIT ===");

    // Check if we're playing split hands
    if (playerHand.isSplit && playerHand.splitHands) {
      const activeIndex = playerHand.activeSplitHandIndex ?? 0;
      const activeHand = playerHand.splitHands[activeIndex];

      debugLog("playerActions", `Playing split hand ${activeIndex + 1}`);
      debugLog(
        "playerActions",
        `Current hand: ${activeHand.cards.map((c) => `${c.rank}${c.suit}`).join(", ")}`,
      );
      debugLog(
        "playerActions",
        `Current hand value: ${calculateHandValue(activeHand.cards)}`,
      );

      const card = dealCardFromShoe();
      debugLog(
        "playerActions",
        `Dealt card: ${card.rank}${card.suit} (value: ${card.value}, count: ${card.count})`,
      );

      // Update split hand with new card
      const newSplitHands = [...playerHand.splitHands];
      newSplitHands[activeIndex] = {
        ...activeHand,
        cards: [...activeHand.cards, card],
      };

      const newHandValue = calculateHandValue(newSplitHands[activeIndex].cards);
      debugLog("playerActions", `New hand value: ${newHandValue}`);

      if (newHandValue > 21) {
        debugLog("playerActions", `Hand ${activeIndex + 1} BUSTED!`);
        // Mark this hand as busted and finished
        setPlayerHand((prev) => ({
          ...prev,
          splitHands: newSplitHands,
        }));

        // Move to next hand or finish
        registerTimeout(() => {
          if (activeIndex === 0) {
            debugLog("playerActions", "Moving to second hand");
            setPlayerHand((prev) => ({
              ...prev,
              activeSplitHandIndex: 1,
            }));
          } else {
            debugLog(
              "playerActions",
              "Both hands complete - moving to DEALER_TURN",
            );
            setPlayerFinished(true);
            setPhase("DEALER_TURN");
          }
        }, 1000);
      } else {
        setPlayerHand((prev) => ({
          ...prev,
          splitHands: newSplitHands,
        }));
      }
      return;
    }

    // Normal (non-split) hit logic
    debugLog(
      "playerActions",
      `Current hand: ${playerHand.cards.map((c) => `${c.rank}${c.suit}`).join(", ")}`,
    );
    debugLog(
      "playerActions",
      `Current hand value: ${calculateHandValue(playerHand.cards)}`,
    );

    // Mark player as finished to hide the action modal immediately
    setPlayerFinished(true);

    // Add a delay before dealing the card to give a more realistic feel
    registerTimeout(() => {
      const card = dealCardFromShoe();
      debugLog(
        "playerActions",
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
      registerTimeout(() => {
        // Calculate new hand with the new card
        const newCards = [...playerHand.cards, card];
        const newHandValue = calculateHandValue(newCards);

        debugLog(
          "playerActions",
          `New hand: ${newCards.map((c) => `${c.rank}${c.suit}`).join(", ")}`,
        );
        debugLog("playerActions", `New hand value: ${newHandValue}`);

        setPlayerHand((prev) => ({ ...prev, cards: newCards }));
        setFlyingCards((prev) => prev.filter((fc) => fc.id !== flyingCard.id));

        if (newHandValue > 21) {
          debugLog("playerActions", "PLAYER BUSTED!");
          debugLog("playerActions", "Marking player as finished");
          setPlayerFinished(true);
          // Show BUST indicator
          setPlayerActions((prev) => new Map(prev).set(-1, "BUST"));

          // Muck (clear) the cards after showing bust indicator
          registerTimeout(() => {
            setPlayerHand((prev) => ({ ...prev, cards: [] }));
            setPlayerActions((prev) => {
              const newMap = new Map(prev);
              newMap.delete(-1);
              return newMap;
            });
            debugLog("playerActions", "Moving to DEALER_TURN phase");
            setPhase("DEALER_TURN");
          }, 1500); // Show BUST for 1.5s then muck cards
        } else {
          // Player didn't bust, allow them to take another action
          setPlayerFinished(false);
        }
      }, CARD_ANIMATION_DURATION); // Match FlyingCard animation duration
    }, 500); // 500ms delay before dealing
  }, [
    playerHand,
    dealCardFromShoe,
    getCardPosition,
    runningCount,
    aiPlayers,
    playerSeat,
    registerTimeout,
    setFlyingCards,
    setPlayerHand,
    setPlayerActions,
    setPhase,
    setPlayerFinished,
  ]);

  const stand = useCallback(() => {
    debugLog("playerActions", "=== PLAYER ACTION: STAND ===");

    // Check if we're playing split hands
    if (playerHand.isSplit && playerHand.splitHands) {
      const activeIndex = playerHand.activeSplitHandIndex ?? 0;
      const activeHand = playerHand.splitHands[activeIndex];

      debugLog("playerActions", `Standing on split hand ${activeIndex + 1}`);
      debugLog(
        "playerActions",
        `Final hand: ${activeHand.cards.map((c) => `${c.rank}${c.suit}`).join(", ")}`,
      );
      debugLog(
        "playerActions",
        `Final hand value: ${calculateHandValue(activeHand.cards)}`,
      );

      if (activeIndex === 0) {
        // Move to second hand
        debugLog("playerActions", "Moving to second hand");
        setPlayerHand((prev) => ({
          ...prev,
          activeSplitHandIndex: 1,
        }));
      } else {
        // Both hands complete
        debugLog(
          "playerActions",
          "Both hands complete - moving to DEALER_TURN",
        );
        setPlayerFinished(true);
        setPhase("DEALER_TURN");
      }
      return;
    }

    // Normal (non-split) stand logic
    debugLog(
      "playerActions",
      `Final hand: ${playerHand.cards.map((c) => `${c.rank}${c.suit}`).join(", ")}`,
    );
    debugLog(
      "playerActions",
      `Final hand value: ${calculateHandValue(playerHand.cards)}`,
    );
    debugLog("playerActions", "Marking player as finished");
    setPlayerFinished(true);
    debugLog("playerActions", "Moving to DEALER_TURN phase");
    setPhase("DEALER_TURN");
  }, [playerHand, setPhase, setPlayerFinished]);

  const doubleDown = useCallback(() => {
    debugLog("playerActions", "=== PLAYER ACTION: DOUBLE DOWN ===");
    debugLog(
      "playerActions",
      `Current hand: ${playerHand.cards.map((c) => `${c.rank}${c.suit}`).join(", ")}`,
    );
    debugLog(
      "playerActions",
      `Current hand value: ${calculateHandValue(playerHand.cards)}`,
    );
    debugLog("playerActions", `Current bet: $${playerHand.bet}`);
    debugLog("playerActions", `Doubling bet to: $${playerHand.bet * 2}`);

    // Mark player as finished to hide the action modal immediately
    setPlayerFinished(true);

    // Double the bet and deduct from chips
    setPlayerHand((prev) => ({ ...prev, bet: prev.bet * 2 }));
    setPlayerChips((prev) => prev - playerHand.bet);
    setPlayerActions((prev) => new Map(prev).set(-1, "DOUBLE"));

    // Add a delay before dealing the card
    registerTimeout(() => {
      const card = dealCardFromShoe();
      debugLog(
        "playerActions",
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
        id: `double-player-${Date.now()}-${cardIdCounter++}`,
        card,
        fromPosition: shoePosition,
        toPosition: playerPosition,
      };

      setFlyingCards((prev) => [...prev, flyingCard]);

      // Add card to hand after animation completes
      registerTimeout(() => {
        const newCards = [...playerHand.cards, card];
        const newHandValue = calculateHandValue(newCards);

        debugLog(
          "playerActions",
          `Final hand: ${newCards.map((c) => `${c.rank}${c.suit}`).join(", ")}`,
        );
        debugLog("playerActions", `Final hand value: ${newHandValue}`);

        setPlayerHand((prev) => ({ ...prev, cards: newCards }));
        setFlyingCards((prev) => prev.filter((fc) => fc.id !== flyingCard.id));

        if (newHandValue > 21) {
          debugLog("playerActions", "PLAYER BUSTED!");
          // Show BUST indicator
          setPlayerActions((prev) => new Map(prev).set(-1, "BUST"));

          // Muck cards after showing bust indicator
          registerTimeout(() => {
            setPlayerHand((prev) => ({ ...prev, cards: [] }));
            setPlayerActions((prev) => {
              const newMap = new Map(prev);
              newMap.delete(-1);
              return newMap;
            });
            debugLog("playerActions", "Moving to DEALER_TURN phase");
            setPhase("DEALER_TURN");
          }, 1500);
        } else {
          // Player didn't bust, automatically stand (double down only gets one card)
          debugLog("playerActions", "Player stands after double down");
          registerTimeout(() => {
            setPlayerActions((prev) => {
              const newMap = new Map(prev);
              newMap.delete(-1);
              return newMap;
            });
            setPhase("DEALER_TURN");
          }, 500);
        }
      }, CARD_ANIMATION_DURATION);
    }, 500);
  }, [
    playerHand,
    dealCardFromShoe,
    getCardPosition,
    runningCount,
    aiPlayers,
    playerSeat,
    registerTimeout,
    setFlyingCards,
    setPlayerHand,
    setPlayerChips,
    setPlayerActions,
    setPhase,
    setPlayerFinished,
  ]);

  const split = useCallback(() => {
    debugLog("playerActions", "=== PLAYER ACTION: SPLIT ===");
    debugLog(
      "playerActions",
      `Current hand: ${playerHand.cards.map((c) => `${c.rank}${c.suit}`).join(", ")}`,
    );
    debugLog("playerActions", `Current bet: $${playerHand.bet}`);

    // Verify player has enough chips for second bet
    if (playerChips < playerHand.bet) {
      debugLog("playerActions", "ERROR: Not enough chips to split!");
      return;
    }

    // Split the two cards into two hands
    const [card1, card2] = playerHand.cards;

    debugLog(
      "playerActions",
      `Splitting ${card1.rank}${card1.suit} and ${card2.rank}${card2.suit}`,
    );
    debugLog(
      "playerActions",
      `Deducting $${playerHand.bet} from chips for second hand`,
    );

    // Deduct chips for the second bet
    setPlayerChips((prev) => prev - playerHand.bet);

    // Create two hands, each with one card
    const hand1: PlayerHand = {
      cards: [card1],
      bet: playerHand.bet,
    };

    const hand2: PlayerHand = {
      cards: [card2],
      bet: playerHand.bet,
    };

    // Deal a card to the first hand
    registerTimeout(() => {
      const newCard1 = dealCardFromShoe();
      debugLog(
        "playerActions",
        `Dealing to first hand: ${newCard1.rank}${newCard1.suit} (value: ${newCard1.value})`,
      );

      hand1.cards.push(newCard1);

      // Deal a card to the second hand
      registerTimeout(() => {
        const newCard2 = dealCardFromShoe();
        debugLog(
          "playerActions",
          `Dealing to second hand: ${newCard2.rank}${newCard2.suit} (value: ${newCard2.value})`,
        );

        hand2.cards.push(newCard2);

        // Update player hand to split state
        setPlayerHand({
          cards: [], // Clear main hand
          bet: playerHand.bet,
          isSplit: true,
          splitHands: [hand1, hand2],
          activeSplitHandIndex: 0,
        });

        debugLog("playerActions", "Split complete - starting with first hand");

        // Check if first hand is blackjack (Ace + 10-value card after split)
        const hand1Value = calculateHandValue(hand1.cards);
        if (hand1Value === 21) {
          debugLog(
            "playerActions",
            "First hand has 21 - automatically standing",
          );
          // Move to second hand
          setPlayerHand((prev) => ({
            ...prev,
            activeSplitHandIndex: 1,
          }));
        }
      }, CARD_ANIMATION_DURATION + 200);
    }, 500);
  }, [
    playerHand,
    playerChips,
    dealCardFromShoe,
    registerTimeout,
    setPlayerHand,
    setPlayerChips,
  ]);

  return {
    startNewRound,
    dealInitialCards,
    hit,
    stand,
    doubleDown,
    split,
  };
}
