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
    dealerHand,
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
  const canSplitHand = (() => {
    // Get the hand to check (current split hand or main hand)
    const isResplit = playerHand.isSplit && playerHand.splitHands;
    const handToCheck = isResplit
      ? playerHand.splitHands![playerHand.activeSplitHandIndex ?? 0]
      : playerHand;

    // Basic checks: must have exactly 2 cards with matching ranks
    if (handToCheck.cards.length !== 2) return false;
    if (handToCheck.cards[0].rank !== handToCheck.cards[1].rank) return false;
    if (playerChips < handToCheck.bet) return false;

    // Check resplit limits
    const currentSplitCount = isResplit ? playerHand.splitHands!.length : 0;
    if (currentSplitCount >= gameSettings.maxResplits + 1) return false;

    // Check resplit aces restriction
    if (
      handToCheck.cards[0].rank === "A" &&
      currentSplitCount > 0 &&
      !gameSettings.resplitAces
    ) {
      return false;
    }

    return true;
  })();

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
        playerHand={playerHand}
        dealerUpCard={
          dealerHand.cards.length > 0 ? dealerHand.cards[0] : undefined
        }
      />

      {/* Debug Log Modal and Button */}
      <DebugLogModal debugLogs={debugLogs} phase={phase} />
    </>
  );
}
