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
      {/* Debug Log Button - shows when logs exist and hand is finished */}
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
            onClick={() => onShowDebugLog(true)}
            style={{
              backgroundColor: "#FFD700",
              color: "#000",
              border: "none",
              borderRadius: "8px",
              padding: "12px 24px",
              fontSize: "16px",
              fontWeight: "bold",
              cursor: "pointer",
              boxShadow: "0 4px 8px rgba(0, 0, 0, 0.3)",
            }}
          >
            📋 View Debug Log ({debugLogs.length} entries)
          </button>
        </div>
      )}

      {/* Debug Log Modal */}
      {showDebugLog && (
        <>
          <div
            onClick={() => onShowDebugLog(false)}
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: "rgba(0, 0, 0, 0.75)",
              zIndex: 10001,
            }}
          />

          <div
            style={{
              position: "fixed",
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              width: "90%",
              maxWidth: "900px",
              maxHeight: "80vh",
              backgroundColor: "#1a1a1a",
              borderRadius: "16px",
              padding: "24px",
              zIndex: 10002,
              border: "2px solid #FFD700",
            }}
          >
            <div
              style={{
                marginBottom: "20px",
                borderBottom: "2px solid #333",
                paddingBottom: "12px",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <h2
                  style={{
                    fontSize: "24px",
                    fontWeight: "bold",
                    color: "#FFD700",
                    margin: 0,
                  }}
                >
                  Debug Log ({debugLogs.length} entries)
                </h2>
                <button
                  onClick={() => onShowDebugLog(false)}
                  style={{
                    backgroundColor: "transparent",
                    color: "#AAA",
                    border: "none",
                    fontSize: "28px",
                    cursor: "pointer",
                    padding: "0 8px",
                  }}
                >
                  &times;
                </button>
              </div>
            </div>

            <div
              style={{
                maxHeight: "calc(80vh - 180px)",
                overflowY: "auto",
                backgroundColor: "#000",
                padding: "16px",
                borderRadius: "8px",
                fontFamily: "monospace",
                fontSize: "13px",
                color: "#0F0",
              }}
            >
              {debugLogs.map((log, idx) => (
                <div key={idx} style={{ marginBottom: "4px" }}>
                  {log}
                </div>
              ))}
            </div>

            <div
              style={{
                marginTop: "20px",
                display: "flex",
                gap: "12px",
                justifyContent: "center",
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
                  padding: "12px 32px",
                  fontSize: "16px",
                  fontWeight: "bold",
                  cursor: "pointer",
                }}
              >
                Copy Logs
              </button>
              <button
                onClick={onClearDebugLogs}
                style={{
                  backgroundColor: "#EF4444",
                  color: "#FFF",
                  border: "none",
                  borderRadius: "8px",
                  padding: "12px 32px",
                  fontSize: "16px",
                  fontWeight: "bold",
                  cursor: "pointer",
                }}
              >
                Clear Log & Continue
              </button>
              <button
                onClick={() => onShowDebugLog(false)}
                style={{
                  backgroundColor: "#6B7280",
                  color: "#FFF",
                  border: "none",
                  borderRadius: "8px",
                  padding: "12px 32px",
                  fontSize: "16px",
                  fontWeight: "bold",
                  cursor: "pointer",
                }}
              >
                Close
              </button>
            </div>
          </div>
        </>
      )}
    </>
  );
}
