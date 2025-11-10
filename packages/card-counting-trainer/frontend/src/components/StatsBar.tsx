import { useState } from "react";
import { GameSettings } from "@/types/gameSettings";
import { useAuth } from "@/contexts/AuthContext";
import { AuthModal } from "@/components/auth/AuthModal";
import { signOut } from "aws-amplify/auth";

interface StatsBarProps {
  gameSettings: GameSettings;
  runningCount: number;
  currentStreak: number;
  playerChips: number;
  currentScore: number;
  scoreMultiplier: number;
  onSettingsClick: () => void;
  onLeaderboardClick: () => void;
  onStrategyClick: () => void;
  onChartsClick: () => void;
}

export default function StatsBar({
  gameSettings,
  runningCount,
  currentStreak,
  playerChips,
  currentScore,
  scoreMultiplier,
  onSettingsClick,
  onLeaderboardClick,
  onStrategyClick,
  onChartsClick,
}: StatsBarProps) {
  const [showAuthModal, setShowAuthModal] = useState(false);
  const { isAuthenticated, isLoading, user, refresh } = useAuth();

  const handleLogout = async () => {
    await signOut();
    await refresh();
  };

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100%",
        height: "60px",
        backgroundColor: "transparent",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "0 20px",
        zIndex: 1000,
      }}
    >
      <div className="flex gap-3 items-center">
        <div
          style={{
            backgroundColor: "rgba(0, 0, 0, 0.8)",
            color: "#FFF",
            border: "2px solid #FFD700",
            borderRadius: "8px",
            padding: "6px 12px",
            fontSize: "14px",
            fontWeight: "bold",
            width: "150px",
            textAlign: "center",
          }}
        >
          COUNT:{" "}
          <span style={{ color: "#FFD700" }}>
            {runningCount >= 0 ? `+${runningCount}` : runningCount}
          </span>
        </div>
        <div
          style={{
            backgroundColor: "rgba(0, 0, 0, 0.8)",
            color: "#4CAF50",
            border: "2px solid #4CAF50",
            borderRadius: "8px",
            padding: "6px 12px",
            fontSize: "14px",
            fontWeight: "bold",
            width: "150px",
            textAlign: "center",
          }}
        >
          STREAK:{" "}
          <span style={{ color: "#FFF" }}>
            {currentStreak > 0 ? `🔥 ${currentStreak}` : currentStreak}
          </span>
        </div>
        <div
          style={{
            backgroundColor: "rgba(0, 0, 0, 0.8)",
            color: "#2196F3",
            border: "2px solid #2196F3",
            borderRadius: "8px",
            padding: "6px 12px",
            fontSize: "14px",
            fontWeight: "bold",
            width: "150px",
            textAlign: "center",
          }}
        >
          CHIPS:{" "}
          <span style={{ color: "#FFD700" }}>
            ${playerChips.toLocaleString()}
          </span>
        </div>
        <div
          style={{
            backgroundColor: "rgba(0, 0, 0, 0.8)",
            color: "#9C27B0",
            border: "2px solid #9C27B0",
            borderRadius: "8px",
            padding: "6px 12px",
            fontSize: "14px",
            fontWeight: "bold",
            width: "150px",
            textAlign: "center",
          }}
        >
          SCORE:{" "}
          <span style={{ color: "#FFF" }}>
            {currentScore.toLocaleString()}
          </span>
        </div>
      </div>
      <div className="flex gap-4 items-center">
        <button
          onClick={onSettingsClick}
          style={{
            backgroundColor: "rgba(0, 0, 0, 0.8)",
            color: "#FFF",
            border: "2px solid #FFD700",
            borderRadius: "8px",
            padding: "8px 16px",
            fontSize: "14px",
            fontWeight: "bold",
            cursor: "pointer",
            transition: "all 0.2s",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = "rgba(255, 215, 0, 0.3)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = "rgba(0, 0, 0, 0.8)";
          }}
        >
          ⚙️ Settings
        </button>
        <button
          onClick={onLeaderboardClick}
          style={{
            backgroundColor: "rgba(0, 0, 0, 0.8)",
            color: "#FFF",
            border: "2px solid #FFD700",
            borderRadius: "8px",
            padding: "8px 16px",
            fontSize: "14px",
            fontWeight: "bold",
            cursor: "pointer",
            transition: "all 0.2s",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = "rgba(255, 215, 0, 0.3)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = "rgba(0, 0, 0, 0.8)";
          }}
        >
          🏆 Leaderboard
        </button>
        <button
          onClick={onStrategyClick}
          style={{
            backgroundColor: "rgba(0, 0, 0, 0.8)",
            color: "#FFF",
            border: "2px solid #FFD700",
            borderRadius: "8px",
            padding: "8px 16px",
            fontSize: "14px",
            fontWeight: "bold",
            cursor: "pointer",
            transition: "all 0.2s",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = "rgba(255, 215, 0, 0.3)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = "rgba(0, 0, 0, 0.8)";
          }}
        >
          📊 Strategy
        </button>
        <button
          onClick={onChartsClick}
          style={{
            backgroundColor: "rgba(0, 0, 0, 0.8)",
            color: "#FFF",
            border: "2px solid #FFD700",
            borderRadius: "8px",
            padding: "8px 16px",
            fontSize: "14px",
            fontWeight: "bold",
            cursor: "pointer",
            transition: "all 0.2s",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = "rgba(255, 215, 0, 0.3)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = "rgba(0, 0, 0, 0.8)";
          }}
        >
          📈 Charts
        </button>
        {!isLoading &&
          (isAuthenticated ? (
            <button
              onClick={handleLogout}
              style={{
                backgroundColor: "rgba(0, 0, 0, 0.8)",
                color: "#FFF",
                border: "2px solid #FFD700",
                borderRadius: "8px",
                padding: "8px 16px",
                fontSize: "14px",
                fontWeight: "bold",
                cursor: "pointer",
                transition: "all 0.2s",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = "rgba(255, 215, 0, 0.3)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = "rgba(0, 0, 0, 0.8)";
              }}
            >
              👤 {user?.username || "Logout"}
            </button>
          ) : (
            <button
              onClick={() => setShowAuthModal(true)}
              style={{
                backgroundColor: "rgba(0, 0, 0, 0.8)",
                color: "#FFF",
                border: "2px solid #FFD700",
                borderRadius: "8px",
                padding: "8px 16px",
                fontSize: "14px",
                fontWeight: "bold",
                cursor: "pointer",
                transition: "all 0.2s",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = "rgba(255, 215, 0, 0.3)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = "rgba(0, 0, 0, 0.8)";
              }}
            >
              🔑 Login / Register
            </button>
          ))}
      </div>
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        onAuthSuccess={refresh}
      />
    </div>
  );
}
