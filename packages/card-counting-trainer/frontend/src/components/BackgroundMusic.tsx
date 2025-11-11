"use client";

import { useEffect, useRef } from "react";

interface BackgroundMusicProps {
  shouldPlay?: boolean;
}

export default function BackgroundMusic({ shouldPlay = false }: BackgroundMusicProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    // Create audio element
    if (!audioRef.current) {
      audioRef.current = new Audio("/audio/background.mp3");
      audioRef.current.loop = true;
      audioRef.current.volume = 0.3; // Default 30% volume
    }

    // Cleanup on unmount
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  // Play audio when shouldPlay becomes true
  useEffect(() => {
    if (shouldPlay && audioRef.current) {
      audioRef.current.play().catch((error) => {
        console.log("Audio playback failed:", error);
      });
    }
  }, [shouldPlay]);

  // No UI - audio plays in background
  return null;
}
