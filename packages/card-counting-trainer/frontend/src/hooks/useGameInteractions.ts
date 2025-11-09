import { useCallback } from "react";
import { AIPlayer, ActiveConversation, SpeechBubble } from "@/types/gameState";
import { createConversation, createSpeechBubble } from "@/utils/conversationHelpers";
import { generateInitialReactions } from "@/utils/reactions";

interface UseGameInteractionsParams {
  activeConversation: ActiveConversation | null;
  setActiveConversation: (conversation: ActiveConversation | null) => void;
  setSpeechBubbles: (bubbles: SpeechBubble[] | ((prev: SpeechBubble[]) => SpeechBubble[])) => void;
  registerTimeout: (callback: () => void, delay: number) => void;
  aiPlayers: AIPlayer[];
  addDebugLog: (message: string) => void;
}

export function useGameInteractions({
  activeConversation,
  setActiveConversation,
  setSpeechBubbles,
  registerTimeout,
  aiPlayers,
  addDebugLog,
}: UseGameInteractionsParams) {
  const triggerConversation = useCallback(
    (speakerId: string, speakerName: string, position: number) => {
      // Don't trigger if there's already an active conversation
      if (activeConversation) return;

      const conversation = createConversation(speakerId, speakerName, position);
      setActiveConversation(conversation);
    },
    [activeConversation, setActiveConversation],
  );

  const addSpeechBubble = useCallback(
    (playerId: string, message: string, position: number) => {
      const bubble = createSpeechBubble(
        playerId,
        message,
        position,
        aiPlayers,
        addDebugLog,
      );

      setSpeechBubbles((prev) => [...prev, bubble]);

      registerTimeout(() => {
        setSpeechBubbles((prev) => prev.filter((b) => b.id !== bubble.id));
      }, 12000); // Increased to 12 seconds - speech bubbles stay visible longer
    },
    [registerTimeout, aiPlayers, addDebugLog, setSpeechBubbles],
  );

  const checkForInitialReactions = useCallback(() => {
    const selectedReactions = generateInitialReactions(aiPlayers);

    // Show speech bubbles
    selectedReactions.forEach((reaction, idx) => {
      setTimeout(() => {
        const aiPlayer = aiPlayers.find(
          (ai) => ai.character.id === reaction.playerId,
        );
        if (aiPlayer) {
          addSpeechBubble(
            reaction.playerId,
            reaction.message,
            aiPlayer.position,
          );
        }
      }, idx * 600);
    });
  }, [aiPlayers, addSpeechBubble]);

  return {
    triggerConversation,
    addSpeechBubble,
    checkForInitialReactions,
  };
}
