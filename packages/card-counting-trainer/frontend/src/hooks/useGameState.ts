"use client";

import { useState, useCallback, useEffect } from "react";
import { GameState, GamePhase, Player, Card } from "@/types/game";
import {
  createAndShuffleShoe,
  calculateCutCardPosition,
  calculateDecksRemaining,
  calculateTrueCount,
} from "@/lib/deck";
import { dealCard } from "@/lib/gameActions";

export interface GameConfig {
  numDecks: number; // 1, 2, 4, 6, or 8
  penetration: number; // 40-90 (percentage)
  minBet: number;
  maxBet: number;
  startingChips: number;
}

const DEFAULT_CONFIG: GameConfig = {
  numDecks: 6,
  penetration: 75,
  minBet: 10,
  maxBet: 500,
  startingChips: 1000,
};

/**
 * Deal a new hand to existing AI players (no simulation of previous hands)
 */
// eslint-disable-next-line sonarjs/cognitive-complexity
export function dealNewHandToAIPlayers(
  shoe: Card[],
  numDecks: number,
  currentCardsDealt: number,
  currentRunningCount: number,
  aiPlayerPositions: number[],
): {
  updatedShoe: Card[];
  newCardsDealt: number;
  runningCount: number;
  trueCount: number;
  aiHands: { position: number; cards: Card[] }[];
  dealerCards: Card[];
} {
  let currentShoe = [...shoe];
  let cardsDealt = currentCardsDealt;
  let runningCount = currentRunningCount;

  const aiHands: { position: number; cards: Card[] }[] = [];
  const dealerCards: Card[] = [];

  // Deal 2 cards to dealer
  for (let i = 0; i < 2; i += 1) {
    if (currentShoe.length === 0) break;
    const { card, remainingShoe } = dealCard(currentShoe);
    currentShoe = remainingShoe;
    cardsDealt += 1;
    if (i === 0) {
      // Only count first dealer card (face up)
      runningCount += card.count;
    }
    dealerCards.push(card);
  }

  // Deal 2 cards to each AI player (right-to-left order)
  aiPlayerPositions.forEach((position) => {
    const cards: Card[] = [];

    // Deal initial 2 cards
    for (let i = 0; i < 2; i += 1) {
      if (currentShoe.length === 0) break;
      const { card, remainingShoe } = dealCard(currentShoe);
      currentShoe = remainingShoe;
      cardsDealt += 1;
      runningCount += card.count;
      cards.push(card);
    }

    // Calculate hand value
    const handValue = cards.reduce((sum, card) => {
      if (card.rank === "A") return sum + 11;
      if (["J", "Q", "K"].includes(card.rank)) return sum + 10;
      return sum + parseInt(card.rank, 10);
    }, 0);

    // Realistic play: never hit on 17+, sometimes hit on 12-16
    let shouldHit = false;
    if (handValue < 12) {
      shouldHit = true; // Always hit on 11 or less
    } else if (handValue >= 17) {
      shouldHit = false; // Never hit on 17+
    } else {
      // 12-16: 70% hit, 30% stand
      shouldHit = Math.random() < 0.7;
    }

    if (shouldHit && currentShoe.length > 0) {
      const { card, remainingShoe } = dealCard(currentShoe);
      currentShoe = remainingShoe;
      cardsDealt += 1;
      runningCount += card.count;
      cards.push(card);
    }

    aiHands.push({ position, cards });
  });

  // Calculate true count
  const totalCards = numDecks * 52;
  const decksRemaining = calculateDecksRemaining(totalCards, cardsDealt);
  const trueCount = calculateTrueCount(runningCount, decksRemaining);

  return {
    updatedShoe: currentShoe,
    newCardsDealt: cardsDealt,
    runningCount,
    trueCount,
    aiHands,
    dealerCards,
  };
}

/**
 * Simulate dealing cards to build up a count before user joins
 * AND deal current visible hands to AI players
 */
