"use client";

import { useState } from "react";

export interface LeaderboardEntry {
  rank: number;
  username: string;
  value: number;
  patreonTier?: string;
}

interface LeaderboardProps {
  category: "current-chips" | "peak-chips" | "longest-streak" | "high-score";
  entries: LeaderboardEntry[];
  currentUserRank?: number;
  currentUserValue?: number;
}

const CATEGORY_LABELS = {
  "current-chips": "Total Chips Currently",
  "peak-chips": "Total Chips Reached (Peak)",
  "longest-streak": "Longest Streak",
  "high-score": "High Score",
};

const CATEGORY_DESCRIPTIONS = {
  "current-chips": "Current chip balance",
  "peak-chips": "Highest chip count ever achieved",
  "longest-streak": "Longest consecutive correct decisions",
  "high-score": "Highest score achieved (exponential scoring)",
};

const TIER_COLORS = {
  BRONZE: "#CD7F32",
  SILVER: "#C0C0C0",
  GOLD: "#FFD700",
  PLATINUM: "#E5E4E2",
};

export default function Leaderboard({
  category,
  entries,
  currentUserRank,
  currentUserValue,
}: LeaderboardProps) {
  const formatValue = (value: number): string => {
    if (category === "current-chips" || category === "peak-chips") {
      return `${value.toLocaleString()} chips`;
    }
    if (category === "longest-streak") {
      return `${value.toLocaleString()} decisions`;
    }
    // high-score
    return `${value.toLocaleString()} pts`;
  };

  const getRankColor = (rank: number): string => {
    if (rank === 1) return "#FFD700"; // Gold
    if (rank === 2) return "#C0C0C0"; // Silver
    if (rank === 3) return "#CD7F32"; // Bronze
    return "#4A90E2"; // Blue for others
  };

  const getRankIcon = (rank: number): string => {
    if (rank === 1) return "🥇";
    if (rank === 2) return "🥈";
    if (rank === 3) return "🥉";
    return `#${rank}`;
  };

  return (
    <div
      style={{
        backgroundColor: "rgba(0, 0, 0, 0.9)",
        border: "3px solid #4A90E2",
        borderRadius: "16px",
        padding: "24px",
        maxWidth: "600px",
        margin: "0 auto",
        boxShadow: "0 8px 24px rgba(0, 0, 0, 0.8)",
      }}
    >
      {/* Header */}
      <div style={{ marginBottom: "24px" }}>
        <h2
          style={{
            fontSize: "24px",
            fontWeight: "bold",
            color: "#FFF",
            marginBottom: "8px",
            textAlign: "center",
          }}
        >
          {CATEGORY_LABELS[category]}
        </h2>
        <p
          style={{
            fontSize: "13px",
            color: "#AAA",
            textAlign: "center",
            fontStyle: "italic",
          }}
        >
          {CATEGORY_DESCRIPTIONS[category]}
        </p>
      </div>

      {/* Leaderboard entries */}
      <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
        {entries.length === 0 ? (
          <div
            style={{
              textAlign: "center",
              padding: "40px 20px",
              color: "#999",
              fontSize: "14px",
            }}
          >
            No entries yet. Be the first!
          </div>
        ) : (
          entries.map((entry) => (
            <div
              key={entry.rank}
              style={{
                backgroundColor: "rgba(255, 255, 255, 0.05)",
                border: "2px solid rgba(255, 255, 255, 0.1)",
                borderRadius: "12px",
                padding: "16px",
                display: "flex",
                alignItems: "center",
                gap: "16px",
                transition: "all 0.2s ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor =
                  "rgba(74, 144, 226, 0.15)";
                e.currentTarget.style.borderColor = "#4A90E2";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor =
                  "rgba(255, 255, 255, 0.05)";
                e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.1)";
              }}
            >
              {/* Rank */}
              <div
                style={{
                  fontSize: "20px",
                  fontWeight: "bold",
                  color: getRankColor(entry.rank),
                  minWidth: "50px",
                  textAlign: "center",
                }}
              >
                {getRankIcon(entry.rank)}
              </div>

              {/* Username */}
              <div style={{ flex: 1 }}>
                <div
                  style={{
                    fontSize: "16px",
                    fontWeight: "bold",
                    color: "#FFF",
                    marginBottom: "4px",
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                  }}
                >
                  {entry.username}
                  {entry.patreonTier && entry.patreonTier !== "NONE" && (
                    <span
                      style={{
                        fontSize: "11px",
                        fontWeight: "bold",
                        color:
                          TIER_COLORS[
                            entry.patreonTier as keyof typeof TIER_COLORS
                          ] || "#AAA",
                        backgroundColor: "rgba(0, 0, 0, 0.5)",
                        padding: "2px 8px",
                        borderRadius: "6px",
                        border: `1px solid ${TIER_COLORS[entry.patreonTier as keyof typeof TIER_COLORS] || "#AAA"}`,
                      }}
                    >
                      {entry.patreonTier}
                    </span>
                  )}
                </div>
              </div>

              {/* Value */}
              <div
                style={{
                  fontSize: "16px",
                  fontWeight: "bold",
                  color: "#4CAF50",
                  textAlign: "right",
                }}
              >
                {formatValue(entry.value)}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Current user's rank (if not in top entries) */}
      {currentUserRank && currentUserRank > entries.length && (
        <div
          style={{
            marginTop: "24px",
            paddingTop: "24px",
            borderTop: "2px solid rgba(255, 255, 255, 0.1)",
          }}
        >
          <div
            style={{
              backgroundColor: "rgba(74, 144, 226, 0.2)",
              border: "2px solid #4A90E2",
              borderRadius: "12px",
              padding: "16px",
              display: "flex",
              alignItems: "center",
              gap: "16px",
            }}
          >
            <div
              style={{
                fontSize: "16px",
                fontWeight: "bold",
                color: "#4A90E2",
                minWidth: "50px",
                textAlign: "center",
              }}
            >
              #{currentUserRank}
            </div>
            <div style={{ flex: 1 }}>
              <div
                style={{
                  fontSize: "16px",
                  fontWeight: "bold",
                  color: "#FFF",
                }}
              >
                You
              </div>
            </div>
            <div
              style={{
                fontSize: "16px",
                fontWeight: "bold",
                color: "#4CAF50",
                textAlign: "right",
              }}
            >
              {formatValue(currentUserValue || 0)}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
