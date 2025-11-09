"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { Button, Card as UICard } from "@nextui-org/react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
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
import {
  playDealerHand,
  determineHandResult,
  calculatePayout,
} from "@/lib/dealer";
import { Card as GameCard, HandResult } from "@/types/game";
import {
  GameSettings,
  DEFAULT_GAME_SETTINGS,
  getBlackjackPayoutMultiplier,
  canDoubleDown,
  calculateCutCardPosition,
  TrainingMode,
} from "@/types/gameSettings";
import {
  AI_CHARACTERS,
  AICharacter,
  getAIAvatarPath,
} from "@/data/aiCharacters";
import {
  DEALER_CHARACTERS,
  DealerCharacter,
  getRandomDealer,
  getDealerAvatarPath,
} from "@/data/dealerCharacters";
import { getInitialHandReaction, getHitReaction } from "@/data/inHandReactions";
import {
  AI_DIALOGUE_ADDONS,
  DEALER_PLAYER_CONVERSATIONS,
  getDealerPlayerLine,
  pick,
} from "@/data/ai-dialogue-addons";
import FlyingCard from "@/components/FlyingCard";
import WinLossBubble from "@/components/WinLossBubble";
import SuspicionMeter from "@/components/SuspicionMeter";
import DealerInfo from "@/components/DealerInfo";
import TableOverlay from "@/components/TableOverlay";
import Shoe from "@/components/Shoe";
import PlayingCard from "@/components/PlayingCard";
import ActionBubble from "@/components/ActionBubble";
import TurnIndicator from "@/components/TurnIndicator";
import ConversationPrompt from "@/components/ConversationPrompt";
import LeaderboardModal from "@/components/LeaderboardModal";
import GameSettingsModal from "@/components/GameSettingsModal";
import BasicStrategyCard from "@/components/BasicStrategyCard";
import BettingInterface from "@/components/BettingInterface";
import {
  CARD_ANIMATION_DURATION,
  CARD_APPEAR_TIME,
  TABLE_POSITIONS,
} from "@/constants/animations";

interface PlayerHand {
  cards: GameCard[];
  bet: number;
  result?: HandResult;
}

interface AIPlayer {
  character: AICharacter;
  hand: PlayerHand;
  chips: number;
  position: number;
}

interface SpeechBubble {
  playerId: string;
  message: string;
  position: { left: string; top: string };
  id: string;
}

interface WinLossBubbleData {
  id: string;
  result: "win" | "lose" | "push" | "blackjack";
  position: { left: string; top: string };
}

interface ActiveConversation {
  id: string;
  speakerId: string; // AI character id or "dealer"
  speakerName: string;
  question: string;
  choices: Array<{
    text: string;
    suspicionChange: number;
  }>;
  position: { left: string; top: string };
}

interface FlyingCardData {
  id: string;
  card: GameCard;
  fromPosition: { left: string; top: string };
  toPosition: { left: string; top: string };
}

type GamePhase =
  | "BETTING"
  | "DEALING"
  | "PLAYER_TURN"
  | "AI_TURNS"
  | "DEALER_TURN"
  | "RESOLVING"
  | "ROUND_END";

