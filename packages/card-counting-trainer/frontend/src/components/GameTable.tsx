import React from "react";
import {
  GamePhase,
  AIPlayer,
  PlayerHand,
  SpeechBubble,
  WinLossBubbleData,
  ActiveConversation,
  FlyingCardData,
} from "@/types/gameState";
import { GameSettings, calculateCutCardPosition } from "@/types/gameSettings";
import { DealerCharacter } from "@/data/dealerCharacters";
import Shoe from "@/components/Shoe";
import DealerSection from "@/components/DealerSection";
import TableSeats from "@/components/TableSeats";
import GameOverlays from "@/components/GameOverlays";
import DealerInfo from "@/components/DealerInfo";
import TableRules from "@/components/TableRules";

interface GameTableProps {
  // Game state
  gameSettings: GameSettings;
  cardsDealt: number;
  currentDealer: DealerCharacter | null;
  dealerCallout: string | null;
  phase: GamePhase;
  dealerHand: PlayerHand;
  dealerRevealed: boolean;
  aiPlayers: AIPlayer[];
  playerSeat: number | null;
  playerHand: PlayerHand;
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

  // Actions
  setPlayerSeat: (seat: number) => void;
  addDebugLog: (message: string) => void;
  startNewRound: () => void;
  hit: () => void;
  stand: () => void;
  handleConversationResponse: (suspicionChange: number) => void;
  handleConversationIgnore: () => void;
  setWinLossBubbles: React.Dispatch<React.SetStateAction<WinLossBubbleData[]>>;
  setShowDealerInfo: (show: boolean) => void;
}

export default function GameTable({
  gameSettings,
  cardsDealt,
  currentDealer,
  dealerCallout,
  phase,
  dealerHand,
  dealerRevealed,
  aiPlayers,
  playerSeat,
  playerHand,
  currentBet,
  activePlayerIndex,
  playerActions,
  speechBubbles,
  winLossBubbles,
  activeConversation,
  flyingCards,
  showDealerInfo,
  setPlayerSeat,
  addDebugLog,
  startNewRound,
  hit,
  stand,
  handleConversationResponse,
  handleConversationIgnore,
  setWinLossBubbles,
  setShowDealerInfo,
}: GameTableProps) {
  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100vw",
        height: "100vh",
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
        <DealerSection
          currentDealer={currentDealer}
          dealerCallout={dealerCallout}
          phase={phase}
          dealerHand={dealerHand}
          dealerRevealed={dealerRevealed}
          onDealerClick={() => setShowDealerInfo(true)}
        />

        {/* Player Spots - Using exact positions from reference project */}
        <TableSeats
          aiPlayers={aiPlayers}
          playerSeat={playerSeat}
          playerHand={playerHand}
          phase={phase}
          activePlayerIndex={activePlayerIndex}
          playerActions={playerActions}
          onSeatClick={setPlayerSeat}
          addDebugLog={addDebugLog}
        />

        {/* Table Rules Placard */}
        <TableRules gameSettings={gameSettings} />

        {/* Game Overlays: Action Buttons, Bubbles, Conversations, Flying Cards */}
        <GameOverlays
          playerSeat={playerSeat}
          playerHand={playerHand}
          currentBet={currentBet}
          phase={phase}
          speechBubbles={speechBubbles}
          winLossBubbles={winLossBubbles}
          activeConversation={activeConversation}
          flyingCards={flyingCards}
          startNewRound={startNewRound}
          hit={hit}
          stand={stand}
          handleConversationResponse={handleConversationResponse}
          handleConversationIgnore={handleConversationIgnore}
          setWinLossBubbles={setWinLossBubbles}
        />
      </div>

      {/* Dealer Info Modal */}
      {showDealerInfo && currentDealer && (
        <DealerInfo
          dealer={currentDealer}
          onClose={() => setShowDealerInfo(false)}
          openAsModal
        />
      )}

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
  );
}
