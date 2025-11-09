import React from "react";
import { Button } from "@nextui-org/react";
import {
  GamePhase,
  PlayerHand,
  SpeechBubble,
  WinLossBubbleData,
  ActiveConversation,
  FlyingCardData,
} from "@/types/gameState";
import { isBusted } from "@/lib/gameActions";
import WinLossBubble from "@/components/WinLossBubble";
import ConversationPrompt from "@/components/ConversationPrompt";
import FlyingCard from "@/components/FlyingCard";

interface GameOverlaysProps {
  // Player state
  playerSeat: number | null;
  playerHand: PlayerHand;
  currentBet: number;
  phase: GamePhase;

  // Overlays
  speechBubbles: SpeechBubble[];
  winLossBubbles: WinLossBubbleData[];
  activeConversation: ActiveConversation | null;
  flyingCards: FlyingCardData[];

  // Actions
  startNewRound: () => void;
  hit: () => void;
  stand: () => void;
  handleConversationResponse: (suspicionChange: number) => void;
  handleConversationIgnore: () => void;
  setWinLossBubbles: React.Dispatch<React.SetStateAction<WinLossBubbleData[]>>;
}

export default function GameOverlays({
  playerSeat,
  playerHand,
  currentBet,
  phase,
  speechBubbles,
  winLossBubbles,
  activeConversation,
  flyingCards,
  startNewRound,
  hit,
  stand,
  handleConversationResponse,
  handleConversationIgnore,
  setWinLossBubbles,
}: GameOverlaysProps) {
  return (
    <>
      {/* Action Buttons - Positioned below player spot */}
      {playerSeat !== null && (
        <div
          style={{
            position: "absolute",
            bottom: "180px",
            left: "50%",
            transform: "translateX(-50%)",
          }}
        >
          {/* Actions */}
          {phase === "BETTING" && (
            <div className="flex gap-4 justify-center">
              <Button
                size="lg"
                onPress={startNewRound}
                style={{
                  backgroundColor: "#4CAF50",
                  color: "white",
                  fontWeight: "bold",
                  fontSize: "16px",
                  padding: "12px 24px",
                }}
              >
                Deal (Bet: ${currentBet})
              </Button>
            </div>
          )}

          {phase === "PLAYER_TURN" && !isBusted(playerHand.cards) && (
            <div className="flex gap-4 justify-center">
              <Button
                size="lg"
                onPress={hit}
                style={{
                  backgroundColor: "#4CAF50",
                  color: "white",
                  fontWeight: "bold",
                  fontSize: "16px",
                  padding: "12px 24px",
                }}
              >
                HIT
              </Button>
              <Button
                size="lg"
                onPress={stand}
                style={{
                  backgroundColor: "#4CAF50",
                  color: "white",
                  fontWeight: "bold",
                  fontSize: "16px",
                  padding: "12px 24px",
                }}
              >
                STAND
              </Button>
            </div>
          )}

          {phase === "ROUND_END" && (
            <div className="flex gap-4 justify-center flex-col items-center">
              <div className="text-white text-xl">
                {playerHand.result === "WIN" && "You Win!"}
                {playerHand.result === "LOSE" && "You Lose"}
                {playerHand.result === "PUSH" && "Push"}
                {playerHand.result === "BUST" && "Bust!"}
                {playerHand.result === "BLACKJACK" && "Blackjack!"}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Speech Bubbles */}
      {speechBubbles.map((bubble) => (
        <WinLossBubble
          key={bubble.id}
          position={bubble.position}
          message={bubble.message}
        />
      ))}

      {/* Win/Loss Result Bubbles */}
      {winLossBubbles.map((bubble) => (
        <WinLossBubble
          key={bubble.id}
          position={bubble.position}
          result={bubble.result}
          onComplete={() => {
            setWinLossBubbles((prev) => prev.filter((b) => b.id !== bubble.id));
          }}
        />
      ))}

      {/* Active Conversation Prompt */}
      {activeConversation && (
        <ConversationPrompt
          speakerId={activeConversation.speakerId}
          speakerName={activeConversation.speakerName}
          question={activeConversation.question}
          choices={activeConversation.choices}
          position={activeConversation.position}
          onResponse={handleConversationResponse}
          onIgnore={handleConversationIgnore}
        />
      )}

      {/* Flying Cards Animations */}
      {flyingCards.map((flyingCard) => (
        <FlyingCard
          key={flyingCard.id}
          rank={flyingCard.card.rank}
          suit={flyingCard.card.suit}
          fromPosition={flyingCard.fromPosition}
          toPosition={flyingCard.toPosition}
          onAnimationComplete={() => {
            // Card removal is handled in the dealInitialCards timeout
          }}
        />
      ))}
    </>
  );
}
