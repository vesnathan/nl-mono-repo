import React from "react";
import SuspicionMeter from "@/components/SuspicionMeter";
import StatsBar from "@/components/StatsBar";
import GameTable from "@/components/GameTable";
import GameModals from "@/components/GameModals";
import HeatMapModal from "@/components/HeatMapModal";
import { useGameState } from "@/contexts/GameStateContext";

export default function BlackjackGameUI() {
  // Get all state from contexts
  const gameState = useGameState();

  // Destructure what we need
  const { phase } = gameState;
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
      <SuspicionMeter />

      {/* Stats Bar at Top */}
      <StatsBar />

      {/* Phase Indicator (Dev Mode Only) */}
      {process.env.NODE_ENV === "development" && (
        <div
          style={{
            position: "fixed",
            top: "70px",
            left: "20px",
            backgroundColor: "rgba(0, 0, 0, 0.9)",
            color: "#00FF00",
            border: "2px solid #00FF00",
            borderRadius: "8px",
            padding: "8px 16px",
            fontSize: "14px",
            fontWeight: "bold",
            zIndex: 1001,
            fontFamily: "monospace",
          }}
        >
          PHASE: {phase}
        </div>
      )}

      {/* Full Viewport Game Table */}
      <GameTable />

      {/* All Game Modals */}
      <GameModals />

      {/* Heat Map Modal */}
      <HeatMapModal />
    </div>
  );
}
