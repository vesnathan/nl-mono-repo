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
import { AI_CHARACTERS, AICharacter, getAIAvatarPath } from "@/data/aiCharacters";
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
  const [gameSettings, setGameSettings] = useState<GameSettings>(DEFAULT_GAME_SETTINGS);

  // Game state
  const [shoe, setShoe] = useState<GameCard[]>(() =>
    createAndShuffleShoe(gameSettings.numberOfDecks, gameSettings.countingSystem)
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
  const [currentBet, setCurrentBet] = useState(10);
  const [previousBet, setPreviousBet] = useState(10); // Track previous bet for bet spread detection

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
  const [dealerChangeInterval] = useState(() => Math.floor(Math.random() * 3) + 8); // 8-10 shoes

  // UI state
  const [phase, setPhase] = useState<GamePhase>("BETTING");
  const [suspicionLevel, setSuspicionLevel] = useState(0);
  const [pitBossDistance, setPitBossDistance] = useState(30); // 0-100, higher = closer (more dangerous), start farther away
  const [speechBubbles, setSpeechBubbles] = useState<SpeechBubble[]>([]);
  const [activeConversation, setActiveConversation] = useState<ActiveConversation | null>(null);
  const [playerSociability, setPlayerSociability] = useState(50); // 0-100: how friendly/responsive player has been
  const [handNumber, setHandNumber] = useState(0);
  const [showDealerInfo, setShowDealerInfo] = useState(false);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [initialized, setInitialized] = useState(false);
  const [playerSeat, setPlayerSeat] = useState<number | null>(null); // null means not seated

  // Action bubbles and turn tracking
  const [activePlayerIndex, setActivePlayerIndex] = useState<number | null>(null); // -1 = player, 0+ = AI index
  const [playerActions, setPlayerActions] = useState<Map<number, "HIT" | "STAND" | "DOUBLE" | "SPLIT">>(new Map());
  const [playersFinished, setPlayersFinished] = useState<Set<number>>(new Set()); // Track which AI players have finished

  // Flying card animations
  const [flyingCards, setFlyingCards] = useState<FlyingCardData[]>([]);

  // Dealer callouts
  const [dealerCallout, setDealerCallout] = useState<string | null>(null);

  // Timed challenge mode
  const [timeRemaining, setTimeRemaining] = useState(300); // 5 minutes in seconds
  const [timedChallengeActive, setTimedChallengeActive] = useState(false);

  // Track previous hand states for in-hand reactions
  const prevAIHandsRef = useRef<Map<string, number>>(new Map());

  // Timeout management - store all active timeouts for cleanup
  const timeoutsRef = useRef<Set<NodeJS.Timeout>>(new Set());

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
  const getCardPosition = useCallback((type: "ai" | "player" | "dealer" | "shoe", index?: number, cardIndex?: number) => {
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

    if (type === "shoe") {
      // Shoe is positioned at right: 7%, top: 20px (from the Shoe component positioning)
      // Convert to left position: 100% - 7% = 93%
      return { left: "93%", top: "20px" };
    }

    if (type === "dealer") {
      // Dealer cards are below the dealer avatar
      // Dealer section is at 8%, avatar is 150px + 12px margin = 162px
      // Cards appear below the avatar
      return { left: "50%", top: "calc(8% + 162px)" };
    }

    if (type === "player" && playerSeat !== null) {
      const [x, y] = tablePositions[playerSeat];
      // Cards are positioned above the avatar
      return { left: `${x}%`, top: `calc(${y}% - 190px)` };
    }

    if (type === "ai" && index !== undefined) {
      const aiPlayer = aiPlayers[index];
      if (aiPlayer) {
        const [x, y] = tablePositions[aiPlayer.position];
        // Cards are positioned above the avatar
        return { left: `${x}%`, top: `calc(${y}% - 140px)` };
      }
    }

    // Default fallback
    return { left: "50%", top: "50%" };
  }, [aiPlayers, playerSeat]);

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
    const { card, remainingShoe, reshuffled } = dealCard(shoe, gameSettings.numberOfDecks, gameSettings.countingSystem);

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
  const triggerConversation = useCallback((speakerId: string, speakerName: string, position: number) => {
    // Don't trigger if there's already an active conversation
    if (activeConversation) return;

    const tablePositions = [
      [5, 55],   // Seat 0 - Far left
      [16, 62],  // Seat 1 - Left
      [29, 68],  // Seat 2 - Center-left
      [42, 72],  // Seat 3 - Center
      [56, 72],  // Seat 4 - Center
      [69, 68],  // Seat 5 - Center-right
      [82, 62],  // Seat 6 - Right
      [93, 55],  // Seat 7 - Far right
    ];

    const [x, y] = tablePositions[position] || tablePositions[0];

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
  }, [activeConversation]);

  const addSpeechBubble = useCallback(
    (playerId: string, message: string, position: number) => {
      // Use same positions as player avatars on the table
      const tablePositions = [
        [5, 55],   // Seat 0 - Far left
        [16, 62],  // Seat 1 - Left
        [29, 68],  // Seat 2 - Center-left
        [42, 72],  // Seat 3 - Center
        [56, 72],  // Seat 4 - Center
        [69, 68],  // Seat 5 - Center-right
        [82, 62],  // Seat 6 - Right
        [93, 55],  // Seat 7 - Far right
      ];

      const [x, y] = tablePositions[position] || tablePositions[0];

      const bubble: SpeechBubble = {
        playerId,
        message,
        position: { left: `${x}%`, top: `${y}%` },
        id: playerId, // Use playerId directly as it's already unique per call
      };

      setSpeechBubbles((prev) => [...prev, bubble]);

      registerTimeout(() => {
        setSpeechBubbles((prev) => prev.filter((b) => b.id !== bubble.id));
      }, 4000); // Doubled from 2000ms - speech bubbles stay visible longer
    },
    [registerTimeout],
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
    const sociabilityIntervalMultiplier = Math.max(0.5, 2 - (playerSociability / 50)); // Low sociability = longer waits

    const conversationInterval = setInterval(() => {
      const shouldTrigger = Math.random() < triggerChance;
      if (!shouldTrigger) return;

      // 60% chance it's from an AI player, 40% from dealer
      if (Math.random() < 0.6 && aiPlayers.length > 0) {
        // Pick random AI player
        const randomAI = aiPlayers[Math.floor(Math.random() * aiPlayers.length)];
        triggerConversation(randomAI.character.id, randomAI.character.name, randomAI.position);
      } else if (currentDealer) {
        // Dealer asks a question (use dealer's position - center top)
        const dealerPosition = 3; // Center position for visualization
        triggerConversation("dealer", currentDealer.name, dealerPosition);
      }
    }, (baseInterval + Math.random() * intervalVariation) * sociabilityIntervalMultiplier);

    return () => clearInterval(conversationInterval);
  }, [initialized, playerSeat, activeConversation, aiPlayers, currentDealer, triggerConversation, playerSociability]);

  // AI-to-AI and AI-to-Dealer banter (background conversation)
  useEffect(() => {
    if (!initialized || phase === "BETTING") return;

    const banterInterval = setInterval(() => {
      // 20% chance for background banter every 15-25 seconds
      if (Math.random() < 0.2 && aiPlayers.length >= 2) {
        const randomAI = aiPlayers[Math.floor(Math.random() * aiPlayers.length)];

        // Get some small talk banter
        const message = getDealerPlayerLine(randomAI.character.id, "smallTalk");

        if (message) {
          addSpeechBubble(`ai-banter-${Date.now()}`, message, randomAI.position);
        }
      }
    }, 15000 + Math.random() * 10000); // 15-25 seconds

    return () => clearInterval(banterInterval);
  }, [initialized, phase, aiPlayers, addSpeechBubble]);

  // Pit boss randomly moves around the floor
  useEffect(() => {
    const interval = setInterval(() => {
      setPitBossDistance(prev => {
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
        setPlayerHand({ cards: [], bet: currentBet });
        setDealerHand({ cards: [], bet: 0 });
        setPlayerChips((prev) => prev - currentBet);
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
  }, [initialized, aiPlayers.length, handNumber, phase]);

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
        setPlayerHand({ cards: [], bet: currentBet });
        setDealerHand({ cards: [], bet: 0 });
        setPlayerChips((prev) => prev - currentBet);

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
  }, [initialized, aiPlayers.length, handNumber, phase, currentBet]);

  // Start new round
  const startNewRound = useCallback(() => {
    setPhase("DEALING");
    setDealerRevealed(false);
    setPlayerHand({ cards: [], bet: currentBet });
    setDealerHand({ cards: [], bet: 0 });
    setPlayerChips((prev) => prev - currentBet);
    setSpeechBubbles([]); // Clear any lingering speech bubbles

    // Reset AI hands with random bets
    const updatedAI = aiPlayers.map((ai) => ({
      ...ai,
      hand: { cards: [], bet: Math.floor(Math.random() * 50) + 25 },
    }));
    setAIPlayers(updatedAI);

    // Deal initial cards
    setTimeout(() => dealInitialCards(), 500);
  }, [currentBet, aiPlayers]);

  const dealInitialCards = useCallback(() => {

    // Pre-deal all cards BEFORE animations to ensure uniqueness
    // We need to manually track the shoe state because React batches state updates
    const dealtCards: { type: string; index: number; card: GameCard }[] = [];
    let currentShoe = [...shoe];
    let currentCardsDealt = cardsDealt;
    let currentRunningCount = runningCount;
    let currentShoesDealt = shoesDealt;

    // Helper to deal from the current shoe state
    const dealFromCurrentShoe = () => {
      const { card, remainingShoe, reshuffled } = dealCard(currentShoe, gameSettings.numberOfDecks, gameSettings.countingSystem);

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

    // Sort AI players by position (right to left from dealer's perspective = descending)
    const sortedAIPlayers = [...aiPlayers].sort((a, b) => b.position - a.position);

    // Deal first card to everyone (right to left, dealer last)
    sortedAIPlayers.forEach((ai) => {
      const idx = aiPlayers.indexOf(ai);
      const card = dealFromCurrentShoe();
      dealtCards.push({ type: "ai", index: idx, card });
    });
    if (playerSeat !== null) {
      const card = dealFromCurrentShoe();
      dealtCards.push({ type: "player", index: 0, card });
    }
    const dealerCard1 = dealFromCurrentShoe();
    dealtCards.push({ type: "dealer", index: 0, card: dealerCard1 });

    // Deal second card to everyone (right to left, dealer last)
    sortedAIPlayers.forEach((ai) => {
      const idx = aiPlayers.indexOf(ai);
      const card = dealFromCurrentShoe();
      dealtCards.push({ type: "ai", index: idx, card });
    });
    if (playerSeat !== null) {
      const card = dealFromCurrentShoe();
      dealtCards.push({ type: "player", index: 0, card });
    }
    const dealerCard2 = dealFromCurrentShoe();
    dealtCards.push({ type: "dealer", index: 0, card: dealerCard2 });


    // Update state with final shoe state
    setShoe(currentShoe);
    setCardsDealt(currentCardsDealt);
    setRunningCount(currentRunningCount);
    setShoesDealt(currentShoesDealt);

    // Now animate dealing the pre-dealt cards using managed timeouts
    // Adjust delay based on dealer's dealing speed (higher speed = shorter delay)
    const baseDelayBetweenCards = 500; // Base delay in ms (increased from 300 for better pacing)
    const dealerSpeed = currentDealer?.dealSpeed ?? 1.0;
    const delayBetweenCards = Math.round(baseDelayBetweenCards / dealerSpeed);


    let delay = 0;
    dealtCards.forEach(({ type, index, card }, animIdx) => {
      registerTimeout(() => {

        // Calculate positions for flying animation
        const fromPosition = getCardPosition("shoe");
        const toPosition = type === "ai"
          ? getCardPosition("ai", index)
          : type === "player"
          ? getCardPosition("player")
          : getCardPosition("dealer");

        // Create flying card
        const flyingCardId = `flying-${animIdx}-${Date.now()}`;
        setFlyingCards(prev => [...prev, {
          id: flyingCardId,
          card,
          fromPosition,
          toPosition
        }]);

        // After animation mostly completes, add card to hand (reduced from 800ms to 700ms)
        registerTimeout(() => {
          // Remove flying card
          setFlyingCards(prev => prev.filter(fc => fc.id !== flyingCardId));

          // Add card to appropriate hand
          if (type === "ai") {
            setAIPlayers((prev) => {
              const updated = [...prev];
              // CRITICAL FIX: Don't mutate! Create new array instead of using .push()
              updated[index] = {
                ...updated[index],
                hand: {
                  ...updated[index].hand,
                  cards: [...updated[index].hand.cards, card]
                }
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
        }, 700); // Slightly before animation completes for smoother transition
      }, delay);
      delay += delayBetweenCards;
    });

    // Wait for all cards to finish flying and be added to hands
    // delay = time when last card STARTS flying
    // + 800ms for the last card's animation to complete
    // + 500ms buffer for reactions
    registerTimeout(() => {
      checkForInitialReactions();
      // If player is not seated, skip PLAYER_TURN and go straight to AI_TURNS
      if (playerSeat === null) {
        setPhase("AI_TURNS");
      } else {
        setPhase("PLAYER_TURN");
      }
    }, delay + 800 + 500);
  }, [aiPlayers, shoe, cardsDealt, runningCount, shoesDealt, gameSettings.numberOfDecks, gameSettings.countingSystem, registerTimeout, playerSeat, getCardPosition, currentDealer]);

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
    const card = dealCardFromShoe();

    // Add flying card animation
    const shoePosition = getCardPosition("shoe");
    const playerPosition = getCardPosition("player", undefined, playerHand.cards.length);

    const flyingCard: FlyingCardData = {
      id: `hit-player-${Date.now()}`,
      card,
      fromPosition: shoePosition,
      toPosition: playerPosition,
    };

    setFlyingCards(prev => [...prev, flyingCard]);

    // Add card to hand after animation completes
    setTimeout(() => {
      setPlayerHand((prev) => ({ ...prev, cards: [...prev.cards, card] }));
      setFlyingCards(prev => prev.filter(fc => fc.id !== flyingCard.id));

      const newHandValue = calculateHandValue([...playerHand.cards, card]);
      if (newHandValue > 21) {
        setTimeout(() => setPhase("AI_TURNS"), 500);
      }
    }, 800); // Match FlyingCard animation duration
  }, [playerHand, dealCardFromShoe, getCardPosition]);

  const stand = useCallback(() => {
    setPhase("AI_TURNS");
  }, []);

  // Basic strategy decision - returns true if should HIT, false if should STAND
  const shouldHitBasicStrategy = useCallback((playerCards: GameCard[], dealerUpCard: GameCard): boolean => {
    const playerValue = calculateHandValue(playerCards);
    const dealerValue = dealerUpCard.rank === 'A' ? 11 :
                        ['J', 'Q', 'K'].includes(dealerUpCard.rank) ? 10 :
                        parseInt(dealerUpCard.rank);

    // Check if player has soft hand (Ace counted as 11)
    const hasAce = playerCards.some(card => card.rank === 'A');
    const hardValue = playerCards.reduce((sum, card) => {
      if (card.rank === 'A') return sum + 1;
      if (['J', 'Q', 'K'].includes(card.rank)) return sum + 10;
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
  }, []);

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
    setCurrentScore(prev => prev + pointsWithMultiplier);

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

  // Clear playersFinished when entering AI_TURNS phase
  useEffect(() => {
    if (phase === "AI_TURNS") {
      setPlayersFinished(new Set());
    }
  }, [phase]);

  // AI turns - process one player at a time, allowing multiple hits
  useEffect(() => {
    if (phase === "AI_TURNS" && activePlayerIndex === null) {
      // Create array of players with their indices, sorted by table position (dealer's left to right = player's right to left)
      const playersByPosition = aiPlayers
        .map((ai, idx) => ({ ai, idx, position: ai.position }))
        .sort((a, b) => b.position - a.position); // Reverse sort: highest position (dealer's left) goes first

      // Find the next AI player who needs to act (in table order)
      const nextPlayer = playersByPosition.find(({ ai, idx }) => {
        // Skip if already finished
        if (playersFinished.has(idx)) return false;

        const handValue = calculateHandValue(ai.hand.cards);
        const isBust = isBusted(ai.hand.cards);

        // Player needs to act if they haven't busted and are below 17
        if (handValue < 17 && !isBust) return true;

        // Player at 17+ or bust - they need to show STAND then be marked finished
        return true;
      });

      if (!nextPlayer) {
        // All players finished, move to dealer turn
        registerTimeout(() => setPhase("DEALER_TURN"), 1000);
        return;
      }

      // Process this player's action
      const { ai, idx } = nextPlayer;

      // Calculate hand value first to determine difficulty
      const handValue = calculateHandValue(ai.hand.cards);
      const isBust = isBusted(ai.hand.cards);

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
      const baseDecisionTime = 1500;
      const baseActionDelay = 800;
      const baseActionDisplay = 2000;
      const baseTurnClear = 500;

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
      const basicStrategyDecision = shouldHitBasicStrategy(ai.hand.cards, dealerUpCard);

      // Apply skill level: X% chance to follow basic strategy, (100-X)% chance to use simple "hit on < 17" rule
      const followsBasicStrategy = Math.random() * 100 < ai.character.skillLevel;
      const shouldHit = followsBasicStrategy ? basicStrategyDecision : handValue < 17;

      if (shouldHit && !isBust) {

        // Show HIT action after thinking
        registerTimeout(() => {
          setPlayerActions(prev => new Map(prev).set(idx, "HIT"));
        }, decisionTime);

        // Deal card immediately after showing action with animation
        registerTimeout(() => {
          const card = dealCardFromShoe();

          // Add flying card animation
          const shoePosition = getCardPosition("shoe");
          const aiPosition = getCardPosition("ai", idx, ai.hand.cards.length);

          const flyingCard: FlyingCardData = {
            id: `hit-ai-${idx}-${Date.now()}`,
            card,
            fromPosition: shoePosition,
            toPosition: aiPosition,
          };

          setFlyingCards(prev => [...prev, flyingCard]);

          // Add card to hand after animation completes
          setTimeout(() => {
            setAIPlayers((prev) => {
              const updated = [...prev];
              updated[idx] = {
                ...updated[idx],
                hand: {
                  ...updated[idx].hand,
                  cards: [...updated[idx].hand.cards, card]
                }
              };
              return updated;
            });
            setFlyingCards(prev => prev.filter(fc => fc.id !== flyingCard.id));

            // Check if player busted or reached 21+ after receiving card
            const newHandValue = calculateHandValue([...ai.hand.cards, card]);
            if (newHandValue >= 21 || isBusted([...ai.hand.cards, card])) {
              // Mark player as finished
              setPlayersFinished(prev => new Set(prev).add(idx));
            }
          }, 800); // Match FlyingCard animation duration
        }, decisionTime + 50); // Show action, then immediately deal card

        // Clear action after display (wait for card animation to complete)
        registerTimeout(() => {
          setPlayerActions(prev => {
            const newMap = new Map(prev);
            newMap.delete(idx);
            return newMap;
          });
        }, decisionTime + 50 + 800 + actionDisplay); // thinking + action display + card animation

        // Clear active player to trigger next action
        registerTimeout(() => {
          setActivePlayerIndex(null);
        }, decisionTime + 50 + 800 + actionDisplay + turnClear); // thinking + action display + card animation
      } else {

        // Show STAND action after thinking
        registerTimeout(() => {
          setPlayerActions(prev => new Map(prev).set(idx, "STAND"));
        }, decisionTime);

        // Clear action after display
        registerTimeout(() => {
          setPlayerActions(prev => {
            const newMap = new Map(prev);
            newMap.delete(idx);
            return newMap;
          });
        }, decisionTime + actionDisplay);

        // Mark player as finished and clear active to move to next player
        registerTimeout(() => {
          setPlayersFinished(prev => new Set(prev).add(idx));
          setActivePlayerIndex(null);
        }, decisionTime + actionDisplay + turnClear);
      }
    }
  }, [phase, aiPlayers, dealCardFromShoe, registerTimeout, activePlayerIndex, playersFinished]);

  // Dealer turn
  useEffect(() => {
    if (phase === "DEALER_TURN") {
      setDealerRevealed(true);

      registerTimeout(() => {
        let currentDealerHand = { ...dealerHand };

        // Dealer plays according to rules
        const shouldHit = () => {
          const handValue = calculateHandValue(currentDealerHand.cards);

          // Always hit on 16 or less
          if (handValue < 17) return true;

          // Always stand on 18 or more
          if (handValue >= 18) return false;

          // On 17: depends on soft 17 rule
          if (handValue === 17) {
            // Check if it's a soft 17 (has an Ace counted as 11)
            const hasAce = currentDealerHand.cards.some(card => card.rank === "A");
            const hasMultipleCards = currentDealerHand.cards.length > 2;
            const isSoft = hasAce && hasMultipleCards;

            if (gameSettings.dealerHitsSoft17 && isSoft) {
              return true; // Hit soft 17
            }
            return false; // Stand on hard 17 or stand on all 17s
          }

          return false;
        };

        while (shouldHit() && !isBusted(currentDealerHand.cards)) {
          const card = dealCardFromShoe();
          currentDealerHand.cards.push(card);
          setDealerHand({ ...currentDealerHand });
        }

        // Announce dealer's final hand
        const finalValue = calculateHandValue(currentDealerHand.cards);
        const isBust = isBusted(currentDealerHand.cards);

        if (isBust) {
          setDealerCallout("Dealer busts");
        } else {
          setDealerCallout(`Dealer has ${finalValue}`);
        }

        // Clear callout and move to resolving (increased delay)
        registerTimeout(() => {
          setDealerCallout(null);
          setPhase("RESOLVING");
        }, 3000);
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
      gameSettings.blackjackPayout
    );

    aiPlayers.forEach((ai) => {
      const result = determineHandResult(ai.hand, dealerHand);
      const payout = calculatePayout(ai.hand, result, bjPayoutMultiplier);
      const netGain = payout - ai.hand.bet;
      const handValue = calculateHandValue(ai.hand.cards);
      const dealerValue = calculateHandValue(dealerHand.cards);

      // Determine the specific context
      const isBusted = handValue > 21;
      const isDealerBlackjack = dealerValue === 21 && dealerHand.cards.length === 2;
      const isDealerWin = !isBusted && result === "LOSE";

      let currentContext: "bust" | "dealerBlackjack" | "dealerWin" | "any" = "any";
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
      const validReactions = reactions_pool.filter(reaction =>
        reaction.contexts.includes(currentContext) || reaction.contexts.includes("any")
      );

      // Only add reaction if player decides to react and there are valid messages
      if (validReactions.length > 0 && Math.random() < reactionChance) {
        const selectedReaction = validReactions[Math.floor(Math.random() * validReactions.length)];
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
    const maxReactions = Math.min(reactions.length, Math.random() < 0.5 ? 1 : 2);
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

  // Resolve hands
  useEffect(() => {
    if (phase === "RESOLVING") {
      const playerResult = determineHandResult(playerHand, dealerHand);
      const bjPayoutMultiplier = getBlackjackPayoutMultiplier(
        gameSettings.blackjackPayout
      );
      const playerPayout = calculatePayout(
        playerHand,
        playerResult,
        bjPayoutMultiplier
      );

      setPlayerChips((prev) => prev + playerPayout);
      setPlayerHand((prev) => ({ ...prev, result: playerResult }));

      // Update pit boss distance and suspicion based on player behavior
      if (playerSeat !== null && playerHand.bet > 0) {
        const betVariation = Math.abs(playerHand.bet - previousBet) / previousBet;
        const netGain = playerPayout - playerHand.bet;
        const isBigWin = netGain > playerHand.bet * 1.5; // Win more than 1.5x bet

        // Calculate true count for bet correlation detection
        const decksRemaining = calculateDecksRemaining(gameSettings.numberOfDecks * 52, cardsDealt);
        const trueCount = calculateTrueCount(runningCount, decksRemaining);

        // Determine if bet change correlates with count (sign of counting)
        const betIncreased = playerHand.bet > previousBet;
        const countIsFavorable = trueCount >= 2; // Count of +2 or higher favors player
        const countIsUnfavorable = trueCount <= -1;
        const suspiciousBetting = (betIncreased && countIsFavorable) || (!betIncreased && countIsUnfavorable);

        // Calculate suspicion from bet variation
        let suspicionIncrease = 0;
        if (betVariation > 0.3 && currentDealer) { // 30%+ bet change
          // Base suspicion from bet size change
          const baseSuspicion = betVariation * 15; // Max ~15 for 100% change

          // Multiply by dealer detection skill
          const detectionMultiplier = currentDealer.detectionSkill / 100;

          // If betting correlates with count, it's MORE suspicious
          // If betting goes against count (camouflage), it's LESS suspicious
          const correlationMultiplier = suspiciousBetting ? 1.5 : 0.5;

          // Count extremity multiplier - more extreme counts = more suspicious to vary bet
          const countMultiplier = 1 + (Math.abs(trueCount) * 0.2); // +20% per count point

          suspicionIncrease = baseSuspicion * detectionMultiplier * correlationMultiplier * countMultiplier;
          suspicionIncrease = Math.min(suspicionIncrease, 25); // Cap at 25 points
        }

        // Calculate proximity change
        let proximityChange = 0;

        // Big wins attract attention
        if (isBigWin) {
          proximityChange -= 15; // Pit boss moves closer
        }

        // Large bet variations attract attention
        if (betVariation > 0.5) { // 50%+ bet change
          const variationPenalty = Math.min(betVariation * 20, 20);
          proximityChange -= variationPenalty;
        }

        // Small random drift (pit boss walking around)
        const drift = Math.random() * 10 - 3; // -3 to +7, slightly tends to move away
        proximityChange += drift;

        // Distance affects suspicion multiplier
        setPitBossDistance(prev => {
          const newDistance = Math.max(0, Math.min(100, prev + proximityChange));

          // If pit boss is very close, increase suspicion more
          if (newDistance < 30 && (isBigWin || betVariation > 0.5)) {
            const proximityBonus = isBigWin ? 5 : Math.floor(betVariation * 10);
            suspicionIncrease += proximityBonus;
          }

          return newDistance;
        });

        // Apply suspicion increase
        if (suspicionIncrease > 0) {
          setSuspicionLevel(s => Math.min(100, s + suspicionIncrease));
        }

        // Update previous bet for next hand
        setPreviousBet(playerHand.bet);
      }

      // Dealer announces payouts for winning hands
      const dealerValue = calculateHandValue(dealerHand.cards);
      const dealerBusted = isBusted(dealerHand.cards);

      // Determine what to announce
      let callout = "";
      if (dealerBusted) {
        // If dealer busted, paying all non-busted hands
        callout = "Paying all hands";
      } else {
        // Count winning hands (including blackjacks and beats)
        let winningCount = 0;
        let maxWinningValue = 0;

        // Check player hand if seated
        if (playerSeat !== null && !isBusted(playerHand.cards)) {
          const playerValue = calculateHandValue(playerHand.cards);
          if (playerResult === "BLACKJACK" || playerResult === "WIN") {
            winningCount++;
            maxWinningValue = Math.max(maxWinningValue, playerValue);
          }
        }

        // Check AI hands
        aiPlayers.forEach(ai => {
          if (!isBusted(ai.hand.cards)) {
            const result = determineHandResult(ai.hand, dealerHand);
            if (result === "BLACKJACK" || result === "WIN") {
              winningCount++;
              const aiValue = calculateHandValue(ai.hand.cards);
              maxWinningValue = Math.max(maxWinningValue, aiValue);
            }
          }
        });

        if (winningCount > 0) {
          callout = `Paying ${maxWinningValue}`;
        } else {
          callout = "Dealer wins";
        }
      }

      setDealerCallout(callout);

      // Show end-of-hand reactions
      showEndOfHandReactions();

      registerTimeout(() => {
        setDealerCallout(null);
        setPhase("ROUND_END");
      }, 3500);
    }
  }, [phase, playerHand, dealerHand, gameSettings, aiPlayers, playerSeat, registerTimeout, showEndOfHandReactions]);

  const handleConversationResponse = useCallback((choiceIndex: number) => {
    if (!activeConversation) return;

    const choice = activeConversation.choices[choiceIndex];

    // Apply suspicion change
    if (choice.suspicionChange !== 0) {
      setSuspicionLevel(prev => Math.max(0, Math.min(100, prev + choice.suspicionChange)));
    }

    // Adjust sociability based on response type
    if (choiceIndex === 0) {
      // Friendly response - people want to talk to you more
      setPlayerSociability(prev => Math.min(100, prev + 3));
    } else if (choiceIndex === 1) {
      // Neutral - small increase
      setPlayerSociability(prev => Math.min(100, prev + 1));
    } else if (choiceIndex === 2) {
      // Dismissive response - people talk to you less
      setPlayerSociability(prev => Math.max(0, prev - 5));
    }

    // Show speech bubble with player's response
    if (playerSeat !== null) {
      addSpeechBubble(
        "player-response",
        choice.text,
        playerSeat
      );
    }

    // Clear the conversation
    setActiveConversation(null);
  }, [activeConversation, playerSeat, addSpeechBubble]);

  const handleConversationIgnore = useCallback(() => {
    if (!activeConversation) return;

    // Ignoring conversations raises suspicion significantly
    setSuspicionLevel(prev => Math.min(100, prev + 8));

    // Being unresponsive makes people avoid you
    setPlayerSociability(prev => Math.max(0, prev - 8));

    // Show that player is too focused (suspicious)
    if (playerSeat !== null) {
      addSpeechBubble(
        "player-ignore",
        "*concentrating intensely*",
        playerSeat
      );
    }

    setActiveConversation(null);
  }, [activeConversation, playerSeat, addSpeechBubble]);

  // Next hand
  const nextHand = useCallback(() => {
    setHandNumber((prev) => prev + 1);
    setPhase("BETTING");
    setSpeechBubbles([]); // Clear speech bubbles from previous hand
  }, []);

  // Round end - automatically progress to next hand
  useEffect(() => {
    if (phase === "ROUND_END") {

      registerTimeout(() => {

        // Check if we need to reshuffle (cut card reached)
        const totalCards = gameSettings.numberOfDecks * 52;
        const cutCardPosition = calculateCutCardPosition(
          gameSettings.numberOfDecks,
          gameSettings.deckPenetration
        );
        const cardsUntilCutCard = totalCards - cutCardPosition;

        if (cardsDealt >= cardsUntilCutCard) {

          // Reshuffle the shoe
          const newShoe = createAndShuffleShoe(gameSettings.numberOfDecks, gameSettings.countingSystem);
          setShoe(newShoe);
          setCardsDealt(0);
          setRunningCount(0);
          setShoesDealt(prev => prev + 1);

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
  }, [phase, cardsDealt, gameSettings.numberOfDecks, gameSettings.deckPenetration, nextHand, registerTimeout]);

  // Pit boss wandering - they move around the casino floor, influenced by suspicion
  useEffect(() => {
    const wanderInterval = setInterval(() => {
      setPitBossDistance(prev => {
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

  const decksRemaining = calculateDecksRemaining(gameSettings.numberOfDecks * 52, cardsDealt);
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
      <SuspicionMeter level={suspicionLevel} pitBossDistance={pitBossDistance} />

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
        <div className="flex gap-6 items-center">
          {gameSettings.trainingMode === TrainingMode.PRACTICE && (
            <div className="text-white font-bold" style={{ fontSize: "16px" }}>
              COUNT: <span style={{ color: "#FFD700" }}>{runningCount}</span>
            </div>
          )}
          {gameSettings.trainingMode === TrainingMode.TEST && (
            <div className="text-white font-bold" style={{ fontSize: "16px", color: "#FF6B6B" }}>
              🧪 TEST MODE
            </div>
          )}
          {gameSettings.trainingMode === TrainingMode.TIMED_CHALLENGE && (
            <>
              <div className="text-white font-bold" style={{ fontSize: "16px" }}>
                COUNT: <span style={{ color: "#FFD700" }}>{runningCount}</span>
              </div>
              <div className="text-white font-bold" style={{ fontSize: "16px" }}>
                ⏱️ TIME: <span style={{
                  color: timeRemaining < 60 ? "#FF6B6B" : timeRemaining < 180 ? "#FFD700" : "#4CAF50"
                }}>
                  {Math.floor(timeRemaining / 60)}:{String(timeRemaining % 60).padStart(2, '0')}
                </span>
              </div>
            </>
          )}
          <div className="text-white text-sm">
            STREAK: <span style={{ color: currentStreak > 0 ? "#4CAF50" : "#FFF" }}>{currentStreak}</span> |
            CHIPS: <span style={{ color: "#FFD700" }}>{playerChips}</span> |
            SCORE: <span style={{ color: "#9B59B6" }}>{currentScore.toLocaleString()}</span>
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
          <div className="text-white text-sm">
            TC: {trueCount} | Decks: {decksRemaining.toFixed(1)}
          </div>
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
            dealerCutCard={calculateCutCardPosition(gameSettings.numberOfDecks, gameSettings.deckPenetration)}
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
                    e.currentTarget.style.boxShadow = "0 0 20px rgba(255, 215, 0, 0.6)";
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
                        parent.innerHTML = '<div style="display:flex;align-items:center;justify-content:center;height:100%;font-size:60px;color:#FFD700">D</div>';
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
                  <div style={{ position: "relative", width: "370px", height: "98px", marginBottom: "4px" }}>
                    {dealerHand.cards.map((card, idx) => (
                      <div
                        key={idx}
                        style={{
                          position: "absolute",
                          left: `${idx * 74}px`, // 70px card + 4px gap
                          top: 0,
                          width: "70px",
                          height: "98px"
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

              const [x, y] = tablePositions[seatIndex];
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
                      onClick={() =>
                        playerSeat === null && setPlayerSeat(seatIndex)
                      }
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
                  {aiPlayer && (() => {
                    // Find the index of this AI player in the aiPlayers array
                    const aiPlayerIndex = aiPlayers.findIndex(ai => ai.position === seatIndex);

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
                          <TurnIndicator isActive={activePlayerIndex === aiPlayerIndex} />

                          {/* Action Bubble */}
                          {playerActions.has(aiPlayerIndex) && (
                            <ActionBubble action={playerActions.get(aiPlayerIndex)!} />
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

                        {/* Action Bubble - could be added here for player actions if needed */}

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

      {/* Game Settings Modal */}
      <GameSettingsModal
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
        currentSettings={gameSettings}
        onSave={(newSettings) => {
          setGameSettings({...gameSettings, ...newSettings});
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
    </div>
  );
}
