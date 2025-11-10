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
import { GameSettings } from "@/types/gameSettings";
import { DealerCharacter } from "@/data/dealerCharacters";
import { HeatMapBucket } from "@/hooks/useHeatMap";
import SuspicionMeter from "@/components/SuspicionMeter";
import StatsBar from "@/components/StatsBar";
import GameTable from "@/components/GameTable";
import GameModals from "@/components/GameModals";
import HeatMapModal from "@/components/HeatMapModal";

interface BlackjackGameUIProps {
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

  // Modal state
  initialized: boolean;
  minBet: number;
  maxBet: number;
  showSettings: boolean;
  showLeaderboard: boolean;
  peakChips: number;
  longestStreak: number;
  showStrategyCard: boolean;
  showHeatMap: boolean;
  heatMapBuckets: HeatMapBucket[];
  discretionScore: number;
  heatMapDataPointCount: number;
  debugLogs: string[];
  showDebugLog: boolean;

  // Insurance
  insuranceOffered: boolean;
  handleTakeInsurance: () => void;
  handleDeclineInsurance: () => void;

  // Actions
  setShowSettings: (show: boolean) => void;
  setShowLeaderboard: (show: boolean) => void;
  setShowStrategyCard: (show: boolean) => void;
  setShowHeatMap: (show: boolean) => void;
  setPlayerSeat: (seat: number) => void;
  addDebugLog: (message: string) => void;
  startNewRound: () => void;
  hit: () => void;
  stand: () => void;
  handleConversationResponse: (suspicionChange: number) => void;
  handleConversationIgnore: () => void;
  setWinLossBubbles: React.Dispatch<React.SetStateAction<WinLossBubbleData[]>>;
  setShowDealerInfo: (show: boolean) => void;
  handleBetChange: (amount: number) => void;
  handleConfirmBet: () => void;
  handleClearBet: () => void;
  setGameSettings: (settings: GameSettings) => void;
  setShowDebugLog: (show: boolean) => void;
  clearDebugLogs: () => void;
}

export default function BlackjackGameUI({
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
  currentBet,
  activePlayerIndex,
  playerActions,
  speechBubbles,
  winLossBubbles,
  activeConversation,
  flyingCards,
  showDealerInfo,
  initialized,
  minBet,
  maxBet,
  showSettings,
  showLeaderboard,
  peakChips,
  longestStreak,
  showStrategyCard,
  showHeatMap,
  heatMapBuckets,
  discretionScore,
  heatMapDataPointCount,
  debugLogs,
  showDebugLog,
  insuranceOffered,
  handleTakeInsurance,
  handleDeclineInsurance,
  setShowSettings,
  setShowLeaderboard,
  setShowStrategyCard,
  setShowHeatMap,
  setPlayerSeat,
  addDebugLog,
  startNewRound,
  hit,
  stand,
  handleConversationResponse,
  handleConversationIgnore,
  setWinLossBubbles,
  setShowDealerInfo,
  handleBetChange,
  handleConfirmBet,
  handleClearBet,
  setGameSettings,
  setShowDebugLog,
  clearDebugLogs,
}: BlackjackGameUIProps) {
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
        onLeaderboardClick={() => setShowLeaderboard(true)}
        onStrategyClick={() => setShowStrategyCard(true)}
        onChartsClick={() => setShowHeatMap(true)}
      />

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
        addDebugLog={addDebugLog}
        startNewRound={startNewRound}
        hit={hit}
        stand={stand}
        handleConversationResponse={handleConversationResponse}
        handleConversationIgnore={handleConversationIgnore}
        setWinLossBubbles={setWinLossBubbles}
        setShowDealerInfo={setShowDealerInfo}
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
