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
import {
  getPlayerAudioPath,
  getDealerAudioPath,
  mapOutcomeToAudioType,
} from "@/utils/audioHelpers";
import { getOrGenerateAudio } from "@/utils/dynamicTTS";
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
  audioQueue: AudioQueueHook;
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
  audioQueue,
  currentDealer,
}: UseGameInteractionsParams) {
  const triggerConversation = useCallback(
    (speakerId: string, speakerName: string, position: number) => {
      // DISABLED FOR TESTING: All player conversations disabled
      return;

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
      priority: AudioPriority = AudioPriority.NORMAL,
      dealerVoiceLine?:
        | "place_bets"
        | "dealer_busts"
        | "dealer_has_17"
        | "dealer_has_18"
        | "dealer_has_19"
        | "dealer_has_20"
        | "dealer_has_21",
    ) => {
      // Unified speech bubble implementation for all players (dealer and AI)
      // Pattern: Speech bubble ALWAYS created first, then audio queued if file exists

      // Create position for the bubble (outside setState to avoid double-execution)
      const bubblePosition = createSpeechBubble(
        playerId,
        message,
        position,
        aiPlayers,
      ).position;

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
              ? { ...b, message, visible: false, hideTimeoutId: undefined }
              : b,
          );
        } else {
          return [
            ...prev,
            {
              playerId,
              message,
              position: bubblePosition,
              hideTimeoutId: undefined,
              visible: false, // Start invisible
            },
          ];
        }
      });

      // Callback to show bubble when audio starts playing
      const showBubble = () => {
        setSpeechBubbles((bubbles) =>
          bubbles.map((b) =>
            b.playerId === playerId ? { ...b, visible: true } : b,
          ),
        );

        // Schedule hide after 5 seconds from when audio starts
        registerTimeout(() => {
          setSpeechBubbles((bubbles) =>
            bubbles.map((b) =>
              b.playerId === playerId ? { ...b, visible: false } : b,
            ),
          );
        }, 5000);
      };

      // Queue audio - unified for both dealer and AI players (outside setState to avoid double-execution)
      if (playerId === "dealer" && dealerVoiceLine && currentDealer) {
        // Dealer audio - check if pre-generated file exists
        const audioPath = getDealerAudioPath(currentDealer.id, dealerVoiceLine);
        debugLog(
          "audioQueue",
          `[Audio Queue] Checking dealer audio: ${audioPath}`,
        );

        fetch(audioPath, { method: "HEAD" })
          .then((response) => {
            if (response.ok) {
              // File exists, queue it
              debugLog(
                "audioQueue",
                `[Audio Queue] File exists, queueing dealer audio: ${audioPath} (priority: ${priority})`,
              );
              audioQueue.queueAudio({
                id: `dealer-${Date.now()}`,
                audioPath,
                priority,
                playerId,
                message,
                onPlay: showBubble,
              });
            } else {
              debugLog(
                "audioQueue",
                `[Audio Queue] Dealer file not found: ${audioPath} - generating for future use`,
              );
              // Generate the audio for next time (don't queue it this time)
              getOrGenerateAudio(message, currentDealer.id).catch((error) => {
                debugLog(
                  "audioQueue",
                  `[Audio Queue] Failed to generate ${audioPath}:`,
                  error,
                );
              });
            }
          })
          .catch((error) => {
            debugLog(
              "audioQueue",
              `[Audio Queue] Error checking dealer file: ${audioPath}`,
              error,
            );
          });
      } else if (playerId !== "dealer") {
        // AI player audio
        if (reactionType) {
          // Check if pre-generated audio file exists, queue only if it does
          const audioPath = getPlayerAudioPath(playerId, reactionType);
          debugLog(
            "audioQueue",
            `[Audio Queue] Checking pre-generated audio for ${playerId}: ${audioPath}`,
          );

          fetch(audioPath, { method: "HEAD" })
            .then((response) => {
              if (response.ok) {
                // File exists, queue it
                debugLog(
                  "audioQueue",
                  `[Audio Queue] File exists, queueing for ${playerId}: ${audioPath} (priority: ${priority})`,
                );
                audioQueue.queueAudio({
                  id: `${playerId}-${Date.now()}`,
                  audioPath,
                  priority,
                  playerId,
                  message,
                  position: bubblePosition,
                  onPlay: showBubble,
                });
              } else {
                debugLog(
                  "audioQueue",
                  `[Audio Queue] File not found for ${playerId}: ${audioPath} - generating for future use`,
                );
                // Generate the audio for next time (don't queue it this time)
                getOrGenerateAudio(message, playerId).catch((error) => {
                  debugLog(
                    "audioQueue",
                    `[Audio Queue] Failed to generate ${audioPath}:`,
                    error,
                  );
                });
              }
            })
            .catch((error) => {
              debugLog(
                "audioQueue",
                `[Audio Queue] Error checking file for ${playerId}: ${audioPath}`,
                error,
              );
            });
        } else {
          // Generate audio dynamically for dialogue/conversations
          getOrGenerateAudio(message, playerId)
            .then((audioUrl) => {
              if (audioUrl) {
                debugLog(
                  "audioQueue",
                  `[Audio Queue] Queueing dynamic audio for ${playerId}: ${audioUrl} (priority: ${priority})`,
                );
                audioQueue.queueAudio({
                  id: `${playerId}-${Date.now()}`,
                  audioPath: audioUrl,
                  priority,
                  playerId,
                  message,
                  position: bubblePosition,
                  onPlay: showBubble,
                });
              }
            })
            .catch((error) => {
              console.error(
                `[Audio Queue] Failed to generate audio for ${playerId}:`,
                error,
              );
            });
        }
      }
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
