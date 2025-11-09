"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { Button } from "@nextui-org/react";
import {
  createAndShuffleShoe,
  calculateDecksRemaining,
  calculateTrueCount,
} from "@/lib/deck";
import {
  dealCard,
  calculateHandValue,
  isBlackjack,
  isBusted,
} from "@/lib/gameActions";
import { determineHandResult, calculatePayout } from "@/lib/dealer";
import { Card as GameCard, HandResult } from "@/types/game";
import {
  GameSettings,
  DEFAULT_GAME_SETTINGS,
  getBlackjackPayoutMultiplier,
  calculateCutCardPosition,
  TrainingMode,
} from "@/types/gameSettings";
import {
  AI_CHARACTERS,
  AICharacter,
  getAIAvatarPath,
} from "@/data/aiCharacters";
import {
  DealerCharacter,
  getRandomDealer,
  getDealerAvatarPath,
} from "@/data/dealerCharacters";
import { getInitialHandReaction } from "@/data/inHandReactions";
import {
  AI_DIALOGUE_ADDONS,
  getDealerPlayerLine,
  pick,
} from "@/data/ai-dialogue-addons";
import FlyingCard from "@/components/FlyingCard";
import WinLossBubble from "@/components/WinLossBubble";
import SuspicionMeter from "@/components/SuspicionMeter";
import DealerInfo from "@/components/DealerInfo";
import Shoe from "@/components/Shoe";
import PlayingCard from "@/components/PlayingCard";
import ActionBubble from "@/components/ActionBubble";
import TurnIndicator from "@/components/TurnIndicator";
import ConversationPrompt from "@/components/ConversationPrompt";
import LeaderboardModal from "@/components/LeaderboardModal";
import GameSettingsModal from "@/components/GameSettingsModal";
import BasicStrategyCard from "@/components/BasicStrategyCard";
import BettingInterface from "@/components/BettingInterface";
import StatsBar from "@/components/StatsBar";
import DealerSection from "@/components/DealerSection";
import TableSeats from "@/components/TableSeats";
import GameOverlays from "@/components/GameOverlays";
import DebugLogModal from "@/components/DebugLogModal";
import GameModals from "@/components/GameModals";
import GameTable from "@/components/GameTable";
import BlackjackGameUI from "@/components/BlackjackGameUI";
import { CARD_APPEAR_TIME, CARD_ANIMATION_DURATION } from "@/constants/animations";
import {
  PlayerHand,
  AIPlayer,
  SpeechBubble,
  WinLossBubbleData,
  ActiveConversation,
  FlyingCardData,
  GamePhase,
} from "@/types/gameState";
import { getCardPosition } from "@/utils/cardPositions";
import { calculateStreakPoints } from "@/utils/scoreCalculation";
import { useGameTimeouts } from "@/hooks/useGameTimeouts";
import { useDebugLogging } from "@/hooks/useDebugLogging";
import { useGameShoe } from "@/hooks/useGameShoe";
import { usePlayerHand } from "@/hooks/usePlayerHand";
import { useBettingActions } from "@/hooks/useBettingActions";
import { useConversationHandlers } from "@/hooks/useConversationHandlers";
import { useGameActions } from "@/hooks/useGameActions";
import { useSuspicionDecay } from "@/hooks/useSuspicionDecay";
import { useDealerChange } from "@/hooks/useDealerChange";
import { useGameInitialization } from "@/hooks/useGameInitialization";
import { useTimedChallenge } from "@/hooks/useTimedChallenge";
import { useConversationTriggers } from "@/hooks/useConversationTriggers";
import { usePitBossMovement } from "@/hooks/usePitBossMovement";
import { useAutoStartHand } from "@/hooks/useAutoStartHand";
import { useGameInteractions } from "@/hooks/useGameInteractions";
import { useRoundEndPhase } from "@/hooks/useRoundEndPhase";
import { useDealerTurnPhase } from "@/hooks/useDealerTurnPhase";
import { useResolvingPhase } from "@/hooks/useResolvingPhase";
import { shouldHitBasicStrategy } from "@/utils/aiStrategy";

