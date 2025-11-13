import React, { createContext, useContext, ReactNode } from "react";
import { GameSettings } from "@/types/gameSettings";
import { WinLossBubbleData } from "@/types/gameState";

interface GameActions {
  // Game actions
  setPlayerSeat: (seat: number) => void;
  startNewRound: () => void;
  hit: () => void;
  stand: () => void;
  doubleDown: () => void;
  split: () => void;
  surrender: () => void;
  handleBetChange: (amount: number) => void;
  handleConfirmBet: () => void;
  handleClearBet: () => void;

  // Insurance
  handleTakeInsurance: () => void;
  handleDeclineInsurance: () => void;

  // Conversation
  handleConversationResponse: (suspicionChange: number) => void;
  handleConversationIgnore: () => void;

  // Settings
  setGameSettings: (settings: GameSettings) => void;

  // State setters
  setWinLossBubbles: React.Dispatch<React.SetStateAction<WinLossBubbleData[]>>;

  // Utilities
  registerTimeout: (callback: () => void, delay: number) => NodeJS.Timeout;
}

const GameActionsContext = createContext<GameActions | undefined>(undefined);

export function GameActionsProvider({
  children,
  value,
}: {
  children: ReactNode;
  value: GameActions;
}) {
  return (
    <GameActionsContext.Provider value={value}>
      {children}
    </GameActionsContext.Provider>
  );
}

export function useGameActions() {
  const context = useContext(GameActionsContext);
  if (context === undefined) {
    throw new Error("useGameActions must be used within a GameActionsProvider");
  }
  return context;
}
