"use client";

interface CountPeekModalProps {
  isOpen: boolean;
  runningCount: number;
  trueCount: number;
  decksRemaining: number;
  onClose: () => void;
}

export default function CountPeekModal({
  isOpen,
  runningCount,
  trueCount,
  decksRemaining,
  onClose,
}: CountPeekModalProps) {
  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop overlay */}
      <div
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: "rgba(0, 0, 0, 0.7)",
          zIndex: 1000,
        }}
        onClick={onClose}
        onKeyDown={(e) => {
          if (e.key === "Escape") onClose();
        }}
        role="button"
        tabIndex={0}
        aria-label="Close dialog"
      />
      {/* Modal */}
      <div
        role="dialog"
        style={{
          position: "fixed",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          backgroundColor: "#1a1a1a",
          border: "3px solid #4A90E2",
          borderRadius: "16px",
          padding: "32px",
          maxWidth: "400px",
          width: "90%",
          boxShadow: "0 8px 32px rgba(0, 0, 0, 0.9)",
          zIndex: 1001,
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
          <h2
            style={{
              fontSize: "24px",
              fontWeight: "bold",
              color: "#4A90E2",
            }}
          >
            👁️ Count Revealed
          </h2>
          <button
            type="button"
            onClick={onClose}
            style={{
              background: "none",
              border: "none",
              color: "#AAA",
              fontSize: "24px",
              cursor: "pointer",
              padding: "0",
              lineHeight: 1,
            }}
          >
            ×
          </button>
        </div>

        {/* Count Display */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "20px",
          }}
        >
          {/* Running Count */}
          <div
            style={{
              backgroundColor: "#2a2a2a",
              borderRadius: "8px",
              padding: "16px",
              textAlign: "center",
            }}
          >
            <div
              style={{
                fontSize: "14px",
                color: "#AAA",
                marginBottom: "8px",
              }}
            >
              Running Count
            </div>
            <div
              style={{
                fontSize: "48px",
                fontWeight: "bold",
                color:
                  runningCount > 0
                    ? "#10B981"
                    : runningCount < 0
                      ? "#EF4444"
                      : "#FFF",
              }}
            >
              {runningCount > 0 ? "+" : ""}
              {runningCount}
            </div>
          </div>

          {/* True Count */}
          <div
            style={{
              backgroundColor: "#2a2a2a",
              borderRadius: "8px",
              padding: "16px",
              textAlign: "center",
            }}
          >
            <div
              style={{
                fontSize: "14px",
                color: "#AAA",
                marginBottom: "8px",
              }}
            >
              True Count
            </div>
            <div
              style={{
                fontSize: "48px",
                fontWeight: "bold",
                color:
                  trueCount > 0
                    ? "#10B981"
                    : trueCount < 0
                      ? "#EF4444"
                      : "#FFF",
              }}
            >
              {trueCount > 0 ? "+" : ""}
              {trueCount.toFixed(1)}
            </div>
          </div>

          {/* Decks Remaining */}
          <div
            style={{
              backgroundColor: "#2a2a2a",
              borderRadius: "8px",
              padding: "16px",
              textAlign: "center",
            }}
          >
            <div
              style={{
                fontSize: "14px",
                color: "#AAA",
                marginBottom: "8px",
              }}
            >
              Decks Remaining
            </div>
            <div
              style={{
                fontSize: "32px",
                fontWeight: "bold",
                color: "#FFF",
              }}
            >
              {decksRemaining.toFixed(1)}
            </div>
          </div>
        </div>

        {/* Warning Message */}
        <div
          style={{
            marginTop: "24px",
            padding: "12px",
            backgroundColor: "rgba(239, 68, 68, 0.2)",
            border: "1px solid #EF4444",
            borderRadius: "8px",
            color: "#FFF",
            fontSize: "14px",
            textAlign: "center",
          }}
        >
          ⚠️ Your score multiplier has been reset to 1.0x
        </div>

        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          style={{
            width: "100%",
            marginTop: "24px",
            padding: "12px",
            backgroundColor: "#4A90E2",
            color: "#FFF",
            border: "none",
            borderRadius: "8px",
            fontSize: "16px",
            fontWeight: "bold",
            cursor: "pointer",
          }}
        >
          Close
        </button>
      </div>
    </>
  );
}