// eslint-disable-next-line sonarjs/cognitive-complexity
export function simulateHandsInProgress(
  shoe: Card[],
  numDecks: number,
  aiPlayerPositions: number[],
): {
  updatedShoe: Card[];
  cardsDealt: number;
  runningCount: number;
  trueCount: number;
  aiHands: { position: number; cards: Card[] }[];
  dealerCards: Card[];
} {
  let currentShoe = [...shoe];
  let cardsDealt = 0;
  let runningCount = 0;

  // Simulate 5-15 hands before user joins (just counting, no cards saved)
  const numHandsToSimulate = Math.floor(Math.random() * 11) + 5;

  for (let hand = 0; hand < numHandsToSimulate; hand += 1) {
    // Each hand: deal 2 to player, 2 to dealer (4 cards)
    // Then simulate 0-3 additional cards (hits)
    const totalCardsThisHand = 4 + Math.floor(Math.random() * 4);

    for (let i = 0; i < totalCardsThisHand; i += 1) {
      if (currentShoe.length === 0) break;

      const { card, remainingShoe } = dealCard(currentShoe);
      currentShoe = remainingShoe;
      cardsDealt += 1;
      runningCount += card.count;
    }
  }

  // NOW deal a visible hand in progress to AI players
  const aiHands: { position: number; cards: Card[] }[] = [];
  const dealerCards: Card[] = [];

  // Deal 2 cards to dealer
  for (let i = 0; i < 2; i += 1) {
    if (currentShoe.length === 0) break;
    const { card, remainingShoe } = dealCard(currentShoe);
    currentShoe = remainingShoe;
    cardsDealt += 1;
    if (i === 0) {
      // Only count first dealer card (face up)
      runningCount += card.count;
    }
    dealerCards.push(card);
  }

  // Deal 2 cards to each AI player, then let them make decisions
  aiPlayerPositions.forEach((position) => {
    const cards: Card[] = [];

    // Deal initial 2 cards
    for (let i = 0; i < 2; i += 1) {
      if (currentShoe.length === 0) break;
      const { card, remainingShoe } = dealCard(currentShoe);
      currentShoe = remainingShoe;
      cardsDealt += 1;
      runningCount += card.count;
      cards.push(card);
    }

    // Calculate hand value
    const handValue = cards.reduce((sum, card) => {
      if (card.rank === "A") return sum + 11;
      if (["J", "Q", "K"].includes(card.rank)) return sum + 10;
      return sum + parseInt(card.rank, 10);
    }, 0);

    // Realistic play: never hit on 17+, sometimes hit on 12-16
    let shouldHit = false;
    if (handValue < 12) {
      shouldHit = true; // Always hit on 11 or less
    } else if (handValue >= 17) {
      shouldHit = false; // Never hit on 17+
    } else {
      // 12-16: 70% hit, 30% stand
      shouldHit = Math.random() < 0.7;
    }

    if (shouldHit && currentShoe.length > 0) {
      const { card, remainingShoe } = dealCard(currentShoe);
      currentShoe = remainingShoe;
      cardsDealt += 1;
      runningCount += card.count;
      cards.push(card);
    }

    aiHands.push({ position, cards });
  });

  // Calculate true count
  const totalCards = numDecks * 52;
  const decksRemaining = calculateDecksRemaining(totalCards, cardsDealt);
  const trueCount = calculateTrueCount(runningCount, decksRemaining);

  return {
    updatedShoe: currentShoe,
    cardsDealt,
    runningCount,
    trueCount,
    aiHands,
    dealerCards,
  };
}

