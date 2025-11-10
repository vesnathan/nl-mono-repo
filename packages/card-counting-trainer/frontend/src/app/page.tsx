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
import { useDealerChange } from "@/hooks/useDealerChange";
import { useGameInitialization } from "@/hooks/useGameInitialization";
import { useTimedChallenge } from "@/hooks/useTimedChallenge";
import { useConversationTriggers } from "@/hooks/useConversationTriggers";
import { usePitBossMovement } from "@/hooks/usePitBossMovement";
import { useAutoStartHand } from "@/hooks/useAutoStartHand";
import { useGameInteractions } from "@/hooks/useGameInteractions";
import { useRoundEndPhase } from "@/hooks/useRoundEndPhase";
import { useDealerTurnPhase } from "@/hooks/useDealerTurnPhase";
import { useResolvingPhase } from "@/hooks/useResolvingPhase";
import { useAITurnsPhase } from "@/hooks/useAITurnsPhase";
import { useDealingPhase } from "@/hooks/useDealingPhase";
import BlackjackGameUI from "@/components/BlackjackGameUI";

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
  const [showDealerInfo, setShowDealerInfo] = useState(false);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showStrategyCard, setShowStrategyCard] = useState(false);
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

  // Flying card animations
  const [flyingCards, setFlyingCards] = useState<FlyingCardData[]>([]);

  // Dealer callouts
  const [dealerCallout, setDealerCallout] = useState<string | null>(null);

  // Timed challenge mode
  const [timeRemaining, setTimeRemaining] = useState(300); // 5 minutes in seconds
  const [timedChallengeActive, setTimedChallengeActive] = useState(false);

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

  // Game actions hook - provides startNewRound, dealInitialCards, hit, stand
  const { startNewRound, dealInitialCards, hit, stand } = useGameActions({
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
    addDebugLog,
  });

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
      addDebugLog,
    });

  // Conversation handlers hook
  const { handleConversationResponse, handleConversationIgnore } =
    useConversationHandlers({
      activeConversation,
      setActiveConversation,
      setSuspicionLevel,
      setPlayerSociability,
      playerSeat,
      addSpeechBubble,
    });

  // Suspicion decay hook
  useSuspicionDecay(suspicionLevel, setSuspicionLevel);

  // Dealer change hook
  useDealerChange(
    shoesDealt,
    dealerChangeInterval,
    currentDealer,
    setCurrentDealer,
  );

  // Game initialization hook
  useGameInitialization(setAIPlayers, setCurrentDealer, setInitialized);

  // Timed challenge hook
  useTimedChallenge(
    gameSettings.trainingMode,
    timedChallengeActive,
    setTimedChallengeActive,
    timeRemaining,
    setTimeRemaining,
  );

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

  // Next hand
  const nextHand = useCallback(() => {
    setHandNumber((prev) => prev + 1);
    setPhase("BETTING");
    setSpeechBubbles([]); // Clear speech bubbles from previous hand
    clearDebugLogs(); // Clear debug logs at start of new hand
  }, [clearDebugLogs]);

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
    setPlayerChips,
    setPlayerHand,
    setPitBossDistance,
    setSuspicionLevel,
    setPreviousBet,
    setDealerCallout,
    setWinLossBubbles,
    setPhase,
    registerTimeout,
    showEndOfHandReactions,
    addDebugLog,
  });

  return (
    <BlackjackGameUI
      suspicionLevel={suspicionLevel}
      dealerSuspicion={dealerSuspicion}
      pitBossDistance={pitBossDistance}
      gameSettings={gameSettings}
      runningCount={runningCount}
      timeRemaining={timeRemaining}
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
      debugLogs={debugLogs}
      showDebugLog={showDebugLog}
      setShowSettings={setShowSettings}
      setShowLeaderboard={setShowLeaderboard}
      setShowStrategyCard={setShowStrategyCard}
      setPlayerSeat={setPlayerSeat}
      addDebugLog={addDebugLog}
      startNewRound={startNewRound}
      hit={hit}
      stand={stand}
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
  );
}
