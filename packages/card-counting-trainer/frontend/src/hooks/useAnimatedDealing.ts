"use client";

import { useState, useCallback, useRef } from "react";
import { dealCard } from "@/lib/gameActions";
import { calculateDecksRemaining, calculateTrueCount } from "@/lib/deck";
import { debugLog } from "@/utils/debug";

interface Card {
  rank: string;
  suit: string;
  count: number;
}

interface DealingState {
  dealerCards: Card[];
  aiHands: { position: number; cards: Card[] }[];
  isDealing: boolean;
  currentAction: string;
  handResults: {
    position: number;
    result: "win" | "lose" | "push" | "blackjack";
  }[];
  flyingCard: {
    card: Card;
    toPosition: number;
  } | null;
  thinkingPlayer: number | null;
  actionBubble: {
    position: number;
    action: "HIT" | "STAND" | "SPLIT" | "BUST";
  } | null;
  dealerRevealed: boolean;
  liveCardsDealt: number; // NEW: Real-time card count as cards are dealt
  characterReactions: {
    position: number;
    message: string;
  }[]; // Character speech bubbles after hand results
}

export function useAnimatedDealing(
  shoe: any[],
  numDecks: number,
  cardsDealt: number,
  runningCount: number,
  aiPlayerPositions: number[],
  dealSpeed: number = 1.0, // Multiplier for dealer speed (0.8 = slow, 1.5 = fast)
  onDealingComplete: (result: {
    updatedShoe: any[];
    newCardsDealt: number;
    runningCount: number;
    trueCount: number;
    aiHands: { position: number; cards: any[] }[];
    dealerCards: any[];
  }) => void,
  registerTimeout: (callback: () => void, delay: number) => NodeJS.Timeout,
) {
  const [dealingState, setDealingState] = useState<DealingState>({
    dealerCards: [],
    aiHands: [],
    isDealing: false,
    currentAction: "",
    handResults: [],
    flyingCard: null,
    thinkingPlayer: null,
    actionBubble: null,
    dealerRevealed: false,
    liveCardsDealt: 0,
    characterReactions: [],
  });

  const startDealing = useCallback(() => {
    if (dealingState.isDealing || aiPlayerPositions.length === 0) return;

    debugLog(
      "dealCards",
      "🎴 Starting turn-based game. AI positions:",
      aiPlayerPositions,
    );

    // Decision order: dealer's right to left (1→2→3→5→6→7→8)
    // Positions: 1=far right, 8=far left
    // Casino rule: play starts at dealer's right (seat 1) and goes left (to seat 8)
    const decisionOrder = [...aiPlayerPositions]; // Already sorted low to high (1→2→3→5→6→7→8)

    setDealingState({
      dealerCards: [],
      aiHands: aiPlayerPositions.map((pos) => ({ position: pos, cards: [] })),
      isDealing: true,
      currentAction: "Dealing cards...",
      handResults: [],
      flyingCard: null,
      thinkingPlayer: null,
      actionBubble: null,
      dealerRevealed: false,
      liveCardsDealt: cardsDealt,
      characterReactions: [],
    });

    let currentShoe = [...shoe];
    let totalCardsDealt = cardsDealt;
    let currentRunningCount = runningCount;
    const dealerCards: Card[] = [];
    const aiHands: { position: number; cards: Card[] }[] =
      aiPlayerPositions.map((pos) => ({
        position: pos,
        cards: [],
      }));

    // ============ PHASE 1: INITIAL DEAL ============
    const dealInitialCards = () => {
      let dealIndex = 0;
      const totalCards = (aiPlayerPositions.length + 1) * 2; // 2 cards each

      const dealNext = () => {
        if (dealIndex >= totalCards) {
          // Initial deal complete, pause then start player turns
          registerTimeout(
            () => {
              startPlayerTurns();
            },
            Math.floor(3000 / dealSpeed),
          );
          return;
        }

        const round = Math.floor(dealIndex / (aiPlayerPositions.length + 1));
        const posInRound = dealIndex % (aiPlayerPositions.length + 1);

        if (posInRound < aiPlayerPositions.length) {
          // Deal to player
          const playerIndex = posInRound;
          const position = aiPlayerPositions[playerIndex];
          const { card, remainingShoe } = dealCard(currentShoe);
          currentShoe = remainingShoe;
          totalCardsDealt += 1;
          currentRunningCount += card.count;

          setDealingState((prev) => ({
            ...prev,
            flyingCard: { card, toPosition: position },
            currentAction: `Dealing to spot ${position}`,
            liveCardsDealt: totalCardsDealt,
          }));

          registerTimeout(
            () => {
              aiHands[playerIndex].cards.push(card);
              setDealingState((prev) => ({
                ...prev,
                aiHands: [...aiHands],
                flyingCard: null,
              }));
              dealIndex += 1;
              registerTimeout(dealNext, Math.floor(400 / dealSpeed));
            },
            Math.floor(400 / dealSpeed),
          );
        } else {
          // Deal to dealer
          const { card, remainingShoe } = dealCard(currentShoe);
          currentShoe = remainingShoe;
          totalCardsDealt += 1;
          // Only count first dealer card (face up)
          if (round === 0) {
            currentRunningCount += card.count;
          }

          setDealingState((prev) => ({
            ...prev,
            flyingCard: { card, toPosition: 0 },
            currentAction:
              round === 0
                ? "Dealing dealer's up card"
                : "Dealing dealer's hole card",
            liveCardsDealt: totalCardsDealt,
          }));

          registerTimeout(
            () => {
              dealerCards.push(card);
              setDealingState((prev) => ({
                ...prev,
                dealerCards: [...dealerCards],
                flyingCard: null,
              }));
              dealIndex += 1;
              registerTimeout(dealNext, Math.floor(400 / dealSpeed));
            },
            Math.floor(400 / dealSpeed),
          );
        }
      };

      dealNext();
    };

    // ============ PHASE 2: PLAYER TURNS ============
    const startPlayerTurns = () => {
      let currentPlayerIndex = 0;

      const playNextPlayer = () => {
        if (currentPlayerIndex >= decisionOrder.length) {
          // All players done, dealer's turn
          registerTimeout(
            () => {
              dealerTurn();
            },
            Math.floor(2000 / dealSpeed),
          );
          return;
        }

        const position = decisionOrder[currentPlayerIndex];
        const handIndex = aiHands.findIndex((h) => h.position === position);
        if (handIndex === -1) {
          currentPlayerIndex += 1;
          playNextPlayer();
          return;
        }

        const hand = aiHands[handIndex].cards;

        // Show whose turn it is
        setDealingState((prev) => ({
          ...prev,
          thinkingPlayer: position,
          currentAction: `Spot ${position}'s turn`,
        }));

        // Calculate hand value
        const handValue = hand.reduce((sum, card) => {
          if (card.rank === "A") return sum + 11;
          if (["J", "Q", "K"].includes(card.rank)) return sum + 10;
          return sum + parseInt(card.rank, 10);
        }, 0);

        const isBlackjack = hand.length === 2 && handValue === 21;
        const isBusted = handValue > 21;
        const obviousStand = handValue >= 17;

        // Decide action
        let shouldHit = false;
        if (handValue < 12) {
          shouldHit = true;
        } else if (handValue >= 17) {
          shouldHit = false;
        } else {
          shouldHit = Math.random() < 0.7;
        }

        // Execute action
        // Calculate thinking time based on hand difficulty
        // Obvious plays (20, 21, BJ, bust) = instant
        // Easy decisions (12-16 vs dealer up card) = 1-2 seconds
        // Difficult decisions = 2-3 seconds
        let thinkTime = 500; // Base thinking time
        if (isBlackjack || isBusted) {
          thinkTime = 200; // Instant for obvious
        } else if (obviousStand) {
          thinkTime = 300; // Quick for 17-20
        } else if (handValue >= 12 && handValue <= 16) {
          thinkTime = Math.floor(Math.random() * 1000) + 1500; // 1.5-2.5s for difficult
        } else {
          thinkTime = Math.floor(Math.random() * 500) + 800; // 0.8-1.3s for moderate
        }

        if (isBlackjack || isBusted || obviousStand || !shouldHit) {
          // STAND
          registerTimeout(() => {
            setDealingState((prev) => ({
              ...prev,
              actionBubble: { position, action: "STAND" },
              currentAction: `Spot ${position} stands`,
            }));

            registerTimeout(() => {
              setDealingState((prev) => ({
                ...prev,
                thinkingPlayer: null,
                actionBubble: null,
              }));
              currentPlayerIndex += 1;
              registerTimeout(playNextPlayer, 300);
            }, 1000);
          }, thinkTime);
        } else {
          // HIT

          registerTimeout(() => {
            const { card, remainingShoe } = dealCard(currentShoe);
            currentShoe = remainingShoe;
            totalCardsDealt += 1;
            currentRunningCount += card.count;

            setDealingState((prev) => ({
              ...prev,
              flyingCard: { card, toPosition: position },
              actionBubble: { position, action: "HIT" },
              currentAction: `Spot ${position} hits`,
              liveCardsDealt: totalCardsDealt,
            }));

            registerTimeout(() => {
              aiHands[handIndex].cards.push(card);
              setDealingState((prev) => ({
                ...prev,
                aiHands: [...aiHands],
                flyingCard: null,
                actionBubble: null,
              }));

              registerTimeout(() => {
                // Check if player should go again
                const newHandValue = aiHands[handIndex].cards.reduce(
                  (sum, c) => {
                    if (c.rank === "A") return sum + 11;
                    if (["J", "Q", "K"].includes(c.rank)) return sum + 10;
                    return sum + parseInt(c.rank, 10);
                  },
                  0,
                );

                if (newHandValue >= 17 || newHandValue > 21) {
                  // Player busts or reaches 17+ - show appropriate bubble then move on
                  const isBust = newHandValue > 21;
                  setDealingState((prev) => ({
                    ...prev,
                    actionBubble: {
                      position,
                      action: isBust ? "BUST" : "STAND",
                    },
                    currentAction: isBust
                      ? `Spot ${position} busts!`
                      : `Spot ${position} stands`,
                  }));

                  registerTimeout(() => {
                    setDealingState((prev) => ({
                      ...prev,
                      thinkingPlayer: null,
                      actionBubble: null,
                    }));
                    currentPlayerIndex += 1;
                    registerTimeout(playNextPlayer, 500);
                  }, 1500);
                } else {
                  // Same player goes again
                  registerTimeout(playNextPlayer, 1000);
                }
              }, 1200);
            }, 800);
          }, thinkTime);
        }
      };

      playNextPlayer();
    };

    // ============ PHASE 3: DEALER TURN ============
    const dealerTurn = () => {
      setDealingState((prev) => ({
        ...prev,
        thinkingPlayer: null,
        currentAction: "Dealer's turn",
      }));

      // Reveal hole card
      registerTimeout(
        () => {
          setDealingState((prev) => ({
            ...prev,
            dealerRevealed: true,
            currentAction: "Dealer reveals hole card",
          }));
          currentRunningCount += dealerCards[1].count; // Count the hole card now

          registerTimeout(
            () => {
              dealerHits();
            },
            Math.floor(3000 / dealSpeed),
          );
        },
        Math.floor(2000 / dealSpeed),
      );
    };

    const calculateDealerValue = (cards: Card[]) => {
      let value = 0;
      let aces = 0;
      cards.forEach((card) => {
        if (card.rank === "A") {
          aces += 1;
          value += 11;
        } else if (["J", "Q", "K"].includes(card.rank)) {
          value += 10;
        } else {
          value += parseInt(card.rank, 10);
        }
      });
      while (value > 21 && aces > 0) {
        value -= 10;
        aces -= 1;
      }
      return value;
    };

    const dealerHits = () => {
      const dealerValue = calculateDealerValue(dealerCards);

      if (dealerValue < 17 && currentShoe.length > 0) {
        setDealingState((prev) => ({
          ...prev,
          currentAction: `Dealer hits (${dealerValue})`,
        }));

        registerTimeout(
          () => {
            const { card, remainingShoe } = dealCard(currentShoe);
            currentShoe = remainingShoe;
            totalCardsDealt += 1;
            currentRunningCount += card.count;

            setDealingState((prev) => ({
              ...prev,
              flyingCard: { card, toPosition: 0 },
              liveCardsDealt: totalCardsDealt,
            }));

            registerTimeout(
              () => {
                dealerCards.push(card);
                setDealingState((prev) => ({
                  ...prev,
                  dealerCards: [...dealerCards],
                  flyingCard: null,
                }));

                registerTimeout(dealerHits, Math.floor(1000 / dealSpeed));
              },
              Math.floor(500 / dealSpeed),
            );
          },
          Math.floor(800 / dealSpeed),
        );
      } else {
        // Dealer stands
        setDealingState((prev) => ({
          ...prev,
          currentAction:
            dealerValue > 21
              ? `Dealer busts (${dealerValue})`
              : `Dealer stands (${dealerValue})`,
        }));

        registerTimeout(() => {
          determineResults(dealerValue);
        }, 2000);
      }
    };

    // ============ PHASE 4: RESULTS ============
    const determineResults = (dealerValue: number) => {
      const results: {
        position: number;
        result: "win" | "lose" | "push" | "blackjack";
      }[] = [];

      aiHands.forEach((hand) => {
        const handValue = calculateDealerValue(hand.cards);
        const isBlackjack = hand.cards.length === 2 && handValue === 21;

        if (handValue > 21) {
          results.push({ position: hand.position, result: "lose" });
        } else if (dealerValue > 21) {
          results.push({
            position: hand.position,
            result: isBlackjack ? "blackjack" : "win",
          });
        } else if (handValue > dealerValue) {
          results.push({
            position: hand.position,
            result: isBlackjack ? "blackjack" : "win",
          });
        } else if (handValue < dealerValue) {
          results.push({ position: hand.position, result: "lose" });
        } else {
          results.push({ position: hand.position, result: "push" });
        }
      });

      setDealingState((prev) => ({
        ...prev,
        handResults: results,
        currentAction: "Hand complete",
      }));

      registerTimeout(() => {
        completeDeal();
      }, 5000);
    };

    const completeDeal = () => {
      const totalCards = numDecks * 52;
      const decksRemaining = calculateDecksRemaining(
        totalCards,
        totalCardsDealt,
      );
      const trueCount = calculateTrueCount(currentRunningCount, decksRemaining);

      setDealingState((prev) => ({
        ...prev,
        isDealing: false,
      }));

      onDealingComplete({
        updatedShoe: currentShoe,
        newCardsDealt: totalCardsDealt,
        runningCount: currentRunningCount,
        trueCount,
        aiHands,
        dealerCards,
      });

      registerTimeout(() => {
        setDealingState({
          dealerCards: [],
          aiHands: [],
          isDealing: false,
          currentAction: "",
          handResults: [],
          flyingCard: null,
          thinkingPlayer: null,
          actionBubble: null,
          dealerRevealed: false,
          liveCardsDealt: totalCardsDealt,
          characterReactions: [],
        });
      }, 15000);
    };

    dealInitialCards();
  }, [
    dealingState.isDealing,
    aiPlayerPositions,
    shoe,
    cardsDealt,
    runningCount,
    numDecks,
    onDealingComplete,
    registerTimeout,
  ]);

  return {
    dealingState,
    startDealing,
  };
}
