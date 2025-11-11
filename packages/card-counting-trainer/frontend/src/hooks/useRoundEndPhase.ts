import { useEffect } from "react";
import { GamePhase, AIPlayer } from "@/types/gameState";
import { GameSettings, calculateCutCardPosition } from "@/types/gameSettings";
import { AI_CHARACTERS } from "@/data/aiCharacters";
import { CHARACTER_DIALOGUE, pick } from "@/data/dialogue";
import { createAndShuffleShoe } from "@/lib/deck";
import { Card } from "@/types/game";

interface UseRoundEndPhaseParams {
  phase: GamePhase;
  aiPlayers: AIPlayer[];
  playerSeat: number | null;
  cardsDealt: number;
  gameSettings: GameSettings;
  registerTimeout: (callback: () => void, delay: number) => void;
  setAIPlayers: (
    players: AIPlayer[] | ((prev: AIPlayer[]) => AIPlayer[]),
  ) => void;
  setDealerCallout: (callout: string | null) => void;
  addSpeechBubble: (id: string, message: string, position: number) => void;
  setShoe: (shoe: Card[]) => void;
  setCardsDealt: (dealt: number) => void;
  setRunningCount: (count: number) => void;
  setShoesDealt: (shoes: number | ((prev: number) => number)) => void;
  nextHand: () => void;
}

/**
 * Hook to handle ROUND_END phase logic
 * - Player rotation (add/remove AI players)
 * - Table banter between rounds
 * - Shoe reshuffle when cut card is reached
 * - Progression to next hand
 */
export function useRoundEndPhase({
  phase,
  aiPlayers,
  playerSeat,
  cardsDealt,
  gameSettings,
  registerTimeout,
  setAIPlayers,
  setDealerCallout,
  addSpeechBubble,
  setShoe,
  setCardsDealt,
  setRunningCount,
  setShoesDealt,
  nextHand,
}: UseRoundEndPhaseParams) {
  useEffect(() => {
    if (phase === "ROUND_END") {
      registerTimeout(() => {
        // Occasionally add or remove players (15% chance per hand)
        const playerChangeChance = Math.random();

        if (playerChangeChance < 0.15) {
          const currentAICount = aiPlayers.length;
          const occupiedSeats = new Set(aiPlayers.map((p) => p.position));
          if (playerSeat !== null) occupiedSeats.add(playerSeat);

          // 50/50 chance to add or remove (if possible)
          const shouldAdd = Math.random() < 0.5;

          if (shouldAdd && currentAICount < 7 && occupiedSeats.size < 8) {
            // Add a new player
            const availableSeats = [0, 1, 2, 3, 4, 5, 6, 7].filter(
              (seat) => !occupiedSeats.has(seat),
            );

            if (availableSeats.length > 0) {
              // Pick random available seat
              const newSeat =
                availableSeats[
                  Math.floor(Math.random() * availableSeats.length)
                ];

              // Pick random character not already at table
              const usedCharacterIds = new Set(
                aiPlayers.map((p) => p.character.id),
              );
              const availableCharacters = AI_CHARACTERS.filter(
                (char) => !usedCharacterIds.has(char.id),
              );

              if (availableCharacters.length > 0) {
                const newCharacter =
                  availableCharacters[
                    Math.floor(Math.random() * availableCharacters.length)
                  ];

                const newPlayer: AIPlayer = {
                  character: newCharacter,
                  hand: { cards: [], bet: 50 },
                  chips: 1000,
                  position: newSeat,
                };

                setAIPlayers((prev) => [...prev, newPlayer]);

                // Show dealer speech bubble
                addSpeechBubble(
                  "dealer-join",
                  `${newCharacter.name} joins the table!`,
                  -1,
                );
              }
            }
          } else if (!shouldAdd && currentAICount > 2) {
            // Remove a random player (keep at least 2 AI players for atmosphere)
            const removeIndex = Math.floor(Math.random() * currentAICount);
            const removedPlayer = aiPlayers[removeIndex];

            setAIPlayers((prev) =>
              prev.filter((_, idx) => idx !== removeIndex),
            );

            // Show dealer speech bubble
            addSpeechBubble(
              "dealer-leave",
              `${removedPlayer.character.name} leaves the table.`,
              -1,
            );
          }
        }

        // Check if we need to reshuffle (cut card reached)
        const totalCards = gameSettings.numberOfDecks * 52;
        const cutCardPosition = calculateCutCardPosition(
          gameSettings.numberOfDecks,
          gameSettings.deckPenetration,
        );
        const cardsUntilCutCard = totalCards - cutCardPosition;

        // 25% chance to show random table banter between AI players
        if (Math.random() < 0.25 && aiPlayers.length >= 2) {
          // Pick a random AI player to speak
          const speakerIndex = Math.floor(Math.random() * aiPlayers.length);
          const speaker = aiPlayers[speakerIndex];

          // Get their banter lines
          const characterDialogue = CHARACTER_DIALOGUE[speaker.character.id];
          const banterLines = characterDialogue?.banterWithPlayer;

          if (banterLines && banterLines.length > 0) {
            const randomBanter = pick(banterLines);
            addSpeechBubble(
              `ai-banter-${Date.now()}`,
              randomBanter.text,
              speaker.position,
            );
          }
        }

        if (cardsDealt >= cardsUntilCutCard) {
          // Reshuffle the shoe
          const newShoe = createAndShuffleShoe(
            gameSettings.numberOfDecks,
            gameSettings.countingSystem,
          );
          setShoe(newShoe);
          setCardsDealt(0);
          setRunningCount(0);
          setShoesDealt((prev) => prev + 1);

          // Show reshuffle message in speech bubble
          addSpeechBubble("dealer-shuffle", "Shuffling new shoe...", -1);
          registerTimeout(() => {
            nextHand();
          }, 3000);
        } else {
          // No reshuffle needed, just continue to next hand
          nextHand();
        }
      }, 4000); // Show results for 4 seconds before continuing
    }
  }, [
    phase,
    cardsDealt,
    gameSettings.numberOfDecks,
    gameSettings.deckPenetration,
    gameSettings.countingSystem,
    nextHand,
    registerTimeout,
    aiPlayers,
    playerSeat,
    addSpeechBubble,
    setAIPlayers,
    setDealerCallout,
    setShoe,
    setCardsDealt,
    setRunningCount,
    setShoesDealt,
  ]);
}
