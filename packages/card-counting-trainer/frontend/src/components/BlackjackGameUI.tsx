import React from "react";
import SuspicionMeter from "@/components/SuspicionMeter";
import StatsBar from "@/components/StatsBar";
import GameTable from "@/components/GameTable";
import GameModals from "@/components/GameModals";
import HeatMapModal from "@/components/HeatMapModal";
import { useGameState } from "@/contexts/GameStateContext";
import { useUIState } from "@/contexts/UIStateContext";
import { useGameActions } from "@/contexts/GameActionsContext";

export default function BlackjackGameUI() {
  // Get all state from contexts
  const gameState = useGameState();
  const uiState = useUIState();
  const actions = useGameActions();

  // Destructure what we need
  const {
    suspicionLevel,
    dealerSuspicion,
    pitBossDistance,
    gameSettings,
    runningCount,
    currentStreak,
    playerChips,
    currentScore,
    scoreMultiplier,
    cardsDealt,
    currentDealer,
    dealerCallout,
    phase,
    dealerHand,
    dealerRevealed,
    aiPlayers,
    playerSeat,
    playerHand,
    playerFinished,
    currentBet,
    activePlayerIndex,
    playerActions,
    speechBubbles,
    winLossBubbles,
    activeConversation,
    flyingCards,
    showDealerInfo,
    insuranceOffered,
    minBet,
    maxBet,
    peakChips,
    longestStreak,
  } = gameState;

  const {
    initialized,
    showSettings,
    showLeaderboard,
    showStrategyCard,
    showHeatMap,
    heatMapBuckets,
    discretionScore,
    heatMapDataPointCount,
    debugLogs,
    showDebugLog,
    setShowSettings,
    setShowAdminSettings,
    setShowLeaderboard,
    setShowStrategyCard,
    setShowHeatMap,
    setShowDealerInfo,
    setShowDebugLog,
    clearDebugLogs,
  } = uiState;

  const {
    setPlayerSeat,
    startNewRound,
    hit,
    stand,
    doubleDown,
    split,
    handleBetChange,
    handleConfirmBet,
    handleClearBet,
    handleTakeInsurance,
    handleDeclineInsurance,
    handleConversationResponse,
    handleConversationIgnore,
    setWinLossBubbles,
    registerTimeout,
    setGameSettings,
  } = actions;
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
