import React, { createContext, useContext, ReactNode } from "react";
import {
  GamePhase,
  AIPlayer,
  PlayerHand,
  SpeechBubble,
  WinLossBubbleData,
  ActiveConversation,
  FlyingCardData,
} from "@/types/gameState";
import { GameSettings } from "@/types/gameSettings";
import { DealerCharacter } from "@/data/dealerCharacters";

interface GameState {
  // Display state
  suspicionLevel: number;
  dealerSuspicion: number;
  pitBossDistance: number;
  gameSettings: GameSettings;
  runningCount: number;
  currentStreak: number;
  playerChips: number;
  currentScore: number;
  scoreMultiplier: number;

  // Game state
  cardsDealt: number;
  currentDealer: DealerCharacter | null;
  dealerCallout: string | null;
  phase: GamePhase;
  dealerHand: PlayerHand;
  dealerRevealed: boolean;
  aiPlayers: AIPlayer[];
  playerSeat: number | null;
  playerHand: PlayerHand;
  playerFinished: boolean;
  currentBet: number;
  activePlayerIndex: number | null;
  playerActions: Map<
    number,
    "HIT" | "STAND" | "DOUBLE" | "SPLIT" | "BUST" | "BLACKJACK"
  >;
  speechBubbles: SpeechBubble[];
  winLossBubbles: WinLossBubbleData[];
  activeConversation: ActiveConversation | null;
  flyingCards: FlyingCardData[];
  showDealerInfo: boolean;

  // Insurance
  insuranceOffered: boolean;

  // Stats
  minBet: number;
  maxBet: number;
  peakChips: number;
  longestStreak: number;
}

const GameStateContext = createContext<GameState | undefined>(undefined);

export function GameStateProvider({
  children,
  value,
}: {
  children: ReactNode;
  value: GameState;
}) {
  return (
    <GameStateContext.Provider value={value}>
      {children}
    </GameStateContext.Provider>
  );
}

export function useGameState() {
  const context = useContext(GameStateContext);
  if (context === undefined) {
    throw new Error("useGameState must be used within a GameStateProvider");
  }
  return context;
}
