import { useState, useCallback, useRef, useEffect } from "react";
import { getPlayerSpeechVolume, getDealerSpeechVolume } from "@/components/AdminSettingsModal";
import { getOrGenerateAudio } from "@/utils/dynamicTTS";

/**
 * Priority levels for audio playback
 * Higher numbers = higher priority (can interrupt lower priority audio)
 */
export enum AudioPriority {
  LOW = 0, // Distractions, casual comments
  NORMAL = 1, // Win/loss reactions, conversations
  HIGH = 2, // Dealer blackjack, important events
  IMMEDIATE = 3, // Bust, player blackjack (interrupt everything)
}

export interface AudioQueueItem {
  id: string; // Unique identifier for this audio item
  audioPath: string; // Path to MP3 file (e.g., "/audio/players/drunk-danny/bust_01.mp3")
  priority: AudioPriority;
  playerId: string; // Character ID or "dealer"
  message: string; // Text to display in speech bubble
  position?: { left: string; top: string }; // Bubble position
  onComplete?: () => void; // Callback when audio finishes
}

export interface AudioQueueHook {
  queueAudio: (item: AudioQueueItem) => void;
  clearQueue: () => void;
  isPlaying: boolean;
  currentItem: AudioQueueItem | null;
}

/**
 * Audio queue system with priority-based interruption
 *
 * Rules:
 * - Only one audio plays at a time
 * - Higher priority audio interrupts lower priority audio
 * - Equal priority queues in order
 * - When audio completes, process next item in queue
 */
