"use client";

interface CountPeekConfirmationProps {
  isOpen: boolean;
  currentMultiplier: number;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function CountPeekConfirmation({
  isOpen,
  currentMultiplier,
  onConfirm,
  onCancel,
}: CountPeekConfirmationProps) {
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
          zIndex: 1001,
        }}
        onClick={onCancel}
        onKeyDown={(e) => {
          if (e.key === "Escape") onCancel();
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
          border: "3px solid #F59E0B",
          borderRadius: "16px",
          padding: "32px",
          maxWidth: "450px",
          width: "90%",
          boxShadow: "0 8px 32px rgba(0, 0, 0, 0.9)",
          zIndex: 1002,
        }}
      >
        {/* Warning Icon */}
        <div
          style={{
            textAlign: "center",
            fontSize: "64px",
            marginBottom: "16px",
          }}
        >
          ⚠️
        </div>

        {/* Header */}
        <h2
          style={{
            fontSize: "24px",
            fontWeight: "bold",
            color: "#F59E0B",
            textAlign: "center",
            marginBottom: "16px",
          }}
        >
          Peek at Count?
        </h2>

        {/* Warning Message */}
        <div
          style={{
            color: "#FFF",
            fontSize: "16px",
            textAlign: "center",
            marginBottom: "24px",
            lineHeight: 1.5,
          }}
        >
          This will reveal the running count and true count, but will{" "}
          <span style={{ color: "#EF4444", fontWeight: "bold" }}>
            reset your score multiplier
          </span>{" "}
          from{" "}
          <span style={{ color: "#10B981", fontWeight: "bold" }}>
            {currentMultiplier.toFixed(1)}x
          </span>{" "}
          to <span style={{ color: "#EF4444", fontWeight: "bold" }}>1.0x</span>.
        </div>

        <div
          style={{
            padding: "16px",
            backgroundColor: "rgba(239, 68, 68, 0.2)",
            border: "1px solid #EF4444",
            borderRadius: "8px",
            color: "#FFF",
            fontSize: "14px",
            textAlign: "center",
            marginBottom: "24px",
          }}
        >
          You cannot recover your multiplier for the rest of this shoe.
        </div>

        {/* Buttons */}
        <div
          style={{
            display: "flex",
            gap: "12px",
          }}
        >
          <button
            type="button"
            onClick={onCancel}
            style={{
              flex: 1,
              padding: "12px",
              backgroundColor: "#2a2a2a",
              color: "#FFF",
              border: "2px solid #666",
              borderRadius: "8px",
              fontSize: "16px",
              fontWeight: "bold",
              cursor: "pointer",
            }}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            style={{
              flex: 1,
              padding: "12px",
              backgroundColor: "#EF4444",
              color: "#FFF",
              border: "none",
              borderRadius: "8px",
              fontSize: "16px",
              fontWeight: "bold",
              cursor: "pointer",
            }}
          >
            Yes, Show Count
          </button>
        </div>
      </div>
    </>
  );
}