export default function GamePage() {
  const router = useRouter();
  const { user } = useAuth();

  // Game settings
  const [gameSettings, setGameSettings] = useState<GameSettings>(
    DEFAULT_GAME_SETTINGS,
  );

  // Game state
  const [shoe, setShoe] = useState<GameCard[]>(() =>
    createAndShuffleShoe(
      gameSettings.numberOfDecks,
      gameSettings.countingSystem,
    ),
  );
  const [cardsDealt, setCardsDealt] = useState(0);
  const [runningCount, setRunningCount] = useState(0);
  const [shoesDealt, setShoesDealt] = useState(0);

  // Player state
  const [playerChips, setPlayerChips] = useState(1000);
  const [playerHand, setPlayerHand] = useState<PlayerHand>({
    cards: [],
    bet: 0,
  });
  const [currentBet, setCurrentBet] = useState(0); // Temporary bet being placed
  const [previousBet, setPreviousBet] = useState(10); // Track previous bet for bet spread detection
  const [minBet] = useState(5);
  const [maxBet] = useState(500);

  // Scoring and statistics state
  const [currentScore, setCurrentScore] = useState(0);
  const [currentStreak, setCurrentStreak] = useState(0); // Consecutive correct decisions
  const [longestStreak, setLongestStreak] = useState(0);
  const [peakChips, setPeakChips] = useState(1000);
  const [scoreMultiplier, setScoreMultiplier] = useState(1.0); // 1.0x - 2.0x based on counting accuracy

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
  const prevAIHandsRef = useRef<Map<string, number>>(new Map());

  // Track previous phase to detect transitions into AI_TURNS
  const prevPhaseRef = useRef<GamePhase>("BETTING");

  // Track if dealer has finished dealing (to prevent duplicate final hand announcements)
  const dealerFinishedRef = useRef<boolean>(false);

  // Track if AI turn is currently being processed (to prevent duplicate turns)
  const aiTurnProcessingRef = useRef<boolean>(false);

  // Track if dealer turn is currently being processed (to prevent duplicate dealer actions)
  const dealerTurnProcessingRef = useRef<boolean>(false);

  // Timeout management - store all active timeouts for cleanup
  const timeoutsRef = useRef<Set<NodeJS.Timeout>>(new Set());

  // Debug logging state (for testing)
  const [debugLogs, setDebugLogs] = useState<string[]>([]);
  const [showDebugLog, setShowDebugLog] = useState(false);

  // Utility to register and auto-cleanup timeouts
  const registerTimeout = useCallback((callback: () => void, delay: number) => {
    const timeout = setTimeout(() => {
      callback();
      timeoutsRef.current.delete(timeout);
    }, delay);
    timeoutsRef.current.add(timeout);
    return timeout;
  }, []);

  // Cleanup all active timeouts
  const clearAllTimeouts = useCallback(() => {
    timeoutsRef.current.forEach(clearTimeout);
    timeoutsRef.current.clear();
  }, []);

  // Debug logging helper
  const addDebugLog = useCallback((message: string) => {
    const timestamp = new Date().toISOString().split("T")[1].split(".")[0];
    const logEntry = `[${timestamp}] ${message}`;
    console.log(logEntry);
    setDebugLogs((prev) => [...prev, logEntry]);
  }, []);

  // Clear debug logs and continue to next hand
  const clearDebugLogs = useCallback(() => {
    addDebugLog("=== LOG CLEARED - CONTINUING TO NEXT HAND ===");

    // Clear the logs after a brief moment so the final message is visible
    setTimeout(() => {
      console.clear();
      setDebugLogs([]);
      setShowDebugLog(false);
    }, 100);

    // The ROUND_END useEffect will now trigger and continue to next hand
    // since debugLogs.length will become 0
  }, [addDebugLog]);

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => clearAllTimeouts();
  }, [clearAllTimeouts]);

  // Timed challenge countdown timer
  useEffect(() => {
    if (gameSettings.trainingMode === TrainingMode.TIMED_CHALLENGE) {
      if (!timedChallengeActive) {
        // Start the timer
        setTimedChallengeActive(true);
        setTimeRemaining(300); // Reset to 5 minutes
      }

      if (timedChallengeActive && timeRemaining > 0) {
        const timer = setInterval(() => {
          setTimeRemaining((prev) => {
            if (prev <= 1) {
              // Time's up!
              clearInterval(timer);
              // Could show a modal or message here
              return 0;
            }
            return prev - 1;
          });
        }, 1000);

        return () => clearInterval(timer);
      }
    } else {
      setTimedChallengeActive(false);
    }
  }, [gameSettings.trainingMode, timedChallengeActive, timeRemaining]);

  // Helper to calculate card positions for flying animation
  const getCardPosition = useCallback(
    (
      type: "ai" | "player" | "dealer" | "shoe",
      index?: number,
      cardIndex?: number,
    ) => {
      // Card dimensions and spacing
      const cardWidth = 60; // px
      const cardSpacing = 15; // px between cards

      if (type === "shoe") {
        // Shoe is positioned at right: 7%, top: 20px (from the Shoe component positioning)
        // The shoe is rotated 90deg and cards exit from the bottom opening
        // Adjusted 100px further left from the shoe opening
        return { left: "calc(85% - 100px)", top: "calc(20px + 15vh)" };
      }

      if (type === "dealer") {
        // Dealer cards are below the dealer avatar
        // Dealer section is at 8%, avatar is 150px + 12px margin = 162px
        // Cards appear below the avatar with horizontal offset for multiple cards
        const baseLeft = 50; // Center at 50%
        const offset =
          cardIndex !== undefined
            ? cardIndex * cardSpacing -
              (cardSpacing * (cardIndex > 0 ? 1 : 0)) / 2
            : 0;
        return {
          left: `calc(${baseLeft}% + ${offset}px)`,
          top: "calc(8% + 162px)",
        };
      }

      if (type === "player" && playerSeat !== null) {
        const [x, y] = TABLE_POSITIONS[playerSeat];
        // Cards are positioned above the avatar with horizontal offset
        const offset =
          cardIndex !== undefined
            ? cardIndex * cardSpacing -
              (cardSpacing * (cardIndex > 0 ? 1 : 0)) / 2
            : 0;
        return {
          left: `calc(${x}% + ${offset}px)`,
          top: `calc(${y}% - 190px)`,
        };
      }

      if (type === "ai" && index !== undefined) {
        const aiPlayer = aiPlayers[index];
        if (aiPlayer) {
          const [x, y] = TABLE_POSITIONS[aiPlayer.position];
          // Cards are positioned above the avatar with horizontal offset
          const offset =
            cardIndex !== undefined
              ? cardIndex * cardSpacing -
                (cardSpacing * (cardIndex > 0 ? 1 : 0)) / 2
              : 0;
          return {
            left: `calc(${x}% + ${offset}px)`,
            top: `calc(${y}% - 140px)`,
          };
        }
      }

      // Default fallback
      return { left: "50%", top: "50%" };
    },
    [aiPlayers, playerSeat],
  );

  // Initialize AI players and dealer on mount
  useEffect(() => {
    // Randomly select 3-4 AI players
    const numAIPlayers = Math.floor(Math.random() * 2) + 3; // 3 or 4 AI players
    const shuffledCharacters = [...AI_CHARACTERS].sort(
      () => Math.random() - 0.5,
    );
    const selectedCharacters = shuffledCharacters.slice(0, numAIPlayers);

    // Fisher-Yates shuffle for truly random seat assignment
    const availableSeats = [0, 1, 2, 3, 4, 5, 6, 7];
    for (let i = availableSeats.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [availableSeats[i], availableSeats[j]] = [
        availableSeats[j],
        availableSeats[i],
      ];
    }

    const aiPlayersWithSeats = selectedCharacters.map((char, idx) => ({
      character: char,
      hand: { cards: [], bet: 50 },
      chips: 1000,
      position: availableSeats[idx],
    }));

    setAIPlayers(aiPlayersWithSeats);

    const initialDealer = getRandomDealer();
    setCurrentDealer(initialDealer);
    setInitialized(true);
  }, []);

  // Suspicion meter decay
  useEffect(() => {
    if (suspicionLevel > 0) {
      const decayInterval = setInterval(() => {
        setSuspicionLevel((prev) => Math.max(0, prev - 1));
      }, 3000);
      return () => clearInterval(decayInterval);
    }
  }, [suspicionLevel]);

  // Deal a card with reshuffle handling
  const dealCardFromShoe = useCallback(() => {
    const { card, remainingShoe, reshuffled } = dealCard(
      shoe,
      gameSettings.numberOfDecks,
      gameSettings.countingSystem,
    );

    if (reshuffled) {
      setShoe(remainingShoe);
      setCardsDealt(1);
      setRunningCount(card.count);
      setShoesDealt((prev) => prev + 1);
    } else {
      setShoe(remainingShoe);
      setCardsDealt((prev) => prev + 1);
      setRunningCount((prev) => prev + card.count);
    }

    return card;
  }, [shoe, gameSettings.numberOfDecks, gameSettings.countingSystem]);

  // Change dealer every 8-10 shoes
  useEffect(() => {
    if (shoesDealt > 0 && shoesDealt % dealerChangeInterval === 0) {
      const newDealer = getRandomDealer(
        currentDealer ? [currentDealer.id] : [],
      );
      setCurrentDealer(newDealer);
    }
  }, [shoesDealt, dealerChangeInterval, currentDealer]);

  // Conversation system functions
  const triggerConversation = useCallback(
    (speakerId: string, speakerName: string, position: number) => {
      // Don't trigger if there's already an active conversation
      if (activeConversation) return;

      const [x, y] = TABLE_POSITIONS[position] || TABLE_POSITIONS[0];

      // Get character-specific or dealer dialogue
      let question: string;
      if (speakerId === "dealer") {
        question = getDealerPlayerLine("generic", "dealerQuestions");
      } else {
        question = getDealerPlayerLine(speakerId, "playerQuestions");
      }

      // Create response choices
      const choices = [
        { text: "Sure, yeah...", suspicionChange: -2 }, // Friendly, reduces suspicion slightly
        { text: "*nods politely*", suspicionChange: 0 }, // Neutral
        { text: "*focuses on cards*", suspicionChange: 5 }, // Ignoring - increases suspicion
      ];

      const conversation: ActiveConversation = {
        id: `conv-${Date.now()}`,
        speakerId,
        speakerName,
        question,
        choices,
        position: { left: `${x}%`, top: `${y}%` },
      };

      setActiveConversation(conversation);
    },
    [activeConversation],
  );

  const addSpeechBubble = useCallback(
    (playerId: string, message: string, position: number) => {
      // Find the character name and hand for logging
      const player = aiPlayers.find((p) => p.character.id === playerId);
      const characterName = player?.character?.name || playerId;
      const hand = player?.hand?.cards || [];
      const handStr = hand.map((c) => `${c.rank}${c.suit}`).join(", ");
      const handValue = hand.length > 0 ? calculateHandValue(hand) : 0;

      addDebugLog(
        `💬 ${characterName} [Hand: ${handStr} (${handValue})]: "${message}"`,
      );

      // Use same positions as player avatars on the table
      const [x, y] = TABLE_POSITIONS[position] || TABLE_POSITIONS[0];

      const bubble: SpeechBubble = {
        playerId,
        message,
        position: { left: `${x}%`, top: `${y}%` },
        id: playerId, // Use playerId directly as it's already unique per call
      };

      setSpeechBubbles((prev) => [...prev, bubble]);

      registerTimeout(() => {
        setSpeechBubbles((prev) => prev.filter((b) => b.id !== bubble.id));
      }, 12000); // Increased to 12 seconds - speech bubbles stay visible longer
    },
    [registerTimeout, aiPlayers, addDebugLog],
  );

  // Periodic conversation triggers (frequency based on player sociability)
  useEffect(() => {
    if (!initialized || playerSeat === null || activeConversation) return;

    // Sociability affects conversation frequency:
    // Low sociability (0-30): Less frequent, people leave you alone
    // Medium sociability (31-69): Normal frequency
    // High sociability (70+): More frequent, people chat with you more
    const baseTriggerChance = 0.3;
    const sociabilityMultiplier = playerSociability / 50; // 0 = 0%, 50 = 30%, 100 = 60%
    const triggerChance = baseTriggerChance * sociabilityMultiplier;

    // Interval also affected by sociability (lower sociability = longer intervals)
    const baseInterval = 25000; // 25 seconds base
    const intervalVariation = 10000; // +/- 10 seconds
    const sociabilityIntervalMultiplier = Math.max(
      0.5,
      2 - playerSociability / 50,
    ); // Low sociability = longer waits

    const conversationInterval = setInterval(
      () => {
        const shouldTrigger = Math.random() < triggerChance;
        if (!shouldTrigger) return;

        // 60% chance it's from an AI player, 40% from dealer
        if (Math.random() < 0.6 && aiPlayers.length > 0) {
          // Pick random AI player
          const randomAI =
            aiPlayers[Math.floor(Math.random() * aiPlayers.length)];
          triggerConversation(
            randomAI.character.id,
            randomAI.character.name,
            randomAI.position,
          );
        } else if (currentDealer) {
          // Dealer asks a question (use dealer's position - center top)
          const dealerPosition = 3; // Center position for visualization
          triggerConversation("dealer", currentDealer.name, dealerPosition);
        }
      },
      (baseInterval + Math.random() * intervalVariation) *
        sociabilityIntervalMultiplier,
    );

    return () => clearInterval(conversationInterval);
  }, [
    initialized,
    playerSeat,
    activeConversation,
    aiPlayers,
    currentDealer,
    triggerConversation,
    playerSociability,
  ]);

  // AI-to-AI and AI-to-Dealer banter (background conversation)
  useEffect(() => {
    if (!initialized || phase === "BETTING") return;

    const banterInterval = setInterval(
      () => {
        // 20% chance for background banter every 15-25 seconds
        if (Math.random() < 0.2 && aiPlayers.length >= 2) {
          const randomAI =
            aiPlayers[Math.floor(Math.random() * aiPlayers.length)];

          // Get some small talk banter
          const message = getDealerPlayerLine(
            randomAI.character.id,
            "smallTalk",
          );

          if (message) {
            addSpeechBubble(
              `ai-banter-${Date.now()}`,
              message,
              randomAI.position,
            );
          }
        }
      },
      15000 + Math.random() * 10000,
    ); // 15-25 seconds

    return () => clearInterval(banterInterval);
  }, [initialized, phase, aiPlayers, addSpeechBubble]);

  // Pit boss randomly moves around the floor
  useEffect(() => {
    const interval = setInterval(() => {
      setPitBossDistance((prev) => {
        // Random movement: -8 to +12 (tends to move away slightly over time)
        const movement = Math.random() * 20 - 8;
        const newDistance = Math.max(0, Math.min(100, prev + movement));
        return newDistance;
      });
    }, 8000); // Move every 8 seconds

    return () => clearInterval(interval);
  }, []);

  // Auto-start first hand after initialization
  useEffect(() => {
    if (
      initialized &&
      aiPlayers.length > 0 &&
      handNumber === 0 &&
      phase === "BETTING"
    ) {
      const timer = setTimeout(() => {
        setPhase("DEALING");
        setDealerRevealed(false);

        // Player only gets cards if seated and has placed a bet
        const playerBet =
          playerSeat !== null && currentBet > 0 ? currentBet : 0;
        setPlayerHand({ cards: [], bet: playerBet });
        setDealerHand({ cards: [], bet: 0 });

        // Only deduct chips if player is actually playing
        if (playerBet > 0) {
          setPlayerChips((prev) => prev - playerBet);
        }

        setSpeechBubbles([]); // Clear any lingering speech bubbles

        // Reset AI hands with random bets
        const updatedAI = aiPlayers.map((ai) => ({
          ...ai,
          hand: { cards: [], bet: Math.floor(Math.random() * 50) + 25 },
        }));
        setAIPlayers(updatedAI);

        // Deal initial cards
        setTimeout(() => dealInitialCards(), 500);
      }, 500);

      return () => clearTimeout(timer);
    }
  }, [
    initialized,
    aiPlayers.length,
    handNumber,
    phase,
    playerSeat,
    currentBet,
  ]);

  // Auto-start subsequent hands (handNumber > 0)
  useEffect(() => {
    if (
      initialized &&
      aiPlayers.length > 0 &&
      handNumber > 0 &&
      phase === "BETTING"
    ) {
      const timer = setTimeout(() => {
        setPhase("DEALING");
        setDealerRevealed(false);

        // Player only gets cards if seated and has placed a bet
        const playerBet =
          playerSeat !== null && currentBet > 0 ? currentBet : 0;
        setPlayerHand({ cards: [], bet: playerBet });
        setDealerHand({ cards: [], bet: 0 });

        // Only deduct chips if player is actually playing
        if (playerBet > 0) {
          setPlayerChips((prev) => prev - playerBet);
        }

        // Reset AI hands with random bets (keep same players, just clear hands and set new bets)
        const updatedAI = aiPlayers.map((ai) => ({
          ...ai,
          hand: { cards: [], bet: Math.floor(Math.random() * 50) + 25 },
        }));
        setAIPlayers(updatedAI);

        // Deal initial cards
        setTimeout(() => dealInitialCards(), 500);
      }, 500);

      return () => clearTimeout(timer);
    }
  }, [
    initialized,
    aiPlayers.length,
    handNumber,
    phase,
    playerSeat,
    currentBet,
  ]);

  // Start new round - transition to BETTING phase
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
  }, [aiPlayers]);

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
    const dealtCards: { type: string; index: number; card: GameCard }[] = [];
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

    // Sort AI players by position (right to left from dealer's perspective = ascending since seats are numbered 0=right, 7=left)
    const sortedAIPlayers = [...aiPlayers].sort(
      (a, b) => a.position - b.position,
    );
    addDebugLog(
      `Sorted dealing order: ${sortedAIPlayers.map((ai) => `${ai.character.name}(seat ${ai.position})`).join(" -> ")}`,
    );

    addDebugLog("--- First card round (right to left) ---");
    // Deal first card to everyone (right to left, dealer last)
    sortedAIPlayers.forEach((ai) => {
      const idx = aiPlayers.indexOf(ai);
      const card = dealFromCurrentShoe();
      addDebugLog(
        `${ai.character.name} (Seat ${ai.position}): ${card.rank}${card.suit} (value: ${card.value}, count: ${card.count}) | RC: ${currentRunningCount}`,
      );
      dealtCards.push({ type: "ai", index: idx, card });
    });
    if (playerSeat !== null) {
      const card = dealFromCurrentShoe();
      addDebugLog(
        `Player (Seat ${playerSeat}): ${card.rank}${card.suit} (value: ${card.value}, count: ${card.count}) | RC: ${currentRunningCount}`,
      );
      dealtCards.push({ type: "player", index: 0, card });
    }
    const dealerCard1 = dealFromCurrentShoe();
    addDebugLog(
      `Dealer card 1: ${dealerCard1.rank}${dealerCard1.suit} (value: ${dealerCard1.value}, count: ${dealerCard1.count}) [FACE UP] | RC: ${currentRunningCount}`,
    );
    dealtCards.push({ type: "dealer", index: 0, card: dealerCard1 });

    addDebugLog("--- Second card round (right to left) ---");
    // Deal second card to everyone (right to left, dealer last)
    sortedAIPlayers.forEach((ai) => {
      const idx = aiPlayers.indexOf(ai);
      const card = dealFromCurrentShoe();
      addDebugLog(
        `${ai.character.name} (Seat ${ai.position}): ${card.rank}${card.suit} (value: ${card.value}, count: ${card.count}) | RC: ${currentRunningCount}`,
      );
      dealtCards.push({ type: "ai", index: idx, card });
    });
    if (playerSeat !== null) {
      const card = dealFromCurrentShoe();
      addDebugLog(
        `Player: ${card.rank}${card.suit} (value: ${card.value}, count: ${card.count}) | RC: ${currentRunningCount}`,
      );
      dealtCards.push({ type: "player", index: 0, card });
    }
    const dealerCard2 = dealFromCurrentShoe();
    addDebugLog(
      `Dealer card 2: ${dealerCard2.rank}${dealerCard2.suit} (value: ${dealerCard2.value}, count: ${dealerCard2.count}) [FACE DOWN] | RC: ${currentRunningCount}`,
    );
    dealtCards.push({ type: "dealer", index: 0, card: dealerCard2 });

    // Update state with final shoe state
    setShoe(currentShoe);
    setCardsDealt(currentCardsDealt);
    setRunningCount(currentRunningCount);
    setShoesDealt(currentShoesDealt);

    // Now animate dealing the pre-dealt cards using managed timeouts
    // Adjust delay based on dealer's dealing speed (higher speed = shorter delay)
    const baseDelayBetweenCards = 2000; // Base delay in ms (SLOWED DOWN FOR TESTING - was 500)
    const dealerSpeed = currentDealer?.dealSpeed ?? 1.0;
    const delayBetweenCards = Math.round(baseDelayBetweenCards / dealerSpeed);

    let delay = 0;
    // Track card counts for each player/dealer to calculate proper positions
    const cardCounts = {
      ai: new Map<number, number>(), // AI player index -> card count
      player: 0,
      dealer: 0,
    };

    dealtCards.forEach(({ type, index, card }, animIdx) => {
      registerTimeout(() => {
        // Get current card index for this player/dealer
        let cardIndex = 0;
        if (type === "ai") {
          cardIndex = cardCounts.ai.get(index) || 0;
          cardCounts.ai.set(index, cardIndex + 1);
        } else if (type === "player") {
          cardIndex = cardCounts.player;
          cardCounts.player++;
        } else if (type === "dealer") {
          cardIndex = cardCounts.dealer;
          cardCounts.dealer++;
        }

        // Calculate positions for flying animation
        const fromPosition = getCardPosition("shoe");
        const toPosition =
          type === "ai"
            ? getCardPosition("ai", index, cardIndex)
            : type === "player"
              ? getCardPosition("player", undefined, cardIndex)
              : getCardPosition("dealer", undefined, cardIndex);

        // Log card animation details
        const playerName =
          type === "ai"
            ? `${aiPlayers[index]?.character.name} (AI${index}, seat ${aiPlayers[index]?.position})`
            : type === "player"
              ? "PLAYER"
              : "DEALER";
        addDebugLog(
          `🎴 Card #${cardIndex} for ${playerName} (${card.rank}${card.suit})`,
        );
        addDebugLog(`   From: ${fromPosition.left}, ${fromPosition.top}`);
        addDebugLog(`   To: ${toPosition.left}, ${toPosition.top}`);

        // Create flying card
        const flyingCardId = `flying-${animIdx}-${Date.now()}`;
        setFlyingCards((prev) => [
          ...prev,
          {
            id: flyingCardId,
            card,
            fromPosition,
            toPosition,
          },
        ]);

        // After animation mostly completes, add card to hand (reduced from 800ms to 700ms)
        registerTimeout(() => {
          // Remove flying card
          setFlyingCards((prev) => prev.filter((fc) => fc.id !== flyingCardId));

          // Add card to appropriate hand
          if (type === "ai") {
            setAIPlayers((prev) => {
              const updated = [...prev];
              // CRITICAL FIX: Don't mutate! Create new array instead of using .push()
              updated[index] = {
                ...updated[index],
                hand: {
                  ...updated[index].hand,
                  cards: [...updated[index].hand.cards, card],
                },
              };
              return updated;
            });
          } else if (type === "player") {
            setPlayerHand((prev) => {
              const newHand = { ...prev, cards: [...prev.cards, card] };
              return newHand;
            });
          } else if (type === "dealer") {
            setDealerHand((prev) => {
              const newHand = { ...prev, cards: [...prev.cards, card] };
              return newHand;
            });
          }
        }, CARD_APPEAR_TIME);
      }, delay);
      delay += delayBetweenCards;
    });

    // Wait for all cards to finish flying and be added to hands
    // delay = time when last card STARTS flying
    // + CARD_ANIMATION_DURATION for the last card's animation to complete
    // + 500ms buffer for reactions
    registerTimeout(
      () => {
        checkForInitialReactions();

        // Check for blackjacks using the dealt cards
        // Build hands from dealtCards to check for blackjacks
        const aiHands: Map<number, GameCard[]> = new Map();
        let playerCards: GameCard[] = [];

        dealtCards.forEach(({ type, index, card }) => {
          if (type === "ai") {
            if (!aiHands.has(index)) {
              aiHands.set(index, []);
            }
            aiHands.get(index)!.push(card);
          } else if (type === "player") {
            playerCards.push(card);
          }
        });

        addDebugLog("--- Deal complete - checking for blackjacks ---");
        // Check AI players for blackjack
        aiHands.forEach((cards, idx) => {
          const handValue = calculateHandValue(cards);
          const hasBlackjack = isBlackjack(cards);
          addDebugLog(
            `AI Player ${idx}: Hand value = ${handValue}, Blackjack = ${hasBlackjack}`,
          );
          if (hasBlackjack) {
            setPlayerActions((prev) => new Map(prev).set(idx, "BLACKJACK"));
            setTimeout(() => {
              setPlayerActions((prev) => {
                const newMap = new Map(prev);
                newMap.delete(idx);
                return newMap;
              });
            }, 800); // Reduced from 2000ms - show briefly
          }
        });

        // Check player for blackjack
        if (playerSeat !== null) {
          const playerValue = calculateHandValue(playerCards);
          const playerHasBlackjack = isBlackjack(playerCards);
          addDebugLog(
            `Player: Hand value = ${playerValue}, Blackjack = ${playerHasBlackjack}`,
          );
          if (playerHasBlackjack) {
            setPlayerActions((prev) => new Map(prev).set(-1, "BLACKJACK"));
            setTimeout(() => {
              setPlayerActions((prev) => {
                const newMap = new Map(prev);
                newMap.delete(-1);
                return newMap;
              });
            }, 800); // Reduced from 2000ms - show briefly
          }
        }

        addDebugLog(`Updated running count: ${currentRunningCount}`);
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
      },
      delay + 800 + 500,
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
  ]);

  // Betting handlers - manual bet placement
  const handleConfirmBet = useCallback(() => {
    addDebugLog("=== CONFIRM BET CLICKED ===");
    addDebugLog(`Current bet: $${currentBet}`);
    addDebugLog(`Min bet: $${minBet}, Max bet: $${maxBet}`);
    addDebugLog(`Player chips: $${playerChips}`);
    addDebugLog(`Phase: ${phase}`);
    addDebugLog(`Player seat: ${playerSeat}`);

    const canBet =
      currentBet >= minBet &&
      currentBet <= maxBet &&
      currentBet <= playerChips &&
      phase === "BETTING" &&
      playerSeat !== null;
    addDebugLog(`Can place bet: ${canBet}`);

    if (canBet) {
      addDebugLog("✓ BET CONFIRMED - Starting dealing phase");
      setPhase("DEALING");
      setDealerRevealed(false);
      setPlayerHand({ cards: [], bet: currentBet });
      setDealerHand({ cards: [], bet: 0 });
      setPlayerChips((prev) => {
        addDebugLog(
          `Deducting bet: $${prev} - $${currentBet} = $${prev - currentBet}`,
        );
        return prev - currentBet;
      });
      setPreviousBet(currentBet);
      setSpeechBubbles([]); // Clear any lingering speech bubbles

      // Reset AI hands with random bets
      const updatedAI = aiPlayers.map((ai) => ({
        ...ai,
        hand: { cards: [], bet: Math.floor(Math.random() * 50) + 25 },
      }));
      setAIPlayers(updatedAI);

      // Deal initial cards
      setTimeout(() => dealInitialCards(), 500);
    } else {
      addDebugLog("✗ BET NOT CONFIRMED - Requirements not met");
      if (currentBet < minBet)
        addDebugLog(`  - Bet too low (${currentBet} < ${minBet})`);
      if (currentBet > maxBet)
        addDebugLog(`  - Bet too high (${currentBet} > ${maxBet})`);
      if (currentBet > playerChips)
        addDebugLog(`  - Insufficient chips (${currentBet} > ${playerChips})`);
      if (phase !== "BETTING") addDebugLog(`  - Wrong phase (${phase})`);
      if (playerSeat === null) addDebugLog(`  - Player not seated`);
    }
  }, [
    currentBet,
    minBet,
    maxBet,
    playerChips,
    phase,
    playerSeat,
    aiPlayers,
    dealInitialCards,
    addDebugLog,
  ]);

  const handleClearBet = useCallback(() => {
    addDebugLog("CLEAR BET - Resetting bet to $0");
    setCurrentBet(0);
  }, [addDebugLog]);

  const handleBetChange = useCallback(
    (newBet: number) => {
      addDebugLog(`BET CHANGED: $${currentBet} → $${newBet}`);
      setCurrentBet(newBet);
    },
    [currentBet, addDebugLog],
  );

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

  // Check for initial hand reactions
  const checkForInitialReactions = useCallback(() => {
    const reactions: Array<{
      playerId: string;
      message: string;
      outcome: string;
    }> = [];

    aiPlayers.forEach((ai) => {
      const handValue = calculateHandValue(ai.hand.cards);
      const hasBlackjack = isBlackjack(ai.hand.cards);
      const reaction = getInitialHandReaction(
        ai.character,
        handValue,
        hasBlackjack,
      );

      if (reaction) {
        const outcomeType = hasBlackjack
          ? "bigWin"
          : handValue <= 12
            ? "bigLoss"
            : "smallWin";
        reactions.push({
          playerId: ai.character.id,
          message: reaction,
          outcome: outcomeType,
        });
      }
    });

    // Limit to 1-2 bubbles with priority
    const priorityOrder = [
      "bigWin",
      "bigLoss",
      "smallWin",
      "smallLoss",
      "push",
    ];
    const sortedReactions = reactions.sort((a, b) => {
      return (
        priorityOrder.indexOf(a.outcome) - priorityOrder.indexOf(b.outcome)
      );
    });
    const numBubbles = Math.random() < 0.6 ? 1 : 2;
    const selectedReactions = sortedReactions.slice(0, numBubbles);

    // Show speech bubbles
    selectedReactions.forEach((reaction, idx) => {
      setTimeout(() => {
        const aiPlayer = aiPlayers.find(
          (ai) => ai.character.id === reaction.playerId,
        );
        if (aiPlayer) {
          addSpeechBubble(
            reaction.playerId,
            reaction.message,
            aiPlayer.position,
          );
        }
      }, idx * 600);
    });
  }, [aiPlayers]);

  // Player actions
  const hit = useCallback(() => {
    addDebugLog("=== PLAYER ACTION: HIT ===");
    addDebugLog(
      `Current hand: ${playerHand.cards.map((c) => `${c.rank}${c.suit}`).join(", ")}`,
    );
    addDebugLog(`Current hand value: ${calculateHandValue(playerHand.cards)}`);

    const card = dealCardFromShoe();
    addDebugLog(
      `Dealt card: ${card.rank}${card.suit} (value: ${card.value}, count: ${card.count}) | RC: ${runningCount + card.count}`,
    );

    // Add flying card animation
    const shoePosition = getCardPosition("shoe");
    const playerPosition = getCardPosition(
      "player",
      undefined,
      playerHand.cards.length,
    );

    const flyingCard: FlyingCardData = {
      id: `hit-player-${Date.now()}`,
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
    }, CARD_ANIMATION_DURATION);
  }, [
    playerHand,
    dealCardFromShoe,
    getCardPosition,
    addDebugLog,
    runningCount,
  ]);

  const stand = useCallback(() => {
    addDebugLog("=== PLAYER ACTION: STAND ===");
    addDebugLog(
      `Final hand: ${playerHand.cards.map((c) => `${c.rank}${c.suit}`).join(", ")}`,
    );
    addDebugLog(`Final hand value: ${calculateHandValue(playerHand.cards)}`);
    addDebugLog("Moving to AI_TURNS phase");
    setPhase("AI_TURNS");
  }, [playerHand, addDebugLog]);

  // Basic strategy decision - returns true if should HIT, false if should STAND
  const shouldHitBasicStrategy = useCallback(
    (playerCards: GameCard[], dealerUpCard: GameCard): boolean => {
      const playerValue = calculateHandValue(playerCards);
      const dealerValue =
        dealerUpCard.rank === "A"
          ? 11
          : ["J", "Q", "K"].includes(dealerUpCard.rank)
            ? 10
            : parseInt(dealerUpCard.rank);

      // Check if player has soft hand (Ace counted as 11)
      const hasAce = playerCards.some((card) => card.rank === "A");
      const hardValue = playerCards.reduce((sum, card) => {
        if (card.rank === "A") return sum + 1;
        if (["J", "Q", "K"].includes(card.rank)) return sum + 10;
        return sum + parseInt(card.rank);
      }, 0);
      const isSoft = hasAce && hardValue + 10 === playerValue;

      // Soft hand strategy (has Ace counted as 11)
      if (isSoft) {
        if (playerValue >= 19) return false; // Stand on soft 19+
        if (playerValue === 18) {
          // Soft 18: hit vs 9, 10, A; stand vs 2-8
          return dealerValue >= 9;
        }
        return true; // Hit on soft 17 or less
      }

      // Hard hand strategy
      if (playerValue >= 17) return false; // Always stand on 17+
      if (playerValue <= 11) return true; // Always hit on 11 or less

      // 12-16: depends on dealer upcard
      if (playerValue === 12) {
        // Hit vs 2, 3, 7+; stand vs 4-6
        return dealerValue <= 3 || dealerValue >= 7;
      }
      if (playerValue >= 13 && playerValue <= 16) {
        // Stand vs dealer 2-6, hit vs 7+
        return dealerValue >= 7;
      }

      return false;
    },
    [],
  );

  // Calculate exponential score points: 10 × 2^(N-1) for Nth correct decision
  const calculateStreakPoints = useCallback((streakNumber: number): number => {
    return 10 * Math.pow(2, streakNumber - 1);
  }, []);

  // Award points for correct decision and update streak
  const awardCorrectDecisionPoints = useCallback(() => {
    const newStreak = currentStreak + 1;
    const basePoints = calculateStreakPoints(newStreak);
    const pointsWithMultiplier = Math.floor(basePoints * scoreMultiplier);

    setCurrentStreak(newStreak);
    setCurrentScore((prev) => prev + pointsWithMultiplier);

    // Update longest streak
    if (newStreak > longestStreak) {
      setLongestStreak(newStreak);
    }
  }, [currentStreak, scoreMultiplier, longestStreak, calculateStreakPoints]);

  // Reset streak on incorrect decision
  const resetStreak = useCallback(() => {
    setCurrentStreak(0);
  }, []);

  // Update peak chips whenever chips change
  useEffect(() => {
    if (playerChips > peakChips) {
      setPeakChips(playerChips);
    }
  }, [playerChips, peakChips]);

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

    // Players act in seat order (0-7, right to left from dealer's perspective)
    // Sort by position ascending (0=right/first base, 7=left/third base)
    const playersByPosition = aiPlayers
      .map((ai, idx) => ({ ai, idx, position: ai.position }))
      .sort((a, b) => a.position - b.position);

    // Log the turn order for debugging
    addDebugLog(
      `Turn order (right to left): ${playersByPosition.map((p) => `${p.ai.character.name} (seat ${p.position})`).join(" -> ")}`,
    );
    addDebugLog(
      `Players finished: [${Array.from(playersFinished).join(", ")}]`,
    );

    // Find the next AI player who needs to act (in index order 0-7)
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
      addDebugLog("Moving to DEALER_TURN phase");
      aiTurnProcessingRef.current = false; // Unlock before moving to next phase
      addDebugLog("🔓 AI turn processing unlocked (all finished)");
      registerTimeout(() => setPhase("DEALER_TURN"), 1000);
      return;
    }

    // Process this player's action
    const { ai, idx } = nextPlayer;

    addDebugLog(`=== ${ai.character.name}'S TURN (Seat ${ai.position}) ===`);
    addDebugLog(
      `Hand: ${ai.hand.cards.map((c) => `${c.rank}${c.suit}`).join(", ")}`,
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
    const baseActionDelay = 800;
    const baseActionDisplay = 600; // Reduced from 2000 - show action briefly
    const baseTurnClear = 100; // Reduced from 500 - minimal delay between players

    const playSpeed = ai.character.playSpeed;
    const combinedSpeed = playSpeed / handDifficultyMultiplier;
    const decisionTime = Math.round(baseDecisionTime / combinedSpeed);
    const actionDelay = Math.round(baseActionDelay / combinedSpeed);
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
    const followsBasicStrategy = Math.random() * 100 < ai.character.skillLevel;
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
        const shoePosition = getCardPosition("shoe");
        const aiPosition = getCardPosition("ai", idx, ai.hand.cards.length);

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
            }, 800); // Show BUST for 0.8s then muck cards and move on
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
        }, CARD_ANIMATION_DURATION);
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
        decisionTime + 50 + CARD_ANIMATION_DURATION + actionDisplay,
      );

      // Clear active player to trigger next action (with thinking time for the new hand)
      // Need to wait for: decision + action show + card animation + action display + turn clear + NEW THINKING TIME
      registerTimeout(
        () => {
          aiTurnProcessingRef.current = false; // Unlock before next turn
          addDebugLog("🔓 AI turn processing unlocked (hit, continuing)");
          setActivePlayerIndex(null);
        },
        decisionTime +
          50 +
          CARD_ANIMATION_DURATION +
          actionDisplay +
          turnClear +
          decisionTime,
      );
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
  }, [
    phase,
    aiPlayers,
    dealCardFromShoe,
    registerTimeout,
    activePlayerIndex,
    playersFinished,
    dealerHand,
    shouldHitBasicStrategy,
    getCardPosition,
    addDebugLog,
  ]);

  // Dealer turn
  useEffect(() => {
    if (phase !== "DEALER_TURN") {
      // Phase changed away from DEALER_TURN
      return;
    }

    // Guard against re-entry while dealer is playing
    if (dealerTurnProcessingRef.current) {
      addDebugLog("⚠️ Dealer turn already processing, skipping re-entry");
      return;
    }

    dealerTurnProcessingRef.current = true;
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
              const shoePosition = getCardPosition("shoe");
              const dealerPosition = getCardPosition(
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
              }, 800);

              const newHand = { ...prevHand, cards: [...prevHand.cards, card] };
              const newValue = calculateHandValue(newHand.cards);
              addDebugLog(`Dealer hand value: ${newValue}`);

              // Schedule next card after animation + delay
              registerTimeout(() => dealNextCard(), 1000);

              return newHand;
            } else {
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
                  dealerTurnProcessingRef.current = false; // Unlock dealer turn
                  setPhase("RESOLVING");
                }, 10000); // Increased to 10 seconds - dealer callouts stay visible longer
              }

              return prevHand;
            }
          });
        };

        // Start dealing cards
        dealNextCard();
      }, 1500);
    }
  }, [phase, dealerHand, dealCardFromShoe, gameSettings, registerTimeout]);

  // Show end-of-hand reactions (defined here before useEffect uses it)
  const showEndOfHandReactions = useCallback(() => {
    const reactions: Array<{
      playerId: string;
      message: string;
      outcome: string;
      position: number;
    }> = [];

    const bjPayoutMultiplier = getBlackjackPayoutMultiplier(
      gameSettings.blackjackPayout,
    );

    aiPlayers.forEach((ai) => {
      const result = determineHandResult(ai.hand, dealerHand);
      const payout = calculatePayout(ai.hand, result, bjPayoutMultiplier);
      const netGain = payout - ai.hand.bet;
      const handValue = calculateHandValue(ai.hand.cards);
      const dealerValue = calculateHandValue(dealerHand.cards);

      // Determine the specific context
      const isBusted = handValue > 21;
      const isDealerBlackjack =
        dealerValue === 21 && dealerHand.cards.length === 2;
      const isDealerWin = !isBusted && result === "LOSE";

      let currentContext: "bust" | "dealerBlackjack" | "dealerWin" | "any" =
        "any";
      if (isBusted) {
        currentContext = "bust";
      } else if (isDealerBlackjack && result === "LOSE") {
        currentContext = "dealerBlackjack";
      } else if (isDealerWin) {
        currentContext = "dealerWin";
      }

      let outcomeType = "push";
      let reactions_pool: Array<{ text: string; contexts: Array<string> }> = [];
      let reactionChance = 0;

      if (result === "BLACKJACK") {
        outcomeType = "bigWin";
        reactions_pool = ai.character.reactions.bigWin;
        reactionChance = 0.8; // Very likely to react to blackjack
      } else if (netGain > ai.hand.bet * 0.5) {
        outcomeType = "bigWin";
        reactions_pool = ai.character.reactions.bigWin;
        reactionChance = 0.7; // Likely to react to big win
      } else if (netGain > 0) {
        outcomeType = "smallWin";
        reactions_pool = ai.character.reactions.smallWin;
        reactionChance = 0.3; // Sometimes react to small win
      } else if (netGain === 0) {
        outcomeType = "push";
        reactions_pool = ai.character.reactions.push;
        reactionChance = 0.1; // Rarely react to push
      } else if (result === "BUST" || netGain < -ai.hand.bet * 0.5) {
        outcomeType = "bigLoss";
        reactions_pool = ai.character.reactions.bigLoss;
        reactionChance = 0.7; // Likely to react to big loss
      } else {
        outcomeType = "smallLoss";
        reactions_pool = ai.character.reactions.smallLoss;
        reactionChance = 0.3; // Sometimes react to small loss
      }

      // Filter reactions by context - only show reactions appropriate for the situation
      const validReactions = reactions_pool.filter(
        (reaction) =>
          reaction.contexts.includes(currentContext) ||
          reaction.contexts.includes("any"),
      );

      // Only add reaction if player decides to react and there are valid messages
      if (validReactions.length > 0 && Math.random() < reactionChance) {
        const selectedReaction =
          validReactions[Math.floor(Math.random() * validReactions.length)];
        reactions.push({
          playerId: ai.character.id,
          message: selectedReaction.text,
          outcome: outcomeType,
          position: ai.position,
        });
      }
    });

    // Limit to 0-2 bubbles with priority (most interesting reactions)
    const priorityOrder = [
      "bigWin",
      "bigLoss",
      "smallWin",
      "smallLoss",
      "push",
    ];
    const sortedReactions = reactions.sort((a, b) => {
      return (
        priorityOrder.indexOf(a.outcome) - priorityOrder.indexOf(b.outcome)
      );
    });

    // Show 0-2 reactions max
    const maxReactions = Math.min(
      reactions.length,
      Math.random() < 0.5 ? 1 : 2,
    );
    const selectedReactions = sortedReactions.slice(0, maxReactions);

    selectedReactions.forEach((reaction, idx) => {
      registerTimeout(() => {
        addSpeechBubble(
          `${reaction.playerId}-reaction-${idx}`, // Unique ID per reaction
          reaction.message,
          reaction.position,
        );
      }, idx * 1000); // Stagger by 1 second to avoid overlap
    });
  }, [aiPlayers, dealerHand, gameSettings, registerTimeout]);

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
        const [x, y] = TABLE_POSITIONS[playerSeat];
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
          const [x, y] = TABLE_POSITIONS[ai.position];
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

  const handleConversationResponse = useCallback(
    (choiceIndex: number) => {
      if (!activeConversation) return;

      const choice = activeConversation.choices[choiceIndex];

      // Apply suspicion change
      if (choice.suspicionChange !== 0) {
        setSuspicionLevel((prev) =>
          Math.max(0, Math.min(100, prev + choice.suspicionChange)),
        );
      }

      // Adjust sociability based on response type
      if (choiceIndex === 0) {
        // Friendly response - people want to talk to you more
        setPlayerSociability((prev) => Math.min(100, prev + 3));
      } else if (choiceIndex === 1) {
        // Neutral - small increase
        setPlayerSociability((prev) => Math.min(100, prev + 1));
      } else if (choiceIndex === 2) {
        // Dismissive response - people talk to you less
        setPlayerSociability((prev) => Math.max(0, prev - 5));
      }

      // Show speech bubble with player's response
      if (playerSeat !== null) {
        addSpeechBubble("player-response", choice.text, playerSeat);
      }

      // Clear the conversation
      setActiveConversation(null);
    },
    [activeConversation, playerSeat, addSpeechBubble],
  );

  const handleConversationIgnore = useCallback(() => {
    if (!activeConversation) return;

    // Ignoring conversations raises suspicion significantly
    setSuspicionLevel((prev) => Math.min(100, prev + 8));

    // Being unresponsive makes people avoid you
    setPlayerSociability((prev) => Math.max(0, prev - 8));

    // Show that player is too focused (suspicious)
    if (playerSeat !== null) {
      addSpeechBubble("player-ignore", "*concentrating intensely*", playerSeat);
    }

    setActiveConversation(null);
  }, [activeConversation, playerSeat, addSpeechBubble]);

  // Next hand
  const nextHand = useCallback(() => {
    setHandNumber((prev) => prev + 1);
    setPhase("BETTING");
    setSpeechBubbles([]); // Clear speech bubbles from previous hand
  }, []);

  // Round end - automatically progress to next hand (unless debug logs exist)
  useEffect(() => {
    if (phase === "ROUND_END") {
      // If debug logs exist, wait for user to click "Clear Log & Continue"
      if (debugLogs.length > 0) {
        return;
      }

      registerTimeout(() => {
        // Occasionally add or remove players (15% chance per hand)
        const playerChangeChance = Math.random();

        if (playerChangeChance < 0.15) {
          const currentAICount = aiPlayers.length;
          const occupiedSeats = new Set(aiPlayers.map((p) => p.position));
          if (playerSeat !== null) occupiedSeats.add(playerSeat);

          // 50/50 chance to add or remove (if possible)
          const shouldAdd = Math.random() < 0.5;

          if (shouldAdd && currentAICount < 7 && occupiedSeats.size < 8) {
            // Add a new player
            const availableSeats = [0, 1, 2, 3, 4, 5, 6, 7].filter(
              (seat) => !occupiedSeats.has(seat),
            );

            if (availableSeats.length > 0) {
              // Pick random available seat
              const newSeat =
                availableSeats[
                  Math.floor(Math.random() * availableSeats.length)
                ];

              // Pick random character not already at table
              const usedCharacterIds = new Set(
                aiPlayers.map((p) => p.character.id),
              );
              const availableCharacters = AI_CHARACTERS.filter(
                (char) => !usedCharacterIds.has(char.id),
              );

              if (availableCharacters.length > 0) {
                const newCharacter =
                  availableCharacters[
                    Math.floor(Math.random() * availableCharacters.length)
                  ];

                const newPlayer: AIPlayer = {
                  character: newCharacter,
                  hand: { cards: [], bet: 50 },
                  chips: 1000,
                  position: newSeat,
                };

                setAIPlayers((prev) => [...prev, newPlayer]);

                // Show dealer callout
                setDealerCallout(`${newCharacter.name} joins the table!`);
                registerTimeout(() => setDealerCallout(null), 2000);
              }
            }
          } else if (!shouldAdd && currentAICount > 2) {
            // Remove a random player (keep at least 2 AI players for atmosphere)
            const removeIndex = Math.floor(Math.random() * currentAICount);
            const removedPlayer = aiPlayers[removeIndex];

            setAIPlayers((prev) =>
              prev.filter((_, idx) => idx !== removeIndex),
            );

            // Show dealer callout
            setDealerCallout(
              `${removedPlayer.character.name} leaves the table.`,
            );
            registerTimeout(() => setDealerCallout(null), 2000);
          }
        }

        // Check if we need to reshuffle (cut card reached)
        const totalCards = gameSettings.numberOfDecks * 52;
        const cutCardPosition = calculateCutCardPosition(
          gameSettings.numberOfDecks,
          gameSettings.deckPenetration,
        );
        const cardsUntilCutCard = totalCards - cutCardPosition;

        // 25% chance to show random table banter between AI players
        if (Math.random() < 0.25 && aiPlayers.length >= 2) {
          // Pick a random AI player to speak
          const speakerIndex = Math.floor(Math.random() * aiPlayers.length);
          const speaker = aiPlayers[speakerIndex];

          // Get their banter lines
          const banterLines = AI_DIALOGUE_ADDONS.find(
            (addon) => addon.id === speaker.character.id,
          )?.banterWithPlayer;

          if (banterLines && banterLines.length > 0) {
            const randomBanter = pick(banterLines);
            addSpeechBubble(
              `ai-banter-${Date.now()}`,
              randomBanter.text,
              speaker.position,
            );
          }
        }

        if (cardsDealt >= cardsUntilCutCard) {
          // Reshuffle the shoe
          const newShoe = createAndShuffleShoe(
            gameSettings.numberOfDecks,
            gameSettings.countingSystem,
          );
          setShoe(newShoe);
          setCardsDealt(0);
          setRunningCount(0);
          setShoesDealt((prev) => prev + 1);

          // Show reshuffle message
          setDealerCallout("Shuffling new shoe...");
          registerTimeout(() => {
            setDealerCallout(null);
            nextHand();
          }, 3000);
        } else {
          // No reshuffle needed, just continue to next hand
          nextHand();
        }
      }, 4000); // Show results for 4 seconds before continuing
    }
  }, [
    phase,
    cardsDealt,
    gameSettings.numberOfDecks,
    gameSettings.deckPenetration,
    gameSettings.countingSystem,
    nextHand,
    registerTimeout,
    aiPlayers,
    playerSeat,
    debugLogs.length,
    addSpeechBubble,
  ]);

  // Pit boss wandering - they move around the casino floor, influenced by suspicion
  useEffect(() => {
    const wanderInterval = setInterval(() => {
      setPitBossDistance((prev) => {
        // Random walk: small changes up or down
        const change = (Math.random() - 0.5) * 20; // -10 to +10
        let newDistance = prev + change;

        // Keep within bounds (10-90 range for more dynamic movement)
        newDistance = Math.max(10, Math.min(90, newDistance));

        // Suspicion influences pit boss behavior
        // High suspicion (70+): pit boss actively approaches (targets 60-80 range = close/red)
        // Medium suspicion (40-70): pit boss investigates (targets 40-60 range = medium/yellow)
        // Low suspicion (0-40): pit boss patrols at distance (targets 20-40 range = far/green)

        if (suspicionLevel >= 70) {
          // High suspicion: pit boss approaches and stays close
          if (newDistance < 60) {
            newDistance += Math.random() * 12; // Pull toward closer
          } else if (newDistance > 80) {
            newDistance -= Math.random() * 10; // Don't get too close
          }
        } else if (suspicionLevel >= 40) {
          // Medium suspicion: pit boss investigates, stays at medium distance
          if (newDistance < 40) {
            newDistance += Math.random() * 8; // Pull toward medium
          } else if (newDistance > 60) {
            newDistance -= Math.random() * 8; // Pull back to medium
          }
        } else {
          // Low suspicion: normal patrol behavior - stay farther away
          if (newDistance < 20) {
            // If very close, strongly push away
            newDistance += Math.random() * 10;
          } else if (newDistance > 50) {
            // If far, moderately pull back toward comfortable distance
            newDistance -= Math.random() * 8;
          } else if (newDistance > 40) {
            // If slightly far, gently pull back
            newDistance -= Math.random() * 4;
          }
        }

        return Math.round(newDistance);
      });
    }, 3000); // Change every 3 seconds

    return () => clearInterval(wanderInterval);
  }, [suspicionLevel]);

  const decksRemaining = calculateDecksRemaining(
    gameSettings.numberOfDecks * 52,
    cardsDealt,
  );
  const trueCount = calculateTrueCount(runningCount, decksRemaining);

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100vw",
        height: "100vh",
        overflow: "hidden",
      }}
    >
      {/* Suspicion Meter - Fixed position */}
      <SuspicionMeter
        level={suspicionLevel}
        pitBossDistance={pitBossDistance}
      />

      {/* Stats Bar at Top */}
      <div
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          width: "100%",
          height: "60px",
          backgroundColor: "rgba(0, 0, 0, 0.8)",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "0 20px",
          zIndex: 1000,
          borderBottom: "2px solid #FFD700",
        }}
      >
        <div className="flex gap-3 items-center">
          {gameSettings.trainingMode === TrainingMode.PRACTICE && (
            <div
              style={{
                backgroundColor: "rgba(255, 215, 0, 0.1)",
                color: "#FFF",
                border: "2px solid #FFD700",
                borderRadius: "8px",
                padding: "6px 12px",
                fontSize: "14px",
                fontWeight: "bold",
                width: "150px",
                textAlign: "center",
              }}
            >
              COUNT:{" "}
              <span style={{ color: "#FFD700" }}>
                {runningCount >= 0 ? `+${runningCount}` : runningCount}
              </span>
            </div>
          )}
          {gameSettings.trainingMode === TrainingMode.TEST && (
            <div
              style={{
                backgroundColor: "rgba(255, 107, 107, 0.1)",
                color: "#FF6B6B",
                border: "2px solid #FF6B6B",
                borderRadius: "8px",
                padding: "6px 12px",
                fontSize: "14px",
                fontWeight: "bold",
                width: "150px",
                textAlign: "center",
              }}
            >
              🧪 TEST MODE
            </div>
          )}
          {gameSettings.trainingMode === TrainingMode.TIMED_CHALLENGE && (
            <>
              <div
                style={{
                  backgroundColor: "rgba(255, 215, 0, 0.1)",
                  color: "#FFF",
                  border: "2px solid #FFD700",
                  borderRadius: "8px",
                  padding: "6px 12px",
                  fontSize: "14px",
                  fontWeight: "bold",
                  width: "150px",
                  textAlign: "center",
                }}
              >
                COUNT:{" "}
                <span style={{ color: "#FFD700" }}>
                  {runningCount >= 0 ? `+${runningCount}` : runningCount}
                </span>
              </div>
              <div
                style={{
                  backgroundColor:
                    timeRemaining < 60
                      ? "rgba(255, 107, 107, 0.1)"
                      : timeRemaining < 180
                        ? "rgba(255, 215, 0, 0.1)"
                        : "rgba(76, 175, 80, 0.1)",
                  color: "#FFF",
                  border: `2px solid ${timeRemaining < 60 ? "#FF6B6B" : timeRemaining < 180 ? "#FFD700" : "#4CAF50"}`,
                  borderRadius: "8px",
                  padding: "6px 12px",
                  fontSize: "14px",
                  fontWeight: "bold",
                  width: "150px",
                  textAlign: "center",
                }}
              >
                ⏱️ TIME:{" "}
                <span
                  style={{
                    color:
                      timeRemaining < 60
                        ? "#FF6B6B"
                        : timeRemaining < 180
                          ? "#FFD700"
                          : "#4CAF50",
                  }}
                >
                  {Math.floor(timeRemaining / 60)}:
                  {String(timeRemaining % 60).padStart(2, "0")}
                </span>
              </div>
            </>
          )}
          <div
            style={{
              backgroundColor: "rgba(76, 175, 80, 0.1)",
              color: "#FFF",
              border: "2px solid #4CAF50",
              borderRadius: "8px",
              padding: "6px 12px",
              fontSize: "14px",
              fontWeight: "bold",
              width: "150px",
              textAlign: "center",
            }}
          >
            STREAK:{" "}
            <span style={{ color: currentStreak > 0 ? "#4CAF50" : "#AAA" }}>
              {currentStreak}
            </span>
          </div>
          <div
            style={{
              backgroundColor: "rgba(255, 215, 0, 0.1)",
              color: "#FFF",
              border: "2px solid #FFD700",
              borderRadius: "8px",
              padding: "6px 12px",
              fontSize: "14px",
              fontWeight: "bold",
              width: "150px",
              textAlign: "center",
            }}
          >
            CHIPS:{" "}
            <span style={{ color: "#FFD700" }}>
              {playerChips.toLocaleString()}
            </span>
          </div>
          <div
            style={{
              backgroundColor: "rgba(155, 89, 182, 0.1)",
              color: "#FFF",
              border: "2px solid #9B59B6",
              borderRadius: "8px",
              padding: "6px 12px",
              fontSize: "14px",
              fontWeight: "bold",
              width: "150px",
              textAlign: "center",
            }}
          >
            SCORE:{" "}
            <span style={{ color: "#9B59B6" }}>
              {currentScore.toLocaleString()}
            </span>
          </div>
          <div
            style={{
              backgroundColor:
                scoreMultiplier > 1.0
                  ? "rgba(76, 175, 80, 0.1)"
                  : "rgba(128, 128, 128, 0.1)",
              color: "#FFF",
              border: `2px solid ${scoreMultiplier > 1.0 ? "#4CAF50" : "#808080"}`,
              borderRadius: "8px",
              padding: "6px 12px",
              fontSize: "14px",
              fontWeight: "bold",
              width: "150px",
              textAlign: "center",
            }}
          >
            MULTIPLIER:{" "}
            <span
              style={{ color: scoreMultiplier > 1.0 ? "#4CAF50" : "#808080" }}
            >
              {scoreMultiplier.toFixed(1)}x
            </span>
          </div>
        </div>

        <div className="flex gap-4 items-center">
          <button
            onClick={() => setShowSettings(true)}
            style={{
              backgroundColor: "rgba(74, 144, 226, 0.2)",
              color: "#FFF",
              border: "2px solid #4A90E2",
              borderRadius: "8px",
              padding: "6px 16px",
              fontSize: "14px",
              fontWeight: "bold",
              cursor: "pointer",
              transition: "all 0.2s ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = "#4A90E2";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = "rgba(74, 144, 226, 0.2)";
            }}
          >
            ⚙️ Settings
          </button>
          <button
            onClick={() => setShowLeaderboard(true)}
            style={{
              backgroundColor: "rgba(155, 89, 182, 0.2)",
              color: "#FFF",
              border: "2px solid #9B59B6",
              borderRadius: "8px",
              padding: "6px 16px",
              fontSize: "14px",
              fontWeight: "bold",
              cursor: "pointer",
              transition: "all 0.2s ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = "#9B59B6";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = "rgba(155, 89, 182, 0.2)";
            }}
          >
            🏆 Leaderboard
          </button>
          <button
            onClick={() => setShowStrategyCard(true)}
            style={{
              backgroundColor: "rgba(255, 215, 0, 0.2)",
              color: "#FFD700",
              border: "2px solid #FFD700",
              borderRadius: "8px",
              padding: "6px 16px",
              fontSize: "14px",
              fontWeight: "bold",
              cursor: "pointer",
              transition: "all 0.2s ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = "#FFD700";
              e.currentTarget.style.color = "#000";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = "rgba(255, 215, 0, 0.2)";
              e.currentTarget.style.color = "#FFD700";
            }}
          >
            📊 Strategy
          </button>
        </div>
      </div>

      {/* Full Viewport Game Table */}
      <div
        style={{
          position: "fixed",
          top: "60px",
          left: 0,
          width: "100vw",
          height: "calc(100vh - 60px)",
          backgroundColor: "rgb(107, 0, 0)",
          overflow: "hidden",
        }}
      >
        {/* Table Background Pattern */}
        <div
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            width: "100%",
            height: "100%",
            opacity: 0.5,
            backgroundImage: "url(/tableBG.webp)",
            backgroundRepeat: "repeat",
            pointerEvents: "none",
            zIndex: 0,
          }}
        />

        {/* Content Container */}
        <div
          style={{
            position: "absolute",
            width: "100%",
            height: "100%",
            top: 0,
            left: 0,
            zIndex: 1,
          }}
        >
          {/* Shoe Component */}
          <Shoe
            numDecks={gameSettings.numberOfDecks}
            cardsDealt={cardsDealt}
            dealerCutCard={calculateCutCardPosition(
              gameSettings.numberOfDecks,
              gameSettings.deckPenetration,
            )}
          />

          {/* Dealer Section - Top Center with Avatar */}
          <div
            style={{
              position: "absolute",
              top: "3%", // Moved up from 8% (approximately 50px higher on typical screens)
              left: "50%",
              transform: "translateX(-50%)",
              textAlign: "center",
              zIndex: 100,
              pointerEvents: "auto",
            }}
          >
            {/* Dealer Avatar - Clickable with Turn Indicator */}
            {currentDealer && (
              <div
                style={{
                  position: "relative",
                  width: "150px",
                  height: "150px",
                  margin: "0 auto 12px",
                }}
              >
                {/* Turn Indicator - active during DEALER_TURN phase */}
                <TurnIndicator isActive={phase === "DEALER_TURN"} />

                {/* Dealer Callout - appears below avatar */}
                {dealerCallout && (
                  <div
                    style={{
                      position: "absolute",
                      top: "calc(100% + 10px)",
                      left: "50%",
                      transform: "translateX(-50%)",
                      backgroundColor: "rgba(0, 0, 0, 0.9)",
                      border: "2px solid #FFD700",
                      borderRadius: "8px",
                      padding: "10px 20px",
                      color: "#FFD700",
                      fontSize: "18px",
                      fontWeight: "bold",
                      textAlign: "center",
                      zIndex: 2000,
                      boxShadow: "0 4px 16px rgba(255, 215, 0, 0.5)",
                      whiteSpace: "nowrap",
                      animation: "fadeInScale 0.3s ease-out",
                    }}
                  >
                    {dealerCallout}
                  </div>
                )}

                <div
                  onClick={() => {
                    setShowDealerInfo(true);
                  }}
                  style={{
                    width: "150px",
                    height: "150px",
                    borderRadius: "50%",
                    border: "4px solid #FFD700",
                    overflow: "hidden",
                    backgroundColor: "#333",
                    cursor: "pointer",
                    transition: "all 0.3s ease",
                    position: "relative",
                    zIndex: 100,
                    pointerEvents: "auto",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = "scale(1.05)";
                    e.currentTarget.style.boxShadow =
                      "0 0 20px rgba(255, 215, 0, 0.6)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = "scale(1)";
                    e.currentTarget.style.boxShadow = "none";
                  }}
                >
                  <img
                    src={getDealerAvatarPath(currentDealer)}
                    alt={currentDealer.name}
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                    }}
                    onError={(e) => {
                      e.currentTarget.style.display = "none";
                      const parent = e.currentTarget.parentElement;
                      if (parent) {
                        parent.innerHTML =
                          '<div style="display:flex;align-items:center;justify-content:center;height:100%;font-size:60px;color:#FFD700">D</div>';
                      }
                    }}
                  />
                </div>
              </div>
            )}
            {/* Dealer Cards - Fixed height container */}
            <div
              style={{
                minHeight: "110px",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "flex-end",
              }}
            >
              {dealerHand.cards.length > 0 && (
                <>
                  <div
                    style={{
                      position: "relative",
                      width: "370px",
                      height: "98px",
                      marginBottom: "4px",
                    }}
                  >
                    {dealerHand.cards.map((card, idx) => (
                      <div
                        key={idx}
                        style={{
                          position: "absolute",
                          left: `${idx * 74}px`, // 70px card + 4px gap
                          top: 0,
                          width: "70px",
                          height: "98px",
                        }}
                      >
                        <PlayingCard
                          card={card}
                          faceDown={!dealerRevealed && idx === 1}
                        />
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Player Spots - Using exact positions from reference project */}
          <div
            style={{
              position: "absolute",
              width: "100%",
              height: "100%",
              top: 0,
              left: 0,
            }}
          >
            {[0, 1, 2, 3, 4, 5, 6, 7].map((seatIndex) => {
              // Positions based on reference project: [left%, top%]
              // Extended to 8 seats with arc pattern - moved down so center seats are near bottom
              const [x, y] = TABLE_POSITIONS[seatIndex];
              // Find if this seat is occupied by an AI player
              const aiPlayer = aiPlayers.find(
                (ai) => ai.position === seatIndex,
              );
              const isPlayerSeat = playerSeat === seatIndex;
              const isEmpty = !aiPlayer && !isPlayerSeat;

              return (
                <div
                  key={seatIndex}
                  style={{
                    position: "absolute",
                    left: `${x}%`,
                    top: `${y}%`,
                    transform: "translate(-50%, 0)",
                    textAlign: "center",
                  }}
                >
                  {/* Empty Seat - Clickable */}
                  {isEmpty && (
                    <div
                      onClick={() => {
                        if (playerSeat === null) {
                          addDebugLog(
                            `=== PLAYER SITTING AT SEAT ${seatIndex} ===`,
                          );
                          addDebugLog(`Phase before sitting: ${phase}`);
                          setPlayerSeat(seatIndex);
                        } else {
                          addDebugLog(
                            `Cannot sit - player already seated at ${playerSeat}`,
                          );
                        }
                      }}
                      style={{
                        width: "150px",
                        height: "150px",
                        borderRadius: "50%",
                        border: "3px solid rgba(255, 215, 0, 0.3)",
                        backgroundColor: "rgba(26, 71, 42, 0.4)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        cursor: playerSeat === null ? "pointer" : "default",
                        transition: "all 0.3s ease",
                        boxShadow: "inset 0 2px 8px rgba(0, 0, 0, 0.4)",
                      }}
                      onMouseEnter={(e) => {
                        if (playerSeat === null) {
                          e.currentTarget.style.border =
                            "3px solid rgba(255, 215, 0, 0.9)";
                          e.currentTarget.style.backgroundColor =
                            "rgba(26, 71, 42, 0.7)";
                          e.currentTarget.style.transform = "scale(1.05)";
                          e.currentTarget.style.boxShadow =
                            "0 0 20px rgba(255, 215, 0, 0.5)";
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (playerSeat === null) {
                          e.currentTarget.style.border =
                            "3px solid rgba(255, 215, 0, 0.3)";
                          e.currentTarget.style.backgroundColor =
                            "rgba(26, 71, 42, 0.4)";
                          e.currentTarget.style.transform = "scale(1)";
                          e.currentTarget.style.boxShadow =
                            "inset 0 2px 8px rgba(0, 0, 0, 0.4)";
                        }
                      }}
                    >
                      <span
                        style={{
                          color: "rgba(255, 215, 0, 0.6)",
                          fontSize: "11px",
                          fontWeight: "bold",
                          letterSpacing: "1px",
                        }}
                      >
                        {playerSeat === null ? "OPEN" : ""}
                      </span>
                    </div>
                  )}

                  {/* AI Player */}
                  {aiPlayer &&
                    (() => {
                      // Find the index of this AI player in the aiPlayers array
                      const aiPlayerIndex = aiPlayers.findIndex(
                        (ai) => ai.position === seatIndex,
                      );

                      return (
                        <div
                          style={{
                            position: "relative",
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "center",
                          }}
                        >
                          {/* Cards positioned absolutely above - fixed positions */}
                          {aiPlayer.hand.cards.length > 0 && (
                            <div
                              style={{
                                position: "absolute",
                                bottom: "calc(100% + 54px)", // 50px higher (was 4px, now 54px above avatar)
                                left: "50%",
                                transform: "translate(-50%, 0)", // Center horizontally, anchor to bottom
                                width: "230px", // 3 cards * 70px + 2 gaps * 4px
                                height: "210px", // Reserve space for 2 rows
                              }}
                            >
                              {/* Render each card in a fixed position - first row at bottom */}
                              {aiPlayer.hand.cards.map((card, cardIdx) => {
                                // Calculate row and column for this card (3 cards per row)
                                const row = Math.floor(cardIdx / 3); // Row 0 = first 3 cards, Row 1 = next 3, etc
                                const col = cardIdx % 3;
                                // Position from bottom: row 0 at bottom, row 1 above it, etc
                                // Fixed positions: left = col * (70px + 4px gap)
                                //                  bottom = row * (98px + 4px gap) - anchor from bottom
                                return (
                                  <div
                                    key={cardIdx}
                                    style={{
                                      position: "absolute",
                                      left: `${col * 74}px`,
                                      bottom: `${row * 102}px`, // Row 0 at bottom, higher rows stack above
                                      width: "70px",
                                      height: "98px",
                                    }}
                                  >
                                    <PlayingCard card={card} />
                                  </div>
                                );
                              })}
                            </div>
                          )}
                          {/* Avatar with indicators */}
                          <div
                            style={{
                              position: "relative",
                              width: "150px",
                              height: "150px",
                              marginBottom: "6px",
                            }}
                          >
                            {/* Turn Indicator */}
                            <TurnIndicator
                              isActive={activePlayerIndex === aiPlayerIndex}
                            />

                            {/* Action Bubble */}
                            {playerActions.has(aiPlayerIndex) && (
                              <ActionBubble
                                action={playerActions.get(aiPlayerIndex)!}
                              />
                            )}

                            <div
                              style={{
                                width: "150px",
                                height: "150px",
                                borderRadius: "50%",
                                border: "4px solid #FFD700",
                                overflow: "hidden",
                                backgroundColor: "#333",
                              }}
                            >
                              <img
                                src={getAIAvatarPath(aiPlayer.character)}
                                alt={aiPlayer.character.name}
                                style={{
                                  width: "100%",
                                  height: "100%",
                                  objectFit: "cover",
                                }}
                                onError={(e) => {
                                  e.currentTarget.style.display = "none";
                                  const parent = e.currentTarget.parentElement;
                                  if (parent) {
                                    parent.innerHTML = `<div style="display:flex;align-items:center;justify-content:center;height:100%;font-size:40px;color:#FFD700">${aiPlayer.character.name.charAt(0)}</div>`;
                                  }
                                }}
                              />
                            </div>
                          </div>
                          {/* Name */}
                          <div
                            className="text-white text-sm"
                            style={{
                              fontWeight: "bold",
                              textShadow: "1px 1px 2px rgba(0,0,0,0.8)",
                            }}
                          >
                            {aiPlayer.character.name.split(" ")[0]}
                          </div>
                        </div>
                      );
                    })()}

                  {/* Human Player */}
                  {isPlayerSeat && (
                    <div
                      style={{
                        position: "relative",
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                      }}
                    >
                      {/* Cards positioned absolutely above - fixed positions */}
                      {playerHand.cards.length > 0 && (
                        <div
                          style={{
                            position: "absolute",
                            bottom: "calc(100% + 54px)", // 50px higher than AI cards (was 4px, now 54px above avatar)
                            left: "50%",
                            transform: "translate(-50%, 0)", // Center horizontally, anchor to bottom
                            width: "230px", // 3 cards * 70px + 2 gaps * 4px
                            height: "210px", // Reserve space for 2 rows
                            zIndex: 100,
                          }}
                        >
                          {/* Render each card in a fixed position - first row at bottom */}
                          {playerHand.cards.map((card, cardIdx) => {
                            // Calculate row and column for this card (3 cards per row)
                            const row = Math.floor(cardIdx / 3); // Row 0 = first 3 cards, Row 1 = next 3, etc
                            const col = cardIdx % 3;
                            // Position from bottom: row 0 at bottom, row 1 above it, etc
                            // Fixed positions: left = col * (70px + 4px gap)
                            //                  bottom = row * (98px + 4px gap) - anchor from bottom
                            return (
                              <div
                                key={cardIdx}
                                style={{
                                  position: "absolute",
                                  left: `${col * 74}px`,
                                  bottom: `${row * 102}px`, // Row 0 at bottom, higher rows stack above
                                  width: "70px",
                                  height: "98px",
                                }}
                              >
                                <PlayingCard card={card} />
                              </div>
                            );
                          })}
                        </div>
                      )}
                      {/* Avatar with indicators */}
                      <div
                        style={{
                          position: "relative",
                          width: "150px",
                          height: "150px",
                          marginBottom: "6px",
                        }}
                      >
                        {/* Turn Indicator - active during PLAYER_TURN phase */}
                        <TurnIndicator isActive={phase === "PLAYER_TURN"} />

                        {/* Action Bubble - shows player actions (HIT, STAND, BUST, BLACKJACK) */}
                        {playerActions.has(-1) && (
                          <ActionBubble action={playerActions.get(-1)!} />
                        )}

                        <div
                          style={{
                            width: "150px",
                            height: "150px",
                            borderRadius: "50%",
                            border: "4px solid #FFD700",
                            backgroundColor: "#1a472a",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: "48px",
                            color: "#FFD700",
                            fontWeight: "bold",
                            boxShadow: "0 0 20px rgba(255, 215, 0, 0.5)",
                          }}
                        >
                          YOU
                        </div>
                      </div>
                      {/* Name */}
                      <div
                        className="text-white text-sm"
                        style={{
                          fontWeight: "bold",
                          textShadow: "1px 1px 2px rgba(0,0,0,0.8)",
                        }}
                      >
                        You
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Action Buttons - Positioned below player spot */}
          {playerSeat !== null && (
            <div
              style={{
                position: "absolute",
                bottom: "180px",
                left: "50%",
                transform: "translateX(-50%)",
              }}
            >
              {/* Actions */}
              {phase === "BETTING" && (
                <div className="flex gap-4 justify-center">
                  <Button
                    size="lg"
                    onPress={startNewRound}
                    style={{
                      backgroundColor: "#4CAF50",
                      color: "white",
                      fontWeight: "bold",
                      fontSize: "16px",
                      padding: "12px 24px",
                    }}
                  >
                    Deal (Bet: ${currentBet})
                  </Button>
                </div>
              )}

              {phase === "PLAYER_TURN" && !isBusted(playerHand.cards) && (
                <div className="flex gap-4 justify-center">
                  <Button
                    size="lg"
                    onPress={hit}
                    style={{
                      backgroundColor: "#4CAF50",
                      color: "white",
                      fontWeight: "bold",
                      fontSize: "16px",
                      padding: "12px 24px",
                    }}
                  >
                    HIT
                  </Button>
                  <Button
                    size="lg"
                    onPress={stand}
                    style={{
                      backgroundColor: "#4CAF50",
                      color: "white",
                      fontWeight: "bold",
                      fontSize: "16px",
                      padding: "12px 24px",
                    }}
                  >
                    STAND
                  </Button>
                </div>
              )}

              {phase === "ROUND_END" && (
                <div className="flex gap-4 justify-center flex-col items-center">
                  <div className="text-white text-xl">
                    {playerHand.result === "WIN" && "You Win!"}
                    {playerHand.result === "LOSE" && "You Lose"}
                    {playerHand.result === "PUSH" && "Push"}
                    {playerHand.result === "BUST" && "Bust!"}
                    {playerHand.result === "BLACKJACK" && "Blackjack!"}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Speech Bubbles */}
          {speechBubbles.map((bubble) => (
            <WinLossBubble
              key={bubble.id}
              position={bubble.position}
              message={bubble.message}
            />
          ))}

          {/* Win/Loss Result Bubbles */}
          {winLossBubbles.map((bubble) => (
            <WinLossBubble
              key={bubble.id}
              position={bubble.position}
              result={bubble.result}
              onComplete={() => {
                setWinLossBubbles((prev) =>
                  prev.filter((b) => b.id !== bubble.id),
                );
              }}
            />
          ))}

          {/* Active Conversation Prompt */}
          {activeConversation && (
            <ConversationPrompt
              speakerId={activeConversation.speakerId}
              speakerName={activeConversation.speakerName}
              question={activeConversation.question}
              choices={activeConversation.choices}
              position={activeConversation.position}
              onResponse={handleConversationResponse}
              onIgnore={handleConversationIgnore}
            />
          )}
        </div>

        {/* Dealer Info Modal */}
        {showDealerInfo && currentDealer && (
          <DealerInfo
            dealer={currentDealer}
            onClose={() => setShowDealerInfo(false)}
            openAsModal={true}
          />
        )}

        {/* Flying Cards Animations */}
        {flyingCards.map((flyingCard) => (
          <FlyingCard
            key={flyingCard.id}
            rank={flyingCard.card.rank}
            suit={flyingCard.card.suit}
            fromPosition={flyingCard.fromPosition}
            toPosition={flyingCard.toPosition}
            onAnimationComplete={() => {
              // Card removal is handled in the dealInitialCards timeout
            }}
          />
        ))}

        {/* CSS Animations */}
        <style jsx global>{`
          @keyframes fadeInScale {
            from {
              opacity: 0;
              transform: translateX(-50%) scale(0.8);
            }
            to {
              opacity: 1;
              transform: translateX(-50%) scale(1);
            }
          }
        `}</style>
      </div>

      {/* Betting Interface - shown during BETTING phase when player is seated */}
      {phase === "BETTING" && initialized && playerSeat !== null && (
        <BettingInterface
          playerChips={playerChips}
          currentBet={currentBet}
          minBet={minBet}
          maxBet={maxBet}
          onBetChange={handleBetChange}
          onConfirmBet={handleConfirmBet}
          onClearBet={handleClearBet}
        />
      )}

      {/* Game Settings Modal */}
      <GameSettingsModal
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
        currentSettings={gameSettings}
        onSave={(newSettings) => {
          setGameSettings({ ...gameSettings, ...newSettings });
          // Note: Changing settings mid-game would require game reset
          // For now, settings only apply to new games
        }}
      />

      {/* Leaderboard Modal */}
      <LeaderboardModal
        isOpen={showLeaderboard}
        onClose={() => setShowLeaderboard(false)}
        currentChips={playerChips}
        peakChips={peakChips}
        longestStreak={longestStreak}
        currentScore={currentScore}
      />

      {/* Basic Strategy Card Modal */}
      <BasicStrategyCard
        isOpen={showStrategyCard}
        onClose={() => setShowStrategyCard(false)}
        settings={gameSettings}
      />

      {/* Debug Log Button - shows when logs exist and hand is finished */}
      {debugLogs.length > 0 && phase === "ROUND_END" && (
        <div
          style={{
            position: "fixed",
            bottom: "20px",
            left: "50%",
            transform: "translateX(-50%)",
            zIndex: 10000,
          }}
        >
          <button
            onClick={() => setShowDebugLog(true)}
            style={{
              backgroundColor: "#FFD700",
              color: "#000",
              border: "none",
              borderRadius: "8px",
              padding: "12px 24px",
              fontSize: "16px",
              fontWeight: "bold",
              cursor: "pointer",
              boxShadow: "0 4px 8px rgba(0, 0, 0, 0.3)",
            }}
          >
            📋 View Debug Log ({debugLogs.length} entries)
          </button>
        </div>
      )}

      {/* Debug Log Modal */}
      {showDebugLog && (
        <>
          <div
            onClick={() => setShowDebugLog(false)}
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: "rgba(0, 0, 0, 0.75)",
              zIndex: 10001,
            }}
          />

          <div
            style={{
              position: "fixed",
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              width: "90%",
              maxWidth: "900px",
              maxHeight: "80vh",
              backgroundColor: "#1a1a1a",
              borderRadius: "16px",
              padding: "24px",
              zIndex: 10002,
              border: "2px solid #FFD700",
            }}
          >
            <div
              style={{
                marginBottom: "20px",
                borderBottom: "2px solid #333",
                paddingBottom: "12px",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <h2
                  style={{
                    fontSize: "24px",
                    fontWeight: "bold",
                    color: "#FFD700",
                    margin: 0,
                  }}
                >
                  Debug Log ({debugLogs.length} entries)
                </h2>
                <button
                  onClick={() => setShowDebugLog(false)}
                  style={{
                    backgroundColor: "transparent",
                    color: "#AAA",
                    border: "none",
                    fontSize: "28px",
                    cursor: "pointer",
                    padding: "0 8px",
                  }}
                >
                  &times;
                </button>
              </div>
            </div>

            <div
              style={{
                maxHeight: "calc(80vh - 180px)",
                overflowY: "auto",
                backgroundColor: "#000",
                padding: "16px",
                borderRadius: "8px",
                fontFamily: "monospace",
                fontSize: "13px",
                color: "#0F0",
              }}
            >
              {debugLogs.map((log, idx) => (
                <div key={idx} style={{ marginBottom: "4px" }}>
                  {log}
                </div>
              ))}
            </div>

            <div
              style={{
                marginTop: "20px",
                display: "flex",
                gap: "12px",
                justifyContent: "center",
              }}
            >
              <button
                onClick={() => {
                  navigator.clipboard.writeText(debugLogs.join("\n"));
                }}
                style={{
                  backgroundColor: "#3B82F6",
                  color: "#FFF",
                  border: "none",
                  borderRadius: "8px",
                  padding: "12px 32px",
                  fontSize: "16px",
                  fontWeight: "bold",
                  cursor: "pointer",
                }}
              >
                Copy Logs
              </button>
              <button
                onClick={clearDebugLogs}
                style={{
                  backgroundColor: "#EF4444",
                  color: "#FFF",
                  border: "none",
                  borderRadius: "8px",
                  padding: "12px 32px",
                  fontSize: "16px",
                  fontWeight: "bold",
                  cursor: "pointer",
                }}
              >
                Clear Log & Continue
              </button>
              <button
                onClick={() => setShowDebugLog(false)}
                style={{
                  backgroundColor: "#6B7280",
                  color: "#FFF",
                  border: "none",
                  borderRadius: "8px",
                  padding: "12px 32px",
                  fontSize: "16px",
                  fontWeight: "bold",
                  cursor: "pointer",
                }}
              >
                Close
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
