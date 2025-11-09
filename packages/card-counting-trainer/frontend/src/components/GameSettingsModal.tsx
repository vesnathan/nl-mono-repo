"use client";

import { useState } from "react";
import {
  GameSettings,
  CountingSystem,
  TrainingMode,
  BlackjackPayout,
} from "@/types/gameSettings";

interface GameSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentSettings: GameSettings;
  onSave: (settings: Partial<GameSettings>) => void;
}

const COUNTING_SYSTEMS = {
  HI_LO: {
    name: "Hi-Lo",
    description: "Most popular, Level 1, Balanced",
    values: "+1: 2-6 | 0: 7-9 | -1: 10-A",
  },
  KO: {
    name: "Knock-Out (KO)",
    description: "Easier, Level 1, Unbalanced (no true count)",
    values: "+1: 2-7 | 0: 8-9 | -1: 10-A",
  },
  HI_OPT_I: {
    name: "Hi-Opt I",
    description: "Level 1, Balanced",
    values: "+1: 3-6 | 0: 2,7-9,A | -1: 10-K",
  },
  HI_OPT_II: {
    name: "Hi-Opt II",
    description: "More complex, Level 2, Balanced",
    values: "+2: 4-5 | +1: 2-3,6-7 | 0: 8-9,A | -2: 10-K",
  },
  OMEGA_II: {
    name: "Omega II",
    description: "Advanced, Level 2, ~99% efficiency",
    values: "+2: 4-6 | +1: 2-3,7 | 0: 8,A | -1: 9 | -2: 10-K",
  },
};

