"use client";

import { useEffect, useRef, useState } from "react";

export default function BackgroundMusic() {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(0.3); // Default 30% volume
  const [showVolumeSlider, setShowVolumeSlider] = useState(false);

  useEffect(() => {
    // Create audio element
    audioRef.current = new Audio("/audio/background.mp3");
    audioRef.current.loop = true;
    audioRef.current.volume = volume;

    // Cleanup on unmount
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
    }
  }, [volume]);

  const togglePlay = () => {
    if (!audioRef.current) return;

    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      // Play and handle autoplay restrictions
      audioRef.current.play().catch((error) => {
        console.log("Audio playback failed:", error);
      });
      setIsPlaying(true);
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
  };

  return (
    <div
      style={{
        position: "fixed",
        bottom: "20px",
        right: "20px",
        zIndex: 9999,
        display: "flex",
        alignItems: "center",
        gap: "10px",
      }}
    >
      {/* Volume Slider */}
      {showVolumeSlider && (
        <div
          style={{
            backgroundColor: "rgba(0, 0, 0, 0.9)",
            border: "2px solid #FFD700",
            borderRadius: "8px",
            padding: "10px 15px",
            display: "flex",
            alignItems: "center",
            gap: "10px",
          }}
        >
          <span style={{ color: "#FFF", fontSize: "14px" }}>🔊</span>
          <input
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={volume}
            onChange={handleVolumeChange}
            style={{
              width: "100px",
              cursor: "pointer",
            }}
          />
          <span style={{ color: "#FFF", fontSize: "12px", minWidth: "35px" }}>
            {Math.round(volume * 100)}%
          </span>
        </div>
      )}

      {/* Volume Button */}
      <button
        onClick={() => setShowVolumeSlider(!showVolumeSlider)}
        style={{
          backgroundColor: "rgba(0, 0, 0, 0.9)",
          color: "#FFD700",
          border: "2px solid #FFD700",
          borderRadius: "50%",
          width: "50px",
          height: "50px",
          fontSize: "20px",
          cursor: "pointer",
          transition: "all 0.2s",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = "rgba(255, 215, 0, 0.2)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = "rgba(0, 0, 0, 0.9)";
        }}
        title="Volume"
      >
        🔊
      </button>

      {/* Play/Pause Button */}
      <button
        onClick={togglePlay}
        style={{
          backgroundColor: "rgba(0, 0, 0, 0.9)",
          color: "#FFD700",
          border: "2px solid #FFD700",
          borderRadius: "50%",
          width: "60px",
          height: "60px",
          fontSize: "24px",
          cursor: "pointer",
          transition: "all 0.2s",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = "rgba(255, 215, 0, 0.2)";
          e.currentTarget.style.transform = "scale(1.05)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = "rgba(0, 0, 0, 0.9)";
          e.currentTarget.style.transform = "scale(1)";
        }}
        title={isPlaying ? "Pause Music" : "Play Music"}
      >
        {isPlaying ? "⏸️" : "▶️"}
      </button>
    </div>
  );
}
