import { useEffect, useRef } from "react";
import { AIPlayer, ActiveConversation, GamePhase } from "@/types/gameState";
import { DealerCharacter } from "@/data/dealerCharacters";
import {
  getDealerPlayerLine,
  getRandomAIConversation,
  getPlayerEngagement,
} from "@/data/dialogue";

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
  addSpeechBubble: (
    id: string,
    message: string,
    position: number,
    reactionType?:
      | "bust"
      | "hit21"
      | "goodHit"
      | "badStart"
      | "win"
      | "loss"
      | "dealer_blackjack"
      | "distraction",
    priority?: number,
  ) => void;
  registerTimeout: (callback: () => void, delay: number) => NodeJS.Timeout;
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
  registerTimeout,
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
          const dealerPosition = -1; // -1 indicates dealer position
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

  // AI-to-AI conversations (multi-turn exchanges)
  useEffect(() => {
    if (!initialized || aiPlayers.length < 2) return;

    const conversationInterval = setInterval(
      () => {
        // 50% chance for AI-to-AI conversation
        if (Math.random() < 0.5 && aiPlayers.length >= 2) {
          const conversation = getRandomAIConversation(aiPlayers);

          // Only proceed if we got a valid conversation (all participants are at table)
          if (conversation) {
            // Play out the conversation turns with timing
            conversation.forEach((turn, index) => {
              registerTimeout(() => {
                // Find the AI player with this characterId
                const speaker = aiPlayers.find(
                  (ai) => ai.character.id === turn.characterId,
                );
                if (speaker) {
                  addSpeechBubble(
                    `ai-conversation-${Date.now()}-${index}`,
                    turn.text,
                    speaker.position,
                    "distraction", // Conversation audio
                    1, // NORMAL priority for conversations
                  );
                }
              }, index * 3500); // 3.5 seconds between conversation turns
            });
          }
        }
        // 20% chance for simple banter (fallback)
        else if (Math.random() < 0.2) {
          const randomAI =
            aiPlayers[Math.floor(Math.random() * aiPlayers.length)];

          const message = getDealerPlayerLine(
            randomAI.character.id,
            "smallTalk",
          );

          if (message) {
            addSpeechBubble(randomAI.character.id, message, randomAI.position);
          }
        }
      },
      12000 + Math.random() * 8000, // Every 12-20 seconds
    );

    return () => clearInterval(conversationInterval);
  }, [initialized, phase, aiPlayers, addSpeechBubble]);
}
