import { useCallback } from "react";
import { ActiveConversation } from "@/types/gameState";

interface UseConversationHandlersParams {
  activeConversation: ActiveConversation | null;
  setActiveConversation: (conversation: ActiveConversation | null) => void;
  setSuspicionLevel: (level: number | ((prev: number) => number)) => void;
  setPlayerSociability: (level: number | ((prev: number) => number)) => void;
  playerSeat: number | null;
  addSpeechBubble: (id: string, message: string, position: number) => void;
}

export function useConversationHandlers({
  activeConversation,
  setActiveConversation,
  setSuspicionLevel,
  setPlayerSociability,
  playerSeat,
  addSpeechBubble,
}: UseConversationHandlersParams) {
  const handleConversationResponse = useCallback(
    (choiceIndex: number) => {
      if (!activeConversation) return;

      const choice = activeConversation.choices[choiceIndex];

      // Apply suspicion change
      if (choice.suspicionChange !== 0) {
        setSuspicionLevel((prev) =>
          Math.max(0, Math.min(100, prev + choice.suspicionChange)),
        );
      }

      // Adjust sociability based on response type
      if (choiceIndex === 0) {
        // Friendly response - people want to talk to you more
        setPlayerSociability((prev) => Math.min(100, prev + 3));
      } else if (choiceIndex === 1) {
        // Neutral - small increase
        setPlayerSociability((prev) => Math.min(100, prev + 1));
      } else if (choiceIndex === 2) {
        // Dismissive response - people talk to you less
        setPlayerSociability((prev) => Math.max(0, prev - 5));
      }

      // Show speech bubble with player's response
      if (playerSeat !== null) {
        addSpeechBubble("player-response", choice.text, playerSeat);
      }

      // Clear the conversation
      setActiveConversation(null);
    },
    [activeConversation, playerSeat, addSpeechBubble, setSuspicionLevel, setPlayerSociability, setActiveConversation],
  );

  const handleConversationIgnore = useCallback(() => {
    if (!activeConversation) return;

    // Ignoring conversations raises suspicion significantly
    setSuspicionLevel((prev) => Math.min(100, prev + 8));

    // Being unresponsive makes people avoid you
    setPlayerSociability((prev) => Math.max(0, prev - 8));

    // Show that player is too focused (suspicious)
    if (playerSeat !== null) {
      addSpeechBubble("player-ignore", "*concentrating intensely*", playerSeat);
    }

    setActiveConversation(null);
  }, [activeConversation, playerSeat, addSpeechBubble, setSuspicionLevel, setPlayerSociability, setActiveConversation]);

  return {
    handleConversationResponse,
    handleConversationIgnore,
  };
}
