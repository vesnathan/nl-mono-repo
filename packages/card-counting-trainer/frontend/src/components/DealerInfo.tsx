"use client";

import { DealerCharacter } from "@/data/dealerCharacters";
import { useState, useEffect } from "react";

interface DealerInfoProps {
  dealer: DealerCharacter;
  onClose?: () => void;
  openAsModal?: boolean; // If true, opens directly as modal instead of badge
  registerTimeout: (callback: () => void, delay: number) => NodeJS.Timeout;
}

export default function DealerInfo({
  dealer,
  onClose,
  openAsModal = false,
  registerTimeout,
}: DealerInfoProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [showModal, setShowModal] = useState(openAsModal);

  // Fade in animation
  useEffect(() => {
    registerTimeout(() => setIsVisible(true), 50);
  }, [registerTimeout]);

  const handleClose = () => {
    setIsVisible(false);
    registerTimeout(() => {
      setShowModal(false);
      onClose?.();
    }, 300);
  };

  // If modal not open, show as a badge
  if (!showModal) {
    return (
      <div
        role="button"
        tabIndex={0}
        onClick={() => setShowModal(true)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            setShowModal(true);
          }
        }}
        style={{
          backgroundColor: "#1a1a1a",
          border: "2px solid #FFD700",
          borderRadius: "8px",
          padding: "8px 16px",
          cursor: "pointer",
          transition: "all 0.2s ease",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = "#2a2a2a";
          e.currentTarget.style.transform = "scale(1.05)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = "#1a1a1a";
          e.currentTarget.style.transform = "scale(1)";
        }}
      >
        <div style={{ fontSize: "14px", fontWeight: "bold", color: "#FFD700" }}>
          {dealer.name}
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Backdrop */}
      <div
        role="button"
        tabIndex={0}
        onClick={handleClose}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            handleClose();
          }
        }}
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: "rgba(0, 0, 0, 0.7)",
          zIndex: 10000,
          opacity: isVisible ? 1 : 0,
          transition: "opacity 0.3s ease",
        }}
      />

      {/* Info card */}
      <div
        style={{
          position: "fixed",
          top: "50%",
          left: "50%",
          transform: `translate(-50%, -50%) scale(${isVisible ? 1 : 0.9})`,
          zIndex: 10001,
          width: "500px",
          maxWidth: "90vw",
          backgroundColor: "#1a1a1a",
          border: "3px solid #FFD700",
          borderRadius: "16px",
          padding: "24px",
          boxShadow: "0 12px 40px rgba(0, 0, 0, 0.9)",
          opacity: isVisible ? 1 : 0,
          transition: "all 0.3s ease",
        }}
      >
        {/* Close button */}
        <button
          type="button"
          onClick={handleClose}
          style={{
            position: "absolute",
            top: "12px",
            right: "12px",
            background: "none",
            border: "none",
            color: "#999",
            fontSize: "24px",
            cursor: "pointer",
            padding: "4px 8px",
            lineHeight: 1,
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = "#FFF";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = "#999";
          }}
        >
          ×
        </button>

        {/* Dealer name and nickname */}
        <div style={{ marginBottom: "16px" }}>
          <div
            style={{
              fontSize: "24px",
              fontWeight: "bold",
              color: "#FFD700",
              marginBottom: "4px",
            }}
          >
            {dealer.name}
          </div>
          <div
            style={{
              fontSize: "16px",
              color: "#AAA",
              fontStyle: "italic",
            }}
          >
            &quot;{dealer.nickname}&quot;
          </div>
        </div>

        {/* Avatar placeholder */}
        {dealer.avatar && (
          <div
            style={{
              width: "100%",
              height: "200px",
              backgroundColor: "#2a2a2a",
              borderRadius: "12px",
              marginBottom: "16px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              backgroundImage: `url(${dealer.avatar})`,
              backgroundSize: "cover",
              backgroundPosition: "center",
            }}
          >
            {!dealer.avatar && (
              <div style={{ color: "#666", fontSize: "14px" }}>
                Avatar Coming Soon
              </div>
            )}
          </div>
        )}

        {/* Bio */}
        <div
          style={{
            fontSize: "15px",
            color: "#DDD",
            lineHeight: "1.6",
            marginBottom: "16px",
            padding: "16px",
            backgroundColor: "rgba(255, 215, 0, 0.1)",
            borderRadius: "8px",
            borderLeft: "4px solid #FFD700",
          }}
        >
          {dealer.bio}
        </div>

        {/* Personality traits */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "12px",
          }}
        >
          <div
            style={{
              backgroundColor: "#2a2a2a",
              padding: "12px",
              borderRadius: "8px",
            }}
          >
            <div
              style={{
                fontSize: "11px",
                color: "#888",
                marginBottom: "4px",
                textTransform: "uppercase",
                fontWeight: "bold",
              }}
            >
              Personality
            </div>
            <div
              style={{
                fontSize: "14px",
                color: "#FFD700",
                fontWeight: "bold",
                textTransform: "capitalize",
              }}
            >
              {dealer.personality}
            </div>
          </div>

          <div
            style={{
              backgroundColor: "#2a2a2a",
              padding: "12px",
              borderRadius: "8px",
            }}
          >
            <div
              style={{
                fontSize: "11px",
                color: "#888",
                marginBottom: "4px",
                textTransform: "uppercase",
                fontWeight: "bold",
              }}
            >
              Deal Speed
            </div>
            <div
              style={{
                fontSize: "14px",
                color: "#FFD700",
                fontWeight: "bold",
              }}
            >
              {dealer.dealSpeed < 1
                ? "Slow"
                : dealer.dealSpeed > 1.2
                  ? "Fast"
                  : "Normal"}
            </div>
          </div>

          <div
            style={{
              backgroundColor: "#2a2a2a",
              padding: "12px",
              borderRadius: "8px",
            }}
          >
            <div
              style={{
                fontSize: "11px",
                color: "#888",
                marginBottom: "4px",
                textTransform: "uppercase",
                fontWeight: "bold",
              }}
            >
              Attitude
            </div>
            <div
              style={{
                fontSize: "14px",
                color: dealer.onYourSide ? "#4CAF50" : "#F44336",
                fontWeight: "bold",
              }}
            >
              {dealer.onYourSide ? "Friendly" : "By the book"}
            </div>
          </div>

          <div
            style={{
              backgroundColor: "#2a2a2a",
              padding: "12px",
              borderRadius: "8px",
            }}
          >
            <div
              style={{
                fontSize: "11px",
                color: "#888",
                marginBottom: "4px",
                textTransform: "uppercase",
                fontWeight: "bold",
              }}
            >
              Vigilance
            </div>
            <div
              style={{
                fontSize: "14px",
                color:
                  dealer.detectionSkill < 30
                    ? "#4CAF50"
                    : dealer.detectionSkill < 70
                      ? "#FFC107"
                      : "#F44336",
                fontWeight: "bold",
              }}
            >
              {dealer.detectionSkill < 30
                ? "Low"
                : dealer.detectionSkill < 70
                  ? "Moderate"
                  : "High"}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
