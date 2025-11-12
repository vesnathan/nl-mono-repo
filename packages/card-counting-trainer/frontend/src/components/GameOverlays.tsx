import React from "react";
import { Button } from "@nextui-org/react";
import WinLossBubble from "@/components/WinLossBubble";
import SpeechBubble from "@/components/SpeechBubble";
import ConversationPrompt from "@/components/ConversationPrompt";
import FlyingCard from "@/components/FlyingCard";
import { useGameState } from "@/contexts/GameStateContext";
import { useGameActions } from "@/contexts/GameActionsContext";

export default function GameOverlays() {
  const {
    playerSeat,
    playerHand,
    currentBet,
    phase,
    speechBubbles,
    winLossBubbles,
    activeConversation,
    flyingCards,
  } = useGameState();
  const {
    startNewRound,
    handleConversationResponse,
    handleConversationIgnore,
    setWinLossBubbles,
    registerTimeout,
  } = useGameActions();
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

      {/* Speech Bubbles - only render visible ones */}
      {speechBubbles
        .filter((bubble) => bubble.visible)
        .map((bubble) => (
          <SpeechBubble
            key={bubble.playerId}
            position={bubble.position}
            message={bubble.message}
            playerId={bubble.playerId}
            isDealer={bubble.isDealer}
            playerPosition={bubble.playerPosition}
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
          registerTimeout={registerTimeout}
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
