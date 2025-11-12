"use client";

import { useCallback } from "react";
import { PlayerAction, StrategyAction } from "@/types/game";
import {
  placeBet,
  dealInitialCards,
  hit,
  doubleDown,
  split,
  calculateHandValue,
  canDouble,
  canSplit,
} from "@/lib/gameActions";
import { getBasicStrategyAction, getSuggestedBet } from "@/lib/basicStrategy";
import { playDealerHand, resolveHands } from "@/lib/dealer";
import {
  calculateScoreUpdate,
  COUNT_PEEK_COST,
  STRATEGY_PEEK_COST,
  getStreakBonus,
} from "@/lib/scoring";
import { DEFAULT_GAME_SETTINGS } from "@/types/gameSettings";
import { useGameState, GameConfig } from "./useGameState";

/**
 * Main game controller hook
 * Orchestrates all game logic and state management
 */
export function useBlackjackGame(config?: GameConfig) {
  const {
    gameState,
    setGameState,
    resetGame,
    setPhase,
    setDealerRevealed,
    aiHandsInProgress,
    dealerCardsInProgress,
    aiPlayerPositions,
    setAIHandsInProgress,
    setDealerCardsInProgress,
    dealNewHandToAI,
    addAIPlayer,
  } = useGameState(config);

  /**
   * Start a new hand
   */
  const startNewHand = useCallback(() => {
    // Check if we need to shuffle
    const totalCards = gameState.numDecks * 52;
    if (gameState.cardsDealt >= totalCards - gameState.dealerCutCard) {
      // Reshuffle needed
      resetGame();
      return;
    }

    // Reset for new hand
    setPhase("BETTING");
    setDealerRevealed(false);

    // Clear all hands
    const updatedPlayers = gameState.players.map((player) => ({
      ...player,
      hands: [],
    }));

    setGameState({
      ...gameState,
      players: updatedPlayers,
      currentPlayerIndex: 1, // User
      currentHandIndex: 0,
    });
  }, [gameState, resetGame, setPhase, setDealerRevealed, setGameState]);

  /**
   * Place a bet and deal cards
   */
  const handlePlaceBet = useCallback(
    (betAmount: number) => {
      // Place bet for user (position 1)
      let newState = placeBet(gameState, 1, betAmount);

      // Deal initial cards (dealer and user)
      newState = dealInitialCards(newState, [0, 1]);

      // Move to player turn
      newState.phase = "PLAYER_TURN";

      setGameState(newState);
    },
    [gameState, setGameState],
  );

  /**
   * Get suggested bet based on true count
   */
  const getSuggestedBetAmount = useCallback(() => {
    const minBet = 10; // From config
    const maxBet = 500; // From config
    return getSuggestedBet(
      gameState.trueCount,
      minBet,
      maxBet,
      gameState.chips,
    );
  }, [gameState.trueCount, gameState.chips]);

  /**
   * Get basic strategy recommendation
   */
  const getStrategyRecommendation = useCallback(
    (playerIndex: number = 1, handIndex: number = 0): StrategyAction => {
      const player = gameState.players[playerIndex];
      const hand = player.hands[handIndex];
      const dealerUpCard = gameState.players[0].hands[0].cards[0];

      const canDoubleHand = canDouble(hand.cards, player.chips, hand.bet);
      const canSplitHand = canSplit(hand.cards);

      return getBasicStrategyAction(
        hand.cards,
        dealerUpCard,
        DEFAULT_GAME_SETTINGS,
        canSplitHand,
        canDoubleHand,
      );
    },
    [gameState],
  );

  /**
   * Execute player action (HIT, STAND, DOUBLE, SPLIT)
   */
  const handlePlayerAction = useCallback(
    (action: PlayerAction) => {
      const playerIndex = gameState.currentPlayerIndex;
      const handIndex = gameState.currentHandIndex;

      // Get optimal action for scoring
      const optimalAction = getStrategyRecommendation(playerIndex, handIndex);

      // Map player action to strategy action for comparison
      const playerStrategyAction: StrategyAction =
        action === "HIT"
          ? "H"
          : action === "STAND"
            ? "S"
            : action === "DOUBLE"
              ? "D"
              : action === "SPLIT"
                ? "SP"
                : "H";

      // Calculate score update
      const scoreUpdate = calculateScoreUpdate(
        playerStrategyAction,
        optimalAction,
        gameState.streak,
        gameState.scoreMultiplier,
      );

      let newState = gameState;

      // Execute action
      switch (action) {
        case "HIT":
          newState = hit(gameState, playerIndex, handIndex);
          break;

        case "DOUBLE":
          newState = doubleDown(gameState, playerIndex, handIndex);
          break;

        case "SPLIT":
          newState = split(gameState, playerIndex, handIndex);
          break;

        case "STAND":
          // No state change for stand
          break;

        default:
          // Unknown action, no state change
          break;
      }

      // Update score
      newState = {
        ...newState,
        score: newState.score + scoreUpdate.scoreDelta,
        streak: scoreUpdate.newStreak,
        scoreMultiplier: scoreUpdate.newMultiplier,
      };

      // Check for streak bonus
      const streakBonus = getStreakBonus(scoreUpdate.newStreak);
      if (streakBonus > 0) {
        newState.score += streakBonus;
      }

      // Check if hand is complete
      const handValue = calculateHandValue(
        newState.players[playerIndex].hands[handIndex].cards,
      );
      const isBusted = handValue > 21;
      const isDoubled = action === "DOUBLE";

      if (isBusted || isDoubled || action === "STAND") {
        // Move to dealer turn
        newState.phase = "DEALER_TURN";
        newState = playDealerHand(newState);
        newState = resolveHands(newState);
      }

      setGameState(newState);
    },
    [gameState, getStrategyRecommendation, setGameState],
  );

  /**
   * Peek at count (costs chips and resets multiplier)
   */
  const handleCountPeek = useCallback(() => {
    if (gameState.chips < COUNT_PEEK_COST) {
      return; // Not enough chips
    }

    setGameState({
      ...gameState,
      chips: gameState.chips - COUNT_PEEK_COST,
      scoreMultiplier: 1.0, // Reset multiplier
    });
  }, [gameState, setGameState]);

  /**
   * Peek at strategy (costs chips but doesn't reset multiplier)
   */
  const handleStrategyPeek = useCallback(() => {
    if (gameState.chips < STRATEGY_PEEK_COST) {
      return; // Not enough chips
    }

    setGameState({
      ...gameState,
      chips: gameState.chips - STRATEGY_PEEK_COST,
    });
  }, [gameState, setGameState]);

  /**
   * Check if player can take action
   */
  const canPlayerAct = useCallback(
    (action: PlayerAction): boolean => {
      if (gameState.phase !== "PLAYER_TURN") return false;

      const playerIndex = gameState.currentPlayerIndex;
      const handIndex = gameState.currentHandIndex;
      const player = gameState.players[playerIndex];
      const hand = player.hands[handIndex];

      switch (action) {
        case "HIT":
        case "STAND":
          return true;

        case "DOUBLE":
          return canDouble(hand.cards, player.chips, hand.bet);

        case "SPLIT":
          return canSplit(hand.cards) && player.chips >= hand.bet;

        default:
          return false;
      }
    },
    [gameState],
  );

  return {
    // State
    gameState,
    aiHandsInProgress,
    dealerCardsInProgress,
    aiPlayerPositions,
    setAIHandsInProgress,
    setDealerCardsInProgress,

    // Actions
    startNewHand,
    handlePlaceBet,
    handlePlayerAction,
    handleCountPeek,
    handleStrategyPeek,
    dealNewHandToAI,
    addAIPlayer,

    // Utilities
    getSuggestedBetAmount,
    getStrategyRecommendation,
    canPlayerAct,
  };
}
