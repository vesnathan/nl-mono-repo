"use client";

import { useEffect, useRef } from "react";
import { getMusicVolume } from "./AdminSettingsModal";

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
      audioRef.current.volume = getMusicVolume(); // Get volume from settings
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

  // Listen for audio settings changes and update volume in real-time
  useEffect(() => {
    const handleVolumeChange = () => {
      if (audioRef.current) {
        audioRef.current.volume = getMusicVolume();
      }
    };

    window.addEventListener('audioSettingsChanged', handleVolumeChange);
    return () => {
      window.removeEventListener('audioSettingsChanged', handleVolumeChange);
    };
  }, []);

  // No UI - audio plays in background
  return null;
}
