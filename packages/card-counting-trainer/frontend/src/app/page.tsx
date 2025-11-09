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

  // Track if dealer has finished dealing (to prevent duplicate final hand announcements)
  const dealerFinishedRef = useRef<boolean>(false);

  // Track if AI turn is currently being processed (to prevent duplicate turns)
  const aiTurnProcessingRef = useRef<boolean>(false);

  // Track if dealer turn is currently being processed (to prevent duplicate dealer actions)
  const dealerTurnProcessingRef = useRef<boolean>(false);

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

  // Dealer turn
  useEffect(() => {
    if (phase !== "DEALER_TURN") {
      // Phase has changed away from DEALER_TURN, do nothing
      return;
    }

    // Guard against re-entry while processing
    if (dealerTurnProcessingRef.current) {
      addDebugLog("⚠️ Dealer turn already processing, skipping re-entry");
      return;
    }

    dealerTurnProcessingRef.current = true;
    addDebugLog("🔒 Dealer turn processing locked");

    if (phase === "DEALER_TURN") {
      addDebugLog("=== PHASE: DEALER_TURN START ===");
      addDebugLog(
        `Dealer hand: ${dealerHand.cards.map((c) => `${c.rank}${c.suit}`).join(", ")}`,
      );
      addDebugLog(`Dealer hand value: ${calculateHandValue(dealerHand.cards)}`);
      setDealerRevealed(true);
      dealerFinishedRef.current = false; // Reset flag when entering dealer turn

      // 10% chance to show dealer-directed banter when dealer reveals
      if (Math.random() < 0.1 && aiPlayers.length > 0) {
        const randomAI =
          aiPlayers[Math.floor(Math.random() * aiPlayers.length)];
        const banterLines = AI_DIALOGUE_ADDONS.find(
          (addon) => addon.id === randomAI.character.id,
        )?.banterWithDealer;

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

      registerTimeout(() => {
        // Dealer plays according to rules - deal one card at a time with delays
        const dealNextCard = () => {
          setDealerHand((prevHand) => {
            const handValue = calculateHandValue(prevHand.cards);

            // Check if should hit
            const shouldHit = () => {
              // Always hit on 16 or less
              if (handValue < 17) return true;

              // Always stand on 18 or more
              if (handValue >= 18) return false;

              // On 17: depends on soft 17 rule
              if (handValue === 17) {
                // Check if it's a soft 17 (has an Ace counted as 11)
                const hasAce = prevHand.cards.some((card) => card.rank === "A");
                const hasMultipleCards = prevHand.cards.length > 2;
                const isSoft = hasAce && hasMultipleCards;

                if (gameSettings.dealerHitsSoft17 && isSoft) {
                  return true; // Hit soft 17
                }
                return false; // Stand on hard 17 or stand on all 17s
              }

              return false;
            };

            // Check if dealer should hit and hasn't busted
            if (shouldHit() && !isBusted(prevHand.cards)) {
              const card = dealCardFromShoe();
              addDebugLog(
                `Dealer HIT: ${card.rank}${card.suit} (value: ${card.value}, count: ${card.count})`,
              );

              // Add flying card animation
              const shoePosition = getCardPositionForAnimation("shoe");
              const dealerPosition = getCardPositionForAnimation(
                "dealer",
                undefined,
                prevHand.cards.length,
              );

              const flyingCard: FlyingCardData = {
                id: `hit-dealer-${Date.now()}`,
                card,
                fromPosition: shoePosition,
                toPosition: dealerPosition,
              };

              setFlyingCards((prev) => [...prev, flyingCard]);

              // Add card to hand after animation
              setTimeout(() => {
                setFlyingCards((prev) =>
                  prev.filter((fc) => fc.id !== flyingCard.id),
                );
              }, CARD_ANIMATION_DURATION);

              const newHand = { ...prevHand, cards: [...prevHand.cards, card] };
              const newValue = calculateHandValue(newHand.cards);
              addDebugLog(`Dealer hand value: ${newValue}`);

              // Schedule next card after animation + delay
              registerTimeout(() => dealNextCard(), 1000);

              return newHand;
            }
            // Dealer is done, announce final hand (only once)
            if (!dealerFinishedRef.current) {
              dealerFinishedRef.current = true;

              const finalValue = calculateHandValue(prevHand.cards);
              const isBust = isBusted(prevHand.cards);

              addDebugLog(`=== DEALER FINAL HAND ===`);
              addDebugLog(
                `Dealer cards: ${prevHand.cards.map((c) => `${c.rank}${c.suit}`).join(", ")}`,
              );
              addDebugLog(`Dealer hand value: ${finalValue}`);
              addDebugLog(`Dealer busted: ${isBust}`);

              if (isBust) {
                setDealerCallout("Dealer busts");
              } else {
                setDealerCallout(`Dealer has ${finalValue}`);
              }

              // Clear callout and move to resolving
              registerTimeout(() => {
                setDealerCallout(null);
                dealerTurnProcessingRef.current = false; // Unlock before moving to next phase
                addDebugLog("🔓 Dealer turn processing unlocked (finished)");
                setPhase("RESOLVING");
              }, 10000); // Increased to 10 seconds - dealer callouts stay visible longer
            }

            return prevHand;
          });
        };

        // Start dealing cards
        dealNextCard();
      }, 1500);
    }
  }, [phase, dealerHand, dealCardFromShoe, gameSettings, registerTimeout]);

  // Track if we've already resolved this hand
  const hasResolvedRef = useRef(false);

  // Resolve hands
  useEffect(() => {
    if (phase === "RESOLVING" && !hasResolvedRef.current) {
      hasResolvedRef.current = true;

      const playerResult = determineHandResult(playerHand, dealerHand);
      const bjPayoutMultiplier = getBlackjackPayoutMultiplier(
        gameSettings.blackjackPayout,
      );
      const playerPayout = calculatePayout(
        playerHand,
        playerResult,
        bjPayoutMultiplier,
      );

      setPlayerChips((prev) => prev + playerPayout);
      setPlayerHand((prev) => ({ ...prev, result: playerResult }));

      // Update pit boss distance and suspicion based on player behavior
      if (playerSeat !== null && playerHand.bet > 0) {
        const betVariation =
          Math.abs(playerHand.bet - previousBet) / previousBet;
        const netGain = playerPayout - playerHand.bet;
        const isBigWin = netGain > playerHand.bet * 1.5; // Win more than 1.5x bet

        // Calculate true count for bet correlation detection
        const decksRemaining = calculateDecksRemaining(
          gameSettings.numberOfDecks * 52,
          cardsDealt,
        );
        const trueCount = calculateTrueCount(runningCount, decksRemaining);

        // Determine if bet change correlates with count (sign of counting)
        const betIncreased = playerHand.bet > previousBet;
        const countIsFavorable = trueCount >= 2; // Count of +2 or higher favors player
        const countIsUnfavorable = trueCount <= -1;
        const suspiciousBetting =
          (betIncreased && countIsFavorable) ||
          (!betIncreased && countIsUnfavorable);

        // Calculate suspicion from bet variation
        let suspicionIncrease = 0;
        if (betVariation > 0.3 && currentDealer) {
          // 30%+ bet change
          // Base suspicion from bet size change
          const baseSuspicion = betVariation * 15; // Max ~15 for 100% change

          // Multiply by dealer detection skill
          const detectionMultiplier = currentDealer.detectionSkill / 100;

          // If betting correlates with count, it's MORE suspicious
          // If betting goes against count (camouflage), it's LESS suspicious
          const correlationMultiplier = suspiciousBetting ? 1.5 : 0.5;

          // Count extremity multiplier - more extreme counts = more suspicious to vary bet
          const countMultiplier = 1 + Math.abs(trueCount) * 0.2; // +20% per count point

          suspicionIncrease =
            baseSuspicion *
            detectionMultiplier *
            correlationMultiplier *
            countMultiplier;
          suspicionIncrease = Math.min(suspicionIncrease, 25); // Cap at 25 points
        }

        // Calculate proximity change
        let proximityChange = 0;

        // Big wins attract attention
        if (isBigWin) {
          proximityChange -= 15; // Pit boss moves closer
        }

        // Large bet variations attract attention
        if (betVariation > 0.5) {
          // 50%+ bet change
          const variationPenalty = Math.min(betVariation * 20, 20);
          proximityChange -= variationPenalty;
        }

        // Small random drift (pit boss walking around)
        const drift = Math.random() * 10 - 3; // -3 to +7, slightly tends to move away
        proximityChange += drift;

        // Distance affects suspicion multiplier
        setPitBossDistance((prev) => {
          const newDistance = Math.max(
            0,
            Math.min(100, prev + proximityChange),
          );

          // If pit boss is very close, increase suspicion more
          if (newDistance < 30 && (isBigWin || betVariation > 0.5)) {
            const proximityBonus = isBigWin ? 5 : Math.floor(betVariation * 10);
            suspicionIncrease += proximityBonus;
          }

          return newDistance;
        });

        // Apply suspicion increase
        if (suspicionIncrease > 0) {
          setSuspicionLevel((s) => Math.min(100, s + suspicionIncrease));
        }

        // Update previous bet for next hand
        setPreviousBet(playerHand.bet);
      }

      // Dealer announces payouts for winning hands
      const dealerValue = calculateHandValue(dealerHand.cards);
      const dealerBusted = isBusted(dealerHand.cards);

      // Determine what to announce - dealer announces minimum winning hand value
      let callout = "";
      if (dealerBusted) {
        callout = "Paying all hands";
      } else {
        // Dealer pays hands that beat their total (dealer value + 1)
        const minWinningValue = dealerValue + 1;
        if (minWinningValue <= 21) {
          callout = `Paying ${minWinningValue}`;
        } else {
          // Dealer has 21, no non-blackjack hands can beat it
          callout = "Dealer wins";
        }
      }

      setDealerCallout(callout);

      // Create win/loss bubbles for all players
      addDebugLog("=== CREATING WIN/LOSS BUBBLES ===");
      const newWinLossBubbles: WinLossBubbleData[] = [];

      // Add bubble for human player if they have cards
      if (playerSeat !== null && playerHand.cards.length > 0) {
        addDebugLog(`Player has cards, creating bubble for seat ${playerSeat}`);
        const tablePositions = [
          [5, 55], // Seat 0 - Far left
          [16, 62], // Seat 1 - Left
          [29, 68], // Seat 2 - Center-left
          [42, 72], // Seat 3 - Center
          [56, 72], // Seat 4 - Center
          [69, 68], // Seat 5 - Center-right
          [82, 62], // Seat 6 - Right
          [93, 55], // Seat 7 - Far right
        ];

        const [x, y] = tablePositions[playerSeat];
        let result: "win" | "lose" | "push" | "blackjack" = "lose";

        if (playerResult === "BLACKJACK") {
          result = "blackjack";
        } else if (playerResult === "WIN") {
          result = "win";
        } else if (playerResult === "PUSH") {
          result = "push";
        } else {
          result = "lose";
        }

        newWinLossBubbles.push({
          id: `player-result-${Date.now()}`,
          result,
          position: { left: `${x}%`, top: `${y - 5}%` }, // Slightly above player position
        });
      }

      // Add bubbles for AI players
      addDebugLog(`Checking ${aiPlayers.length} AI players for bubbles`);
      aiPlayers.forEach((ai) => {
        if (ai.hand.cards.length > 0) {
          addDebugLog(
            `AI Player ${ai.character.name} has ${ai.hand.cards.length} cards`,
          );
          const tablePositions = [
            [5, 55], // Seat 0 - Far left
            [16, 62], // Seat 1 - Left
            [29, 68], // Seat 2 - Center-left
            [42, 72], // Seat 3 - Center
            [56, 72], // Seat 4 - Center
            [69, 68], // Seat 5 - Center-right
            [82, 62], // Seat 6 - Right
            [93, 55], // Seat 7 - Far right
          ];

          const [x, y] = tablePositions[ai.position];
          const aiResult = determineHandResult(ai.hand, dealerHand);
          let result: "win" | "lose" | "push" | "blackjack" = "lose";

          if (aiResult === "BLACKJACK") {
            result = "blackjack";
          } else if (aiResult === "WIN") {
            result = "win";
          } else if (aiResult === "PUSH") {
            result = "push";
          } else {
            result = "lose";
          }

          newWinLossBubbles.push({
            id: `ai-${ai.character.id}-result-${Date.now()}`,
            result,
            position: { left: `${x}%`, top: `${y - 5}%` }, // Slightly above AI position
          });
          addDebugLog(
            `Added ${result} bubble for ${ai.character.name} at seat ${ai.position}`,
          );
        }
      });

      addDebugLog(`Created ${newWinLossBubbles.length} total win/loss bubbles`);
      setWinLossBubbles(newWinLossBubbles);

      // Show end-of-hand reactions
      showEndOfHandReactions();

      registerTimeout(() => {
        setDealerCallout(null);
        setPhase("ROUND_END");
      }, 11000); // Increased to 11 seconds - dealer callouts stay visible longer
    } else if (phase !== "RESOLVING") {
      // Reset the flag when we leave RESOLVING phase
      hasResolvedRef.current = false;
    }
  }, [
    phase,
    playerHand,
    dealerHand,
    gameSettings,
    aiPlayers,
    playerSeat,
    registerTimeout,
    showEndOfHandReactions,
    currentDealer,
    previousBet,
    cardsDealt,
    runningCount,
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
