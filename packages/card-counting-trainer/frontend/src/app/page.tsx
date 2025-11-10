"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { GameSettings, DEFAULT_GAME_SETTINGS } from "@/types/gameSettings";
import { DealerCharacter } from "@/data/dealerCharacters";
import {
  PlayerHand,
  AIPlayer,
  SpeechBubble,
  WinLossBubbleData,
  ActiveConversation,
  FlyingCardData,
  GamePhase,
} from "@/types/gameState";
import { Card } from "@/types/game";
import { getCardPosition } from "@/utils/cardPositions";
import { useGameTimeouts } from "@/hooks/useGameTimeouts";
import { useDebugLogging } from "@/hooks/useDebugLogging";
import { useGameShoe } from "@/hooks/useGameShoe";
import { usePlayerHand } from "@/hooks/usePlayerHand";
import { useBettingActions } from "@/hooks/useBettingActions";
import { useConversationHandlers } from "@/hooks/useConversationHandlers";
import { useGameActions } from "@/hooks/useGameActions";
import { useSuspicionDecay } from "@/hooks/useSuspicionDecay";
import { useDealerSuspicion } from "@/hooks/useDealerSuspicion";
import { useWongingDetection } from "@/hooks/useWongingDetection";
import { useDealerChange } from "@/hooks/useDealerChange";
import { useGameInitialization } from "@/hooks/useGameInitialization";
import { useConversationTriggers } from "@/hooks/useConversationTriggers";
import { usePitBossMovement } from "@/hooks/usePitBossMovement";
import { useAutoStartHand } from "@/hooks/useAutoStartHand";
import { useGameInteractions } from "@/hooks/useGameInteractions";
import { useRoundEndPhase } from "@/hooks/useRoundEndPhase";
import { useDealerTurnPhase } from "@/hooks/useDealerTurnPhase";
import { useResolvingPhase } from "@/hooks/useResolvingPhase";
import { useAITurnsPhase } from "@/hooks/useAITurnsPhase";
import { useDealingPhase } from "@/hooks/useDealingPhase";
import { useInsurancePhase } from "@/hooks/useInsurancePhase";
import { useHeatMap } from "@/hooks/useHeatMap";
import { calculateDecksRemaining, calculateTrueCount } from "@/lib/deck";
import BlackjackGameUI from "@/components/BlackjackGameUI";
import BackgroundMusic from "@/components/BackgroundMusic";

