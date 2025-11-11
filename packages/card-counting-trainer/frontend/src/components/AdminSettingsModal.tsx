"use client";

import { useState, useEffect } from "react";

interface AudioSettings {
  musicVolume: number;
  playerSpeechVolume: number;
  dealerSpeechVolume: number;
  masterVolume: number;
}

interface AdminSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const DEFAULT_AUDIO_SETTINGS: AudioSettings = {
  musicVolume: 30,
  playerSpeechVolume: 80,
  dealerSpeechVolume: 80,
  masterVolume: 100,
};

export default function AdminSettingsModal({
  isOpen,
  onClose,
}: AdminSettingsModalProps) {
  const [audioSettings, setAudioSettings] = useState<AudioSettings>(
    DEFAULT_AUDIO_SETTINGS
  );

  // Load settings from localStorage on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("audioSettings");
      if (saved) {
        try {
          setAudioSettings(JSON.parse(saved));
        } catch (e) {
          console.error("Failed to load audio settings:", e);
        }
      }
    }
  }, []);

  // Save settings to localStorage whenever they change
  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("audioSettings", JSON.stringify(audioSettings));

      // Dispatch custom event so other components can react to volume changes
      window.dispatchEvent(
        new CustomEvent("audioSettingsChanged", { detail: audioSettings })
      );
    }
  }, [audioSettings]);

  if (!isOpen) return null;

  const handleReset = () => {
    setAudioSettings(DEFAULT_AUDIO_SETTINGS);
  };

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: "rgba(0, 0, 0, 0.85)",
          zIndex: 9998,
          backdropFilter: "blur(4px)",
        }}
      />

      {/* Modal */}
      <div
        style={{
          position: "fixed",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          zIndex: 9999,
          maxHeight: "90vh",
          overflowY: "auto",
          width: "90%",
          maxWidth: "600px",
        }}
      >
        <div
          style={{
            backgroundColor: "#0F1419",
            border: "3px solid #9C27B0",
            borderRadius: "20px",
            padding: "32px",
            boxShadow: "0 16px 48px rgba(0, 0, 0, 0.9)",
          }}
        >
          {/* Header */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "24px",
            }}
          >
            <h2 style={{ fontSize: "28px", fontWeight: "bold", color: "#FFF" }}>
              🎛️ Admin Settings
            </h2>
            <button
              onClick={onClose}
              style={{
                backgroundColor: "transparent",
                color: "#FFF",
                border: "2px solid rgba(255, 255, 255, 0.3)",
                borderRadius: "8px",
                padding: "8px 16px",
                fontSize: "16px",
                cursor: "pointer",
                transition: "all 0.2s ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor =
                  "rgba(255, 255, 255, 0.1)";
                e.currentTarget.style.borderColor = "#FFF";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = "transparent";
                e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.3)";
              }}
            >
              ✕ Close
            </button>
          </div>

          {/* Master Volume */}
          <div style={{ marginBottom: "32px" }}>
            <h3
              style={{
                fontSize: "18px",
                fontWeight: "bold",
                color: "#FFF",
                marginBottom: "16px",
              }}
            >
              🔊 Master Volume
            </h3>
            <div
              style={{
                backgroundColor: "rgba(156, 39, 176, 0.1)",
                border: "2px solid rgba(156, 39, 176, 0.3)",
                borderRadius: "12px",
                padding: "20px",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: "12px",
                }}
              >
                <label
                  style={{
                    fontSize: "14px",
                    color: "#AAA",
                  }}
                >
                  Master Volume
                </label>
                <span
                  style={{
                    fontSize: "20px",
                    fontWeight: "bold",
                    color: "#9C27B0",
                    minWidth: "50px",
                    textAlign: "right",
                  }}
                >
                  {audioSettings.masterVolume}%
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                step="5"
                value={audioSettings.masterVolume}
                onChange={(e) =>
                  setAudioSettings({
                    ...audioSettings,
                    masterVolume: parseInt(e.target.value),
                  })
                }
                style={{
                  width: "100%",
                  accentColor: "#9C27B0",
                  height: "8px",
                }}
              />
            </div>
          </div>

          {/* Audio Levels */}
          <div style={{ marginBottom: "24px" }}>
            <h3
              style={{
                fontSize: "18px",
                fontWeight: "bold",
                color: "#FFF",
                marginBottom: "16px",
              }}
            >
              🎚️ Audio Levels
            </h3>

            {/* Music Volume */}
            <div style={{ marginBottom: "20px" }}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: "8px",
                }}
              >
                <label
                  style={{
                    fontSize: "14px",
                    color: "#AAA",
                  }}
                >
                  🎵 Background Music
                </label>
                <span
                  style={{
                    fontSize: "16px",
                    fontWeight: "bold",
                    color: "#FFF",
                    minWidth: "45px",
                    textAlign: "right",
                  }}
                >
                  {audioSettings.musicVolume}%
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                step="5"
                value={audioSettings.musicVolume}
                onChange={(e) =>
                  setAudioSettings({
                    ...audioSettings,
                    musicVolume: parseInt(e.target.value),
                  })
                }
                style={{
                  width: "100%",
                  accentColor: "#4A90E2",
                }}
              />
            </div>

            {/* Player Speech Volume */}
            <div style={{ marginBottom: "20px" }}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: "8px",
                }}
              >
                <label
                  style={{
                    fontSize: "14px",
                    color: "#AAA",
                  }}
                >
                  👥 Player Speech
                </label>
                <span
                  style={{
                    fontSize: "16px",
                    fontWeight: "bold",
                    color: "#FFF",
                    minWidth: "45px",
                    textAlign: "right",
                  }}
                >
                  {audioSettings.playerSpeechVolume}%
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                step="5"
                value={audioSettings.playerSpeechVolume}
                onChange={(e) =>
                  setAudioSettings({
                    ...audioSettings,
                    playerSpeechVolume: parseInt(e.target.value),
                  })
                }
                style={{
                  width: "100%",
                  accentColor: "#4CAF50",
                }}
              />
            </div>

            {/* Dealer Speech Volume */}
            <div>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: "8px",
                }}
              >
                <label
                  style={{
                    fontSize: "14px",
                    color: "#AAA",
                  }}
                >
                  👔 Dealer Speech
                </label>
                <span
                  style={{
                    fontSize: "16px",
                    fontWeight: "bold",
                    color: "#FFF",
                    minWidth: "45px",
                    textAlign: "right",
                  }}
                >
                  {audioSettings.dealerSpeechVolume}%
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                step="5"
                value={audioSettings.dealerSpeechVolume}
                onChange={(e) =>
                  setAudioSettings({
                    ...audioSettings,
                    dealerSpeechVolume: parseInt(e.target.value),
                  })
                }
                style={{
                  width: "100%",
                  accentColor: "#FF9800",
                }}
              />
            </div>
          </div>

          {/* Info Box */}
          <div
            style={{
              backgroundColor: "rgba(76, 175, 80, 0.1)",
              border: "2px solid rgba(76, 175, 80, 0.3)",
              borderRadius: "12px",
              padding: "16px",
              marginBottom: "24px",
            }}
          >
            <div
              style={{
                fontSize: "12px",
                color: "#AAA",
                lineHeight: "1.6",
              }}
            >
              <div style={{ marginBottom: "8px" }}>
                💡 <strong style={{ color: "#4CAF50" }}>Tip:</strong> Master
                volume affects all audio. Individual sliders control relative
                levels.
              </div>
              <div>
                Settings are saved automatically to your browser and will persist
                between sessions.
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div style={{ display: "flex", gap: "12px" }}>
            <button
              onClick={handleReset}
              style={{
                flex: 1,
                backgroundColor: "rgba(255, 152, 0, 0.2)",
                color: "#FF9800",
                border: "2px solid #FF9800",
                borderRadius: "12px",
                padding: "14px",
                fontSize: "16px",
                fontWeight: "bold",
                cursor: "pointer",
                transition: "all 0.2s ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor =
                  "rgba(255, 152, 0, 0.3)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor =
                  "rgba(255, 152, 0, 0.2)";
              }}
            >
              🔄 Reset to Defaults
            </button>
            <button
              onClick={onClose}
              style={{
                flex: 1,
                backgroundColor: "#9C27B0",
                color: "#FFF",
                border: "none",
                borderRadius: "12px",
                padding: "14px",
                fontSize: "16px",
                fontWeight: "bold",
                cursor: "pointer",
                transition: "all 0.2s ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = "#7B1FA2";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = "#9C27B0";
              }}
            >
              ✓ Done
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

// Export utility functions to get current audio settings
export function getAudioSettings(): AudioSettings {
  if (typeof window === "undefined") return DEFAULT_AUDIO_SETTINGS;

  const saved = localStorage.getItem("audioSettings");
  if (saved) {
    try {
      return JSON.parse(saved);
    } catch (e) {
      return DEFAULT_AUDIO_SETTINGS;
    }
  }
  return DEFAULT_AUDIO_SETTINGS;
}

export function getPlayerSpeechVolume(): number {
  const settings = getAudioSettings();
  return (settings.playerSpeechVolume / 100) * (settings.masterVolume / 100);
}

export function getDealerSpeechVolume(): number {
  const settings = getAudioSettings();
  return (settings.dealerSpeechVolume / 100) * (settings.masterVolume / 100);
}

export function getMusicVolume(): number {
  const settings = getAudioSettings();
  return (settings.musicVolume / 100) * (settings.masterVolume / 100);
}
