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
import { AudioPriority } from "@/hooks/useAudioQueue";
import { mapOutcomeToAudioType } from "@/utils/audioHelpers";
import { debugLog } from "@/utils/debug";
import { DealerCharacter } from "@/data/dealerCharacters";

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
  currentDealer: DealerCharacter | null;
}

export function useGameInteractions({
  activeConversation,
  setActiveConversation,
  setSpeechBubbles,
  registerTimeout,
  aiPlayers,
  dealerHand,
  blackjackPayout,
  currentDealer,
}: UseGameInteractionsParams) {
  const triggerConversation = useCallback(
    (speakerId: string, speakerName: string, position: number) => {
      // DISABLED FOR TESTING: All player conversations disabled
      // Don't trigger if there's already an active conversation
      // if (activeConversation) return;
      // const conversation = createConversation(speakerId, speakerName, position);
      // setActiveConversation(conversation);
    },
    [activeConversation, setActiveConversation],
  );

  const addSpeechBubble = useCallback(
    (
      playerId: string,
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
      dealerVoiceLine?:
        | "place_bets"
        | "dealer_busts"
        | "dealer_has_17"
        | "dealer_has_18"
        | "dealer_has_19"
        | "dealer_has_20"
        | "dealer_has_21",
      priority: AudioPriority = AudioPriority.NORMAL,
    // eslint-disable-next-line sonarjs/cognitive-complexity
    ) => {
      // Unified speech bubble implementation for all players (dealer and AI)
      // Pattern: Speech bubble ALWAYS created first, then audio queued if file exists

      // Create full bubble object (outside setState to avoid double-execution)
      const bubbleData = createSpeechBubble(
        playerId,
        message,
        position,
        aiPlayers,
      );

      // Create the speech bubble first (invisible, will be shown when audio plays)
      setSpeechBubbles((prev) => {
        const existingBubble = prev.find((b) => b.playerId === playerId);

        // If player already has a visible bubble, skip this message
        if (existingBubble && existingBubble.visible) {
          debugLog(
            "gamePhases",
            `Skipping message for ${playerId} - bubble already active`,
          );
          return prev;
        }

        // Update or create the bubble (invisible initially)
        if (existingBubble) {
          return prev.map((b) =>
            b.playerId === playerId
              ? {
                  ...b,
                  message,
                  visible: false,
                  hideTimeoutId: undefined,
                  isDealer: bubbleData.isDealer,
                  playerPosition: bubbleData.playerPosition,
                }
              : b,
          );
        }
        return [
          ...prev,
          {
            playerId,
            message,
            position: bubbleData.position,
            hideTimeoutId: undefined,
            visible: false, // Start invisible
            isDealer: bubbleData.isDealer,
            playerPosition: bubbleData.playerPosition,
          },
        ];
      });

      // Show speech bubble immediately (no audio)
      setSpeechBubbles((bubbles) =>
        bubbles.map((b) =>
          b.playerId === playerId ? { ...b, visible: true } : b,
        ),
      );

      // Schedule hide after 5 seconds
      registerTimeout(() => {
        setSpeechBubbles((bubbles) =>
          bubbles.map((b) =>
            b.playerId === playerId ? { ...b, visible: false } : b,
          ),
        );
      }, 5000);
    },
    [aiPlayers, setSpeechBubbles], // Removed audioQueue - callback uses current value
  );

  const checkForInitialReactions = useCallback(() => {
    // Pass dealer's up card for context-aware reactions
    const dealerUpCard =
      dealerHand.cards.length > 0 ? dealerHand.cards[0] : undefined;
    const selectedReactions = generateInitialReactions(aiPlayers, dealerUpCard);

    // Show speech bubbles
    selectedReactions.forEach((reaction, idx) => {
      registerTimeout(() => {
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
  }, [aiPlayers, dealerHand.cards, addSpeechBubble, registerTimeout]);

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
