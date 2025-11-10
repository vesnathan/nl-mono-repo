import React from "react";
import { GamePhase } from "@/types/gameState";

interface DebugLogModalProps {
  debugLogs: string[];
  phase: GamePhase;
  showDebugLog: boolean;
  onShowDebugLog: (show: boolean) => void;
  onClearDebugLogs: () => void;
}

export default function DebugLogModal({
  debugLogs,
  phase,
  showDebugLog,
  onShowDebugLog,
  onClearDebugLogs,
}: DebugLogModalProps) {
  return (
    <>
      {/* Debug Action Button - shows when logs exist and hand is finished */}
      {debugLogs.length > 0 && phase === "ROUND_END" && (
        <div
          style={{
            position: "fixed",
            bottom: "20px",
            left: "50%",
            transform: "translateX(-50%)",
            zIndex: 10000,
          }}
        >
          <button
            onClick={() => {
              navigator.clipboard.writeText(debugLogs.join("\n"));
            }}
            style={{
              backgroundColor: "#3B82F6",
              color: "#FFF",
              border: "none",
              borderRadius: "8px",
              padding: "12px 24px",
              fontSize: "16px",
              fontWeight: "bold",
              cursor: "pointer",
              boxShadow: "0 4px 8px rgba(0, 0, 0, 0.3)",
            }}
          >
            📋 Copy Log ({debugLogs.length} lines)
          </button>
        </div>
      )}
    </>
  );
}
