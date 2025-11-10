import { ActiveConversation, SpeechBubble, AIPlayer } from "@/types/gameState";
import { getDealerPlayerLine, getPlayerEngagement } from "@/data/dialogue";
import { TABLE_POSITIONS } from "@/constants/animations";
import { calculateHandValue } from "@/lib/gameActions";

/**
 * Create a conversation prompt for the player to respond to
 *
 * @param speakerId - ID of the speaker (AI character ID or "dealer")
 * @param speakerName - Display name of the speaker
 * @param position - Table position (0-7)
 * @returns ActiveConversation object ready to display
 */
export function createConversation(
  speakerId: string,
  speakerName: string,
  position: number,
): ActiveConversation {
  const [x, y] = TABLE_POSITIONS[position] || TABLE_POSITIONS[0];

  // Get character-specific or dealer dialogue
  let question: string;
  if (speakerId === "dealer") {
    question = getDealerPlayerLine("generic", "dealerQuestions");
  } else {
    // Try to get player engagement prompt first (30% chance)
    const engagementPrompt = Math.random() < 0.3 ? getPlayerEngagement(speakerId) : null;

    if (engagementPrompt) {
      question = engagementPrompt;
    } else {
      // Fallback to playerQuestions from dealer-player conversations
      question = getDealerPlayerLine(speakerId, "playerQuestions");
    }
  }

  // Create response choices
  const choices = [
    { text: "Sure, yeah...", suspicionChange: -2 }, // Friendly, reduces suspicion slightly
    { text: "*nods politely*", suspicionChange: 0 }, // Neutral
    { text: "*focuses on cards*", suspicionChange: 5 }, // Ignoring - increases suspicion
  ];

  return {
    id: `conv-${Date.now()}`,
    speakerId,
    speakerName,
    question,
    choices,
    position: { left: `${x}%`, top: `${y}%` },
  };
}

/**
 * Create a speech bubble for display
 *
 * @param playerId - Unique ID for this speech bubble
 * @param message - Message text to display
 * @param position - Table position (0-7)
 * @param aiPlayers - Array of AI players (for logging purposes)
 * @param addDebugLog - Debug logging function
 * @returns SpeechBubble object ready to display
 */
export function createSpeechBubble(
  playerId: string,
  message: string,
  position: number,
  aiPlayers: AIPlayer[],
  addDebugLog?: (message: string) => void,
): SpeechBubble {
  // Find the character name and hand for logging
  const player = aiPlayers.find((p) => p.character.id === playerId);
  const characterName = player?.character?.name || playerId;
  const hand = player?.hand?.cards || [];
  const handStr = hand.map((c) => `${c.rank}${c.suit}`).join(", ");
  const handValue = hand.length > 0 ? calculateHandValue(hand) : 0;

  if (addDebugLog) {
    addDebugLog(
      `💬 ${characterName} [Hand: ${handStr} (${handValue})]: "${message}"`,
    );
  }

  const [x, y] = TABLE_POSITIONS[position] || TABLE_POSITIONS[0];

  return {
    playerId,
    message,
    position: { left: `${x}%`, top: `${y}%` },
    visible: true,
  };
}
