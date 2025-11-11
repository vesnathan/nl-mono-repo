import { useCallback } from "react";
import {
  AIPlayer,
  ActiveConversation,
  SpeechBubble,
  PlayerHand,
} from "@/types/gameState";
import { BlackjackPayout } from "@/types/gameSettings";
import {
  createConversation,
  createSpeechBubble,
} from "@/utils/conversationHelpers";
import {
  generateInitialReactions,
  generateEndOfHandReactions,
} from "@/utils/reactions";
import { AudioQueueHook, AudioPriority } from "@/hooks/useAudioQueue";
import { getPlayerAudioPath, mapOutcomeToAudioType } from "@/utils/audioHelpers";
import { getOrGenerateAudio } from "@/utils/dynamicTTS";

interface UseGameInteractionsParams {
  activeConversation: ActiveConversation | null;
  setActiveConversation: (conversation: ActiveConversation | null) => void;
  setSpeechBubbles: (
    bubbles: SpeechBubble[] | ((prev: SpeechBubble[]) => SpeechBubble[]),
  ) => void;
  registerTimeout: (callback: () => void, delay: number) => void;
  aiPlayers: AIPlayer[];
  dealerHand: PlayerHand;
  blackjackPayout: BlackjackPayout;
  addDebugLog: (message: string) => void;
  audioQueue: AudioQueueHook;
}

export function useGameInteractions({
  activeConversation,
  setActiveConversation,
  setSpeechBubbles,
  registerTimeout,
  aiPlayers,
  dealerHand,
  blackjackPayout,
  addDebugLog,
  audioQueue,
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
    (
      playerId: string,
      message: string,
      position: number,
      reactionType?: "bust" | "hit21" | "goodHit" | "badStart" | "win" | "loss" | "dealer_blackjack" | "distraction",
      priority: AudioPriority = AudioPriority.NORMAL
    ) => {
      setSpeechBubbles((prev) => {
        const existingBubble = prev.find((b) => b.playerId === playerId);

        // If player already has a visible bubble, skip this message
        if (existingBubble && existingBubble.visible) {
          addDebugLog(`Skipping message for ${playerId} - bubble already active`);
          return prev;
        }

        // Create position for the bubble
        const bubblePosition = createSpeechBubble(
          playerId,
          message,
          position,
          aiPlayers,
          addDebugLog,
        ).position;

        // Queue audio for reactions (pre-generated) or generate dynamically for dialogue
        if (playerId !== "dealer") {
          if (reactionType) {
            // Use pre-generated audio for reactions
            const audioPath = getPlayerAudioPath(playerId, reactionType);
            console.log(`[Audio Queue] Queueing pre-generated audio for ${playerId}: ${audioPath} (priority: ${priority})`);
            audioQueue.queueAudio({
              id: `${playerId}-${Date.now()}`,
              audioPath,
              priority,
              playerId,
              message,
              position: bubblePosition,
            });
          } else {
            // Generate audio dynamically for dialogue/conversations
            getOrGenerateAudio(message, playerId)
              .then((audioUrl) => {
                if (audioUrl) {
                  console.log(`[Audio Queue] Queueing dynamic audio for ${playerId}: ${audioUrl} (priority: ${priority})`);
                  audioQueue.queueAudio({
                    id: `${playerId}-${Date.now()}`,
                    audioPath: audioUrl,
                    priority,
                    playerId,
                    message,
                    position: bubblePosition,
                  });
                }
              })
              .catch((error) => {
                console.error(`[Audio Queue] Failed to generate audio for ${playerId}:`, error);
              });
          }
        }

        // Clear any existing hide timeout
        if (existingBubble?.hideTimeoutId) {
          clearTimeout(existingBubble.hideTimeoutId);
        }

        // Schedule hide after 5 seconds
        const timeoutId = window.setTimeout(() => {
          setSpeechBubbles((bubbles) =>
            bubbles.map((b) =>
              b.playerId === playerId ? { ...b, visible: false } : b
            )
          );
        }, 5000);

        // Update or create the bubble
        if (existingBubble) {
          return prev.map((b) =>
            b.playerId === playerId
              ? { ...b, message, visible: true, hideTimeoutId: timeoutId }
              : b
          );
        } else {
          return [
            ...prev,
            {
              playerId,
              message,
              position: bubblePosition,
              visible: true,
              hideTimeoutId: timeoutId,
            },
          ];
        }
      });
    },
    [aiPlayers, addDebugLog, setSpeechBubbles, audioQueue],
  );

  const checkForInitialReactions = useCallback(() => {
    // Pass dealer's up card for context-aware reactions
    const dealerUpCard = dealerHand.cards.length > 0 ? dealerHand.cards[0] : undefined;
    const selectedReactions = generateInitialReactions(aiPlayers, dealerUpCard);

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
            reaction.audioType, // Pass audio type
            reaction.audioPriority, // Pass priority
          );
        }
      }, idx * 600);
    });
  }, [aiPlayers, dealerHand.cards, addSpeechBubble]);

  const showEndOfHandReactions = useCallback(() => {
    const selectedReactions = generateEndOfHandReactions(
      aiPlayers,
      dealerHand,
      blackjackPayout,
    );

    selectedReactions.forEach((reaction, idx) => {
      registerTimeout(() => {
        addSpeechBubble(
          reaction.playerId, // Use playerId directly
          reaction.message,
          reaction.position,
          reaction.audioType, // Pass audio type from reaction
          reaction.audioPriority, // Pass priority from reaction
        );
      }, idx * 1000); // Stagger by 1 second to avoid overlap
    });
  }, [
    aiPlayers,
    dealerHand,
    blackjackPayout,
    registerTimeout,
    addSpeechBubble,
  ]);

  return {
    triggerConversation,
    addSpeechBubble,
    checkForInitialReactions,
    showEndOfHandReactions,
  };
}
