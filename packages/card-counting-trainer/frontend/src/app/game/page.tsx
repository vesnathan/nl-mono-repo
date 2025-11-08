"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { Button, Card as UICard } from "@nextui-org/react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { createAndShuffleShoe, calculateDecksRemaining, calculateTrueCount } from "@/lib/deck";
import { dealCard, calculateHandValue, isBlackjack, isBusted } from "@/lib/gameActions";
import { playDealerHand, determineHandResult, calculatePayout } from "@/lib/dealer";
import { Card as GameCard, HandResult } from "@/types/game";
import { AI_CHARACTERS, AICharacter } from "@/data/aiCharacters";
import { DEALER_CHARACTERS, DealerCharacter, getRandomDealer } from "@/data/dealerCharacters";
import { getInitialHandReaction, getHitReaction } from "@/data/inHandReactions";
import FlyingCard from "@/components/FlyingCard";
import WinLossBubble from "@/components/WinLossBubble";
import SuspicionMeter from "@/components/SuspicionMeter";
import DealerInfo from "@/components/DealerInfo";

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

type GamePhase = "BETTING" | "DEALING" | "PLAYER_TURN" | "AI_TURNS" | "DEALER_TURN" | "RESOLVING" | "ROUND_END";

export default function GamePage() {
  const router = useRouter();
  const { user } = useAuth();

  // Game state
  const [numDecks] = useState(6);
  const [shoe, setShoe] = useState<GameCard[]>(() => createAndShuffleShoe(6));
  const [cardsDealt, setCardsDealt] = useState(0);
  const [runningCount, setRunningCount] = useState(0);
  const [shoesDealt, setShoesDealt] = useState(0);

  // Player state
  const [playerChips, setPlayerChips] = useState(1000);
  const [playerHand, setPlayerHand] = useState<PlayerHand>({ cards: [], bet: 0 });
  const [currentBet, setCurrentBet] = useState(10);

  // AI players state
  const [aiPlayers, setAIPlayers] = useState<AIPlayer[]>([]);
  const [dealerHand, setDealerHand] = useState<PlayerHand>({ cards: [], bet: 0 });
  const [dealerRevealed, setDealerRevealed] = useState(false);

  // Dealer character state
  const [currentDealer, setCurrentDealer] = useState<DealerCharacter | null>(null);

  // UI state
  const [phase, setPhase] = useState<GamePhase>("BETTING");
  const [suspicionLevel, setSuspicionLevel] = useState(0);
  const [speechBubbles, setSpeechBubbles] = useState<SpeechBubble[]>([]);
  const [handNumber, setHandNumber] = useState(0);

  // Track previous hand states for in-hand reactions
  const prevAIHandsRef = useRef<Map<string, number>>(new Map());

  // Initialize AI players and dealer on mount
  useEffect(() => {
    const selectedCharacters = AI_CHARACTERS.slice(0, 3).map((char, idx) => ({
      character: char,
      hand: { cards: [], bet: 50 },
      chips: 1000,
      position: idx
    }));
    setAIPlayers(selectedCharacters);

    const initialDealer = getRandomDealer();
    setCurrentDealer(initialDealer);
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
      setShoesDealt(prev => prev + 1);
    } else {
      setShoe(remainingShoe);
      setCardsDealt(prev => prev + 1);
      setRunningCount(prev => prev + card.count);
    }

    return card;
  }, [shoe, numDecks]);

  // Change dealer every 5-8 shoes
  useEffect(() => {
    if (shoesDealt > 0 && shoesDealt % (Math.floor(Math.random() * 4) + 5) === 0) {
      const newDealer = getRandomDealer(currentDealer ? [currentDealer.id] : []);
      setCurrentDealer(newDealer);
    }
  }, [shoesDealt, currentDealer]);

  // Start new round
  const startNewRound = useCallback(() => {
    setPhase("DEALING");
    setDealerRevealed(false);
    setPlayerHand({ cards: [], bet: currentBet });
    setDealerHand({ cards: [], bet: 0 });
    setPlayerChips(prev => prev - currentBet);

    // Reset AI hands with random bets
    const updatedAI = aiPlayers.map(ai => ({
      ...ai,
      hand: { cards: [], bet: Math.floor(Math.random() * 50) + 25 },
    }));
    setAIPlayers(updatedAI);

    // Deal initial cards
    setTimeout(() => dealInitialCards(), 500);
  }, [currentBet, aiPlayers]);

  const dealInitialCards = useCallback(() => {
    const allHands: { type: string; index: number }[] = [];

    // First card to everyone
    aiPlayers.forEach((_, idx) => allHands.push({ type: "ai", index: idx }));
    allHands.push({ type: "player", index: 0 });
    allHands.push({ type: "dealer", index: 0 });

    // Second card to everyone
    aiPlayers.forEach((_, idx) => allHands.push({ type: "ai", index: idx }));
    allHands.push({ type: "player", index: 0 });
    allHands.push({ type: "dealer", index: 0 });

    let delay = 0;
    allHands.forEach(({ type, index }) => {
      setTimeout(() => {
        const card = dealCardFromShoe();

        if (type === "ai") {
          setAIPlayers(prev => {
            const updated = [...prev];
            updated[index].hand.cards.push(card);
            return updated;
          });
        } else if (type === "player") {
          setPlayerHand(prev => ({ ...prev, cards: [...prev.cards, card] }));
        } else if (type === "dealer") {
          setDealerHand(prev => ({ ...prev, cards: [...prev.cards, card] }));
        }
      }, delay);
      delay += 300;
    });

    setTimeout(() => {
      checkForInitialReactions();
      setPhase("PLAYER_TURN");
    }, delay + 500);
  }, [aiPlayers, dealCardFromShoe]);

  // Check for initial hand reactions
  const checkForInitialReactions = useCallback(() => {
    const reactions: Array<{ playerId: string; message: string; outcome: string }> = [];

    aiPlayers.forEach(ai => {
      const handValue = calculateHandValue(ai.hand.cards);
      const hasBlackjack = isBlackjack(ai.hand.cards);
      const reaction = getInitialHandReaction(ai.character, handValue, hasBlackjack);

      if (reaction) {
        const outcomeType = hasBlackjack ? "bigWin" : handValue <= 12 ? "bigLoss" : "smallWin";
        reactions.push({
          playerId: ai.character.id,
          message: reaction,
          outcome: outcomeType
        });
      }
    });

    // Limit to 1-2 bubbles with priority
    const priorityOrder = ["bigWin", "bigLoss", "smallWin", "smallLoss", "push"];
    const sortedReactions = reactions.sort((a, b) => {
      return priorityOrder.indexOf(a.outcome) - priorityOrder.indexOf(b.outcome);
    });
    const numBubbles = Math.random() < 0.6 ? 1 : 2;
    const selectedReactions = sortedReactions.slice(0, numBubbles);

    // Show speech bubbles
    selectedReactions.forEach((reaction, idx) => {
      setTimeout(() => {
        const aiPlayer = aiPlayers.find(ai => ai.character.id === reaction.playerId);
        if (aiPlayer) {
          addSpeechBubble(reaction.playerId, reaction.message, aiPlayer.position);
        }
      }, idx * 600);
    });
  }, [aiPlayers]);

  // Player actions
  const hit = useCallback(() => {
    const card = dealCardFromShoe();
    setPlayerHand(prev => ({ ...prev, cards: [...prev.cards, card] }));

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
            setAIPlayers(prev => {
              const updated = [...prev];
              updated[idx].hand.cards.push(card);

              // Check for hit reaction
              const newHandValue = calculateHandValue(updated[idx].hand.cards);
              const oldHandValue = calculateHandValue(ai.hand.cards);
              const reaction = getHitReaction(ai.character, card.rank, oldHandValue, newHandValue);

              if (reaction && Math.random() < 0.3) {
                setTimeout(() => addSpeechBubble(ai.character.id, reaction, ai.position), 200);
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

        while (calculateHandValue(currentDealerHand.cards) < 17) {
          const card = dealCardFromShoe();
          currentDealerHand.cards.push(card);
          setDealerHand({ ...currentDealerHand });
        }

        setTimeout(() => setPhase("RESOLVING"), 1000);
      }, 1000);
    }
  }, [phase, dealerHand, dealCardFromShoe]);

  // Resolve hands
  useEffect(() => {
    if (phase === "RESOLVING") {
      const playerResult = determineHandResult(playerHand, dealerHand);
      const playerPayout = calculatePayout(playerHand, playerResult);

      setPlayerChips(prev => prev + playerPayout);
      setPlayerHand(prev => ({ ...prev, result: playerResult }));

      // Show end-of-hand reactions
      showEndOfHandReactions();

      setTimeout(() => setPhase("ROUND_END"), 2000);
    }
  }, [phase, playerHand, dealerHand]);

  const showEndOfHandReactions = useCallback(() => {
    const reactions: Array<{ playerId: string; message: string; outcome: string }> = [];

    aiPlayers.forEach(ai => {
      const result = determineHandResult(ai.hand, dealerHand);
      const payout = calculatePayout(ai.hand, result);
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
      reactions.push({ playerId: ai.character.id, message, outcome: outcomeType });
    });

    // Limit to 1-2 bubbles with priority
    const priorityOrder = ["bigWin", "bigLoss", "smallWin", "smallLoss", "push"];
    const sortedReactions = reactions.sort((a, b) => {
      return priorityOrder.indexOf(a.outcome) - priorityOrder.indexOf(b.outcome);
    });
    const numBubbles = Math.random() < 0.6 ? 1 : 2;
    const selectedReactions = sortedReactions.slice(0, numBubbles);

    selectedReactions.forEach((reaction, idx) => {
      setTimeout(() => {
        const aiPlayer = aiPlayers.find(ai => ai.character.id === reaction.playerId);
        if (aiPlayer) {
          addSpeechBubble(reaction.playerId, reaction.message, aiPlayer.position);
        }
      }, idx * 600);
    });
  }, [aiPlayers, dealerHand]);

  const addSpeechBubble = useCallback((playerId: string, message: string, position: number) => {
    const positions = [
      { left: "20%", top: "50%" },
      { left: "50%", top: "50%" },
      { left: "80%", top: "50%" }
    ];

    const bubble: SpeechBubble = {
      playerId,
      message,
      position: positions[position] || positions[0],
      id: `${playerId}-${Date.now()}`
    };

    setSpeechBubbles(prev => [...prev, bubble]);

    setTimeout(() => {
      setSpeechBubbles(prev => prev.filter(b => b.id !== bubble.id));
    }, 1500);
  }, []);

  // Next hand
  const nextHand = useCallback(() => {
    setHandNumber(prev => prev + 1);
    setPhase("BETTING");
  }, []);

  const decksRemaining = calculateDecksRemaining(numDecks * 52, cardsDealt);
  const trueCount = calculateTrueCount(runningCount, decksRemaining);

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl mb-4">Please sign in to play</h2>
          <Button onPress={() => router.push("/")}>Go Back</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-900 to-green-800 p-4">
      {/* Header */}
      <div className="max-w-7xl mx-auto mb-4 flex justify-between items-center">
        <div className="flex gap-4 items-center">
          <Button size="sm" onPress={() => router.push("/")}>Exit</Button>
          <div className="text-white">
            <span className="font-bold">Chips: ${playerChips}</span>
          </div>
          <div className="text-white text-sm">
            RC: {runningCount} | TC: {trueCount} | Decks: {decksRemaining.toFixed(1)}
          </div>
        </div>

        {currentDealer && (
          <DealerInfo dealer={currentDealer} />
        )}

        <SuspicionMeter level={suspicionLevel} />
      </div>

      {/* Game Table */}
      <div className="max-w-7xl mx-auto bg-green-700 rounded-3xl p-8 shadow-2xl border-8 border-amber-900 relative">
        {/* Dealer */}
        <div className="text-center mb-8">
          <h3 className="text-white text-xl mb-4">
            {currentDealer?.name || "Dealer"}
          </h3>
          <div className="flex justify-center gap-2 mb-2">
            {dealerHand.cards.map((card, idx) => (
              <div key={idx} className="bg-white rounded p-2 w-16 h-24 flex items-center justify-center shadow-lg">
                {!dealerRevealed && idx === 1 ? (
                  <span className="text-4xl">?</span>
                ) : (
                  <span className="text-2xl">{card.rank}{card.suit}</span>
                )}
              </div>
            ))}
          </div>
          <div className="text-white">
            {dealerRevealed ? calculateHandValue(dealerHand.cards) : "?"}
          </div>
        </div>

        {/* AI Players */}
        <div className="flex justify-around mb-8">
          {aiPlayers.map((ai, idx) => (
            <div key={ai.character.id} className="text-center">
              <div className="w-16 h-16 bg-gray-400 rounded-full mb-2 mx-auto flex items-center justify-center">
                {ai.character.name.charAt(0)}
              </div>
              <div className="text-white text-sm mb-2">{ai.character.name.split(" ")[0]}</div>
              <div className="flex justify-center gap-1 mb-1">
                {ai.hand.cards.map((card, cardIdx) => (
                  <div key={cardIdx} className="bg-white rounded p-1 w-12 h-16 flex items-center justify-center text-sm">
                    {card.rank}{card.suit}
                  </div>
                ))}
              </div>
              <div className="text-white text-xs">{calculateHandValue(ai.hand.cards)}</div>
            </div>
          ))}
        </div>

        {/* Player */}
        <div className="text-center">
          <h3 className="text-white text-xl mb-4">You</h3>
          <div className="flex justify-center gap-2 mb-2">
            {playerHand.cards.map((card, idx) => (
              <div key={idx} className="bg-white rounded p-2 w-16 h-24 flex items-center justify-center shadow-lg">
                <span className="text-2xl">{card.rank}{card.suit}</span>
              </div>
            ))}
          </div>
          <div className="text-white text-lg mb-4">
            {playerHand.cards.length > 0 ? calculateHandValue(playerHand.cards) : ""}
          </div>

          {/* Actions */}
          {phase === "BETTING" && (
            <div className="flex gap-4 justify-center">
              <Button color="warning" size="lg" onPress={startNewRound}>
                Deal (Bet: ${currentBet})
              </Button>
            </div>
          )}

          {phase === "PLAYER_TURN" && !isBusted(playerHand.cards) && (
            <div className="flex gap-4 justify-center">
              <Button color="success" size="lg" onPress={hit}>Hit</Button>
              <Button color="primary" size="lg" onPress={stand}>Stand</Button>
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
              <Button color="warning" size="lg" onPress={nextHand}>
                Next Hand
              </Button>
            </div>
          )}
        </div>

        {/* Speech Bubbles */}
        {speechBubbles.map(bubble => (
          <WinLossBubble
            key={bubble.id}
            position={bubble.position}
            message={bubble.message}
          />
        ))}
      </div>
    </div>
  );
}
