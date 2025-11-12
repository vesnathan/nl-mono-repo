import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { AuthModal } from "@/components/auth/AuthModal";
import { signOut } from "aws-amplify/auth";
import { useGameState } from "@/contexts/GameStateContext";
import { useUIState } from "@/contexts/UIStateContext";

export default function StatsBar() {
  const {
    runningCount,
    currentStreak,
    playerChips,
    currentScore,
    scoreMultiplier,
  } = useGameState();
  const {
    setShowSettings,
    setShowAdminSettings,
    setShowLeaderboard,
    setShowStrategyCard,
    setShowHeatMap,
    setShowCountPeek,
  } = useUIState();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const { isAuthenticated, isLoading, isAdmin, refresh } = useAuth();

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
            // eslint-disable-next-line sonarjs/no-duplicate-string
            backgroundColor: "rgba(0, 0, 0, 0.8)",
            color: "#FFF",
            // eslint-disable-next-line sonarjs/no-duplicate-string
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
          <span style={{ color: "#FFF" }}>{currentScore.toLocaleString()}</span>
        </div>
        {/* Show Count Button */}
        <button
          type="button"
          onClick={() => setShowCountPeek(true)}
          title={
            scoreMultiplier > 1.0
              ? "Peek at count (resets score multiplier to 1.0x)"
              : "Peek at count"
          }
          style={{
            backgroundColor: "rgba(0, 0, 0, 0.8)",
            color: "#FFF",
            border:
              scoreMultiplier > 1.0 ? "2px solid #F59E0B" : "2px solid #4A90E2",
            borderRadius: "8px",
            padding: "6px 12px",
            fontSize: "14px",
            fontWeight: "bold",
            cursor: "pointer",
            transition: "all 0.2s",
            boxShadow:
              scoreMultiplier > 1.0
                ? "0 0 10px rgba(245, 158, 11, 0.5)"
                : "none",
          }}
          onMouseEnter={(e) => {
            if (scoreMultiplier > 1.0) {
              e.currentTarget.style.backgroundColor = "rgba(245, 158, 11, 0.3)";
            } else {
              e.currentTarget.style.backgroundColor = "rgba(74, 144, 226, 0.3)";
            }
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = "rgba(0, 0, 0, 0.8)";
          }}
        >
          👁️ Show Count
        </button>
      </div>
      <div className="flex gap-4 items-center">
        {isAuthenticated && (
          <button
            type="button"
            onClick={() => setShowSettings(true)}
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
              // eslint-disable-next-line sonarjs/no-duplicate-string
              e.currentTarget.style.backgroundColor = "rgba(255, 215, 0, 0.3)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = "rgba(0, 0, 0, 0.8)";
            }}
          >
            ⚙️ Settings
          </button>
        )}
        {isAdmin && (
          <button
            type="button"
            onClick={() => setShowAdminSettings(true)}
            style={{
              backgroundColor: "rgba(0, 0, 0, 0.8)",
              color: "#FFF",
              border: "2px solid #9C27B0",
              borderRadius: "8px",
              padding: "8px 16px",
              fontSize: "14px",
              fontWeight: "bold",
              cursor: "pointer",
              transition: "all 0.2s",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = "rgba(156, 39, 176, 0.3)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = "rgba(0, 0, 0, 0.8)";
            }}
          >
            🎛️ Admin
          </button>
        )}
        <button
          type="button"
          onClick={() => setShowLeaderboard(true)}
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
          type="button"
          onClick={() => setShowStrategyCard(true)}
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
          type="button"
          onClick={() => setShowHeatMap(true)}
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
              type="button"
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
                e.currentTarget.style.backgroundColor =
                  "rgba(255, 215, 0, 0.3)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = "rgba(0, 0, 0, 0.8)";
              }}
            >
              🚪 Logout
            </button>
          ) : (
            <button
              type="button"
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
                e.currentTarget.style.backgroundColor =
                  "rgba(255, 215, 0, 0.3)";
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
