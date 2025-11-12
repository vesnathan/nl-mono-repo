import React from "react";
import { getDealerAvatarPath } from "@/data/dealerCharacters";
import TurnIndicator from "@/components/TurnIndicator";
import PlayingCard from "@/components/PlayingCard";
import { useGameState } from "@/contexts/GameStateContext";
import { useUIState } from "@/contexts/UIStateContext";

export default function DealerSection() {
  const { currentDealer, dealerCallout, phase, dealerHand, dealerRevealed } =
    useGameState();
  const { setShowDealerInfo } = useUIState();
  return (
    <div
      style={{
        position: "absolute",
        top: "3%", // Moved up from 8% (approximately 50px higher on typical screens)
        left: "50%",
        transform: "translateX(-50%)",
        textAlign: "center",
        zIndex: 100,
        pointerEvents: "auto",
      }}
    >
      {/* Dealer Avatar - Clickable with Turn Indicator */}
      {currentDealer && (
        <div
          style={{
            position: "relative",
            width: "150px",
            height: "150px",
            margin: "0 auto 12px",
          }}
        >
          {/* Turn Indicator - active during DEALER_TURN phase */}
          <TurnIndicator isActive={phase === "DEALER_TURN"} />

          {/* Dealer Callout - appears below avatar */}
          {dealerCallout && (
            <div
              style={{
                position: "absolute",
                top: "calc(100% + 10px)",
                left: "50%",
                transform: "translateX(-50%)",
                backgroundColor: "rgba(0, 0, 0, 0.9)",
                border: "2px solid #FFD700",
                borderRadius: "8px",
                padding: "10px 20px",
                color: "#FFD700",
                fontSize: "18px",
                fontWeight: "bold",
                textAlign: "center",
                zIndex: 2000,
                boxShadow: "0 4px 16px rgba(255, 215, 0, 0.5)",
                whiteSpace: "nowrap",
                animation: "fadeInScale 0.3s ease-out",
              }}
            >
              {dealerCallout}
            </div>
          )}

          <div
            onClick={() => setShowDealerInfo(true)}
            style={{
              width: "150px",
              height: "150px",
              borderRadius: "50%",
              border: "4px solid #FFD700",
              overflow: "hidden",
              backgroundColor: "#333",
              cursor: "pointer",
              transition: "all 0.3s ease",
              position: "relative",
              zIndex: 100,
              pointerEvents: "auto",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "scale(1.05)";
              e.currentTarget.style.boxShadow =
                "0 0 20px rgba(255, 215, 0, 0.6)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "scale(1)";
              e.currentTarget.style.boxShadow = "none";
            }}
          >
            <img
              src={getDealerAvatarPath(currentDealer)}
              alt={currentDealer.name}
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
              }}
              onError={(e) => {
                e.currentTarget.style.display = "none";
                const parent = e.currentTarget.parentElement;
                if (parent) {
                  parent.innerHTML =
                    '<div style="display:flex;align-items:center;justify-content:center;height:100%;font-size:60px;color:#FFD700">D</div>';
                }
              }}
            />
          </div>
        </div>
      )}
      {/* Dealer Cards - Fixed height container */}
      <div
        style={{
          minHeight: "110px",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "flex-end",
        }}
      >
        {dealerHand.cards.length > 0 && (
          <div
            style={{
              position: "relative",
              width: "370px",
              height: "98px",
              marginBottom: "4px",
              // Debug: Add visible border to see container
              // border: "2px solid red",
            }}
          >
            {dealerHand.cards.map((card, idx) => (
              <div
                key={idx}
                style={{
                  position: "absolute",
                  left: `${idx * 74}px`, // 70px card + 4px gap
                  top: 0,
                  width: "70px",
                  height: "98px",
                  zIndex: 10,
                }}
              >
                <PlayingCard
                  card={card}
                  faceDown={!dealerRevealed && idx === 1}
                />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
