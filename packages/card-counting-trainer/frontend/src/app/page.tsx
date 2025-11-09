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
  const [speechBubbles, setSpeechBubbles] = useState<SpeechBubble[]>([]);
  const [handNumber, setHandNumber] = useState(0);
  const [showDealerInfo, setShowDealerInfo] = useState(false);
  const [initialized, setInitialized] = useState(false);
  const [playerSeat, setPlayerSeat] = useState<number | null>(null); // null means not seated

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

      return card;
    };

    // First card to everyone (round 1)
    aiPlayers.forEach((_, idx) => {
      dealtCards.push({ type: "ai", index: idx, card: dealFromCurrentShoe() });
    });
    dealtCards.push({ type: "player", index: 0, card: dealFromCurrentShoe() });
    dealtCards.push({ type: "dealer", index: 0, card: dealFromCurrentShoe() });

    // Second card to everyone (round 2)
    aiPlayers.forEach((_, idx) => {
      dealtCards.push({ type: "ai", index: idx, card: dealFromCurrentShoe() });
    });
    dealtCards.push({ type: "player", index: 0, card: dealFromCurrentShoe() });
    dealtCards.push({ type: "dealer", index: 0, card: dealFromCurrentShoe() });

    // Update state with final shoe state
    setShoe(currentShoe);
    setCardsDealt(currentCardsDealt);
    setRunningCount(currentRunningCount);
    setShoesDealt(currentShoesDealt);

    // Now animate dealing the pre-dealt cards using managed timeouts
    let delay = 0;
    dealtCards.forEach(({ type, index, card }) => {
      registerTimeout(() => {
        if (type === "ai") {
          setAIPlayers((prev) => {
            const updated = [...prev];
            updated[index].hand.cards.push(card);
            return updated;
          });
        } else if (type === "player") {
          setPlayerHand((prev) => ({ ...prev, cards: [...prev.cards, card] }));
        } else if (type === "dealer") {
          setDealerHand((prev) => ({ ...prev, cards: [...prev.cards, card] }));
        }
      }, delay);
      delay += 300;
    });

    registerTimeout(() => {
      checkForInitialReactions();
      setPhase("PLAYER_TURN");
    }, delay + 500);
  }, [aiPlayers, shoe, cardsDealt, runningCount, shoesDealt, numDecks, registerTimeout]);

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

  // AI turns (simplified for now)
  useEffect(() => {
    if (phase === "AI_TURNS") {
      let delay = 0;
      aiPlayers.forEach((ai, idx) => {
        setTimeout(() => {
          const handValue = calculateHandValue(ai.hand.cards);
          if (handValue < 17 && !isBusted(ai.hand.cards)) {
            const card = dealCardFromShoe();
            setAIPlayers((prev) => {
              const updated = [...prev];
              updated[idx].hand.cards.push(card);

              // Check for hit reaction
              const newHandValue = calculateHandValue(updated[idx].hand.cards);
              const oldHandValue = calculateHandValue(ai.hand.cards);
              const reaction = getHitReaction(
                ai.character,
                card.rank,
                oldHandValue,
                newHandValue,
              );

              if (reaction && Math.random() < 0.3) {
                setTimeout(
                  () => addSpeechBubble(ai.character.id, reaction, ai.position),
                  200,
                );
              }

              return updated;
            });
          }
        }, delay);
        delay += 800;
      });

      setTimeout(() => setPhase("DEALER_TURN"), delay + 500);
    }
  }, [phase, aiPlayers, dealCardFromShoe]);

  // Dealer turn
  useEffect(() => {
    if (phase === "DEALER_TURN") {
      setDealerRevealed(true);

      setTimeout(() => {
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

        setTimeout(() => setPhase("RESOLVING"), 1000);
      }, 1000);
    }
  }, [phase, dealerHand, dealCardFromShoe, gameSettings]);

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

      // Show end-of-hand reactions
      showEndOfHandReactions();

      setTimeout(() => setPhase("ROUND_END"), 2000);
    }
  }, [phase, playerHand, dealerHand, gameSettings]);

  const showEndOfHandReactions = useCallback(() => {
    const reactions: Array<{
      playerId: string;
      message: string;
      outcome: string;
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

      if (result === "BLACKJACK") {
        outcomeType = "bigWin";
        messages = ai.character.reactions.bigWin;
      } else if (netGain > ai.hand.bet * 0.5) {
        outcomeType = "bigWin";
        messages = ai.character.reactions.bigWin;
      } else if (netGain > 0) {
        outcomeType = "smallWin";
        messages = ai.character.reactions.smallWin;
      } else if (netGain === 0) {
        outcomeType = "push";
        messages = ai.character.reactions.push;
      } else if (result === "BUST" || netGain < -ai.hand.bet * 0.5) {
        outcomeType = "bigLoss";
        messages = ai.character.reactions.bigLoss;
      } else {
        outcomeType = "smallLoss";
        messages = ai.character.reactions.smallLoss;
      }

      const message = messages[Math.floor(Math.random() * messages.length)];
      reactions.push({
        playerId: ai.character.id,
        message,
        outcome: outcomeType,
      });
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
  }, [aiPlayers, dealerHand, gameSettings]);

  const addSpeechBubble = useCallback(
    (playerId: string, message: string, position: number) => {
      const positions = [
        { left: "20%", top: "50%" },
        { left: "50%", top: "50%" },
        { left: "80%", top: "50%" },
      ];

      const bubble: SpeechBubble = {
        playerId,
        message,
        position: positions[position] || positions[0],
        id: `${playerId}-${Date.now()}`,
      };

      setSpeechBubbles((prev) => [...prev, bubble]);

      setTimeout(() => {
        setSpeechBubbles((prev) => prev.filter((b) => b.id !== bubble.id));
      }, 1500);
    },
    [],
  );

  // Next hand
  const nextHand = useCallback(() => {
    setHandNumber((prev) => prev + 1);
    setPhase("BETTING");
  }, []);

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
      <SuspicionMeter level={suspicionLevel} />

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

          {/* Table Overlay Text */}
          <TableOverlay message="BLACKJACK PAYS 3 TO 2" size="large" />
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
            {/* Dealer Avatar - Clickable */}
            {currentDealer && (
              <div
                onClick={() => {
                  console.log("Dealer avatar clicked!");
                  setShowDealerInfo(true);
                }}
                style={{
                  width: "150px",
                  height: "150px",
                  borderRadius: "50%",
                  margin: "0 auto 12px",
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
                  <div className="flex justify-center gap-2 mb-1">
                    {dealerHand.cards.map((card, idx) => (
                      <div key={idx} style={{ width: "70px", height: "98px" }}>
                        <PlayingCard
                          card={card}
                          faceDown={!dealerRevealed && idx === 1}
                        />
                      </div>
                    ))}
                  </div>
                  {dealerRevealed && (
                    <div
                      className="text-white font-bold"
                      style={{ textShadow: "1px 1px 2px rgba(0,0,0,0.8)" }}
                    >
                      {calculateHandValue(dealerHand.cards)}
                    </div>
                  )}
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
                  {aiPlayer && (
                    <div
                      style={{
                        position: "relative",
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                      }}
                    >
                      {/* Cards positioned absolutely above - in rows of 3 */}
                      {aiPlayer.hand.cards.length > 0 && (
                        <div
                          style={{
                            position: "absolute",
                            bottom: "100%",
                            left: "50%",
                            transform: "translateX(-50%)",
                            marginBottom: "8px",
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "center",
                            gap: "4px",
                          }}
                        >
                          {/* Split cards into rows of 3 */}
                          {Array.from({
                            length: Math.ceil(aiPlayer.hand.cards.length / 3),
                          }).map((_, rowIdx) => (
                            <div
                              key={rowIdx}
                              style={{
                                display: "flex",
                                gap: "4px",
                                justifyContent: "center",
                              }}
                            >
                              {aiPlayer.hand.cards
                                .slice(rowIdx * 3, rowIdx * 3 + 3)
                                .map((card, cardIdx) => (
                                  <div
                                    key={rowIdx * 3 + cardIdx}
                                    style={{ width: "70px", height: "98px" }}
                                  >
                                    <PlayingCard card={card} />
                                  </div>
                                ))}
                            </div>
                          ))}
                        </div>
                      )}
                      {/* Avatar */}
                      <div
                        style={{
                          width: "150px",
                          height: "150px",
                          borderRadius: "50%",
                          border: "4px solid #FFD700",
                          overflow: "hidden",
                          backgroundColor: "#333",
                          marginBottom: "6px",
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
                  )}

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
                      {/* Cards positioned absolutely above - in rows of 3 */}
                      {playerHand.cards.length > 0 && (
                        <div
                          style={{
                            position: "absolute",
                            bottom: "100%",
                            left: "50%",
                            transform: "translateX(-50%)",
                            marginBottom: "8px",
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "center",
                            gap: "4px",
                          }}
                        >
                          {/* Split cards into rows of 3 */}
                          {Array.from({
                            length: Math.ceil(playerHand.cards.length / 3),
                          }).map((_, rowIdx) => (
                            <div
                              key={rowIdx}
                              style={{
                                display: "flex",
                                gap: "4px",
                                justifyContent: "center",
                              }}
                            >
                              {playerHand.cards
                                .slice(rowIdx * 3, rowIdx * 3 + 3)
                                .map((card, cardIdx) => (
                                  <div
                                    key={rowIdx * 3 + cardIdx}
                                    style={{ width: "70px", height: "98px" }}
                                  >
                                    <PlayingCard card={card} />
                                  </div>
                                ))}
                            </div>
                          ))}
                        </div>
                      )}
                      {/* Avatar */}
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
                          marginBottom: "6px",
                        }}
                      >
                        YOU
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
                  <Button
                    size="lg"
                    onPress={nextHand}
                    style={{
                      backgroundColor: "#4CAF50",
                      color: "white",
                      fontWeight: "bold",
                      fontSize: "16px",
                      padding: "12px 24px",
                    }}
                  >
                    Next Hand
                  </Button>
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
      </div>
    </div>
  );
}
