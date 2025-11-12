import { useState, useCallback, useRef, useEffect } from "react";
import {
  getPlayerSpeechVolume,
  getDealerSpeechVolume,
} from "@/components/AdminSettingsModal";
import { getOrGenerateAudio } from "@/utils/dynamicTTS";
import { debugLog } from "@/utils/debug";

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
  onPlay?: () => void; // Callback when audio starts playing
  onComplete?: () => void; // Callback when audio finishes
}

export interface AudioQueueHook {
  queueAudio: (item: AudioQueueItem) => void;
  clearQueue: () => void;
  isPlaying: boolean;
  currentItem: AudioQueueItem | null;
}

interface UseAudioQueueParams {
  registerTimeout: (callback: () => void, delay: number) => NodeJS.Timeout;
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
export function useAudioQueue({
  registerTimeout,
}: UseAudioQueueParams): AudioQueueHook {
  // Queue state to trigger re-renders when items are added/removed
  const [queue, setQueue] = useState<AudioQueueItem[]>([]);
  const [currentItem, setCurrentItem] = useState<AudioQueueItem | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const processingRef = useRef(false);
  const currentPlayerIdRef = useRef<string | null>(null);
  const queueRef = useRef<AudioQueueItem[]>([]);

  /**
   * Process the next item in the queue
   */
  const processQueue = useCallback(async () => {
    if (processingRef.current) {
      debugLog("audioQueue", `[Audio Queue] ⛔ Already processing, returning`);
      return;
    }

    // CRITICAL: Set processing flag FIRST to prevent re-entry
    processingRef.current = true;
    debugLog("audioQueue", `[Audio Queue] 🔒 Set processingRef to true`);

    // Use queueRef for synchronous access to current queue
    const currentQueueSnapshot = queueRef.current;

    debugLog(
      "audioQueue",
      `[Audio Queue] 📸 Queue snapshot (length: ${currentQueueSnapshot.length})`,
    );

    // If queue is empty, clear state and return early
    if (currentQueueSnapshot.length === 0) {
      debugLog(
        "audioQueue",
        `[Audio Queue] 📭 Queue empty, clearing state and resetting flag`,
      );
      processingRef.current = false;
      setCurrentItem(null);
      setIsPlaying(false);
      return;
    }

    // Get highest priority item from queue
    const sortedQueue = [...currentQueueSnapshot].sort(
      (a, b) => b.priority - a.priority,
    );
    const itemToPlay = sortedQueue[0];
    debugLog(
      "audioQueue",
      `[Audio Queue] 📦 Next item: ${itemToPlay.id} - "${itemToPlay.message}"`,
    );

    // Now remove it from queue
    const newQueue = currentQueueSnapshot.filter(
      (item) => item.id !== itemToPlay.id,
    );
    debugLog(
      "audioQueue",
      `[Audio Queue] 🗑️  Removing item ${itemToPlay.id} from queue`,
    );
    debugLog(
      "audioQueue",
      `[Audio Queue] 📋 Queue after removal: ${newQueue.length} items`,
    );

    queueRef.current = newQueue;
    setQueue(newQueue);

    debugLog(
      "audioQueue",
      `[Audio Queue] ✅ Got item to play: ${itemToPlay.id}`,
    );

    // Play the audio
    setCurrentItem(itemToPlay);
    setIsPlaying(true);

    /**
     * Try to play audio, falling back to ElevenLabs if file is missing
     */
    const tryPlayAudio = async (
      audioPath: string,
      usedFallback = false,
    ): Promise<void> => {
      // Pre-flight check: verify the file exists before trying to play it
      // This prevents 404 errors in the browser console
      if (!usedFallback && !audioPath.startsWith("blob:")) {
        try {
          const checkResponse = await fetch(audioPath, { method: "HEAD" });
          if (!checkResponse.ok) {
            debugLog(
              "audioQueue",
              `[Audio Queue] Pre-flight check failed for: ${audioPath} (${checkResponse.status}), trying ElevenLabs fallback...`,
            );

            // Try to generate with ElevenLabs
            const generatedAudioUrl = await getOrGenerateAudio(
              itemToPlay.message,
              itemToPlay.playerId,
            );

            if (generatedAudioUrl) {
              debugLog(
                "audioQueue",
                `[Audio Queue] Generated audio from ElevenLabs for: "${itemToPlay.message.substring(0, 50)}..."`,
              );
              // Retry with the generated URL
              return await tryPlayAudio(generatedAudioUrl, true);
            }
            console.error(
              `[Audio Queue] ElevenLabs fallback failed to generate audio`,
            );
            // Skip this audio and move to next
            setIsPlaying(false);
            setCurrentItem(null);
            processingRef.current = false;
            registerTimeout(() => processQueue(), 100);
            return;
          }
        } catch (checkError) {
          debugLog(
            "audioQueue",
            `[Audio Queue] Pre-flight check error for: ${audioPath}`,
            checkError,
          );
          // Continue to try playing anyway - might be a CORS issue with HEAD
        }
      }

      return new Promise((resolve, reject) => {
        const audio = new Audio(audioPath);
        audioRef.current = audio;
        currentPlayerIdRef.current = itemToPlay.playerId;

        // Set volume based on whether it's a dealer or player
        const volume =
          itemToPlay.playerId === "dealer"
            ? getDealerSpeechVolume()
            : getPlayerSpeechVolume();
        audio.volume = volume;

        // Explicitly set loop to false to prevent looping
        audio.loop = false;

        debugLog(
          "audioQueue",
          `[Audio Queue] 🎵 Created audio element for: ${audioPath}, loop=${audio.loop}, volume=${audio.volume}`,
        );

        // Log when audio actually starts playing
        audio.onplay = () => {
          debugLog("audioQueue", `[Audio Queue] ▶️  PLAYING: ${audioPath}`);
          // Call onPlay callback if provided
          if (itemToPlay.onPlay) {
            itemToPlay.onPlay();
          }
        };

        // Log when audio pauses
        audio.onpause = () => {
          debugLog("audioQueue", `[Audio Queue] ⏸️  PAUSED: ${audioPath}`);
        };

        // Log when audio is seeking (might indicate unexpected behavior)
        audio.onseeking = () => {
          debugLog("audioQueue", `[Audio Queue] ⏩ SEEKING: ${audioPath}`);
        };

        // Track if onended has already fired to prevent double-processing
        let endedFired = false;

        audio.onended = () => {
          if (endedFired) {
            console.error(
              `[Audio Queue] ⚠️  DUPLICATE onended fired for: ${audioPath}`,
            );
            return;
          }
          endedFired = true;

          debugLog("audioQueue", `[Audio Queue] ✅ Audio ENDED: ${audioPath}`);

          // Remove ALL event handlers to prevent any further events
          audio.onerror = null;
          audio.onplay = null;
          audio.onpause = null;
          audio.onseeking = null;
          audio.onended = null;

          // Pause the audio but DON'T clear the source (which triggers Invalid URI error)
          // Just let it be garbage collected
          if (audioRef.current) {
            debugLog(
              "audioQueue",
              `[Audio Queue] 🧹 Cleaning up audio element`,
            );
            audioRef.current.pause();
            // Don't set src = '' - this triggers "Invalid URI" error
            audioRef.current = null;
          }

          setIsPlaying(false);
          setCurrentItem(null);
          processingRef.current = false;

          // Call onComplete callback if provided
          if (itemToPlay.onComplete) {
            itemToPlay.onComplete();
          }

          // Process next item after a small delay
          registerTimeout(() => {
            processQueue();
          }, 300); // 300ms gap between audio clips

          resolve();
        };

        audio.onerror = async (e) => {
          // If we haven't tried fallback yet, try to generate with ElevenLabs
          if (!usedFallback) {
            debugLog(
              "audioQueue",
              `[Audio Queue] Audio error for: ${audioPath}, trying ElevenLabs fallback...`,
            );

            try {
              const generatedAudioUrl = await getOrGenerateAudio(
                itemToPlay.message,
                itemToPlay.playerId,
              );

              if (generatedAudioUrl) {
                debugLog(
                  "audioQueue",
                  `[Audio Queue] Generated audio from ElevenLabs for: "${itemToPlay.message.substring(0, 50)}..."`,
                );
                // Retry with the generated URL
                await tryPlayAudio(generatedAudioUrl, true);
                resolve();
                return;
              }
            } catch (fallbackError) {
              console.error(
                `[Audio Queue] ElevenLabs fallback failed:`,
                fallbackError,
              );
            }
          }

          // No fallback worked, skip this audio
          console.error(
            `Failed to load audio (no fallback available): ${audioPath}`,
            e,
          );
          setIsPlaying(false);
          setCurrentItem(null);
          processingRef.current = false;

          // Try next item
          registerTimeout(() => {
            processQueue();
          }, 100);

          reject(e);
        };

        debugLog(
          "audioQueue",
          `[Audio Queue] Playing: ${audioPath}${usedFallback ? " (from ElevenLabs)" : ""}`,
        );
        audio.play().catch(async (err) => {
          console.error(
            `[Audio Queue] Failed to play audio: ${audioPath}`,
            err,
          );

          // Trigger error handler for fallback
          audio.onerror?.(new ErrorEvent("error"));
        });
      });
    };

    try {
      await tryPlayAudio(itemToPlay.audioPath);
    } catch {
      // Error already handled in tryPlayAudio
    }
  }, [registerTimeout]); // registerTimeout is stable from useCallback in parent

  /**
   * Queue audio for playback with priority handling
   */
  const queueAudio = useCallback(
    (item: AudioQueueItem) => {
      debugLog("audioQueue", "[Audio Queue] queueAudio called");
      debugLog(
        "audioQueue",
        `[Audio Queue] 📥 Queueing audio: ${item.id} - "${item.message}" (priority: ${item.priority}, path: ${item.audioPath})`,
      );

      // Check if we should interrupt current audio
      if (currentItem && isPlaying) {
        // Interrupt if new item has higher priority
        if (item.priority > currentItem.priority) {
          debugLog(
            "audioQueue",
            `[Audio Queue] ⚡ Interrupting current audio (priority ${currentItem.priority}) with higher priority (${item.priority})`,
          );

          // Stop current audio
          if (audioRef.current) {
            audioRef.current.pause();
            audioRef.current = null;
          }

          // Reset state and queue the urgent item at the front
          // The rest of the queue (including any other queued items) will continue after this urgent item
          setIsPlaying(false);
          setCurrentItem(null);
          processingRef.current = false;
          const newQueue = [item, ...queueRef.current];
          queueRef.current = newQueue;
          setQueue(newQueue);

          // Process immediately
          registerTimeout(() => {
            processQueue();
          }, 50);
          return;
        }
      }

      // Otherwise, just add to queue
      debugLog(
        "audioQueue",
        `[Audio Queue] ➕ Added to queue (queue length will be ${queueRef.current.length + 1})`,
      );
      const newQueue = [...queueRef.current, item];
      queueRef.current = newQueue;
      setQueue(newQueue);
    },
    [currentItem, isPlaying, processQueue, registerTimeout],
  );

  /**
   * Clear all queued audio and stop current playback
   */
  const clearQueue = useCallback(() => {
    queueRef.current = [];
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
    // CRITICAL: Check processingRef FIRST to prevent re-entry during setState
    if (processingRef.current) {
      debugLog(
        "audioQueue",
        `[Audio Queue] ⛔ Effect blocked - already processing`,
      );
      return;
    }

    if (!isPlaying && queue.length > 0) {
      debugLog(
        "audioQueue",
        `[Audio Queue] 🔄 Queue changed (length: ${queue.length}), triggering processQueue`,
      );
      processQueue();
    } else if (queue.length > 0) {
      debugLog(
        "audioQueue",
        `[Audio Queue] ⏸️  Queue has ${queue.length} items but blocked (isPlaying: ${isPlaying})`,
      );
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

  // Listen for audio settings changes and update volume in real-time
  useEffect(() => {
    const handleVolumeChange = () => {
      if (audioRef.current && currentPlayerIdRef.current) {
        const newVolume =
          currentPlayerIdRef.current === "dealer"
            ? getDealerSpeechVolume()
            : getPlayerSpeechVolume();
        audioRef.current.volume = newVolume;
      }
    };

    window.addEventListener("audioSettingsChanged", handleVolumeChange);
    return () => {
      window.removeEventListener("audioSettingsChanged", handleVolumeChange);
    };
  }, []);

  return {
    queueAudio,
    clearQueue,
    isPlaying,
    currentItem,
  };
}
