import React from "react";
import BettingInterface from "@/components/BettingInterface";
import InsuranceUI from "@/components/InsuranceUI";
import PlayerActionsModal from "@/components/PlayerActionsModal";
import SplitHandsModal from "@/components/SplitHandsModal";
import GameSettingsModal from "@/components/GameSettingsModal";
import LeaderboardModal from "@/components/LeaderboardModal";
import BasicStrategyCard from "@/components/BasicStrategyCard";
import DebugLogModal from "@/components/DebugLogModal";
import { useGameState } from "@/contexts/GameStateContext";
import { useUIState } from "@/contexts/UIStateContext";
import { useGameActions } from "@/contexts/GameActionsContext";

export default function GameModals() {
  const {
    phase,
    playerSeat,
    playerChips,
    currentBet,
    minBet,
    maxBet,
    insuranceOffered,
    playerHand,
    playerFinished,
    gameSettings,
    peakChips,
    longestStreak,
    currentScore,
  } = useGameState();

  const {
    initialized,
    showSettings,
    setShowSettings,
    showLeaderboard,
    setShowLeaderboard,
    showStrategyCard,
    setShowStrategyCard,
    debugLogs,
  } = useUIState();

  const {
    handleBetChange,
    handleConfirmBet,
    handleClearBet,
    handleTakeInsurance,
    handleDeclineInsurance,
    hit,
    stand,
    doubleDown,
    split,
    setGameSettings,
  } = useGameActions();
  // Helper function to check if player is busted
  const isBusted = (cards: { value: number }[]) => {
    const value = cards.reduce((sum, card) => sum + card.value, 0);
    return value > 21;
  };

  // Helper functions to check if player can split or double
  const canSplitHand =
    playerHand.cards.length === 2 &&
    playerHand.cards[0].rank === playerHand.cards[1].rank &&
    playerChips >= playerHand.bet;

  const canDoubleHand =
    playerHand.cards.length === 2 && playerChips >= playerHand.bet;

  // State for split hands modal

  // Show split modal when player has split hands
  const hasSplitHands =
    playerHand.isSplit &&
    playerHand.splitHands &&
    playerHand.splitHands.length > 0;

  // Calculate if split hands can be minimized (when it's not player's turn)
  const canMinimizeSplit = playerFinished || phase !== "PLAYER_TURN";

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

      {/* Split Hands Modal - shown when player has split hands */}
      {hasSplitHands && (
        <SplitHandsModal
          isOpen
          hands={playerHand.splitHands!.map((hand, index) => {
            const activeIndex = playerHand.activeSplitHandIndex ?? 0;
            const handValue = hand.cards.reduce((sum, card) => {
              let value = sum + card.value;
              // Handle ace adjustment
              let aces = hand.cards.filter((c) => c.rank === "A").length;
              while (value > 21 && aces > 0) {
                value -= 10;
                aces -= 1;
              }
              return value;
            }, 0);
            return {
              cards: hand.cards,
              bet: hand.bet,
              finished: index < activeIndex || handValue > 21,
              busted: handValue > 21,
            };
          })}
          activeHandIndex={playerHand.activeSplitHandIndex ?? 0}
          onHit={hit}
          onStand={stand}
          onClose={() => {}}
          canMinimize={canMinimizeSplit}
        />
      )}

      {/* Player Actions Modal - shown during PLAYER_TURN when player has cards and hasn't finished (non-split) */}
      {!hasSplitHands &&
        phase === "PLAYER_TURN" &&
        playerHand.cards.length > 0 &&
        !playerFinished &&
        !isBusted(playerHand.cards) && (
          <PlayerActionsModal
            onHit={hit}
            onStand={stand}
            onDouble={doubleDown}
            onSplit={split}
            canDouble={canDoubleHand}
            canSplit={canSplitHand}
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
      <DebugLogModal debugLogs={debugLogs} phase={phase} />
    </>
  );
}