export default function GameSettingsModal({
  isOpen,
  onClose,
  currentSettings,
  onSave,
}: GameSettingsModalProps) {
  const [settings, setSettings] = useState<GameSettings>(currentSettings);

  if (!isOpen) return null;

  const handleSave = () => {
    // Only save the settings that the modal manages
    onSave({
      numberOfDecks: settings.numberOfDecks,
      deckPenetration: settings.deckPenetration,
      dealerHitsSoft17: settings.dealerHitsSoft17,
      blackjackPayout: settings.blackjackPayout,
      countingSystem: settings.countingSystem,
      trainingMode: settings.trainingMode,
    });
    onClose();
  };

  const loadPreset = (
    preset: "vegas" | "single" | "double" | "european" | "bad",
  ) => {
    const presets: Record<string, Partial<GameSettings>> = {
      vegas: {
        numberOfDecks: 6,
        deckPenetration: 75,
        dealerHitsSoft17: true,
        blackjackPayout: BlackjackPayout.THREE_TO_TWO,
      },
      single: {
        numberOfDecks: 1,
        deckPenetration: 60,
        dealerHitsSoft17: false,
        blackjackPayout: BlackjackPayout.THREE_TO_TWO,
      },
      double: {
        numberOfDecks: 2,
        deckPenetration: 65,
        dealerHitsSoft17: false,
        blackjackPayout: BlackjackPayout.THREE_TO_TWO,
      },
      european: {
        numberOfDecks: 6,
        deckPenetration: 75,
        dealerHitsSoft17: false,
        blackjackPayout: BlackjackPayout.THREE_TO_TWO,
      },
      bad: {
        numberOfDecks: 6,
        deckPenetration: 50,
        dealerHitsSoft17: true,
        blackjackPayout: BlackjackPayout.SIX_TO_FIVE,
      },
    };

    setSettings({ ...settings, ...presets[preset] });
  };

  // Calculate approximate house edge
  const calculateHouseEdge = (): number => {
    let edge = 0.5; // Base edge

    // Deck number impact
    if (settings.numberOfDecks === 1) edge -= 0.48;
    else if (settings.numberOfDecks === 2) edge -= 0.35;
    else if (settings.numberOfDecks === 4) edge -= 0.06;
    else if (settings.numberOfDecks === 8) edge += 0.02;

    // Dealer soft 17
    if (settings.dealerHitsSoft17) edge += 0.2;

    // Blackjack payout
    if (settings.blackjackPayout === BlackjackPayout.SIX_TO_FIVE) edge += 1.39;
    else if (settings.blackjackPayout === BlackjackPayout.TWO_TO_ONE)
      edge -= 2.27;
    else if (settings.blackjackPayout === BlackjackPayout.EVEN_MONEY)
      edge += 2.27;

    // Penetration impact (rough estimate)
    if (settings.deckPenetration < 60) edge += 0.1;

    return Math.round(edge * 100) / 100;
  };

  const houseEdge = calculateHouseEdge();

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
          maxWidth: "700px",
        }}
      >
        <div
          style={{
            backgroundColor: "#0F1419",
            border: "3px solid #4A90E2",
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
              ⚙️ Game Settings
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

          {/* House Edge Display */}
          <div
            style={{
              backgroundColor:
                houseEdge > 1
                  ? "rgba(244, 67, 54, 0.2)"
                  : "rgba(76, 175, 80, 0.2)",
              border: `2px solid ${houseEdge > 1 ? "#F44336" : "#4CAF50"}`,
              borderRadius: "12px",
              padding: "16px",
              marginBottom: "24px",
              textAlign: "center",
            }}
          >
            <div
              style={{ fontSize: "14px", color: "#AAA", marginBottom: "4px" }}
            >
              Estimated House Edge
            </div>
            <div
              style={{
                fontSize: "32px",
                fontWeight: "bold",
                color: houseEdge > 1 ? "#F44336" : "#4CAF50",
              }}
            >
              {houseEdge}%
            </div>
            {houseEdge > 1 && (
              <div
                style={{
                  fontSize: "12px",
                  color: "#F44336",
                  marginTop: "4px",
                  fontStyle: "italic",
                }}
              >
                Warning: Unfavorable rules! Avoid in real play.
              </div>
            )}
          </div>

          {/* Quick Presets */}
          <div style={{ marginBottom: "32px" }}>
            <h3
              style={{
                fontSize: "18px",
                fontWeight: "bold",
                color: "#FFF",
                marginBottom: "12px",
              }}
            >
              Quick Presets
            </h3>
            <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
              {[
                { id: "vegas", label: "Vegas Strip", icon: "🎰" },
                { id: "single", label: "Single Deck", icon: "🃏" },
                { id: "double", label: "Double Deck", icon: "🎴" },
                { id: "european", label: "European", icon: "🇪🇺" },
                { id: "bad", label: "Bad Rules", icon: "⚠️" },
              ].map((preset) => (
                <button
                  key={preset.id}
                  onClick={() => loadPreset(preset.id as any)}
                  style={{
                    backgroundColor: "rgba(74, 144, 226, 0.2)",
                    color: "#FFF",
                    border: "2px solid #4A90E2",
                    borderRadius: "8px",
                    padding: "8px 16px",
                    fontSize: "14px",
                    cursor: "pointer",
                    transition: "all 0.2s ease",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor =
                      "rgba(74, 144, 226, 0.4)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor =
                      "rgba(74, 144, 226, 0.2)";
                  }}
                >
                  {preset.icon} {preset.label}
                </button>
              ))}
            </div>
          </div>

          {/* Deck Configuration */}
          <div style={{ marginBottom: "24px" }}>
            <h3
              style={{
                fontSize: "18px",
                fontWeight: "bold",
                color: "#FFF",
                marginBottom: "12px",
              }}
            >
              🃏 Deck Configuration
            </h3>

            {/* Number of Decks */}
            <div style={{ marginBottom: "16px" }}>
              <label
                style={{
                  fontSize: "14px",
                  color: "#AAA",
                  display: "block",
                  marginBottom: "8px",
                }}
              >
                Number of Decks
              </label>
              <div style={{ display: "flex", gap: "8px" }}>
                {([1, 2, 4, 6, 8] as const).map((num) => (
                  <button
                    key={num}
                    onClick={() =>
                      setSettings({ ...settings, numberOfDecks: num })
                    }
                    style={{
                      backgroundColor:
                        settings.numberOfDecks === num
                          ? "#4A90E2"
                          : "rgba(255, 255, 255, 0.1)",
                      color: settings.numberOfDecks === num ? "#FFF" : "#AAA",
                      border: "2px solid",
                      borderColor:
                        settings.numberOfDecks === num
                          ? "#FFF"
                          : "rgba(255, 255, 255, 0.2)",
                      borderRadius: "8px",
                      padding: "10px 20px",
                      fontSize: "14px",
                      fontWeight:
                        settings.numberOfDecks === num ? "bold" : "normal",
                      cursor: "pointer",
                      transition: "all 0.2s ease",
                      flex: 1,
                    }}
                  >
                    {num}
                  </button>
                ))}
              </div>
            </div>

            {/* Deck Penetration */}
            <div>
              <label
                style={{
                  fontSize: "14px",
                  color: "#AAA",
                  display: "block",
                  marginBottom: "8px",
                }}
              >
                Deck Penetration: {settings.deckPenetration}%
              </label>
              <input
                type="range"
                min="40"
                max="90"
                step="5"
                value={settings.deckPenetration}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    deckPenetration: parseInt(e.target.value),
                  })
                }
                style={{
                  width: "100%",
                  accentColor: "#4A90E2",
                }}
              />
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  fontSize: "12px",
                  color: "#666",
                  marginTop: "4px",
                }}
              >
                <span>40% (Poor)</span>
                <span>75% (Good)</span>
                <span>90% (Excellent)</span>
              </div>
            </div>
          </div>

          {/* Dealer Rules */}
          <div style={{ marginBottom: "24px" }}>
            <h3
              style={{
                fontSize: "18px",
                fontWeight: "bold",
                color: "#FFF",
                marginBottom: "12px",
              }}
            >
              👔 Dealer Rules
            </h3>

            <div
              style={{
                backgroundColor: "rgba(255, 255, 255, 0.05)",
                border: "2px solid rgba(255, 255, 255, 0.1)",
                borderRadius: "12px",
                padding: "16px",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <div>
                <div
                  style={{
                    fontSize: "14px",
                    fontWeight: "bold",
                    color: "#FFF",
                  }}
                >
                  Dealer Action on Soft 17
                </div>
                <div
                  style={{ fontSize: "12px", color: "#AAA", marginTop: "4px" }}
                >
                  {settings.dealerHitsSoft17
                    ? "Dealer Hits (H17) - House Favored"
                    : "Dealer Stands (S17) - Player Favored"}
                </div>
              </div>
              <button
                onClick={() =>
                  setSettings({
                    ...settings,
                    dealerHitsSoft17: !settings.dealerHitsSoft17,
                  })
                }
                style={{
                  backgroundColor: settings.dealerHitsSoft17
                    ? "#F44336"
                    : "#4CAF50",
                  color: "#FFF",
                  border: "none",
                  borderRadius: "8px",
                  padding: "10px 20px",
                  fontSize: "14px",
                  fontWeight: "bold",
                  cursor: "pointer",
                  transition: "all 0.2s ease",
                }}
              >
                {settings.dealerHitsSoft17 ? "H17" : "S17"}
              </button>
            </div>
          </div>

          {/* Payout Rules */}
          <div style={{ marginBottom: "24px" }}>
            <h3
              style={{
                fontSize: "18px",
                fontWeight: "bold",
                color: "#FFF",
                marginBottom: "12px",
              }}
            >
              💰 Payout Rules
            </h3>

            <div>
              <label
                style={{
                  fontSize: "14px",
                  color: "#AAA",
                  display: "block",
                  marginBottom: "8px",
                }}
              >
                Blackjack Payout
              </label>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(2, 1fr)",
                  gap: "8px",
                }}
              >
                {[
                  {
                    value: BlackjackPayout.THREE_TO_TWO,
                    label: "3:2",
                    note: "(Standard)",
                  },
                  {
                    value: BlackjackPayout.SIX_TO_FIVE,
                    label: "6:5",
                    note: "(Bad!)",
                  },
                  { value: BlackjackPayout.TWO_TO_ONE, label: "2:1", note: "" },
                  { value: BlackjackPayout.EVEN_MONEY, label: "1:1", note: "" },
                ].map(({ value, label, note }) => (
                  <button
                    key={value}
                    onClick={() =>
                      setSettings({ ...settings, blackjackPayout: value })
                    }
                    style={{
                      backgroundColor:
                        settings.blackjackPayout === value
                          ? "#4A90E2"
                          : "rgba(255, 255, 255, 0.1)",
                      color:
                        settings.blackjackPayout === value
                          ? "#FFF"
                          : value === BlackjackPayout.SIX_TO_FIVE ||
                              value === BlackjackPayout.EVEN_MONEY
                            ? "#F44336"
                            : "#AAA",
                      border: "2px solid",
                      borderColor:
                        settings.blackjackPayout === value
                          ? "#FFF"
                          : "rgba(255, 255, 255, 0.2)",
                      borderRadius: "8px",
                      padding: "10px",
                      fontSize: "14px",
                      fontWeight:
                        settings.blackjackPayout === value ? "bold" : "normal",
                      cursor: "pointer",
                      transition: "all 0.2s ease",
                    }}
                  >
                    {label} {note}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Counting System */}
          <div style={{ marginBottom: "24px" }}>
            <h3
              style={{
                fontSize: "18px",
                fontWeight: "bold",
                color: "#FFF",
                marginBottom: "12px",
              }}
            >
              🧮 Counting System
            </h3>

            <div
              style={{ display: "flex", flexDirection: "column", gap: "8px" }}
            >
              {(
                Object.keys(COUNTING_SYSTEMS) as Array<
                  keyof typeof COUNTING_SYSTEMS
                >
              ).map((system) => (
                <button
                  key={system}
                  onClick={() =>
                    setSettings({
                      ...settings,
                      countingSystem: CountingSystem[system],
                    })
                  }
                  style={{
                    backgroundColor:
                      settings.countingSystem === system
                        ? "rgba(74, 144, 226, 0.3)"
                        : "rgba(255, 255, 255, 0.05)",
                    color: "#FFF",
                    border: "2px solid",
                    borderColor:
                      settings.countingSystem === system
                        ? "#4A90E2"
                        : "rgba(255, 255, 255, 0.1)",
                    borderRadius: "12px",
                    padding: "12px",
                    textAlign: "left",
                    cursor: "pointer",
                    transition: "all 0.2s ease",
                  }}
                  onMouseEnter={(e) => {
                    if (settings.countingSystem !== system) {
                      e.currentTarget.style.backgroundColor =
                        "rgba(255, 255, 255, 0.1)";
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (settings.countingSystem !== system) {
                      e.currentTarget.style.backgroundColor =
                        "rgba(255, 255, 255, 0.05)";
                    }
                  }}
                >
                  <div
                    style={{
                      fontSize: "14px",
                      fontWeight: "bold",
                      marginBottom: "4px",
                    }}
                  >
                    {COUNTING_SYSTEMS[system].name}
                  </div>
                  <div
                    style={{
                      fontSize: "12px",
                      color: "#AAA",
                      marginBottom: "4px",
                    }}
                  >
                    {COUNTING_SYSTEMS[system].description}
                  </div>
                  <div
                    style={{
                      fontSize: "11px",
                      color: "#666",
                      fontFamily: "monospace",
                    }}
                  >
                    {COUNTING_SYSTEMS[system].values}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Training Mode */}
          <div style={{ marginBottom: "32px" }}>
            <h3
              style={{
                fontSize: "18px",
                fontWeight: "bold",
                color: "#FFF",
                marginBottom: "12px",
              }}
            >
              🎯 Training Mode
            </h3>

            <div style={{ display: "flex", gap: "8px" }}>
              {[
                { value: TrainingMode.PRACTICE, label: "Practice" },
                { value: TrainingMode.TEST, label: "Test" },
                { value: TrainingMode.TIMED_CHALLENGE, label: "Timed" },
              ].map(({ value, label }) => (
                <button
                  key={value}
                  onClick={() =>
                    setSettings({ ...settings, trainingMode: value })
                  }
                  style={{
                    backgroundColor:
                      settings.trainingMode === value
                        ? "#4A90E2"
                        : "rgba(255, 255, 255, 0.1)",
                    color: settings.trainingMode === value ? "#FFF" : "#AAA",
                    border: "2px solid",
                    borderColor:
                      settings.trainingMode === value
                        ? "#FFF"
                        : "rgba(255, 255, 255, 0.2)",
                    borderRadius: "8px",
                    padding: "10px 16px",
                    fontSize: "13px",
                    fontWeight:
                      settings.trainingMode === value ? "bold" : "normal",
                    cursor: "pointer",
                    transition: "all 0.2s ease",
                    flex: 1,
                  }}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div style={{ display: "flex", gap: "12px" }}>
            <button
              onClick={handleSave}
              style={{
                flex: 1,
                backgroundColor: "#4CAF50",
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
                e.currentTarget.style.backgroundColor = "#45a049";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = "#4CAF50";
              }}
            >
              💾 Save Settings
            </button>
            <button
              onClick={onClose}
              style={{
                flex: 1,
                backgroundColor: "rgba(255, 255, 255, 0.1)",
                color: "#FFF",
                border: "2px solid rgba(255, 255, 255, 0.3)",
                borderRadius: "12px",
                padding: "14px",
                fontSize: "16px",
                fontWeight: "bold",
                cursor: "pointer",
                transition: "all 0.2s ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor =
                  "rgba(255, 255, 255, 0.2)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor =
                  "rgba(255, 255, 255, 0.1)";
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
