import React from "react";
import { calculateCutCardPosition } from "@/types/gameSettings";
import Shoe from "@/components/Shoe";
import DealerSection from "@/components/DealerSection";
import TableSeats from "@/components/TableSeats";
import GameOverlays from "@/components/GameOverlays";
import DealerInfo from "@/components/DealerInfo";
import TableRules from "@/components/TableRules";
import { useGameState } from "@/contexts/GameStateContext";
import { useUIState } from "@/contexts/UIStateContext";
import { useGameActions } from "@/contexts/GameActionsContext";

export default function GameTable() {
  const { gameSettings, cardsDealt, currentDealer, showDealerInfo } =
    useGameState();
  const { setShowDealerInfo } = useUIState();
  const { registerTimeout } = useGameActions();
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
        <DealerSection />

        {/* Player Spots - Using exact positions from reference project */}
        <TableSeats />

        {/* Table Rules Placard */}
        <TableRules gameSettings={gameSettings} />

        {/* Game Overlays: Action Buttons, Bubbles, Conversations, Flying Cards */}
        <GameOverlays />
      </div>

      {/* Dealer Info Modal */}
      {showDealerInfo && currentDealer && (
        <DealerInfo
          dealer={currentDealer}
          onClose={() => setShowDealerInfo(false)}
          openAsModal
          registerTimeout={registerTimeout}
        />
      )}

      {/* CSS Animations */}
      {/* eslint-disable-next-line react/no-unknown-property */}
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
