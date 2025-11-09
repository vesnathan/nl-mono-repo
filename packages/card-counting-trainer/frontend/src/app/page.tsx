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
} from "@/types/gameSettings";
import { AI_CHARACTERS, AICharacter, getAIAvatarPath } from "@/data/aiCharacters";
import {
  DEALER_CHARACTERS,
  DealerCharacter,
  getRandomDealer,
  getDealerAvatarPath,
} from "@/data/dealerCharacters";
import { getInitialHandReaction, getHitReaction } from "@/data/inHandReactions";
import FlyingCard from "@/components/FlyingCard";
import WinLossBubble from "@/components/WinLossBubble";
import SuspicionMeter from "@/components/SuspicionMeter";
import DealerInfo from "@/components/DealerInfo";
import TableOverlay from "@/components/TableOverlay";
import Shoe from "@/components/Shoe";
import PlayingCard from "@/components/PlayingCard";
import ActionBubble from "@/components/ActionBubble";
import TurnIndicator from "@/components/TurnIndicator";

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
  const [gameSettings] = useState<GameSettings>(DEFAULT_GAME_SETTINGS);

  // Game state
  const [numDecks] = useState(gameSettings.numberOfDecks);
  const [shoe, setShoe] = useState<GameCard[]>(() =>
    createAndShuffleShoe(gameSettings.numberOfDecks)
  );
  const [cardsDealt, setCardsDealt] = useState(0);
  const [runningCount, setRunningCount] = useState(0);
  const [shoesDealt, setShoesDealt] = useState(0);
  const [cutCardPosition] = useState(() =>
    calculateCutCardPosition(
      gameSettings.numberOfDecks,
      gameSettings.deckPenetration
    )
  );

  // Player state
  const [playerChips, setPlayerChips] = useState(1000);
  const [playerHand, setPlayerHand] = useState<PlayerHand>({
    cards: [],
    bet: 0,
  });
  const [currentBet, setCurrentBet] = useState(10);
  const [previousBet, setPreviousBet] = useState(10); // Track previous bet for bet spread detection

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
  const [pitBossDistance, setPitBossDistance] = useState(70); // 0-100, higher = farther away (safer)
  const [speechBubbles, setSpeechBubbles] = useState<SpeechBubble[]>([]);
  const [handNumber, setHandNumber] = useState(0);
  const [showDealerInfo, setShowDealerInfo] = useState(false);
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
      // Dealer cards are at top center, above the dealer avatar
      // Cards start at 10% and are positioned marginBottom: 4px above avatar
      // Approximate the card area position
      return { left: "50%", top: "8%" };
    }

    if (type === "player" && playerSeat !== null) {
      const [x, y] = tablePositions[playerSeat];
      // Cards are positioned calc(100% + 4px) above the avatar
      // Approximate by reducing y by ~12% (avatar height + gap)
      return { left: `${x}%`, top: `calc(${y}% - 120px)` };
    }

    if (type === "ai" && index !== undefined) {
      const aiPlayer = aiPlayers[index];
      if (aiPlayer) {
        const [x, y] = tablePositions[aiPlayer.position];
        // Cards are positioned calc(100% + 4px) above the avatar
        // Approximate by reducing y by ~12% (avatar height + gap)
        return { left: `${x}%`, top: `calc(${y}% - 120px)` };
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
    const { card, remainingShoe, reshuffled } = dealCard(shoe, numDecks);

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
  }, [shoe, numDecks]);

  // Change dealer every 8-10 shoes
  useEffect(() => {
    if (shoesDealt > 0 && shoesDealt % dealerChangeInterval === 0) {
      const newDealer = getRandomDealer(
        currentDealer ? [currentDealer.id] : [],
      );
      setCurrentDealer(newDealer);
    }
  }, [shoesDealt, dealerChangeInterval, currentDealer]);

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
    console.log("🎴 Starting dealInitialCards");
    console.log("  AI Players:", aiPlayers.length, aiPlayers.map(ai => ({ pos: ai.position, name: ai.character.name })));
    console.log("  Player Seat:", playerSeat);

    // Pre-deal all cards BEFORE animations to ensure uniqueness
    // We need to manually track the shoe state because React batches state updates
    const dealtCards: { type: string; index: number; card: GameCard }[] = [];
    let currentShoe = [...shoe];
    let currentCardsDealt = cardsDealt;
    let currentRunningCount = runningCount;
    let currentShoesDealt = shoesDealt;

    // Helper to deal from the current shoe state
    const dealFromCurrentShoe = () => {
      const { card, remainingShoe, reshuffled } = dealCard(currentShoe, numDecks);

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

      console.log(`  📤 Dealt: ${card.rank}${card.suit}`);
      return card;
    };

    // Sort AI players by position (right to left from dealer's perspective = descending)
    const sortedAIPlayers = [...aiPlayers].sort((a, b) => b.position - a.position);
    console.log("  Sorted AI order:", sortedAIPlayers.map(ai => `${ai.character.name} (pos ${ai.position})`));

    console.log("🎴 ROUND 1 - First card to everyone:");
    // Deal first card to everyone (right to left, dealer last)
    sortedAIPlayers.forEach((ai) => {
      const idx = aiPlayers.indexOf(ai);
      const card = dealFromCurrentShoe();
      console.log(`    → AI[${idx}] ${ai.character.name} (pos ${ai.position}): ${card.rank}${card.suit}`);
      dealtCards.push({ type: "ai", index: idx, card });
    });
    if (playerSeat !== null) {
      const card = dealFromCurrentShoe();
      console.log(`    → PLAYER: ${card.rank}${card.suit}`);
      dealtCards.push({ type: "player", index: 0, card });
    }
    const dealerCard1 = dealFromCurrentShoe();
    console.log(`    → DEALER: ${dealerCard1.rank}${dealerCard1.suit}`);
    dealtCards.push({ type: "dealer", index: 0, card: dealerCard1 });

    console.log("🎴 ROUND 2 - Second card to everyone:");
    // Deal second card to everyone (right to left, dealer last)
    sortedAIPlayers.forEach((ai) => {
      const idx = aiPlayers.indexOf(ai);
      const card = dealFromCurrentShoe();
      console.log(`    → AI[${idx}] ${ai.character.name} (pos ${ai.position}): ${card.rank}${card.suit}`);
      dealtCards.push({ type: "ai", index: idx, card });
    });
    if (playerSeat !== null) {
      const card = dealFromCurrentShoe();
      console.log(`    → PLAYER: ${card.rank}${card.suit}`);
      dealtCards.push({ type: "player", index: 0, card });
    }
    const dealerCard2 = dealFromCurrentShoe();
    console.log(`    → DEALER: ${dealerCard2.rank}${dealerCard2.suit}`);
    dealtCards.push({ type: "dealer", index: 0, card: dealerCard2 });

    console.log("🎴 Total cards dealt:", dealtCards.length);
    console.log("🎴 Card summary:", dealtCards.map(c => `${c.type}[${c.index}]: ${c.card.rank}${c.card.suit}`));

    // Update state with final shoe state
    setShoe(currentShoe);
    setCardsDealt(currentCardsDealt);
    setRunningCount(currentRunningCount);
    setShoesDealt(currentShoesDealt);

    // Now animate dealing the pre-dealt cards using managed timeouts
    // Adjust delay based on dealer's dealing speed (higher speed = shorter delay)
    const baseDelayBetweenCards = 300; // Base delay in ms
    const dealerSpeed = currentDealer?.dealSpeed ?? 1.0;
    const delayBetweenCards = Math.round(baseDelayBetweenCards / dealerSpeed);

    console.log("🎬 Starting card animations...");
    console.log(`  Dealer: ${currentDealer?.name}, Speed: ${dealerSpeed}, Delay between cards: ${delayBetweenCards}ms`);

    let delay = 0;
    dealtCards.forEach(({ type, index, card }, animIdx) => {
      registerTimeout(() => {
        console.log(`  🎬 [${animIdx}] Flying ${type}[${index}]: ${card.rank}${card.suit} (delay: ${delay}ms)`);

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

        // After animation completes (800ms per FlyingCard component), add card to hand
        registerTimeout(() => {
          // Remove flying card
          setFlyingCards(prev => prev.filter(fc => fc.id !== flyingCardId));

          // Add card to appropriate hand
          if (type === "ai") {
            setAIPlayers((prev) => {
              const updated = [...prev];
              console.log(`    Before: AI[${index}] has ${updated[index].hand.cards.length} cards`);
              // CRITICAL FIX: Don't mutate! Create new array instead of using .push()
              updated[index] = {
                ...updated[index],
                hand: {
                  ...updated[index].hand,
                  cards: [...updated[index].hand.cards, card]
                }
              };
              console.log(`    After: AI[${index}] has ${updated[index].hand.cards.length} cards:`, updated[index].hand.cards.map(c => `${c.rank}${c.suit}`));
              return updated;
            });
          } else if (type === "player") {
            setPlayerHand((prev) => {
              console.log(`    Before: Player has ${prev.cards.length} cards`);
              const newHand = { ...prev, cards: [...prev.cards, card] };
              console.log(`    After: Player has ${newHand.cards.length} cards:`, newHand.cards.map(c => `${c.rank}${c.suit}`));
              return newHand;
            });
          } else if (type === "dealer") {
            setDealerHand((prev) => {
              console.log(`    Before: Dealer has ${prev.cards.length} cards`);
              const newHand = { ...prev, cards: [...prev.cards, card] };
              console.log(`    After: Dealer has ${newHand.cards.length} cards:`, newHand.cards.map(c => `${c.rank}${c.suit}`));
              return newHand;
            });
          }
        }, 800); // FlyingCard animation duration
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
        console.log("🎮 Player not seated, skipping to AI_TURNS");
        setPhase("AI_TURNS");
      } else {
        console.log("🎮 Player seated, going to PLAYER_TURN");
        setPhase("PLAYER_TURN");
      }
    }, delay + 800 + 500);
  }, [aiPlayers, shoe, cardsDealt, runningCount, shoesDealt, numDecks, registerTimeout, playerSeat, getCardPosition, currentDealer]);

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
    setPlayerHand((prev) => ({ ...prev, cards: [...prev.cards, card] }));

    const newHandValue = calculateHandValue([...playerHand.cards, card]);
    if (newHandValue > 21) {
      setTimeout(() => setPhase("AI_TURNS"), 500);
    }
  }, [playerHand, dealCardFromShoe]);

  const stand = useCallback(() => {
    setPhase("AI_TURNS");
  }, []);

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
        console.log("✅ All AI players done, moving to DEALER_TURN");
        registerTimeout(() => setPhase("DEALER_TURN"), 1000);
        return;
      }

      // Process this player's action
      const { ai, idx } = nextPlayer;
      console.log(`\n🎮 Processing AI[${idx}] ${ai.character.name} at position ${ai.position}`);

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

      console.log(`  Hand: ${handValue}, Speed: ${playSpeed}, Difficulty: ${handDifficultyMultiplier.toFixed(1)}`);
      console.log(`  Timing: decision=${decisionTime}ms, action=${actionDelay}ms, display=${actionDisplay}ms`);

      // Set active player immediately
      setActivePlayerIndex(idx);

      // Decide: HIT or STAND?
      if (handValue < 17 && !isBust) {
        console.log(`  → Action: HIT`);

        // Show HIT action
        registerTimeout(() => {
          setPlayerActions(prev => new Map(prev).set(idx, "HIT"));
        }, 0);

        // Deal card after decision time
        registerTimeout(() => {
          const card = dealCardFromShoe();
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
        }, decisionTime);

        // Clear action after display
        registerTimeout(() => {
          setPlayerActions(prev => {
            const newMap = new Map(prev);
            newMap.delete(idx);
            return newMap;
          });
        }, decisionTime + actionDisplay);

        // Clear active player to trigger next action
        registerTimeout(() => {
          console.log(`  ⏹️ Clearing active player for next action`);
          setActivePlayerIndex(null);
        }, decisionTime + actionDisplay + turnClear);
      } else {
        console.log(`  → Action: STAND (handValue=${handValue}, bust=${isBust})`);

        // Show STAND action
        registerTimeout(() => {
          setPlayerActions(prev => new Map(prev).set(idx, "STAND"));
        }, 0);

        // Clear action after display
        registerTimeout(() => {
          setPlayerActions(prev => {
            const newMap = new Map(prev);
            newMap.delete(idx);
            return newMap;
          });
        }, actionDisplay);

        // Mark player as finished and clear active to move to next player
        registerTimeout(() => {
          console.log(`  ✅ Player ${idx} finished`);
          setPlayersFinished(prev => new Set(prev).add(idx));
          setActivePlayerIndex(null);
        }, actionDisplay + turnClear);
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

      // Update pit boss distance based on player behavior
      if (playerSeat !== null && playerHand.bet > 0) {
        const betVariation = Math.abs(playerHand.bet - previousBet) / previousBet;
        const netGain = playerPayout - playerHand.bet;
        const isBigWin = netGain > playerHand.bet * 1.5; // Win more than 1.5x bet

        // Calculate proximity change
        let proximityChange = 0;

        // Big wins attract attention
        if (isBigWin) {
          proximityChange -= 15; // Pit boss moves closer
          console.log("💰 Big win! Pit boss attention +15");
        }

        // Large bet variations attract attention
        if (betVariation > 0.5) { // 50%+ bet change
          const variationPenalty = Math.min(betVariation * 20, 20);
          proximityChange -= variationPenalty;
          console.log(`📊 Large bet variation (${(betVariation * 100).toFixed(0)}%)! Pit boss attention +${variationPenalty.toFixed(0)}`);
        }

        // Small random drift (pit boss walking around)
        const drift = Math.random() * 10 - 3; // -3 to +7, slightly tends to move away
        proximityChange += drift;

        // Distance affects suspicion multiplier
        setPitBossDistance(prev => {
          const newDistance = Math.max(0, Math.min(100, prev + proximityChange));

          // If pit boss is very close, increase suspicion more
          if (newDistance < 30 && (isBigWin || betVariation > 0.5)) {
            const suspicionIncrease = isBigWin ? 5 : Math.floor(betVariation * 10);
            setSuspicionLevel(s => Math.min(100, s + suspicionIncrease));
            console.log(`⚠️ Pit boss is close! Extra suspicion +${suspicionIncrease}`);
          }

          return newDistance;
        });

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
  }, [phase, playerHand, dealerHand, gameSettings, aiPlayers, playerSeat, registerTimeout]);

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
        id: `${playerId}-${Date.now()}`,
      };

      setSpeechBubbles((prev) => [...prev, bubble]);

      registerTimeout(() => {
        setSpeechBubbles((prev) => prev.filter((b) => b.id !== bubble.id));
      }, 2000); // Match WinLossBubble duration
    },
    [registerTimeout],
  );

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

      let outcomeType = "push";
      let messages: string[] = [];
      let reactionChance = 0;

      if (result === "BLACKJACK") {
        outcomeType = "bigWin";
        messages = ai.character.reactions.bigWin;
        reactionChance = 0.8; // Very likely to react to blackjack
      } else if (netGain > ai.hand.bet * 0.5) {
        outcomeType = "bigWin";
        messages = ai.character.reactions.bigWin;
        reactionChance = 0.7; // Likely to react to big win
      } else if (netGain > 0) {
        outcomeType = "smallWin";
        messages = ai.character.reactions.smallWin;
        reactionChance = 0.3; // Sometimes react to small win
      } else if (netGain === 0) {
        outcomeType = "push";
        messages = ai.character.reactions.push;
        reactionChance = 0.1; // Rarely react to push
      } else if (result === "BUST" || netGain < -ai.hand.bet * 0.5) {
        outcomeType = "bigLoss";
        messages = ai.character.reactions.bigLoss;
        reactionChance = 0.7; // Likely to react to big loss
      } else {
        outcomeType = "smallLoss";
        messages = ai.character.reactions.smallLoss;
        reactionChance = 0.3; // Sometimes react to small loss
      }

      // Only add reaction if player decides to react
      if (Math.random() < reactionChance) {
        const message = messages[Math.floor(Math.random() * messages.length)];
        reactions.push({
          playerId: ai.character.id,
          message,
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

    console.log(`💬 Showing ${selectedReactions.length} end-of-hand reactions out of ${reactions.length} possible`);

    selectedReactions.forEach((reaction, idx) => {
      registerTimeout(() => {
        addSpeechBubble(
          reaction.playerId,
          reaction.message,
          reaction.position,
        );
      }, idx * 800); // Slightly stagger multiple reactions
    });
  }, [aiPlayers, dealerHand, gameSettings, registerTimeout, addSpeechBubble]);

  // Next hand
  const nextHand = useCallback(() => {
    console.log("🆕 nextHand() called - starting new hand");
    setHandNumber((prev) => prev + 1);
    setPhase("BETTING");
    setSpeechBubbles([]); // Clear speech bubbles from previous hand
  }, []);

  // Round end - automatically progress to next hand
  useEffect(() => {
    if (phase === "ROUND_END") {
      console.log("🎯 ROUND_END phase reached - scheduling auto-progression in 4 seconds");

      registerTimeout(() => {
        console.log("⏰ Auto-progression timer fired");

        // Check if we need to reshuffle (cut card reached)
        const totalCards = numDecks * 52;
        const cardsUntilCutCard = totalCards - cutCardPosition;

        if (cardsDealt >= cardsUntilCutCard) {
          console.log("🔄 Cut card reached! Reshuffling shoe...");
          console.log(`  Cards dealt: ${cardsDealt}, Cut card at: ${cardsUntilCutCard}`);

          // Reshuffle the shoe
          const newShoe = createAndShuffleShoe(numDecks);
          setShoe(newShoe);
          setCardsDealt(0);
          setRunningCount(0);
          setShoesDealt(prev => prev + 1);

          // Show reshuffle message
          setDealerCallout("Shuffling new shoe...");
          registerTimeout(() => {
            setDealerCallout(null);
            console.log("📞 Calling nextHand() after reshuffle");
            nextHand();
          }, 3000);
        } else {
          // No reshuffle needed, just continue to next hand
          console.log("📞 Calling nextHand() directly (no reshuffle needed)");
          nextHand();
        }
      }, 4000); // Show results for 4 seconds before continuing
    }
  }, [phase, cardsDealt, numDecks, cutCardPosition, nextHand, registerTimeout]);

  const decksRemaining = calculateDecksRemaining(numDecks * 52, cardsDealt);
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
          <div className="text-white font-bold" style={{ fontSize: "16px" }}>
            COUNT: <span style={{ color: "#FFD700" }}>{runningCount}</span>
          </div>
          <div className="text-white text-sm">
            STREAK: 0 | CHIPS: {playerChips} | SCORE: 0
          </div>
        </div>

        <div className="text-white text-sm">
          TC: {trueCount} | Decks: {decksRemaining.toFixed(1)}
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
            numDecks={numDecks}
            cardsDealt={cardsDealt}
            dealerCutCard={Math.floor(numDecks * 52 * 0.75)}
          />

          {/* Dealer Section - Top Center with Avatar */}
          <div
            style={{
              position: "absolute",
              top: "8%",
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
                    console.log("Dealer avatar clicked!");
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
                              bottom: "calc(100% + 4px)", // Just 4px above the avatar
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
                            bottom: "calc(100% + 4px)", // Just 4px above the avatar
                            left: "50%",
                            transform: "translate(-50%, 0)", // Center horizontally, anchor to bottom
                            width: "230px", // 3 cards * 70px + 2 gaps * 4px
                            height: "210px", // Reserve space for 2 rows
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
    </div>
  );
}
