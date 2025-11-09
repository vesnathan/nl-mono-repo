"use client";

import { useState } from "react";
import Leaderboard, { LeaderboardEntry } from "./Leaderboard";

interface LeaderboardModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentChips: number;
  peakChips: number;
  longestStreak: number;
  currentScore: number;
}

export default function LeaderboardModal({
  isOpen,
  onClose,
  currentChips,
  peakChips,
  longestStreak,
  currentScore,
}: LeaderboardModalProps) {
  const [selectedCategory, setSelectedCategory] = useState<
    "current-chips" | "peak-chips" | "longest-streak" | "high-score"
  >("high-score");

  if (!isOpen) return null;

  // Mock data - in production, fetch from DynamoDB
  const mockData: Record<string, LeaderboardEntry[]> = {
    "current-chips": [
      {
        rank: 1,
        username: "CardShark87",
        value: 125000,
        patreonTier: "PLATINUM",
      },
      { rank: 2, username: "BlackjackPro", value: 98500, patreonTier: "GOLD" },
      { rank: 3, username: "CountMaster", value: 76200, patreonTier: "SILVER" },
      { rank: 4, username: "LuckyPlayer", value: 54300, patreonTier: "BRONZE" },
      { rank: 5, username: "NewbieCounting", value: 42100 },
    ],
    "peak-chips": [
      { rank: 1, username: "ChipKing", value: 250000, patreonTier: "PLATINUM" },
      {
        rank: 2,
        username: "CardShark87",
        value: 187000,
        patreonTier: "PLATINUM",
      },
      { rank: 3, username: "VegasVet", value: 165000, patreonTier: "GOLD" },
      {
        rank: 4,
        username: "CountMaster",
        value: 142000,
        patreonTier: "SILVER",
      },
      { rank: 5, username: "HighRoller", value: 128000, patreonTier: "GOLD" },
    ],
    "longest-streak": [
      { rank: 1, username: "PerfectPlay", value: 847, patreonTier: "PLATINUM" },
      { rank: 2, username: "StrategyKing", value: 623, patreonTier: "GOLD" },
      { rank: 3, username: "CardShark87", value: 512, patreonTier: "PLATINUM" },
      { rank: 4, username: "AccuracyAce", value: 489, patreonTier: "SILVER" },
      {
        rank: 5,
        username: "ConsistentCarl",
        value: 376,
        patreonTier: "BRONZE",
      },
    ],
    "high-score": [
      {
        rank: 1,
        username: "ScoreChampion",
        value: 10485750,
        patreonTier: "PLATINUM",
      },
      { rank: 2, username: "PointMaster", value: 5242870, patreonTier: "GOLD" },
      {
        rank: 3,
        username: "CardShark87",
        value: 2621430,
        patreonTier: "PLATINUM",
      },
      {
        rank: 4,
        username: "HighScorer",
        value: 1310710,
        patreonTier: "SILVER",
      },
      { rank: 5, username: "TopPlayer", value: 655350, patreonTier: "GOLD" },
    ],
  };

  const categories = [
    { id: "high-score" as const, label: "High Score", icon: "🏆" },
    { id: "current-chips" as const, label: "Current Chips", icon: "💰" },
    { id: "peak-chips" as const, label: "Peak Chips", icon: "📈" },
    { id: "longest-streak" as const, label: "Longest Streak", icon: "🔥" },
  ];

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
          maxWidth: "800px",
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
          {/* Header with close button */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "24px",
            }}
          >
            <h2
              style={{
                fontSize: "32px",
                fontWeight: "bold",
                color: "#FFF",
              }}
            >
              🏆 Leaderboards
            </h2>
            <button
              onClick={onClose}
              style={{
                backgroundColor: "transparent",
                color: "#FFF",
                border: "2px solid rgba(255, 255, 255, 0.3)",
                borderRadius: "8px",
                padding: "8px 16px",
                fontSize: "18px",
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

          {/* Your stats summary */}
          <div
            style={{
              backgroundColor: "rgba(74, 144, 226, 0.1)",
              border: "2px solid #4A90E2",
              borderRadius: "12px",
              padding: "16px",
              marginBottom: "24px",
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
              gap: "16px",
            }}
          >
            <div style={{ textAlign: "center" }}>
              <div
                style={{ fontSize: "12px", color: "#AAA", marginBottom: "4px" }}
              >
                Current Chips
              </div>
              <div
                style={{
                  fontSize: "20px",
                  fontWeight: "bold",
                  color: "#4CAF50",
                }}
              >
                {currentChips.toLocaleString()}
              </div>
            </div>
            <div style={{ textAlign: "center" }}>
              <div
                style={{ fontSize: "12px", color: "#AAA", marginBottom: "4px" }}
              >
                Peak Chips
              </div>
              <div
                style={{
                  fontSize: "20px",
                  fontWeight: "bold",
                  color: "#FFD700",
                }}
              >
                {peakChips.toLocaleString()}
              </div>
            </div>
            <div style={{ textAlign: "center" }}>
              <div
                style={{ fontSize: "12px", color: "#AAA", marginBottom: "4px" }}
              >
                Longest Streak
              </div>
              <div
                style={{
                  fontSize: "20px",
                  fontWeight: "bold",
                  color: "#FF6B6B",
                }}
              >
                {longestStreak}
              </div>
            </div>
            <div style={{ textAlign: "center" }}>
              <div
                style={{ fontSize: "12px", color: "#AAA", marginBottom: "4px" }}
              >
                High Score
              </div>
              <div
                style={{
                  fontSize: "20px",
                  fontWeight: "bold",
                  color: "#9B59B6",
                }}
              >
                {currentScore.toLocaleString()}
              </div>
            </div>
          </div>

          {/* Category tabs */}
          <div style={{ marginBottom: "24px" }}>
            <div
              style={{
                display: "flex",
                gap: "8px",
                justifyContent: "center",
                flexWrap: "wrap",
              }}
            >
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  style={{
                    backgroundColor:
                      selectedCategory === cat.id
                        ? "#4A90E2"
                        : "rgba(255, 255, 255, 0.1)",
                    color: selectedCategory === cat.id ? "#FFF" : "#AAA",
                    border: "2px solid",
                    borderColor:
                      selectedCategory === cat.id
                        ? "#FFF"
                        : "rgba(255, 255, 255, 0.2)",
                    borderRadius: "10px",
                    padding: "10px 20px",
                    fontSize: "14px",
                    fontWeight: selectedCategory === cat.id ? "bold" : "normal",
                    cursor: "pointer",
                    transition: "all 0.2s ease",
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                  }}
                  onMouseEnter={(e) => {
                    if (selectedCategory !== cat.id) {
                      e.currentTarget.style.backgroundColor =
                        "rgba(74, 144, 226, 0.2)";
                      e.currentTarget.style.borderColor = "#4A90E2";
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (selectedCategory !== cat.id) {
                      e.currentTarget.style.backgroundColor =
                        "rgba(255, 255, 255, 0.1)";
                      e.currentTarget.style.borderColor =
                        "rgba(255, 255, 255, 0.2)";
                    }
                  }}
                >
                  <span>{cat.icon}</span>
                  <span>{cat.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Leaderboard display */}
          <Leaderboard
            category={selectedCategory}
            entries={mockData[selectedCategory]}
            currentUserRank={undefined} // Will be set when user data is loaded
            currentUserValue={undefined}
          />
        </div>
      </div>
    </>
  );
}