export function useGameState(config: GameConfig = DEFAULT_CONFIG) {
  const [gameState, setGameState] = useState<GameState>(() => {
    const shoe = createAndShuffleShoe(config.numDecks);
    const cutCard = calculateCutCardPosition(
      config.numDecks,
      config.penetration,
    );

    return {
      // Deck management
      shoe,
      cardsDealt: 0,
      dealerCutCard: cutCard,
      numDecks: config.numDecks,

      // Counting
      runningCount: 0,
      trueCount: 0,

      // Players (dealer at position 0, user at position 1)
      players: [
        {
          position: 0,
          hands: [],
          chips: 0,
          isUser: false,
          isDealer: true,
        },
        {
          position: 1,
          hands: [],
          chips: config.startingChips,
          isUser: true,
          isDealer: false,
        },
      ],
      currentPlayerIndex: 1, // User starts
      currentHandIndex: 0,

      // Game flow
      phase: "BETTING" as GamePhase,
      dealerRevealed: false,

      // Scoring
      score: 0,
      streak: 0,
      longestStreak: 0,
      scoreMultiplier: 1.0,
      chips: config.startingChips,
    };
  });

  // Simulate game in progress on client-side only (after mount)
  const [isSimulated, setIsSimulated] = useState(false);
  const [aiHandsInProgress, setAIHandsInProgress] = useState<
    { position: number; cards: Card[] }[]
  >([]);
  const [dealerCardsInProgress, setDealerCardsInProgress] = useState<Card[]>(
    [],
  );
  // Store AI positions for entire shoe (persistent across hands)
  const [aiPlayerPositions, setAIPlayerPositions] = useState<number[]>([]);

  useEffect(() => {
    if (!isSimulated) {
      setGameState((prevState) => {
        // Get AI positions (simulate 2-4 AI players) - stays same for entire shoe
        const numAI = Math.floor(Math.random() * 3) + 2;
        const allPositions = [2, 3, 5, 6, 7, 8]; // Exclude 1 and 4
        const aiPositions = allPositions
          .sort(() => Math.random() - 0.5)
          .slice(0, numAI);

        // Sort positions for casino dealing order: clockwise from dealer's right (2→3→5→6→7→8)
        const sortedPositions = aiPositions.sort((a, b) => a - b);
        setAIPlayerPositions(sortedPositions);

        const {
          updatedShoe,
          cardsDealt,
          runningCount,
          trueCount,
          aiHands,
          dealerCards,
        } = simulateHandsInProgress(
          prevState.shoe,
          prevState.numDecks,
          sortedPositions,
        );

        // Store AI hands and dealer cards for display
        setAIHandsInProgress(aiHands);
        setDealerCardsInProgress(dealerCards);

        return {
          ...prevState,
          shoe: updatedShoe,
          cardsDealt,
          runningCount,
          trueCount,
        };
      });
      setIsSimulated(true);
    }
  }, [isSimulated]);

  /**
   * Reset the game state with a new shuffled shoe
   */
  const resetGame = useCallback(() => {
    const shoe = createAndShuffleShoe(config.numDecks);
    const cutCard = calculateCutCardPosition(
      config.numDecks,
      config.penetration,
    );

    setGameState({
      shoe,
      cardsDealt: 0,
      dealerCutCard: cutCard,
      numDecks: config.numDecks,
      runningCount: 0,
      trueCount: 0,
      players: [
        {
          position: 0,
          hands: [],
          chips: 0,
          isUser: false,
          isDealer: true,
        },
        {
          position: 1,
          hands: [],
          chips: gameState.chips, // Preserve chip balance
          isUser: true,
          isDealer: false,
        },
      ],
      currentPlayerIndex: 1,
      currentHandIndex: 0,
      phase: "BETTING",
      dealerRevealed: false,
      score: gameState.score, // Preserve score
      streak: 0, // Reset streak on new shoe
      longestStreak: gameState.longestStreak,
      scoreMultiplier: gameState.scoreMultiplier,
      chips: gameState.chips, // Preserve chips
    });
  }, [
    config,
    gameState.chips,
    gameState.score,
    gameState.longestStreak,
    gameState.scoreMultiplier,
  ]);

  /**
   * Update running count and true count
   */
  const updateCount = useCallback((countChange: number) => {
    setGameState((prev) => {
      const newRunningCount = prev.runningCount + countChange;
      const totalCards = prev.numDecks * 52;
      const decksRemaining = calculateDecksRemaining(
        totalCards,
        prev.cardsDealt,
      );
      const newTrueCount = calculateTrueCount(newRunningCount, decksRemaining);

      return {
        ...prev,
        runningCount: newRunningCount,
        trueCount: newTrueCount,
      };
    });
  }, []);

  /**
   * Update game phase
   */
  const setPhase = useCallback((phase: GamePhase) => {
    setGameState((prev) => ({ ...prev, phase }));
  }, []);

  /**
   * Update chips balance
   */
  const updateChips = useCallback((amount: number) => {
    setGameState((prev) => ({
      ...prev,
      chips: prev.chips + amount,
      players: prev.players.map((p) =>
        p.isUser ? { ...p, chips: p.chips + amount } : p,
      ),
    }));
  }, []);

  /**
   * Update score and streak
   */
  const updateScore = useCallback((points: number, correctAction: boolean) => {
    setGameState((prev) => {
      const newStreak = correctAction ? prev.streak + 1 : 0;
      const newLongestStreak = Math.max(prev.longestStreak, newStreak);

      return {
        ...prev,
        score: prev.score + points,
        streak: newStreak,
        longestStreak: newLongestStreak,
      };
    });
  }, []);

  /**
   * Reset score multiplier (when user peeks at count)
   */
  const resetMultiplier = useCallback(() => {
    setGameState((prev) => ({ ...prev, scoreMultiplier: 1.0 }));
  }, []);

  /**
   * Increase score multiplier (for consecutive correct actions without peeking)
   */
  const increaseMultiplier = useCallback(() => {
    setGameState((prev) => ({
      ...prev,
      scoreMultiplier: Math.min(2.0, prev.scoreMultiplier + 0.1),
    }));
  }, []);

  /**
   * Update player data
   */
  const updatePlayer = useCallback(
    (playerIndex: number, updater: (player: Player) => Player) => {
      setGameState((prev) => ({
        ...prev,
        players: prev.players.map((p, idx) =>
          idx === playerIndex ? updater(p) : p,
        ),
      }));
    },
    [],
  );

  /**
   * Set current player and hand
   */
  const setCurrentPlayer = useCallback(
    (playerIndex: number, handIndex: number = 0) => {
      setGameState((prev) => ({
        ...prev,
        currentPlayerIndex: playerIndex,
        currentHandIndex: handIndex,
      }));
    },
    [],
  );

  /**
   * Set dealer revealed state
   */
  const setDealerRevealed = useCallback((revealed: boolean) => {
    setGameState((prev) => ({ ...prev, dealerRevealed: revealed }));
  }, []);

  /**
   * Update cards dealt count
   */
  const incrementCardsDealt = useCallback((count: number = 1) => {
    setGameState((prev) => {
      const newCardsDealt = prev.cardsDealt + count;
      const totalCards = prev.numDecks * 52;
      const decksRemaining = calculateDecksRemaining(totalCards, newCardsDealt);
      const newTrueCount = calculateTrueCount(
        prev.runningCount,
        decksRemaining,
      );

      return {
        ...prev,
        cardsDealt: newCardsDealt,
        trueCount: newTrueCount,
      };
    });
  }, []);

  /**
   * Deal new hand to AI players (maintains same players across hands)
   */
  const dealNewHandToAI = useCallback(() => {
    if (aiPlayerPositions.length === 0) return;

    const sortedPositions = [...aiPlayerPositions].sort((a, b) => a - b);

    const result = dealNewHandToAIPlayers(
      gameState.shoe,
      gameState.numDecks,
      gameState.cardsDealt,
      gameState.runningCount,
      sortedPositions,
    );

    // Update AI hands for display
    setAIHandsInProgress(result.aiHands);
    setDealerCardsInProgress(result.dealerCards);

    // Update game state
    setGameState((prev) => ({
      ...prev,
      shoe: result.updatedShoe,
      cardsDealt: result.newCardsDealt,
      runningCount: result.runningCount,
      trueCount: result.trueCount,
    }));
  }, [
    aiPlayerPositions,
    gameState.shoe,
    gameState.numDecks,
    gameState.cardsDealt,
    gameState.runningCount,
    setGameState,
  ]);

  /**
   * Add a new AI player to a random empty spot
   * Returns the new position if added, or null if no spots available
   */
  const addAIPlayer = useCallback((): number | null => {
    const allPositions = [2, 3, 5, 6, 7, 8]; // Exclude 1 and 4 (user spots)
    const availablePositions = allPositions.filter(
      (pos) => !aiPlayerPositions.includes(pos),
    );

    if (availablePositions.length === 0) {
      return null; // Table is full
    }

    // Pick a random available position
    const newPosition =
      availablePositions[Math.floor(Math.random() * availablePositions.length)];

    // Add to AI positions and re-sort left-to-right
    const updatedPositions = [...aiPlayerPositions, newPosition].sort(
      (a, b) => a - b,
    );
    setAIPlayerPositions(updatedPositions);

    return newPosition;
  }, [aiPlayerPositions]);

  return {
    gameState,
    setGameState,
    resetGame,
    updateCount,
    setPhase,
    updateChips,
    updateScore,
    resetMultiplier,
    increaseMultiplier,
    updatePlayer,
    setCurrentPlayer,
    setDealerRevealed,
    incrementCardsDealt,
    aiHandsInProgress,
    dealerCardsInProgress,
    aiPlayerPositions,
    setAIHandsInProgress,
    setDealerCardsInProgress,
    dealNewHandToAI,
    addAIPlayer,
  };
}
