import { useState, useCallback, useRef, useEffect } from "react";

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
  const processQueue = useCallback(() => {
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

    // Create and play audio element
    const audio = new Audio(nextItem.audioPath);
    audioRef.current = audio;

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
    };

    audio.onerror = (e) => {
      console.error(`Failed to load audio: ${nextItem.audioPath}`, e);
      setIsPlaying(false);
      setCurrentItem(null);
      processingRef.current = false;

      // Try next item
      setTimeout(() => {
        processQueue();
      }, 100);
    };

    console.log(`[Audio Queue] Playing: ${nextItem.audioPath}`);
    audio.play().catch((err) => {
      console.error(`[Audio Queue] Failed to play audio: ${nextItem.audioPath}`, err);
      setIsPlaying(false);
      setCurrentItem(null);
      processingRef.current = false;

      // Try next item
      setTimeout(() => {
        processQueue();
      }, 100);
    });
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