export default function GamePage() {
  // Game settings
  const [gameSettings, setGameSettings] = useState<GameSettings>(
    DEFAULT_GAME_SETTINGS,
  );

  // Custom hooks
  const { registerTimeout, clearAllTimeouts } = useGameTimeouts();
  const {
    debugLogs,
    showDebugLog,
    setShowDebugLog,
    addDebugLog,
    clearDebugLogs,
  } = useDebugLogging();

  const {
    shoe,
    setShoe,
    cardsDealt,
    setCardsDealt,
    runningCount,
    setRunningCount,
    shoesDealt,
    setShoesDealt,
    dealCardFromShoe,
  } = useGameShoe(gameSettings);

  const {
    playerChips,
    setPlayerChips,
    playerHand,
    setPlayerHand,
    currentBet,
    setCurrentBet,
    previousBet,
    setPreviousBet,
    minBet,
    maxBet,
    currentScore,
    setCurrentScore,
    currentStreak,
    setCurrentStreak,
    longestStreak,
    setLongestStreak,
    peakChips,
    setPeakChips,
    scoreMultiplier,
    awardCorrectDecisionPoints,
    resetStreak,
  } = usePlayerHand();

  // AI players state
  const [aiPlayers, setAIPlayers] = useState<AIPlayer[]>([]);
  const [dealerHand, setDealerHand] = useState<PlayerHand>({
    cards: [],
    bet: 0,
  });
  const [dealerRevealed, setDealerRevealed] = useState(false);

  // Dealer character state
  const [currentDealer, setCurrentDealer] = useState<DealerCharacter | null>(
    null,
  );
  const [dealerChangeInterval] = useState(
    () => Math.floor(Math.random() * 3) + 8,
  ); // 8-10 shoes

  // UI state
  const [phase, setPhase] = useState<GamePhase>("BETTING");
  const [suspicionLevel, setSuspicionLevel] = useState(0);
  const [pitBossDistance, setPitBossDistance] = useState(30); // 0-100, higher = closer (more dangerous), start farther away
  const [speechBubbles, setSpeechBubbles] = useState<SpeechBubble[]>([]);
  const [winLossBubbles, setWinLossBubbles] = useState<WinLossBubbleData[]>([]);
  const [activeConversation, setActiveConversation] =
    useState<ActiveConversation | null>(null);
  const [playerSociability, setPlayerSociability] = useState(50); // 0-100: how friendly/responsive player has been
  const [handNumber, setHandNumber] = useState(0);
  const [showDealerInfo, setShowDealerInfo] = useState(false);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showStrategyCard, setShowStrategyCard] = useState(false);
  const [initialized, setInitialized] = useState(false);
  const [playerSeat, setPlayerSeat] = useState<number | null>(null); // null means not seated

  // Action bubbles and turn tracking
  const [activePlayerIndex, setActivePlayerIndex] = useState<number | null>(
    null,
  ); // -1 = player, 0+ = AI index
  const [playerActions, setPlayerActions] = useState<
    Map<number, "HIT" | "STAND" | "DOUBLE" | "SPLIT" | "BUST" | "BLACKJACK">
  >(new Map());
  const [playersFinished, setPlayersFinished] = useState<Set<number>>(
    new Set(),
  ); // Track which AI players have finished

  // Flying card animations
  const [flyingCards, setFlyingCards] = useState<FlyingCardData[]>([]);

  // Dealer callouts
  const [dealerCallout, setDealerCallout] = useState<string | null>(null);

  // Timed challenge mode
  const [timeRemaining, setTimeRemaining] = useState(300); // 5 minutes in seconds
  const [timedChallengeActive, setTimedChallengeActive] = useState(false);

  // Track previous hand states for in-hand reactions
  // const prevAIHandsRef = useRef<Map<string, number>>(new Map()); // TODO: Use for reaction tracking

  // Track previous phase to detect transitions into AI_TURNS
  const prevPhaseRef = useRef<GamePhase>("BETTING");

  // Track if AI turn is currently being processed (to prevent duplicate turns)
  const aiTurnProcessingRef = useRef<boolean>(false);

  // Helper to calculate card positions for flying animation
  // Wrapper around utility function to provide current game state
  const getCardPositionForAnimation = useCallback(
    (
      type: "ai" | "player" | "dealer" | "shoe",
      index?: number,
      cardIndex?: number,
    ) => {
      return getCardPosition(type, aiPlayers, playerSeat, index, cardIndex);
    },
    [aiPlayers, playerSeat],
  );

  // Game interactions hook - provides conversation and speech bubble functions
  const { triggerConversation, addSpeechBubble, checkForInitialReactions, showEndOfHandReactions } = useGameInteractions({
    activeConversation,
    setActiveConversation,
    setSpeechBubbles,
    registerTimeout,
    aiPlayers,
    dealerHand,
    blackjackPayout: gameSettings.blackjackPayout,
    addDebugLog,
  });

  // Game actions hook - provides startNewRound, dealInitialCards, hit, stand
  const { startNewRound, dealInitialCards, hit, stand } = useGameActions({
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
    getCardPosition: (type: "ai" | "player" | "dealer" | "shoe", _aiPlayers?: AIPlayer[], _playerSeat?: number | null, index?: number, cardIndex?: number) => 
      getCardPosition(type, aiPlayers, playerSeat, index, cardIndex),
    addDebugLog,
  });

  // Betting actions hook
  const { handleConfirmBet, handleClearBet, handleBetChange } = useBettingActions({
    currentBet,
    setCurrentBet,
    minBet,
    maxBet,
    playerChips,
    setPlayerChips,
    phase,
    playerSeat,
    aiPlayers,
    setPhase,
    setDealerRevealed,
    setPlayerHand,
    setDealerHand,
    setPreviousBet,
    setSpeechBubbles,
    setAIPlayers,
    dealInitialCards,
    addDebugLog,
  });

  // Conversation handlers hook
  const { handleConversationResponse, handleConversationIgnore } = useConversationHandlers({
    activeConversation,
    setActiveConversation,
    setSuspicionLevel,
    setPlayerSociability,
    playerSeat,
    addSpeechBubble,
  });

  // Suspicion decay hook
  useSuspicionDecay(suspicionLevel, setSuspicionLevel);

  // Dealer change hook
  useDealerChange(shoesDealt, dealerChangeInterval, currentDealer, setCurrentDealer);

  // Game initialization hook
  useGameInitialization(setAIPlayers, setCurrentDealer, setInitialized);

  // Timed challenge hook
  useTimedChallenge(
    gameSettings.trainingMode,
    timedChallengeActive,
    setTimedChallengeActive,
    timeRemaining,
    setTimeRemaining
  );

  // Conversation triggers hook
  useConversationTriggers({
    initialized,
    playerSeat,
    activeConversation,
    aiPlayers,
    currentDealer,
    playerSociability,
    phase,
    triggerConversation,
    addSpeechBubble,
  });

  // Pit boss movement hook
  usePitBossMovement(setPitBossDistance, suspicionLevel);

  // Auto-start hand hook
  useAutoStartHand({
    initialized,
    aiPlayersLength: aiPlayers.length,
    handNumber,
    phase,
    playerSeat,
    currentBet,
    setPhase,
    setDealerRevealed,
    setPlayerHand,
    setDealerHand,
    setPlayerChips,
    setSpeechBubbles,
    setAIPlayers,
    aiPlayers,
    dealInitialCards,
  });

  // Log betting interface visibility conditions
  useEffect(() => {
    const shouldShowBetting =
      phase === "BETTING" && initialized && playerSeat !== null;
    addDebugLog(`=== BETTING INTERFACE CHECK ===`);
    addDebugLog(`Phase: ${phase}`);
    addDebugLog(`Initialized: ${initialized}`);
    addDebugLog(`Player seat: ${playerSeat}`);
    addDebugLog(`Should show betting interface: ${shouldShowBetting}`);
  }, [phase, initialized, playerSeat, addDebugLog]);

  // Reset playersFinished when entering AI_TURNS phase (only on phase transition)
  useEffect(() => {
    if (phase === "AI_TURNS" && prevPhaseRef.current !== "AI_TURNS") {
      addDebugLog("=== PHASE: AI_TURNS START ===");
      addDebugLog(`Resetting playersFinished set and activePlayerIndex`);
      setPlayersFinished(new Set());
      setActivePlayerIndex(null);
      aiTurnProcessingRef.current = false; // Reset processing flag on phase entry
    }
    prevPhaseRef.current = phase;
  }, [phase, addDebugLog]);

  // AI turns - process one player at a time, allowing multiple hits
  useEffect(() => {
    if (phase !== "AI_TURNS") {
      // Phase has changed away from AI_TURNS, do nothing
      return;
    }

    if (activePlayerIndex !== null) {
      // A player is currently active, wait for them to finish
      return;
    }

    // Guard against re-entry while processing
    if (aiTurnProcessingRef.current) {
      addDebugLog("⚠️ AI turn already processing, skipping re-entry");
      return;
    }

    aiTurnProcessingRef.current = true;
    addDebugLog("🔒 AI turn processing locked");

    if (phase === "AI_TURNS" && activePlayerIndex === null) {
      // Create array of players with their indices, sorted by table position
      // Higher position numbers are closer to dealer's left (first base)
      // Playing order: dealer's left to right (highest position to lowest)
      const playersByPosition = aiPlayers
        .map((ai, idx) => ({ ai, idx, position: ai.position }))
        .sort((a, b) => b.position - a.position); // Descending: highest position (first base) acts first

      // Log the sorted order for debugging
      addDebugLog(
        `Turn order (sorted by position): ${playersByPosition.map((p) => `${p.ai.character.name} (idx:${p.idx}, seat:${p.position})`).join(", ")}`,
      );
      addDebugLog(
        `Players finished: [${Array.from(playersFinished).join(", ")}]`,
      );

      // Find the next AI player who needs to act (in table order)
      const nextPlayer = playersByPosition.find(({ ai, idx }) => {
        // Skip if already finished
        if (playersFinished.has(idx)) return false;

        const handValue = calculateHandValue(ai.hand.cards);
        const isBust = isBusted(ai.hand.cards);

        // Skip if already busted - they should have been marked finished already
        if (isBust) return false;

        // Player needs to act if they're below 21
        if (handValue < 21) return true;

        // Player at 21 - they need to show STAND then be marked finished
        if (handValue === 21) return true;

        return false;
      });

      if (!nextPlayer) {
        // All players finished, move to dealer turn
        addDebugLog("=== ALL AI PLAYERS FINISHED ===");
        addDebugLog(
          `Players finished: ${Array.from(playersFinished).join(", ")}`,
        );
        addDebugLog("Moving to DEALER_TURN phase");
        aiTurnProcessingRef.current = false; // Unlock before moving to next phase
        addDebugLog("🔓 AI turn processing unlocked (all finished)");
        registerTimeout(() => setPhase("DEALER_TURN"), 1000);
        return;
      }

      // Process this player's action
      const { ai, idx } = nextPlayer;

      addDebugLog(
        `=== AI PLAYER ${idx} TURN (${ai.character.name}, Seat ${ai.position}) ===`,
      );
      addDebugLog(
        `Current hand: ${ai.hand.cards.map((c) => `${c.rank}${c.suit}`).join(", ")}`,
      );

      // Calculate hand value first to determine difficulty
      const handValue = calculateHandValue(ai.hand.cards);
      const isBust = isBusted(ai.hand.cards);

      addDebugLog(`Hand value: ${handValue}, Busted: ${isBust}`);

      // Calculate hand difficulty multiplier
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

      // Calculate timing
      const baseDecisionTime = 800; // Reduced from 1500 - faster thinking
      // const baseActionDelay = 800; // TODO: Use for action delay timing
      const baseActionDisplay = 600; // Reduced from 2000 - show action briefly
      const baseTurnClear = 100; // Reduced from 500 - minimal delay between players

      const { playSpeed } = ai.character;
      const combinedSpeed = playSpeed / handDifficultyMultiplier;
      const decisionTime = Math.round(baseDecisionTime / combinedSpeed);
      // const actionDelay = Math.round(baseActionDelay / combinedSpeed); // TODO: Use for action timing
      const actionDisplay = Math.round(baseActionDisplay / combinedSpeed);
      const turnClear = Math.round(baseTurnClear / combinedSpeed);

      // Set active player immediately
      setActivePlayerIndex(idx);

      // Decide: HIT or STAND using basic strategy with skill level
      const dealerUpCard = dealerHand.cards[0]; // Dealer's face-up card
      const basicStrategyDecision = shouldHitBasicStrategy(
        ai.hand.cards,
        dealerUpCard,
      );

      // Apply skill level: X% chance to follow basic strategy, (100-X)% chance to use simple "hit on < 17" rule
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
        // 15% chance to show banter during turn
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
            }, decisionTime / 2); // Show banter halfway through thinking
          }
        }

        // Show HIT action after thinking
        registerTimeout(() => {
          setPlayerActions((prev) => new Map(prev).set(idx, "HIT"));
        }, decisionTime);

        // Deal card immediately after showing action with animation
        registerTimeout(() => {
          const card = dealCardFromShoe();
          addDebugLog(
            `Dealt card: ${card.rank}${card.suit} (value: ${card.value}, count: ${card.count})`,
          );

          // Add flying card animation
          const shoePosition = getCardPositionForAnimation("shoe");
          const aiPosition = getCardPositionForAnimation("ai", idx, ai.hand.cards.length);

          const flyingCard: FlyingCardData = {
            id: `hit-ai-${idx}-${Date.now()}`,
            card,
            fromPosition: shoePosition,
            toPosition: aiPosition,
          };

          setFlyingCards((prev) => [...prev, flyingCard]);

          // Add card to hand after animation completes
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

            // Check if player busted or reached 21+ after receiving card
            const newHandValue = calculateHandValue([...ai.hand.cards, card]);
            const busted = isBusted([...ai.hand.cards, card]);

            addDebugLog(`New hand value: ${newHandValue}, Busted: ${busted}`);

            if (busted) {
              addDebugLog(`AI Player ${idx} BUSTED!`);
              addDebugLog(`Marking AI Player ${idx} as FINISHED (busted)`);

              // Mark player as finished FIRST, before any async operations
              setPlayersFinished((prev) => new Set(prev).add(idx));

              // Clear HIT action first
              setPlayerActions((prev) => {
                const newMap = new Map(prev);
                newMap.delete(idx);
                return newMap;
              });

              // Show BUST indicator after a brief delay
              setTimeout(() => {
                setPlayerActions((prev) => new Map(prev).set(idx, "BUST"));
              }, 100);

              // Muck (clear) the cards after showing bust indicator
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
                // Move to next player immediately after mucking
                aiTurnProcessingRef.current = false; // Unlock before next turn
                addDebugLog("🔓 AI turn processing unlocked (bust)");
                setActivePlayerIndex(null);
              }, CARD_ANIMATION_DURATION); // Show BUST then muck cards and move on
            } else if (newHandValue >= 21) {
              addDebugLog(`AI Player ${idx} reached 21!`);
              addDebugLog(`Marking AI Player ${idx} as FINISHED (21)`);

              // Mark player as finished FIRST (21 but not bust)
              setPlayersFinished((prev) => new Set(prev).add(idx));

              // Player got 21 - clear HIT and show STAND
              setPlayerActions((prev) => {
                const newMap = new Map(prev);
                newMap.delete(idx);
                return newMap;
              });

              setTimeout(() => {
                setPlayerActions((prev) => new Map(prev).set(idx, "STAND"));
              }, 100);

              // Clear STAND indicator after display and move to next player
              setTimeout(() => {
                setPlayerActions((prev) => {
                  const newMap = new Map(prev);
                  newMap.delete(idx);
                  return newMap;
                });
                // Move to next player immediately
                aiTurnProcessingRef.current = false; // Unlock before next turn
                addDebugLog("🔓 AI turn processing unlocked (21)");
                setActivePlayerIndex(null);
              }, 600); // Show STAND for 0.6s then move on
            }
          }, CARD_ANIMATION_DURATION); // Match FlyingCard animation duration
        }, decisionTime + 50); // Show action, then immediately deal card

        // Clear HIT action after display (only if player didn't bust or get 21)
        // This timeout will be overridden by the bust/21 logic above if needed
        registerTimeout(
          () => {
            setPlayerActions((prev) => {
              const newMap = new Map(prev);
              // Only delete if it's still "HIT" (not "BUST" or "STAND" from hitting 21)
              if (newMap.get(idx) === "HIT") {
                newMap.delete(idx);
              }
              return newMap;
            });
          },
          decisionTime + 50 + 800 + actionDisplay,
        ); // thinking + action display + card animation

        // Clear active player to trigger next action (with thinking time for the new hand)
        // Need to wait for: decision + action show + card animation + action display + turn clear + NEW THINKING TIME
        registerTimeout(
          () => {
            aiTurnProcessingRef.current = false; // Unlock before next turn
            addDebugLog("🔓 AI turn processing unlocked (hit, continuing)");
            setActivePlayerIndex(null);
          },
          decisionTime + 50 + 800 + actionDisplay + turnClear + decisionTime,
        ); // Add another decision time for thinking about new hand
      } else {
        addDebugLog(`AI Player ${idx} decision: STAND`);
        addDebugLog(`Marking AI Player ${idx} as FINISHED (stand)`);

        // Mark player as finished FIRST
        setPlayersFinished((prev) => new Set(prev).add(idx));

        // 15% chance to show banter during turn
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
            }, decisionTime / 2); // Show banter halfway through thinking
          }
        }

        // Show STAND action after thinking
        registerTimeout(() => {
          setPlayerActions((prev) => new Map(prev).set(idx, "STAND"));
        }, decisionTime);

        // Clear action after display
        registerTimeout(() => {
          setPlayerActions((prev) => {
            const newMap = new Map(prev);
            newMap.delete(idx);
            return newMap;
          });
        }, decisionTime + actionDisplay);

        // Clear active to move to next player
        registerTimeout(
          () => {
            aiTurnProcessingRef.current = false; // Unlock before next turn
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
    getCardPosition,
    addDebugLog,
  ]);

  // Next hand
  const nextHand = useCallback(() => {
    setHandNumber((prev) => prev + 1);
    setPhase("BETTING");
    setSpeechBubbles([]); // Clear speech bubbles from previous hand
  }, []);

  // Round end phase hook
  useRoundEndPhase({
    phase,
    debugLogs,
    aiPlayers,
    playerSeat,
    cardsDealt,
    gameSettings,
    registerTimeout,
    setAIPlayers,
    setDealerCallout,
    addSpeechBubble,
    setShoe,
    setCardsDealt,
    setRunningCount,
    setShoesDealt,
    nextHand,
  });

  // Dealer turn phase hook
  useDealerTurnPhase({
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
    getCardPositionForAnimation: (type: "shoe" | "dealer", aiIndex?: number, cardIndex?: number) =>
      getCardPosition(type, aiPlayers, playerSeat, aiIndex, cardIndex),
    addSpeechBubble,
    addDebugLog,
  });

  // Resolving phase hook
  useResolvingPhase({
    phase,
    playerHand,
    dealerHand,
    gameSettings,
    aiPlayers,
    playerSeat,
    currentDealer,
    previousBet,
    cardsDealt,
    runningCount,
    setPlayerChips,
    setPlayerHand,
    setPitBossDistance,
    setSuspicionLevel,
    setPreviousBet,
    setDealerCallout,
    setWinLossBubbles,
    setPhase,
    registerTimeout,
    showEndOfHandReactions,
    addDebugLog,
  });

  const decksRemaining = calculateDecksRemaining(
    gameSettings.numberOfDecks * 52,
    cardsDealt,
  );
  const trueCount = calculateTrueCount(runningCount, decksRemaining);

  return (
    <BlackjackGameUI
      suspicionLevel={suspicionLevel}
      pitBossDistance={pitBossDistance}
      gameSettings={gameSettings}
      runningCount={runningCount}
      timeRemaining={timeRemaining}
      currentStreak={currentStreak}
      playerChips={playerChips}
      currentScore={currentScore}
      scoreMultiplier={scoreMultiplier}
      cardsDealt={cardsDealt}
      currentDealer={currentDealer}
      dealerCallout={dealerCallout}
      phase={phase}
      dealerHand={dealerHand}
      dealerRevealed={dealerRevealed}
      aiPlayers={aiPlayers}
      playerSeat={playerSeat}
      playerHand={playerHand}
      currentBet={currentBet}
      activePlayerIndex={activePlayerIndex}
      playerActions={playerActions}
      speechBubbles={speechBubbles}
      winLossBubbles={winLossBubbles}
      activeConversation={activeConversation}
      flyingCards={flyingCards}
      showDealerInfo={showDealerInfo}
      initialized={initialized}
      minBet={minBet}
      maxBet={maxBet}
      showSettings={showSettings}
      showLeaderboard={showLeaderboard}
      peakChips={peakChips}
      longestStreak={longestStreak}
      showStrategyCard={showStrategyCard}
      debugLogs={debugLogs}
      showDebugLog={showDebugLog}
      setShowSettings={setShowSettings}
      setShowLeaderboard={setShowLeaderboard}
      setShowStrategyCard={setShowStrategyCard}
      setPlayerSeat={setPlayerSeat}
      addDebugLog={addDebugLog}
      startNewRound={startNewRound}
      hit={hit}
      stand={stand}
      handleConversationResponse={handleConversationResponse}
      handleConversationIgnore={handleConversationIgnore}
      setWinLossBubbles={setWinLossBubbles}
      setShowDealerInfo={setShowDealerInfo}
      handleBetChange={handleBetChange}
      handleConfirmBet={handleConfirmBet}
      handleClearBet={handleClearBet}
      setGameSettings={setGameSettings}
      setShowDebugLog={setShowDebugLog}
      clearDebugLogs={clearDebugLogs}
    />
  );
}