export default function GamePage() {
  // Game settings
  const [gameSettings, setGameSettings] = useState<GameSettings>(
    DEFAULT_GAME_SETTINGS,
  );

  // Custom hooks
  const { registerTimeout } = useGameTimeouts();
  const {
    debugLogs,
    showDebugLog,
    setShowDebugLog,
    addDebugLog,
    clearDebugLogs,
  } = useDebugLogging();

  const {
    shoe,
    setShoe,
    cardsDealt,
    setCardsDealt,
    runningCount,
    setRunningCount,
    shoesDealt,
    setShoesDealt,
    dealCardFromShoe,
  } = useGameShoe(gameSettings);

  const {
    playerChips,
    setPlayerChips,
    playerHand,
    setPlayerHand,
    currentBet,
    setCurrentBet,
    previousBet,
    setPreviousBet,
    minBet,
    maxBet,
    currentScore,
    currentStreak,
    longestStreak,
    peakChips,
    scoreMultiplier,
  } = usePlayerHand();

  // AI players state
  const [aiPlayers, setAIPlayers] = useState<AIPlayer[]>([]);
  const [dealerHand, setDealerHand] = useState<PlayerHand>({
    cards: [],
    bet: 0,
  });
  const [dealerRevealed, setDealerRevealed] = useState(false);

  // Dealer character state
  const [currentDealer, setCurrentDealer] = useState<DealerCharacter | null>(
    null,
  );
  const [dealerChangeInterval] = useState(
    () => Math.floor(Math.random() * 3) + 8,
  ); // 8-10 shoes

  // Insurance state
  const [playerInsuranceBet, setPlayerInsuranceBet] = useState(0);
  const [insuranceOffered, setInsuranceOffered] = useState(false);

  // UI state
  const [phase, setPhase] = useState<GamePhase>("BETTING");
  const [suspicionLevel, setSuspicionLevel] = useState(0); // Pit boss attention (0-100)
  const [dealerSuspicion, setDealerSuspicion] = useState(0); // Dealer suspicion (0-100) - feeds into pit boss attention
  const [pitBossDistance, setPitBossDistance] = useState(30); // 0-100, higher = closer (more dangerous), start farther away
  const [speechBubbles, setSpeechBubbles] = useState<SpeechBubble[]>([]);
  const [winLossBubbles, setWinLossBubbles] = useState<WinLossBubbleData[]>([]);
  const [activeConversation, setActiveConversation] =
    useState<ActiveConversation | null>(null);
  const [playerSociability, setPlayerSociability] = useState(50); // 0-100: how friendly/responsive player has been
  const [handNumber, setHandNumber] = useState(0);

  // Bet history tracking for counting detection (last 10 bets)
  const [betHistory, setBetHistory] = useState<Array<{bet: number, trueCount: number}>>([]);
  const [showDealerInfo, setShowDealerInfo] = useState(false);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showStrategyCard, setShowStrategyCard] = useState(false);
  const [showHeatMap, setShowHeatMap] = useState(false);
  const [initialized, setInitialized] = useState(false);
  const [playerSeat, setPlayerSeat] = useState<number | null>(null); // null means not seated

  // Action bubbles and turn tracking
  const [activePlayerIndex, setActivePlayerIndex] = useState<number | null>(
    null,
  ); // -1 = player, 0+ = AI index
  const [playerActions, setPlayerActions] = useState<
    Map<number, "HIT" | "STAND" | "DOUBLE" | "SPLIT" | "BUST" | "BLACKJACK">
  >(new Map());
  const [playersFinished, setPlayersFinished] = useState<Set<number>>(
    new Set(),
  ); // Track which AI players have finished
  const [playerFinished, setPlayerFinished] = useState<boolean>(false); // Track if human player has finished

  // Flying card animations
  const [flyingCards, setFlyingCards] = useState<FlyingCardData[]>([]);

  // Dealer callouts
  const [dealerCallout, setDealerCallout] = useState<string | null>(null);

  // Track previous hand states for in-hand reactions
  // const prevAIHandsRef = useRef<Map<string, number>>(new Map()); // TODO: Use for reaction tracking

  // Store dealer's hole card separately to prevent cheating via DevTools
  const dealerHoleCardRef = useRef<Card | null>(null);

  // Game interactions hook - provides conversation and speech bubble functions
  const {
    triggerConversation,
    addSpeechBubble,
    checkForInitialReactions,
    showEndOfHandReactions,
  } = useGameInteractions({
    activeConversation,
    setActiveConversation,
    setSpeechBubbles,
    registerTimeout,
    aiPlayers,
    dealerHand,
    blackjackPayout: gameSettings.blackjackPayout,
    addDebugLog,
  });

  // Game actions hook - provides startNewRound, dealInitialCards, hit, stand, doubleDown, split
  const { startNewRound, dealInitialCards, hit, stand, doubleDown, split } = useGameActions({
    phase,
    playerSeat,
    playerHand,
    dealerHand,
    aiPlayers,
    shoe,
    cardsDealt,
    runningCount,
    shoesDealt,
    gameSettings,
    currentDealer,
    playerChips,
    setPhase,
    setCurrentBet,
    setDealerRevealed,
    setDealerCallout,
    setPlayerHand,
    setDealerHand,
    setSpeechBubbles,
    setAIPlayers,
    setFlyingCards,
    setPlayerActions,
    setShoe,
    setCardsDealt,
    setRunningCount,
    setShoesDealt,
    setInsuranceOffered,
    setActivePlayerIndex,
    setPlayerFinished,
    setPlayerChips,
    dealCardFromShoe,
    registerTimeout,
    getCardPosition: (
      type: "ai" | "player" | "dealer" | "shoe",
      _aiPlayers?: AIPlayer[],
      _playerSeat?: number | null,
      index?: number,
      cardIndex?: number,
    ) => getCardPosition(type, aiPlayers, playerSeat, index, cardIndex),
    addSpeechBubble,
    showEndOfHandReactions,
    addDebugLog,
  });

  // Calculate true count for bet tracking
  const decksRemaining = calculateDecksRemaining(gameSettings.numberOfDecks * 52, cardsDealt);
  const trueCount = decksRemaining > 0
    ? calculateTrueCount(runningCount, decksRemaining)
    : 0;

  // Betting actions hook
  const { handleConfirmBet, handleClearBet, handleBetChange } =
    useBettingActions({
      currentBet,
      setCurrentBet,
      minBet,
      maxBet,
      playerChips,
      setPlayerChips,
      phase,
      playerSeat,
      aiPlayers,
      setPhase,
      setDealerRevealed,
      setPlayerHand,
      setDealerHand,
      setPreviousBet,
      setSpeechBubbles,
      setAIPlayers,
      dealInitialCards,
      registerTimeout,
      addDebugLog,
      trueCount,
      setBetHistory,
    });

  // Detect if player is counting cards (varying bet with count)
  // Check correlation between bet size and true count over last 10 hands
  const isPlayerCounting = betHistory.length >= 5 && (() => {
    // Calculate correlation between bets and true counts
    const avgBet = betHistory.reduce((sum, h) => sum + h.bet, 0) / betHistory.length;
    const avgCount = betHistory.reduce((sum, h) => sum + h.trueCount, 0) / betHistory.length;

    let correlation = 0;
    for (const hand of betHistory) {
      const betDiff = hand.bet - avgBet;
      const countDiff = hand.trueCount - avgCount;
      correlation += betDiff * countDiff;
    }

    // Positive correlation > threshold = counting
    // If player consistently bets more when count is higher, they're counting
    const isCorrelated = correlation > (minBet * betHistory.length * 0.5);

    if (isCorrelated) {
      addDebugLog(`Player IS counting (correlation: ${correlation.toFixed(2)})`);
    }

    return isCorrelated;
  })();

  // Conversation handlers hook
  const { handleConversationResponse, handleConversationIgnore } =
    useConversationHandlers({
      activeConversation,
      setActiveConversation,
      setSuspicionLevel,
      setPlayerSociability,
      setDealerSuspicion,
      playerSeat,
      currentDealer,
      isPlayerCounting,
      addSpeechBubble,
      addDebugLog,
    });

  // Insurance handlers
  const handleTakeInsurance = useCallback(() => {
    const insuranceCost = Math.floor(currentBet / 2);
    addDebugLog(`=== PLAYER TAKES INSURANCE for $${insuranceCost} ===`);

    if (playerChips >= insuranceCost) {
      setPlayerInsuranceBet(insuranceCost);
      setPlayerChips(playerChips - insuranceCost);
      setInsuranceOffered(false);
      addDebugLog(`Player chips after insurance: $${playerChips - insuranceCost}`);
    } else {
      addDebugLog("Player cannot afford insurance!");
    }
  }, [currentBet, playerChips, setPlayerChips, setPlayerInsuranceBet, setInsuranceOffered, addDebugLog]);

  const handleDeclineInsurance = useCallback(() => {
    addDebugLog("=== PLAYER DECLINES INSURANCE ===");
    setPlayerInsuranceBet(0);
    setInsuranceOffered(false);
  }, [setPlayerInsuranceBet, setInsuranceOffered, addDebugLog]);

  // Suspicion decay hook
  useSuspicionDecay(suspicionLevel, setSuspicionLevel);

  // Dealer suspicion hook - manages dealer-level detection and pit boss reporting
  useDealerSuspicion({
    currentDealer,
    dealerSuspicion,
    suspicionLevel,
    playerSeat,
    initialized,
    setDealerSuspicion,
    setSuspicionLevel,
    setPitBossDistance,
    addSpeechBubble,
  });

  // Wonging detection hook - detects betting high count / sitting out low count
  useWongingDetection({
    handNumber,
    playerSeat,
    playerBet: currentBet,
    trueCount,
    currentDealer,
    initialized,
    phase,
    setDealerSuspicion,
  });

  // Dealer change hook
  useDealerChange(
    shoesDealt,
    dealerChangeInterval,
    currentDealer,
    setCurrentDealer,
  );

  // Game initialization hook
  useGameInitialization(setAIPlayers, setCurrentDealer, setInitialized);

  // Conversation triggers hook
  useConversationTriggers({
    initialized,
    playerSeat,
    activeConversation,
    aiPlayers,
    currentDealer,
    playerSociability,
    phase,
    triggerConversation,
    addSpeechBubble,
  });

  // Pit boss movement hook
  usePitBossMovement(setPitBossDistance, suspicionLevel);

  // Heat map tracking hook - tracks pit boss proximity vs count for discretion analysis
  const { getHeatMapBuckets, getDiscretionScore, dataPointCount } = useHeatMap({
    trueCount: calculateDecksRemaining(gameSettings.numberOfDecks * 52, cardsDealt) > 0
      ? calculateTrueCount(runningCount, calculateDecksRemaining(gameSettings.numberOfDecks * 52, cardsDealt))
      : 0,
    pitBossDistance,
    currentBet,
    suspicionLevel,
    phase,
    initialized,
  });

  // Auto-start hand hook
  useAutoStartHand({
    initialized,
    aiPlayersLength: aiPlayers.length,
    handNumber,
    phase,
    playerSeat,
    currentBet,
    setPhase,
    setDealerRevealed,
    setPlayerHand,
    setDealerHand,
    setPlayerChips,
    setSpeechBubbles,
    setAIPlayers,
    aiPlayers,
    dealInitialCards,
    addSpeechBubble,
    registerTimeout,
  });

  // Log betting interface visibility conditions
  useEffect(() => {
    const shouldShowBetting =
      phase === "BETTING" && initialized && playerSeat !== null;
    addDebugLog(`=== BETTING INTERFACE CHECK ===`);
    addDebugLog(`Phase: ${phase}`);
    addDebugLog(`Initialized: ${initialized}`);
    addDebugLog(`Player seat: ${playerSeat}`);
    addDebugLog(`Should show betting interface: ${shouldShowBetting}`);
  }, [phase, initialized, playerSeat, addDebugLog]);

  // AI turns phase hook (handles its own reset logic internally)
  useAITurnsPhase({
    phase,
    aiPlayers,
    dealerHand,
    activePlayerIndex,
    playersFinished,
    playerSeat,
    playerHand,
    playerFinished,
    setActivePlayerIndex,
    setPlayersFinished,
    setPlayerActions,
    setAIPlayers,
    setFlyingCards,
    setPhase,
    dealCardFromShoe,
    registerTimeout,
    getCardPositionForAnimation: (
      type: "shoe" | "ai",
      aiIndex?: number,
      cardIndex?: number,
    ) => getCardPosition(type, aiPlayers, playerSeat, aiIndex, cardIndex),
    addSpeechBubble,
    addDebugLog,
  });

  // Dealing phase hook - marks blackjack hands as finished
  useDealingPhase({
    phase,
    aiPlayers,
    dealerHand,
    setPlayersFinished,
    setPlayerActions,
    registerTimeout,
    addDebugLog,
  });

  // Insurance phase hook - handles insurance decisions
  useInsurancePhase({
    phase,
    gameSettings,
    insuranceOffered,
    setInsuranceOffered,
    aiPlayers,
    setAIPlayers,
    playerSeat,
    playerInsuranceBet,
    setPhase,
    registerTimeout,
    addDebugLog,
  });

  // Next hand
  const nextHand = useCallback(() => {
    setHandNumber((prev) => prev + 1);
    setPhase("BETTING");
    setSpeechBubbles([]); // Clear speech bubbles from previous hand
    clearDebugLogs(); // Clear debug logs at start of new hand

    // Clear cards from previous hand
    setPlayerHand({ cards: [], bet: 0 });
    setDealerHand({ cards: [], bet: 0 });
    setCurrentBet(0);
    setDealerRevealed(false);
    setPlayerFinished(false);

    // Clear AI player cards
    setAIPlayers(prev => prev.map(ai => ({
      ...ai,
      hand: { cards: [], bet: 0 }
    })));
  }, [clearDebugLogs, setPlayerHand, setDealerHand, setCurrentBet, setDealerRevealed, setPlayerFinished, setAIPlayers]);

  // Round end phase hook
  useRoundEndPhase({
    phase,
    aiPlayers,
    playerSeat,
    cardsDealt,
    gameSettings,
    registerTimeout,
    setAIPlayers,
    setDealerCallout,
    addSpeechBubble,
    setShoe,
    setCardsDealt,
    setRunningCount,
    setShoesDealt,
    nextHand,
  });

  // Dealer turn phase hook
  useDealerTurnPhase({
    phase,
    dealerHand,
    aiPlayers,
    gameSettings,
    currentDealer,
    setDealerRevealed,
    setDealerHand,
    setDealerCallout,
    setFlyingCards,
    setPhase,
    dealCardFromShoe,
    registerTimeout,
    getCardPositionForAnimation: (
      type: "shoe" | "dealer",
      aiIndex?: number,
      cardIndex?: number,
    ) => getCardPosition(type, aiPlayers, playerSeat, aiIndex, cardIndex),
    addSpeechBubble,
    addDebugLog,
  });

  // Resolving phase hook
  useResolvingPhase({
    phase,
    playerHand,
    dealerHand,
    gameSettings,
    aiPlayers,
    playerSeat,
    currentDealer,
    previousBet,
    cardsDealt,
    runningCount,
    playerInsuranceBet,
    setPlayerInsuranceBet,
    setAIPlayers,
    setPlayerChips,
    setPlayerHand,
    setPitBossDistance,
    setSuspicionLevel,
    setDealerSuspicion,
    setPreviousBet,
    setDealerCallout,
    setWinLossBubbles,
    setPhase,
    registerTimeout,
    showEndOfHandReactions,
    addSpeechBubble,
    addDebugLog,
  });

  return (
    <>
      <BlackjackGameUI
        suspicionLevel={suspicionLevel}
        dealerSuspicion={dealerSuspicion}
        pitBossDistance={pitBossDistance}
        gameSettings={gameSettings}
        runningCount={runningCount}
        currentStreak={currentStreak}
        playerChips={playerChips}
        currentScore={currentScore}
        scoreMultiplier={scoreMultiplier}
        cardsDealt={cardsDealt}
        currentDealer={currentDealer}
        dealerCallout={dealerCallout}
        phase={phase}
        dealerHand={dealerHand}
        dealerRevealed={dealerRevealed}
        aiPlayers={aiPlayers}
        playerSeat={playerSeat}
        playerHand={playerHand}
        playerFinished={playerFinished}
        currentBet={currentBet}
        activePlayerIndex={activePlayerIndex}
        playerActions={playerActions}
        speechBubbles={speechBubbles}
        winLossBubbles={winLossBubbles}
        activeConversation={activeConversation}
        flyingCards={flyingCards}
        showDealerInfo={showDealerInfo}
        initialized={initialized}
        minBet={minBet}
        maxBet={maxBet}
        showSettings={showSettings}
        showLeaderboard={showLeaderboard}
        peakChips={peakChips}
        longestStreak={longestStreak}
        showStrategyCard={showStrategyCard}
        showHeatMap={showHeatMap}
        heatMapBuckets={getHeatMapBuckets()}
        discretionScore={getDiscretionScore()}
        heatMapDataPointCount={dataPointCount}
        debugLogs={debugLogs}
        showDebugLog={showDebugLog}
        insuranceOffered={insuranceOffered}
        handleTakeInsurance={handleTakeInsurance}
        handleDeclineInsurance={handleDeclineInsurance}
        setShowSettings={setShowSettings}
        setShowLeaderboard={setShowLeaderboard}
        setShowStrategyCard={setShowStrategyCard}
        setShowHeatMap={setShowHeatMap}
        setPlayerSeat={setPlayerSeat}
        addDebugLog={addDebugLog}
        startNewRound={startNewRound}
        hit={hit}
        stand={stand}
        doubleDown={doubleDown}
        split={split}
        handleConversationResponse={handleConversationResponse}
        handleConversationIgnore={handleConversationIgnore}
        setWinLossBubbles={setWinLossBubbles}
        setShowDealerInfo={setShowDealerInfo}
        handleBetChange={handleBetChange}
        handleConfirmBet={handleConfirmBet}
        handleClearBet={handleClearBet}
        setGameSettings={setGameSettings}
        setShowDebugLog={setShowDebugLog}
        clearDebugLogs={clearDebugLogs}
      />
      <BackgroundMusic />
    </>
  );
}
