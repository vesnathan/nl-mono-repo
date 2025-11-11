import { useCallback } from "react";
import { debugLog } from "@/utils/debug";
import { ActiveConversation } from "@/types/gameState";
import { DealerCharacter } from "@/data/dealerCharacters";
import { increaseDealerSuspicion } from "./useDealerSuspicion";

interface UseConversationHandlersParams {
  activeConversation: ActiveConversation | null;
  setActiveConversation: (conversation: ActiveConversation | null) => void;
  setSuspicionLevel: (level: number | ((prev: number) => number)) => void;
  setPlayerSociability: (level: number | ((prev: number) => number)) => void;
  setDealerSuspicion: (level: number | ((prev: number) => number)) => void;
  playerSeat: number | null;
  currentDealer: DealerCharacter | null;
  isPlayerCounting: boolean; // Whether player is actually varying bets with count
  addSpeechBubble: (id: string, message: string, position: number) => void;
}

export function useConversationHandlers({
  activeConversation,
  setActiveConversation,
  setSuspicionLevel,
  setPlayerSociability,
  setDealerSuspicion,
  playerSeat,
  currentDealer,
  isPlayerCounting,
  addSpeechBubble,
}: UseConversationHandlersParams) {
  const handleConversationResponse = useCallback(
    (choiceIndex: number) => {
      if (!activeConversation) return;

      const choice = activeConversation.choices[choiceIndex];

      debugLog('conversations', `=== CONVERSATION RESPONSE (Choice ${choiceIndex}) ===`);
      debugLog('conversations', `Player chose: "${choice.text}"`);
      debugLog('conversations', `Suspicion change: ${choice.suspicionChange}`);
      debugLog('conversations', `Is player counting: ${isPlayerCounting}`);

      // Apply pit boss suspicion change
      if (choice.suspicionChange !== 0) {
        debugLog('conversations', `Pit boss suspicion: ${choice.suspicionChange > 0 ? "+" : ""}${choice.suspicionChange}`);
        setSuspicionLevel((prev) =>
          Math.max(0, Math.min(100, prev + choice.suspicionChange)),
        );
      }

      // Dealer notices if you're too focused/distracted when counting
      // Engaging in conversation when counting = suspicious (trying to act natural)
      // Being dismissive when counting = very suspicious (too focused on cards)
      // UNLESS dealer is on your side - they don't care if you count
      if (isPlayerCounting && currentDealer && !currentDealer.onYourSide) {
        let dealerSuspicionChange = 0;

        if (choiceIndex === 0) {
          // Friendly response while counting - slightly suspicious
          // Dealer thinks: "Why are they being so chatty while concentrating?"
          dealerSuspicionChange = 2;
          debugLog('conversations', `Friendly response while counting → +2 dealer suspicion (${currentDealer.name})`);
        } else if (choiceIndex === 1) {
          // Neutral response while counting - minimal suspicion
          dealerSuspicionChange = 0.5;
          debugLog('conversations', `Neutral response while counting → +0.5 dealer suspicion (${currentDealer.name})`);
        } else if (choiceIndex === 2) {
          // Dismissive response while counting - very suspicious
          // Dealer thinks: "They're too focused, must be counting"
          dealerSuspicionChange = 4;
          debugLog('conversations', `Dismissive response while counting → +4 dealer suspicion (${currentDealer.name})`);
        }

        if (dealerSuspicionChange > 0) {
          increaseDealerSuspicion(currentDealer, dealerSuspicionChange, setDealerSuspicion);
        }
      } else if (isPlayerCounting && currentDealer && currentDealer.onYourSide) {
        // Dealer is on your side - they know you're counting but don't care
        debugLog('conversations', `${currentDealer.name} is on your side - no dealer suspicion added`);

        // In fact, being social helps you blend in
        if (choiceIndex === 0) {
          debugLog('conversations', "Friendly response (dealer on your side) → helps camouflage");
        }
      } else if (!isPlayerCounting) {
        // Not counting - normal social behavior doesn't raise dealer suspicion
        // In fact, being friendly/social lowers dealer suspicion slightly
        if (choiceIndex === 0) {
          // Friendly response - dealer relaxes a bit
          debugLog('conversations', "Friendly response (not counting) → -1 dealer suspicion");
          setDealerSuspicion((prev) => Math.max(0, prev - 1));
        }
      }

      // Adjust sociability based on response type
      if (choiceIndex === 0) {
        // Friendly response - people want to talk to you more
        setPlayerSociability((prev) => Math.min(100, prev + 3));
        debugLog('conversations', "Sociability: +3 (friendly)");
      } else if (choiceIndex === 1) {
        // Neutral - small increase
        setPlayerSociability((prev) => Math.min(100, prev + 1));
        debugLog('conversations', "Sociability: +1 (neutral)");
      } else if (choiceIndex === 2) {
        // Dismissive response - people talk to you less
        setPlayerSociability((prev) => Math.max(0, prev - 5));
        debugLog('conversations', "Sociability: -5 (dismissive)");
      }

      // Show speech bubble with player's response
      if (playerSeat !== null) {
        addSpeechBubble("player-response", choice.text, playerSeat);
      }

      // Clear the conversation
      setActiveConversation(null);
    },
    [
      activeConversation,
      playerSeat,
      currentDealer,
      isPlayerCounting,
      addSpeechBubble,
      setSuspicionLevel,
      setPlayerSociability,
      setDealerSuspicion,
      setActiveConversation,
    ],
  );

  const handleConversationIgnore = useCallback(() => {
    if (!activeConversation) return;

    debugLog('conversations', `=== CONVERSATION IGNORED ===`);
    debugLog('conversations', `Is player counting: ${isPlayerCounting}`);

    // Ignoring conversations raises pit boss suspicion significantly
    debugLog('conversations', "Pit boss suspicion: +8 (ignored conversation)");
    setSuspicionLevel((prev) => Math.min(100, prev + 8));

    // Being unresponsive makes people avoid you
    debugLog('conversations', "Sociability: -8 (ignored)");
    setPlayerSociability((prev) => Math.max(0, prev - 8));

    // Dealer notices when you ignore people - VERY suspicious if counting
    // UNLESS dealer is on your side
    if (currentDealer && !currentDealer.onYourSide) {
      if (isPlayerCounting) {
        // Ignoring while counting = extremely suspicious
        // Dealer thinks: "They're too focused on the cards to even respond"
        debugLog('conversations', `Ignored while counting → +6 dealer suspicion (${currentDealer.name})`);
        increaseDealerSuspicion(currentDealer, 6, setDealerSuspicion);
      } else {
        // Ignoring while not counting = rude but not as suspicious
        debugLog('conversations', `Ignored while not counting → +2 dealer suspicion (${currentDealer.name})`);
        increaseDealerSuspicion(currentDealer, 2, setDealerSuspicion);
      }
    } else if (currentDealer && currentDealer.onYourSide) {
      debugLog('conversations', `${currentDealer.name} is on your side - ignoring doesn't raise dealer suspicion`);
    }

    // Show that player is too focused (suspicious)
    if (playerSeat !== null) {
      addSpeechBubble("player-ignore", "*concentrating intensely*", playerSeat);
    }

    setActiveConversation(null);
  }, [
    activeConversation,
    playerSeat,
    currentDealer,
    isPlayerCounting,
    addSpeechBubble,
    setSuspicionLevel,
    setPlayerSociability,
    setDealerSuspicion,
    setActiveConversation,
  ]);

  return {
    handleConversationResponse,
    handleConversationIgnore,
  };
}
