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
      <SuspicionMeter
        level={suspicionLevel}
        dealerSuspicion={dealerSuspicion}
        pitBossDistance={pitBossDistance}
        currentDealer={currentDealer}
        registerTimeout={registerTimeout}
      />

      {/* Stats Bar at Top */}
      <StatsBar
        gameSettings={gameSettings}
        runningCount={runningCount}
        currentStreak={currentStreak}
        playerChips={playerChips}
        currentScore={currentScore}
        scoreMultiplier={scoreMultiplier}
        onSettingsClick={() => setShowSettings(true)}
        onAdminClick={() => setShowAdminSettings(true)}
        onLeaderboardClick={() => setShowLeaderboard(true)}
        onStrategyClick={() => setShowStrategyCard(true)}
        onChartsClick={() => setShowHeatMap(true)}
      />

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
      <GameTable
        gameSettings={gameSettings}
        cardsDealt={cardsDealt}
        currentDealer={currentDealer}
        dealerCallout={dealerCallout}
        phase={phase}
        dealerHand={dealerHand}
        dealerRevealed={dealerRevealed}
        aiPlayers={aiPlayers}
        playerSeat={playerSeat}
        playerHand={playerHand}
        currentBet={currentBet}
        activePlayerIndex={activePlayerIndex}
        playerActions={playerActions}
        speechBubbles={speechBubbles}
        winLossBubbles={winLossBubbles}
        activeConversation={activeConversation}
        flyingCards={flyingCards}
        showDealerInfo={showDealerInfo}
        setPlayerSeat={setPlayerSeat}
        startNewRound={startNewRound}
        hit={hit}
        stand={stand}
        handleConversationResponse={handleConversationResponse}
        handleConversationIgnore={handleConversationIgnore}
        setWinLossBubbles={setWinLossBubbles}
        setShowDealerInfo={setShowDealerInfo}
        registerTimeout={registerTimeout}
      />

      {/* All Game Modals */}
      <GameModals
        phase={phase}
        initialized={initialized}
        playerSeat={playerSeat}
        playerChips={playerChips}
        currentBet={currentBet}
        minBet={minBet}
        maxBet={maxBet}
        handleBetChange={handleBetChange}
        handleConfirmBet={handleConfirmBet}
        handleClearBet={handleClearBet}
        insuranceOffered={insuranceOffered}
        handleTakeInsurance={handleTakeInsurance}
        handleDeclineInsurance={handleDeclineInsurance}
        playerHand={playerHand}
        playerFinished={playerFinished}
        hit={hit}
        stand={stand}
        doubleDown={doubleDown}
        split={split}
        showSettings={showSettings}
        setShowSettings={setShowSettings}
        gameSettings={gameSettings}
        setGameSettings={setGameSettings}
        showLeaderboard={showLeaderboard}
        setShowLeaderboard={setShowLeaderboard}
        peakChips={peakChips}
        longestStreak={longestStreak}
        currentScore={currentScore}
        showStrategyCard={showStrategyCard}
        setShowStrategyCard={setShowStrategyCard}
        debugLogs={debugLogs}
        showDebugLog={showDebugLog}
        setShowDebugLog={setShowDebugLog}
        clearDebugLogs={clearDebugLogs}
      />

      {/* Heat Map Modal */}
      <HeatMapModal
        isOpen={showHeatMap}
        onClose={() => setShowHeatMap(false)}
        heatMapBuckets={heatMapBuckets}
        discretionScore={discretionScore}
        dataPointCount={heatMapDataPointCount}
      />
    </div>
  );
}
