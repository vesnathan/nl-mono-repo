import React from "react";
import { GameSettings } from "@/types/gameSettings";
import { GamePhase } from "@/types/gameState";
import BettingInterface from "@/components/BettingInterface";
import InsuranceUI from "@/components/InsuranceUI";
import GameSettingsModal from "@/components/GameSettingsModal";
import LeaderboardModal from "@/components/LeaderboardModal";
import BasicStrategyCard from "@/components/BasicStrategyCard";
import DebugLogModal from "@/components/DebugLogModal";

interface GameModalsProps {
  // Betting
  phase: GamePhase;
  initialized: boolean;
  playerSeat: number | null;
  playerChips: number;
  currentBet: number;
  minBet: number;
  maxBet: number;
  handleBetChange: (amount: number) => void;
  handleConfirmBet: () => void;
  handleClearBet: () => void;

  // Insurance
  insuranceOffered: boolean;
  handleTakeInsurance: () => void;
  handleDeclineInsurance: () => void;

  // Settings
  showSettings: boolean;
  setShowSettings: (show: boolean) => void;
  gameSettings: GameSettings;
  setGameSettings: (settings: GameSettings) => void;

  // Leaderboard
  showLeaderboard: boolean;
  setShowLeaderboard: (show: boolean) => void;
  peakChips: number;
  longestStreak: number;
  currentScore: number;

  // Strategy Card
  showStrategyCard: boolean;
  setShowStrategyCard: (show: boolean) => void;

  // Debug Log
  debugLogs: string[];
  showDebugLog: boolean;
  setShowDebugLog: (show: boolean) => void;
  clearDebugLogs: () => void;
}

export default function GameModals({
  phase,
  initialized,
  playerSeat,
  playerChips,
  currentBet,
  minBet,
  maxBet,
  handleBetChange,
  handleConfirmBet,
  handleClearBet,
  insuranceOffered,
  handleTakeInsurance,
  handleDeclineInsurance,
  showSettings,
  setShowSettings,
  gameSettings,
  setGameSettings,
  showLeaderboard,
  setShowLeaderboard,
  peakChips,
  longestStreak,
  currentScore,
  showStrategyCard,
  setShowStrategyCard,
  debugLogs,
  showDebugLog,
  setShowDebugLog,
  clearDebugLogs,
}: GameModalsProps) {
  return (
    <>
      {/* Betting Interface - shown during BETTING phase when player is seated */}
      {phase === "BETTING" && initialized && playerSeat !== null && (
        <BettingInterface
          playerChips={playerChips}
          currentBet={currentBet}
          minBet={minBet}
          maxBet={maxBet}
          onBetChange={handleBetChange}
          onConfirmBet={handleConfirmBet}
          onClearBet={handleClearBet}
        />
      )}

      {/* Insurance UI - shown during INSURANCE phase when insurance is offered */}
      {phase === "INSURANCE" && insuranceOffered && playerSeat !== null && (
        <InsuranceUI
          currentBet={currentBet}
          playerChips={playerChips}
          onTakeInsurance={handleTakeInsurance}
          onDeclineInsurance={handleDeclineInsurance}
        />
      )}

      {/* Game Settings Modal */}
      <GameSettingsModal
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
        currentSettings={gameSettings}
        onSave={(newSettings) => {
          setGameSettings({ ...gameSettings, ...newSettings });
          // Note: Changing settings mid-game would require game reset
          // For now, settings only apply to new games
        }}
      />

      {/* Leaderboard Modal */}
      <LeaderboardModal
        isOpen={showLeaderboard}
        onClose={() => setShowLeaderboard(false)}
        currentChips={playerChips}
        peakChips={peakChips}
        longestStreak={longestStreak}
        currentScore={currentScore}
      />

      {/* Basic Strategy Card Modal */}
      <BasicStrategyCard
        isOpen={showStrategyCard}
        onClose={() => setShowStrategyCard(false)}
        settings={gameSettings}
      />

      {/* Debug Log Modal and Button */}
      <DebugLogModal
        debugLogs={debugLogs}
        phase={phase}
        showDebugLog={showDebugLog}
        onShowDebugLog={setShowDebugLog}
        onClearDebugLogs={clearDebugLogs}
      />
    </>
  );
}
