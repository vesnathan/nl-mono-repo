import { useEffect } from "react";
import { AIPlayer, ActiveConversation, GamePhase } from "@/types/gameState";
import { DealerCharacter } from "@/data/dealerCharacters";
import { getDealerPlayerLine } from "@/data/dialogue";

interface UseConversationTriggersParams {
  initialized: boolean;
  playerSeat: number | null;
  activeConversation: ActiveConversation | null;
  aiPlayers: AIPlayer[];
  currentDealer: DealerCharacter | null;
  playerSociability: number;
  phase: GamePhase;
  triggerConversation: (
    speakerId: string,
    speakerName: string,
    position: number,
  ) => void;
  addSpeechBubble: (id: string, message: string, position: number) => void;
}

/**
 * Hook to handle periodic conversation triggers and AI banter
 */
export function useConversationTriggers({
  initialized,
  playerSeat,
  activeConversation,
  aiPlayers,
  currentDealer,
  playerSociability,
  phase,
  triggerConversation,
  addSpeechBubble,
}: UseConversationTriggersParams) {
  // Periodic conversation triggers (frequency based on player sociability)
  useEffect(() => {
    if (!initialized || playerSeat === null || activeConversation) return;

    const baseTriggerChance = 0.3;
    const sociabilityMultiplier = playerSociability / 50;
    const triggerChance = baseTriggerChance * sociabilityMultiplier;

    const baseInterval = 25000;
    const intervalVariation = 10000;
    const sociabilityIntervalMultiplier = Math.max(
      0.5,
      2 - playerSociability / 50,
    );

    const conversationInterval = setInterval(
      () => {
        const shouldTrigger = Math.random() < triggerChance;
        if (!shouldTrigger) return;

        if (Math.random() < 0.6 && aiPlayers.length > 0) {
          const randomAI =
            aiPlayers[Math.floor(Math.random() * aiPlayers.length)];
          triggerConversation(
            randomAI.character.id,
            randomAI.character.name,
            randomAI.position,
          );
        } else if (currentDealer) {
          const dealerPosition = 3;
          triggerConversation("dealer", currentDealer.name, dealerPosition);
        }
      },
      (baseInterval + Math.random() * intervalVariation) *
        sociabilityIntervalMultiplier,
    );

    return () => clearInterval(conversationInterval);
  }, [
    initialized,
    playerSeat,
    activeConversation,
    aiPlayers,
    currentDealer,
    triggerConversation,
    playerSociability,
  ]);

  // AI-to-AI and AI-to-Dealer banter (background conversation)
  useEffect(() => {
    if (!initialized || phase === "BETTING") return;

    const banterInterval = setInterval(
      () => {
        if (Math.random() < 0.2 && aiPlayers.length >= 2) {
          const randomAI =
            aiPlayers[Math.floor(Math.random() * aiPlayers.length)];

          const message = getDealerPlayerLine(
            randomAI.character.id,
            "smallTalk",
          );

          if (message) {
            addSpeechBubble(
              `ai-banter-${Date.now()}`,
              message,
              randomAI.position,
            );
          }
        }
      },
      15000 + Math.random() * 10000,
    );

    return () => clearInterval(banterInterval);
  }, [initialized, phase, aiPlayers, addSpeechBubble]);
}