export function useAudioQueue(): AudioQueueHook {
  const [queue, setQueue] = useState<AudioQueueItem[]>([]);
  const [currentItem, setCurrentItem] = useState<AudioQueueItem | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const processingRef = useRef(false);

  /**
   * Process the next item in the queue
   */
  const processQueue = useCallback(async () => {
    if (processingRef.current) return;
    if (queue.length === 0) {
      setCurrentItem(null);
      setIsPlaying(false);
      return;
    }

    processingRef.current = true;

    // Get highest priority item from queue
    const sortedQueue = [...queue].sort((a, b) => b.priority - a.priority);
    const nextItem = sortedQueue[0];

    // Remove it from queue
    setQueue((prev) => prev.filter((item) => item.id !== nextItem.id));

    // Play the audio
    setCurrentItem(nextItem);
    setIsPlaying(true);

    /**
     * Try to play audio, falling back to ElevenLabs if file is missing
     */
    const tryPlayAudio = async (audioPath: string, usedFallback = false): Promise<void> => {
      // Pre-flight check: verify the file exists before trying to play it
      // This prevents 404 errors in the browser console
      if (!usedFallback && !audioPath.startsWith('blob:')) {
        try {
          const checkResponse = await fetch(audioPath, { method: 'HEAD' });
          if (!checkResponse.ok) {
            console.warn(`[Audio Queue] Pre-flight check failed for: ${audioPath} (${checkResponse.status}), trying ElevenLabs fallback...`);

            // Try to generate with ElevenLabs
            const generatedAudioUrl = await getOrGenerateAudio(nextItem.message, nextItem.playerId);

            if (generatedAudioUrl) {
              console.log(`[Audio Queue] Generated audio from ElevenLabs for: "${nextItem.message.substring(0, 50)}..."`);
              // Retry with the generated URL
              return await tryPlayAudio(generatedAudioUrl, true);
            } else {
              console.error(`[Audio Queue] ElevenLabs fallback failed to generate audio`);
              // Skip this audio and move to next
              setIsPlaying(false);
              setCurrentItem(null);
              processingRef.current = false;
              setTimeout(() => processQueue(), 100);
              return;
            }
          }
        } catch (checkError) {
          console.warn(`[Audio Queue] Pre-flight check error for: ${audioPath}`, checkError);
          // Continue to try playing anyway - might be a CORS issue with HEAD
        }
      }

      return new Promise((resolve, reject) => {
        const audio = new Audio(audioPath);
        audioRef.current = audio;

        // Set volume based on whether it's a dealer or player
        const volume = nextItem.playerId === "dealer"
          ? getDealerSpeechVolume()
          : getPlayerSpeechVolume();
        audio.volume = volume;

        audio.onended = () => {
          setIsPlaying(false);
          setCurrentItem(null);
          processingRef.current = false;

          // Call onComplete callback if provided
          if (nextItem.onComplete) {
            nextItem.onComplete();
          }

          // Process next item after a small delay
          setTimeout(() => {
            processQueue();
          }, 300); // 300ms gap between audio clips

          resolve();
        };

        audio.onerror = async (e) => {
          // If we haven't tried fallback yet, try to generate with ElevenLabs
          if (!usedFallback) {
            console.warn(`[Audio Queue] Audio error for: ${audioPath}, trying ElevenLabs fallback...`);

            try {
              const generatedAudioUrl = await getOrGenerateAudio(nextItem.message, nextItem.playerId);

              if (generatedAudioUrl) {
                console.log(`[Audio Queue] Generated audio from ElevenLabs for: "${nextItem.message.substring(0, 50)}..."`);
                // Retry with the generated URL
                await tryPlayAudio(generatedAudioUrl, true);
                resolve();
                return;
              }
            } catch (fallbackError) {
              console.error(`[Audio Queue] ElevenLabs fallback failed:`, fallbackError);
            }
          }

          // No fallback worked, skip this audio
          console.error(`Failed to load audio (no fallback available): ${audioPath}`, e);
          setIsPlaying(false);
          setCurrentItem(null);
          processingRef.current = false;

          // Try next item
          setTimeout(() => {
            processQueue();
          }, 100);

          reject(e);
        };

        console.log(`[Audio Queue] Playing: ${audioPath}${usedFallback ? ' (from ElevenLabs)' : ''}`);
        audio.play().catch(async (err) => {
          console.error(`[Audio Queue] Failed to play audio: ${audioPath}`, err);

          // Trigger error handler for fallback
          audio.onerror?.(new ErrorEvent('error'));
        });
      });
    };

    try {
      await tryPlayAudio(nextItem.audioPath);
    } catch (error) {
      // Error already handled in tryPlayAudio
    }
  }, [queue]);

  /**
   * Queue audio for playback with priority handling
   */
  const queueAudio = useCallback(
    (item: AudioQueueItem) => {
      // Check if we should interrupt current audio
      if (currentItem && isPlaying) {
        // Interrupt if new item has higher priority
        if (item.priority > currentItem.priority) {
          // Stop current audio
          if (audioRef.current) {
            audioRef.current.pause();
            audioRef.current = null;
          }

          // Re-queue current item if it was important (HIGH or IMMEDIATE)
          if (currentItem.priority >= AudioPriority.HIGH) {
            setQueue((prev) => [currentItem, ...prev]);
          }

          // Reset state and queue the new high-priority item
          setIsPlaying(false);
          setCurrentItem(null);
          processingRef.current = false;
          setQueue((prev) => [item, ...prev]);

          // Process immediately
          setTimeout(() => {
            processQueue();
          }, 50);
          return;
        }
      }

      // Otherwise, just add to queue
      setQueue((prev) => [...prev, item]);
    },
    [currentItem, isPlaying, processQueue]
  );

  /**
   * Clear all queued audio and stop current playback
   */
  const clearQueue = useCallback(() => {
    setQueue([]);

    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }

    setIsPlaying(false);
    setCurrentItem(null);
    processingRef.current = false;
  }, []);

  // Auto-process queue when it changes
  useEffect(() => {
    if (!isPlaying && !processingRef.current && queue.length > 0) {
      processQueue();
    }
  }, [queue, isPlaying, processQueue]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  return {
    queueAudio,
    clearQueue,
    isPlaying,
    currentItem,
  };
}
